# ATS End-to-End Testing Guide
## Complete Candidate Flow with Substage Transitions

---

## Overview
This guide walks you through testing the complete candidate journey in the ATS system, from application to offer acceptance. You'll learn how to:

1. **Create candidates** at different pipeline stages
2. **Send assessments** to candidates
3. **Schedule and conduct interviews**
4. **Track substage progress** on candidate cards
5. **Verify automatic and manual transitions**
6. **Test the complete workflow** from screening to hire

---

## Table of Contents
- [Prerequisites](#prerequisites)
- [Part 1: Viewing Substages on Candidate Cards](#part-1-viewing-substages-on-candidate-cards)
- [Part 2: Testing Interview Scheduling](#part-2-testing-interview-scheduling)
- [Part 3: Sending and Testing Assessments](#part-3-sending-and-testing-assessments)
- [Part 4: Complete Candidate Journey Test](#part-4-complete-candidate-journey-test)
- [Part 5: Testing Substage Transitions](#part-5-testing-substage-transitions)
- [Part 6: Client Endorsement Flow](#part-6-client-endorsement-flow)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Setup
1. **Active Job**: Have at least one job posting created in the system
2. **Pipeline Stages**: Ensure all 9 stages are configured (Screening, Shortlist, Technical Assessment, Human Interview, Final Interview, AI Interview, Offer, Client Endorsement, Offer Accepted)
3. **Substages Loaded**: Verify substages exist in `pipeline_substages` table (run SQL check below)
4. **User Account**: Be logged in as a recruiter/admin

### Verification SQL Queries

```sql
-- Check substages are loaded (should return 45 rows - 9 stages × 5 substages)
SELECT stage_name, COUNT(*) as substage_count 
FROM pipeline_substages 
GROUP BY stage_name 
ORDER BY stage_name;

-- Check job pipeline stages
SELECT j.title, jps.stage_name, jps.stage_order 
FROM job_pipeline_stages jps 
JOIN jobs j ON j.id = jps.job_id 
WHERE j.id = 'YOUR_JOB_ID'
ORDER BY jps.stage_order;

-- Check candidates with substages
SELECT first_name, last_name, current_stage, candidate_substage 
FROM candidates 
WHERE job_id = 'YOUR_JOB_ID' 
ORDER BY current_stage;
```

---

## Part 1: Viewing Substages on Candidate Cards

### Step 1: Navigate to Job Details
1. Go to Dashboard → Jobs
2. Click on your test job (e.g., "Test Job - ATS - Software Enginner")
3. Job Details page should display Kanban board with pipeline stages

### Step 2: Verify Substage Display on Cards

**What You Should See on Each Candidate Card:**

```
┌─────────────────────────────────────┐
│ Sarah Johnson                        │
│ sarah.johnson@example.com            │
│                                      │
│ Progress: Pending Client Review (1/5)│
│ ⬛⬜⬜⬜⬜  20%                        │
│ [Purple → Blue gradient]             │
│                                      │
│ [Move to Next] [Disqualify]          │
└─────────────────────────────────────┘
```

**Progress Bar Features:**
- ✅ **Mini Progress Bar**: 5 segments representing 5 substages
- ✅ **Gradient Fill**: Purple to blue for completed substages
- ✅ **Current Substage Label**: Shows current substage name
- ✅ **Progress Percentage**: (current_order / total_substages) × 100
- ✅ **Always Visible**: Shows even when no substage data (default state)

### Step 3: Verify Different Progress Levels

Create test candidates at different substages to see visual differences:

```sql
-- Insert candidates with different substage progress
INSERT INTO candidates (job_id, first_name, last_name, email, phone, source, current_stage, candidate_substage, status) VALUES
('YOUR_JOB_ID', 'Stage 1', 'Candidate', 'stage1@test.com', '+1-555-0001', 'portal', 'Client Endorsement', 'client_review_pending', 'active'),
('YOUR_JOB_ID', 'Stage 2', 'Candidate', 'stage2@test.com', '+1-555-0002', 'portal', 'Client Endorsement', 'client_reviewing', 'active'),
('YOUR_JOB_ID', 'Stage 3', 'Candidate', 'stage3@test.com', '+1-555-0003', 'portal', 'Client Endorsement', 'client_interview_scheduled', 'active'),
('YOUR_JOB_ID', 'Stage 4', 'Candidate', 'stage4@test.com', '+1-555-0004', 'portal', 'Client Endorsement', 'client_interview_completed', 'active'),
('YOUR_JOB_ID', 'Stage 5', 'Candidate', 'stage5@test.com', '+1-555-0005', 'portal', 'Client Endorsement', 'client_decision_pending', 'active');
```

**Expected Visual Output:**
- Candidate 1: ⬛⬜⬜⬜⬜ (20%) - Pending Client Review
- Candidate 2: ⬛⬛⬜⬜⬜ (40%) - Client Reviewing
- Candidate 3: ⬛⬛⬛⬜⬜ (60%) - Client Interview Scheduled
- Candidate 4: ⬛⬛⬛⬛⬜ (80%) - Client Interview Completed
- Candidate 5: ⬛⬛⬛⬛⬛ (100%) - Client Decision Pending

---

## Part 2: Testing Interview Scheduling

### Overview
Interview scheduling allows recruiters to create available time slots, which candidates can then book. This process automatically updates candidate substages.

### Step 1: Create Interview Slots (Recruiter)

**Navigate to Interview Scheduling:**
1. Go to Job Details page
2. Click on "Interview Scheduling" tab or "Schedule Interviews" button
3. Select the stage (e.g., "Human Interview")

**Create Time Slots:**
1. Click "Create Slots" or calendar view
2. Fill in slot details:
   - **Date Range**: Select dates for availability
   - **Time Slots**: Define start/end times (e.g., 9:00 AM - 5:00 PM)
   - **Duration**: Interview length (e.g., 60 minutes)
   - **Interview Type**: Phone, Video, or Onsite
   - **Break Between Slots**: Buffer time (e.g., 15 minutes)
   - **Video Link**: Zoom/Teams link (if video)
   - **Location**: Physical address (if onsite)
   - **Max Bookings**: Usually 1 per slot

**Example API Call:**
```javascript
POST /api/jobs/:jobId/stages/:stageId/slots

{
  "start_time": "2025-11-25T09:00:00Z",
  "end_time": "2025-11-25T17:00:00Z",
  "duration_minutes": 60,
  "buffer_before": 0,
  "buffer_after": 15,
  "interview_type": "video",
  "video_link": "https://zoom.us/j/123456789",
  "timezone": "America/New_York",
  "max_bookings": 1,
  "createdBy": "USER_ID"
}
```

**What Happens:**
- System creates multiple 60-minute slots between 9 AM - 5 PM
- Each slot has 15-minute buffer after
- Slots appear in calendar view
- Status: "available"

### Step 2: Invite Candidate to Schedule Interview

**Manual Method (Current Implementation):**
1. Copy the booking link: `/candidate-booking/:candidateId/job/:jobId?stageId=:stageId`
2. Send link to candidate via email (manual for now)
3. Candidate receives link to public booking page

**Expected Email (Future Enhancement):**
```
Subject: Schedule Your Human Interview - Software Engineer Position

Hi John Doe,

We'd like to invite you to schedule your Human Interview for the Software Engineer position.

Please click the link below to view available times and book your interview:
https://your-ats.com/candidate-booking/abc123/job/xyz789?stageId=stage456

Available times are shown in your local timezone. Please book a time that works best for you.

Best regards,
ATS Recruiting Team
```

### Step 3: Candidate Books Interview Slot

**Candidate Journey:**
1. Click booking link
2. See available slots in their local timezone
3. Select preferred time slot
4. Enter email confirmation
5. Add optional notes
6. Click "Book Interview"

**What Happens in System:**
```javascript
POST /api/slots/:slotId/book

{
  "candidateId": "abc123",
  "confirmedEmail": "john.doe@example.com",
  "candidateTimezone": "America/Los_Angeles",
  "notes": "Looking forward to the interview!"
}
```

**System Actions:**
1. Validates slot is still available
2. Creates booking in `interview_bookings` table
3. Marks slot as unavailable
4. **AUTO-UPDATES SUBSTAGE** → `interview_scheduled`
5. Sends confirmation email with .ics calendar file
6. Notifies recruiter of confirmed booking

### Step 4: Verify Substage Transition on Card

**Check Candidate Card:**
- Navigate back to Job Details → Kanban board
- Find the candidate in "Human Interview" stage
- **Progress bar should show**: ⬛⬛⬜⬜⬜ (40%) - "Interview Scheduled"

**Verify in Database:**
```sql
SELECT 
  c.first_name, 
  c.last_name, 
  c.candidate_substage,
  b.start_time,
  b.status
FROM candidates c
LEFT JOIN interview_bookings b ON b.candidate_id = c.id
WHERE c.id = 'CANDIDATE_ID';
```

**Expected Result:**
- `candidate_substage`: `interview_scheduled`
- `booking.status`: `confirmed`
- `booking.start_time`: Future date/time

### Step 5: Test Interview Progression

**Simulate Interview Start (Time-Based):**
```sql
-- When interview start time arrives, substage should auto-update
-- This requires a cron job or manual update for testing:

UPDATE candidates 
SET candidate_substage = 'interview_in_progress'
WHERE id = 'CANDIDATE_ID' 
AND current_stage = 'Human Interview'
AND candidate_substage = 'interview_scheduled';
```

**Candidate Card Display:**
- Progress: ⬛⬛⬛⬜⬜ (60%) - "Interview In Progress"

**Simulate Interview Completion:**
```sql
-- Mark interview as completed
UPDATE interview_bookings 
SET status = 'completed'
WHERE id = 'BOOKING_ID';

-- Update candidate substage
UPDATE candidates 
SET candidate_substage = 'interview_completed'
WHERE id = 'CANDIDATE_ID';
```

**Candidate Card Display:**
- Progress: ⬛⬛⬛⬛⬜ (80%) - "Interview Completed"

### Step 6: Submit Interview Feedback

**Recruiter Action:**
1. Go to candidate profile
2. Navigate to "Interviews" tab
3. Find completed interview
4. Click "Submit Feedback"
5. Fill in feedback form (rating, notes, recommendation)
6. Submit

**What Happens:**
```javascript
POST /api/candidates/:candidateId/interviews/:interviewId/feedback

{
  "rating": 4,
  "notes": "Strong technical skills, good communication",
  "recommendation": "advance",
  "submittedBy": "USER_ID"
}
```

**System Updates:**
- Adds feedback to `interview_feedback` table
- **AUTO-UPDATES SUBSTAGE** → `feedback_submitted`
- Candidate card shows: ⬛⬛⬛⬛⬛ (100%) - "Feedback Submitted"

---

## Part 3: Sending and Testing Assessments

### Overview
Assessments test candidate skills through technical tests, behavioral assessments, or skill verifications. The system tracks assessment progress through substages.

### Step 1: Configure Assessment for Stage

**Navigate to Stage Configuration:**
1. Go to Job Details
2. Click "Configure Stages" or edit icon on "Technical Assessment" stage
3. Open stage settings

**Assessment Configuration:**
```javascript
POST /api/jobs/:jobId/stages/:stageId/config

{
  "assessmentType": "technical",
  "assessmentDuration": 90,  // minutes
  "passingScore": 70,        // percentage
  "autoAdvanceOnPass": true,
  "assessmentPlatform": "codility", // or "hackerrank", "internal"
  "assessmentQuestions": [
    {
      "type": "coding",
      "difficulty": "medium",
      "topic": "algorithms"
    }
  ]
}
```

**Stage Config Stored in:**
- Table: `job_pipeline_stages`
- Column: `stage_config` (JSONB)

### Step 2: Send Assessment to Candidate

**Method 1: Manual Assignment (Current)**
```javascript
POST /api/candidates/:candidateId/assessments

{
  "assessmentType": "technical",
  "assessmentUrl": "https://codility.com/test/abc123",
  "dueDate": "2025-11-30T23:59:59Z",
  "instructions": "Complete the assessment within 90 minutes."
}
```

**What Happens:**
1. System logs `assessment_sent_at` timestamp
2. **AUTO-UPDATES SUBSTAGE** → `assessment_sent`
3. Email sent to candidate with assessment link
4. Candidate card shows: ⬛⬜⬜⬜⬜ (20%) - "Assessment Sent"

**Email Template (Mock):**
```
Subject: Technical Assessment - Software Engineer Position

Hi Jane Smith,

As the next step in your application for the Software Engineer position, 
we'd like you to complete a technical assessment.

Assessment Link: https://codility.com/test/abc123
Time Limit: 90 minutes
Due Date: November 30, 2025

Instructions:
- Complete the assessment in one sitting
- Do not use external help
- Your code will be evaluated for correctness and efficiency

Good luck!

ATS Recruiting Team
```

### Step 3: Candidate Completes Assessment

**Candidate Actions:**
1. Clicks assessment link
2. Starts assessment → **TRIGGERS SUBSTAGE UPDATE** → `assessment_in_progress`
3. Completes questions
4. Submits assessment → **TRIGGERS SUBSTAGE UPDATE** → `assessment_submitted`

**Tracking in Database:**
```sql
-- Add tracking columns to candidates table
UPDATE candidates 
SET 
  assessment_started_at = NOW(),
  candidate_substage = 'assessment_in_progress'
WHERE id = 'CANDIDATE_ID';

-- When submitted
UPDATE candidates 
SET 
  assessment_submitted_at = NOW(),
  candidate_substage = 'assessment_submitted'
WHERE id = 'CANDIDATE_ID';
```

**Candidate Card Progression:**
- Started: ⬛⬛⬜⬜⬜ (40%) - "Assessment In Progress"
- Submitted: ⬛⬛⬛⬜⬜ (60%) - "Assessment Submitted"

### Step 4: Review and Score Assessment

**Recruiter/System Action:**
1. Navigate to candidate profile → Assessments tab
2. View submission details
3. Review answers (manual) or view auto-scored results
4. Assign final score

**Scoring Process:**
```javascript
POST /api/assessments/:assessmentId/score

{
  "score": 85,  // percentage
  "reviewedBy": "USER_ID",
  "notes": "Strong problem-solving skills. Optimal solutions.",
  "passed": true
}
```

**What Happens:**
1. System logs score in database
2. **AUTO-UPDATES SUBSTAGE** → `pending_review` (if not auto-scored)
3. Once scored → **AUTO-UPDATES SUBSTAGE** → `assessment_completed`
4. If `autoAdvanceOnPass = true` and passed → Move to next stage
5. Candidate card shows: ⬛⬛⬛⬛⬛ (100%) - "Assessment Completed"

**Database Update:**
```sql
UPDATE candidates 
SET 
  assessment_score = 85,
  candidate_substage = 'assessment_completed'
WHERE id = 'CANDIDATE_ID';
```

### Step 5: Verify Assessment Flow

**Verification Checklist:**
- [ ] Assessment sent email received
- [ ] Candidate can access assessment link
- [ ] Start triggers substage update to `assessment_in_progress`
- [ ] Submit triggers substage update to `assessment_submitted`
- [ ] Score recorded updates to `assessment_completed`
- [ ] Progress bar reflects all transitions
- [ ] Auto-advance works if passing score met

---

## Part 4: Complete Candidate Journey Test

### Full Flow: Application to Offer Accepted

This section demonstrates a complete end-to-end test of a candidate moving through all pipeline stages with substage tracking.

### Stage 1: Screening (20 min)

**1.1 Create Candidate Application**
```sql
INSERT INTO candidates (
  job_id, first_name, last_name, email, phone, 
  source, current_stage, candidate_substage, status
) VALUES (
  'YOUR_JOB_ID', 'Test', 'Candidate', 'test.candidate@example.com', 
  '+1-555-1234', 'portal', 'Screening', 'application_received', 'active'
);
```

**Expected:** 
- Card shows ⬛⬜⬜⬜⬜ (20%) - "Application Received"

**1.2 Resume Review**
```sql
UPDATE candidates 
SET candidate_substage = 'resume_review'
WHERE email = 'test.candidate@example.com';
```

**Expected:** 
- Card shows ⬛⬛⬜⬜⬜ (40%) - "Resume Review"

**1.3 Initial Assessment**
```sql
UPDATE candidates 
SET candidate_substage = 'initial_assessment'
WHERE email = 'test.candidate@example.com';
```

**Expected:** 
- Card shows ⬛⬛⬛⬜⬜ (60%) - "Initial Assessment"

**1.4 Schedule Phone Screen**
```sql
-- Create phone screen booking
INSERT INTO interview_bookings (
  slot_id, candidate_id, confirmed_email, 
  candidate_timezone, status
) VALUES (
  'SLOT_ID', 'CANDIDATE_ID', 'test.candidate@example.com',
  'America/New_York', 'confirmed'
);

-- Update substage
UPDATE candidates 
SET candidate_substage = 'phone_screen_scheduled'
WHERE id = 'CANDIDATE_ID';
```

**Expected:** 
- Card shows ⬛⬛⬛⬛⬜ (80%) - "Phone Screen Scheduled"

**1.5 Complete Phone Screen**
```sql
UPDATE interview_bookings 
SET status = 'completed'
WHERE candidate_id = 'CANDIDATE_ID';

UPDATE candidates 
SET candidate_substage = 'phone_screen_completed'
WHERE id = 'CANDIDATE_ID';
```

**Expected:** 
- Card shows ⬛⬛⬛⬛⬛ (100%) - "Phone Screen Completed"

### Stage 2: Shortlist (10 min)

**2.1 Move to Shortlist**
```sql
UPDATE candidates 
SET 
  current_stage = 'Shortlist',
  candidate_substage = 'under_review'
WHERE id = 'CANDIDATE_ID';
```

**Expected:** 
- Candidate moves to "Shortlist" column
- Card shows ⬛⬜⬜⬜⬜ (20%) - "Under Review"

**2.2 Progress Through Shortlist**
```sql
-- Pending Interview
UPDATE candidates 
SET candidate_substage = 'pending_interview'
WHERE id = 'CANDIDATE_ID';

-- Interview Scheduled (booking created)
UPDATE candidates 
SET candidate_substage = 'interview_scheduled'
WHERE id = 'CANDIDATE_ID';

-- Interview Completed
UPDATE candidates 
SET candidate_substage = 'interview_completed'
WHERE id = 'CANDIDATE_ID';

-- Awaiting Feedback
UPDATE candidates 
SET candidate_substage = 'awaiting_feedback'
WHERE id = 'CANDIDATE_ID';
```

**Expected:** Progressive visual updates at each step

### Stage 3: Technical Assessment (15 min)

Follow **Part 3** instructions above for complete assessment flow.

### Stage 4: Human Interview (20 min)

Follow **Part 2** instructions above for complete interview scheduling flow.

### Stage 5: Final Interview (20 min)

Same process as Human Interview, different stage.

### Stage 6: Offer (10 min)

**6.1 Move to Offer Stage**
```sql
UPDATE candidates 
SET 
  current_stage = 'Offer',
  candidate_substage = 'offer_preparation'
WHERE id = 'CANDIDATE_ID';
```

**6.2 Progress Through Offer**
```sql
-- Offer Approval
UPDATE candidates 
SET 
  candidate_substage = 'offer_approval',
  offer_draft_created_at = NOW()
WHERE id = 'CANDIDATE_ID';

-- Offer Sent
UPDATE candidates 
SET 
  candidate_substage = 'offer_sent',
  offer_sent_at = NOW()
WHERE id = 'CANDIDATE_ID';

-- Candidate Reviewing
UPDATE candidates 
SET 
  candidate_substage = 'candidate_reviewing',
  offer_opened_at = NOW()
WHERE id = 'CANDIDATE_ID';
```

### Stage 7: Client Endorsement (15 min)

See **Part 6** for complete client endorsement flow.

### Stage 8: Offer Accepted (10 min)

**8.1 Candidate Accepts Offer**
```sql
UPDATE candidates 
SET 
  current_stage = 'Offer Accepted',
  candidate_substage = 'offer_accepted',
  offer_accepted_at = NOW()
WHERE id = 'CANDIDATE_ID';
```

**8.2 Background Check**
```sql
UPDATE candidates 
SET 
  candidate_substage = 'background_check',
  background_check_started_at = NOW()
WHERE id = 'CANDIDATE_ID';
```

**8.3 Documentation**
```sql
UPDATE candidates 
SET 
  candidate_substage = 'documentation',
  background_check_status = 'cleared'
WHERE id = 'CANDIDATE_ID';
```

**8.4 Onboarding Preparation**
```sql
UPDATE candidates 
SET 
  candidate_substage = 'onboarding_prep',
  documents_submitted_at = NOW()
WHERE id = 'CANDIDATE_ID';
```

**8.5 Ready to Start**
```sql
UPDATE candidates 
SET 
  candidate_substage = 'ready_to_start',
  onboarding_complete = true
WHERE id = 'CANDIDATE_ID';
```

**Expected:** Card shows ⬛⬛⬛⬛⬛ (100%) - "Ready to Start" 🎉

---

## Part 5: Testing Substage Transitions

### Automatic Transitions

**Time-Based Transitions:**
```javascript
// Cron job runs every 5 minutes
async function autoUpdateInterviewSubstages() {
  // Update interviews that have started
  await db.execute(`
    UPDATE candidates c
    SET candidate_substage = 'interview_in_progress'
    FROM interview_bookings b
    WHERE c.id = b.candidate_id
    AND b.start_time <= NOW()
    AND b.end_time > NOW()
    AND c.candidate_substage = 'interview_scheduled'
  `);

  // Update interviews that have completed
  await db.execute(`
    UPDATE candidates c
    SET candidate_substage = 'interview_completed'
    FROM interview_bookings b
    WHERE c.id = b.candidate_id
    AND b.end_time <= NOW()
    AND c.candidate_substage = 'interview_in_progress'
  `);
}
```

**Event-Based Transitions:**
```javascript
// When assessment is submitted
async function onAssessmentSubmitted(candidateId) {
  await db.candidates.update(candidateId, {
    candidate_substage: 'assessment_submitted',
    assessment_submitted_at: new Date()
  });
}

// When feedback is submitted
async function onFeedbackSubmitted(candidateId) {
  await db.candidates.update(candidateId, {
    candidate_substage: 'feedback_submitted'
  });
}
```

### Manual Transitions

**Recruiter Updates Substage:**
```javascript
// Via UI dropdown or manual action
async function updateCandidateSubstage(candidateId, newSubstage) {
  // Validate substage belongs to current stage
  const candidate = await db.candidates.findById(candidateId);
  const validSubstages = await getSubstagesForStage(candidate.current_stage);
  
  if (!validSubstages.some(s => s.id === newSubstage)) {
    throw new Error('Invalid substage for current stage');
  }
  
  await db.candidates.update(candidateId, {
    candidate_substage: newSubstage,
    substage_updated_at: new Date(),
    substage_updated_by: userId
  });
}
```

### Testing Transition Validation

**Test Invalid Transitions:**
```sql
-- This should FAIL (substage doesn't belong to stage)
UPDATE candidates 
SET candidate_substage = 'offer_sent'
WHERE current_stage = 'Screening';
-- Expected: Error or validation failure

-- This should SUCCEED
UPDATE candidates 
SET candidate_substage = 'resume_review'
WHERE current_stage = 'Screening';
-- Expected: Success
```

---

## Part 6: Client Endorsement Flow

### Complete Client Endorsement Test

**Step 1: Submit Candidate to Client**
```sql
UPDATE candidates 
SET 
  current_stage = 'Client Endorsement',
  candidate_substage = 'client_review_pending',
  submitted_to_client_at = NOW()
WHERE id = 'CANDIDATE_ID';
```

**Expected:**
- Card in "Client Endorsement" column
- Progress: ⬛⬜⬜⬜⬜ (20%) - "Pending Client Review"

**Step 2: Client Views Profile**
```sql
-- Simulates client clicking candidate profile link
UPDATE candidates 
SET 
  candidate_substage = 'client_reviewing',
  client_viewed_at = NOW()
WHERE id = 'CANDIDATE_ID';
```

**Expected:**
- Progress: ⬛⬛⬜⬜⬜ (40%) - "Client Reviewing"

**Step 3: Schedule Client Interview**

Create interview booking:
```sql
-- Insert client interview slot
INSERT INTO interview_slots (
  job_id, stage_id, start_time, end_time,
  duration_minutes, interview_type, video_link,
  timezone, max_bookings, created_by
) VALUES (
  'JOB_ID', 'STAGE_ID', '2025-11-30T14:00:00Z', '2025-11-30T15:00:00Z',
  60, 'video', 'https://zoom.us/j/client-interview',
  'America/New_York', 1, 'USER_ID'
);

-- Book the slot
INSERT INTO interview_bookings (
  slot_id, candidate_id, confirmed_email,
  candidate_timezone, status
) VALUES (
  'SLOT_ID', 'CANDIDATE_ID', 'candidate@example.com',
  'America/New_York', 'confirmed'
);

-- Update substage
UPDATE candidates 
SET candidate_substage = 'client_interview_scheduled'
WHERE id = 'CANDIDATE_ID';
```

**Expected:**
- Progress: ⬛⬛⬛⬜⬜ (60%) - "Client Interview Scheduled"

**Step 4: Complete Client Interview**

```sql
-- Mark interview as completed (time-based or manual)
UPDATE interview_bookings 
SET status = 'completed'
WHERE candidate_id = 'CANDIDATE_ID' 
AND slot_id IN (
  SELECT id FROM interview_slots 
  WHERE stage_id = 'CLIENT_ENDORSEMENT_STAGE_ID'
);

-- Update substage
UPDATE candidates 
SET candidate_substage = 'client_interview_completed'
WHERE id = 'CANDIDATE_ID';
```

**Expected:**
- Progress: ⬛⬛⬛⬛⬜ (80%) - "Client Interview Completed"

**Step 5: Await Client Decision**

```sql
UPDATE candidates 
SET candidate_substage = 'client_decision_pending'
WHERE id = 'CANDIDATE_ID';
```

**Expected:**
- Progress: ⬛⬛⬛⬛⬛ (100%) - "Client Decision Pending"

**Step 6: Client Approves (Move to Next Stage)**

```sql
UPDATE candidates 
SET 
  current_stage = 'Offer',
  candidate_substage = 'offer_preparation',
  client_decision = 'approved',
  client_decision_at = NOW()
WHERE id = 'CANDIDATE_ID';
```

**Expected:**
- Candidate moves to "Offer" stage
- New progress: ⬛⬜⬜⬜⬜ (20%) - "Offer Preparation"

---

## Troubleshooting

### Issue: Progress Bar Not Showing

**Symptoms:**
- Blank progress section
- "No progress tracking available" message
- Missing substage data

**Solutions:**
1. **Check substages are loaded:**
```sql
SELECT * FROM pipeline_substages WHERE stage_name = 'YOUR_STAGE';
```
If empty, run seed script or insert substages.

2. **Verify API endpoint:**
```bash
curl http://localhost:3001/api/jobs/YOUR_JOB_ID/stages/Screening/substages
```
Should return 5 substages.

3. **Check network requests:**
- Open browser DevTools → Network tab
- Look for substages API call
- Verify 200 response

### Issue: Substage Not Updating

**Symptoms:**
- Progress bar stuck at same level
- Database has new substage but UI doesn't reflect

**Solutions:**
1. **Refresh the page** (hard refresh: Ctrl+Shift+R)
2. **Check candidate_substage column:**
```sql
SELECT candidate_substage FROM candidates WHERE id = 'CANDIDATE_ID';
```
3. **Verify substage ID is valid:**
```sql
SELECT * FROM pipeline_substages 
WHERE stage_name = 'YOUR_STAGE' 
AND substage_id = 'YOUR_SUBSTAGE_ID';
```

### Issue: Booking Doesn't Update Substage

**Symptoms:**
- Interview booked but substage still shows previous state

**Solutions:**
1. **Check booking was created:**
```sql
SELECT * FROM interview_bookings WHERE candidate_id = 'CANDIDATE_ID';
```
2. **Manually trigger update:**
```sql
UPDATE candidates 
SET candidate_substage = 'interview_scheduled'
WHERE id = 'CANDIDATE_ID';
```
3. **Check for trigger/event handler:**
- Verify booking creation includes substage update logic
- Check server logs for errors

### Issue: Assessment Link Not Working

**Symptoms:**
- Candidate can't access assessment
- Link returns 404 or expired

**Solutions:**
1. **Verify assessment URL is valid**
2. **Check due date hasn't passed**
3. **Re-send assessment:**
```sql
UPDATE candidates 
SET 
  assessment_sent_at = NOW(),
  candidate_substage = 'assessment_sent'
WHERE id = 'CANDIDATE_ID';
```

---

## Quick Reference: API Endpoints

### Substages
- `GET /api/jobs/:jobId/stages/:stageName/substages` - Get substages for stage
- `PUT /api/candidates/:id/substage` - Update candidate substage

### Interview Scheduling
- `POST /api/jobs/:jobId/stages/:stageId/slots` - Create interview slots
- `GET /api/jobs/:jobId/stages/:stageId/slots` - Get all slots
- `POST /api/slots/:slotId/book` - Book a slot (candidate)
- `GET /api/candidates/:candidateId/jobs/:jobId/available-slots` - Get available slots
- `GET /api/jobs/:jobId/bookings` - Get all bookings

### Assessments
- `POST /api/candidates/:id/assessments` - Assign assessment
- `POST /api/assessments/:assessmentId/submit` - Submit assessment
- `POST /api/assessments/:assessmentId/score` - Score assessment

### Candidates
- `GET /api/jobs/:jobId/candidates` - Get all candidates for job
- `PUT /api/candidates/:id` - Update candidate details
- `PUT /api/candidates/:id/stage` - Move candidate to stage

---

## Summary Checklist

### Before Testing
- [ ] All substages loaded in database (45 total)
- [ ] Job created with all pipeline stages configured
- [ ] Test candidates created at various stages
- [ ] User logged in with appropriate permissions

### During Testing
- [ ] Progress bars visible on all candidate cards
- [ ] Gradient colors display correctly (purple → blue)
- [ ] Substage labels show current position
- [ ] Percentage calculations accurate
- [ ] Interview booking updates substage automatically
- [ ] Assessment submission updates substage
- [ ] Manual substage updates work via SQL/UI
- [ ] Stage transitions reset substage to first in new stage

### After Testing
- [ ] All transitions logged in `candidate_stage_history`
- [ ] No orphaned bookings or assessments
- [ ] Email notifications sent (check console logs)
- [ ] Database constraints maintained
- [ ] No duplicate substages or invalid states

---

**Last Updated**: November 20, 2025  
**Version**: 1.0  
**Related Docs**: 
- [Substage Transition Guide](SUBSTAGE_TRANSITION_GUIDE.md)
- [Interview Scheduling Setup](interview-scheduling-setup.md)
- [Database Schema Analysis](DATABASE_SCHEMA_ANALYSIS.md)
