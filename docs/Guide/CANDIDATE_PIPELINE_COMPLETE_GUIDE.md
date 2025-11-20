# Candidate Pipeline - Complete Architecture Guide
**Multi-Employment ATS System - Master Reference**

---

## Table of Contents
1. [Overview](#overview)
2. [Database Schema](#database-schema)
3. [Candidate Lifecycle Flow](#candidate-lifecycle-flow)
4. [Dynamic Stage Management](#dynamic-stage-management)
5. [External Portal Integration](#external-portal-integration)
6. [Stage Modifications (Rename/Delete)](#stage-modifications)
7. [Customizable Workflow Builder](#customizable-workflow-builder)
8. [API Reference](#api-reference)
9. [Code Examples](#code-examples)

---

## Overview

The ATS uses a **dynamic pipeline architecture** where each job can have customized hiring stages. Candidates progress through these stages, with complete audit trails and integration points for external portals.

### Key Architectural Principles

1. **Dynamic Pipelines**: Each job defines its own pipeline via `job_pipeline_stages` table
2. **Stage-Based Progression**: Candidates move through stages in sequential order
3. **Ownership Boundaries**: External Portal owns early stages (Screening → Client Endorsement), Internal ATS owns later stages
4. **Complete Audit Trail**: Every stage transition logged in `candidate_stage_history`
5. **String-Based Stage References**: Candidates store `current_stage` as VARCHAR (stage name)
6. **Enterprise Workflow Builder**: Clients can create customizable workflows with stage-level configurations

---

## Database Schema

### Core Tables Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    DATABASE ARCHITECTURE                    │
└─────────────────────────────────────────────────────────────┘

jobs (id: INTEGER)
  ├─→ job_pipeline_stages (defines custom pipeline per job)
  └─→ candidates (tracks applicants for this job)
        ├─→ candidate_documents (resumes, certificates)
        ├─→ candidate_communications (emails, calls)
        └─→ candidate_stage_history (audit trail of movements)
```

### 1. `jobs` Table

**Purpose**: Store job postings with employment type and status

```sql
CREATE TABLE jobs (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  employment_type VARCHAR(50) NOT NULL,  -- 'contract', 'partTime', 'fullTime', 'eor'
  status VARCHAR(50) DEFAULT 'draft',     -- 'draft', 'published', 'closed'
  created_by_role VARCHAR(50),            -- 'recruiter', 'client_admin', 'client_hr'
  approved_by_user_id VARCHAR(255),
  approved_at TIMESTAMP,
  published_at TIMESTAMP,
  linkedin_synced BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
  -- ... 40+ additional fields (location, salary, description, etc.)
);
```

**Key Fields**:
- `id`: Integer primary key (referenced by candidates and pipeline stages)
- `employment_type`: Determines default pipeline configuration
- `status`: Job lifecycle state
- `created_by_role`: Determines approval workflow (client jobs need approval, recruiter jobs auto-publish)

---

### 2. `job_pipeline_stages` Table

**Purpose**: Define customizable pipeline stages for each job

```sql
CREATE TABLE job_pipeline_stages (
  id SERIAL PRIMARY KEY,
  job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  stage_name VARCHAR(100) NOT NULL,
  stage_order INTEGER NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(job_id, stage_order)
);

CREATE INDEX idx_pipeline_job_id ON job_pipeline_stages(job_id);
```

**Default Pipeline Structure** (auto-created for every job):
```
1. Screening          (fixed, cannot remove)
2. Shortlist          (fixed, cannot remove)
3. Client Endorsement (fixed, cannot remove) ← HANDOFF POINT
4. [Custom Stages...] (unlimited, draggable)
5. Offer              (fixed, cannot remove)
6. Offer Accepted     (fixed, cannot remove)
```

**Key Constraints**:
- `stage_order`: Determines sequential progression (1, 2, 3, ...)
- `UNIQUE(job_id, stage_order)`: Each job has ordered stages without gaps
- **Fixed Stages**: Positions 1-3 and final 2 cannot be removed (business rules)
- **Custom Stages**: Inserted between positions 3 and final 2

**Example Custom Pipeline**:
```
Job A: Senior Engineer Position
  1. Screening
  2. Shortlist
  3. Client Endorsement
  4. Technical Assessment    ← Custom
  5. Coding Round            ← Custom
  6. Panel Interview         ← Custom
  7. Offer
  8. Offer Accepted

Job B: Junior Designer Position
  1. Screening
  2. Shortlist
  3. Client Endorsement
  4. Portfolio Review        ← Custom
  5. Design Challenge        ← Custom
  6. Offer
  7. Offer Accepted
```

---

### 3. `candidates` Table

**Purpose**: Store candidate applications with current stage tracking

```sql
CREATE TABLE candidates (
  id SERIAL PRIMARY KEY,
  job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  current_stage VARCHAR(100) NOT NULL,         -- String reference to stage name
  source VARCHAR(50) NOT NULL,                  -- 'portal', 'linkedin', 'direct', 'referral'
  status VARCHAR(50) DEFAULT 'active',          -- 'active', 'rejected', 'hired', 'withdrawn'
  resume_url TEXT,
  external_portal_id VARCHAR(255),              -- Portal's internal ID
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(job_id, email)                         -- One application per job per candidate
);

CREATE INDEX idx_candidates_job_id ON candidates(job_id);
CREATE INDEX idx_candidates_email ON candidates(email);
```

**Key Fields**:
- `current_stage`: VARCHAR storing **stage name** (e.g., "Screening", "Client Endorsement")
  - ⚠️ **Critical**: This is a string, not FK to `job_pipeline_stages.id`
  - Must exactly match `job_pipeline_stages.stage_name` for the job
  - If stage is renamed, candidates must be migrated
- `source`: Tracks origin (external portal, LinkedIn, direct application)
- `status`: Candidate lifecycle (active in pipeline vs final states)
- `UNIQUE(job_id, email)`: Same candidate can apply to multiple jobs

**Design Trade-off**:
- ✅ **Pro**: Easy to query and display (no JOINs needed)
- ❌ **Con**: Stage renames break references (requires migration)

---

### 4. `candidate_stage_history` Table

**Purpose**: Complete audit trail of all stage transitions

```sql
CREATE TABLE candidate_stage_history (
  id SERIAL PRIMARY KEY,
  candidate_id INTEGER NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  previous_stage VARCHAR(100),                  -- Null for initial stage
  new_stage VARCHAR(100) NOT NULL,
  changed_by_user_id VARCHAR(255),              -- Portal user ID or ATS user ID
  notes TEXT,
  changed_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_stage_history_candidate ON candidate_stage_history(candidate_id);
```

**Sample Data**:
```
| candidate_id | previous_stage     | new_stage          | changed_by         | changed_at          |
|--------------|--------------------|--------------------|--------------------|--------------------|
| 42           | NULL               | Screening          | portal-system      | 2025-11-17 10:00   |
| 42           | Screening          | Shortlist          | portal-user-123    | 2025-11-17 11:30   |
| 42           | Shortlist          | Client Endorsement | portal-user-123    | 2025-11-17 14:00   |
| 42           | Client Endorsement | Technical Test     | ats-recruiter-456  | 2025-11-17 16:45   |
| 42           | Technical Test     | Coding Round       | ats-recruiter-456  | 2025-11-18 09:00   |
```

**Key Uses**:
- Compliance audit trail
- Time-in-stage analytics
- Candidate journey visualization
- Rollback/undo functionality
- Performance metrics (conversion rates, bottlenecks)

---

### 5. Supporting Tables

#### `candidate_documents`
```sql
CREATE TABLE candidate_documents (
  id SERIAL PRIMARY KEY,
  candidate_id INTEGER NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL,    -- 'resume', 'cover_letter', 'certificate'
  file_name VARCHAR(255) NOT NULL,
  blob_url TEXT NOT NULL,                -- Azure Blob Storage URL
  file_size BIGINT,
  uploaded_at TIMESTAMP DEFAULT NOW()
);
```

#### `candidate_communications`
```sql
CREATE TABLE candidate_communications (
  id SERIAL PRIMARY KEY,
  candidate_id INTEGER NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  communication_type VARCHAR(50) NOT NULL,  -- 'email', 'call', 'message'
  subject VARCHAR(500),
  content TEXT,
  sent_by_user_id VARCHAR(255),
  sent_at TIMESTAMP DEFAULT NOW()
);
```

---

## Candidate Lifecycle Flow

### Stage Progression States

```
┌─────────────────────────────────────────────────────────────────────┐
│                    COMPLETE CANDIDATE JOURNEY                       │
└─────────────────────────────────────────────────────────────────────┘

APPLICATION SUBMITTED
        ↓
┌─────────────────────────────────────────────────────────────────────┐
│  EXTERNAL PORTAL OWNERSHIP (Stages 1-3)                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Stage 1: Screening                                                │
│    • Initial candidate review                                      │
│    • Resume parsing and validation                                 │
│    • Auto-screening filters                                        │
│    • Portal recruiter initial assessment                           │
│         ↓ (Portal advances)                                        │
│  Stage 2: Shortlist                                                │
│    • Qualified candidates pool                                     │
│    • Phone screening                                               │
│    • Basic skills assessment                                       │
│         ↓ (Portal advances)                                        │
│  Stage 3: Client Endorsement ← HANDOFF POINT                       │
│    • Final portal approval                                         │
│    • Ready for client review                                       │
│    • Cannot advance beyond this (portal boundary)                  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────────────┐
│  INTERNAL ATS OWNERSHIP (Stages 4-N)                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Stage 4-N: Custom Stages (unlimited)                              │
│    • Technical Assessment                                          │
│    • Coding Round                                                  │
│    • Interview 1                                                   │
│    • Interview 2                                                   │
│    • Panel Interview                                               │
│    • Final Interview                                               │
│    • Background Check                                              │
│    • ... (job-specific custom stages)                              │
│         ↓ (ATS advances)                                           │
│  Stage N-1: Offer                                                  │
│    • Offer generation and approval                                 │
│    • Salary negotiation                                            │
│    • Terms finalization                                            │
│         ↓ (Candidate accepts)                                      │
│  Stage N: Offer Accepted                                           │
│    • Final stage (hired)                                           │
│    • Trigger onboarding workflow                                   │
│    • Update status to 'hired'                                      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Status vs Stage

**`status` field** (final states):
- `active`: Currently in pipeline (any stage)
- `rejected`: Removed from consideration
- `hired`: Offer accepted (reached final stage)
- `withdrawn`: Candidate withdrew application

**`current_stage` field** (pipeline position):
- Only meaningful when `status = 'active'`
- Stores current position in job's pipeline
- Changes as candidate progresses

---

## Dynamic Stage Management

### How Dynamic Advancement Works

**Problem**: Each job has different custom stages. How do we determine "next stage"?

**Solution**: Query `job_pipeline_stages` to get the job-specific pipeline, then find next stage by `stage_order`.

### Algorithm: Advance Candidate to Next Stage

```javascript
// Pseudo-code for dynamic advancement
async function advanceCandidate(candidateId, userId, notes) {
  // 1. Get candidate's current stage and job_id
  const candidate = await query(
    'SELECT current_stage, job_id FROM candidates WHERE id = $1',
    [candidateId]
  );
  
  // 2. Get job's complete pipeline (ordered by stage_order)
  const pipeline = await query(
    'SELECT stage_name, stage_order FROM job_pipeline_stages WHERE job_id = $1 ORDER BY stage_order',
    [candidate.job_id]
  );
  
  // 3. Find current stage in pipeline
  const currentIndex = pipeline.findIndex(s => s.stage_name === candidate.current_stage);
  
  // 4. Check if already at final stage
  if (currentIndex === pipeline.length - 1) {
    throw new Error('Already at final stage');
  }
  
  // 5. Get next stage
  const nextStage = pipeline[currentIndex + 1].stage_name;
  
  // 6. Update candidate + log to history (in transaction)
  await query('BEGIN');
  await query(
    'UPDATE candidates SET current_stage = $1, updated_at = NOW() WHERE id = $2',
    [nextStage, candidateId]
  );
  await query(
    'INSERT INTO candidate_stage_history (candidate_id, previous_stage, new_stage, changed_by_user_id, notes) VALUES ($1, $2, $3, $4, $5)',
    [candidateId, candidate.current_stage, nextStage, userId, notes]
  );
  await query('COMMIT');
  
  return { previousStage: candidate.current_stage, newStage: nextStage };
}
```

### Example: Two Different Jobs

**Job ID 1** (Senior Engineer):
```sql
SELECT stage_name, stage_order FROM job_pipeline_stages WHERE job_id = 1 ORDER BY stage_order;
-- Results:
--  1 | Screening
--  2 | Shortlist
--  3 | Client Endorsement
--  4 | Technical Test
--  5 | Interview
--  6 | Offer
--  7 | Offer Accepted
```

**Job ID 2** (Junior Designer):
```sql
SELECT stage_name, stage_order FROM job_pipeline_stages WHERE job_id = 2 ORDER BY stage_order;
-- Results:
--  1 | Screening
--  2 | Shortlist
--  3 | Client Endorsement
--  4 | Portfolio Review
--  5 | Design Challenge
--  6 | Creative Interview
--  7 | Offer
--  8 | Offer Accepted
```

**Same Advancement Logic Works for Both**:
- Candidate in Job 1 at "Shortlist" → advances to "Client Endorsement"
- Candidate in Job 2 at "Shortlist" → advances to "Client Endorsement"
- Candidate in Job 1 at "Client Endorsement" → advances to "Technical Test"
- Candidate in Job 2 at "Client Endorsement" → advances to "Portfolio Review"

---

## External Portal Integration

### Shared Database Architecture

```
┌──────────────────────────────────────────────────────────────┐
│              Azure PostgreSQL Database (Shared)              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Tables: jobs, candidates, job_pipeline_stages,        │  │
│  │  candidate_documents, candidate_communications,        │  │
│  │  candidate_stage_history                               │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌─────────────────────┐       ┌──────────────────────────┐ │
│  │  External Portal    │       │    Internal ATS          │ │
│  │  Direct DB Access   │       │    Direct DB Access      │ │
│  │  (or REST API)      │       │                          │ │
│  └─────────────────────┘       └──────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

### Portal Integration Methods

#### **Method 1: Direct Database Connection** (Recommended)

```javascript
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,  // portal_user (limited permissions)
  password: process.env.PGPASSWORD,
  ssl: { rejectUnauthorized: true }
});

// Submit candidate from portal
async function portalSubmitCandidate(jobId, candidateData) {
  const result = await pool.query(
    `INSERT INTO candidates (
      job_id, first_name, last_name, email, phone,
      current_stage, source, status, resume_url, external_portal_id
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *`,
    [
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
    ]
  );
  
  // Log to audit trail
  await pool.query(
    `INSERT INTO candidate_stage_history (candidate_id, previous_stage, new_stage, changed_by_user_id)
     VALUES ($1, NULL, 'Screening', $2)`,
    [result.rows[0].id, 'portal-system']
  );
  
  return result.rows[0];
}
```

#### **Method 2: REST API** (Alternative)

```bash
# Submit candidate via API
POST /api/portal/candidates
Headers: X-API-Key: portal-secret-key
Body: {
  "jobId": "1",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+1-555-0100",
  "resumeUrl": "https://storage.azure.com/resumes/john-doe.pdf"
}

# Advance candidate to next stage
PUT /api/portal/candidates/42/advance
Body: {
  "notes": "Qualified candidate",
  "portalUserId": "portal-recruiter-123"
}
```

### Portal Stage Restrictions

**External Portal can only:**
- Submit candidates (auto-assigned to `Screening`)
- Advance: `Screening → Shortlist`
- Advance: `Shortlist → Client Endorsement`
- View candidates in Screening, Shortlist, Client Endorsement
- Update limited fields (phone, resumeUrl, externalPortalId)

**External Portal cannot:**
- Advance beyond `Client Endorsement`
- Modify candidates in ATS-owned stages
- Change candidate status (active/rejected/hired)
- Delete candidates
- Modify job pipeline configuration

**Enforcement**:
```javascript
// API validation
const PORTAL_STAGES = ['Screening', 'Shortlist', 'Client Endorsement'];

if (!PORTAL_STAGES.includes(currentStage)) {
  throw new Error('Portal cannot manage this stage');
}

if (currentStage === 'Client Endorsement') {
  throw new Error('Handoff point reached - Internal ATS takes over');
}
```

---

## Stage Modifications (Rename/Delete)

### Challenge: String-Based Stage References

Since `candidates.current_stage` stores stage names as strings, modifications have cascading effects.

### Scenario 1: Renaming a Stage

**Problem**:
```sql
-- Rename stage in pipeline
UPDATE job_pipeline_stages 
SET stage_name = 'Initial Review' 
WHERE job_id = 1 AND stage_name = 'Screening';

-- Now candidates are broken!
SELECT * FROM candidates WHERE job_id = 1 AND current_stage = 'Screening';
-- These candidates still reference "Screening" but the stage is now "Initial Review"
```

**Solution: Automatic Migration**:
```javascript
async function renameStage(jobId, oldStageName, newStageName) {
  await query('BEGIN');
  
  try {
    // 1. Update pipeline stage
    await query(
      'UPDATE job_pipeline_stages SET stage_name = $1 WHERE job_id = $2 AND stage_name = $3',
      [newStageName, jobId, oldStageName]
    );
    
    // 2. Migrate candidates in this stage
    await query(
      'UPDATE candidates SET current_stage = $1 WHERE job_id = $2 AND current_stage = $3',
      [newStageName, jobId, oldStageName]
    );
    
    // 3. Update audit trail (previous_stage column)
    await query(
      `UPDATE candidate_stage_history 
       SET previous_stage = $1 
       WHERE candidate_id IN (SELECT id FROM candidates WHERE job_id = $2) 
         AND previous_stage = $3`,
      [newStageName, jobId, oldStageName]
    );
    
    // 4. Update audit trail (new_stage column)
    await query(
      `UPDATE candidate_stage_history 
       SET new_stage = $1 
       WHERE candidate_id IN (SELECT id FROM candidates WHERE job_id = $2) 
         AND new_stage = $3`,
      [newStageName, jobId, oldStageName]
    );
    
    await query('COMMIT');
    
    console.log(`Renamed stage from "${oldStageName}" to "${newStageName}" for job ${jobId}`);
  } catch (error) {
    await query('ROLLBACK');
    throw error;
  }
}
```

### Scenario 2: Deleting a Stage

**Problem**: What happens to candidates currently in that stage?

**Solution: Prevent Deletion if Candidates Present**:
```javascript
async function deleteStage(jobId, stageName) {
  // 1. Check if stage has active candidates
  const result = await query(
    'SELECT COUNT(*) FROM candidates WHERE job_id = $1 AND current_stage = $2 AND status = $3',
    [jobId, stageName, 'active']
  );
  
  const candidateCount = parseInt(result.rows[0].count);
  
  if (candidateCount > 0) {
    throw new Error(
      `Cannot delete stage "${stageName}". ${candidateCount} active candidate(s) are currently in this stage. ` +
      `Please move them to another stage first.`
    );
  }
  
  // 2. Validate not deleting fixed stages
  const FIXED_STAGES = ['Screening', 'Shortlist', 'Client Endorsement', 'Offer', 'Offer Accepted'];
  if (FIXED_STAGES.includes(stageName)) {
    throw new Error(`Cannot delete fixed stage "${stageName}"`);
  }
  
  // 3. Delete stage
  await query(
    'DELETE FROM job_pipeline_stages WHERE job_id = $1 AND stage_name = $2',
    [jobId, stageName]
  );
  
  // 4. Reorder remaining stages to close gaps
  await reorderPipelineStages(jobId);
}
```

### UI Warning System

```javascript
// API endpoint to support warning UI
app.get('/api/jobs/:jobId/pipeline-stages/:stageId/candidate-count', async (req, res) => {
  const { jobId, stageId } = req.params;
  
  // Get stage name
  const stageResult = await query(
    'SELECT stage_name FROM job_pipeline_stages WHERE id = $1',
    [stageId]
  );
  
  if (stageResult.rows.length === 0) {
    return res.status(404).json({ error: 'Stage not found' });
  }
  
  const stageName = stageResult.rows[0].stage_name;
  
  // Count candidates in this stage
  const countResult = await query(
    'SELECT COUNT(*) FROM candidates WHERE job_id = $1 AND current_stage = $2 AND status = $3',
    [jobId, stageName, 'active']
  );
  
  res.json({
    stageName,
    candidateCount: parseInt(countResult.rows[0].count),
    canDelete: parseInt(countResult.rows[0].count) === 0
  });
});
```

**Frontend Warning Modal**:
```jsx
function StageModificationWarning({ stageName, candidateCount, action }) {
  return (
    <Modal>
      <h2>⚠️ Warning: {action} Stage</h2>
      <p>
        You are about to <strong>{action.toLowerCase()}</strong> the stage 
        "<strong>{stageName}</strong>".
      </p>
      
      {candidateCount > 0 && (
        <div className="warning-box">
          <AlertIcon />
          <p>
            <strong>{candidateCount}</strong> active candidate(s) are currently 
            in this stage.
          </p>
          
          {action === 'Delete' && (
            <p className="error">
              ❌ Cannot delete a stage with active candidates. 
              Please move them to another stage first.
            </p>
          )}
          
          {action === 'Rename' && (
            <p className="info">
              ✅ All candidates and audit history will be automatically updated 
              to use the new stage name.
            </p>
          )}
        </div>
      )}
      
      <div className="actions">
        <button onClick={onCancel}>Cancel</button>
        <button 
          onClick={onConfirm} 
          disabled={action === 'Delete' && candidateCount > 0}
        >
          {action === 'Rename' ? 'Rename Stage' : 'Delete Stage'}
        </button>
      </div>
    </Modal>
  );
}
```

---

## Customizable Workflow Builder

### Enterprise-Grade Job Request Workflows

The ATS allows clients to build **customizable workflows** where each stage can have granular configurations similar to enterprise platforms like Greenhouse and Workday.

### Concept Overview

Instead of simple stage names, each stage becomes a **mini-configuration block** with:

1. **Stage Info** (name, type, description)
2. **Interview/Assessment Settings** (AI/human, duration, platform)
3. **Automations** (triggers, actions, notifications)
4. **Approvals & Validation** (required inputs, scorecards)
5. **Visibility Rules** (who can see what)
6. **Integrations** (external tools, HRIS sync)

---

### Stage Types

Each stage can be one of the following types:

```
┌──────────────────────────────────────────────────────────────┐
│                       STAGE TYPES                            │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  1. AI Interview                                             │
│     • Video interview (AI-powered)                           │
│     • Text-based AI interview                                │
│     • Coding assessment (AI-evaluated)                       │
│                                                              │
│  2. TMF Interview                                            │
│     • TMF recruiter conducts interview                       │
│     • Internal screening call                                │
│     • Panel interview (multiple TMF interviewers)            │
│                                                              │
│  3. Client Interview                                         │
│     • Hiring manager interview                               │
│     • Team interview                                         │
│     • Executive interview                                    │
│                                                              │
│  4. Assessment                                               │
│     • Technical assessment (HackerRank, Codility, etc.)      │
│     • Personality test (criteria.com, etc.)                  │
│     • Skills test (typing, language proficiency)             │
│                                                              │
│  5. Approval                                                 │
│     • Budget approval                                        │
│     • Manager approval                                       │
│     • HR compliance approval                                 │
│                                                              │
│  6. Offer                                                    │
│     • Offer generation                                       │
│     • Salary negotiation                                     │
│     • Contract signing                                       │
│                                                              │
│  7. Custom Action                                            │
│     • Background check                                       │
│     • Reference check                                        │
│     • Document collection                                    │
│     • Drug test                                              │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

### Per-Stage Configuration Options

Each stage can be customized with the following settings:

#### **1. Stage Name & Type**

```json
{
  "stageName": "Technical Assessment",
  "stageType": "assessment",
  "description": "90-minute coding challenge evaluating algorithms and problem-solving"
}
```

---

#### **2. Actions / Tasks Required**

Define what must happen in this stage:

```json
{
  "requiredActions": [
    "schedule_interview",
    "send_coding_challenge",
    "collect_feedback",
    "complete_scorecard"
  ]
}
```

**Available Actions**:
- `schedule_interview` - Book interview slot
- `trigger_ai_interview` - Auto-start AI interview
- `send_coding_challenge` - Email assessment link
- `collect_documents` - Request documents from candidate
- `complete_budget_approval` - Await finance approval
- `conduct_panel_interview` - Multiple interviewers
- `internal_review_required` - TMF team review
- `add_feedback_notes` - Mandatory notes field

---

#### **3. Interview Configuration**

For interview-type stages:

```json
{
  "interviewConfig": {
    "mode": "ai_video",  // 'ai_video', 'ai_text', 'ai_coding', 'human_tmf', 'human_client'
    "duration": 60,      // minutes
    "platform": "zoom",  // 'zoom', 'teams', 'google_meet', 'internal'
    "interviewers": [
      { "id": "user-123", "name": "John Recruiter", "role": "tmf_recruiter" },
      { "id": "user-456", "name": "Jane Manager", "role": "client_manager" }
    ],
    "candidateInstructions": "Please join the Zoom call 5 minutes early. Have your ID ready.",
    "scorecardTemplate": "technical-interview-v2",
    "recordingEnabled": true,
    "autoScheduling": true,
    "calendarIntegration": true
  }
}
```

**Interview Modes**:
- `ai_video`: AI-powered video interview
- `ai_text`: Text-based AI chatbot interview
- `ai_coding`: AI-evaluated coding challenge
- `human_tmf`: TMF recruiter interview
- `human_client`: Client hiring manager interview

---

#### **4. Automations**

Every stage can have automation rules:

```json
{
  "automations": [
    {
      "trigger": "on_enter_stage",
      "action": "send_email",
      "template": "coding-challenge-invite",
      "recipient": "candidate"
    },
    {
      "trigger": "score_above",
      "threshold": 80,
      "action": "auto_advance",
      "targetStage": "Client Interview"
    },
    {
      "trigger": "score_below",
      "threshold": 60,
      "action": "auto_disqualify",
      "reason": "Failed technical assessment"
    },
    {
      "trigger": "time_in_stage",
      "duration": 48,  // hours
      "action": "send_reminder",
      "recipient": "interviewer"
    },
    {
      "trigger": "on_exit_stage",
      "action": "sync_to_hris",
      "hrisSystem": "workday"
    }
  ]
}
```

**Automation Triggers**:
- `on_enter_stage` - Candidate enters this stage
- `on_exit_stage` - Candidate leaves this stage
- `score_above` / `score_below` - Based on scorecard results
- `time_in_stage` - After X hours/days in stage
- `document_uploaded` - Candidate uploads required document
- `assessment_completed` - External assessment finished

**Automation Actions**:
- `send_email` - Email to candidate/interviewer/team
- `send_sms` - SMS notification
- `auto_advance` - Move to next stage
- `auto_disqualify` - Reject candidate
- `send_reminder` - Reminder notification
- `notify_team` - Alert ATS team
- `sync_to_hris` - Push data to HRIS
- `generate_offer` - Auto-create offer document

---

#### **5. Visibility Rules**

Control who can see this stage and its data:

```json
{
  "visibility": {
    "visibleToClient": true,
    "visibleToTMF": true,
    "visibleToCandidate": false,
    "hideAIScores": true,  // Don't show AI scores to client
    "restrictedFields": ["salary_expectation", "internal_notes"]
  }
}
```

---

#### **6. Required Inputs**

Define what must be completed before advancing:

```json
{
  "requiredInputs": [
    {
      "field": "scorecard",
      "mandatory": true,
      "template": "technical-interview-scorecard"
    },
    {
      "field": "feedback_notes",
      "mandatory": true,
      "minLength": 50
    },
    {
      "field": "budget_approval_document",
      "mandatory": true,
      "fileTypes": ["pdf", "docx"]
    },
    {
      "field": "manager_approval",
      "mandatory": true,
      "approverRole": "client_manager"
    }
  ]
}
```

**Validation**: System blocks stage progression if required inputs are incomplete.

---

#### **7. Disqualification Rules**

Custom logic to auto-reject candidates:

```json
{
  "disqualificationRules": [
    {
      "condition": "ai_score_below",
      "threshold": 60,
      "autoReject": true,
      "rejectionMessage": "Thank you for your interest. Unfortunately, we are moving forward with other candidates."
    },
    {
      "condition": "assessment_incomplete",
      "timeLimit": 48,  // hours
      "autoReject": true,
      "rejectionMessage": "Assessment not completed within 48 hours."
    },
    {
      "condition": "interviewer_rejected",
      "autoReject": true
    },
    {
      "condition": "document_missing",
      "requiredDocuments": ["resume", "certificate"],
      "blockProgression": true  // Don't auto-reject, just block
    }
  ]
}
```

---

#### **8. SLA Settings**

Define expected completion times:

```json
{
  "slaSettings": {
    "targetCompletionTime": 24,  // hours
    "reminderSchedule": [
      { "at": 12, "recipient": "interviewer", "message": "Interview pending" },
      { "at": 20, "recipient": "tmf_recruiter", "message": "SLA warning" }
    ],
    "escalation": {
      "after": 24,
      "escalateTo": "tmf_manager",
      "message": "Interview not completed - SLA breach"
    }
  }
}
```

---

#### **9. Notifications**

Configurable per stage:

```json
{
  "notifications": [
    {
      "trigger": "on_enter_stage",
      "recipients": ["candidate"],
      "channel": "email",
      "template": "assessment-invitation",
      "subject": "Complete Your Technical Assessment"
    },
    {
      "trigger": "on_enter_stage",
      "recipients": ["interviewer"],
      "channel": "push",
      "message": "New candidate ready for interview"
    },
    {
      "trigger": "scorecard_submitted",
      "recipients": ["tmf_recruiter", "client_manager"],
      "channel": "email",
      "template": "interview-completed-notification"
    },
    {
      "trigger": "on_auto_advance",
      "recipients": ["candidate"],
      "channel": "sms",
      "message": "Congratulations! You've advanced to the next round."
    }
  ]
}
```

---

#### **10. Integrations**

Connect external tools per stage:

```json
{
  "integrations": {
    "assessmentProvider": {
      "enabled": true,
      "provider": "hackerrank",  // 'hackerrank', 'codility', 'criteria', 'coderbyte'
      "apiKey": "env:HACKERRANK_API_KEY",
      "testId": "senior-backend-test-v2",
      "autoSendInvite": true,
      "resultSyncEnabled": true
    },
    "videoInterviewPlatform": {
      "enabled": true,
      "provider": "zoom",
      "autoScheduling": true,
      "recordToCloud": true
    },
    "aiEngine": {
      "enabled": true,
      "provider": "openai",  // 'openai', 'anthropic', 'custom'
      "model": "gpt-4",
      "evaluationCriteria": ["technical_skills", "communication", "problem_solving"]
    },
    "hrisSync": {
      "enabled": true,
      "system": "workday",
      "syncFields": ["candidate_name", "email", "stage", "interview_feedback"]
    },
    "calendarIntegration": {
      "enabled": true,
      "provider": "google_calendar",
      "autoBlockSlots": true
    }
  }
}
```

---

### Complete Stage Configuration Example

**Example: AI Video Interview Stage**

```json
{
  "stageName": "AI Video Interview",
  "stageType": "ai_interview",
  "stageOrder": 4,
  "description": "30-minute AI-powered behavioral interview",
  
  "requiredActions": [
    "trigger_ai_interview",
    "complete_scorecard"
  ],
  
  "interviewConfig": {
    "mode": "ai_video",
    "duration": 30,
    "platform": "internal",
    "candidateInstructions": "Complete the AI interview within 48 hours. Ensure good lighting and a quiet environment.",
    "scorecardTemplate": "ai-behavioral-interview",
    "recordingEnabled": true
  },
  
  "automations": [
    {
      "trigger": "on_enter_stage",
      "action": "send_email",
      "template": "ai-interview-invite",
      "recipient": "candidate"
    },
    {
      "trigger": "score_above",
      "threshold": 75,
      "action": "auto_advance",
      "targetStage": "Client Interview"
    },
    {
      "trigger": "score_below",
      "threshold": 50,
      "action": "auto_disqualify",
      "reason": "Did not meet minimum AI interview requirements"
    },
    {
      "trigger": "time_in_stage",
      "duration": 36,
      "action": "send_reminder",
      "recipient": "candidate"
    }
  ],
  
  "visibility": {
    "visibleToClient": true,
    "visibleToTMF": true,
    "visibleToCandidate": false,
    "hideAIScores": false
  },
  
  "requiredInputs": [
    {
      "field": "ai_interview_completion",
      "mandatory": true
    }
  ],
  
  "disqualificationRules": [
    {
      "condition": "assessment_incomplete",
      "timeLimit": 48,
      "autoReject": true,
      "rejectionMessage": "AI interview not completed within 48 hours."
    }
  ],
  
  "slaSettings": {
    "targetCompletionTime": 48,
    "reminderSchedule": [
      { "at": 36, "recipient": "candidate", "message": "Complete AI interview" }
    ]
  },
  
  "notifications": [
    {
      "trigger": "on_enter_stage",
      "recipients": ["candidate"],
      "channel": "email",
      "template": "ai-interview-invitation"
    },
    {
      "trigger": "on_auto_advance",
      "recipients": ["tmf_recruiter"],
      "channel": "push",
      "message": "Candidate passed AI interview"
    }
  ],
  
  "integrations": {
    "aiEngine": {
      "enabled": true,
      "provider": "openai",
      "model": "gpt-4o",
      "evaluationCriteria": ["communication", "cultural_fit", "motivation"]
    }
  }
}
```

---

### Database Schema for Workflow Builder

#### **New Table: `workflow_templates`**

Store reusable workflow templates:

```sql
CREATE TABLE workflow_templates (
  id SERIAL PRIMARY KEY,
  template_name VARCHAR(255) NOT NULL,
  employment_type VARCHAR(50),            -- 'contract', 'partTime', 'fullTime', 'eor'
  created_by_user_id VARCHAR(255),
  is_default BOOLEAN DEFAULT false,
  stages_config JSONB NOT NULL,           -- Complete stage configurations
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_workflow_templates_type ON workflow_templates(employment_type);
```

**Sample `stages_config` JSON**:
```json
[
  {
    "stageName": "Screening",
    "stageType": "custom_action",
    "stageOrder": 1,
    "isFixed": true,
    "automations": [...]
  },
  {
    "stageName": "AI Video Interview",
    "stageType": "ai_interview",
    "stageOrder": 4,
    "interviewConfig": {...},
    "automations": [...]
  }
]
```

---

#### **Extended: `job_pipeline_stages` Table**

Add configuration column to store per-stage settings:

```sql
ALTER TABLE job_pipeline_stages 
ADD COLUMN stage_config JSONB;

CREATE INDEX idx_pipeline_stage_config ON job_pipeline_stages USING GIN (stage_config);
```

**Updated Table Structure**:
```sql
CREATE TABLE job_pipeline_stages (
  id SERIAL PRIMARY KEY,
  job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  stage_name VARCHAR(100) NOT NULL,
  stage_order INTEGER NOT NULL,
  is_default BOOLEAN DEFAULT false,
  stage_config JSONB,                          -- ⭐ NEW: Per-stage configuration
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(job_id, stage_order)
);
```

**Example `stage_config` value**:
```json
{
  "stageType": "ai_interview",
  "interviewConfig": {...},
  "automations": [...],
  "visibility": {...},
  "requiredInputs": [...],
  "disqualificationRules": [...],
  "slaSettings": {...},
  "notifications": [...],
  "integrations": {...}
}
```

---

### Per-Stage User Configuration

**⭐ KEY CONCEPT: Each Stage Has Independent Configuration**

Every stage in a job's pipeline can have its own unique settings configured by the user. The `stage_config` JSONB column stores stage-specific configurations, allowing maximum flexibility.

#### How It Works

```
Job: Senior Backend Engineer
├─ Stage 1: Screening
│  └─ Config: { stageType: "custom_action", automations: [...] }
│
├─ Stage 2: Shortlist  
│  └─ Config: { stageType: "custom_action", slaSettings: {...} }
│
├─ Stage 3: Client Endorsement
│  └─ Config: { stageType: "approval", requiredInputs: [...] }
│
├─ Stage 4: AI Video Interview ⭐ User-configured
│  └─ Config: {
│       stageType: "ai_interview",
│       interviewConfig: { mode: "ai_video", duration: 30 },
│       automations: [{ trigger: "score_below", threshold: 60, action: "auto_disqualify" }],
│       notifications: [...]
│     }
│
├─ Stage 5: Coding Challenge ⭐ User-configured
│  └─ Config: {
│       stageType: "assessment",
│       integrations: { assessmentProvider: { provider: "hackerrank", testId: "..." } },
│       disqualificationRules: [{ condition: "assessment_incomplete", timeLimit: 48 }],
│       slaSettings: { targetCompletionTime: 48 }
│     }
│
├─ Stage 6: Technical Interview ⭐ User-configured
│  └─ Config: {
│       stageType: "client_interview",
│       interviewConfig: { mode: "human_client", duration: 60, platform: "zoom" },
│       requiredInputs: [{ field: "scorecard", mandatory: true }],
│       visibility: { visibleToClient: true, visibleToCandidate: false }
│     }
│
├─ Stage 7: Offer
│  └─ Config: { stageType: "offer", requiredInputs: [...] }
│
└─ Stage 8: Offer Accepted
   └─ Config: { stageType: "offer", automations: [{ trigger: "on_enter_stage", action: "sync_to_hris" }] }
```

#### User Configuration UI

**Stage Configuration Panel**:
```
┌────────────────────────────────────────────────────────────┐
│  Configure Stage: "AI Video Interview"                    │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Stage Type: [AI Interview ▼]                             │
│                                                            │
│  ┌─ Interview Settings ─────────────────────────────────┐ │
│  │  Mode: [AI Video ▼]                                  │ │
│  │  Duration: [30] minutes                              │ │
│  │  Candidate Instructions: [________________]          │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  ┌─ Automations ────────────────────────────────────────┐ │
│  │  ☑ Auto-advance if score > 75                        │ │
│  │  ☑ Auto-reject if score < 50                         │ │
│  │  ☑ Send email on stage entry                        │ │
│  │  + Add Automation Rule                               │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  ┌─ Visibility Rules ───────────────────────────────────┐ │
│  │  ☑ Visible to Client                                 │ │
│  │  ☑ Visible to TMF                                    │ │
│  │  ☐ Visible to Candidate                              │ │
│  │  ☑ Hide AI scores from client                        │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  ┌─ SLA Settings ───────────────────────────────────────┐ │
│  │  Target Completion: [48] hours                       │ │
│  │  Reminder at: [36] hours                             │ │
│  │  Escalate to: [TMF Manager ▼]                        │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  ┌─ Notifications ──────────────────────────────────────┐ │
│  │  On entry: Send email to candidate                   │ │
│  │  On completion: Notify recruiter                     │ │
│  │  + Add Notification                                  │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  ┌─ Integrations ───────────────────────────────────────┐ │
│  │  AI Provider: [OpenAI GPT-4 ▼]                       │ │
│  │  Evaluation Criteria: [Communication, Cultural Fit]  │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  [Cancel]  [Save Stage Configuration]                     │
└────────────────────────────────────────────────────────────┘
```

#### Database Storage & Query Examples

**1. INSERT: Create Stage with Configuration**

```sql
INSERT INTO job_pipeline_stages (
  job_id, 
  stage_name, 
  stage_order, 
  is_default, 
  stage_config
) VALUES (
  123,
  'AI Video Interview',
  4,
  false,
  '{
    "stageType": "ai_interview",
    "interviewConfig": {
      "mode": "ai_video",
      "duration": 30,
      "candidateInstructions": "Complete within 48 hours"
    },
    "automations": [
      {
        "trigger": "score_below",
        "threshold": 60,
        "action": "auto_disqualify"
      }
    ],
    "visibility": {
      "visibleToClient": true,
      "visibleToTMF": true,
      "visibleToCandidate": false
    },
    "slaSettings": {
      "targetCompletionTime": 48
    }
  }'::jsonb
);
```

**2. UPDATE: Modify Stage Configuration**

```sql
-- Update entire config
UPDATE job_pipeline_stages
SET stage_config = '{
  "stageType": "ai_interview",
  "interviewConfig": {
    "mode": "ai_video",
    "duration": 45
  },
  "automations": [
    {
      "trigger": "score_below",
      "threshold": 70,
      "action": "auto_disqualify"
    }
  ]
}'::jsonb,
updated_at = NOW()
WHERE id = 504;

-- Update specific field within JSONB (change duration only)
UPDATE job_pipeline_stages
SET stage_config = jsonb_set(
  stage_config,
  '{interviewConfig,duration}',
  '60'::jsonb
),
updated_at = NOW()
WHERE id = 504;

-- Add new automation rule to existing array
UPDATE job_pipeline_stages
SET stage_config = jsonb_set(
  stage_config,
  '{automations}',
  stage_config->'automations' || '[{"trigger":"time_in_stage","duration":48,"action":"send_reminder"}]'::jsonb
),
updated_at = NOW()
WHERE id = 504;
```

**3. SELECT: Query All Stages with Configurations**

```sql
SELECT 
  id,
  stage_name,
  stage_order,
  stage_config
FROM job_pipeline_stages
WHERE job_id = 123
ORDER BY stage_order;
```

**Result**:
```
| id  | stage_name           | stage_order | stage_config                                    |
|-----|----------------------|-------------|-------------------------------------------------|
| 501 | Screening            | 1           | {"stageType": "custom_action", ...}             |
| 502 | Shortlist            | 2           | {"stageType": "custom_action", ...}             |
| 503 | Client Endorsement   | 3           | {"stageType": "approval", ...}                  |
| 504 | AI Video Interview   | 4           | {"stageType": "ai_interview", "interviewConf... |
| 505 | Coding Challenge     | 5           | {"stageType": "assessment", "integrations": ... |
| 506 | Technical Interview  | 6           | {"stageType": "client_interview", "intervie...  |
| 507 | Offer                | 7           | {"stageType": "offer", ...}                     |
| 508 | Offer Accepted       | 8           | {"stageType": "offer", ...}                     |
```

**4. SELECT: Query Specific Configuration Fields (JSONB Operators)**

```sql
-- Get stages with AI interviews
SELECT id, stage_name, stage_config->>'stageType' AS stage_type
FROM job_pipeline_stages
WHERE job_id = 123
  AND stage_config->>'stageType' = 'ai_interview';

-- Get stages with auto-disqualification rules
SELECT id, stage_name, stage_config->'automations' AS automations
FROM job_pipeline_stages
WHERE job_id = 123
  AND stage_config @> '{"automations": [{"action": "auto_disqualify"}]}'::jsonb;

-- Get interview duration for a specific stage
SELECT 
  stage_name,
  stage_config->'interviewConfig'->>'duration' AS duration_minutes,
  stage_config->'interviewConfig'->>'mode' AS interview_mode
FROM job_pipeline_stages
WHERE id = 504;

-- Find all stages with SLA settings under 24 hours
SELECT id, stage_name, stage_config->'slaSettings'->>'targetCompletionTime' AS sla_hours
FROM job_pipeline_stages
WHERE job_id = 123
  AND (stage_config->'slaSettings'->>'targetCompletionTime')::int < 24;
```

**5. SELECT: Get Stages with Specific Integrations**

```sql
-- Find stages using HackerRank
SELECT 
  id, 
  stage_name,
  stage_config->'integrations'->'assessmentProvider'->>'provider' AS provider
FROM job_pipeline_stages
WHERE job_id = 123
  AND stage_config->'integrations'->'assessmentProvider'->>'provider' = 'hackerrank';

-- Find stages with AI engine enabled
SELECT id, stage_name
FROM job_pipeline_stages
WHERE job_id = 123
  AND stage_config->'integrations'->'aiEngine'->>'enabled' = 'true';
```

#### API: Update Stage Configuration

**Endpoint**: `PUT /api/jobs/:jobId/pipeline-stages/:stageId/config`

**Description**: Update the configuration for a specific stage in a job's pipeline. Supports full config replacement or partial updates.

**Request Headers**:
```
Content-Type: application/json
Authorization: Bearer {access_token}
```

**Request Body**:
```json
{
  "stageConfig": {
    "stageType": "ai_interview",
    "interviewConfig": {
      "mode": "ai_video",
      "duration": 30,
      "candidateInstructions": "Please complete the AI interview within 48 hours."
    },
    "automations": [
      {
        "trigger": "score_above",
        "threshold": 75,
        "action": "auto_advance"
      },
      {
        "trigger": "score_below",
        "threshold": 50,
        "action": "auto_disqualify",
        "reason": "Did not meet minimum requirements"
      }
    ],
    "visibility": {
      "visibleToClient": true,
      "visibleToTMF": true,
      "visibleToCandidate": false,
      "hideAIScores": false
    },
    "slaSettings": {
      "targetCompletionTime": 48,
      "reminderSchedule": [
        { "at": 36, "recipient": "candidate", "message": "Complete AI interview" }
      ]
    },
    "notifications": [
      {
        "trigger": "on_enter_stage",
        "recipients": ["candidate"],
        "channel": "email",
        "template": "ai-interview-invitation"
      }
    ],
    "integrations": {
      "aiEngine": {
        "enabled": true,
        "provider": "openai",
        "model": "gpt-4o",
        "evaluationCriteria": ["communication", "cultural_fit"]
      }
    }
  }
}
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "stageId": 504,
  "stageName": "AI Video Interview",
  "jobId": 123,
  "stageConfig": {
    "stageType": "ai_interview",
    "interviewConfig": { "mode": "ai_video", "duration": 30 },
    "automations": [...],
    "visibility": {...},
    "slaSettings": {...}
  },
  "message": "Stage configuration updated successfully",
  "updatedAt": "2025-11-17T14:30:00Z"
}
```

**Error Response - Stage Not Found** (404 Not Found):
```json
{
  "success": false,
  "error": "Stage not found",
  "message": "Stage with ID 504 does not exist in job 123"
}
```

**Error Response - Invalid Configuration** (400 Bad Request):
```json
{
  "success": false,
  "error": "Validation failed",
  "message": "Invalid stage configuration",
  "validationErrors": [
    {
      "field": "interviewConfig.duration",
      "message": "Duration must be between 1 and 180 minutes",
      "value": 200
    },
    {
      "field": "automations[0].threshold",
      "message": "Threshold must be between 0 and 100",
      "value": 150
    }
  ]
}
```

**Error Response - Fixed Stage Cannot Be Modified** (403 Forbidden):
```json
{
  "success": false,
  "error": "Cannot modify fixed stage",
  "message": "Stage 'Screening' is a fixed stage and its type cannot be changed",
  "stageName": "Screening",
  "isFixed": true
}
```

**Error Response - Unauthorized** (401 Unauthorized):
```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "Valid authentication required"
}
```

**Example cURL Request**:
```bash
curl -X PUT https://ats.example.com/api/jobs/123/pipeline-stages/504/config \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_access_token" \
  -d '{
    "stageConfig": {
      "stageType": "ai_interview",
      "interviewConfig": {
        "mode": "ai_video",
        "duration": 30
      },
      "automations": [
        {
          "trigger": "score_below",
          "threshold": 60,
          "action": "auto_disqualify"
        }
      ]
    }
  }'
```

**Validation Rules**:
- `stageType`: Must be one of the valid stage types (ai_interview, tmf_interview, client_interview, assessment, approval, offer, custom_action)
- `interviewConfig.duration`: Must be between 1-180 minutes
- `automations[].threshold`: Must be between 0-100
- `slaSettings.targetCompletionTime`: Must be positive integer (hours)
- `integrations`: Provider must be supported (openai, anthropic, hackerrank, etc.)
- Fixed stages (Screening, Shortlist, Client Endorsement, Offer, Offer Accepted) cannot change stageType

#### Benefits of Per-Stage Configuration

✅ **Maximum Flexibility**: Each stage can behave completely differently
✅ **Job-Specific Workflows**: Customize stages based on role requirements
✅ **Independent Control**: Change one stage without affecting others
✅ **Granular Automation**: Different rules for different stages
✅ **Stage-Level Integration**: Connect different tools per stage (e.g., HackerRank for coding, Zoom for interviews)
✅ **Compliance**: Enforce approvals only where needed
✅ **User Empowerment**: Clients configure their exact hiring process

#### Cross-Job Flexibility: Same Stage Name, Different Configurations

**⭐ KEY DEMONSTRATION: Independent Per-Job Stage Configuration**

This example shows how two different jobs can have stages with the **same name** but **completely different configurations**, demonstrating the flexibility of per-stage configuration.

---

**Scenario**: Two jobs both have a "Technical Interview" stage, but configured differently

**Job #1: Senior Backend Engineer** (job_id = 100)
- Focus: Deep technical assessment
- Duration: 90 minutes
- Conducted by: Tech Lead
- Required: Technical scorecard + Live coding exercise

**Job #2: Junior Frontend Developer** (job_id = 200)
- Focus: Basic skills verification
- Duration: 45 minutes
- Conducted by: Senior Developer
- Required: Portfolio review + Simple coding challenge

---

**Database Records: Side-by-Side Comparison**

```sql
-- Job 100: Senior Backend Engineer
SELECT id, job_id, stage_name, stage_order, stage_config 
FROM job_pipeline_stages 
WHERE job_id = 100 AND stage_name = 'Technical Interview';
```

**Result**:
```
| id  | job_id | stage_name          | stage_order | stage_config                           |
|-----|--------|---------------------|-------------|----------------------------------------|
| 805 | 100    | Technical Interview | 5           | {                                      |
|     |        |                     |             |   "stageType": "client_interview",     |
|     |        |                     |             |   "interviewConfig": {                 |
|     |        |                     |             |     "mode": "human_client",            |
|     |        |                     |             |     "duration": 90,                    |
|     |        |                     |             |     "platform": "zoom",                |
|     |        |                     |             |     "interviewers": [                  |
|     |        |                     |             |       {                                |
|     |        |                     |             |         "userId": "tech-lead-456",     |
|     |        |                     |             |         "role": "tech_lead",           |
|     |        |                     |             |         "name": "Alice Johnson"        |
|     |        |                     |             |       }                                |
|     |        |                     |             |     ],                                 |
|     |        |                     |             |     "recordingEnabled": true,          |
|     |        |                     |             |     "candidateInstructions": "Be prep.."|
|     |        |                     |             |   },                                   |
|     |        |                     |             |   "requiredInputs": [                  |
|     |        |                     |             |     {                                  |
|     |        |                     |             |       "field": "technical_scorecard",  |
|     |        |                     |             |       "mandatory": true,               |
|     |        |                     |             |       "template": "senior-backend-v2"  |
|     |        |                     |             |     },                                 |
|     |        |                     |             |     {                                  |
|     |        |                     |             |       "field": "live_coding_exercise", |
|     |        |                     |             |       "mandatory": true,               |
|     |        |                     |             |       "minDuration": 30                |
|     |        |                     |             |     }                                  |
|     |        |                     |             |   ],                                   |
|     |        |                     |             |   "slaSettings": {                     |
|     |        |                     |             |     "targetCompletionTime": 24         |
|     |        |                     |             |   },                                   |
|     |        |                     |             |   "visibility": {                      |
|     |        |                     |             |     "visibleToClient": true,           |
|     |        |                     |             |     "visibleToCandidate": false        |
|     |        |                     |             |   }                                    |
|     |        |                     |             | }                                      |
```

```sql
-- Job 200: Junior Frontend Developer
SELECT id, job_id, stage_name, stage_order, stage_config 
FROM job_pipeline_stages 
WHERE job_id = 200 AND stage_name = 'Technical Interview';
```

**Result**:
```
| id  | job_id | stage_name          | stage_order | stage_config                           |
|-----|--------|---------------------|-------------|----------------------------------------|
| 912 | 200    | Technical Interview | 4           | {                                      |
|     |        |                     |             |   "stageType": "client_interview",     |
|     |        |                     |             |   "interviewConfig": {                 |
|     |        |                     |             |     "mode": "human_client",            |
|     |        |                     |             |     "duration": 45,                    |
|     |        |                     |             |     "platform": "google_meet",         |
|     |        |                     |             |     "interviewers": [                  |
|     |        |                     |             |       {                                |
|     |        |                     |             |         "userId": "senior-dev-789",    |
|     |        |                     |             |         "role": "senior_developer",    |
|     |        |                     |             |         "name": "Bob Smith"            |
|     |        |                     |             |       }                                |
|     |        |                     |             |     ],                                 |
|     |        |                     |             |     "recordingEnabled": false,         |
|     |        |                     |             |     "candidateInstructions": "Show us.."|
|     |        |                     |             |   },                                   |
|     |        |                     |             |   "requiredInputs": [                  |
|     |        |                     |             |     {                                  |
|     |        |                     |             |       "field": "portfolio_review",     |
|     |        |                     |             |       "mandatory": true                |
|     |        |                     |             |     },                                 |
|     |        |                     |             |     {                                  |
|     |        |                     |             |       "field": "simple_coding_test",   |
|     |        |                     |             |       "mandatory": true,               |
|     |        |                     |             |       "difficulty": "easy"             |
|     |        |                     |             |     }                                  |
|     |        |                     |             |   ],                                   |
|     |        |                     |             |   "slaSettings": {                     |
|     |        |                     |             |     "targetCompletionTime": 48         |
|     |        |                     |             |   },                                   |
|     |        |                     |             |   "visibility": {                      |
|     |        |                     |             |     "visibleToClient": true,           |
|     |        |                     |             |     "visibleToCandidate": true         |
|     |        |                     |             |   }                                    |
|     |        |                     |             | }                                      |
```

---

**Key Differences Highlighted**:

| Configuration Aspect     | Job #100 (Senior Backend)              | Job #200 (Junior Frontend)            |
|--------------------------|----------------------------------------|---------------------------------------|
| **Duration**             | 90 minutes                             | 45 minutes                            |
| **Platform**             | Zoom                                   | Google Meet                           |
| **Interviewer**          | Tech Lead (Alice Johnson)              | Senior Developer (Bob Smith)          |
| **Recording**            | Enabled                                | Disabled                              |
| **Required Inputs**      | Technical scorecard + Live coding      | Portfolio review + Simple test        |
| **Scorecard Template**   | "senior-backend-v2"                    | N/A                                   |
| **SLA**                  | 24 hours                               | 48 hours                              |
| **Candidate Visibility** | Hidden from candidate                  | Visible to candidate                  |

---

**Query to Compare Across Jobs**:

```sql
-- Get all "Technical Interview" stages across different jobs
SELECT 
  jps.job_id,
  j.title AS job_title,
  jps.stage_name,
  jps.stage_config->'interviewConfig'->>'duration' AS duration_minutes,
  jps.stage_config->'interviewConfig'->>'platform' AS platform,
  jps.stage_config->'slaSettings'->>'targetCompletionTime' AS sla_hours,
  jps.stage_config->'visibility'->>'visibleToCandidate' AS candidate_visible
FROM job_pipeline_stages jps
JOIN jobs j ON jps.job_id = j.id
WHERE jps.stage_name = 'Technical Interview'
ORDER BY jps.job_id;
```

**Result**:
```
| job_id | job_title                | duration_minutes | platform    | sla_hours | candidate_visible |
|--------|--------------------------|------------------|-------------|-----------|-------------------|
| 100    | Senior Backend Engineer  | 90               | zoom        | 24        | false             |
| 200    | Junior Frontend Developer| 45               | google_meet | 48        | true              |
| 305    | DevOps Engineer          | 60               | teams       | 36        | false             |
| 412    | UI/UX Designer           | 30               | zoom        | 72        | true              |
```

---

**What This Demonstrates**:

✅ **Same Stage Name, Different Behavior**: "Technical Interview" stage behaves completely differently based on job requirements

✅ **Job-Specific Customization**: Each job can configure stages to match role complexity (90 min for Senior, 45 min for Junior)

✅ **Independent Configuration**: Changing Job #100's interview config doesn't affect Job #200

✅ **Flexibility at Scale**: System supports unlimited jobs with custom configurations per stage

✅ **JSONB Power**: PostgreSQL JSONB enables flexible querying and filtering across stage configurations

---

**Real-World Impact**:

When a candidate applies to **Job #100** (Senior Backend Engineer):
- Enters "Technical Interview" stage → Gets 90-minute Zoom interview with Tech Lead
- System requires technical scorecard + live coding exercise before advancing
- Candidate doesn't see interview details (hidden)
- SLA: Must complete within 24 hours

When a candidate applies to **Job #200** (Junior Frontend Developer):
- Enters "Technical Interview" stage → Gets 45-minute Google Meet with Senior Dev
- System requires portfolio review + simple coding test
- Candidate can see interview details (transparent)
- SLA: Must complete within 48 hours

**Same stage name, completely different experience.**

---

### Workflow Builder UI Flow

```
┌─────────────────────────────────────────────────────────────┐
│         CLIENT WORKFLOW BUILDER UI                          │
└─────────────────────────────────────────────────────────────┘

1. Client creates new job
   ↓
2. Choose workflow template:
   • Default template (basic pipeline)
   • Custom template (saved workflows)
   • Start from scratch
   ↓
3. Customize pipeline stages:
   • Drag to reorder
   • Click stage to configure
   • Add/remove custom stages
   ↓
4. Configure each stage:
   • Set stage type
   • Configure interview settings
   • Add automations
   • Set visibility rules
   • Define SLAs
   ↓
5. Save as template (optional)
   ↓
6. Submit job with custom workflow
   ↓
7. Pipeline created in job_pipeline_stages
   with stage_config JSON
```

---

### Benefits of Workflow Builder

✅ **Client Customization**: Each client can define their hiring process
✅ **Automation**: Reduce manual work with triggers and actions
✅ **Compliance**: Enforce required approvals and documentation
✅ **Flexibility**: Different workflows for different job types
✅ **Scalability**: Templates can be reused across jobs
✅ **Integration**: Connect external tools per stage
✅ **Transparency**: Candidates know what to expect
✅ **Analytics**: Track time-in-stage, conversion rates, bottlenecks

---

### Example Use Cases

**Use Case 1: High-Volume Hourly Hiring**
```
Screening (AI) → Phone Screen (Auto-schedule) → Background Check → Offer
• Auto-advance candidates with AI score > 70
• Auto-reject if background check fails
• Send SMS notifications
```

**Use Case 2: Senior Executive Hiring**
```
Screening → AI Interview → TMF Interview → Panel Interview (3 rounds) 
→ Executive Interview → Budget Approval → Offer
• Manual approval required at each stage
• Email notifications to stakeholders
• 7-day SLA per stage
```

**Use Case 3: Technical Developer Role**
```
Screening → HackerRank Test → AI Code Review → TMF Interview 
→ Client Interview → Offer
• Auto-reject if HackerRank score < 80
• AI reviews code quality
• Auto-sync results to HRIS
```

---

## API Reference

### Candidate Management

#### **POST /api/portal/candidates**
Submit new candidate (always starts at Screening)

**Request**:
```json
{
  "jobId": "1",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+1-555-0100",
  "resumeUrl": "https://storage.com/resume.pdf",
  "externalPortalId": "portal-cand-123"
}
```

**Response**:
```json
{
  "success": true,
  "candidate": {
    "id": 42,
    "currentStage": "Screening",
    "status": "active",
    "createdAt": "2025-11-17T10:00:00Z"
  }
}
```

---

#### **PUT /api/portal/candidates/:id/advance**
Advance candidate to next stage (dynamic based on job pipeline)

**Request**:
```json
{
  "notes": "Qualified candidate, strong technical background",
  "portalUserId": "portal-recruiter-123"
}
```

**Response**:
```json
{
  "success": true,
  "candidate": {
    "id": 42,
    "previousStage": "Screening",
    "currentStage": "Shortlist",
    "updatedAt": "2025-11-17T11:30:00Z"
  },
  "isHandoffPoint": false,
  "message": "Candidate advanced from Screening to Shortlist"
}
```

**Handoff Point Response**:
```json
{
  "success": true,
  "candidate": {
    "id": 42,
    "previousStage": "Shortlist",
    "currentStage": "Client Endorsement"
  },
  "isHandoffPoint": true,
  "message": "Candidate endorsed for client review (handoff to Internal ATS)"
}
```

---

#### **GET /api/portal/jobs/:jobId/candidates**
Get candidates for a job (with optional filters)

**Query Parameters**:
- `stage` (optional): Filter by specific stage
- `status` (optional): Filter by status (active, rejected, hired)

**Response**:
```json
{
  "success": true,
  "jobId": "1",
  "totalCount": 15,
  "filters": { "stage": "Screening", "status": "active" },
  "candidates": [
    {
      "id": 42,
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "currentStage": "Screening",
      "source": "portal",
      "status": "active",
      "createdAt": "2025-11-17T10:00:00Z"
    }
  ]
}
```

---

#### **GET /api/portal/candidates/:id**
Get complete candidate details with audit trail

**Response**:
```json
{
  "success": true,
  "candidate": {
    "id": 42,
    "firstName": "John",
    "lastName": "Doe",
    "currentStage": "Client Endorsement",
    "source": "portal",
    "status": "active",
    "stageHistory": [
      {
        "previousStage": null,
        "newStage": "Screening",
        "changedBy": "portal-system",
        "changedAt": "2025-11-17T10:00:00Z"
      },
      {
        "previousStage": "Screening",
        "newStage": "Shortlist",
        "changedBy": "portal-user-123",
        "changedAt": "2025-11-17T11:30:00Z",
        "notes": "Strong candidate"
      }
    ]
  }
}
```

---

### Stage Management (Internal ATS Only)

#### **PUT /api/jobs/:jobId/pipeline-stages/:stageId**
Rename a pipeline stage (with automatic candidate migration)

**Request**:
```json
{
  "newStageName": "Initial Review"
}
```

**Response**:
```json
{
  "success": true,
  "oldStageName": "Screening",
  "newStageName": "Initial Review",
  "candidatesMigrated": 15,
  "auditRecordsUpdated": 45,
  "message": "Stage renamed successfully. All candidates and history updated."
}
```

---

#### **DELETE /api/jobs/:jobId/pipeline-stages/:stageId**
Delete a pipeline stage (validates no active candidates)

**Success Response**:
```json
{
  "success": true,
  "message": "Stage deleted successfully"
}
```

**Error Response (has candidates)**:
```json
{
  "error": "Cannot delete stage",
  "message": "Cannot delete stage 'Technical Test'. 8 active candidates are currently in this stage.",
  "candidateCount": 8,
  "stageName": "Technical Test"
}
```

---

#### **GET /api/jobs/:jobId/pipeline-stages/:stageId/candidate-count**
Get candidate count for UI warnings

**Response**:
```json
{
  "stageName": "Technical Test",
  "candidateCount": 8,
  "canDelete": false
}
```

---

### Workflow Builder APIs

#### **POST /api/workflow-templates**
Create reusable workflow template

**Request**:
```json
{
  "templateName": "Tech Hiring - Senior Level",
  "employmentType": "fullTime",
  "stagesConfig": [
    {
      "stageName": "Screening",
      "stageType": "custom_action",
      "stageOrder": 1,
      "isFixed": true
    },
    {
      "stageName": "AI Video Interview",
      "stageType": "ai_interview",
      "stageOrder": 4,
      "interviewConfig": {...},
      "automations": [...]
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "templateId": 123,
  "message": "Workflow template created"
}
```

---

#### **GET /api/workflow-templates**
Get all workflow templates (filterable by employment type)

**Query Parameters**:
- `employmentType` (optional): 'contract', 'partTime', 'fullTime', 'eor'

**Response**:
```json
{
  "success": true,
  "templates": [
    {
      "id": 123,
      "templateName": "Tech Hiring - Senior Level",
      "employmentType": "fullTime",
      "isDefault": false,
      "stagesCount": 8
    }
  ]
}
```

---

#### **POST /api/jobs/:jobId/apply-workflow-template**
Apply workflow template to a job

**Request**:
```json
{
  "templateId": 123
}
```

**Response**:
```json
{
  "success": true,
  "stagesCreated": 8,
  "message": "Workflow applied to job"
}
```

---

## Code Examples

### Example 1: Portal Submits Candidate

```javascript
// External portal code
async function submitCandidateToATS(candidateData) {
  const response = await fetch('https://ats.example.com/api/portal/candidates', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': process.env.PORTAL_API_KEY
    },
    body: JSON.stringify({
      jobId: '1',
      firstName: candidateData.firstName,
      lastName: candidateData.lastName,
      email: candidateData.email,
      phone: candidateData.phone,
      resumeUrl: candidateData.resumeUrl,
      externalPortalId: candidateData.portalId
    })
  });
  
  const result = await response.json();
  
  if (!response.ok) {
    if (result.error === 'Duplicate email') {
      alert('This candidate has already applied to this job');
    }
    throw new Error(result.message);
  }
  
  console.log('Candidate submitted:', result.candidate);
  return result.candidate;
}
```

### Example 2: Dynamic Stage Advancement

```javascript
// ATS internal code - advance candidate dynamically
async function advanceCandidateDynamically(candidateId, userId, notes) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Get candidate and job pipeline
    const candidateResult = await client.query(
      'SELECT current_stage, job_id FROM candidates WHERE id = $1',
      [candidateId]
    );
    
    const { current_stage, job_id } = candidateResult.rows[0];
    
    const pipelineResult = await client.query(
      'SELECT stage_name, stage_order FROM job_pipeline_stages WHERE job_id = $1 ORDER BY stage_order',
      [job_id]
    );
    
    const pipeline = pipelineResult.rows;
    const currentIndex = pipeline.findIndex(s => s.stage_name === current_stage);
    
    if (currentIndex === pipeline.length - 1) {
      throw new Error('Already at final stage');
    }
    
    const nextStage = pipeline[currentIndex + 1].stage_name;
    
    // Update candidate
    await client.query(
      'UPDATE candidates SET current_stage = $1, updated_at = NOW() WHERE id = $2',
      [nextStage, candidateId]
    );
    
    // Log to audit trail
    await client.query(
      'INSERT INTO candidate_stage_history (candidate_id, previous_stage, new_stage, changed_by_user_id, notes) VALUES ($1, $2, $3, $4, $5)',
      [candidateId, current_stage, nextStage, userId, notes]
    );
    
    await client.query('COMMIT');
    
    return { previousStage: current_stage, newStage: nextStage };
    
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
```

### Example 3: Execute Stage Automations

```javascript
// Execute automations when candidate enters stage
async function executeStageAutomations(candidateId, stageId) {
  // Get stage configuration
  const stageResult = await query(
    'SELECT stage_config FROM job_pipeline_stages WHERE id = $1',
    [stageId]
  );
  
  const stageConfig = stageResult.rows[0].stage_config;
  
  if (!stageConfig || !stageConfig.automations) {
    return;
  }
  
  // Execute each automation
  for (const automation of stageConfig.automations) {
    if (automation.trigger === 'on_enter_stage') {
      switch (automation.action) {
        case 'send_email':
          await sendEmail(candidateId, automation.template, automation.recipient);
          break;
        
        case 'trigger_ai_interview':
          await startAIInterview(candidateId, stageConfig.interviewConfig);
          break;
        
        case 'send_reminder':
          await scheduleReminder(candidateId, automation.duration, automation.recipient);
          break;
        
        case 'sync_to_hris':
          await syncToHRIS(candidateId, automation.hrisSystem);
          break;
      }
    }
  }
}
```

### Example 4: Apply Workflow Template to Job

```javascript
// Client creates job with custom workflow
async function createJobWithWorkflow(jobData, templateId) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // 1. Create job
    const jobResult = await client.query(
      'INSERT INTO jobs (title, employment_type, status, ...) VALUES ($1, $2, $3, ...) RETURNING id',
      [jobData.title, jobData.employmentType, 'draft']
    );
    
    const jobId = jobResult.rows[0].id;
    
    // 2. Get workflow template
    const templateResult = await client.query(
      'SELECT stages_config FROM workflow_templates WHERE id = $1',
      [templateId]
    );
    
    const stagesConfig = templateResult.rows[0].stages_config;
    
    // 3. Create pipeline stages with configs
    for (const stageConfig of stagesConfig) {
      await client.query(
        `INSERT INTO job_pipeline_stages 
         (job_id, stage_name, stage_order, is_default, stage_config) 
         VALUES ($1, $2, $3, $4, $5)`,
        [
          jobId,
          stageConfig.stageName,
          stageConfig.stageOrder,
          stageConfig.isFixed || false,
          JSON.stringify(stageConfig)
        ]
      );
    }
    
    await client.query('COMMIT');
    
    return { jobId, stagesCreated: stagesConfig.length };
    
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
```

---

## Summary

### Key Architectural Points

1. **Dynamic Pipelines**: Each job defines custom stages via `job_pipeline_stages`
2. **Sequential Progression**: Candidates advance using `stage_order` (not hardcoded logic)
3. **String References**: `current_stage` stores stage name (requires migration on rename)
4. **Complete Audit Trail**: Every transition logged with user, timestamp, notes
5. **Ownership Boundaries**: External Portal (stages 1-3), Internal ATS (stages 4-N)
6. **Stage Modification Safety**: Validate before delete, migrate on rename
7. **Enterprise Workflow Builder**: Clients customize stages with automations, integrations, approvals

### Data Flow

```
Submit Candidate → Screening (auto) → Portal Advances → Shortlist → 
Portal Advances → Client Endorsement (HANDOFF) → ATS Advances → 
Custom Stages (with automations) → Offer → Offer Accepted (HIRED)
```

### Best Practices

✅ **Always query pipeline** - Never assume stage sequence  
✅ **Use transactions** - Stage updates + audit logging must be atomic  
✅ **Validate boundaries** - Enforce portal vs ATS ownership  
✅ **Warn users** - Show candidate counts before modifications  
✅ **Migrate on rename** - Update candidates + history automatically  
✅ **Prevent dangerous deletes** - Block deletion of stages with candidates  
✅ **Execute automations** - Trigger configured actions on stage transitions  
✅ **Enforce SLAs** - Monitor time-in-stage and escalate  
✅ **Respect visibility** - Hide restricted data from unauthorized users  

---

**Last Updated**: November 17, 2025  
**Version**: 2.0  
**Related Docs**:
- `docs/DATABASE_SCHEMA_ANALYSIS.md`
- `docs/EXTERNAL_PORTAL_INTEGRATION_ARCHITECTURE.md`
- `docs/EXTERNAL_PORTAL_API.md`
- `docs/DYNAMIC_STAGE_ADVANCEMENT.md`
