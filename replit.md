# Multi-Employment ATS System

## Overview
This project is a Multi-Employment Applicant Tracking System (ATS) designed to manage various employment types (contract, part-time, full-time, EOR). Its core purpose is to provide intelligent hiring capabilities through AI-powered features, ensuring comprehensive compliance and seamless integration with external platforms like LinkedIn. The system's primary competitive advantage is its AI differentiation, offering tools for job description generation, interview question generation, candidate sentiment analysis, and advanced analytics from its initial phase.

## Recent Changes
**November 13, 2025** - Implemented Dashboard Portal with Collapsible Sidebar Navigation:
- Created Sidebar component with 5 menu items (Dashboard, Jobs, Candidates, Analytics, Settings)
- Implemented collapsible sidebar with smooth width transitions (256px ↔ 80px)
- Built DashboardLayout component managing sidebar state and main content margin synchronization
- Created DashboardHome page with KPI stats cards, recent jobs list, and quick action buttons
- Created JobsPageDashboard variant integrated within dashboard layout
- Updated routing: public routes (/, /jobs) and dashboard routes (/dashboard/*)
- Changed landing page CTA from "View Jobs" to "Login to Portal" directing to /dashboard
- Implemented prefix-based active state highlighting for nested routes
- Added top header bar with search, notifications, user profile, and dark mode toggle
- Applied gradient branding throughout with hover effects and smooth animations

**November 13, 2025** - Implemented Job Listing Page with Azure PostgreSQL Integration:
- Created Express.js backend server with PostgreSQL database connection (port 3001)
- Set up Azure PostgreSQL database schema with jobs table including all employment type fields
- Populated database with 6 sample jobs across all employment types (contract, partTime, fullTime, eor)
- Built comprehensive JobsPage component with search, filters (employment type, status), and animated job cards
- Added React Router navigation with Navigation component featuring Home and Jobs links
- Implemented Vite proxy configuration to route /api requests to backend server
- Added employment type color coding: Contract (Blue), Part-Time (Green), Full-Time (Orange), EOR (Purple)
- Integrated LinkedIn sync badges for jobs synced with LinkedIn
- Applied slide-up animations with staggered delays for smooth job card entry
- Added purple-to-blue gradient pipeline progress bars showing active/total candidates
- Implemented NODE_ENV safeguard preventing production deployment without proper SSL certificate validation
- Updated workflow to run both frontend (Vite on port 5000) and backend (Node.js on port 3001) concurrently

**Previous Changes:**
- Enhanced Landing Page with Interactive Animations
- Added custom CSS animations (float, gradient-shift, slide-up, scale-in, bounce-subtle)
- Implemented staggered entry animations and hover effects throughout
- Fixed Tailwind CSS v4 compatibility by downgrading to stable v3.4
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
- **Animation System:** Custom keyframe animations (float, slide, scale, gradient-shift), staggered delays, hover interactions.
- **Key UI Elements:** Landing page with hero/stats/features/benefits sections, role-based side menu, dashboard with KPI cards and hiring funnel, Jobs List page with filters/search/cards, Candidate Pipeline Kanban board, Candidate Profile page, External Portal Integration elements.
- **Landing Page Implementation:** Fully functional prototype in `ats-app/` with animated hero section, stats section, features grid, employment types showcase, benefits section, CTA section, and footer. Includes dark mode toggle, responsive design, and interactive animations throughout. "Login to Portal" button navigates to /dashboard.
- **Jobs Page Implementation:** Fully functional with Azure PostgreSQL backend integration, displaying 6 jobs with real-time filtering, search, employment type badges, LinkedIn sync indicators, pipeline progress bars, and smooth slide-up animations.
- **Dashboard Portal Implementation:** Complete admin portal with collapsible sidebar navigation (Dashboard, Jobs, Candidates, Analytics, Settings). DashboardLayout manages sidebar collapse state with synchronized content margins. Top header includes global search, notification bell, user profile dropdown, and dark mode toggle. Dashboard home displays KPI cards with trend indicators, recent jobs preview, and quick action buttons.

**Technical Implementations & Feature Specifications:**
- **Backend Infrastructure (MVP):**
    - Express.js REST API server (Node.js)
    - Azure PostgreSQL database connection with SSL (development mode with production safeguards)
    - RESTful API endpoints: GET /api/jobs (with filters), GET /api/jobs/:id
    - Database schema: jobs table with 18 fields including employment_type, status, linkedin_synced
    - Vite proxy configuration routing /api to localhost:3001
- **AI-Assisted Tools (MVP Core):**
    - AI Job Description Generation (GPT-4/Claude prompt-based, template-driven).
    - AI Interview Question Generation (template-based, basic resume keyword matching).
    - Sentiment Analysis & Candidate Engagement Intelligence (email response tracking, rule-based scoring).
    - Analytics Dashboards (hiring funnel, time-to-hire, source effectiveness).
- **Essential Supporting Infrastructure (MVP):**
    - Multi-employment type job management (camelCase: fullTime, partTime, contract, eor).
    - Customizable 6-stage candidate pipeline.
    - Accept/reject decision workflows with audit trails.
    - Basic email notifications and in-app alerts.
    - Custom SSO Provider authentication.
- **Compliance & Security:** GDPR, CCPA, HIPAA, SOX compliance. End-to-end encryption with Azure Key Vault, MFA, audit logging, RBAC, privacy-first AI.

**System Design Choices:**
- **Backend:** Node.js with Express.js (currently), NestJS (TypeScript) microservices (future).
- **Database:** Azure Database for PostgreSQL (Flexible Server) with pg client.
- **Storage:** Azure Blob Storage with lifecycle management.
- **Compute:** Azure Kubernetes Service (AKS) with auto-scaling (future).
- **AI/ML:** OpenAI GPT-4/Anthropic Claude for LLM, custom ML models for predictions.
- **Authentication:** Custom SSO Provider via OAuth 2.0/OpenID Connect (Passport.js).
- **Monitoring:** Azure Monitor, Log Analytics, Application Insights.

## External Dependencies
- **LinkedIn Jobs API:** For bidirectional job synchronization.
- **OpenAI GPT-4 / Anthropic Claude:** For Large Language Model (LLM) capabilities in AI features.
- **Azure Cloud Services:**
    - Azure Database for PostgreSQL (Flexible Server) - Connected at teamified-candidate-ats.postgres.database.azure.com
    - Azure Blob Storage
    - Azure Kubernetes Service (AKS)
    - Azure Key Vault
    - Azure Monitor, Log Analytics, Application Insights
- **Custom SSO Provider:** For authentication via OAuth 2.0/OpenID Connect.

## Project Structure
```
ats-app/                     # Full-stack application (React + Express)
├── server/                  # Backend Express.js server
│   ├── db.js               # PostgreSQL connection with Azure SSL config
│   ├── index.js            # REST API endpoints (/api/jobs, /api/jobs/:id)
│   └── setup-db.js         # Database schema and sample data setup
├── src/                    # React frontend
│   ├── components/
│   │   ├── LandingPage.tsx        # Animated landing page (public)
│   │   ├── JobsPage.tsx           # Public job listing page
│   │   ├── Navigation.tsx         # Public navigation (Home/Jobs)
│   │   ├── DashboardLayout.tsx    # Portal layout with sidebar/header
│   │   ├── Sidebar.tsx            # Collapsible side navigation
│   │   ├── DashboardHome.tsx      # Dashboard home with KPIs
│   │   ├── JobsPageDashboard.tsx  # Jobs page for portal
│   │   └── DarkModeToggle.tsx
│   ├── App.tsx             # React Router (public + dashboard routes)
│   └── index.css           # Custom animations (float, slide, gradient)
├── package.json            # Scripts: dev:all (runs frontend + backend)
└── vite.config.ts          # Vite config with /api proxy to port 3001

docs/                       # Comprehensive project documentation
├── epics/                  # 6 epic files with high-level feature breakdowns
├── stories/                # 38 user story files (21 MVP, 17 Phase 2)
├── style-guide/            # Material-UI design patterns (for reference)
├── prd.md                  # Product Requirements Document
├── implementation-guide.md
└── ui-specifications.md
```

## Development Commands
```bash
cd ats-app
npm run dev:all      # Run both backend (port 3001) and frontend (port 5000)
npm run dev          # Run frontend only (Vite dev server)
npm run server       # Run backend only (Express API server)
node server/setup-db.js  # Initialize database schema and sample data
```

## Security Notes
- **SSL Configuration:** Development mode uses `rejectUnauthorized: false` for Azure PostgreSQL. Production deployment is blocked via NODE_ENV check until proper Azure CA bundle is configured.
- **Production Deployment:** Requires downloading Azure CA bundle (DigiCertGlobalRootCA.crt.pem) and setting `NODE_ENV=production` with proper SSL certificate validation.
