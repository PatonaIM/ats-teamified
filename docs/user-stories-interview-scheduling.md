# Interview Scheduling Feature - User Stories

## Epic Overview

**Epic Name:** Interview Slot Booking System

**Epic Description:** Enable recruiters/clients to create interview time slots and allow candidates to self-schedule their interviews, reducing back-and-forth communication and improving the candidate experience.

**Business Value:** 
- Reduces scheduling coordination time by 80%
- Improves candidate experience with self-service booking
- Eliminates double-booking and scheduling conflicts
- Provides visibility into interviewer availability
- Increases interview show-up rate through automated reminders

**Target Release:** Q1 2025

---

## User Personas

### Primary Personas

**1. Sarah - Hiring Manager / Recruiter**
- Role: Talent Acquisition Manager
- Goals: Fill positions quickly with quality candidates
- Pain Points: Spends 2-3 hours daily coordinating interview schedules
- Tech Savviness: Medium
- Needs: Simple interface to create slots, view bookings, manage calendar

**2. Alex - Job Candidate**
- Role: Software Engineer (applicant)
- Goals: Find the right job opportunity
- Pain Points: Email ping-pong for scheduling, timezone confusion
- Tech Savviness: High
- Needs: Easy booking interface, clear confirmation, calendar integration

**3. Michael - Interview Panel Member**
- Role: Senior Engineer (interviewer)
- Goals: Participate in hiring quality team members
- Pain Points: Last-minute schedule changes, double-booked slots
- Tech Savviness: High
- Needs: Calendar sync, advance notice, conflict prevention

---

## User Stories

### US-1: Create Interview Time Slots

**As a** recruiter  
**I want to** create multiple interview time slots for a specific job/stage  
**So that** candidates can self-select their preferred interview time

**Acceptance Criteria:**
- [ ] Recruiter can access slot creation from candidate's pipeline stage
- [ ] Can set date range (e.g., "Next 2 weeks")
- [ ] Can set time slots (e.g., "9:00 AM - 5:00 PM")
- [ ] Can define slot duration (15, 30, 45, 60, 90, 120 minutes)
- [ ] Can set break time between slots (0, 15, 30 minutes)
- [ ] Can exclude specific dates/times (holidays, lunch breaks)
- [ ] Can specify interview type (Phone, Video, On-site)
- [ ] Can add video conference link (Zoom, Teams, Google Meet)
- [ ] Can set timezone for slots
- [ ] Can set maximum bookings per slot (1 for individual, 5+ for panel)
- [ ] Can preview generated slots before saving
- [ ] System validates no overlapping slots with existing bookings

**Priority:** P0 (Must Have)  
**Story Points:** 8  
**Dependencies:** None

---

### US-2: View Available Interview Slots

**As a** candidate  
**I want to** view all available interview time slots  
**So that** I can choose a time that works best for my schedule

**Acceptance Criteria:**
- [ ] Candidate receives email invitation with booking link
- [ ] Booking page shows candidate name, job title, company logo
- [ ] Slots are displayed in candidate's local timezone (auto-detected)
- [ ] Can manually change timezone if needed
- [ ] Slots are grouped by date with clear headers
- [ ] Shows interview type (Phone/Video/On-site) for each slot
- [ ] Shows interview duration for each slot
- [ ] Booked slots are hidden/grayed out and not selectable
- [ ] If no slots available, shows "No available slots" message
- [ ] Mobile-responsive design for booking on phone
- [ ] Can filter by date range or time of day
- [ ] Shows interviewer name(s) if configured

**Priority:** P0 (Must Have)  
**Story Points:** 5  
**Dependencies:** US-1

---

### US-3: Book Interview Slot

**As a** candidate  
**I want to** book my preferred interview time slot  
**So that** I can confirm my interview without email back-and-forth

**Acceptance Criteria:**
- [ ] Candidate clicks on available slot to select
- [ ] Visual confirmation of selected slot (highlighted)
- [ ] Can change selection before confirming
- [ ] Confirmation button is clearly visible
- [ ] Must confirm email address before booking
- [ ] Shows summary: Date, Time, Duration, Type, Location/Link
- [ ] Can add to calendar (.ics file download)
- [ ] Receives confirmation email immediately
- [ ] Confirmation email includes:
  - Interview details (date, time, duration)
  - Video conference link (if applicable)
  - Interviewer name(s)
  - Calendar attachment (.ics)
  - Preparation instructions (if configured)
  - Cancellation/reschedule link
- [ ] Slot becomes unavailable to other candidates immediately
- [ ] Handles concurrent booking attempts (first come, first served)

