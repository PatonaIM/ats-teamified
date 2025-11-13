# Multi-Employment ATS System - Technical Documentation Repository

## Overview
This repository contains comprehensive technical documentation for a Multi-Employment ATS (Applicant Tracking System) designed to manage diverse employment types (contract, part-time, full-time, EOR) with Azure-native architecture, LinkedIn integration, external portal processing, AI-powered features, and comprehensive compliance capabilities.

**MVP Strategy:** The system prioritizes **AI-powered differentiation** as the core competitive advantage, delivering intelligent hiring capabilities from day one including AI job description generation, AI interview question generation, sentiment analysis for candidate engagement monitoring, and advanced analytics dashboards.

## Project Type
**Technical Documentation & Specifications** - This is a documentation repository containing detailed system requirements, product specifications, and architectural guidelines for building a sophisticated multi-employment ATS platform.

## Key Documentation Files

### Primary Documentation
- **docs/brief.md**: Complete system requirements brief with detailed technical specifications, workflow descriptions, feature requirements, and integration details
- **docs/prd.md**: Product Requirements Document (PRD v1.8) with functional/non-functional requirements, epic structure, user stories, and comprehensive acceptance criteria
- **docs/implementation-guide.md**: Comprehensive implementation plan with technical stack recommendations, development roadmap, team structure, and cost estimates
- **docs/ui-specifications.md**: UI/UX specifications with landing page, dashboard, side menu layouts, component library, color system, and responsive design guidelines
- **server.py**: Simple HTTP server for browsing documentation in Replit environment

### System Capabilities Documented

#### MVP Priority Features (Phase 1)

**AI-Assisted Tools (MVP Core):**
1. **AI Job Description Generation [MVP]**: GPT-4/Claude prompt-based generation with employment type templates, requires human review/editing before posting
2. **AI Interview Question Generation [MVP]**: Template-based employment type question libraries with basic resume keyword matching for customization
3. **Sentiment Analysis & Candidate Engagement Intelligence [MVP - Simplified]**: Email response time tracking, rule-based engagement scoring (0-100), manual recruiter alerts
4. **Analytics Dashboards [MVP - Descriptive]**: Hiring funnel visualization, time-to-hire metrics, source effectiveness, basic conversion rates (no predictions)

**Essential Supporting Infrastructure (MVP):**
- Multi-employment type job management (contract, part-time, full-time, EOR)
- LinkedIn Jobs API integration with bidirectional synchronization
- 6-stage customizable candidate pipeline (Screening → Shortlist → Client Endorsement → Client Interview → Offer → Offer Accepted)
- Accept/reject decision workflows with audit trails
- Basic email notifications and in-app alerts
- Custom SSO Provider authentication integration

#### Deferred to Phase 2 (Requires Data + Portal)
- **Advanced AI Automation**: ML-based NLP sentiment analysis, competing offer detection, live interview assistant, automated bias detection, historical question optimization (needs 50-100 hires)
- **Candidate Portal & Behavioral Telemetry**: Portal activity monitoring, session tracking, assessment engagement metrics (enables advanced AI features)
- **External Portal Integration**: AI screening results import, interactive candidate workflows
- **Complex Workflows**: Multi-stage budget approvals, blockchain document verification
- **Multi-Channel Communications**: SMS, Slack, Teams integrations

