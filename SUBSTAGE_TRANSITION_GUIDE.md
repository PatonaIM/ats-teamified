# ATS Substage Transition Guide

## Overview
This document explains the complete substage structure in the ATS system, how candidates transition between substages, and the data/business logic used to determine these transitions.

---

## Complete Substage Structure

### 🔍 Stage 1: Screening
| Order | Substage ID | Label | Progress | Transition Trigger | Data Indicator |
|-------|-------------|-------|----------|-------------------|----------------|
| 1 | `application_received` | Application Received | 20% | **Automatic** - Candidate applies | `created_at` timestamp exists |
| 2 | `resume_review` | Resume Review | 40% | **Manual** - Recruiter reviews resume | Recruiter opens candidate profile |
| 3 | `initial_assessment` | Initial Assessment | 60% | **Manual** - Recruiter completes assessment | Assessment score/notes added |
| 4 | `phone_screen_scheduled` | Phone Screen Scheduled | 80% | **Semi-Auto** - Phone screen booking created | `bookings` table entry with type='phone_screen' |
| 5 | `phone_screen_completed` | Phone Screen Completed | 100% | **Auto/Manual** - Booking marked complete | `booking.status = 'completed'` |

**Transition Logic:**
```javascript
// Auto-transition when application created
if (candidate.created_at) → application_received

// Manual transition when recruiter reviews
if (recruiterReviewedResume) → resume_review

// Auto-transition when phone screen booked
if (booking.type === 'phone_screen' && booking.status === 'scheduled') → phone_screen_scheduled

// Auto-transition when phone screen completed
if (booking.type === 'phone_screen' && booking.status === 'completed') → phone_screen_completed
```

---

### 📋 Stage 2: Shortlist
| Order | Substage ID | Label | Progress | Transition Trigger | Data Indicator |
|-------|-------------|-------|----------|-------------------|----------------|
| 1 | `under_review` | Under Review | 20% | **Manual** - Moved to Shortlist stage | Stage change timestamp |
| 2 | `pending_interview` | Pending Interview | 40% | **Manual** - Recruiter marks ready for interview | Status flag updated |
| 3 | `interview_scheduled` | Interview Scheduled | 60% | **Semi-Auto** - Interview booking created | `bookings` table entry exists |
| 4 | `interview_completed` | Interview Completed | 80% | **Auto** - Interview booking completed | `booking.status = 'completed'` |
| 5 | `awaiting_feedback` | Awaiting Feedback | 100% | **Auto** - Interview complete but no feedback | `interview_feedback` is NULL |

**Transition Logic:**
```javascript
// Auto-transition when interview scheduled
if (booking.type === 'interview' && booking.status === 'scheduled') → interview_scheduled

// Auto-transition when interview completed
if (booking.type === 'interview' && booking.status === 'completed') → interview_completed

// Auto-transition when feedback pending
if (booking.status === 'completed' && !interview_feedback) → awaiting_feedback
```

---

### 💻 Stage 3: Technical Assessment
| Order | Substage ID | Label | Progress | Transition Trigger | Data Indicator |
|-------|-------------|-------|----------|-------------------|----------------|
| 1 | `assessment_sent` | Assessment Sent | 20% | **Manual/Auto** - Assessment email sent | `assessment_sent_at` timestamp |
| 2 | `assessment_in_progress` | Assessment In Progress | 40% | **Auto** - Candidate opens assessment | `assessment_started_at` timestamp |
| 3 | `assessment_submitted` | Assessment Submitted | 60% | **Auto** - Candidate submits | `assessment_submitted_at` timestamp |
| 4 | `pending_review` | Pending Assessment Review | 80% | **Auto** - Submitted but no review | `assessment_score` is NULL |
| 5 | `assessment_completed` | Assessment Completed | 100% | **Auto/Manual** - Reviewer scores assessment | `assessment_score` exists |

**Transition Logic:**
```javascript
// Auto-transition when assessment sent
if (assessment_sent_at) → assessment_sent

// Auto-transition when candidate starts
if (assessment_started_at) → assessment_in_progress

// Auto-transition when submitted
if (assessment_submitted_at) → assessment_submitted

// Auto-transition to pending review
if (assessment_submitted_at && !assessment_score) → pending_review

// Auto-transition when scored
if (assessment_score !== null) → assessment_completed
```

---

### 👤 Stage 4: Human Interview
| Order | Substage ID | Label | Progress | Transition Trigger | Data Indicator |
|-------|-------------|-------|----------|-------------------|----------------|
| 1 | `interviewer_assigned` | Interviewer Assigned | 20% | **Manual** - Interviewer selected | `interviewer_id` assigned |
| 2 | `interview_scheduled` | Interview Scheduled | 40% | **Semi-Auto** - Interview booking created | `bookings.type = 'human_interview'` |
| 3 | `interview_in_progress` | Interview In Progress | 60% | **Auto** - Booking start time passed | `booking.start_time < NOW()` |
| 4 | `interview_completed` | Interview Completed | 80% | **Auto** - Booking end time passed | `booking.end_time < NOW()` |
| 5 | `feedback_submitted` | Feedback Submitted | 100% | **Auto** - Feedback form submitted | `interview_feedback` exists |

