# Auto-Transition Rules for All Pipeline Stages

## Overview
The Auto-Transition Service automatically progresses candidates through substages based on database field changes, timestamps, and business logic. This eliminates manual substage updates and ensures consistent workflow progression across all 9 pipeline stages.

**Status:** ✅ Implemented for ALL stages

---

## How Auto-Transitions Work

### Trigger Methods
1. **Manual API Call** - POST `/api/auto-transition/run`
2. **Time-Based Check** - POST `/api/auto-transition/time-based` (interviews, deadlines)
3. **Scheduled Cron Job** - Run every 5-15 minutes (recommended for production)
4. **Event-Driven** - Triggered after specific API calls (future enhancement)

### Detection Logic
For each substage transition, the system checks:
- **Database Indicators** - Specific fields populated (e.g., `resume_url IS NOT NULL`)
- **Timestamp Checks** - Time elapsed since last update (e.g., `24 hours`)
- **Status Fields** - Enum values indicating completion (e.g., `ai_analysis_status = 'completed'`)

---

## Stage 1: Screening (5 Substages)

### 1.1: application_received → resume_review
**Trigger:** Resume uploaded
**Detection:**
```sql
SELECT * FROM candidates
WHERE current_stage = 'Screening'
AND candidate_substage = 'application_received'
AND resume_url IS NOT NULL;
```
**Auto-Set:** `candidate_substage = 'resume_review'`

### 1.2: resume_review → initial_assessment
**Trigger:** 24 hours elapsed since last update
**Detection:**
```sql
SELECT * FROM candidates
WHERE current_stage = 'Screening'
AND candidate_substage = 'resume_review'
AND updated_at < NOW() - INTERVAL '24 hours';
```
**Auto-Set:** `candidate_substage = 'initial_assessment'`

### 1.3-1.5: Manual Progression
- `phone_screen_scheduled` - Manual (recruiter schedules call)
- `phone_screen_completed` - Manual (recruiter marks complete)

---

## Stage 2: Shortlist (5 Substages)

### 2.1: under_review → pending_interview
**Trigger:** 48 hours elapsed since entering shortlist
**Detection:**
```sql
SELECT * FROM candidates
WHERE current_stage = 'Shortlist'
AND candidate_substage = 'under_review'
AND updated_at < NOW() - INTERVAL '48 hours';
```
**Auto-Set:** `candidate_substage = 'pending_interview'`

### 2.2-2.5: Manual Progression
- `interview_scheduled` - Manual (recruiter assigns slot)
- `interview_completed` - Manual (recruiter confirms)
- `awaiting_feedback` - Manual (after interview)

---

## Stage 3: Technical Assessment (5 Substages)

### 3.1: assessment_sent → assessment_in_progress
**Trigger:** Candidate starts assessment
**Detection:**
```sql
SELECT * FROM candidates
WHERE current_stage = 'Technical Assessment'
AND candidate_substage = 'assessment_sent'
AND assessment_started_at IS NOT NULL;
```
**Auto-Set:** `candidate_substage = 'assessment_in_progress'`

### 3.2: assessment_in_progress → assessment_submitted
**Trigger:** Candidate submits responses
**Detection:**
```sql
SELECT * FROM candidates
WHERE current_stage = 'Technical Assessment'
AND candidate_substage = 'assessment_in_progress'
AND assessment_submitted_at IS NOT NULL;
```
**Auto-Set:** `candidate_substage = 'assessment_submitted'`

### 3.3: assessment_submitted → pending_review
**Trigger:** AUTOMATIC (immediately after submission if no auto-grading)
**Detection:**
```sql
SELECT * FROM candidates
WHERE current_stage = 'Technical Assessment'
AND candidate_substage = 'assessment_submitted'
AND assessment_submitted_at IS NOT NULL
AND assessment_score IS NULL;
```
**Auto-Set:** `candidate_substage = 'pending_review'`

### 3.4: pending_review → assessment_completed
**Trigger:** Reviewer assigns score
**Detection:**
```sql
SELECT * FROM candidates
WHERE current_stage = 'Technical Assessment'
AND candidate_substage = 'pending_review'
AND assessment_score IS NOT NULL;
```
**Auto-Set:** `candidate_substage = 'assessment_completed'`

---

## Stage 4: Human Interview (5 Substages)