## Architecture
The documented system uses Azure-native architecture with:
- **Backend**: Node.js + NestJS (TypeScript) with microservices architecture
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui component library
- **Database**: Azure Database for PostgreSQL (Flexible Server) with Prisma ORM
- **Storage**: Azure Blob Storage with lifecycle management
- **Compute**: Azure Kubernetes Service (AKS) with auto-scaling
- **AI/ML**: OpenAI GPT-4/Anthropic Claude for LLM, custom ML models for predictions
- **Authentication**: Custom SSO Provider integration via OAuth 2.0/OpenID Connect (Passport.js)
- **Monitoring**: Azure Monitor, Log Analytics, Application Insights
- **Brand Colors**: Purple (#A16AE8) + Blue (#8096FD)

## Recent Changes
- 2025-11-13: **Created UI Specifications Document (v2.0 - Expanded)**
  - Comprehensive landing page layout (hero, features, employment types showcase)
  - Role-based side menu navigation (Admin, Recruiter, Client)
  - Dashboard design with KPI cards, hiring funnel, recent activity, jobs requiring attention
  - **NEW: Detailed wireframes for Jobs List page** (list/grid views, filters, pipeline progress)
  - **NEW: Candidate Pipeline Kanban board** (drag-and-drop, engagement indicators, stage counts)
  - **NEW: Candidate Movement flows** (movement modal, history timeline, bulk operations, auto-rules)
  - **NEW: Complete Dark Mode specifications** (color palette, component adaptations, theme toggle)
  - Purple (#A16AE8) + Blue (#8096FD) color system with employment type color coding
  - shadcn/ui component library specifications with code examples
  - Responsive design guidelines (desktop, tablet, mobile)
  - Accessibility standards (WCAG 2.1 AA)
- 2025-11-13: **Implementation Guide v2.0 - FINAL APPROVAL ✅**
  - **Major Stack Update:** Node.js + NestJS backend (from .NET), PostgreSQL (from Azure SQL), Tailwind CSS + shadcn/ui (from Material-UI), Custom SSO provider (from Teamified Accounts)
  - Updated Purple (#A16AE8) + Blue (#8096FD) brand colors throughout UI specifications
  - Full-stack TypeScript team structure (7-9 FTE) for better cross-functional collaboration
  - Updated cost estimates: **$500k-$550k MVP** (12% savings vs .NET), ~$1.19M-$1.24M total project
  - Architect-reviewed and production-ready for engineering teams
- 2025-11-13: **Created Comprehensive Implementation Guide (v1.0)**
  - Initial technical stack recommendations (React, .NET 8, Azure-native)
  - 3-phase implementation roadmap (MVP 4-6 months, Phase 2 4 months, Phase 3 4 months)
  - Team structure and resource allocation (6-10 person team)
  - DevOps and deployment strategy (GitHub Actions, AKS, blue-green deployment)
  - Security and compliance implementation (OAuth 2.0, GDPR, audit logging)
  - Original cost estimates ($250k-$400k MVP, ~$1.3M-$1.5M total)
- 2025-11-13: Initial repository setup and documentation import
- 2025-11-13: Added comprehensive Sentiment Analysis specifications to brief.md and prd.md
  - Communication pattern analysis and NLP sentiment scoring
  - Engagement scoring system (0-100) with weighted factors
  - Proactive alert system with recruiter dashboard integration
  - Competing offer detection using pattern recognition
- 2025-11-13: Added AI-Powered Interview Question Generation specifications
  - Employment type-specific question templates
  - Resume-based customization with historical performance tracking
  - Bias detection and mitigation capabilities
  - Live interview assistant with real-time follow-ups
- 2025-11-13: Expanded PRD FR16 with detailed AI capability specifications
  - FR16.1: Sentiment Analysis & Candidate Engagement Intelligence
  - FR16.2: AI-Powered Interview Question Generation
  - FR16.3: AI Integration Technical Specifications
- 2025-11-13: Added user stories to PRD epic structure
  - Story 3.7: AI-Powered Interview Question Generation (Epic 3)
  - Story 5.6: Sentiment Analysis & Candidate Engagement Intelligence (Epic 5)
- 2025-11-13: **Defined MVP Scope with AI-Powered Differentiation Strategy (v1.7)**
  - Added "MVP Scope Definition" section to brief.md
  - Added "MVP vs Full Product Scope" section to prd.md
  - Labeled FR1.1, FR14, FR16.1, FR16.2 as [MVP Priority] features
  - Added MVP implementation notes to Stories 1.3, 3.7, 5.6, and 6.1
  - Defined data bootstrapping strategy for AI model improvement
  - Established MVP success metrics and KPIs
  - Clearly delineated Phase 1 (MVP), Phase 2, and Phase 3 features

## AI Features Technical Specifications

### Sentiment Analysis (FR16.1, Story 5.6)
- **MVP Baseline**: Email response time tracking, rule-based engagement scoring (0-100), manual recruiter alerts
- **Phase 2**: NLP sentiment analysis, portal activity monitoring, competing offer detection, automated interventions (requires portal + 50-100 hires)
- **Phase 3**: 80%+ prediction accuracy, proactive engagement automation, ML-powered insights

### Interview Question Generation (FR16.2, Story 3.7)
- **MVP Baseline**: Template-based employment type question libraries, basic resume keyword matching, question repository management
- **Phase 2**: Live interview assistant, automated bias detection, historical effectiveness tracking (requires 50+ hires per role)
- **Phase 3**: 70%+ effectiveness accuracy, ML-optimized personalization, continuous improvement

## Architect Review Status: ✅ APPROVED (Production-Ready) - Implementation Guide v2.0

**Final Approval Summary (November 13, 2025):** Implementation Guide v2.0 is internally consistent with the Node.js + NestJS + Prisma + PostgreSQL + Tailwind CSS + Custom SSO architecture and reflects the updated MVP budget ($500k-$550k). All technical stack references, environment setup, authentication, security sections, and cost estimates are aligned. No remaining .NET, Azure SQL, or Teamified Accounts dependencies outside historical changelog. Document is production-ready for engineering teams.

**Next Actions:**
1. **Engineering Kickoff**: Publish Implementation Guide v2.0 with engineering leadership for team onboarding
2. **Environment Setup**: Begin provisioning Azure resources (AKS, PostgreSQL Flexible Server, Blob Storage, Redis)
3. **Custom SSO Integration**: Implement OAuth 2.0 abstraction layer with Passport.js and local auth fallback
4. **Validate Roadmap**: Ensure all parallel documentation (PRD, technical briefs) reference the Node.js stack consistently

## Replit Setup
Since this is a documentation repository, we've configured:
- **documentation-server**: Simple HTTP server (Python) for browsing markdown documentation
- All documentation accessible via web interface at port 5000

## Epic Structure (PRD)
1. **Epic 1**: Foundation & Core Infrastructure
2. **Epic 2**: External Portal Integration & Candidate Processing
3. **Epic 3**: Assessment, Interview & Document Verification Systems (includes Story 3.7)
4. **Epic 4**: Budget Approval & Employment Type Workflows
5. **Epic 5**: Candidate Experience & Notification Platform (includes Story 5.6)
6. **Epic 6**: Analytics, Reporting & System Optimization

## Compliance & Security
- GDPR, CCPA, HIPAA, SOX compliance frameworks
- End-to-end encryption with Azure Key Vault
- Multi-factor authentication through Teamified Accounts
- Comprehensive audit logging and role-based access control
- Privacy-first AI processing with candidate consent and opt-out capabilities