**Transition Logic:**
```javascript
// Manual assignment
if (interviewer_id) → interviewer_assigned

// Auto-transition when scheduled
if (booking.type === 'human_interview' && booking.status === 'scheduled') → interview_scheduled

// Auto-transition at interview start time
if (booking.start_time <= NOW()) → interview_in_progress

// Auto-transition at interview end time
if (booking.end_time <= NOW()) → interview_completed

// Auto-transition when feedback submitted
if (interview_feedback) → feedback_submitted
```

---

### 🎯 Stage 5: Final Interview
| Order | Substage ID | Label | Progress | Transition Trigger | Data Indicator |
|-------|-------------|-------|----------|-------------------|----------------|
| 1 | `interview_prep` | Interview Preparation | 20% | **Manual** - Moved to Final Interview stage | Stage change |
| 2 | `interview_scheduled` | Interview Scheduled | 40% | **Semi-Auto** - Executive interview booked | `bookings.type = 'final_interview'` |
| 3 | `interview_in_progress` | Interview In Progress | 60% | **Auto** - Start time passed | `booking.start_time < NOW()` |
| 4 | `interview_completed` | Interview Completed | 80% | **Auto** - End time passed | `booking.end_time < NOW()` |
| 5 | `decision_pending` | Decision Pending | 100% | **Auto** - Interview complete, awaiting decision | No decision made yet |

**Transition Logic:**
```javascript
// Auto-transition when final interview scheduled
if (booking.type === 'final_interview' && booking.status === 'scheduled') → interview_scheduled

// Auto-transition at start time
if (booking.start_time <= NOW()) → interview_in_progress

// Auto-transition at end time
if (booking.end_time <= NOW()) → interview_completed

// Auto-transition when no decision made
if (booking.status === 'completed' && !hiring_decision) → decision_pending
```

---

### 🤖 Stage 6: AI Interview
| Order | Substage ID | Label | Progress | Transition Trigger | Data Indicator |
|-------|-------------|-------|----------|-------------------|----------------|
| 1 | `ai_interview_sent` | AI Interview Sent | 20% | **Auto** - AI interview link sent | `ai_interview_link_sent_at` |
| 2 | `ai_interview_started` | AI Interview Started | 40% | **Auto** - Candidate clicks link | `ai_interview_started_at` |
| 3 | `ai_interview_completed` | AI Interview Completed | 60% | **Auto** - Candidate finishes | `ai_interview_completed_at` |
| 4 | `ai_analysis_in_progress` | AI Analysis In Progress | 80% | **Auto** - Processing responses | `ai_analysis_status = 'processing'` |
| 5 | `ai_results_ready` | AI Results Ready | 100% | **Auto** - Analysis complete | `ai_analysis_status = 'completed'` |

**Transition Logic:**
```javascript
// Auto-transition when link sent
if (ai_interview_link_sent_at) → ai_interview_sent

// Auto-transition when started
if (ai_interview_started_at) → ai_interview_started

// Auto-transition when completed
if (ai_interview_completed_at) → ai_interview_completed

// Auto-transition when AI processing
if (ai_analysis_status === 'processing') → ai_analysis_in_progress

// Auto-transition when results ready
if (ai_analysis_status === 'completed') → ai_results_ready
```

---

### 📝 Stage 7: Offer
| Order | Substage ID | Label | Progress | Transition Trigger | Data Indicator |
|-------|-------------|-------|----------|-------------------|----------------|
| 1 | `offer_preparation` | Offer Preparation | 20% | **Manual** - Moved to Offer stage | Stage change |
| 2 | `offer_approval` | Offer Approval | 40% | **Manual** - Offer drafted, pending approval | `offer_draft_created_at` |
| 3 | `offer_sent` | Offer Sent | 60% | **Auto** - Offer email sent | `offer_sent_at` timestamp |
| 4 | `candidate_reviewing` | Candidate Reviewing Offer | 80% | **Auto** - Candidate opened offer | `offer_opened_at` timestamp |
| 5 | `negotiation` | Negotiation | 100% | **Manual** - Candidate requests changes | Negotiation notes exist |

**Transition Logic:**
```javascript
// Manual offer creation
if (offer_draft_created_at && !offer_approved) → offer_approval

// Auto-transition when sent
if (offer_sent_at) → offer_sent

// Auto-transition when opened
if (offer_opened_at) → candidate_reviewing

// Manual transition when negotiating
if (negotiation_notes || counter_offer) → negotiation
```

