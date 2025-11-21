# Human Interview Scheduling Workflow Guide

## Overview
This guide documents the complete workflow for human interview scheduling in the Multi-Employment ATS system, from interviewer assignment through interview completion.

---

## Workflow Steps

### Step 1: Interviewer Assignment (Portal Action)
**Substage:** `interviewer_assigned`

**When:** Recruiter/hiring manager decides candidate is ready for human interview  
**Where:** Job Details Kanban Board → Human Interview stage  
**Action:** Click "Assign Interviewer" button on candidate card

**Process:**
1. Recruiter opens interviewer assignment modal
2. Selects interviewer from dropdown (populated from available interviewers)
3. Chooses meeting platform (Google Meet, Zoom, or Microsoft Teams)
4. System automatically:
   - Generates unique `slot_selection_token` for the candidate
   - Stores interviewer details on candidate record:
     - `interviewer_name`
     - `interviewer_email`
     - `meeting_platform`
   - Updates candidate substage to `interviewer_assigned`
   - Fetches interviewer's available slots from `interview_slots` table
   - Sends email to candidate with:
     - Interviewer name and details
     - List of available time slots
     - Interview duration and timing breakdown
     - Secure link to slot selection portal: `/candidate/select-slot/:token`

**Database Updates:**
```sql
UPDATE candidates SET
  interviewer_name = 'John Recruiter',
  interviewer_email = 'john@company.com',
  meeting_platform = 'Google Meet',
  slot_selection_token = '<unique-secure-token>',
  candidate_substage = 'interviewer_assigned',
  updated_at = CURRENT_TIMESTAMP
WHERE id = '<candidate-id>';
```

---

### Step 2: Candidate Receives Email
**Substage:** `interviewer_assigned` (no change)

**Email Contents:**
- **Subject:** "Interview Invitation - [Job Title]"
- **Body Includes:**
  - Interviewer name and role
  - Available time slots (date, time, duration)
  - Interview timing breakdown (e.g., "45-minute interview")
  - Meeting platform to be used
  - **Call-to-Action:** "Select Your Interview Time" button
  - Secure link with unique token

**Email Template Features:**
- Beautiful gradient design (purple to blue)
- Responsive HTML layout
- One-click slot selection
- Timezone-aware slot display

---

### Step 3: Candidate Selects Slot
**Substage Transition:** `interviewer_assigned` → `interview_scheduled`

**When:** Candidate clicks email link and selects preferred time slot  
**Where:** Public candidate portal at `/candidate/select-slot/:token`  
**Action:** Candidate selects slot and confirms

**Portal Features:**
1. **Token Validation:**
   - Validates `slot_selection_token` from URL
   - Ensures token hasn't been used or invalidated
   - Fetches candidate and job details

2. **Slot Display:**
   - Shows only slots from assigned interviewer
   - Displays available slots with:
     - Date and time
     - Duration
     - Interviewer name
   - Real-time availability checking
   - Prevents double-booking

3. **Selection Form:**
   - Candidate email (pre-filled if available)
   - Optional notes/comments
   - Single slot selection (radio buttons)
   - "Confirm Interview Time" button

**Process After Selection:**
1. System validates:
   - Token is valid and not expired
   - Selected slot is still available
   - Slot has capacity (current_bookings < max_participants)

2. System creates booking record:
```sql
INSERT INTO interview_bookings (
  candidate_id,
  slot_id,
  job_id,
  booking_type,
  status,
  created_at
) VALUES (
  '<candidate-id>',
  '<selected-slot-id>',
  '<job-id>',
  'human_interview',
  'confirmed',
  CURRENT_TIMESTAMP
);
```

3. System updates candidate record:
```sql
UPDATE candidates SET
  selected_slot_id = '<slot-id>',
  interview_scheduled_at = '<slot-start-time>',
  slot_selection_token = NULL,  -- Invalidate token
  candidate_substage = 'interview_scheduled',
  updated_at = CURRENT_TIMESTAMP
WHERE id = '<candidate-id>';
```