**Priority:** P0 (Must Have)  
**Story Points:** 8  
**Dependencies:** US-2

---

### US-4: Recruiter View Booked Slots

**As a** recruiter  
**I want to** see all booked interview slots for a candidate/job  
**So that** I can track scheduled interviews and prepare accordingly

**Acceptance Criteria:**
- [ ] Dashboard shows upcoming interviews by date
- [ ] Can filter by: Job, Candidate, Stage, Date Range, Interview Type
- [ ] Each booking shows:
  - Candidate name and photo
  - Job title
  - Interview date and time
  - Interview type and location/link
  - Interviewer name(s)
  - Booking status (Confirmed, Pending, Cancelled)
- [ ] Can export to calendar (Google, Outlook, Apple)
- [ ] Shows total slots: Available, Booked, Past
- [ ] Can click to view candidate profile
- [ ] Visual indicator for interviews happening today
- [ ] Shows timezone for each interview

**Priority:** P0 (Must Have)  
**Story Points:** 5  
**Dependencies:** US-3

---

### US-5: Reschedule Interview

**As a** candidate  
**I want to** reschedule my interview if my plans change  
**So that** I don't miss the opportunity due to a conflict

**Acceptance Criteria:**
- [ ] Candidate can access reschedule link from confirmation email
- [ ] Shows current booking details
- [ ] Shows available alternative slots
- [ ] Can select new slot and confirm change
- [ ] Original slot becomes available again
- [ ] Sends notification to recruiter about reschedule
- [ ] Sends updated calendar invite
- [ ] Can reschedule up to 24 hours before interview
- [ ] Shows reschedule history (max 2 reschedules allowed)
- [ ] If no reschedules left, shows "Contact recruiter" message

**Priority:** P1 (Should Have)  
**Story Points:** 5  
**Dependencies:** US-3

---

### US-6: Cancel Interview

**As a** candidate  
**I want to** cancel my interview if I'm no longer interested  
**So that** the slot becomes available for other candidates

**Acceptance Criteria:**
- [ ] Candidate can access cancellation link from email
- [ ] Shows confirmation dialog: "Are you sure you want to cancel?"
- [ ] Optional: Reason for cancellation dropdown
- [ ] Sends cancellation notification to recruiter
- [ ] Slot becomes available immediately
- [ ] Updates candidate status in ATS pipeline
- [ ] Sends cancellation confirmation email to candidate
- [ ] Logs cancellation in candidate activity history

**Priority:** P1 (Should Have)  
**Story Points:** 3  
**Dependencies:** US-3

---

### US-7: Automated Interview Reminders

**As a** candidate  
**I want to** receive reminders about my upcoming interview  
**So that** I don't forget and can prepare in advance

**Acceptance Criteria:**
- [ ] Sends reminder 24 hours before interview
- [ ] Sends reminder 1 hour before interview (for video/phone)
- [ ] Reminder includes:
  - Interview details (date, time, duration)
  - Video link / phone number
  - Interviewer name(s)
  - Preparation tips
  - Join button (for video interviews)
- [ ] Recruiter receives reminder 1 hour before
- [ ] Can configure reminder timing in settings
- [ ] Reminders respect timezone

**Priority:** P1 (Should Have)  
**Story Points:** 5  
**Dependencies:** US-3

---

### US-8: Bulk Slot Creation

**As a** recruiter  
**I want to** create interview slots for multiple interviewers at once  
**So that** I can quickly set up panel interview availability

**Acceptance Criteria:**
- [ ] Can select multiple interviewers from team
- [ ] System shows combined availability (intersection of calendars)
- [ ] Can create slots that work for all selected interviewers
- [ ] Each booking assigns all selected interviewers
- [ ] Prevents double-booking for any interviewer
- [ ] Shows conflict warnings if interviewer has existing booking
- [ ] Can set primary interviewer and optional interviewers

**Priority:** P2 (Could Have)  
**Story Points:** 8  
**Dependencies:** US-1

---

### US-9: Calendar Integration (Two-Way Sync)

**As a** recruiter/interviewer  
**I want to** sync interview slots with my Google/Outlook calendar  
**So that** my availability is automatically reflected and I don't get double-booked

**Acceptance Criteria:**
- [ ] Can connect Google Calendar via OAuth
- [ ] Can connect Microsoft Outlook/Office 365
- [ ] System checks calendar availability before creating slots
- [ ] Blocks out existing calendar events
- [ ] Creates calendar event when slot is booked
- [ ] Updates calendar event if rescheduled
- [ ] Deletes calendar event if cancelled
- [ ] Two-way sync: external bookings block ATS slots
- [ ] Shows sync status indicator
- [ ] Can disconnect calendar integration

