# Story 1.3: Core Job Management System **[MVP Priority]**

**Epic:** [Epic 1 - Foundation & Core Infrastructure](../epics/epic-1-foundation-core-infrastructure.md)  
**Story ID:** 1.3  
**Priority:** Phase 1 - MVP Foundation ⭐  
**Estimate:** 3 weeks

---

## User Story

**As a** hiring manager or recruiter,  
**I want** to create and manage job requests with role-based approval workflows and employment type-specific fields,  
**so that** I can efficiently post professional jobs with appropriate oversight and workflow configurations.

---

## Acceptance Criteria

1. ✅ Job request creation interface implemented with employment type selection (contract, part-time, full-time, EOR) and role-based workflow routing
2. ✅ Client job submission workflow implemented requiring recruiter manager approval before LinkedIn activation and candidate processing
3. ✅ Recruiter job creation workflow implemented with direct activation bypassing approval requirements for internal recruiting team
4. ✅ Job approval dashboard implemented for recruiter managers showing pending client job requests with approve/reject decision options
5. ✅ Job status management implemented with states: draft, pending approval (client jobs), approved, active, paused, closed with role-based visibility
6. ✅ AI job description generator implemented using ChatGPT/LLM integration with employment type-specific prompts
7. ✅ Job description generation interface implemented with input fields for job title, key requirements, company context, and custom instructions
8. ✅ AI-generated content review and editing capabilities implemented allowing manual refinement and customization
9. ⚠️ Dynamic field rendering based on employment type with validation rules and required field enforcement
10. ✅ Job editing capabilities implemented with persistent editability throughout job lifecycle including AI regeneration options and pipeline stage modification
11. ✅ Pipeline stage configuration implemented during job creation and editing allowing clients to customize default stages (Screening → Shortlist → Client Endorsement → Client Interview → Offer → Offer Accepted) with add, remove, rename, and reorder capabilities as specified in FR5
12. ✅ Approval notification system implemented alerting recruiter managers of pending client job requests with email and in-app notifications
13. ✅ LinkedIn auto-posting trigger implemented activating upon job approval (client jobs) or job creation (recruiter jobs)
14. ⏸️ Employment type-specific field templates created with customizable validation and display logic
15. ⏸️ Job request data model designed for extensibility, employment type-specific requirements, approval workflow tracking, and custom pipeline stage configurations
16. ⏸️ Basic job listing and search functionality implemented for job management dashboard with role-based filtering
17. ⏸️ Job request audit trail implemented tracking all changes, user actions, approval decisions, AI generation history, and pipeline stage modifications

---

## MVP Implementation Focus

### ✅ Essential for MVP (Criteria 1-8, 10-12)
- Job creation with employment types
- Role-based approval workflows
- AI job description generation (FR1.1)
- Basic editing capabilities
- LinkedIn auto-posting integration

### ⚠️ MVP Simplified (Criteria 9)
- Basic field validation
- Advanced dynamic field logic enhanced post-MVP

### ⏸️ Defer to Phase 2 (Criteria 13-17)
- Advanced employment type templates
- Extensible data models
- Advanced search/filtering (basic list view sufficient for MVP)
- Comprehensive audit trail (basic tracking in MVP)

---

## Technical Dependencies

**Backend:**
- NestJS job management service
- PostgreSQL tables: jobs, job_approvals, job_pipeline_stages
- Prisma ORM models

**Frontend:**
- React job creation form with Tailwind CSS
- shadcn/ui form components
- AI generation interface

**Integrations:**
- OpenAI GPT-4 or Anthropic Claude API
- LinkedIn Jobs API
- Email notification service

---

## Database Schema

```typescript
Table: jobs
- id (UUID, PK)
- title (VARCHAR)
- employment_type (ENUM: contract, part_time, full_time, eor)
- description (TEXT)
- status (ENUM: draft, pending_approval, approved, active, paused, closed)
- created_by_user_id (UUID, FK)
- created_by_role (ENUM: client, recruiter)
- approved_by_user_id (UUID, FK, nullable)
- approved_at (TIMESTAMP, nullable)
- ai_generated (BOOLEAN)
- linkedin_posted (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

Table: job_pipeline_stages
- id (UUID, PK)
- job_id (UUID, FK)
- stage_name (VARCHAR)
- stage_order (INTEGER)
- is_default (BOOLEAN)
```

---

## Related Requirements

- FR1: Job Request & Management System
- FR1.1: AI Job Description Generation [MVP]
- FR1.2: Job Request Form Requirements
- FR2: LinkedIn Automatic Posting & Synchronization
- FR5: Configurable Pipeline Stages
- FR11: Audit Trails & Data Integrity

---

## Notes

- **Critical MVP Story:** This is the core feature - job posting must work end-to-end
- **AI Integration:** GPT-4 or Claude for job description generation
- **Approval Logic:** Client jobs require manager approval; recruiter jobs auto-approve
- **LinkedIn Trigger:** Auto-post happens AFTER approval (or creation for recruiter jobs)
- **Pipeline Stages:** Default 6 stages but customizable per job