4. System updates slot capacity:
```sql
UPDATE interview_slots SET
  current_bookings = current_bookings + 1
WHERE id = '<slot-id>';
```

5. System generates meeting link:
   - Creates unique meeting URL based on platform
   - Stores in `meeting_link` field
   - Mock mode: `https://meet.google.com/mock-abc-defg`
   - Production: Actual OAuth-generated meeting link

6. System sends confirmation emails:
   - **To Candidate:** Interview confirmed with meeting link and details
   - **To Interviewer:** New interview scheduled notification
   - **To Client (if applicable):** Interview scheduled update

**Result:**
- ✅ Interview is now scheduled
- ✅ Candidate substage: `interview_scheduled`
- ✅ Meeting link generated and shared
- ✅ Calendar invites sent (in production mode)
- ✅ Token invalidated to prevent reuse

---

### Step 4: Interview Scheduled (Waiting Period)
**Substage:** `interview_scheduled`

**Status:** Candidate is confirmed and waiting for interview time  
**Visible To:** Recruiter, interviewer, client (if permissions allow)

**Available Actions:**
- View interview details
- Reschedule (requires token regeneration)
- Cancel interview
- Send reminder emails

**Displayed Information:**
- Interview date and time
- Interviewer name
- Meeting platform and link
- Duration
- Status: "Scheduled"

---

### Step 5: Interview In Progress
**Substage Transition:** `interview_scheduled` → `interview_in_progress`

**When:** Interview start time arrives (manual or automated transition)  
**Action:** Recruiter/system marks interview as in progress

**Process:**
1. Interviewer clicks meeting link
2. System can auto-transition at scheduled time
3. Status updates to "In Progress"

---

### Step 6: Interview Completed
**Substage Transition:** `interview_in_progress` → `interview_completed`

**When:** Interview ends  
**Where:** Job Details Kanban Board  
**Action:** Click "Mark Interview Complete" button

**Completion Modal:**
- Interview outcome (successful, needs follow-up, etc.)
- Duration (auto-calculated or manual entry)
- Notes/observations
- Next steps

**Database Updates:**
```sql
UPDATE candidates SET
  interview_completed_at = CURRENT_TIMESTAMP,
  candidate_substage = 'interview_completed',
  updated_at = CURRENT_TIMESTAMP
WHERE id = '<candidate-id>';

UPDATE interview_bookings SET
  status = 'completed',
  completed_at = CURRENT_TIMESTAMP
WHERE candidate_id = '<candidate-id>' AND slot_id = '<slot-id>';
```

---

### Step 7: Feedback Submitted
**Substage Transition:** `interview_completed` → `feedback_submitted`

**When:** Interviewer submits structured feedback  
**Where:** Interview feedback form  
**Action:** Complete feedback and submit

**Feedback Fields:**
- Overall rating
- Technical skills assessment
- Communication skills
- Cultural fit
- Strengths
- Areas for improvement
- Recommendation (hire, maybe, no hire)

**Database Updates:**
```sql
UPDATE candidates SET
  interviewer_feedback = '<feedback-json>',
  candidate_substage = 'feedback_submitted',
  updated_at = CURRENT_TIMESTAMP
WHERE id = '<candidate-id>';
```

**Result:**
- ✅ Interview process complete
- ✅ Ready for decision or next stage
- ✅ Feedback stored for review

---

## Complete Substage Flow

```
interviewer_assigned
        ↓
    [Recruiter assigns interviewer]
    [Email sent to candidate]
        ↓
    [Candidate clicks email link]
    [Candidate selects slot]
        ↓
interview_scheduled
        ↓
    [Interview time arrives]
        ↓
interview_in_progress
        ↓
    [Interview ends]
        ↓
interview_completed
        ↓
    [Interviewer submits feedback]
        ↓
feedback_submitted
```

---

## API Endpoints

### 1. Assign Interviewer
```
POST /api/candidates/:id/human-interview/assign-interviewer
```