**Priority:** P2 (Could Have)  
**Story Points:** 13  
**Dependencies:** US-1, US-3

---

### US-10: Interview Slot Templates

**As a** recruiter  
**I want to** save my slot configurations as templates  
**So that** I can quickly reuse common scheduling patterns

**Acceptance Criteria:**
- [ ] Can save slot configuration as template with name
- [ ] Template includes: duration, break time, time ranges, interview type
- [ ] Can load template when creating new slots
- [ ] Can edit template-based slots before saving
- [ ] Can manage templates (view, edit, delete)
- [ ] Templates are organization-wide (shared with team)
- [ ] Common templates: "Phone Screen", "Technical Interview", "Final Round"

**Priority:** P2 (Could Have)  
**Story Points:** 5  
**Dependencies:** US-1

---

### US-11: Buffer Time Configuration

**As a** recruiter  
**I want to** set buffer time before and after interviews  
**So that** interviewers have time to prepare and write feedback

**Acceptance Criteria:**
- [ ] Can set buffer before interview (0, 15, 30 minutes)
- [ ] Can set buffer after interview (0, 15, 30, 45 minutes)
- [ ] Buffer time is blocked in calendar
- [ ] Buffer time is not visible to candidates
- [ ] Prevents back-to-back interviews without break
- [ ] Can configure default buffer in settings

**Priority:** P2 (Could Have)  
**Story Points:** 3  
**Dependencies:** US-1

---

### US-12: Multi-Stage Interview Booking

**As a** candidate  
**I want to** book multiple interview rounds at once  
**So that** I can plan my schedule efficiently

**Acceptance Criteria:**
- [ ] Can book sequential interview stages in one session
- [ ] Shows available slots for each stage
- [ ] Ensures minimum gap between stages (e.g., 2 days)
- [ ] Books all stages or none (atomic operation)
- [ ] Sends single confirmation with all interview details
- [ ] Shows interview sequence and progression

**Priority:** P3 (Nice to Have)  
**Story Points:** 8  
**Dependencies:** US-3

---

## User Flows

### Flow 1: Recruiter Creates Slots and Candidate Books

```
RECRUITER SIDE:
1. Recruiter opens candidate profile in pipeline
2. Clicks "Schedule Interview" button on stage card
3. Selects interview stage (e.g., "Technical Interview")
4. Chooses slot creation method:
   - Quick slots (use template)
   - Custom slots (manual configuration)
5. Configures slot settings:
   - Date range: Feb 1-15, 2025
   - Working hours: 9 AM - 5 PM
   - Duration: 60 minutes
   - Break between slots: 15 minutes
   - Interview type: Video
   - Video link: [Zoom link]
6. Reviews generated slots (preview)
7. Clicks "Create Slots & Send Invitation"
8. System sends email to candidate with booking link

CANDIDATE SIDE:
9. Candidate receives email: "Schedule Your Interview with [Company]"
10. Clicks "View Available Times" button
11. Booking page loads showing:
    - Company logo and job title
    - Interview details (duration, type)
    - Calendar view of available slots
12. Candidate browses slots, filtered by timezone
13. Clicks preferred slot (e.g., Feb 5, 2 PM)
14. Slot highlights in purple
15. Reviews details and clicks "Confirm Booking"
16. Enters/confirms email address
17. Sees success message with interview details
18. Receives confirmation email with:
    - Calendar invite (.ics)
    - Video link
    - Preparation instructions

RECRUITER NOTIFICATION:
19. Recruiter receives email: "[Candidate] booked interview"
20. Interview appears in recruiter's dashboard
21. Calendar event created automatically
```

### Flow 2: Candidate Reschedules Interview

```
1. Candidate opens confirmation email
2. Clicks "Need to Reschedule?" link
3. Reschedule page loads showing:
   - Current booking details
   - Available alternative slots
4. Candidate selects new slot
5. Clicks "Confirm Reschedule"
6. System updates booking
7. Candidate receives updated confirmation
8. Recruiter receives reschedule notification
9. Original slot becomes available again
10. Calendar events updated for all parties
```

---

## Edge Cases & Constraints

### Edge Cases

**EC-1: Concurrent Booking Attempts**
- **Scenario:** Two candidates try to book the same slot simultaneously
- **Solution:** First request locks the slot. Second request sees "Slot just booked, please select another"
- **Implementation:** Optimistic locking with database-level constraints

