# Multi-Employment ATS System

## Overview
This project is a Multi-Employment Applicant Tracking System (ATS) designed to manage various employment types (contract, part-time, full-time, EOR). Its core purpose is to provide intelligent hiring capabilities through AI-powered features, ensuring comprehensive compliance and seamless integration with external platforms like LinkedIn. The system's primary competitive advantage is its AI differentiation, offering tools for job description generation, interview question generation, candidate sentiment analysis, and advanced analytics from its initial phase.

## Recent Changes
**November 13, 2025** - Enhanced Landing Page with Style Guide Principles:
- Added sophisticated animations and transitions (gradient shifts, hover effects, scale transforms)
- Implemented social proof section with trust indicators (4.9/5 rating, 10,000+ recruiters, 60% faster hiring)
- Created statistics dashboard showcasing key metrics (Active Recruiters, Candidates Hired, Time Saved, Satisfaction Rate)
- Enhanced typography hierarchy with section badges and improved font weights
- Added animated background elements with pulsing gradient orbs
- Improved CTA sections with trust indicators (no credit card, 14-day trial)
- Enhanced employment type cards with feature lists and checkmarks
- Implemented benefits section with gradient icon boxes and hover animations
- Applied style guide principles translated from Material-UI patterns to Tailwind CSS
- Maintained brand colors (Purple #A16AE8, Blue #8096FD) with extensive gradient usage
- Fixed Vite configuration for Replit dynamic hostnames (allowedHosts: ['.replit.dev'])

## User Preferences
I prefer clear, concise, and structured documentation. Please prioritize high-level architectural decisions and key features over granular implementation details. Avoid conversational filler and get straight to the point. When suggesting changes or new implementations, provide a brief rationale. I prefer an iterative development approach, focusing on MVP features first, then expanding. Do not make changes to files outside the `ats-app/` directory without explicit instruction, as `docs/` contains core project specifications.

## System Architecture
The system employs an Azure-native, microservices-based architecture.

**UI/UX Decisions:**
- **Frontend Framework:** React with Vite
- **Styling:** Tailwind CSS with shadcn/ui component library (NOT Material-UI)
- **Color System:** Brand colors are Purple (#A16AE8) and Blue (#8096FD).
- **Employment Type Color Coding:** Contract (Blue), Part-Time (Green), Full-Time (Orange), EOR (Purple).
- **Design Principles:** Responsive design, dark mode support, Inter font family, gradient-heavy design, smooth animations.
- **Key UI Elements:** Landing page, role-based side menu, dashboard with KPI cards and hiring funnel, Jobs List page with filters, Candidate Pipeline Kanban board, Candidate Profile page, External Portal Integration elements.
- **Landing Page Implementation:** Fully functional prototype in `ats-app/` with hero section, stats section, features grid, employment types showcase, benefits section, CTA section, and footer. Includes dark mode toggle and responsive design.

**Technical Implementations & Feature Specifications:**
- **AI-Assisted Tools (MVP Core):**
    - AI Job Description Generation (GPT-4/Claude prompt-based, template-driven).
    - AI Interview Question Generation (template-based, basic resume keyword matching).
    - Sentiment Analysis & Candidate Engagement Intelligence (email response tracking, rule-based scoring).
    - Analytics Dashboards (hiring funnel, time-to-hire, source effectiveness).
- **Essential Supporting Infrastructure (MVP):**
    - Multi-employment type job management.
    - Customizable 6-stage candidate pipeline.
    - Accept/reject decision workflows with audit trails.
    - Basic email notifications and in-app alerts.
    - Custom SSO Provider authentication.
- **Compliance & Security:** GDPR, CCPA, HIPAA, SOX compliance. End-to-end encryption with Azure Key Vault, MFA, audit logging, RBAC, privacy-first AI.

**System Design Choices:**
- **Backend:** Node.js with NestJS (TypeScript) microservices.
- **Database:** Azure Database for PostgreSQL (Flexible Server) with Prisma ORM.
- **Storage:** Azure Blob Storage with lifecycle management.
- **Compute:** Azure Kubernetes Service (AKS) with auto-scaling.
- **AI/ML:** OpenAI GPT-4/Anthropic Claude for LLM, custom ML models for predictions.
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

## Project Structure
```
ats-app/                  # Landing page prototype (React + Vite + Tailwind CSS)
docs/                     # Comprehensive project documentation
├── epics/               # 6 epic files with high-level feature breakdowns
├── stories/             # 38 user story files (21 MVP, 17 Phase 2)
├── style-guide/         # Material-UI design patterns (for reference)
├── prd.md              # Product Requirements Document
├── implementation-guide.md
└── ui-specifications.md
```
