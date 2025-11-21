# Human Interview Substage Transitions

## Overview
Human Interview stage has **5 substages** that track the complete human-led interview scheduling and execution workflow with interviewer assignment, slot selection, and feedback collection.

---

## Substages

### 1. Interviewer Assigned (20% progress)
**Substage ID:** `interviewer_assigned`
**Label:** Interviewer Assigned

**Transition Logic:**
- **Manual Trigger:** Recruiter assigns interviewer via UI
- **Database Fields:** 
  - `interviewer_name` (varchar)
  - `interviewer_email` (varchar)
  - `meeting_platform` (varchar: 'google_meet', 'zoom', 'teams')
  - `slot_selection_token` (varchar, generated)
- **How to Trigger:** 
  - Click "Assign Interviewer" button in JobDetailsKanban
  - Fill in interviewer details and select meeting platform
  - System generates secure token and sends email to candidate

**SQL Example:**
```sql
UPDATE candidates 
SET interviewer_name = 'John Smith',
    interviewer_email = 'john.smith@company.com',
    meeting_platform = 'google_meet',
    slot_selection_token = 'generated-secure-token-here',
    candidate_substage = 'interviewer_assigned',
    updated_at = CURRENT_TIMESTAMP
WHERE id = '<candidate_id>';
```

---

### 2. Interview Scheduled (40% progress)
**Substage ID:** `interview_scheduled`
**Label:** Interview Scheduled

**Transition Logic:**
- **Public Action:** Candidate selects time slot via email link
- **Database Fields:**
  - `selected_slot_id` (FK to interview_slots table)
  - `meeting_link` (varchar, auto-generated)
  - `interview_scheduled_at` (timestamp)
  - `slot_selection_token` (set to NULL after use)
- **How to Trigger:** 
  - Candidate clicks slot selection link in email
  - Selects available time slot from interviewer's calendar
  - System generates meeting link and notifies client

**SQL Example:**
```sql
UPDATE candidates 
SET selected_slot_id = '<slot_id>',
    meeting_link = 'https://meet.google.com/abc-defg-hij',
    interview_scheduled_at = CURRENT_TIMESTAMP,
    candidate_substage = 'interview_scheduled',
    slot_selection_token = NULL,
    updated_at = CURRENT_TIMESTAMP
WHERE id = '<candidate_id>';
```

---

### 3. Interview In Progress (60% progress)
**Substage ID:** `interview_in_progress`
**Label:** Interview In Progress

**Transition Logic:**
- **Manual Trigger:** Recruiter manually updates when interview starts
- **Auto-Trigger (Future):** Time-based when slot start_time passes
- **Database Field:** No specific timestamp (substage change only)
- **How to Trigger:** 
  - Manual substage update via UI
  - Or automated check when interview time begins

**SQL Example:**
```sql
UPDATE candidates 
SET candidate_substage = 'interview_in_progress',
    updated_at = CURRENT_TIMESTAMP
WHERE id = '<candidate_id>';
```

---

### 4. Interview Completed (80% progress)
**Substage ID:** `interview_completed`
**Label:** Interview Completed

**Transition Logic:**
- **Manual Trigger:** Recruiter clicks "Complete Interview" button
- **Database Field:** `interview_completed_at` (timestamp)
- **How to Trigger:** 
  - Click "Complete Interview" action button
  - Opens modal for feedback submission
  - Marks interview as completed

**SQL Example:**
```sql
UPDATE candidates 
SET interview_completed_at = CURRENT_TIMESTAMP,
    candidate_substage = 'interview_completed',
    updated_at = CURRENT_TIMESTAMP
WHERE id = '<candidate_id>';
```

---

### 5. Feedback Submitted (100% progress)
**Substage ID:** `feedback_submitted`
**Label:** Feedback Submitted

**Transition Logic:**
- **Manual Trigger:** Recruiter submits feedback and notes
- **Database Fields:**
  - `interview_feedback` (text)
  - `interview_notes` (text)
  - `interview_duration_minutes` (integer)
- **How to Trigger:** 
  - Fill out feedback form in "Complete Interview" modal
  - Submit feedback, notes, and duration
  - Automatically progresses to this substage

