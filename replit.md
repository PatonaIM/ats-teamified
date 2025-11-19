# Multi-Employment ATS System

## Overview
The Multi-Employment Applicant Tracking System (ATS) is designed to manage diverse employment types (contract, part-time, full-time, EOR) using AI-powered hiring capabilities. Its primary purpose is to streamline and intelligentize the hiring process through comprehensive compliance, seamless integrations (e.g., LinkedIn), and advanced AI features. Key capabilities include AI-driven job description and interview question generation, candidate sentiment analysis, and sophisticated analytics, aiming to provide a significant competitive advantage in the recruitment market.

## User Preferences
I prefer clear, concise, and structured documentation. Please prioritize high-level architectural decisions and key features over granular implementation details. Avoid conversational filler and get straight to the point. When suggesting changes or new implementations, provide a brief rationale. I prefer an iterative development approach, focusing on MVP features first, then expanding. Do not make changes to files outside the `ats-app/` directory without explicit instruction, as `docs/` contains core project specifications.

## System Architecture
The system employs an Azure-native, microservices-based architecture.

**UI/UX Decisions:**
The frontend is built with React and Vite, styled using Tailwind CSS and shadcn/ui. The design is responsive, supports dark mode, utilizes the Inter font family, and features a gradient-heavy aesthetic with custom keyframe animations. Branding uses Purple (#A16AE8) and Blue (#8096FD), with employment types color-coded (Contract: Blue, Part-Time: Green, Full-Time: Orange, EOR: Purple). Core UI elements include a landing page, role-based side menu, dashboard with KPIs, a filterable Jobs List, a Kanban-style Candidate Pipeline, Candidate Profiles, and External Portal Integration. The job creation process includes an automatic "Created By" detection, a dual-button workflow (Save as Draft, Submit/Publish), an optimized form layout, dynamic color-coded employment type fields, pipeline template selection with visual preview (showing numbered stages with gradient badges and arrow separators), and automatic template stage application. The "Standard Hiring Pipeline" template is hidden from the dropdown, with the first custom template auto-selected for new jobs only (edit mode preserves existing stages). AI-powered job description generation is integrated into this process.

**Technical Implementations & Feature Specifications:**
The backend is an Express.js (Node.js) REST API, connected to Azure PostgreSQL via SSL. The database schema comprises 9 tables managing jobs, pipeline stages, templates, LinkedIn sync status, candidates (including documents, communications, and stage history).

AI-Assisted Tools include:
- **AI Job Description Generation:** Uses OpenAI GPT-4o-mini to produce three HTML-formatted variations ("Professional & Detailed", "Concise & Direct", "Engaging & Creative") with parallel generation, HTML sanitization, rate limiting, and error handling.
- **AI Interview Question Generation:** Leverages OpenAI GPT-4o-mini to generate 15-20 categorized questions (technical, behavioral, cultural fit, situational) in structured JSON format.

Other key features:
- **Job Request Approval Workflow:** Client-submitted jobs require Recruiter Manager approval before publication. Features include automatic approval request creation with 48-hour SLA deadlines, approval queue UI with priority indicators (overdue/urgent/normal), approve/reject actions with mandatory feedback for rejections, bulk approval capability, complete audit trail in `approval_history` table, and automatic job status updates (draft → published) upon approval. Jobs created by Recruiter Managers bypass approval and publish immediately.
- **Direct Job Publishing (Recruiters):** Recruiter-created draft jobs feature a one-click "✓ Publish Job" button in the Jobs dashboard UI (green gradient button, appears on hover for draft jobs with `created_by_role='recruiter'`). Uses PUT /api/jobs/:id endpoint with comprehensive validation (403 error for client jobs attempting direct publish), audit logging (tracks status transitions, updated fields, timestamps), and automatic LinkedIn posting trigger upon publication. Client jobs attempting direct publishing receive 403 error with clear message to use approval workflow.
- **Comprehensive Job Status Management:** Full lifecycle status control with six states (draft, published, paused, filled, closed, archived). Recruiters can manage active jobs with one-click status transitions: Pause/Resume (published ↔ paused), Mark as Filled (published → filled), and Close Job (any active state → closed). Features include smart button visibility based on current status, confirmation dialogs for destructive actions, real-time status updates with optimistic UI, complete audit logging for all transitions, and automatic LinkedIn sync triggers. Status normalization architecture maps backend 'published' to user-friendly 'active' in UI while maintaining data integrity. Database schema uses PostgreSQL 12+ compatible migrations with DO blocks and pg_enum checks for idempotent enum value additions.
- **LinkedIn Integration:** A feature-flagged system (`LINKEDIN_ENABLED`) supporting employment type-specific formatting, automatic posting workflows, sync status tracking, and exponential backoff retry logic. LinkedIn posting is automatically triggered upon job publication (recruiter direct publish or client approval). LinkedIn sync updates existing postings when published jobs are edited. Requires `LINKEDIN_CLIENT_ID` and `LINKEDIN_CLIENT_SECRET` in Replit Secrets for production use; runs in mock mode when disabled.
- **Candidate Profile Management:** Full API support for managing candidates across multiple tables, including document uploads, communication logs, and audit trails for stage changes. Email uniqueness is enforced per job.
- **External Portal Integration:** Achieved via direct shared Azure PostgreSQL database access and optional REST API endpoints, secured with Row-Level Security (RLS).
- **Pipeline Template System:** A feature-flagged (`WORKFLOW_BUILDER_ENABLED`) system for creating and managing reusable hiring workflow templates. It includes dedicated database tables (`pipeline_templates`, `pipeline_template_stages`), an 8-endpoint API for template management and assignment, and robust server-side validation. A default template is automatically created.
- **Customizable Workflow Builder:** A feature-flagged (`WORKFLOW_BUILDER_ENABLED`) drag-and-drop configurator for pipeline stages, allowing per-stage settings (interview modes, AI tools, automations, SLAs, visibility). It uses an additive-only database design (`stage_config` JSONB column) and implements comprehensive validation and safety features (e.g., fixed stages, deletion protection for stages with candidates).
- **Stage Library System:** Client-specific stage template library where stages must be created first before being added to job workflows exclusively via drag-and-drop (8px activation distance). Features include click-to-configure for library stages, duplicate prevention at drop handler level, category-based organization (Technical, HR, Assessment, Custom), and customized Human Interview configuration with interviewer name, meeting platform (Google Meet/Zoom/Teams), duration, and scheduling fields.
- **Authentication & Authorization:** Implemented using OAuth 2.0 with PKCE via Teamified Accounts SSO, ensuring CSRF protection and resilient session management.
- **Compliance & Security:** Designed for GDPR, CCPA, HIPAA, SOX compliance, utilizing end-to-end encryption with Azure Key Vault, MFA, audit logging, RBAC, and privacy-first AI principles.

**System Design Choices:**
- **Backend:** Node.js with Express.js.
- **Database:** Azure Database for PostgreSQL (Flexible Server).
- **Storage:** Azure Blob Storage.
- **Compute:** Azure Kubernetes Service (AKS) for scalability.
- **AI/ML:** OpenAI GPT-4o-mini for LLM capabilities.
- **Authentication:** Teamified Accounts SSO via OAuth 2.0 with PKCE.
- **Monitoring:** Azure Monitor, Log Analytics, Application Insights.

## External Dependencies
- **LinkedIn Jobs API:** For job synchronization.
- **OpenAI GPT-4o-mini:** For Large Language Model (LLM) capabilities, specifically for job description and interview question generation.
- **Azure Cloud Services:** Azure Database for PostgreSQL (Flexible Server), Azure Blob Storage, Azure Kubernetes Service (AKS), Azure Key Vault, Azure Monitor, Log Analytics, Application Insights.
- **Teamified Accounts SSO:** OAuth 2.0 provider for authentication (teamified-accounts.replit.app).