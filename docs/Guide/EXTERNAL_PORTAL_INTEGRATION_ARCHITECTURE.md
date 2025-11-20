# External Portal Integration Architecture
**Multi-Employment ATS System - Shared Database Model**

---

## Overview

The External Candidate Portal and Internal ATS share a **unified Azure PostgreSQL database**. This document explains the shared database architecture, stage ownership boundaries, and integration patterns.

---

## System Architecture

### Shared Database Model

```
┌──────────────────────────────────────────────────────────────┐
│                  Azure PostgreSQL Database                   │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Tables: candidates, jobs, job_pipeline_stages,        │  │
│  │  candidate_documents, candidate_communications,        │  │
│  │  candidate_stage_history, linkedin_sync_status         │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌─────────────────────┐       ┌──────────────────────────┐ │
│  │  External Portal    │       │    Internal ATS          │ │
│  │  Direct DB Access   │       │    Direct DB Access      │ │
│  └─────────────────────┘       └──────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

**Key Characteristics:**
- **Single Source of Truth**: One PostgreSQL database for all candidate and job data
- **Direct Database Access**: Both systems connect directly to the database using connection strings
- **No API Layer Required**: Portal can directly read/write to database tables (REST API available as optional alternative)
- **Shared Schema**: Both systems use identical table structures and relationships

---

## Stage Ownership & Handoff

### Pipeline Stage Boundaries

```
┌─────────────────────────────────────────────────────────────────┐
│                    COMPLETE HIRING PIPELINE                     │
└─────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────┐  ┌──────────────────────────┐
│   EXTERNAL PORTAL OWNERSHIP        │  │  INTERNAL ATS OWNERSHIP  │
│   (Stages 1-3)                     │  │  (Stages 4-6+)           │
├────────────────────────────────────┤  ├──────────────────────────┤
│                                    │  │                          │
│  1. Screening                      │  │  4. [Custom Stages]      │
│     └─ Initial candidate review    │  │     └─ Assessment        │
│        Resume parsing              │  │     └─ Coding Round      │
│        Auto-screening              │  │     └─ Interview 1       │
│                                    │  │     └─ Interview 2       │
│  2. Shortlist                      │  │     └─ ... (unlimited)   │
│     └─ Qualified candidates        │  │                          │
│        Portal recruiter review     │  │  5. Offer                │
│        Phone screening             │  │     └─ Offer generation  │
│                                    │  │        Salary negotiation│
│  3. Client Endorsement             │  │                          │
│     └─ HANDOFF POINT ───────────────────▶ 6. Offer Accepted      │
│        Final portal approval       │  │     └─ Hired status      │
│        Ready for client review     │  │        Onboarding        │
│                                    │  │                          │
└────────────────────────────────────┘  └──────────────────────────┘
```

### Handoff Protocol

**Stage 3: Client Endorsement** is the critical handoff point:

- **External Portal** advances candidates to Client Endorsement when they complete portal-side screening
- **Internal ATS** picks up candidates at Client Endorsement for client review and remaining stages
- Both systems can view/read all stages, but modify only their owned stages

---

## Database Schema & Access Patterns

### Core Tables

#### 1. `candidates` Table
**Shared by Both Systems**

```sql
CREATE TABLE candidates (
  id SERIAL PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  current_stage VARCHAR(100) NOT NULL,
  source VARCHAR(50) NOT NULL,  -- 'portal' for external portal submissions
  status VARCHAR(50) DEFAULT 'active',
  resume_url TEXT,
  external_portal_id VARCHAR(255),  -- Portal's internal candidate ID
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(job_id, email)  -- One application per job
);
```

**Access Patterns:**
- **External Portal**: 
  - INSERT new candidates with `source='portal'`
  - UPDATE candidates in Screening/Shortlist/Client Endorsement stages
  - SELECT candidates with `source='portal'` or `current_stage IN ('Screening', 'Shortlist', 'Client Endorsement')`
- **Internal ATS**:
  - SELECT all candidates (full view)
  - UPDATE candidates at Client Endorsement onwards
  - Cannot modify portal-owned fields like `external_portal_id`

#### 2. `candidate_stage_history` Table
**Complete Audit Trail**

```sql
CREATE TABLE candidate_stage_history (
  id SERIAL PRIMARY KEY,
  candidate_id INTEGER NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  previous_stage VARCHAR(100),
  new_stage VARCHAR(100) NOT NULL,
  changed_by_user_id VARCHAR(255),  -- Portal user ID or ATS user ID
  notes TEXT,
  changed_at TIMESTAMP DEFAULT NOW()
);
```

**Access Patterns:**
- **External Portal**: INSERT audit records when advancing candidates through portal stages
- **Internal ATS**: INSERT audit records for ATS-managed stage transitions
- Both systems: SELECT for viewing full candidate journey

#### 3. `jobs` Table
**Shared Job Repository**

```sql
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_title VARCHAR(255) NOT NULL,
  employment_type VARCHAR(50) NOT NULL,  -- 'contract', 'partTime', 'fullTime', 'eor'
  status VARCHAR(50) DEFAULT 'active',
  created_by_role VARCHAR(50),  -- 'recruiter', 'client_admin', 'client_hr'
  -- ... 40+ additional fields
);
```

**Access Patterns:**
- **External Portal**: SELECT active jobs to display on portal, link candidates
- **Internal ATS**: Full CRUD operations on jobs

#### 4. `job_pipeline_stages` Table
**Stage Configuration**

```sql
CREATE TABLE job_pipeline_stages (
  id SERIAL PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  stage_name VARCHAR(100) NOT NULL,
  stage_order INTEGER NOT NULL,
  is_custom BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Default Pipeline** (created automatically for every job):
```
1. Screening (fixed, cannot remove)
2. Shortlist (fixed, cannot remove)
3. Client Endorsement (fixed, cannot remove)
4. [Custom stages...] (unlimited, draggable)
5. Offer (fixed, cannot remove)
6. Offer Accepted (fixed, cannot remove)
```

---

## Integration Methods

### Option 1: Direct Database Connection (Recommended)

**Advantages:**
- No API latency
- Full transaction control
- Direct SQL queries for complex filters
- Real-time data access

**Connection Setup:**
```javascript
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.PGHOST,
  port: process.env.PGPORT || 5432,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  ssl: {
    rejectUnauthorized: true
  }
});

// Example: Insert candidate
const result = await pool.query(`
  INSERT INTO candidates (
    job_id, first_name, last_name, email, phone, 
    current_stage, source, status, resume_url, external_portal_id
  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
  RETURNING *
`, [
  jobId, 'John', 'Doe', 'john@example.com', '+1-555-0100',
  'Screening', 'portal', 'active', 'https://...resume.pdf', 'portal-cand-123'
]);

// Example: Advance candidate stage with audit trail
await pool.query('BEGIN');
try {
  // Update current stage
  await pool.query(`
    UPDATE candidates 
    SET current_stage = $1, updated_at = NOW() 
    WHERE id = $2
  `, ['Shortlist', candidateId]);
  
  // Log to audit trail
  await pool.query(`
    INSERT INTO candidate_stage_history 
    (candidate_id, previous_stage, new_stage, changed_by_user_id, notes)
    VALUES ($1, $2, $3, $4, $5)
  `, [candidateId, 'Screening', 'Shortlist', 'portal-user-456', 'Qualified candidate']);
  
  await pool.query('COMMIT');
} catch (error) {
  await pool.query('ROLLBACK');
  throw error;
}
```

**Best Practices:**
- Always use parameterized queries (prevent SQL injection)
- Wrap stage transitions in transactions
- Always log to `candidate_stage_history` when updating `current_stage`
- Respect stage ownership boundaries (don't modify ATS-owned stages)

---

### Option 2: REST API (Alternative)

For portals that prefer API-based integration, a REST API is available at `/api/portal/*`.

**See**: `docs/EXTERNAL_PORTAL_API.md` for complete REST API documentation.

**Key Endpoints:**
- `POST /api/portal/candidates` - Submit candidate
- `PUT /api/portal/candidates/:id/advance` - Advance stage
- `GET /api/portal/jobs/:jobId/candidates` - List candidates
- `GET /api/portal/candidates/:id` - Get candidate details
- `PUT /api/portal/candidates/:id` - Update candidate

**When to Use REST API:**
- Portal runs on different infrastructure (no direct DB access)
- Additional security layer required
- Rate limiting needed
- Prefer HTTP-based integrations over database drivers

---

## Data Flow Examples

### 1. Candidate Submission Flow

```
External Portal                     Database                      Internal ATS
─────────────────                   ────────                      ────────────

[Apply Button Click]
       │
       ├─▶ INSERT INTO candidates
       │   (source='portal',
       │    current_stage='Screening')
       │                              │
       │                              ├─▶ [Real-time Dashboard]
       │                                  Sees new candidate
       │                                  in Screening stage
       ▼
[Candidate Profile Created]
```

### 2. Stage Advancement Flow

```
External Portal                     Database                      Internal ATS
─────────────────                   ────────                      ────────────

[Move to Shortlist]
       │
       ├─▶ BEGIN TRANSACTION
       │
       ├─▶ UPDATE candidates
       │   SET current_stage='Shortlist'
       │
       ├─▶ INSERT INTO candidate_stage_history
       │   (previous='Screening',
       │    new='Shortlist',
       │    changed_by='portal-user-123')
       │                              │
       │                              ├─▶ [Pipeline View Updates]
       ├─▶ COMMIT                     │   Candidate moves to
       │                              │   Shortlist column
       ▼
[Stage Updated]
```

### 3. Handoff to Internal ATS

```
External Portal                     Database                      Internal ATS
─────────────────                   ────────                      ────────────

[Endorse for Client]
       │
       ├─▶ UPDATE candidates
       │   SET current_stage='Client Endorsement'
       │
       ├─▶ INSERT INTO candidate_stage_history
       │                              │
       │                              ├─▶ [Alert/Notification]
       │                              │   "New candidate ready
       │                              │    for client review"
       │                              │
       │                              ├─▶ [ATS Takes Control]
       │                                  Client reviews candidate
       │                                  Advances to custom stages
       │                                  Manages offer process
       ▼
[Handoff Complete]
```

---

## Security & Access Control

### Database-Level Security

**Row-Level Security (RLS) Policies** *(Recommended for Production)*:

```sql
-- External Portal: Can only modify candidates in early stages
CREATE POLICY portal_candidate_access ON candidates
  FOR UPDATE
  USING (current_stage IN ('Screening', 'Shortlist', 'Client Endorsement'))
  WITH CHECK (current_stage IN ('Screening', 'Shortlist', 'Client Endorsement'));

-- Internal ATS: Full access
CREATE POLICY ats_full_access ON candidates
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Enable RLS
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
```

### Application-Level Security

**Portal Application Rules:**
1. Only INSERT candidates with `source='portal'`
2. Only UPDATE candidates where `current_stage IN ('Screening', 'Shortlist', 'Client Endorsement')`
3. Never modify:
   - `source` field (locked to 'portal')
   - `status` field (managed by ATS)
   - Candidates in stages beyond Client Endorsement

**ATS Application Rules:**
1. Can view all candidates regardless of source
2. Can only UPDATE candidates at Client Endorsement or later stages
3. Cannot modify `external_portal_id` field (portal-owned)

---

## Stage Transition Rules

### External Portal Allowed Transitions

```
Screening → Shortlist → Client Endorsement
```

**Valid Operations:**
```javascript
// ✅ ALLOWED: Portal advancing through owned stages
UPDATE candidates 
SET current_stage = 'Shortlist' 
WHERE id = 42 AND current_stage = 'Screening';

UPDATE candidates 
SET current_stage = 'Client Endorsement' 
WHERE id = 42 AND current_stage = 'Shortlist';
```

**Invalid Operations:**
```javascript
// ❌ DENIED: Portal cannot advance beyond Client Endorsement
UPDATE candidates 
SET current_stage = 'Interview 1' 
WHERE id = 42 AND current_stage = 'Client Endorsement';

// ❌ DENIED: Portal cannot modify ATS-stage candidates
UPDATE candidates 
SET current_stage = 'Offer' 
WHERE id = 42;
```

### Internal ATS Allowed Transitions

```
Client Endorsement → [Custom Stages] → Offer → Offer Accepted
```

**Also allowed:**
- Move candidates backward (e.g., Offer → Interview 1)
- Reject candidates at any stage (set `status='rejected'`)
- Move candidates to withdrawn (set `status='withdrawn'`)

---

## Common Integration Patterns

### Pattern 1: Portal Candidate Submission

```javascript
async function submitCandidateToATS(candidateData, jobId) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Insert candidate
    const candidateResult = await client.query(`
      INSERT INTO candidates (
        job_id, first_name, last_name, email, phone,
        current_stage, source, status, resume_url, external_portal_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id, current_stage
    `, [
      jobId,
      candidateData.firstName,
      candidateData.lastName,
      candidateData.email,
      candidateData.phone,
      'Screening',  // Always start at Screening
      'portal',     // Mark as portal-sourced
      'active',
      candidateData.resumeUrl,
      candidateData.portalId
    ]);
    
    const candidateId = candidateResult.rows[0].id;
    
    // Log initial stage in history
    await client.query(`
      INSERT INTO candidate_stage_history (
        candidate_id, previous_stage, new_stage, changed_by_user_id, notes
      ) VALUES ($1, NULL, $2, $3, $4)
    `, [
      candidateId,
      'Screening',
      candidateData.submittedBy,
      'Initial candidate submission from portal'
    ]);
    
    await client.query('COMMIT');
    return candidateId;
    
  } catch (error) {
    await client.query('ROLLBACK');
    
    // Handle duplicate email
    if (error.code === '23505') {  // Unique violation
      throw new Error('Candidate with this email already applied to this job');
    }
    throw error;
    
  } finally {
    client.release();
  }
}
```

### Pattern 2: Portal Stage Advancement

```javascript
async function advanceCandidateStage(candidateId, portalUserId, notes = null) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Get current stage
    const candidateResult = await client.query(
      'SELECT current_stage FROM candidates WHERE id = $1',
      [candidateId]
    );
    
    if (candidateResult.rows.length === 0) {
      throw new Error('Candidate not found');
    }
    
    const currentStage = candidateResult.rows[0].current_stage;
    
    // Determine next stage
    const stageMap = {
      'Screening': 'Shortlist',
      'Shortlist': 'Client Endorsement'
    };
    
    const nextStage = stageMap[currentStage];
    
    if (!nextStage) {
      throw new Error(`Cannot advance from ${currentStage}. Portal can only advance from Screening or Shortlist.`);
    }
    
    // Update stage
    await client.query(
      'UPDATE candidates SET current_stage = $1, updated_at = NOW() WHERE id = $2',
      [nextStage, candidateId]
    );
    
    // Log to history
    await client.query(`
      INSERT INTO candidate_stage_history (
        candidate_id, previous_stage, new_stage, changed_by_user_id, notes
      ) VALUES ($1, $2, $3, $4, $5)
    `, [
      candidateId,
      currentStage,
      nextStage,
      portalUserId,
      notes || `Advanced from ${currentStage} to ${nextStage}`
    ]);
    
    await client.query('COMMIT');
    return { previousStage: currentStage, newStage: nextStage };
    
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
```

### Pattern 3: Portal Dashboard Query

```javascript
async function getPortalDashboardStats(jobId) {
  const result = await pool.query(`
    SELECT 
      current_stage,
      COUNT(*) as count,
      COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as new_this_week
    FROM candidates
    WHERE 
      job_id = $1 
      AND source = 'portal'
      AND status = 'active'
      AND current_stage IN ('Screening', 'Shortlist', 'Client Endorsement')
    GROUP BY current_stage
    ORDER BY 
      CASE current_stage
        WHEN 'Screening' THEN 1
        WHEN 'Shortlist' THEN 2
        WHEN 'Client Endorsement' THEN 3
      END
  `, [jobId]);
  
  return {
    screening: result.rows.find(r => r.current_stage === 'Screening') || { count: 0, new_this_week: 0 },
    shortlist: result.rows.find(r => r.current_stage === 'Shortlist') || { count: 0, new_this_week: 0 },
    endorsed: result.rows.find(r => r.current_stage === 'Client Endorsement') || { count: 0, new_this_week: 0 }
  };
}
```

---

## Monitoring & Analytics

### Key Metrics to Track

**External Portal Metrics:**
- Candidates submitted per day/week/month
- Screening → Shortlist conversion rate
- Shortlist → Client Endorsement conversion rate
- Average time in each portal stage
- Portal user activity (submissions by user)

**Query Example:**
```sql
-- Portal funnel metrics
SELECT 
  COUNT(*) FILTER (WHERE current_stage = 'Screening') as in_screening,
  COUNT(*) FILTER (WHERE current_stage = 'Shortlist') as in_shortlist,
  COUNT(*) FILTER (WHERE current_stage = 'Client Endorsement') as endorsed,
  COUNT(*) FILTER (WHERE current_stage NOT IN ('Screening', 'Shortlist', 'Client Endorsement')) as handed_off_to_ats,
  ROUND(
    COUNT(*) FILTER (WHERE current_stage IN ('Shortlist', 'Client Endorsement'))::numeric / 
    NULLIF(COUNT(*)::numeric, 0) * 100, 
    2
  ) as screening_success_rate
FROM candidates
WHERE 
  source = 'portal' 
  AND created_at >= NOW() - INTERVAL '30 days';
```

---

## Error Handling & Data Integrity

### Duplicate Email Prevention

```javascript
// Already enforced at database level:
// UNIQUE(job_id, email)

// Application-level handling:
try {
  await submitCandidateToATS(candidateData, jobId);
} catch (error) {
  if (error.message.includes('already applied')) {
    // Show user-friendly error
    return {
      success: false,
      error: 'DUPLICATE_EMAIL',
      message: 'This candidate has already applied to this job'
    };
  }
  throw error;
}
```

### Stage History Integrity

**Always log stage changes:**
```javascript
// ❌ WRONG: Update stage without logging
await pool.query(
  'UPDATE candidates SET current_stage = $1 WHERE id = $2',
  [newStage, candidateId]
);

// ✅ CORRECT: Atomic update with history
await pool.query('BEGIN');
await pool.query(
  'UPDATE candidates SET current_stage = $1, updated_at = NOW() WHERE id = $2',
  [newStage, candidateId]
);
await pool.query(
  'INSERT INTO candidate_stage_history (candidate_id, previous_stage, new_stage, changed_by_user_id) VALUES ($1, $2, $3, $4)',
  [candidateId, oldStage, newStage, userId]
);
await pool.query('COMMIT');
```

---

## Deployment & Environment Setup

### Environment Variables

**External Portal**:
```bash
# Database connection
PGHOST=your-azure-postgres.postgres.database.azure.com
PGPORT=5432
PGDATABASE=ats_production
PGUSER=portal_user
PGPASSWORD=secure-password
PGSSLMODE=require

# Application config
PORTAL_APP_URL=https://portal.your-domain.com
PORTAL_USER_POOL=external_portal
```

**Internal ATS**:
```bash
# Database connection (same database)
PGHOST=your-azure-postgres.postgres.database.azure.com
PGPORT=5432
PGDATABASE=ats_production
PGUSER=ats_admin_user
PGPASSWORD=admin-secure-password
PGSSLMODE=require

# Application config
ATS_APP_URL=https://ats.your-domain.com
```

### Database User Permissions

**Portal User** (limited access):
```sql
-- Read access to jobs
GRANT SELECT ON jobs TO portal_user;
GRANT SELECT ON job_pipeline_stages TO portal_user;

-- Full access to candidates (with RLS policies)
GRANT SELECT, INSERT, UPDATE ON candidates TO portal_user;
GRANT USAGE, SELECT ON SEQUENCE candidates_id_seq TO portal_user;

-- Audit logging
GRANT INSERT ON candidate_stage_history TO portal_user;
GRANT USAGE, SELECT ON SEQUENCE candidate_stage_history_id_seq TO portal_user;

-- Documents and communications
GRANT SELECT, INSERT ON candidate_documents TO portal_user;
GRANT SELECT, INSERT ON candidate_communications TO portal_user;
```

**ATS User** (full access):
```sql
-- Full access to all tables
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ats_admin_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ats_admin_user;
```

---

## Migration from API-Only to Shared Database

If transitioning from REST API integration to direct database access:

### Step 1: Database Access Setup
```bash
# Request database credentials from ATS admin
# Set up SSL certificate for Azure PostgreSQL connection
# Test connection with read-only queries first
```

### Step 2: Gradual Migration
```javascript
// Phase 1: Read from database, write via API (validation)
const candidates = await pool.query('SELECT * FROM candidates WHERE job_id = $1', [jobId]);

// Phase 2: Read and write to database, API as fallback
try {
  await pool.query('INSERT INTO candidates ...');
} catch (error) {
  // Fallback to API
  await fetch('/api/portal/candidates', { ... });
}

// Phase 3: Full database access, remove API client
await pool.query('INSERT INTO candidates ...');
```

---

## Troubleshooting

### Issue: Portal cannot connect to database
**Solution**: Check Azure PostgreSQL firewall rules, verify SSL certificate, confirm credentials

### Issue: "Permission denied" when updating candidates
**Solution**: Verify Row-Level Security policies, check user permissions, ensure stage is within portal ownership

### Issue: Duplicate email error
**Solution**: Query existing candidates before submission:
```sql
SELECT id FROM candidates WHERE job_id = $1 AND email = $2
```

### Issue: Stage history not logging
**Solution**: Wrap all stage updates in transactions, always insert to `candidate_stage_history`

---

## Summary

| Aspect | External Portal | Internal ATS |
|--------|----------------|--------------|
| **Database Access** | Direct (shared database) | Direct (shared database) |
| **Stage Ownership** | Screening, Shortlist, Client Endorsement | Client Endorsement → Offer Accepted |
| **Candidate Source** | Creates `source='portal'` candidates | Views all candidates |
| **Integration Method** | Direct DB queries (or REST API optional) | Direct DB queries |
| **Handoff Point** | Advances to Client Endorsement | Picks up from Client Endorsement |
| **Permissions** | Limited UPDATE on early-stage candidates | Full CRUD on all candidates |

---

## Related Documentation

- **REST API Alternative**: `docs/EXTERNAL_PORTAL_API.md`
- **Database Schema**: `docs/DATABASE_SCHEMA_ANALYSIS.md`
- **Setup Guide**: `ats-app/server/create-candidates-tables.js`

---

**Last Updated**: November 17, 2025  
**Version**: 1.0
