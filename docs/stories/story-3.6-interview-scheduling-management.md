# Story 3.6: Interview Scheduling & Management System *[Phase 2]*

**Epic:** [Epic 3 - Assessment, Interview & Document Verification Systems](../epics/epic-3-assessment-interview-document-verification.md)  
**Story ID:** 3.6  
**Priority:** Phase 2 - Advanced Features  
**Estimate:** 3 weeks

---

## User Story

**As a** recruiter and candidate,  
**I want** comprehensive interview scheduling and management capabilities,  
**so that** interviews can be efficiently coordinated, conducted, and evaluated across different employment types and interview formats.

---

## Acceptance Criteria

1. ✅ Interview scheduling interface implemented with calendar integration supporting multiple interviewer availability
2. ✅ Interview type configuration implemented supporting phone, video, in-person, and panel interview formats
3. ✅ Employment type-specific interview workflows implemented with customizable stage placement and requirements
4. ✅ Candidate self-scheduling implemented with available time slot selection and automatic confirmation
5. ✅ Interview reminder system implemented with multi-channel notifications for all participants
6. ✅ Video interview integration implemented with popular platforms (Zoom, Teams, Meet) and automatic link generation
7. ✅ Interview feedback collection implemented with structured evaluation forms and scoring systems
8. ✅ Interview rescheduling workflows implemented with approval processes and automatic re-notification
9. ✅ Interview preparation materials implemented allowing attachment sharing and candidate briefing documents
10. ✅ Interview analytics implemented tracking completion rates, feedback quality, and scheduling efficiency
11. ✅ Panel interview coordination implemented with multiple interviewer scheduling and feedback consolidation
12. ✅ Interview recording and note-taking capabilities implemented with secure storage and access controls

---

## Technical Dependencies

**Backend:**
- NestJS interview service
- PostgreSQL tables: interviews, interview_feedback, interview_participants
- Calendar API (Google Calendar, Outlook, etc.)
- Video platform APIs (Zoom, Teams, Meet)

**Frontend:**
- React calendar/scheduling interface
- Team Connect integration (Phase 2)
- Video conferencing links

---

## Interview Types

### Phone Interview
- Duration: 15-30 minutes
- Participants: 1-2 interviewers
- Format: Casual screening call
- Recording: Optional

### Video Interview
- Duration: 30-60 minutes
- Participants: 1-5 interviewers
- Platforms: Zoom, Teams, Meet
- Recording: Recommended

### In-Person Interview
- Duration: 45-90 minutes
- Location: Office address
- Participants: 1-10 interviewers
- Materials: Physical documents

### Panel Interview
- Duration: 60-120 minutes
- Participants: 3-8 interviewers
- Coordination: Multi-calendar sync
- Feedback: Consolidated scoring

---

## Scheduling Flow

```
Recruiter initiates interview
    ↓
Select interview type and participants
    ↓
Check interviewer availability
    ↓
Propose time slots to candidate
    ↓
Candidate selects preferred time
    ↓
Calendar invites sent to all
    ↓
Video link generated (if virtual)
    ↓
Reminders sent (24h, 1h before)
    ↓
Interview conducted
    ↓
Feedback forms sent to interviewers
    ↓
Feedback collected and scored
```

---

## Database Schema

```typescript
Table: interviews
- id (UUID, PK)
- candidate_id (UUID, FK)
- job_id (UUID, FK)
- interview_type (ENUM: phone, video, in_person, panel)
- scheduled_at (TIMESTAMP)
- duration_minutes (INTEGER)
- video_link (VARCHAR, nullable)
- location (VARCHAR, nullable)
- status (ENUM: scheduled, completed, cancelled, rescheduled)
- notes (TEXT)
- created_at (TIMESTAMP)

Table: interview_participants
- id (UUID, PK)
- interview_id (UUID, FK)
- user_id (UUID, FK)
- role (ENUM: interviewer, panelist, observer)
- attendance_status (ENUM: confirmed, tentative, declined)

Table: interview_feedback
- id (UUID, PK)
- interview_id (UUID, FK)
- interviewer_id (UUID, FK)
- overall_score (INTEGER) // 1-10
- technical_score (INTEGER, nullable)
- cultural_fit_score (INTEGER, nullable)
- communication_score (INTEGER, nullable)
- recommendation (ENUM: strong_yes, yes, maybe, no, strong_no)
- detailed_feedback (TEXT)
- submitted_at (TIMESTAMP)
```

---

## Video Platform Integration

### Zoom
```typescript
// Auto-generate Zoom meeting link
const zoomMeeting = await createZoomMeeting({
  topic: `Interview: ${candidate.name} - ${job.title}`,
  start_time: scheduledAt,
  duration: durationMinutes,
  settings: {
    join_before_host: false,
    waiting_room: true,
    auto_recording: 'cloud'
  }
});
```

### Microsoft Teams
```typescript
// Generate Teams meeting link
const teamsMeeting = await createTeamsMeeting({
  subject: `Interview: ${candidate.name}`,
  startDateTime: scheduledAt,
  endDateTime: addMinutes(scheduledAt, durationMinutes),
  participants: interviewers.map(i => i.email)
});
```

---

## Related Requirements

- FR17: Team Connect Integration
- FR9: Candidate Portal (self-scheduling)
- FR12: Multi-Channel Notifications (reminders)

---

## Notes

- **Phase 2 Only:** Full interview scheduling requires Team Connect integration
- **Self-Scheduling:** Candidates select from available time slots
- **Reminders:** Auto-send 24 hours and 1 hour before interview
- **Feedback:** Structured forms ensure consistent evaluation
- **Recording:** Comply with local recording consent laws
