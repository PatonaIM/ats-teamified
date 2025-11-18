# Multi-Employment ATS System

## Overview
This Multi-Employment Applicant Tracking System (ATS) manages diverse employment types (contract, part-time, full-time, EOR) with AI-powered hiring capabilities. It focuses on comprehensive compliance and seamless integration with platforms like LinkedIn. Its core competitive advantage lies in AI differentiation, offering tools for job description generation, interview question generation, candidate sentiment analysis, and advanced analytics, aiming to streamline and intelligentize the hiring process.

## User Preferences
I prefer clear, concise, and structured documentation. Please prioritize high-level architectural decisions and key features over granular implementation details. Avoid conversational filler and get straight to the point. When suggesting changes or new implementations, provide a brief rationale. I prefer an iterative development approach, focusing on MVP features first, then expanding. Do not make changes to files outside the `ats-app/` directory without explicit instruction, as `docs/` contains core project specifications.

## System Architecture
The system utilizes an Azure-native, microservices-based architecture.

**UI/UX Decisions:**
- **Frontend:** React with Vite, styled using Tailwind CSS and shadcn/ui.
- **Design:** Responsive, dark mode support, Inter font family, gradient-heavy, custom keyframe animations.
- **Branding:** Purple (#A16AE8) and Blue (#8096FD). Employment types are color-coded: Contract (Blue), Part-Time (Green), Full-Time (Orange), EOR (Purple).
- **Key UI Elements:** Landing page, role-based side menu, dashboard with KPIs, Jobs List with filters, Candidate Pipeline Kanban, Candidate Profile, External Portal Integration.
- **Job Creation & Approval:** Implements an automatic role-based "Created By" detection, dual-button workflow (Save as Draft, Submit for Approval/Publish), optimized form layout with Job Title and Job Description at the top, dynamic color-coded employment type fields, and customizable pipeline stages. The pipeline includes 3 fixed top stages (Screening, Shortlist, Client Endorsement), 2 fixed bottom stages (Offer, Offer Accepted), and unlimited draggable custom stages in between, with suggested optional stages. AI-powered job description generation using OpenAI GPT-4o-mini is fully integrated.

**Technical Implementations & Feature Specifications:**
- **Backend Infrastructure:** Express.js (Node.js) REST API, connecting to Azure PostgreSQL via SSL.
- **Database Schema:** 9 tables including `jobs` (40+ fields, auto-generated slug), `job_pipeline_stages`, `pipeline_templates`, `pipeline_template_stages`, `linkedin_sync_status`, `candidates`, `candidate_documents`, `candidate_communications`, and `candidate_stage_history`.
- **AI-Assisted Tools:**
    - **AI Job Description Generation:** Fully implemented using OpenAI GPT-4o-mini, generating three HTML-formatted variations ("Professional & Detailed", "Concise & Direct", "Engaging & Creative") with parallel generation, HTML sanitization, rate limiting, and robust error handling.
    - **AI Interview Question Generation:** Implemented using OpenAI GPT-4o-mini, generating 15-20 categorized questions (technical, behavioral, cultural fit, situational) in structured JSON format.
- **LinkedIn Integration:** Feature-flagged architecture (`LINKEDIN_ENABLED`), employment type-specific formatting, automatic posting workflow (recruiter jobs post immediately, client jobs after approval), sync status tracking, and exponential backoff retry logic.
- **Candidate Profile Management:** Complete API support for managing candidates across 4 tables, including documents, communications, and an audit trail for stage history. Email uniqueness is enforced per job.
- **External Portal Integration:** Achieved primarily through direct shared Azure PostgreSQL database access, with optional REST API endpoints for candidate submission and stage advancement. Security is enforced with Row-Level Security (RLS) policies.
- **Pipeline Template System:** Feature-flagged (`WORKFLOW_BUILDER_ENABLED`) standalone reusable pipeline template management system. Enables centralized creation and management of hiring workflows that can be assigned to multiple jobs, replacing per-job workflow customization with template-based architecture. **Database Schema:** Two new tables - `pipeline_templates` (id, name, description, is_default, timestamps) and `pipeline_template_stages` (id, template_id FK, stage_name, stage_order, stage_type, stage_config JSONB). Jobs reference templates via `jobs.pipeline_template_id` foreign key. **Default Template:** Automatically created on initialization with 5 standard stages (Screening, Shortlist, Client Endorsement, Offer, Offer Accepted). **Backend API:** 8 template endpoints - list templates, get template with stages, create template, update template, delete template, add stage, reorder stages, delete stage, plus template assignment endpoint that copies template stages to jobs. **Validation:** Comprehensive server-side validation including object validation, type checking, exact set matching, contiguous sequence validation, SELECT FOR UPDATE row locking, transaction safety. Template deletion protected if marked default or in use by jobs. **Frontend:** WorkflowBuilderList component for template management (list, create modal, edit navigation, delete with confirmations), reusing WorkflowBuilder component for drag-and-drop stage editing. **UI Access:** "Pipeline Configuration" menu item in sidebar navigation. Currently **ENABLED** via feature flag for template-based workflow management.
- **Customizable Workflow Builder (MVP):** Feature-flagged (`WORKFLOW_BUILDER_ENABLED`) drag-and-drop pipeline stage configurator with per-stage settings (interview modes, AI tools, automations, SLAs, visibility). Built with 100% rollback-safe architecture using additive-only database changes (`stage_config` JSONB column with GIN index). Safety features: fixed stages cannot be moved/deleted, stages with candidates cannot be deleted, rename auto-migrates candidate records. Frontend components: WorkflowBuilder page, StageCard, StageConfigModal using @dnd-kit for drag-and-drop. Backend: 6 feature-flagged API endpoints with middleware guard and comprehensive server-side validation (type checking, exact set matching, contiguous sequence validation, fixed stage position enforcement, SELECT FOR UPDATE row locking, transaction safety with ROLLBACK on all failures). **Validation Coverage:** Protects against type confusion, negative values, duplicate orders, gaps in sequences, fixed stage tampering, race conditions, stale payloads. **Known Limitations (Future Security Hardening):** Extreme edge cases with prototype pollution and sparse arrays could theoretically bypass validation and return 500 errors instead of 400; these are beyond MVP scope and suitable for future security hardening. **Rollback Strategy:** Level 1 (toggle `WORKFLOW_BUILDER_ENABLED=false`), Level 2 (remove code), Level 3 (optional: drop `stage_config` column). Currently **ENABLED** for template-based workflow management.
- **Authentication & Authorization:** OAuth 2.0 with PKCE implemented using Teamified Accounts SSO for secure, public client authentication, ensuring CSRF protection and resilient session management.
- **Compliance & Security:** Designed for GDPR, CCPA, HIPAA, SOX compliance, utilizing end-to-end encryption with Azure Key Vault, MFA, audit logging, RBAC, and privacy-first AI principles.

**System Design Choices:**
- **Backend:** Node.js with Express.js (future plans for NestJS microservices).
- **Database:** Azure Database for PostgreSQL (Flexible Server).
- **Storage:** Azure Blob Storage.
- **Compute:** Azure Kubernetes Service (AKS) for future scalability.
- **AI/ML:** OpenAI GPT-4/Anthropic Claude for LLM capabilities.
- **Authentication:** Teamified Accounts SSO via OAuth 2.0 with PKCE.
- **Monitoring:** Azure Monitor, Log Analytics, Application Insights.

## External Dependencies
- **LinkedIn Jobs API:** For job synchronization.
- **OpenAI GPT-4 / Anthropic Claude:** For Large Language Model (LLM) capabilities.
- **Azure Cloud Services:** Azure Database for PostgreSQL, Azure Blob Storage, Azure Kubernetes Service (AKS), Azure Key Vault, Azure Monitor, Log Analytics, Application Insights.
- **Teamified Accounts SSO:** OAuth 2.0 provider for authentication (teamified-accounts.replit.app).

## Recent Changes
- Implemented comprehensive ATS system with job management, AI-powered features, candidate pipeline, and analytics dashboard
- Built context-aware stage configuration modal that dynamically shows different settings based on stage type (AI interview, human interview, assessment, general)
- Added detailed configuration options for interview stages: video interview (platform selection, recording, waiting room), panel interview (interviewer count, scoring method), and AI-assisted questions
- Implemented assessment-specific configurations for coding platforms (HackerRank, Codility, LeetCode), skills tests, background checks, and reference checks
- Enhanced skills test with practical demonstration settings including task type, required tools, evaluation criteria, observation methods, and time limits
- Optimized Workflow Builder UI: rebalanced grid layout (4/3/5 columns), full-width stage cards, reduced padding, improved Custom Stage flow with inline name editing in Stage Configuration panel
- Created comprehensive user story document for Interview Scheduling feature (docs/user-stories-interview-scheduling.md) covering 12 user stories including slot creation, booking, rescheduling, cancellation, automated reminders, calendar integration, and templates

## Planned Features
- **Interview Scheduling System (MVP Implemented):** Self-service interview slot booking for candidates with recruiter-created availability, timezone handling, and booking management. Full specifications in docs/user-stories-interview-scheduling.md. Setup guide in docs/interview-scheduling-setup.md

## Deployment Status

**⚠️ PENDING DATABASE MIGRATIONS:**
The following features are implemented in code but require database migrations to be run on your Azure PostgreSQL database:

1. **Migration 006** - Pipeline Template System (`pipeline_templates`, `pipeline_template_stages` tables)
2. **Migration 007** - Interview Scheduling (`interview_slots`, `interview_bookings` tables)
3. **Migration 008** - Stage Library (`stage_library` table)

**To deploy:** Run all migration files in order against your Azure PostgreSQL database.

---

## Recent Feature Additions

### Client-Specific Stage Library (November 2025)

**Status:** ✅ Code complete, ⏳ Pending migration 008

**What it does:**
- Replaces hardcoded stage suggestions with dynamic, client-specific stage library
- Teamified provides 17 default stage templates across 5 categories (Technical, HR, Management, Assessment, Administrative)
- Each client can create unlimited custom stage templates specific to their organization
- Default templates are read-only, custom templates are fully editable/deletable

**Implementation:**
- **Database:** `stage_library` table with `client_id` (nullable for defaults) and `is_default` flag
- **API:** 5 REST endpoints (GET list, GET by ID, POST create, PUT update, DELETE)
- **Components:**
  - Updated `PipelineStageEditor` to fetch templates from API with icons and categories
  - New `StageLibraryManager` modal for creating and managing custom templates
  - Icon picker with 15 emoji options
  - Category selection (Technical, HR, Management, Assessment, Administrative, Custom)

**Security Notes:**
- ⚠️ Current implementation uses `X-Client-ID` header for tenant isolation
- This is a DEMO/DEV approach - production requires JWT-based authentication
- All endpoints include ownership validation to prevent cross-tenant access
- See migration file for detailed security requirements

**Files:**
- Migration: `ats-app/database/migrations/008_stage_library.sql`
- Backend: Stage Library endpoints in `ats-app/server/index.js`
- Frontend: `ats-app/src/components/PipelineStageEditor.tsx`, `ats-app/src/components/StageLibraryManager.tsx`

### Interview Scheduling Implementation (MVP - Ready for Testing)

**Status:** MVP implementation complete, pending database migration

**What's Implemented:**
- **Database Schema:** Two tables (interview_slots, interview_bookings) with triggers for auto-updating booking counts
- **Backend API:** 10 REST endpoints for slot creation, booking management, and viewing schedules
- **Frontend Components:**
  - SlotCreationModal: Recruiter interface to create time slots with date/time pickers
  - CandidateBookingPage: Public booking page for candidates to select and book interview times
  - BookingDashboard: Recruiter view of all scheduled interviews with filtering
- **Email Service:** Stub implementation ready for provider integration (SendGrid/SES)
- **Validation & Security:** UUID validation, transaction safety, relationship checks, concurrency protection

**Next Steps to Deploy:**
1. Run database migration: `ats-app/database/migrations/007_interview_scheduling.sql`
2. Configure email provider (see docs/interview-scheduling-setup.md)
3. Test slot creation and booking flow
4. Integrate "Schedule Interview" button into pipeline stage cards

**Files Changed:**
- Database: `ats-app/database/migrations/007_interview_scheduling.sql`
- Backend: Added interview scheduling endpoints to `ats-app/server/index.js`
- Frontend: `ats-app/src/components/interview-scheduling/` (3 components)
- Routing: Added `/book-interview/:candidateId/:jobId` route
- Email: `ats-app/server/services/email.js`
- Auth: Fixed demo user ID to valid UUID
- Docs: `docs/interview-scheduling-setup.md`, `docs/user-stories-interview-scheduling.md`