**SQL Example:**
```sql
UPDATE candidates 
SET interview_feedback = 'Candidate performed well, strong technical skills',
    interview_notes = 'Would recommend for next round',
    interview_duration_minutes = 45,
    candidate_substage = 'feedback_submitted',
    updated_at = CURRENT_TIMESTAMP
WHERE id = '<candidate_id>';
```

---

## Transition Flow

```
Candidate enters Human Interview stage
           ↓
[Recruiter assigns interviewer]
interviewer_name, interviewer_email set
slot_selection_token generated
Email sent to candidate
           ↓
Substage 1: interviewer_assigned (20%)
           ↓
[Candidate selects slot via email link]
selected_slot_id set
meeting_link generated
Token invalidated
Client notified
           ↓
Substage 2: interview_scheduled (40%)
           ↓
[Interview time arrives / manual update]
           ↓
Substage 3: interview_in_progress (60%)
           ↓
[Recruiter marks interview complete]
interview_completed_at = timestamp
           ↓
Substage 4: interview_completed (80%)
           ↓
[Recruiter submits feedback and notes]
interview_feedback, interview_notes set
           ↓
Substage 5: feedback_submitted (100%)
           ↓
Ready to move to next stage
```

---

## Database Schema

### Human Interview Tracking Fields
```sql
-- Added to candidates table (migration 012)
interviewer_name              VARCHAR       -- Assigned interviewer's name
interviewer_email             VARCHAR       -- Assigned interviewer's email
meeting_platform              VARCHAR       -- 'google_meet', 'zoom', or 'teams'
selected_slot_id              UUID          -- FK to interview_slots table
meeting_link                  VARCHAR       -- Auto-generated meeting URL
interview_scheduled_at        TIMESTAMP     -- When slot was selected
interview_completed_at        TIMESTAMP     -- When interview marked complete
interview_feedback            TEXT          -- Interviewer's feedback
interview_notes               TEXT          -- Additional notes
interview_duration_minutes    INTEGER       -- Interview length
slot_selection_token          VARCHAR       -- Secure token for public slot selection
slot_selection_email_sent_at  TIMESTAMP     -- When slot selection email sent
```

### Related interview_slots Table
```sql
-- Pre-existing table for availability management
id                UUID PRIMARY KEY
created_by        INTEGER (FK to users)
start_time        TIMESTAMP
end_time          TIMESTAMP
duration_minutes  INTEGER
timezone          VARCHAR
status            VARCHAR ('available', 'booked', 'cancelled')
max_bookings      INTEGER
current_bookings  INTEGER
job_id            INTEGER (FK to jobs, nullable)
stage_id          INTEGER (FK to job_pipeline_stages, nullable)
```

---

## API Usage

### 1. Assign Interviewer
**Endpoint:** `POST /api/candidates/:id/human-interview/assign-interviewer`

**Request Body:**
```json
{
  "interviewerName": "John Smith",
  "interviewerEmail": "john.smith@company.com",
  "meetingPlatform": "google_meet"
}
```

**Effect:**
- Sets interviewer details
- Generates secure slot selection token
- Sends email to candidate with slot selection link
- Updates `candidate_substage = 'interviewer_assigned'`

**Response:**
```json
{
  "success": true,
  "message": "Interviewer assigned successfully",
  "selectionUrl": "https://your-domain.com/candidate/select-slot/token123"
}
```

---

### 2. Get Available Slots (Public, Token-Protected)
**Endpoint:** `GET /api/candidates/human-interview/available-slots-public?token=<token>`

**Effect:**
- Validates token belongs to candidate
- Returns only slots for assigned interviewer
- Security: Scoped to candidate's interviewer only

**Response:**
```json
{
  "success": true,
  "slots": [
    {
      "id": "slot-uuid-1",
      "start_time": "2025-11-22T10:00:00Z",
      "end_time": "2025-11-22T11:00:00Z",
      "timezone": "America/New_York",
      "duration_minutes": 60
    }
  ],
  "totalSlots": 5
}
```

---

### 3. Select Interview Slot (Public, Token-Protected)
**Endpoint:** `POST /api/candidates/human-interview/select-slot`