**Request Body:**
```json
{
  "interviewerName": "John Recruiter",
  "interviewerEmail": "john@company.com",
  "meetingPlatform": "Google Meet",
  "userId": "recruiter-uuid"
}
```

**Response:**
```json
{
  "id": "candidate-uuid",
  "interviewer_name": "John Recruiter",
  "interviewer_email": "john@company.com",
  "meeting_platform": "Google Meet",
  "slot_selection_token": "secure-token-abc123",
  "candidate_substage": "interviewer_assigned"
}
```

**Actions Performed:**
- Generates unique token
- Stores interviewer details
- Updates substage
- Fetches interviewer's available slots
- Sends email to candidate with slot selection link

---

### 2. Get Available Slots (Public - Token-Based)
```
GET /api/candidates/human-interview/available-slots-public?token=<token>
```

**Response:**
```json
{
  "candidate": {
    "first_name": "Jane",
    "last_name": "Doe",
    "email": "jane@example.com"
  },
  "job": {
    "title": "Senior Software Engineer",
    "company_name": "Tech Corp"
  },
  "interviewer": {
    "name": "John Recruiter",
    "email": "john@company.com"
  },
  "slots": [
    {
      "id": "slot-uuid-1",
      "start_time": "2025-11-25T14:00:00Z",
      "end_time": "2025-11-25T15:00:00Z",
      "duration_minutes": 60,
      "is_available": true,
      "remaining_capacity": 5
    }
  ]
}
```

---

### 3. Select Interview Slot
```
POST /api/candidates/human-interview/select-slot
```

**Request Body:**
```json
{
  "token": "secure-token-abc123",
  "slotId": "slot-uuid-1",
  "candidateEmail": "jane@example.com",
  "notes": "Looking forward to the interview"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Interview scheduled successfully",
  "interview": {
    "scheduled_at": "2025-11-25T14:00:00Z",
    "meeting_link": "https://meet.google.com/abc-defg-hij",
    "interviewer_name": "John Recruiter",
    "duration_minutes": 60
  }
}
```

**Actions Performed:**
- Validates token
- Creates booking record
- Updates candidate substage to `interview_scheduled`
- Increments slot booking count
- Generates meeting link
- Invalidates token
- Sends confirmation emails

---

### 4. Mark Interview Complete
```
PATCH /api/candidates/:id/human-interview/complete
```

**Request Body:**
```json
{
  "duration": 45,
  "notes": "Great technical discussion",
  "userId": "interviewer-uuid"
}
```

**Response:**
```json
{
  "id": "candidate-uuid",
  "candidate_substage": "interview_completed",
  "interview_completed_at": "2025-11-25T15:45:00Z"
}
```

---

### 5. Submit Interview Feedback
```
POST /api/candidates/:id/human-interview/feedback
```

**Request Body:**
```json
{
  "rating": 4,
  "technicalSkills": "Strong problem-solving abilities",
  "communication": "Excellent communicator",
  "recommendation": "hire",
  "notes": "Would be great fit for the team"
}
```

---

## Database Tables

### Candidates Table (Relevant Fields)
```sql
interviewer_name VARCHAR(255)
interviewer_email VARCHAR(255)
meeting_platform VARCHAR(50)  -- 'Google Meet', 'Zoom', 'Microsoft Teams'
meeting_link TEXT
slot_selection_token TEXT      -- Unique token for candidate slot selection
selected_slot_id UUID
interview_scheduled_at TIMESTAMP
interview_completed_at TIMESTAMP
interviewer_feedback JSONB
candidate_substage VARCHAR(100)
```