### 4.1: interviewer_assigned → interview_scheduled
**Trigger:** Candidate selects time slot
**Detection:**
```sql
SELECT * FROM candidates
WHERE current_stage = 'Human Interview'
AND candidate_substage = 'interviewer_assigned'
AND selected_slot_id IS NOT NULL
AND meeting_link IS NOT NULL;
```
**Auto-Set:** `candidate_substage = 'interview_scheduled'`

### 4.2: interview_scheduled → interview_in_progress
**Trigger:** Interview start time reached (TIME-BASED)
**Detection:**
```sql
SELECT c.* FROM candidates c
JOIN interview_slots s ON c.selected_slot_id = s.id
WHERE c.current_stage = 'Human Interview'
AND c.candidate_substage = 'interview_scheduled'
AND s.start_time <= NOW()
AND s.end_time > NOW();
```
**Auto-Set:** `candidate_substage = 'interview_in_progress'`

### 4.3: interview_in_progress → interview_completed
**Trigger:** Recruiter marks complete
**Detection:**
```sql
SELECT * FROM candidates
WHERE current_stage = 'Human Interview'
AND candidate_substage = 'interview_in_progress'
AND interview_completed_at IS NOT NULL;
```
**Auto-Set:** `candidate_substage = 'interview_completed'`

### 4.4: interview_completed → feedback_submitted
**Trigger:** Feedback entered
**Detection:**
```sql
SELECT * FROM candidates
WHERE current_stage = 'Human Interview'
AND candidate_substage = 'interview_completed'
AND (interview_feedback IS NOT NULL OR interview_notes IS NOT NULL);
```
**Auto-Set:** `candidate_substage = 'feedback_submitted'`

---

## Stage 5: Final Interview (5 Substages)

### 5.1: interview_prep → interview_scheduled
**Trigger:** 24 hours elapsed since prep started
**Detection:**
```sql
SELECT * FROM candidates
WHERE current_stage = 'Final Interview'
AND candidate_substage = 'interview_prep'
AND updated_at < NOW() - INTERVAL '24 hours';
```
**Auto-Set:** `candidate_substage = 'interview_scheduled'`

### 5.2: interview_scheduled → interview_in_progress
**Trigger:** Interview time reached (15 minutes before scheduled time)
**Detection:**
```sql
SELECT * FROM candidates
WHERE current_stage = 'Final Interview'
AND candidate_substage = 'interview_scheduled'
AND interview_scheduled_at <= NOW() + INTERVAL '15 minutes'
AND interview_scheduled_at > NOW() - INTERVAL '2 hours';
```
**Auto-Set:** `candidate_substage = 'interview_in_progress'`

### 5.3: interview_in_progress → interview_completed
**Trigger:** Interview completion marked
**Detection:**
```sql
SELECT * FROM candidates
WHERE current_stage = 'Final Interview'
AND candidate_substage = 'interview_in_progress'
AND interview_completed_at IS NOT NULL;
```
**Auto-Set:** `candidate_substage = 'interview_completed'`

### 5.4: interview_completed → decision_pending
**Trigger:** 1 hour elapsed after completion
**Detection:**
```sql
SELECT * FROM candidates
WHERE current_stage = 'Final Interview'
AND candidate_substage = 'interview_completed'
AND interview_completed_at < NOW() - INTERVAL '1 hour';
```
**Auto-Set:** `candidate_substage = 'decision_pending'`

---

## Stage 6: AI Interview (5 Substages)

### 6.1: ai_interview_sent → ai_interview_started
**Trigger:** Candidate starts interview (manual button in MVP)
**Detection:**
```sql
SELECT * FROM candidates
WHERE current_stage IN ('AI Interview', 'Ai Interview')
AND candidate_substage = 'ai_interview_sent'
AND ai_interview_started_at IS NOT NULL;
```
**Auto-Set:** `candidate_substage = 'ai_interview_started'`

### 6.2: ai_interview_started → ai_interview_completed
**Trigger:** Candidate completes interview
**Detection:**
```sql
SELECT * FROM candidates
WHERE current_stage IN ('AI Interview', 'Ai Interview')
AND candidate_substage = 'ai_interview_started'
AND ai_interview_completed_at IS NOT NULL;
```
**Auto-Set:** `candidate_substage = 'ai_interview_completed'`