**Request Body:**
```json
{
  "slotId": "slot-uuid-1",
  "token": "candidate-selection-token"
}
```

**Effect:**
- Validates token is active and belongs to candidate
- Updates selected_slot_id and meeting_link
- Sets `interview_scheduled_at = CURRENT_TIMESTAMP`
- Clears slot_selection_token (prevents reuse)
- Updates `candidate_substage = 'interview_scheduled'`
- Increments slot booking counter
- Sends notification email to client

**Response:**
```json
{
  "success": true,
  "message": "Interview scheduled successfully",
  "meeting": {
    "platform": "google_meet",
    "link": "https://meet.google.com/abc-defg-hij",
    "startTime": "2025-11-22T10:00:00Z",
    "endTime": "2025-11-22T11:00:00Z",
    "timezone": "America/New_York",
    "instructions": "Click the link 5 minutes before your interview"
  },
  "interviewer": {
    "name": "John Smith",
    "email": "john.smith@company.com"
  }
}
```

---

### 4. Complete Interview with Feedback
**Endpoint:** `POST /api/candidates/:id/human-interview/complete`

**Request Body:**
```json
{
  "feedback": "Strong technical skills, good communication",
  "notes": "Recommended for next round",
  "durationMinutes": 45
}
```

**Effect:**
- Sets `interview_completed_at = CURRENT_TIMESTAMP`
- Updates feedback, notes, and duration
- Updates `candidate_substage = 'feedback_submitted'`

**Response:**
```json
{
  "success": true,
  "message": "Interview completed successfully",
  "candidate": {
    "id": 1,
    "candidate_substage": "feedback_submitted",
    "interview_feedback": "Strong technical skills...",
    "interview_completed_at": "2025-11-22T11:00:00Z"
  }
}
```

---

## UI Implementation Notes

### Action Buttons (Conditional Display)
**Location:** JobDetailsKanban component

**Buttons:**
1. **"Assign Interviewer"** 
   - Visible when: `interviewer_email` is NULL
   - Opens modal with form fields:
     - Interviewer Name (text input)
     - Interviewer Email (email input)
     - Meeting Platform (dropdown: Google Meet / Zoom / Teams)
   
2. **"Complete Interview"**
   - Visible when: Interview scheduled but not completed
   - Opens modal with form fields:
     - Feedback (textarea)
     - Notes (textarea)
     - Duration (number input)

---

## Email Templates

### Slot Selection Email (Sent to Candidate)
**Subject:** Select Your Interview Time Slot

**Content:**
- Gradient purple-to-blue styling
- Personalized greeting with candidate name
- Interviewer details (name, email)
- Meeting platform information
- List of available time slots
- CTA button: "Select Your Time Slot"
- Link to public slot selection portal

### Client Notification Email (Sent When Slot Selected)
**Subject:** Interview Scheduled - [Candidate Name]

**Content:**
- Candidate name and job title
- Selected interview time and timezone
- Interviewer name
- Meeting link
- Platform details

---

## Security Features

### Token-Based Public Access
1. **Token Generation:** Secure random 64-character hex string
2. **Token Rotation:** New token generated on interviewer reassignment
3. **Token Invalidation:** Token cleared after successful slot selection
4. **Scoped Visibility:** Only assigned interviewer's slots visible
5. **Idempotency:** Prevents duplicate slot selections

### Token Lifecycle
```
Interviewer Assigned → Token Generated
                    ↓
                Email Sent to Candidate
                    ↓
                Candidate Clicks Link
                    ↓
                Token Validated
                    ↓
                Slot Selected
                    ↓
                Token Cleared (NULL)
```

### Reassignment Protection
```sql
-- When reassigning interviewer, clear previous schedule:
UPDATE candidates 
SET interviewer_name = 'New Interviewer',
    interviewer_email = 'new@company.com',
    meeting_platform = 'zoom',
    slot_selection_token = 'new-token-here',
    interview_scheduled_at = NULL,
    selected_slot_id = NULL,
    meeting_link = NULL
WHERE id = '<candidate_id>';
```

---

## Testing Example

