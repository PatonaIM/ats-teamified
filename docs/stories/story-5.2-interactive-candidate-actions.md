# Story 5.2: Interactive Candidate Actions & Self-Service *[Phase 2]*

**Epic:** [Epic 5 - Candidate Experience & Notification Platform](../epics/epic-5-candidate-experience-notification.md)  
**Story ID:** 5.2  
**Priority:** Phase 2 - Advanced Features  
**Estimate:** 3 weeks

---

## User Story

**As a** candidate,  
**I want** to complete assessments, schedule interviews, and manage offers independently,  
**so that** I can control my application journey and respond promptly to opportunities.

---

## Acceptance Criteria

1. ✅ Assessment scheduling implemented with self-service booking and reminder functionality
2. ✅ Interview scheduling implemented with real-time availability and automatic confirmation
3. ✅ Document submission workflow implemented with guided upload and validation feedback
4. ✅ Offer review interface implemented with detailed terms display and response options
5. ✅ Interview rescheduling capabilities implemented with appropriate constraints and approval workflows
6. ✅ Assessment retake functionality implemented according to client-configured policies
7. ✅ Offer negotiation platform implemented enabling structured communication and counteroffer submission
8. ✅ Action completion tracking implemented showing candidates their progress and next steps

---

## Technical Dependencies

**Frontend:**
- React self-service interfaces
- Calendar integration (react-big-calendar)
- File upload components
- Offer review and acceptance workflow

**Backend:**
- NestJS candidate action service
- Real-time availability checking
- Document validation and storage

---

## Self-Service Actions

### 1. Schedule Interview
```
┌────────────────────────────────────────┐
│ Schedule Your Interview                │
├────────────────────────────────────────┤
│ Available Time Slots:                  │
│                                        │
│ ○ Tomorrow, 2:00 PM - 3:00 PM         │
│ ○ Nov 16, 10:00 AM - 11:00 AM        │
│ ○ Nov 17, 3:00 PM - 4:00 PM          │
│                                        │
│ Interview Format: Video (Zoom)         │
│ Interviewers: Sarah L., Mike J.       │
│ Duration: 60 minutes                   │
│                                        │
│ [Confirm Selection]                    │
└────────────────────────────────────────┘
```

### 2. Upload Documents
```
┌────────────────────────────────────────┐
│ Upload Required Documents              │
├────────────────────────────────────────┤
│ ✓ Resume (uploaded)                    │
│ ✓ Cover Letter (uploaded)             │
│ ⏳ References (pending)                │
│                                        │
│ Drag & drop files or click to upload  │
│ [Upload Area]                          │
│                                        │
│ Accepted: PDF, DOC, DOCX (max 5MB)    │
└────────────────────────────────────────┘
```

### 3. Review Offer
```
┌────────────────────────────────────────┐
│ Offer Details                          │
├────────────────────────────────────────┤
│ Position: Senior Developer             │
│ Salary: $155,000/year                  │
│ Start Date: Dec 1, 2025                │
│ Benefits: Health, Dental, 401k, PTO    │
│                                        │
│ [View Full Details]                    │
│                                        │
│ This offer expires in 7 days           │
│                                        │
│ [Accept Offer] [Request Negotiation]   │
│ [Decline Offer]                        │
└────────────────────────────────────────┘
```

---

## Related Requirements

- FR9: Candidate Portal
- FR17: Team Connect Integration (scheduling)
- FR3: External Portal Integration

---

## Notes

- **Phase 2 Only:** Self-service candidate actions
- **Interview Scheduling:** Real-time availability from Team Connect
- **Offer Management:** Digital acceptance and negotiation
- **Document Upload:** Secure Azure Blob Storage with validation