### 6.3: ai_interview_completed → ai_analysis_in_progress
**Trigger:** AUTOMATIC (immediately after completion)
**Detection:**
```sql
SELECT * FROM candidates
WHERE current_stage IN ('AI Interview', 'Ai Interview')
AND candidate_substage = 'ai_interview_completed'
AND ai_analysis_status = 'processing';
```
**Auto-Set:** `candidate_substage = 'ai_analysis_in_progress'`

### 6.4: ai_analysis_in_progress → ai_results_ready
**Trigger:** AUTOMATIC (after 2-second mock processing)
**Detection:**
```sql
SELECT * FROM candidates
WHERE current_stage IN ('AI Interview', 'Ai Interview')
AND candidate_substage = 'ai_analysis_in_progress'
AND ai_analysis_status = 'completed';
```
**Auto-Set:** `candidate_substage = 'ai_results_ready'`

---

## Stage 7: Offer (5 Substages)

### 7.1: offer_preparation → offer_approval
**Trigger:** 12 hours elapsed
**Detection:**
```sql
SELECT * FROM candidates
WHERE current_stage = 'Offer'
AND candidate_substage = 'offer_preparation'
AND updated_at < NOW() - INTERVAL '12 hours';
```
**Auto-Set:** `candidate_substage = 'offer_approval'`

### 7.2: offer_approval → offer_sent
**Trigger:** 24 hours elapsed (assumes approval granted)
**Detection:**
```sql
SELECT * FROM candidates
WHERE current_stage = 'Offer'
AND candidate_substage = 'offer_approval'
AND updated_at < NOW() - INTERVAL '24 hours';
```
**Auto-Set:** `candidate_substage = 'offer_sent'`

### 7.3: offer_sent → candidate_reviewing
**Trigger:** 48 hours elapsed (candidate likely reviewing)
**Detection:**
```sql
SELECT * FROM candidates
WHERE current_stage = 'Offer'
AND candidate_substage = 'offer_sent'
AND updated_at < NOW() - INTERVAL '48 hours';
```
**Auto-Set:** `candidate_substage = 'candidate_reviewing'`

### 7.4-7.5: Manual Progression
- `negotiation` - Manual (recruiter marks when negotiation starts)

---

## Stage 8: Client Endorsement (2 Substages)

### 8.1: client_review_pending → client_reviewing
**Trigger:** Client views candidate profile
**Detection:**
```sql
SELECT * FROM candidates
WHERE current_stage = 'Client Endorsement'
AND candidate_substage = 'client_review_pending'
AND client_viewed_at IS NOT NULL;
```
**Auto-Set:** `candidate_substage = 'client_reviewing'`

---

## Stage 9: Offer Accepted (5 Substages)

### 9.1: offer_accepted → background_check
**Trigger:** 1 day elapsed after offer acceptance
**Detection:**
```sql
SELECT * FROM candidates
WHERE current_stage = 'Offer Accepted'
AND candidate_substage = 'offer_accepted'
AND updated_at < NOW() - INTERVAL '1 day';
```
**Auto-Set:** `candidate_substage = 'background_check'`

### 9.2: background_check → documentation
**Trigger:** 3 days elapsed (background check period)
**Detection:**
```sql
SELECT * FROM candidates
WHERE current_stage = 'Offer Accepted'
AND candidate_substage = 'background_check'
AND updated_at < NOW() - INTERVAL '3 days';
```
**Auto-Set:** `candidate_substage = 'documentation'`

### 9.3: documentation → onboarding_prep
**Trigger:** 2 days elapsed (document collection)
**Detection:**
```sql
SELECT * FROM candidates
WHERE current_stage = 'Offer Accepted'
AND candidate_substage = 'documentation'
AND updated_at < NOW() - INTERVAL '2 days';
```
**Auto-Set:** `candidate_substage = 'onboarding_prep'`

### 9.4: onboarding_prep → ready_to_start
**Trigger:** 5 days elapsed (onboarding materials prepared)
**Detection:**
```sql
SELECT * FROM candidates
WHERE current_stage = 'Offer Accepted'
AND candidate_substage = 'onboarding_prep'
AND updated_at < NOW() - INTERVAL '5 days';
```
**Auto-Set:** `candidate_substage = 'ready_to_start'`

---

## API Usage

