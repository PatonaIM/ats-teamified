# ATS Pipeline Substage Integration Guide

## Overview
This document provides the complete reference for all pipeline stages and their substages in the Multi-Employment ATS system. **Substages are now stored in the PostgreSQL database** for flexible management.

---

## Database Schema

### Candidates Table
- **Field:** `candidate_substage`
- **Type:** `VARCHAR(100)` (nullable)
- **Description:** Stores the current substage ID for granular progress tracking

### Pipeline Substages Table
```sql
CREATE TABLE pipeline_substages (
  id SERIAL PRIMARY KEY,
  stage_name VARCHAR(100) NOT NULL,
  substage_id VARCHAR(100) NOT NULL,
  substage_label VARCHAR(255) NOT NULL,
  substage_order INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_stage_substage UNIQUE(stage_name, substage_id),
  CONSTRAINT unique_stage_order UNIQUE(stage_name, substage_order)
);

CREATE INDEX idx_substages_stage_name ON pipeline_substages(stage_name);
CREATE INDEX idx_substages_order ON pipeline_substages(stage_name, substage_order);
```

**Key Fields:**
- `stage_name`: The pipeline stage this substage belongs to
- `substage_id`: Unique identifier (snake_case, e.g., "resume_review")
- `substage_label`: Display label (e.g., "Resume Review")
- `substage_order`: Order within the stage (1-5)

---

## API Endpoints

### 1. Get Substages for a Stage
```
GET /api/substages/:stageName
```
**Example:** `GET /api/substages/Screening`

**Response:**
```json
{
  "stageName": "Screening",
  "substages": [
    { "id": "application_received", "label": "Application Received", "order": 1 },
    { "id": "resume_review", "label": "Resume Review", "order": 2 },
    { "id": "initial_assessment", "label": "Initial Assessment", "order": 3 },
    { "id": "phone_screen_scheduled", "label": "Phone Screen Scheduled", "order": 4 },
    { "id": "phone_screen_completed", "label": "Phone Screen Completed", "order": 5 }
  ]
}
```

**Note:** Stages without substages (e.g., Client Endorsement) return an empty array:
```json
{
  "stageName": "Client Endorsement",
  "substages": []
}
```

### 2. Update Candidate Substage
```
PATCH /api/candidates/:id/substage
```
**Request Body:**
```json
{
  "substage": "resume_review",
  "userId": "user-123",
  "userRole": "recruiter"
}
```
**Response:** Updated candidate object with `candidate_substage` field

**Validation:** Backend validates that the substage exists in the database for the candidate's current stage.

---

## Database Management

### Query All Substages
```sql
SELECT stage_name, substage_id, substage_label, substage_order
FROM pipeline_substages
ORDER BY stage_name, substage_order;
```

### Add New Substage
```sql
INSERT INTO pipeline_substages (stage_name, substage_id, substage_label, substage_order)
VALUES ('Screening', 'new_substage_id', 'New Substage Label', 6)
ON CONFLICT (stage_name, substage_id) DO NOTHING;
```

### Update Substage Label
```sql
UPDATE pipeline_substages
SET substage_label = 'Updated Label'
WHERE stage_name = 'Screening' AND substage_id = 'resume_review';
```

### Delete Substage
```sql
DELETE FROM pipeline_substages
WHERE stage_name = 'Screening' AND substage_id = 'old_substage_id';
```

### Get Substages Count Per Stage
```sql
SELECT stage_name, COUNT(*) as substage_count
FROM pipeline_substages
GROUP BY stage_name
ORDER BY stage_name;
```

---

## Current Stage & Substage Configuration

### Stages WITH Substages (7 stages, 5 substages each)

| Stage | Total Substages |
|-------|-----------------|
| Screening | 5 |
| Shortlist | 5 |
| Technical Assessment | 5 |
| Human Interview | 5 |
| Final Interview | 5 |
| AI Interview | 5 |
| Offer | 5 |

### Stages WITHOUT Substages
- **Client Endorsement** - No substage tracking

---

## Complete Stage & Substage Reference

### Stage 1: Screening
| Order | Substage ID | Display Label |
|-------|-------------|---------------|
| 1 | `application_received` | Application Received |
| 2 | `resume_review` | Resume Review |
| 3 | `initial_assessment` | Initial Assessment |
| 4 | `phone_screen_scheduled` | Phone Screen Scheduled |
| 5 | `phone_screen_completed` | Phone Screen Completed |

