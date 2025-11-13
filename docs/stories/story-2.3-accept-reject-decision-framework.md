# Story 2.3: Accept/Reject Decision Framework **[MVP]**

**Epic:** [Epic 2 - External Portal Integration & Candidate Processing](../epics/epic-2-external-portal-integration.md)  
**Story ID:** 2.3  
**Priority:** Phase 1 - MVP Foundation ⭐  
**Estimate:** 2 weeks

---

## User Story

**As a** recruiter,  
**I want** clear accept/reject decision options at every pipeline stage,  
**so that** candidates progress definitively through the hiring process or are removed.

---

## Acceptance Criteria

1. ✅ Binary decision interface implemented with prominent accept/reject buttons for all stages
2. ✅ Rejection reason categorization implemented with required reason selection for audit trails
3. ✅ Decision confirmation workflows implemented preventing accidental candidate rejections
4. ✅ Irreversible rejection enforcement implemented ensuring rejected candidates cannot re-enter pipeline
5. ✅ Decision maker tracking implemented recording user, timestamp, and justification for all decisions
6. ✅ Bulk decision capabilities implemented for efficiency in high-volume candidate processing
7. ✅ Decision audit reporting implemented for compliance and process improvement analysis
8. ✅ Decision notification system implemented alerting stakeholders of stage progression and rejections

---

## Technical Dependencies

**Backend:**
- NestJS decision service
- PostgreSQL tables: decisions, rejection_reasons
- Email notification service

**Frontend:**
- React decision interface with modal confirmations
- Tailwind CSS + shadcn/ui alert dialogs
- Bulk action controls

---

## Rejection Reason Categories

**Technical Fit:**
- Lacks required technical skills
- Insufficient experience level
- Technology stack mismatch

**Cultural Fit:**
- Communication style mismatch
- Values misalignment
- Team dynamics concerns

**Practical Constraints:**
- Salary expectations too high
- Location/timezone incompatible
- Availability mismatch

**Qualifications:**
- Educational requirements not met
- Certifications missing
- Background check issues

**Other:**
- Custom reason (free text required)

---

## Database Schema

```typescript
Table: decisions
- id (UUID, PK)
- candidate_id (UUID, FK)
- job_id (UUID, FK)
- stage_name (VARCHAR)
- decision (ENUM: accept, reject)
- decision_maker_id (UUID, FK)
- rejection_reason_category (VARCHAR, nullable)
- rejection_reason_details (TEXT, nullable)
- timestamp (TIMESTAMP)
- is_reversible (BOOLEAN) // Always false for rejections

Table: rejection_reasons
- id (UUID, PK)
- category (VARCHAR)
- reason (VARCHAR)
- is_active (BOOLEAN)
```

---

## Decision Workflow

### Accept Decision
```
1. User clicks "Move to Next Stage" button
2. System validates current stage completion
3. Candidate automatically progressed to next configured stage
4. Audit log created
5. Notifications sent (candidate + stakeholders)
```

### Reject Decision
```
1. User clicks "Disqualify" button (red)
2. Modal appears: "Are you sure? This cannot be undone."
3. User selects rejection reason category
4. User provides detailed explanation (required)
5. Confirmation: "Permanently reject [Candidate Name]?"
6. On confirm:
   - Candidate status → rejected
   - is_reversible → false
   - Audit log created
   - Rejection email sent to candidate
   - Stakeholders notified
```

---

## Related Requirements

- FR6: Accept/Reject Decision Framework [MVP]
- FR11: Audit Trails & Data Integrity
- FR12: Multi-Channel Notifications

---

## Notes

- **MVP Critical:** Clear accept/reject at each stage is essential
- **Irreversible:** Rejections are final (prevents gaming the system)
- **Audit Trail:** Track all decisions with full context
- **Bulk Actions:** Allow rejecting multiple candidates simultaneously
- **Confirmation:** Always require confirmation for reject decisions