### Run All Auto-Transitions
```bash
POST /api/auto-transition/run

Response:
{
  "success": true,
  "message": "Auto-transition check completed. 15 candidates transitioned.",
  "results": {
    "screening": 3,
    "shortlist": 2,
    "technicalAssessment": 1,
    "humanInterview": 4,
    "finalInterview": 0,
    "aiInterview": 2,
    "offer": 1,
    "clientEndorsement": 1,
    "offerAccepted": 1
  },
  "timestamp": "2025-11-21T03:00:00.000Z"
}
```

### Run Time-Based Checks Only
```bash
POST /api/auto-transition/time-based

Response:
{
  "success": true,
  "message": "Time-based transition check completed",
  "timestamp": "2025-11-21T03:00:00.000Z"
}
```

### Get Stale Candidates
```bash
GET /api/auto-transition/stale

Response:
{
  "success": true,
  "count": 5,
  "candidates": [
    {
      "id": "uuid",
      "current_stage": "Screening",
      "candidate_substage": "resume_review",
      "updated_at": "2025-11-14T10:30:00.000Z"
    }
  ]
}
```

---

## Re-Entry Handling

When a candidate re-enters a stage (e.g., moves from Shortlist back to Screening), the system handles it correctly:

1. **Substage Reset**: `moveCandidateToStage()` automatically resets `candidate_substage` to the first substage of the new stage
2. **New Stage History Entry**: A fresh entry is added to `candidate_stage_history` with the current timestamp
3. **Auto-Transition Recalculation**: Auto-transitions use the MOST RECENT stage entry time (`ORDER BY changed_at DESC LIMIT 1`)

**Example:**
```
Day 1: Candidate enters Screening → stage_entry_time = Day 1
Day 5: Candidate moves to Shortlist
Day 10: Candidate moves BACK to Screening → stage_entry_time = Day 10 (NEW)
Day 12: Auto-transition runs → daysSinceStageEntry = 2 days (from Day 10, not Day 1)
```

This ensures candidates don't skip substages when re-entering stages.

---

## Production Setup

### Recommended Cron Schedule
```javascript
// Run full auto-transition check every 5 minutes
*/5 * * * * curl -X POST http://localhost:5000/api/auto-transition/run

// Run time-based checks every minute (for interviews)
* * * * * curl -X POST http://localhost:5000/api/auto-transition/time-based
```

### Node.js Scheduler (Alternative)
```javascript
import { autoTransitionService } from './services/auto-transition.js';

// Run every 5 minutes
setInterval(async () => {
  await autoTransitionService.checkAndTransitionAll();
}, 5 * 60 * 1000);

// Run time-based checks every minute
setInterval(async () => {
  await autoTransitionService.checkTimeBasedTransitions();
}, 60 * 1000);
```

---

## Summary Table

| Stage | Auto-Transitions | Manual Transitions | Key Triggers |
|-------|-----------------|-------------------|-------------|
| Screening | 2 | 3 | Resume upload, 24hr timer |
| Shortlist | 1 | 4 | 48hr timer |
| Technical Assessment | 4 | 1 | Field population, scores |
| Human Interview | 4 | 1 | Slot selection, timestamps, feedback |
| Final Interview | 4 | 1 | Timers, completion markers |
| AI Interview | 4 | 1 | Field population, analysis status |
| Offer | 3 | 2 | 12hr, 24hr, 48hr timers |
| Client Endorsement | 1 | 1 | Client view timestamp |
| Offer Accepted | 4 | 1 | 1day, 3day, 2day, 5day timers |

**Total:** 27 auto-transitions across 9 stages

---

## Monitoring & Logging

All auto-transitions log to console:
```
[AutoTransition] Starting auto-transition check for all stages...
[AutoTransition] Screening: Candidate abc123 → resume_review
[AutoTransition] Human Interview: Candidate def456 → interview_in_progress
[AutoTransition] Completed. Total transitions: 15
```

---

## Related Documentation
- [Human Interview Substages](./HUMAN_INTERVIEW_SUBSTAGES.md)
- [AI Interview Substages](./AI_INTERVIEW_SUBSTAGES.md)
- [Technical Assessment Substages](./ASSESSMENT_SUBSTAGES.md)
- [Client Endorsement Substages](./CLIENT_ENDORSEMENT_SUBSTAGES.md)