**EC-2: Timezone Confusion**
- **Scenario:** Candidate in different timezone books slot
- **Solution:** 
  - Auto-detect candidate timezone from browser
  - Show times in candidate's timezone
  - Confirmation email shows both timezones
  - Example: "2:00 PM PST (5:00 PM EST)"

**EC-3: Last-Minute Cancellation**
- **Scenario:** Candidate cancels 30 minutes before interview
- **Solution:**
  - Allow cancellation but flag as "late cancellation"
  - Send urgent notification to recruiter
  - Slot becomes available but marked "recently freed"
  - Track candidate reliability score

**EC-4: Recruiter Deletes Slots After Booking**
- **Scenario:** Recruiter needs to delete time slots that are already booked
- **Solution:**
  - Show warning: "X slots are booked. Cancel these interviews?"
  - Require confirmation
  - Send cancellation emails to affected candidates
  - Log action in audit trail

**EC-5: Interview Runs Over Time**
- **Scenario:** Previous interview runs late, conflicts with next booking
- **Solution:**
  - Buffer time prevents back-to-back scheduling
  - Send reminder to interviewer 5 minutes before end time
  - Allow manual extension with notification to next candidate

**EC-6: No Available Slots**
- **Scenario:** All slots are booked or no slots created
- **Solution:**
  - Show message: "No available times right now"
  - Provide "Contact recruiter" button
  - Option to "Notify me when new slots are available"

### Business Constraints

**BC-1: Booking Window**
- Candidates can only book slots at least 4 hours in advance
- Prevents last-minute bookings without preparation time
- Configurable per organization

**BC-2: Reschedule Limits**
- Maximum 2 reschedules per candidate per stage
- Prevents abuse and scheduling churn
- After limit, must contact recruiter

**BC-3: Cancellation Policy**
- Can cancel up to 24 hours before interview (no penalty)
- 4-24 hours before: Recorded as "short notice"
- Less than 4 hours: Recorded as "no-show risk"
- Impacts candidate reliability score

**BC-4: Slot Availability Duration**
- Slots expire if not booked within 7 days
- Sends reminder to candidate after 48 hours if no booking
- After expiry, recruiter receives notification

**BC-5: Working Hours**
- Slots only created during business hours (configurable)
- Default: Mon-Fri, 8 AM - 6 PM local time
- Excludes public holidays (configurable by region)

---

## Technical Considerations

### Data Model

**Interview Slot**
```
{
  id: UUID
  job_id: UUID
  stage_id: UUID
  interviewer_ids: [UUID]
  start_time: DateTime (UTC)
  end_time: DateTime (UTC)
  duration_minutes: Integer
  buffer_before_minutes: Integer
  buffer_after_minutes: Integer
  interview_type: Enum [phone, video, onsite]
  video_link: String (optional)
  location: String (optional)
  timezone: String
  max_bookings: Integer
  current_bookings: Integer
  status: Enum [available, booked, cancelled]
  created_by: UUID
  created_at: DateTime
  updated_at: DateTime
}
```

**Interview Booking**
```
{
  id: UUID
  slot_id: UUID
  candidate_id: UUID
  job_id: UUID
  stage_id: UUID
  booking_token: String (for reschedule/cancel links)
  status: Enum [confirmed, rescheduled, cancelled, completed]
  booked_at: DateTime
  confirmed_email: String
  reschedule_count: Integer
  cancellation_reason: String (optional)
  candidate_timezone: String
  reminder_sent_24h: Boolean
  reminder_sent_1h: Boolean
  created_at: DateTime
  updated_at: DateTime
}
```

### API Endpoints

```
POST   /api/jobs/{jobId}/stages/{stageId}/slots              # Create slots
GET    /api/jobs/{jobId}/stages/{stageId}/slots              # List slots
GET    /api/slots/{slotId}                                   # Get slot details
DELETE /api/slots/{slotId}                                   # Delete slot

GET    /api/candidates/{candidateId}/available-slots         # View available
POST   /api/slots/{slotId}/book                              # Book slot
GET    /api/bookings/{bookingToken}                          # Get booking details
POST   /api/bookings/{bookingToken}/reschedule               # Reschedule
POST   /api/bookings/{bookingToken}/cancel                   # Cancel

GET    /api/jobs/{jobId}/bookings                            # List all bookings
GET    /api/interviewers/{userId}/bookings                   # Interviewer calendar
```

### Email Templates Required

1. **Slot Invitation Email** - "Schedule Your Interview"
2. **Booking Confirmation Email** - "Interview Confirmed"
3. **Reschedule Notification (to Recruiter)** - "Interview Rescheduled"
4. **Reschedule Confirmation (to Candidate)** - "Interview Rescheduled"
5. **Cancellation Notification** - "Interview Cancelled"
6. **24-Hour Reminder Email** - "Interview Tomorrow"
7. **1-Hour Reminder Email** - "Interview in 1 Hour"
8. **No Booking Reminder** - "Don't forget to schedule"

