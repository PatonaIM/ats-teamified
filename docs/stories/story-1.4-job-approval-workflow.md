# Story 1.4: Job Approval Workflow Management

**Epic:** [Epic 1 - Foundation & Core Infrastructure](../epics/epic-1-foundation-core-infrastructure.md)  
**Story ID:** 1.4  
**Priority:** Phase 1 - MVP Foundation  
**Estimate:** 2 weeks

---

## User Story

**As a** recruiter manager,  
**I want** to review and approve client-submitted job requests before they go live,  
**so that** I can ensure job quality, compliance, and alignment with recruiting strategy before LinkedIn posting and candidate processing begins.

---

## Acceptance Criteria

1. ✅ Job approval queue implemented showing all pending client job requests with priority indicators and submission timestamps
2. ✅ Job review interface implemented displaying complete job details, AI-generated descriptions, and employment type-specific requirements
3. ✅ Approval decision interface implemented with approve/reject options and mandatory feedback comments for rejected jobs
4. ✅ Bulk approval capabilities implemented for routine job requests and similar positions with batch processing efficiency
5. ✅ Job modification during approval implemented allowing recruiter managers to edit job details before approval
6. ✅ Approval escalation workflow implemented for complex jobs requiring senior management review with configurable escalation rules
7. ✅ SLA tracking implemented monitoring approval response times with alerts for approaching deadlines
8. ✅ Approval history reporting implemented providing analytics on approval patterns, rejection reasons, and processing times
9. ✅ Client notification system implemented alerting job creators of approval decisions with detailed feedback and next steps
10. ✅ Conditional approval workflow implemented allowing approval with required modifications and re-submission processes
11. ✅ Role-based approval routing implemented directing different job types to appropriate approval authorities
12. ✅ Approval dashboard analytics implemented showing approval volumes, processing efficiency, and bottleneck identification

---

## Technical Dependencies

**Backend:**
- NestJS approval workflow service
- PostgreSQL tables: job_approvals, approval_history
- Email notification service

**Frontend:**
- React approval queue dashboard
- Tailwind CSS + shadcn/ui components
- Bulk action controls

**Integration:**
- Real-time notifications (WebSocket or polling)
- Email service for approval alerts

---

## Database Schema

```typescript
Table: job_approvals
- id (UUID, PK)
- job_id (UUID, FK)
- status (ENUM: pending, approved, rejected, escalated)
- approver_id (UUID, FK)
- decision_timestamp (TIMESTAMP, nullable)
- feedback_comments (TEXT)
- modifications_made (JSONB)
- escalation_reason (TEXT, nullable)
- created_at (TIMESTAMP)

Table: approval_history
- id (UUID, PK)
- job_id (UUID, FK)
- action (VARCHAR)
- user_id (UUID, FK)
- details (JSONB)
- timestamp (TIMESTAMP)
```

---

## Related Requirements

- FR1: Job Request & Management System
- FR11: Audit Trails & Data Integrity
- FR12: Multi-Channel Notifications

---

## Notes

- **Approval Workflow:** Only client-submitted jobs require approval
- **Recruiter Jobs:** Bypass approval and go directly to LinkedIn posting
- **SLA Monitoring:** Alert if pending >24 hours
- **Bulk Actions:** Allow approving multiple similar jobs simultaneously
- **Modification Rights:** Managers can edit before approving (tracked in audit)
