# Story 2.7: Job Detail & Candidate Management Interface **[MVP - FR19]**

**Epic:** [Epic 2 - External Portal Integration & Candidate Processing](../epics/epic-2-external-portal-integration.md)  
**Story ID:** 2.7  
**Priority:** Phase 1 - MVP Foundation ⭐  
**Estimate:** 3 weeks

---

## User Story

**As a** recruiter or hiring manager,  
**I want** a comprehensive job detail page with split-screen candidate management,  
**so that** I can efficiently review candidates and make progression decisions without losing context.

---

## Acceptance Criteria

1. ✅ Split-screen interface layout implemented with distinct left sidebar (stages/candidates) and right sidebar (candidate details) sections
2. ✅ Short job info header implemented displaying job title, employment type, posting date, active candidate count, and key metrics on main page
3. ✅ Long job info popup/modal implemented with complete job description, requirements, benefits, LinkedIn posting details, and edit job button
4. ✅ Left sidebar pipeline stages list implemented with drag-and-drop stage navigation showing stage names and candidate counts per stage
5. ✅ Candidate list under each stage implemented displaying candidate cards with name, photo, key qualifications, and current status
6. ✅ Stage-specific candidate filtering implemented allowing quick view of candidates in selected pipeline stage
7. ✅ Right sidebar candidate details panel implemented with tabbed sections for resume viewer, application history timeline, assessment results, interview notes, and document verification status
8. ✅ Resume viewer implemented with inline PDF/document display, highlighting of key qualifications, and download capability
9. ✅ Application history timeline implemented showing all candidate movements, decisions, communications, and timestamps
10. ✅ Prominent action buttons implemented in right sidebar: "Move to Next Stage" (green) and "Disqualify" (red) with decision confirmation workflows
11. ✅ Decision confirmation modals implemented requiring reason selection for disqualification decisions with rejection reason categorization
12. ✅ Automatic stage progression implemented moving candidate to next configured stage upon "Move to Next Stage" action with audit trail recording
13. ✅ Bulk candidate selection implemented allowing multi-candidate decision workflows for efficiency
14. ✅ Keyboard shortcuts implemented for power users (Enter to accept, R to reject, Arrow keys for candidate navigation)
15. ✅ Context preservation implemented ensuring job and stage context maintained during candidate review workflow

---

## Technical Dependencies

**Backend:**
- NestJS job detail service
- PostgreSQL for candidate data
- Azure Blob Storage for resume files

**Frontend:**
- React split-screen layout
- PDF viewer library (react-pdf or pdf.js)
- Tailwind CSS + shadcn/ui components
- Keyboard event handlers

---

## Interface Layout

```
┌────────────────────────────────────────────────────────────────┐
│ Senior Full-Stack Developer (Full-Time) • 35 candidates        │
│ Posted 14 days ago • [View Full Details] [Edit Job]            │
├──────────────────┬─────────────────────────────────────────────┤
│ LEFT SIDEBAR     │ RIGHT SIDEBAR                               │
│                  │                                             │
│ ▼ Screening (15) │ John Doe                                    │
│   • John Doe ✓   │ john.doe@email.com • (555) 123-4567        │
│   • Jane Smith   │                                             │
│   • Mike Jones   │ [Resume] [History] [Assessments] [Notes]   │
│                  │                                             │
│ ▼ Shortlist (12) │ ┌─────────────────────────────────────┐   │
│   • Sarah Lee    │ │ Resume Viewer                       │   │
│   • Tom Brown    │ │ [PDF displayed inline]              │   │
│                  │ │                                     │   │
│ ▶ Client End (5) │ └─────────────────────────────────────┘   │
│                  │                                             │
│ ▶ Interview (2)  │ [Move to Next Stage] [Disqualify]         │
│                  │                                             │
│ ▶ Offer (1)      │                                             │
│                  │                                             │
│ ▶ Accepted (0)   │                                             │
└──────────────────┴─────────────────────────────────────────────┘
```

---

## Candidate Card Details

**Left Sidebar Card:**
```
┌────────────────────────────┐
│ [Photo] John Doe          │
│ 8 years • Full-Stack Dev  │
│ React, Node.js, AWS       │
│ ⏱️ 3 days in stage        │
│ ⚠️ Action required        │
└────────────────────────────┘
```

---

## Right Sidebar Tabs

### 1. Resume Tab
- Inline PDF viewer
- Key qualifications highlighting
- Download button
- Skills extraction display

### 2. History Tab
```
Timeline:
• Nov 10: Moved to Screening (by Recruiter A)
• Nov 12: Interview scheduled
• Nov 13: Moved to Shortlist (by Recruiter A)
• Nov 14: Email sent to candidate
```

### 3. Assessments Tab
- Assessment scores and results
- Completion timestamps
- Pass/fail indicators
- Detailed analysis (Phase 2)

### 4. Notes Tab
- Recruiter notes and comments
- Interview feedback
- Internal communications
- Timestamped entries

---

## Keyboard Shortcuts

- **Enter** - Accept and move to next stage
- **R** - Reject candidate
- **↑/↓** - Navigate between candidates
- **←/→** - Navigate between stages
- **Esc** - Close modals
- **Ctrl+F** - Search candidates

---

## Related Requirements

- FR19: Job Detail Page Layout [MVP]
- FR6: Accept/Reject Decision Framework
- FR11: Audit Trails & Data Integrity

---

## Notes

- **MVP Critical:** This is the primary candidate review interface
- **Performance:** Lazy load candidate details when selected
- **UX Focus:** Minimize clicks - most actions accessible from main screen
- **Context Preservation:** Remember selected stage/candidate across sessions
- **Mobile Responsive:** Adapt to stacked layout on smaller screens