### Integration Points

1. **Calendar Services:**
   - Google Calendar API
   - Microsoft Graph API (Outlook/Office 365)
   - Apple Calendar (.ics generation)

2. **Video Conferencing:**
   - Zoom API (auto-create meeting links)
   - Microsoft Teams API
   - Google Meet API

3. **Email Service:**
   - Transactional email provider (SendGrid, Postmark)
   - Email template engine

4. **Timezone Service:**
   - IANA timezone database
   - Moment Timezone / date-fns-tz

---

## Success Metrics

### Primary Metrics

**Efficiency Gains:**
- **Time to Schedule:** < 2 minutes (vs 2-3 days with email)
- **Scheduling Coordination Time:** 80% reduction
- **Double-Booking Incidents:** 0% (vs 5% manual)

**Candidate Experience:**
- **Booking Completion Rate:** > 85%
- **Candidate Satisfaction Score:** > 4.5/5
- **Time to Book:** < 3 minutes from email receipt

**Interview Attendance:**
- **Show-Up Rate:** > 92% (vs 85% manual)
- **Late Cancellation Rate:** < 5%
- **Reschedule Rate:** < 15%

### Secondary Metrics

- **Slot Utilization Rate:** 70-80% of created slots booked
- **Template Usage Rate:** > 60% of slots created from templates
- **Mobile Booking Rate:** > 40% of bookings on mobile
- **Calendar Integration Adoption:** > 50% of recruiters
- **Average Slots Per Job:** 10-15 slots
- **Booking to Interview Time:** 3-5 days average

### Analytics Dashboard Should Show:

- Total slots created (by job, date range)
- Booking rate over time
- Peak booking times (to optimize slot creation)
- Reschedule and cancellation trends
- Candidate timezone distribution
- Interview type distribution
- Slot utilization by interviewer

---

## Implementation Phases

### Phase 1: MVP (4-6 weeks)
- US-1: Create Interview Time Slots
- US-2: View Available Interview Slots
- US-3: Book Interview Slot
- US-4: Recruiter View Booked Slots
- Basic email notifications

### Phase 2: Enhancement (3-4 weeks)
- US-5: Reschedule Interview
- US-6: Cancel Interview
- US-7: Automated Interview Reminders
- Email template improvements

### Phase 3: Advanced Features (4-6 weeks)
- US-8: Bulk Slot Creation
- US-9: Calendar Integration
- US-10: Interview Slot Templates
- US-11: Buffer Time Configuration

### Phase 4: Polish (2-3 weeks)
- US-12: Multi-Stage Interview Booking
- Analytics dashboard
- Performance optimization
- Mobile app support

---

## Open Questions

1. **Q:** Should we allow candidates to propose alternative times if no slots work?
   **A:** TBD - Discuss with product team

2. **Q:** What happens if interviewer gets sick/unavailable after booking?
   **A:** TBD - Need manual override/reassignment flow

3. **Q:** Should we support recurring interview slots (e.g., "Every Tuesday 2-5 PM")?
   **A:** TBD - Could be Phase 4 feature

4. **Q:** How to handle panel interviews where different interviewers needed for each stage?
   **A:** TBD - May need "interviewer rotation" logic

5. **Q:** Should we integrate with ATS calendar for interviewer availability?
   **A:** Yes - Covered in US-9 (Calendar Integration)

6. **Q:** What if candidate doesn't book within X days?
   **A:** Send reminders, then escalate to recruiter

---

## Appendix: Wireframe Notes

### Slot Creation Interface (Recruiter)
- Left panel: Calendar preview
- Right panel: Configuration form
- Bottom: Generated slots preview table
- Action buttons: "Create Slots", "Save as Template", "Cancel"

### Booking Interface (Candidate)
- Header: Job title, company logo, interview stage
- Calendar view with available slots highlighted
- Selected slot details panel
- Timezone selector dropdown
- "Confirm Booking" CTA button

### Dashboard View (Recruiter)
- Upcoming interviews timeline
- Filter sidebar (job, stage, date, interviewer)
- Interview cards with candidate photo, time, type
- Quick actions: "View Profile", "Reschedule", "Cancel"

---

**Document Version:** 1.0  
**Last Updated:** 2025-01-17  
**Owner:** Product Team  
**Stakeholders:** Engineering, Design, Recruiting Ops
