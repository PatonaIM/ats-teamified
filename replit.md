# Multi-Employment ATS System

## Overview
This project is a Multi-Employment Applicant Tracking System (ATS) designed to manage various employment types (contract, part-time, full-time, EOR). Its core purpose is to provide intelligent hiring capabilities through AI-powered features, ensuring comprehensive compliance and seamless integration with external platforms like LinkedIn. The system's primary competitive advantage is its AI differentiation, offering tools for job description generation, interview question generation, candidate sentiment analysis, and advanced analytics.

## User Preferences
I prefer clear, concise, and structured documentation. Please prioritize high-level architectural decisions and key features over granular implementation details. Avoid conversational filler and get straight to the point. When suggesting changes or new implementations, provide a brief rationale. I prefer an iterative development approach, focusing on MVP features first, then expanding. Do not make changes to files outside the `ats-app/` directory without explicit instruction, as `docs/` contains core project specifications.

## System Architecture
The system employs an Azure-native, microservices-based architecture.

**UI/UX Decisions:**
- **Frontend Framework:** React with Vite
- **Styling:** Tailwind CSS with shadcn/ui component library.
- **Color System:** Brand colors are Purple (#A16AE8) and Blue (#8096FD). Employment Type Color Coding: Contract (Blue), Part-Time (Green), Full-Time (Orange), EOR (Purple).
- **Design Principles:** Responsive design, dark mode support, Inter font family, gradient-heavy design, smooth animations using custom keyframe animations.
- **Key UI Elements:** Landing page with hero/stats/features/benefits sections, role-based side menu, dashboard with KPI cards and hiring funnel, Jobs List page with filters/search/cards, Candidate Pipeline Kanban board, Candidate Profile page, External Portal Integration elements.
- **Implementation:** Fully functional landing page, jobs page with Azure PostgreSQL backend integration, and a complete admin portal with a collapsible sidebar navigation (Dashboard, Jobs, Candidates, Analytics, Settings).
- **Job Creation & Approval Workflow:** Complete implementation with role-based access (Recruiter vs Client), dual-button workflow (Save as Draft + Submit for Approval/Publish Job), dynamic employment-type fields with color-coded borders (Contract: Blue, Part-Time: Green, Full-Time: Orange, EOR: Purple), **customizable pipeline stages with structured constraints: 3 fixed top stages (Screening, Shortlist, Client Endorsement - cannot be moved/removed), 2 fixed bottom stages (Offer, Offer Accepted - cannot be moved/removed), unlimited draggable custom stages in the middle section, 4 suggested optional stages (Assessment, Coding Round, Interview 1, Interview 2) with one-click add to middle section**, and full Azure PostgreSQL persistence (32 fields). Status transitions: Client → draft (awaiting approval), Recruiter → published (live immediately), Draft → draft (any role). **Fully integrated AI-powered job description generation using OpenAI GPT-4o-mini**, with loading states, comprehensive error handling, and automatic description population. **React 18.3.1 for drag-and-drop compatibility**.

**Technical Implementations & Feature Specifications:**
- **Backend Infrastructure (MVP):**
    - Express.js REST API server (Node.js) with Azure PostgreSQL database connection via SSL.
    - RESTful API endpoints for jobs (GET with filters, GET by ID, POST for creation with approval workflow, POST /api/generate-job-description for AI generation, POST /api/generate-interview-questions for AI interview questions).
    - Database schema includes 7 tables:
        - `jobs` table (40+ fields: employment_type, status, linkedin_synced, created_by_role, approved_by_user_id, approved_at, auto-generated slug)
        - `job_pipeline_stages` table (auto-created 6-stage pipelines)
        - `linkedin_sync_status` table (LinkedIn posting history and retry tracking)
        - `candidates` table (candidate profiles with job associations)
        - `candidate_documents` table (resumes, certificates, cover letters)
        - `candidate_communications` table (email/call/message logs)
        - `candidate_stage_history` table (pipeline progression audit trail)
    - OpenAI integration (v4.77.3) with GPT-4o-mini model for AI job description generation and interview question generation.
    - API key validation on server startup with fail-fast error messaging.
- **AI-Assisted Tools (MVP Core):** 
    - **AI Job Description Generation (✅ Implemented):** Fully functional AI-powered job description generation using OpenAI GPT-4o-mini. Generates comprehensive job descriptions based on title, location, remote status, key skills, and experience level. Includes company overview, role overview, key responsibilities, qualifications, and work description. Frontend integration with loading states, error handling, and automatic textarea population.
    - **AI Interview Question Generation (✅ Implemented):** Employment type-specific interview question generator using OpenAI GPT-4o-mini. Generates 15-20 categorized questions (technical, behavioral, cultural fit, situational). Returns structured JSON with category breakdown, total question count, and metadata. API: POST /api/generate-interview-questions.
    - Sentiment Analysis & Candidate Engagement Intelligence (Planned - Phase 2)
    - Compensation Benchmarking Engine (Planned - Phase 2)
    - Bias Detection in Interview Questions (Planned - Phase 2)
    - Analytics Dashboards (Planned - Phase 2)
- **LinkedIn Integration (✅ MVP Foundation):**
    - **Feature-Flag Architecture:** LINKEDIN_ENABLED environment variable (default: disabled/mock mode)
    - **Employment Type-Specific Formatting:** Automatic job formatting for contract, part-time, full-time, EOR postings
    - **Automatic Posting Workflow:** Recruiter jobs post immediately, Client jobs post after approval
    - **Sync Status Tracking:** linkedin_sync_status table (job_id, status, posted_at, linkedin_job_id, error_message, retry_count, last_retry_at)
    - **Retry Logic:** Exponential backoff (1s, 2s, 4s, 8s, 16s) with circuit breaker
    - **API Endpoints:** POST /api/linkedin/post/:jobId, GET /api/linkedin/status/:jobId, POST /api/linkedin/sync/:jobId, POST /api/linkedin/retry/:jobId
    - **Frontend UI:** LinkedIn sync badge on Jobs page when linkedin_synced=true
    - **Phase 2 Deferred:** LinkedIn performance metrics (views, clicks, applicants)
- **Candidate Profile Management (✅ MVP Complete):**
    - **Database Schema:** 4 tables (candidates, candidate_documents, candidate_communications, candidate_stage_history)
    - **Candidates Table:** job_id FK, first_name, last_name, email (UNIQUE per job), phone, current_stage, source (linkedin/direct/referral/portal), resume_url, status (active/rejected/hired/withdrawn), external_portal_id
    - **Documents Table:** document_type, file_name, blob_url (Azure Blob Storage ready), file_size
    - **Communications Table:** communication_type (email/call/message), subject, content, sent_by_user_id, sent_at
    - **Stage History Table:** Audit trail with previous_stage, new_stage, changed_by_user_id, notes, changed_at
    - **Complete REST API:** GET /api/candidates (filters: jobId, status, source, search), GET /api/candidates/:id (includes documents, communications, stageHistory), POST /api/candidates, PUT /api/candidates/:id (camelCase/snake_case normalized), DELETE /api/candidates/:id, POST /api/candidates/:id/documents, POST /api/candidates/:id/communications, PUT /api/candidates/:id/stage (logs history)
    - **Email Constraint:** UNIQUE(job_id, email) allows same candidate across multiple jobs
    - **Field Normalization:** Both create and update operations accept camelCase input, converted to snake_case for database
    - **Phase 2 Deferred:** Frontend UI for candidate profiles, Kanban pipeline board
- **Essential Supporting Infrastructure (MVP):** Multi-employment type job management, customizable 6-stage candidate pipeline, accept/reject decision workflows, basic email notifications and in-app alerts.
- **Authentication & Authorization (✅ Implemented):**
    - **OAuth 2.0 with PKCE:** Complete implementation using Teamified Accounts SSO provider (teamified-accounts.replit.app). Public client (no client_secret) with PKCE flow for enhanced security.
    - **PKCE Implementation:** Cryptographically secure random generation (96-byte verifier, SHA-256 challenge, 32-byte state), sessionStorage-based parameter management, RFC 7636 compliant.
    - **OAuth Flow:** Authorization URL → code exchange → token validation → session persistence. Includes CSRF protection via state parameter, automatic Bearer token injection in API requests, and resilient error handling.
    - **Session Management:** SessionStorage-based token storage (NOT localStorage), automatic validation on app initialization, tolerates transient validation failures, SSR/test-safe implementation.
    - **UI Integration:** "Login with Teamified" button on landing page, user profile display in navigation, logout functionality, loading states, and comprehensive error messages.
- **Compliance & Security:** GDPR, CCPA, HIPAA, SOX compliance. End-to-end encryption with Azure Key Vault, MFA, audit logging, RBAC, privacy-first AI.

**System Design Choices:**
- **Backend:** Node.js with Express.js (currently), with future plans for NestJS microservices.
- **Database:** Azure Database for PostgreSQL (Flexible Server) with `pg` client.
- **Storage:** Azure Blob Storage with lifecycle management.
- **Compute:** Azure Kubernetes Service (AKS) with auto-scaling (future).
- **AI/ML:** OpenAI GPT-4/Anthropic Claude for LLM capabilities, custom ML models.
- **Authentication:** Teamified Accounts SSO via OAuth 2.0 with PKCE (public client, sessionStorage-based).
- **Monitoring:** Azure Monitor, Log Analytics, Application Insights.

## External Dependencies
- **LinkedIn Jobs API:** For bidirectional job synchronization.
- **OpenAI GPT-4 / Anthropic Claude:** For Large Language Model (LLM) capabilities in AI features.
- **Azure Cloud Services:**
    - Azure Database for PostgreSQL (Flexible Server)
    - Azure Blob Storage
    - Azure Kubernetes Service (AKS)
    - Azure Key Vault
    - Azure Monitor, Log Analytics, Application Insights
- **Teamified Accounts SSO:** OAuth 2.0 provider with PKCE for secure authentication (teamified-accounts.replit.app).