# ATS Pipeline Substage Integration Guide

## Overview
This document provides the complete reference for all pipeline stages and their substages in the Multi-Employment ATS system. Use this for integrating with the candidate portal.

---

## Database Schema

### Candidates Table
- **Field:** `candidate_substage`
- **Type:** `VARCHAR(100)` (nullable)
- **Description:** Stores the current substage ID for granular progress tracking

---

## API Endpoints

### 1. Get Substages for a Stage
```
GET /api/substages/:stageName
```
**Response:**
```json
{
  "stageName": "Screening",
  "substages": [
    { "id": "application_received", "label": "Application Received", "order": 1 },
    { "id": "resume_review", "label": "Resume Review", "order": 2 },
    ...
  ]
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

### Stage 4: Client Endorsement
| Order | Substage ID | Display Label |
|-------|-------------|---------------|
| 1 | `prepared_for_client` | Prepared for Client Review |
| 2 | `sent_to_client` | Sent to Client |
| 3 | `client_reviewing` | Client Reviewing |
| 4 | `client_interview_scheduled` | Client Interview Scheduled |
| 5 | `awaiting_client_decision` | Awaiting Client Decision |

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

### Stage 8: Offer Accepted
| Order | Substage ID | Display Label |
|-------|-------------|---------------|
| 1 | `acceptance_confirmed` | Acceptance Confirmed |
| 2 | `background_check` | Background Check |
| 3 | `onboarding_prep` | Onboarding Preparation |
| 4 | `documents_pending` | Documents Pending |
| 5 | `ready_to_start` | Ready to Start |

---

## Role-Based Permissions

### View-Only Stages (Clients)
Clients can **view but not modify** substages in these stages:
- Screening
- Shortlist
- Client Endorsement
- Offer
- Offer Accepted

### Full Access (Recruiters/Managers)
Recruiters and Recruiter Managers have full read/write access to all substages.

---

## Integration Best Practices

### 1. Fetching Substages
```javascript
// Fetch substages when displaying a stage
const response = await fetch(`/api/substages/${stageName}`);
const { substages } = await response.json();
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
- **403 Forbidden:** User doesn't have permission to update substage (client role in restricted stage)
- **400 Bad Request:** Invalid substage ID for the given stage
- **404 Not Found:** Candidate not found

---

## Example Workflow

### Candidate Journey in "Screening" Stage:
1. **application_received** → Candidate applies
2. **resume_review** → Recruiter reviews resume
3. **initial_assessment** → Initial qualifications assessed
4. **phone_screen_scheduled** → Phone screen appointment set
5. **phone_screen_completed** → Phone screen done → Move to next stage

---

## JSON Reference (For API Integration)

```json
{
  "Screening": [
    { "id": "application_received", "label": "Application Received", "order": 1 },
    { "id": "resume_review", "label": "Resume Review", "order": 2 },
    { "id": "initial_assessment", "label": "Initial Assessment", "order": 3 },
    { "id": "phone_screen_scheduled", "label": "Phone Screen Scheduled", "order": 4 },
    { "id": "phone_screen_completed", "label": "Phone Screen Completed", "order": 5 }
  ],
  "Shortlist": [
    { "id": "under_review", "label": "Under Review", "order": 1 },
    { "id": "pending_interview", "label": "Pending Interview", "order": 2 },
    { "id": "interview_scheduled", "label": "Interview Scheduled", "order": 3 },
    { "id": "interview_completed", "label": "Interview Completed", "order": 4 },
    { "id": "awaiting_feedback", "label": "Awaiting Feedback", "order": 5 }
  ],
  "Technical Assessment": [
    { "id": "assessment_sent", "label": "Assessment Sent", "order": 1 },
    { "id": "assessment_in_progress", "label": "Assessment In Progress", "order": 2 },
    { "id": "assessment_submitted", "label": "Assessment Submitted", "order": 3 },
    { "id": "pending_review", "label": "Pending Assessment Review", "order": 4 },
    { "id": "assessment_completed", "label": "Assessment Completed", "order": 5 }
  ],
  "Client Endorsement": [
    { "id": "prepared_for_client", "label": "Prepared for Client Review", "order": 1 },
    { "id": "sent_to_client", "label": "Sent to Client", "order": 2 },
    { "id": "client_reviewing", "label": "Client Reviewing", "order": 3 },
    { "id": "client_interview_scheduled", "label": "Client Interview Scheduled", "order": 4 },
    { "id": "awaiting_client_decision", "label": "Awaiting Client Decision", "order": 5 }
  ],
  "Final Interview": [
    { "id": "interview_prep", "label": "Interview Preparation", "order": 1 },
    { "id": "interview_scheduled", "label": "Interview Scheduled", "order": 2 },
    { "id": "interview_in_progress", "label": "Interview In Progress", "order": 3 },
    { "id": "interview_completed", "label": "Interview Completed", "order": 4 },
    { "id": "decision_pending", "label": "Decision Pending", "order": 5 }
  ],
  "AI Interview": [
    { "id": "ai_interview_sent", "label": "AI Interview Sent", "order": 1 },
    { "id": "ai_interview_started", "label": "AI Interview Started", "order": 2 },
    { "id": "ai_interview_completed", "label": "AI Interview Completed", "order": 3 },
    { "id": "ai_analysis_in_progress", "label": "AI Analysis In Progress", "order": 4 },
    { "id": "ai_results_ready", "label": "AI Results Ready", "order": 5 }
  ],
  "Offer": [
    { "id": "offer_preparation", "label": "Offer Preparation", "order": 1 },
    { "id": "offer_approval", "label": "Offer Approval", "order": 2 },
    { "id": "offer_sent", "label": "Offer Sent", "order": 3 },
    { "id": "candidate_reviewing", "label": "Candidate Reviewing Offer", "order": 4 },
    { "id": "negotiation", "label": "Negotiation", "order": 5 }
  ],
  "Offer Accepted": [
    { "id": "acceptance_confirmed", "label": "Acceptance Confirmed", "order": 1 },
    { "id": "background_check", "label": "Background Check", "order": 2 },
    { "id": "onboarding_prep", "label": "Onboarding Preparation", "order": 3 },
    { "id": "documents_pending", "label": "Documents Pending", "order": 4 },
    { "id": "ready_to_start", "label": "Ready to Start", "order": 5 }
  ]
}
```

---

## Notes
- All substages are **static and predefined** - they cannot be modified or created dynamically
- Each stage always has exactly **5 substages**
- Substage IDs use **snake_case** format
- Display labels use **Title Case** format
- The `order` field indicates progression sequence (1-5)

---

**Last Updated:** November 2025  
**Version:** 1.0  
**Contact:** ATS Development Team
