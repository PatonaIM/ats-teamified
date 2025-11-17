# Database Schema Analysis & Documentation
**Multi-Employment ATS System**

---

## Document Overview
- **Created**: November 17, 2025
- **Purpose**: Complete database schema documentation for existing production system
- **Database**: Azure PostgreSQL (Flexible Server)
- **ORM/Query Layer**: Direct SQL via `pg` client
- **Status**: ✅ Production schema (no modifications)

---

## Table of Contents
1. [Core Tables](#core-tables)
2. [Candidate Management Tables](#candidate-management-tables)
3. [Workflow & Approval Tables](#workflow--approval-tables)
4. [Integration Tables](#integration-tables)
5. [Table Relationships](#table-relationships)
6. [API Patterns](#api-patterns)
7. [Data Flow Diagrams](#data-flow-diagrams)

---

## Core Tables

### 1. `jobs` Table
**Purpose**: Central table for all job postings across multiple employment types

#### Base Columns
| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Auto-incrementing job ID |
| `title` | VARCHAR(255) | NOT NULL | Job title |
| `employment_type` | VARCHAR(50) | NOT NULL | Type: `contract`, `partTime`, `fullTime`, `eor` |
| `status` | VARCHAR(50) | DEFAULT 'active' | Job status: `draft`, `published`, `active`, `paused`, `filled`, `closed` |
| `company_name` | VARCHAR(255) | - | Hiring company name |
| `location` | VARCHAR(255) | - | Legacy location field |
| `remote_ok` | BOOLEAN | DEFAULT false | Remote work allowed |
| `salary_min` | INTEGER | - | Minimum salary (legacy) |
| `salary_max` | INTEGER | - | Maximum salary (legacy) |
| `description` | TEXT | - | Job description (HTML supported) |
| `requirements` | TEXT[] | - | Array of requirement strings |
| `benefits` | TEXT[] | - | Array of benefit strings |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |
| `candidate_count` | INTEGER | DEFAULT 0 | Total candidates (calculated) |
| `active_candidates` | INTEGER | DEFAULT 0 | Active candidates (calculated) |
| `recruiter_name` | VARCHAR(255) | - | Assigned recruiter |
| `linkedin_synced` | BOOLEAN | DEFAULT false | LinkedIn posting status |

#### Contract-Specific Columns
| Column | Type | Description |
|--------|------|-------------|
| `contract_duration` | VARCHAR(100) | Contract length (e.g., "6 months", "1 year") |
| `contract_value` | DECIMAL(12,2) | Total contract value |
| `service_scope` | TEXT | Scope of services |
| `deliverable_milestones` | TEXT | Milestone descriptions |
| `payment_schedule` | VARCHAR(100) | Payment terms |

#### Part-Time-Specific Columns
| Column | Type | Description |
|--------|------|-------------|
| `hourly_rate` | DECIMAL(10,2) | Hourly compensation |
| `hours_per_week` | INTEGER | Expected weekly hours |
| `max_budget` | DECIMAL(12,2) | Budget cap for position |
| `cost_center` | VARCHAR(100) | Department cost allocation |

#### Full-Time-Specific Columns
| Column | Type | Description |
|--------|------|-------------|
| `annual_salary` | DECIMAL(12,2) | Base annual salary |
| `benefits_package` | TEXT | Benefits description |
| `total_compensation` | DECIMAL(12,2) | Salary + benefits + equity |
| `headcount_impact` | VARCHAR(50) | Impact on headcount budget |

#### EOR-Specific Columns
| Column | Type | Description |
|--------|------|-------------|
| `local_salary` | DECIMAL(12,2) | Local currency salary |
| `eor_service_fee` | DECIMAL(12,2) | EOR provider fees |
| `compliance_costs` | DECIMAL(12,2) | Compliance overhead |
| `salary_currency` | VARCHAR(10) | Currency code (USD, EUR, etc.) |
| `timezone` | VARCHAR(100) | Required timezone |
| `remote_capabilities` | TEXT | Remote work infrastructure |

#### Additional Core Columns
| Column | Type | Description |
|--------|------|-------------|
| `experience_level` | VARCHAR(50) | Junior, Mid, Senior, Lead, etc. |
| `department` | VARCHAR(100) | Department/team |
| `city` | VARCHAR(100) | City location |
| `country` | VARCHAR(100) | Country location |
| `job_status` | VARCHAR(50) | Alternate status field (deprecated) |

#### Indexes
- PRIMARY KEY: `id`
- Recommended: Index on `employment_type`, `status`, `created_at`

---

### 2. `job_pipeline_stages` Table
**Purpose**: Customizable recruitment pipeline stages per job

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Stage ID |
| `job_id` | UUID | NOT NULL, FK → jobs(id) | Associated job |
| `stage_name` | VARCHAR(100) | NOT NULL | Stage name (e.g., "Screening", "Interview") |
| `stage_order` | INTEGER | NOT NULL | Display order (1-based) |
| `is_default` | BOOLEAN | DEFAULT false | System-generated default stage |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation time |

#### Constraints
- **Foreign Key**: `job_id` → `jobs(id)` ON DELETE CASCADE
- **Unique Constraint**: `UNIQUE(job_id, stage_order)`
- **Index**: `idx_pipeline_job_id` on `job_id`

#### Default Pipeline Structure
1. **Fixed Top Stages** (cannot be moved/removed):
   - Screening (order: 1)
   - Shortlist (order: 2)
   - Client Endorsement (order: 3)

2. **Custom Middle Stages** (draggable, unlimited):
   - User-defined stages
   - Suggested: Assessment, Coding Round, Interview 1, Interview 2

3. **Fixed Bottom Stages** (cannot be moved/removed):
   - Offer (order: N-1)
   - Offer Accepted (order: N)

---

## Candidate Management Tables

### 3. `candidates` Table
**Purpose**: Stores candidate profiles and applications

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `id` | UUID/SERIAL | PRIMARY KEY | Candidate ID |
| `job_id` | UUID | NOT NULL, FK → jobs(id) | Applied job |
| `first_name` | VARCHAR(100) | NOT NULL | First name |
| `last_name` | VARCHAR(100) | NOT NULL | Last name |
| `email` | VARCHAR(255) | NOT NULL | Email address |
| `phone` | VARCHAR(50) | - | Phone number |
| `current_stage` | VARCHAR(100) | DEFAULT 'Screening' | Current pipeline stage |
| `source` | VARCHAR(50) | DEFAULT 'direct' | Source: `linkedin`, `direct`, `referral`, `portal` |
| `resume_url` | TEXT | - | Resume file URL (Azure Blob) |
| `external_portal_id` | VARCHAR(255) | - | External system reference |
| `status` | VARCHAR(50) | DEFAULT 'active' | Status: `active`, `rejected`, `hired`, `withdrawn` |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Application date |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update |

#### Constraints
- **Foreign Key**: `job_id` → `jobs(id)` ON DELETE CASCADE
- **Unique Constraint**: `UNIQUE(job_id, email)` - Same candidate can apply to multiple jobs
- **Index**: Recommended on `job_id`, `status`, `current_stage`

#### Status Values
- `active` - Active in recruitment pipeline
- `rejected` - Application rejected
- `hired` - Successfully hired
- `withdrawn` - Candidate withdrew

#### Source Values
- `linkedin` - Applied via LinkedIn integration
- `direct` - Direct application
- `referral` - Employee referral
- `portal` - External career portal

---

### 4. `candidate_documents` Table
**Purpose**: Stores candidate document attachments

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `id` | UUID/SERIAL | PRIMARY KEY | Document ID |
| `candidate_id` | UUID | NOT NULL, FK → candidates(id) | Associated candidate |
| `document_type` | VARCHAR(50) | NOT NULL | Type: `resume`, `certificate`, `cover_letter`, `portfolio` |
| `file_name` | VARCHAR(255) | NOT NULL | Original filename |
| `blob_url` | TEXT | NOT NULL | Azure Blob Storage URL |
| `file_size` | INTEGER | - | File size in bytes |
| `uploaded_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Upload timestamp |

#### Constraints
- **Foreign Key**: `candidate_id` → `candidates(id)` ON DELETE CASCADE

#### Document Types
- `resume` - CV/Resume
- `certificate` - Certifications, diplomas
- `cover_letter` - Cover letter
- `portfolio` - Portfolio/work samples

---

### 5. `candidate_communications` Table
**Purpose**: Audit log for all candidate interactions

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `id` | UUID/SERIAL | PRIMARY KEY | Communication ID |
| `candidate_id` | UUID | NOT NULL, FK → candidates(id) | Associated candidate |
| `communication_type` | VARCHAR(50) | NOT NULL | Type: `email`, `call`, `message` |
| `subject` | VARCHAR(255) | - | Email subject or call topic |
| `content` | TEXT | - | Message content or call notes |
| `sent_by_user_id` | UUID | - | User who sent/logged communication |
| `sent_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Communication timestamp |

#### Constraints
- **Foreign Key**: `candidate_id` → `candidates(id)` ON DELETE CASCADE

#### Communication Types
- `email` - Email correspondence
- `call` - Phone call log
- `message` - In-app message or SMS

---

### 6. `candidate_stage_history` Table
**Purpose**: Complete audit trail of candidate pipeline progression

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `id` | UUID/SERIAL | PRIMARY KEY | History entry ID |
| `candidate_id` | UUID | NOT NULL, FK → candidates(id) | Associated candidate |
| `previous_stage` | VARCHAR(100) | - | Stage before change |
| `new_stage` | VARCHAR(100) | NOT NULL | Stage after change |
| `changed_by_user_id` | UUID | - | User who made the change |
| `notes` | TEXT | - | Optional notes about stage change |
| `changed_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Change timestamp |

#### Constraints
- **Foreign Key**: `candidate_id` → `candidates(id)` ON DELETE CASCADE
- **Index**: Recommended on `candidate_id`, `changed_at`

---

## Workflow & Approval Tables

### 7. `job_approvals` Table
**Purpose**: Job posting approval workflow tracking

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Approval request ID |
| `job_id` | UUID | NOT NULL, FK → jobs(id) | Associated job |
| `status` | VARCHAR(50) | NOT NULL, DEFAULT 'pending' | Approval status |
| `approver_id` | UUID | - | Assigned approver user ID |
| `decision_timestamp` | TIMESTAMP | - | When decision was made |
| `feedback_comments` | TEXT | - | Approver feedback |
| `modifications_made` | JSONB | - | Requested changes (JSON) |
| `escalation_reason` | TEXT | - | Reason for escalation |
| `sla_deadline` | TIMESTAMP | - | Approval SLA deadline |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Request creation |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update |

#### Constraints
- **Foreign Key**: `job_id` → `jobs(id)` ON DELETE CASCADE
- **Check Constraint**: `status IN ('pending', 'approved', 'rejected', 'escalated', 'conditional')`

#### Status Values
- `pending` - Awaiting approval decision
- `approved` - Job approved for publishing
- `rejected` - Job posting rejected
- `escalated` - Escalated to higher authority
- `conditional` - Approved with modifications required

---

### 8. `approval_history` Table
**Purpose**: Complete audit log of approval workflow actions

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | History entry ID |
| `job_id` | UUID | NOT NULL, FK → jobs(id) | Associated job |
| `approval_id` | UUID | FK → job_approvals(id) | Related approval request |
| `action` | VARCHAR(100) | NOT NULL | Action taken |
| `user_id` | UUID | - | User who performed action |
| `user_role` | VARCHAR(50) | - | User's role at time of action |
| `details` | JSONB | - | Additional action details (JSON) |
| `timestamp` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Action timestamp |

#### Constraints
- **Foreign Key**: `job_id` → `jobs(id)` ON DELETE CASCADE
- **Foreign Key**: `approval_id` → `job_approvals(id)` ON DELETE SET NULL

---

## Integration Tables

### 9. `linkedin_sync_status` Table
**Purpose**: LinkedIn job posting integration tracking

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `job_id` | UUID | PRIMARY KEY, FK → jobs(id) | Associated job |
| `linkedin_job_id` | VARCHAR(255) | - | LinkedIn's job ID |
| `sync_status` | VARCHAR(50) | DEFAULT 'pending' | Sync status |
| `auto_posted` | BOOLEAN | DEFAULT false | Auto-posted after approval |
| `posted_at` | TIMESTAMP | - | When posted to LinkedIn |
| `last_sync_at` | TIMESTAMP | - | Last synchronization |
| `sync_error` | TEXT | - | Error message if sync failed |
| `retry_count` | INTEGER | DEFAULT 0 | Number of retry attempts |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation |
| `updated_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update |

#### Constraints
- **Foreign Key**: `job_id` → `jobs(id)` ON DELETE CASCADE
- **Unique Constraint**: `UNIQUE(job_id)` - One LinkedIn sync per job

#### Sync Status Values
- `pending` - Awaiting sync
- `success` - Successfully posted
- `failed` - Sync failed
- `retrying` - Retry in progress

---

## Table Relationships

### Entity Relationship Diagram (ERD)

```
┌─────────────────┐
│      jobs       │
│  (Primary Table)│
└────────┬────────┘
         │
         ├──────────────────┬──────────────────┬──────────────────┬─────────────────┐
         │                  │                  │                  │                 │
         ▼                  ▼                  ▼                  ▼                 ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐  ┌─────────────────┐
│  candidates     │  │job_pipeline_    │  │ job_approvals   │  │ approval_    │  │linkedin_sync_   │
│                 │  │    stages       │  │                 │  │   history    │  │    status       │
└────────┬────────┘  └─────────────────┘  └─────────────────┘  └──────────────┘  └─────────────────┘
         │
         ├──────────────────┬──────────────────┬──────────────────┐
         │                  │                  │                  │
         ▼                  ▼                  ▼                  ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│candidate_       │  │candidate_       │  │candidate_stage_ │
│  documents      │  │communications   │  │    history      │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

### Relationship Details

#### One-to-Many Relationships
1. **jobs → candidates**: One job has many candidate applications
2. **jobs → job_pipeline_stages**: One job has many pipeline stages (typically 6-10)
3. **jobs → job_approvals**: One job can have multiple approval requests
4. **jobs → approval_history**: One job has many approval history entries
5. **candidates → candidate_documents**: One candidate has many documents
6. **candidates → candidate_communications**: One candidate has many communications
7. **candidates → candidate_stage_history**: One candidate has many stage changes

#### One-to-One Relationships
1. **jobs → linkedin_sync_status**: One job has one LinkedIn sync record

---

## API Patterns

### Candidate Stage API (Based on Provided Diagram)

#### 1. Get Candidates
**Endpoint**: `GET /api/candidates`
**Query Parameters**:
- `jobId` - Filter by specific job
- `status` - Filter by candidate status
- `source` - Filter by application source
- `search` - Search by name/email

**Response**:
```javascript
{
  candidates: [
    {
      id: "abc123",
      jobId: "job-uuid",
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      phone: "+1234567890",
      currentStage: "Interview",
      status: "active",
      source: "linkedin",
      documentCount: 2,
      communicationCount: 5,
      createdAt: "2025-11-01T10:00:00Z"
    }
  ]
}
```

#### 2. Get Candidate by ID
**Endpoint**: `GET /api/candidates/:id`

**Response**:
```javascript
{
  id: "abc123",
  jobId: "job-uuid",
  firstName: "John",
  lastName: "Doe",
  email: "john@example.com",
  currentStage: "Interview",
  documents: [
    {
      id: "doc1",
      documentType: "resume",
      fileName: "john_doe_resume.pdf",
      blobUrl: "https://blob.azure.com/...",
      uploadedAt: "2025-11-01T10:00:00Z"
    }
  ],
  communications: [
    {
      id: "comm1",
      communicationType: "email",
      subject: "Interview Invitation",
      content: "...",
      sentByUserId: "user123",
      sentAt: "2025-11-02T14:00:00Z"
    }
  ],
  stageHistory: [
    {
      id: "hist1",
      previousStage: "Screening",
      newStage: "Interview",
      changedByUserId: "user123",
      notes: "Strong technical background",
      changedAt: "2025-11-03T09:00:00Z"
    }
  ]
}
```

#### 3. Create Candidate
**Endpoint**: `POST /api/candidates`

**Request Body**:
```javascript
{
  jobId: "job-uuid",
  firstName: "Jane",
  lastName: "Smith",
  email: "jane@example.com",
  phone: "+1987654321",
  currentStage: "Screening",
  source: "direct",
  resumeUrl: "https://blob.azure.com/resumes/jane_smith.pdf"
}
```

#### 4. Update Candidate
**Endpoint**: `PUT /api/candidates/:id`

**Request Body** (partial update supported):
```javascript
{
  phone: "+1555555555",
  status: "active"
}
```

#### 5. Move Candidate to Stage
**Endpoint**: `PUT /api/candidates/:id/stage`

**Request Body**:
```javascript
{
  newStage: "Offer",
  notes: "Excellent interview performance",
  userId: "recruiter-uuid"
}
```

**Logic**:
1. Validates candidate exists
2. Records current stage to `previous_stage`
3. Updates `candidates.current_stage`
4. Inserts audit record into `candidate_stage_history`
5. Returns updated candidate

#### 6. Add Candidate Document
**Endpoint**: `POST /api/candidates/:id/documents`

**Request Body**:
```javascript
{
  documentType: "certificate",
  fileName: "aws_certification.pdf",
  blobUrl: "https://blob.azure.com/docs/cert.pdf",
  fileSize: 524288
}
```

#### 7. Add Communication Log
**Endpoint**: `POST /api/candidates/:id/communications`

**Request Body**:
```javascript
{
  communicationType: "call",
  subject: "Technical screening call",
  content: "Discussed React experience. Strong understanding of hooks and state management.",
  sentByUserId: "recruiter-uuid"
}
```

---

## Data Flow Diagrams

### Job Creation & Approval Flow

```
┌──────────────┐
│ Client/HR    │
│ Creates Job  │
└──────┬───────┘
       │
       ▼
┌──────────────────────┐
│ jobs table           │
│ status = 'draft'     │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ job_approvals        │
│ status = 'pending'   │
└──────┬───────────────┘
       │
       ├────────── Rejected ──────► approval_history (log)
       │
       ▼ Approved
┌──────────────────────┐
│ jobs table           │
│ status = 'published' │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ linkedin_sync_status │
│ Auto-post if enabled │
└──────────────────────┘
```

### Candidate Pipeline Flow

```
┌─────────────────┐
│ Candidate       │
│ Applies to Job  │
└────────┬────────┘
         │
         ▼
┌────────────────────────────┐
│ candidates                 │
│ current_stage = 'Screening'│
└────────┬───────────────────┘
         │
         ▼
    ┌────────────────────────────┐
    │ Stage Progression Loop:    │
    │ 1. Recruiter moves stage   │
    │ 2. Update current_stage    │
    │ 3. Log to stage_history    │
    │ 4. Add communication notes │
    └────────┬───────────────────┘
             │
             ├──► Screening
             ├──► Shortlist
             ├──► Client Endorsement
             ├──► [Custom Stages...]
             ├──► Offer
             └──► Offer Accepted
                       │
                       ▼
                ┌──────────────┐
                │ status =     │
                │ 'hired'      │
                └──────────────┘
```

### Document Upload Flow

```
┌──────────────┐
│ User Uploads │
│ Document     │
└──────┬───────┘
       │
       ▼
┌──────────────────────┐
│ Azure Blob Storage   │
│ Returns blob_url     │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ candidate_documents  │
│ Stores metadata      │
└──────────────────────┘
```

---

## Index Recommendations

### Critical Indexes (Already Implemented)
```sql
-- job_pipeline_stages
CREATE INDEX idx_pipeline_job_id ON job_pipeline_stages(job_id);

-- Primary keys (auto-indexed)
```

### Recommended Additional Indexes
```sql
-- jobs table
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_employment_type ON jobs(employment_type);
CREATE INDEX idx_jobs_created_at ON jobs(created_at DESC);

-- candidates table
CREATE INDEX idx_candidates_job_id ON candidates(job_id);
CREATE INDEX idx_candidates_status ON candidates(status);
CREATE INDEX idx_candidates_current_stage ON candidates(current_stage);
CREATE INDEX idx_candidates_email ON candidates(email);

-- candidate_stage_history
CREATE INDEX idx_stage_history_candidate ON candidate_stage_history(candidate_id);
CREATE INDEX idx_stage_history_changed_at ON candidate_stage_history(changed_at DESC);

-- candidate_communications
CREATE INDEX idx_comms_candidate ON candidate_communications(candidate_id);
CREATE INDEX idx_comms_sent_at ON candidate_communications(sent_at DESC);

-- candidate_documents
CREATE INDEX idx_docs_candidate ON candidate_documents(candidate_id);
```

---

## Data Integrity Rules

### Constraints Summary
1. **Cascading Deletes**:
   - Deleting a job → Deletes all related candidates, pipeline stages, approvals, LinkedIn sync
   - Deleting a candidate → Deletes all related documents, communications, stage history

2. **Unique Constraints**:
   - `(job_id, stage_order)` in job_pipeline_stages - No duplicate stage orders per job
   - `(job_id, email)` in candidates - Same email can apply to different jobs
   - `job_id` in linkedin_sync_status - One LinkedIn sync per job

3. **Check Constraints**:
   - job_approvals.status must be in allowed values

4. **Default Values**:
   - Status fields default to 'active', 'pending', or 'draft'
   - Timestamps default to CURRENT_TIMESTAMP
   - Boolean flags default to false

---

## Migration History

### Schema Evolution
1. **Initial Schema** (`setup-db.js`):
   - Basic jobs table with 18 columns
   - Status, employment_type, location fields

2. **Employment Type Expansion** (`update-schema.js`):
   - Added 20+ employment-type-specific columns
   - Created job_pipeline_stages table
   - Added location breakdown (city, country)

3. **Approval Workflow** (`create-approval-tables.js`):
   - Created job_approvals table
   - Created approval_history table
   - Added JSONB support for flexible data

4. **Candidate Management** (Service layer):
   - candidates table (inferred from API usage)
   - candidate_documents table
   - candidate_communications table
   - candidate_stage_history table

5. **LinkedIn Integration** (Service layer):
   - linkedin_sync_status table
   - Retry logic and error tracking

---

## Best Practices & Usage Notes

### Status Management
- **Frontend Display**: `'published'` status → Display as `'active'` with green badge
- **Backend**: Use `COALESCE(status, 'published')` for NULL-safe queries
- **Filtering**: Support both `status` and legacy `job_status` column

### Employment Type Normalization
- **Storage**: `contract`, `partTime`, `fullTime`, `eor`
- **Display**: "Contract", "Part-Time", "Full-Time", "EOR"
- **Queries**: Use `LOWER(REPLACE(employment_type, '-', ''))` for case-insensitive matching

### Candidate Pipeline
- **Fixed Stages**: Top 3 and bottom 2 stages cannot be removed
- **Custom Stages**: Unlimited middle stages, draggable
- **Stage History**: Always log stage changes with `changed_by_user_id` and `notes`

### Document Management
- **Storage**: Azure Blob Storage (external)
- **Database**: Metadata only (URLs, filenames, sizes)
- **Security**: Ensure blob_url contains SAS tokens for secure access

### Communication Logging
- **Audit Trail**: Log ALL candidate interactions (emails, calls, messages)
- **User Attribution**: Always include `sent_by_user_id`
- **Searchability**: Store full content for future search/AI analysis

---

## Security Considerations

### Data Protection
1. **PII Fields**: `candidates` table contains sensitive personal data
   - Implement encryption at rest (Azure PostgreSQL native)
   - Use SSL/TLS for all database connections
   - Audit access logs

2. **GDPR Compliance**:
   - Candidate data deletion must cascade to all related tables
   - Support for "right to be forgotten" via CASCADE DELETE
   - Track data access in approval_history and candidate_communications

3. **Access Control**:
   - Role-based permissions (client_admin, client_hr, recruiter)
   - Audit trail in approval_history for compliance

### Query Safety
- All API endpoints use parameterized queries (SQL injection protection)
- JSONB columns validated before storage
- File uploads validated for type and size

---

## Performance Optimization

### Query Patterns
1. **Job Listing**: Filter by employment_type + status + search
2. **Candidate Pipeline**: GROUP BY stage + COUNT aggregations
3. **Audit Logs**: ORDER BY timestamp DESC with pagination

### Caching Strategy
- Cache job listings (5-minute TTL)
- Invalidate on status changes or new job creation
- Real-time updates for candidate stage changes

---

## Future Enhancements (Phase 2)

### Planned Tables
1. **candidate_assessments**: Store technical assessment results
2. **interview_schedules**: Calendar integration for interviews
3. **offer_letters**: Template management and e-signature tracking
4. **analytics_events**: Granular event tracking for AI/ML

### Planned Columns
1. **jobs.ai_match_score**: AI-powered candidate matching
2. **candidates.sentiment_score**: Communication sentiment analysis
3. **candidates.engagement_score**: Candidate interaction tracking

---

## Document Revision History
| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-11-17 | Initial comprehensive documentation | System |

---

**End of Document**