### Interview Slots Table
```sql
CREATE TABLE interview_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interviewer_email VARCHAR(255) NOT NULL,
  interviewer_name VARCHAR(255),
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  duration_minutes INTEGER NOT NULL,
  max_participants INTEGER DEFAULT 1,
  current_bookings INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  location TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Interview Bookings Table
```sql
CREATE TABLE interview_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
  slot_id UUID REFERENCES interview_slots(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id),
  booking_type VARCHAR(50),  -- 'human_interview', 'final_interview'
  status VARCHAR(50) DEFAULT 'confirmed',  -- 'confirmed', 'completed', 'cancelled'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  cancelled_at TIMESTAMP
);
```

---

## Security Features

### Token-Based Access
1. **Unique Token Generation:**
   - Cryptographically secure random token
   - Stored in `slot_selection_token` field
   - Single-use only

2. **Token Validation:**
   - Checked on every slot selection request
   - Must match candidate record
   - Invalidated after successful slot selection

3. **Token Rotation:**
   - New token generated on interviewer reassignment
   - Old token automatically invalidated

4. **Scoped Visibility:**
   - Candidates only see slots from their assigned interviewer
   - No access to other candidates' bookings
   - Public endpoint requires valid token

### Email Security
- No sensitive data in email subject lines
- Secure HTTPS links only
- Token embedded in URL (not email body)
- Link expiration (optional, can be configured)

---

## Email Templates

### Slot Selection Email (Sent After Interviewer Assignment)

**Subject:** Interview Invitation - [Job Title] at [Company Name]

**Body:**
```html
<div style="background: linear-gradient(135deg, #A16AE8 0%, #8096FD 100%);">
  <h1>Interview Invitation</h1>
  <p>Hello [Candidate Name],</p>
  
  <p>Great news! We'd like to invite you for an interview for the position of 
  <strong>[Job Title]</strong>.</p>
  
  <h2>Interview Details:</h2>
  <ul>
    <li><strong>Interviewer:</strong> [Interviewer Name]</li>
    <li><strong>Duration:</strong> [Duration] minutes</li>
    <li><strong>Platform:</strong> [Meeting Platform]</li>
  </ul>
  
  <h3>Available Time Slots:</h3>
  <p>Please select your preferred interview time from the available slots:</p>
  
  <a href="[Portal Link]" style="button-style">
    Select Your Interview Time
  </a>
  
  <p>If you have any questions, please don't hesitate to reach out.</p>
  
  <p>Best regards,<br>[Company Name] Hiring Team</p>
</div>
```

---

### Confirmation Email (Sent After Slot Selection)

**Subject:** Interview Confirmed - [Date & Time]

**Body:**
```html
<div style="background: linear-gradient(135deg, #A16AE8 0%, #8096FD 100%);">
  <h1>Interview Confirmed! ✓</h1>
  <p>Hello [Candidate Name],</p>
  
  <p>Your interview has been successfully scheduled!</p>
  
  <h2>Interview Details:</h2>
  <ul>
    <li><strong>Date & Time:</strong> [Selected Date/Time]</li>
    <li><strong>Duration:</strong> [Duration] minutes</li>
    <li><strong>Interviewer:</strong> [Interviewer Name]</li>
    <li><strong>Platform:</strong> [Meeting Platform]</li>
  </ul>
  
  <h3>Join Meeting:</h3>
  <a href="[Meeting Link]" style="button-style">
    Join Interview (at scheduled time)
  </a>
  
  <p><strong>Meeting Link:</strong> [Meeting Link]</p>
  
  <p>Please join the meeting at the scheduled time. We look forward to speaking with you!</p>
  
  <p>Best regards,<br>[Company Name] Hiring Team</p>
</div>
```

---

## Mock vs Production Modes

### Mock Mode (MVP - Current Implementation)
**Email Service:**
- Logs email content to console
- No actual emails sent
- Returns success for all send operations

**Meeting Service:**
- Generates mock meeting links
- Format: `https://meet.google.com/mock-[random]`
- No actual meeting rooms created

### Production Mode (Requires Configuration)
**Email Service:**
- Requires `SENDGRID_API_KEY` environment variable
- Sends real emails via SendGrid
- Tracks delivery status