### Complete Workflow Test
```sql
-- 1. Assign interviewer
UPDATE candidates 
SET interviewer_name = 'Jane Doe',
    interviewer_email = 'jane.doe@company.com',
    meeting_platform = 'google_meet',
    slot_selection_token = 'test-token-123',
    candidate_substage = 'interviewer_assigned'
WHERE id = 1;

-- 2. Candidate selects slot
UPDATE candidates 
SET selected_slot_id = 'slot-uuid-1',
    meeting_link = 'https://meet.google.com/test-link',
    interview_scheduled_at = CURRENT_TIMESTAMP,
    candidate_substage = 'interview_scheduled',
    slot_selection_token = NULL
WHERE id = 1;

-- 3. Mark in progress
UPDATE candidates 
SET candidate_substage = 'interview_in_progress'
WHERE id = 1;

-- 4. Complete interview
UPDATE candidates 
SET interview_completed_at = CURRENT_TIMESTAMP,
    candidate_substage = 'interview_completed'
WHERE id = 1;

-- 5. Submit feedback
UPDATE candidates 
SET interview_feedback = 'Excellent candidate',
    interview_notes = 'Recommend for hire',
    interview_duration_minutes = 60,
    candidate_substage = 'feedback_submitted'
WHERE id = 1;
```

---

## Progress Visualization

**Substage 1 (20%):**
```
[████        ] [            ] [            ] [            ] [            ]
Interviewer Assigned
```

**Substage 5 (100%):**
```
[████████████] [████████████] [████████████] [████████████] [████████████]
Feedback Submitted
```

---

## Key Points

✅ **5 substages** for complete interview workflow tracking
✅ **Email-based slot selection** with beautiful gradient templates
✅ **Mock email/meeting services** for MVP (production-ready structure)
✅ **Token-based security** for public candidate access
✅ **Client notifications** when interviews scheduled
✅ **Flexible meeting platforms** (Google Meet, Zoom, Teams)
✅ **Audit logging** for all email operations

---

## Production Hardening (Future Tasks)

### 1. Token Expiry
```sql
-- Add token expiry timestamp
ALTER TABLE candidates ADD COLUMN slot_selection_token_expires_at TIMESTAMP;

-- Validate token hasn't expired
SELECT * FROM candidates 
WHERE slot_selection_token = $1 
AND slot_selection_token_expires_at > CURRENT_TIMESTAMP;
```

### 2. Atomic Slot Booking
```javascript
// Wrap in transaction to prevent race conditions
await db.transaction(async (tx) => {
  // Check slot availability
  const slot = await tx.query.interviewSlots.findFirst({
    where: eq(interviewSlots.id, slotId)
  });
  
  if (slot.current_bookings >= slot.max_bookings) {
    throw new Error('Slot fully booked');
  }
  
  // Update candidate and increment booking counter atomically
  await tx.update(candidates).set({ selectedSlotId: slotId });
  await tx.update(interviewSlots).set({ currentBookings: slot.current_bookings + 1 });
});
```

### 3. SendGrid Integration
```javascript
// Replace mock email with real SendGrid
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

await sgMail.send({
  to: candidateEmail,
  from: 'noreply@yourcompany.com',
  subject: 'Select Your Interview Time Slot',
  html: emailTemplate
});
```

### 4. Google Meet API Integration
```javascript
// Replace mock meeting link with real Google Calendar API
const { google } = require('googleapis');
const calendar = google.calendar('v3');

const event = await calendar.events.insert({
  calendarId: 'primary',
  conferenceDataVersion: 1,
  requestBody: {
    summary: 'Interview with ' + candidateName,
    start: { dateTime: slot.start_time },
    end: { dateTime: slot.end_time },
    conferenceData: { createRequest: { requestId: randomUUID() } }
  }
});

const meetingLink = event.data.hangoutLink;
```

---

## Related Documentation

- [Complete Substage Transition Guide](./SUBSTAGE_TRANSITION_GUIDE.md)
- [AI Interview Substages](./AI_INTERVIEW_SUBSTAGES.md)
- [Client Endorsement Substages](./CLIENT_ENDORSEMENT_SUBSTAGES.md)
- [Interview Availability Management](../Features/INTERVIEW_AVAILABILITY.md)

---

**Last Updated**: November 21, 2025  
**Version**: 1.0 (MVP with mock email/meeting services)