---

### 🤝 Stage 8: Client Endorsement
| Order | Substage ID | Label | Progress | Transition Trigger | Data Indicator |
|-------|-------------|-------|----------|-------------------|----------------|
| 1 | `client_review_pending` | Pending Client Review | 20% | **Manual** - Candidate submitted to client | `submitted_to_client_at` |
| 2 | `client_reviewing` | Client Reviewing | 40% | **Auto** - Client opened candidate profile | `client_viewed_at` timestamp |
| 3 | `client_interview_scheduled` | Client Interview Scheduled | 60% | **Semi-Auto** - Client interview booked | `bookings.type = 'client_interview'` |
| 4 | `client_interview_completed` | Client Interview Completed | 80% | **Auto** - Interview end time passed | `booking.end_time < NOW()` |
| 5 | `client_decision_pending` | Client Decision Pending | 100% | **Auto** - Interview done, awaiting decision | No client decision yet |

**Transition Logic:**
```javascript
// Manual submission to client
if (submitted_to_client_at) → client_review_pending

// Auto-transition when client views profile
if (client_viewed_at) → client_reviewing

// Auto-transition when client interview scheduled
if (booking.type === 'client_interview' && booking.status === 'scheduled') → client_interview_scheduled

// Auto-transition when interview ends
if (booking.type === 'client_interview' && booking.end_time <= NOW()) → client_interview_completed

// Auto-transition when awaiting decision
if (booking.status === 'completed' && !client_decision) → client_decision_pending
```

**Key Differences:**
- **`client_review_pending` vs `client_reviewing`**: Tracked by `client_viewed_at` timestamp - when client actually opens the profile
- **`client_interview_scheduled` vs `client_interview_completed`**: Tracked by booking data - scheduled when booking created, completed when `end_time` passes
- **`client_interview_completed` vs `client_decision_pending`**: Completed when interview ends, decision pending until `client_decision` field is populated

---

### ✅ Stage 9: Offer Accepted
| Order | Substage ID | Label | Progress | Transition Trigger | Data Indicator |
|-------|-------------|-------|----------|-------------------|----------------|
| 1 | `offer_accepted` | Offer Accepted | 20% | **Auto** - Candidate accepts offer | `offer_accepted_at` timestamp |
| 2 | `background_check` | Background Check | 40% | **Manual/Auto** - Background check initiated | `background_check_started_at` |
| 3 | `documentation` | Documentation | 60% | **Auto** - Background check cleared | `background_check_status = 'cleared'` |
| 4 | `onboarding_prep` | Onboarding Preparation | 80% | **Manual** - Documents submitted | `documents_submitted_at` |
| 5 | `ready_to_start` | Ready to Start | 100% | **Manual** - All checks complete | `onboarding_complete = true` |

**Transition Logic:**
```javascript
// Auto-transition when offer accepted
if (offer_accepted_at) → offer_accepted

// Auto-transition when background check starts
if (background_check_started_at) → background_check

// Auto-transition when cleared
if (background_check_status === 'cleared') → documentation

// Manual transition when docs submitted
if (documents_submitted_at) → onboarding_prep

// Manual transition when ready
if (onboarding_complete === true) → ready_to_start
```

---

## Automation Mechanisms

### 1. **Time-Based Automation** (using cron jobs or scheduled tasks)
```javascript
// Run every 5 minutes
async function autoUpdateSubstages() {
  // Update interviews that have started
  await db.execute(`
    UPDATE candidates c
    SET candidate_substage = 'interview_in_progress'
    FROM bookings b
    WHERE c.id = b.candidate_id
    AND b.start_time <= NOW()
    AND b.end_time > NOW()
    AND c.candidate_substage = 'interview_scheduled'
  `);

  // Update interviews that have completed
  await db.execute(`
    UPDATE candidates c
    SET candidate_substage = 'interview_completed'
    FROM bookings b
    WHERE c.id = b.candidate_id
    AND b.end_time <= NOW()
    AND c.candidate_substage = 'interview_in_progress'
  `);
}
```

### 2. **Event-Based Automation** (using database triggers or application events)
```javascript
// When booking is created
async function onBookingCreated(booking) {
  const candidate = await db.candidates.findById(booking.candidate_id);
  
  if (booking.type === 'client_interview') {
    await db.candidates.update(candidate.id, {
      candidate_substage: 'client_interview_scheduled'
    });
  }
}

// When feedback is submitted
async function onFeedbackSubmitted(candidateId) {
  await db.candidates.update(candidateId, {
    candidate_substage: 'feedback_submitted'
  });
}
```