### Stage 2: Shortlist
| Order | Substage ID | Display Label |
|-------|-------------|---------------|
| 1 | `under_review` | Under Review |
| 2 | `pending_interview` | Pending Interview |
| 3 | `interview_scheduled` | Interview Scheduled |
| 4 | `interview_completed` | Interview Completed |
| 5 | `awaiting_feedback` | Awaiting Feedback |

### Stage 3: Technical Assessment
| Order | Substage ID | Display Label |
|-------|-------------|---------------|
| 1 | `assessment_sent` | Assessment Sent |
| 2 | `assessment_in_progress` | Assessment In Progress |
| 3 | `assessment_submitted` | Assessment Submitted |
| 4 | `pending_review` | Pending Assessment Review |
| 5 | `assessment_completed` | Assessment Completed |

### Stage 4: Human Interview
| Order | Substage ID | Display Label |
|-------|-------------|---------------|
| 1 | `interviewer_assigned` | Interviewer Assigned |
| 2 | `interview_scheduled` | Interview Scheduled |
| 3 | `interview_in_progress` | Interview In Progress |
| 4 | `interview_completed` | Interview Completed |
| 5 | `feedback_submitted` | Feedback Submitted |

### Stage 5: Final Interview
| Order | Substage ID | Display Label |
|-------|-------------|---------------|
| 1 | `interview_prep` | Interview Preparation |
| 2 | `interview_scheduled` | Interview Scheduled |
| 3 | `interview_in_progress` | Interview In Progress |
| 4 | `interview_completed` | Interview Completed |
| 5 | `decision_pending` | Decision Pending |

### Stage 6: AI Interview
| Order | Substage ID | Display Label |
|-------|-------------|---------------|
| 1 | `ai_interview_sent` | AI Interview Sent |
| 2 | `ai_interview_started` | AI Interview Started |
| 3 | `ai_interview_completed` | AI Interview Completed |
| 4 | `ai_analysis_in_progress` | AI Analysis In Progress |
| 5 | `ai_results_ready` | AI Results Ready |

### Stage 7: Offer
| Order | Substage ID | Display Label |
|-------|-------------|---------------|
| 1 | `offer_preparation` | Offer Preparation |
| 2 | `offer_approval` | Offer Approval |
| 3 | `offer_sent` | Offer Sent |
| 4 | `candidate_reviewing` | Candidate Reviewing Offer |
| 5 | `negotiation` | Negotiation |

---

## Role-Based Permissions

### View-Only Stages (Clients)
Clients can **view but not modify** substages in these stages:
- Screening
- Shortlist
- Offer

### Full Access (Recruiters/Managers)
Recruiters and Recruiter Managers have full read/write access to all substages.

---

## Integration Best Practices

### 1. Fetching Substages (Database-Backed)
```javascript
// Fetch substages when displaying a stage
const response = await fetch(`/api/substages/${stageName}`);
const { substages } = await response.json();

// Handle stages without substages
if (substages.length === 0) {
  // This stage doesn't have substage tracking
  console.log('No substages for', stageName);
}
```

### 2. Updating Substages
```javascript
// Update candidate's substage
await fetch(`/api/candidates/${candidateId}/substage`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    substage: 'resume_review',
    userId: currentUser.id,
    userRole: currentUser.role
  })
});
```

### 3. Displaying Progress
```javascript
// Calculate progress percentage
const currentOrder = substages.find(s => s.id === candidate.candidate_substage)?.order || 0;
const progressPercent = (currentOrder / substages.length) * 100;
```

### 4. Error Handling
- **403 Forbidden:** User doesn't have permission to update substage
- **400 Bad Request:** Invalid substage ID for the given stage
- **404 Not Found:** Candidate not found

---

## Benefits of Database Storage

✅ **Dynamic Management:** Add/update substages without code deployment  
✅ **Data Integrity:** Database constraints ensure data consistency  
✅ **Flexibility:** Can customize substages per client in the future  
✅ **Audit Trail:** Timestamps track when substages were created  
✅ **Scalability:** Easy to query and analyze substage usage  

---

## Notes
- Substages are stored in PostgreSQL `pipeline_substages` table
- Most stages have exactly **5 substages**
- **Client Endorsement** has NO substages (returns empty array)
- Substage IDs use **snake_case** format
- Display labels use **Title Case** format
- The `order` field indicates progression sequence (1-5)
- Unique constraints prevent duplicate substages per stage

---

**Last Updated:** November 2025  
**Version:** 2.0 (Database-Backed)  
**Contact:** ATS Development Team
