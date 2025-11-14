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
- **Job Creation & Approval Workflow:** Complete implementation with role-based access (Recruiter vs Client), dual-button workflow (Save as Draft + Submit for Approval/Publish Job), dynamic employment-type fields with color-coded borders (Contract: Blue, Part-Time: Green, Full-Time: Orange, EOR: Purple), 6-stage pipeline auto-creation, and full Azure PostgreSQL persistence (32 fields). Status transitions: Client → draft (awaiting approval), Recruiter → published (live immediately), Draft → draft (any role). AI-powered job description generation button added (UI only, awaiting integration).

**Technical Implementations & Feature Specifications:**
- **Backend Infrastructure (MVP):**
    - Express.js REST API server (Node.js) with Azure PostgreSQL database connection via SSL.
    - RESTful API endpoints for jobs (GET with filters, GET by ID, POST for creation with approval workflow).
    - Database schema includes `jobs` table with 40+ fields (employment_type, status, linkedin_synced, created_by_role, approved_by_user_id, approved_at, auto-generated slug) and `job_pipeline_stages` table for auto-created 6-stage pipelines.
    - Vite proxy configuration routes `/api` to localhost:3001.
- **AI-Assisted Tools (MVP Core):** AI Job Description Generation, AI Interview Question Generation, Sentiment Analysis & Candidate Engagement Intelligence, and Analytics Dashboards.
- **Essential Supporting Infrastructure (MVP):** Multi-employment type job management, customizable 6-stage candidate pipeline, accept/reject decision workflows, basic email notifications and in-app alerts, Custom SSO Provider authentication.
- **Compliance & Security:** GDPR, CCPA, HIPAA, SOX compliance. End-to-end encryption with Azure Key Vault, MFA, audit logging, RBAC, privacy-first AI.

**System Design Choices:**
- **Backend:** Node.js with Express.js (currently), with future plans for NestJS microservices.
- **Database:** Azure Database for PostgreSQL (Flexible Server) with `pg` client.
- **Storage:** Azure Blob Storage with lifecycle management.
- **Compute:** Azure Kubernetes Service (AKS) with auto-scaling (future).
- **AI/ML:** OpenAI GPT-4/Anthropic Claude for LLM capabilities, custom ML models.
- **Authentication:** Custom SSO Provider via OAuth 2.0/OpenID Connect (Passport.js).
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
- **Custom SSO Provider:** For authentication via OAuth 2.0/OpenID Connect.