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
- **Job Creation & Approval Workflow:** Complete implementation with role-based access (Recruiter vs Client), dual-button workflow (Save as Draft + Submit for Approval/Publish Job), dynamic employment-type fields with color-coded borders (Contract: Blue, Part-Time: Green, Full-Time: Orange, EOR: Purple), 6-stage pipeline auto-creation, and full Azure PostgreSQL persistence (32 fields). Status transitions: Client → draft (awaiting approval), Recruiter → published (live immediately), Draft → draft (any role). **Fully integrated AI-powered job description generation using OpenAI GPT-4o-mini**, with loading states, comprehensive error handling, and automatic description population.

**Technical Implementations & Feature Specifications:**
- **Backend Infrastructure (MVP):**
    - Express.js REST API server (Node.js) with Azure PostgreSQL database connection via SSL.
    - RESTful API endpoints for jobs (GET with filters, GET by ID, POST for creation with approval workflow, POST /api/generate-job-description for AI generation).
    - Database schema includes `jobs` table with 40+ fields (employment_type, status, linkedin_synced, created_by_role, approved_by_user_id, approved_at, auto-generated slug) and `job_pipeline_stages` table for auto-created 6-stage pipelines.
    - OpenAI integration (v4.77.3) with GPT-4o-mini model for AI job description generation.
    - API key validation on server startup with fail-fast error messaging.
- **AI-Assisted Tools (MVP Core):** 
    - **AI Job Description Generation (✅ Implemented):** Fully functional AI-powered job description generation using OpenAI GPT-4o-mini. Generates comprehensive job descriptions based on title, location, remote status, key skills, and experience level. Includes company overview, role overview, key responsibilities, qualifications, and work description. Frontend integration with loading states, error handling, and automatic textarea population.
    - AI Interview Question Generation (Planned)
    - Sentiment Analysis & Candidate Engagement Intelligence (Planned)
    - Analytics Dashboards (Planned)
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