**Meeting Service:**
- Requires OAuth credentials for each platform:
  - Google Meet: Google Workspace OAuth
  - Zoom: Zoom OAuth API
  - Microsoft Teams: Microsoft Graph API
- Creates actual meeting rooms
- Generates real meeting links
- Sends calendar invitations

---

## UI Components

### Interviewer Assignment Modal
**Location:** `JobDetailsKanban.tsx`  
**Trigger:** "Assign Interviewer" button on candidate card  
**Fields:**
- Interviewer Name (dropdown)
- Interviewer Email (auto-filled)
- Meeting Platform (radio buttons: Google Meet, Zoom, Teams)
- Optional notes

### Candidate Slot Selection Portal
**Location:** `CandidateSlotSelection.tsx`  
**Route:** `/candidate/select-slot/:token`  
**Features:**
- Public-facing (no authentication required)
- Token-based access
- Responsive design
- Timezone-aware slot display
- One-click slot selection
- Confirmation message

### Interview Completion Modal
**Location:** `JobDetailsKanban.tsx`  
**Trigger:** "Mark Interview Complete" button  
**Fields:**
- Actual duration
- Interview notes
- Outcome/result

---

## Best Practices

### For Recruiters
1. **Verify interviewer availability** before assignment
2. **Check timezone** when selecting interviewers
3. **Provide clear notes** when assigning interviews
4. **Monitor slot selection** status
5. **Follow up** if candidate doesn't select slot within 48 hours

### For Interviewers
1. **Keep calendar updated** with available slots
2. **Review candidate profile** before interview
3. **Join meeting** 2-3 minutes early
4. **Submit feedback** within 24 hours of interview
5. **Provide constructive** and detailed feedback

### For System Administrators
1. **Monitor token usage** for security
2. **Set up email service** for production
3. **Configure OAuth** for meeting platforms
4. **Implement slot cleanup** for expired bookings
5. **Enable calendar sync** for interviewers

---

## Troubleshooting

### Candidate Doesn't Receive Email
**Possible Causes:**
- Email service in mock mode
- Invalid candidate email
- Email marked as spam

**Solutions:**
- Check email service configuration
- Verify candidate email in database
- Check email server logs

### Slot Selection Link Expired
**Causes:**
- Token already used
- Interviewer reassigned
- Manual token invalidation

**Solutions:**
- Reassign interviewer (generates new token)
- Check `slot_selection_token` field in database
- Verify token in URL matches database

### Double Booking Prevention
**System Safeguards:**
- Real-time capacity checking
- Transaction-level locking
- Current bookings counter
- Slot availability validation

---

## Future Enhancements

### Planned Features
1. **Calendar Integration:**
   - Direct calendar sync with Google/Outlook
   - Automatic calendar invites
   - Reminder notifications

2. **Advanced Scheduling:**
   - Multi-interviewer panel scheduling
   - Buffer time between interviews
   - Timezone auto-detection

3. **Rescheduling:**
   - Self-service rescheduling for candidates
   - Automated rescheduling workflow
   - Cancellation policies

4. **Analytics:**
   - Interview completion rates
   - Average time-to-schedule
   - Interviewer utilization metrics
   - Candidate no-show tracking

5. **Video Interview:**
   - Built-in video conferencing
   - Recording capabilities
   - AI-powered transcription

---

## Summary

The Human Interview Scheduling workflow follows this sequence:

1. **Recruiter assigns interviewer** → Substage: `interviewer_assigned`
2. **Email sent to candidate** with slot selection link
3. **Candidate selects slot** via secure portal → Substage: `interview_scheduled`
4. **Interview occurs** → Substage: `interview_in_progress`
5. **Interview ends** → Substage: `interview_completed`
6. **Feedback submitted** → Substage: `feedback_submitted`

**Key Point:** The `interview_scheduled` substage is **only reached after the candidate successfully selects a time slot** from the email link. It does not occur immediately after interviewer assignment.

This ensures accurate tracking of the interview scheduling progress and clear visibility into which candidates have confirmed their interview times versus those still waiting to select a slot.
