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

## Stages WITHOUT Substages

The following stages do not have substage tracking:
- **Client Endorsement** - No substages (standard stage progression only)
- **Offer Accepted** - Stage removed from pipeline

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

### 1. Fetching Substages
```javascript
// Fetch substages when displaying a stage
const response = await fetch(`/api/substages/${stageName}`);
const { substages } = await response.json();

// Note: Some stages may return empty array if no substages defined
if (substages.length === 0) {
  // Handle stages without substages (e.g., Client Endorsement)
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
- **403 Forbidden:** User doesn't have permission to update substage (client role in restricted stage)
- **400 Bad Request:** Invalid substage ID for the given stage
- **404 Not Found:** Candidate not found

---

## Example Workflow

### Candidate Journey in "Human Interview" Stage:
1. **interviewer_assigned** → Interviewer assigned to candidate
2. **interview_scheduled** → Interview scheduled with date/time
3. **interview_in_progress** → Interview currently happening
4. **interview_completed** → Interview finished
5. **feedback_submitted** → Interviewer feedback recorded → Move to next stage

---

## Notes
- All substages are **static and predefined** - they cannot be modified or created dynamically
- Most stages have exactly **5 substages**
- **Client Endorsement** has NO substages (returns empty array)
- **Offer Accepted** stage has been removed from the system
- Substage IDs use **snake_case** format
- Display labels use **Title Case** format
- The `order` field indicates progression sequence (1-5)

---

**Last Updated:** November 2025  
**Version:** 1.2  
**Contact:** ATS Development Team
