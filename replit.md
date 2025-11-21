# Multi-Employment ATS System

## Overview
The Multi-Employment Applicant Tracking System (ATS) is designed to manage diverse employment types (contract, part-time, full-time, EOR) using AI-powered hiring capabilities. Its primary purpose is to streamline and intelligentize the hiring process through comprehensive compliance, seamless integrations (e.g., LinkedIn), and advanced AI features. Key capabilities include AI-driven job description and interview question generation, candidate sentiment analysis, and sophisticated analytics, aiming to provide a significant competitive advantage in the recruitment market.

## User Preferences
I prefer clear, concise, and structured documentation. Please prioritize high-level architectural decisions and key features over granular implementation details. Avoid conversational filler and get straight to the point. When suggesting changes or new implementations, provide a brief rationale. I prefer an iterative development approach, focusing on MVP features first, then expanding. Do not make changes to files outside the `ats-app/` directory without explicit instruction, as `docs/` contains core project specifications.

## System Architecture
The system employs an Azure-native, microservices-based architecture.

**UI/UX Decisions:**
The frontend is built with React and Vite, styled using Tailwind CSS and shadcn/ui. The design is responsive, supports dark mode, and features a gradient-heavy aesthetic. Branding uses Purple (#A16AE8) and Blue (#8096FD), with employment types color-coded. Core UI elements include a landing page, role-based side menu, dashboard with KPIs, a filterable Jobs List, a Kanban-style Candidate Pipeline, Candidate Profiles, and External Portal Integration. The job creation process includes AI-powered job description generation, dual-button workflow (Save as Draft, Submit/Publish), optimized form layout, dynamic color-coded employment type fields, and pipeline template selection.

**Technical Implementations & Feature Specifications:**
The backend is an Express.js (Node.js) REST API, connected to Azure PostgreSQL. The database schema manages jobs, pipeline stages, templates, LinkedIn sync status, and candidates.

AI-Assisted Tools include:
- **AI Job Description Generation:** Uses OpenAI GPT-4o-mini to produce three HTML-formatted variations with parallel generation, HTML sanitization, rate limiting, and error handling.
- **AI Interview Question Generation:** Leverages OpenAI GPT-4o-mini to generate 15-20 categorized questions in structured JSON format.

Other key features:
- **Job Request Approval Workflow:** Client-submitted jobs require Recruiter Manager approval with SLA deadlines, an approval queue UI, bulk approval, audit trails, and automatic status updates.
- **Direct Job Publishing (Recruiters):** Recruiters can publish draft jobs directly with a one-click action, comprehensive validation, and audit logging, triggering LinkedIn posting.
- **Comprehensive Job Status Management:** Full lifecycle status control with six states (draft, published, paused, filled, closed, archived), smart button visibility, confirmation dialogs, and audit logging.
- **LinkedIn Integration:** A feature-flagged system for employment type-specific formatting, automatic posting upon job publication, and sync status tracking with exponential backoff retry logic.
- **Candidate Profile Management:** Full API support for managing candidates, document uploads, communication logs, and audit trails for stage changes. Includes resume preview and role-based permissions.
- **Substage Progress Tracking:** Granular progress tracking within each pipeline stage using predefined substages (e.g., "Interview Scheduled" → "Interview Completed"), with specific handling for "Client Endorsement" stage.
- **AI Interview Integration (Team Connect Mock):** External portal integration for automated AI-powered interviews with a 5-stage substage workflow, dedicated API endpoints for mock link generation, initiation, completion, and results retrieval.
- **Interview Availability Management:** Client-only side menu feature for managing interview time slots using a calendar-based interface supporting general availability and job-specific assignments.
- **Human Interview Scheduling (MVP):** Comprehensive interview scheduling workflow with interviewer assignment, email-based candidate slot selection, and automated meeting link generation. Database migration 012 adds 12 tracking fields to candidates table (interviewer details, selected slot FK, meeting platform/link, timestamps, feedback). Backend provides 5 API endpoints for complete workflow including public candidate portal. Features 5-substage workflow (interviewer_assigned → interview_scheduled → interview_in_progress → interview_completed → feedback_submitted). Email service module provides beautiful gradient HTML templates with mock/production modes. Meeting service module generates Google Meet/Zoom/Teams links with mock/production structure. Frontend displays conditional action buttons in JobDetailsKanban with modals for interviewer assignment and interview completion. Public candidate portal at `/candidate/select-slot/:token` shows available slots with one-click selection. Security features include token validation, token rotation on reassignment, token invalidation after use, and scoped slot visibility. Client notifications sent automatically when interview scheduled. MVP uses mock modes for email/meeting services; production requires SendGrid API key and OAuth credentials.
- **External Portal Integration:** Achieved via direct shared Azure PostgreSQL database access and optional REST API endpoints, secured with Row-Level Security (RLS).
- **Pipeline Template System:** A feature-flagged system for creating and managing reusable hiring workflow templates with dedicated database tables and an 8-endpoint API.
- **Customizable Workflow Builder:** A feature-flagged drag-and-drop configurator for pipeline stages, allowing per-stage settings (interview modes, AI tools, automations, SLAs, visibility).
- **Stage Library System:** Client-specific stage template library where stages must be created first before being added to job workflows exclusively via drag-and-drop.
- **Authentication & Authorization:** Implemented using OAuth 2.0 with PKCE via Teamified Accounts SSO.
- **Compliance & Security:** Designed for GDPR, CCPA, HIPAA, SOX compliance, utilizing end-to-end encryption with Azure Key Vault, MFA, audit logging, RBAC, and privacy-first AI principles.

**System Design Choices:**
- **Backend:** Node.js with Express.js.
- **Database:** Azure Database for PostgreSQL (Flexible Server).
- **Storage:** Azure Blob Storage.
- **Compute:** Azure Kubernetes Service (AKS).
- **AI/ML:** OpenAI GPT-4o-mini.
- **Authentication:** Teamified Accounts SSO via OAuth 2.0 with PKCE.
- **Monitoring:** Azure Monitor, Log Analytics, Application Insights.

## External Dependencies
- **LinkedIn Jobs API:** For job synchronization.
- **OpenAI GPT-4o-mini:** For Large Language Model (LLM) capabilities (job description and interview question generation).
- **Azure Cloud Services:** Azure Database for PostgreSQL, Azure Blob Storage, Azure Kubernetes Service (AKS), Azure Key Vault, Azure Monitor, Log Analytics, Application Insights.
- **Teamified Accounts SSO:** OAuth 2.0 provider for authentication (teamified-accounts.replit.app).