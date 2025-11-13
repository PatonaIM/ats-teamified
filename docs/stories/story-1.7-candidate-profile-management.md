# Story 1.7: Basic Candidate Profile Management

**Epic:** [Epic 1 - Foundation & Core Infrastructure](../epics/epic-1-foundation-core-infrastructure.md)  
**Story ID:** 1.7  
**Priority:** Phase 1 - MVP Foundation  
**Estimate:** 1 week

---

## User Story

**As a** recruiter,  
**I want** to view and manage candidate profiles imported from external processing,  
**so that** I can track candidate progress and make informed hiring decisions.

---

## Acceptance Criteria

1. ✅ Candidate profile data model designed to accommodate external portal integration requirements
2. ✅ Candidate profile display interface implemented showing comprehensive candidate information
3. ✅ Candidate import functionality prepared for external portal integration (stub implementation)
4. ✅ Basic candidate search and filtering capabilities implemented for recruiter workflow efficiency
5. ✅ Candidate status tracking implemented with pipeline stage visibility and progression history
6. ✅ Candidate profile editing capabilities implemented for recruiter updates and note-taking
7. ✅ Candidate attachment management implemented for resume, cover letter, and document storage
8. ✅ Basic candidate communication logging implemented for interaction history tracking

---

## Technical Dependencies

**Backend:**
- NestJS candidate service
- PostgreSQL tables: candidates, candidate_documents, candidate_communications
- Azure Blob Storage for document storage

**Frontend:**
- React candidate profile view
- Tailwind CSS + shadcn/ui components
- Document upload/download controls

---

## Database Schema

```typescript
Table: candidates
- id (UUID, PK)
- job_id (UUID, FK)
- first_name (VARCHAR)
- last_name (VARCHAR)
- email (VARCHAR, UNIQUE)
- phone (VARCHAR)
- current_stage (VARCHAR)
- source (VARCHAR) // linkedin, referral, direct, portal
- resume_url (VARCHAR)
- status (ENUM: active, rejected, hired, withdrawn)
- external_portal_id (VARCHAR, nullable)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

Table: candidate_documents
- id (UUID, PK)
- candidate_id (UUID, FK)
- document_type (ENUM: resume, cover_letter, certificate, other)
- file_name (VARCHAR)
- blob_url (VARCHAR)
- uploaded_at (TIMESTAMP)

Table: candidate_communications
- id (UUID, PK)
- candidate_id (UUID, FK)
- communication_type (ENUM: email, call, message)
- subject (VARCHAR)
- content (TEXT)
- sent_by_user_id (UUID, FK)
- sent_at (TIMESTAMP)
```

---

## Related Requirements

- FR3: External Portal Integration (prepared for Phase 2)
- FR6: Accept/Reject Decision Framework
- FR11: Audit Trails & Data Integrity

---

## Notes

- **MVP Scope:** Basic profile display and management
- **External Portal:** Stub integration ready for Phase 2 portal connection
- **Document Storage:** Azure Blob Storage with secure SAS tokens
- **Search:** Simple text search on name, email; advanced filters in Phase 2