### 3. **Manual Transitions** (via UI actions)
```javascript
// Recruiter manually moves candidate
async function updateCandidateSubstage(candidateId, newSubstage) {
  // Validate substage belongs to current stage
  const candidate = await db.candidates.findById(candidateId);
  const validSubstages = await getSubstagesForStage(candidate.current_stage);
  
  if (!validSubstages.includes(newSubstage)) {
    throw new Error('Invalid substage for current stage');
  }
  
  await db.candidates.update(candidateId, {
    candidate_substage: newSubstage,
    substage_updated_at: new Date()
  });
}
```

---

## Implementation Recommendations

### Database Schema Additions
```sql
-- Add tracking columns to candidates table
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS substage_updated_at TIMESTAMP;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS substage_updated_by VARCHAR;

-- Add tracking columns for client endorsement
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS submitted_to_client_at TIMESTAMP;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS client_viewed_at TIMESTAMP;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS client_decision VARCHAR;

-- Add tracking columns for assessments
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS assessment_sent_at TIMESTAMP;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS assessment_started_at TIMESTAMP;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS assessment_submitted_at TIMESTAMP;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS assessment_score INTEGER;

-- Add tracking columns for AI interviews
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS ai_interview_link_sent_at TIMESTAMP;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS ai_interview_started_at TIMESTAMP;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS ai_interview_completed_at TIMESTAMP;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS ai_analysis_status VARCHAR;

-- Add tracking columns for offers
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS offer_draft_created_at TIMESTAMP;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS offer_sent_at TIMESTAMP;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS offer_opened_at TIMESTAMP;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS offer_accepted_at TIMESTAMP;

-- Add tracking columns for onboarding
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS background_check_started_at TIMESTAMP;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS background_check_status VARCHAR;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS documents_submitted_at TIMESTAMP;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT FALSE;
```

### API Endpoints
```javascript
// GET /api/candidates/:id/substage-transitions
// Returns available substage transitions based on current data

// POST /api/candidates/:id/substage
// Manually update candidate substage with validation

// GET /api/candidates/:id/transition-history
// Returns history of all substage transitions
```

### UI Components
1. **Substage Dropdown**: Allow manual substage selection (filtered by current stage)
2. **Auto-transition Indicators**: Show which substages auto-transition
3. **Transition Log**: Display history of substage changes with timestamps
4. **Smart Suggestions**: Suggest next substage based on available data

---

## Example Workflow: Client Endorsement

### Step-by-step substage transitions:

1. **Pending Client Review** (Manual)
   - Recruiter clicks "Submit to Client" button
   - System sets `submitted_to_client_at = NOW()`
   - Substage: `client_review_pending`

2. **Client Reviewing** (Automatic)
   - Client clicks candidate profile link
   - System tracks `client_viewed_at = NOW()`
   - Substage auto-updates to: `client_reviewing`

3. **Client Interview Scheduled** (Semi-Automatic)
   - Booking created: `type = 'client_interview'`, `status = 'scheduled'`
   - System detects booking exists
   - Substage auto-updates to: `client_interview_scheduled`

4. **Client Interview Completed** (Automatic - Time-based)
   - Cron job checks: `booking.end_time < NOW()`
   - Interview has ended
   - Substage auto-updates to: `client_interview_completed`

5. **Client Decision Pending** (Automatic)
   - Interview completed but `client_decision` is NULL
   - System auto-transitions to: `client_decision_pending`
   - Recruiter waits for client feedback

### Data that determines transitions:
```javascript
{
  submitted_to_client_at: "2025-11-20T10:00:00Z",  // Step 1 trigger
  client_viewed_at: "2025-11-20T14:30:00Z",        // Step 2 trigger
  booking: {
    type: "client_interview",
    status: "scheduled",
    start_time: "2025-11-21T15:00:00Z",
    end_time: "2025-11-21T16:00:00Z"               // Step 3-4 trigger
  },
  client_decision: null                             // Step 5 indicator
}
```

---

## Summary

### Transition Types:
- **Automatic (40%)**: Based on timestamps, bookings, system events
- **Semi-Automatic (30%)**: Triggered by data but may need manual confirmation
- **Manual (30%)**: Recruiter explicitly moves candidate

### Key Data Indicators:
- **Timestamps**: Track when actions occurred
- **Bookings**: Schedule-based transitions
- **Status Fields**: Track completion states
- **Relationship Data**: Foreign keys to related records

### Best Practices:
1. ✅ Use database triggers for real-time automation
2. ✅ Implement cron jobs for time-based transitions
3. ✅ Log all transitions for audit trail
4. ✅ Validate substage changes before applying
5. ✅ Provide UI for manual overrides when needed
6. ✅ Send notifications when substages change
7. ✅ Use event-driven architecture for scalability

---

**Last Updated**: November 20, 2025  
**Version**: 1.0
