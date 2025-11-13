# Multi-Employment ATS System - Implementation Guide

**Document Version:** 1.0  
**Date:** November 13, 2025  
**Status:** Draft - Ready for Review

## Executive Summary

This implementation guide provides a comprehensive roadmap for building the Multi-Employment ATS System, a sophisticated applicant tracking platform supporting diverse employment types (contract, part-time, full-time, EOR) with Azure-native architecture, AI-powered capabilities, and LinkedIn integration.

**Project Scope:** MVP delivery in 4-6 months with 6-10 person development team  
**Estimated Budget:** $250,000 - $400,000 for MVP (Phase 1)  
**Technology Approach:** Azure-native cloud architecture with modern microservices, React frontend, and .NET/Node.js backend

---

## Table of Contents

1. [Technical Stack Recommendations](#technical-stack-recommendations)
2. [System Architecture](#system-architecture)
3. [Implementation Phases](#implementation-phases)
4. [Development Roadmap](#development-roadmap)
5. [Team Structure & Resource Allocation](#team-structure--resource-allocation)
6. [Development Environment Setup](#development-environment-setup)
7. [DevOps & Deployment Strategy](#devops--deployment-strategy)
8. [Security & Compliance Implementation](#security--compliance-implementation)
9. [Cost Estimates & Budget Planning](#cost-estimates--budget-planning)
10. [Risk Management & Mitigation](#risk-management--mitigation)

---

## Technical Stack Recommendations

### Frontend Stack

#### Primary Framework: **React 18+ with TypeScript**
**Rationale:** Industry-standard SPA framework with excellent ecosystem, TypeScript for type safety, and strong Azure integration

**Core Libraries:**
- **UI Framework:** Material-UI (MUI) v5 or Ant Design
  - Pre-built components for dashboards, forms, tables
  - Employment type color coding support
  - Mobile-responsive out of the box
- **State Management:** Redux Toolkit + RTK Query
  - Centralized state for complex workflows
  - Built-in caching for API calls
  - DevTools for debugging
- **Routing:** React Router v6
  - Nested routes for job detail pages
  - Protected routes for authentication
- **Form Management:** React Hook Form + Zod
  - Type-safe form validation
  - Employment type-specific field validation
- **Date/Time:** date-fns or Day.js
  - Timezone-aware scheduling for Team Connect integration
- **Rich Text Editor:** TinyMCE or Quill
  - AI-generated job description editing
  - LinkedIn formatting preview
- **PDF Viewer:** react-pdf or PDF.js
  - Resume viewing in candidate detail panel
- **Drag & Drop:** react-beautiful-dnd or @dnd-kit
  - Pipeline stage customization
  - Candidate movement between stages

**Build Tools:**
- **Bundler:** Vite (faster than Webpack, excellent DX)
- **Package Manager:** pnpm (faster, disk-efficient)
- **Code Quality:** ESLint + Prettier + Husky (pre-commit hooks)

### Backend Stack

#### Primary Framework: **.NET 8 (C#) Microservices Architecture**
**Rationale:** Enterprise-grade performance, Azure-native tooling, strong typing, excellent async support

**Alternative Option:** Node.js 20 LTS with NestJS
**Use Case:** If team has stronger JavaScript expertise or needs rapid prototyping

**Core Components:**

**API Layer:**
- **Framework:** ASP.NET Core Web API 8.0
- **API Documentation:** Swagger/OpenAPI with Swashbuckle
- **API Gateway:** Azure API Management or Ocelot
- **Authentication:** IdentityServer4 or Duende IdentityServer for OAuth 2.0/OIDC with Teamified Accounts
- **Validation:** FluentValidation for complex business rules

**Service Architecture:**
- **Job Management Service** - Job creation, approval workflows, LinkedIn sync
- **Candidate Service** - Candidate profiles, pipeline management, stage progression
- **AI Service** - Job description generation, interview questions, sentiment analysis
- **Notification Service** - Multi-channel notifications (email, in-app, future SMS/Slack)
- **Document Service** - Resume storage, document verification
- **Budget Service** - Employment type-specific budget calculations, approval workflows
- **Analytics Service** - Dashboard metrics, reporting, funnel visualization
- **Integration Service** - External portal API, LinkedIn API, Team Connect API

**Supporting Libraries:**
- **ORM:** Entity Framework Core 8.0
  - Code-first migrations
  - LINQ query support
  - Change tracking for audit trails
- **Background Jobs:** Hangfire or Azure Functions
  - Scheduled LinkedIn sync
  - Email batch processing
  - ML model training jobs
- **Caching:** StackExchange.Redis client for Azure Cache for Redis
- **Logging:** Serilog with Azure Application Insights sink
- **HTTP Client:** HttpClientFactory with Polly (retry policies, circuit breakers)
- **Message Queue:** Azure Service Bus SDK
  - Async candidate pipeline updates
  - Notification queuing

### Database & Storage

#### Primary Database: **Azure SQL Database (Serverless)**
**Configuration:**
- **Tier:** General Purpose (Serverless)
- **Compute:** 2-8 vCores (auto-scaling)
- **Storage:** 50GB initial, 500GB max
- **Backup:** Point-in-time restore (7-35 days)

**Schema Design:**
- **Multi-tenant:** TenantId column on all tables with row-level security
- **Audit Tables:** Temporal tables for complete history tracking
- **Indexing Strategy:** Composite indexes on TenantId + frequently queried columns

**Alternative for High Scale:** Azure Cosmos DB (NoSQL) for candidate documents if exceeding 100k+ candidates

#### Blob Storage: **Azure Blob Storage (Hot Tier)**
**Use Cases:**
- Resume documents (PDF, DOCX)
- AI screening results from external portal
- Job description templates
- Assessment files
- Contract documents

**Configuration:**
- **Redundancy:** Geo-redundant storage (GRS)
- **Lifecycle Management:** Auto-archive documents >2 years to Cool tier
- **CDN:** Azure CDN for fast global resume downloads
- **Access:** Shared Access Signatures (SAS) for temporary secure access

#### Caching: **Azure Cache for Redis (Basic/Standard)**
**Use Cases:**
- API response caching (30-300 seconds TTL)
- User session storage
- AI-generated content caching (job descriptions, questions)
- Dashboard metrics caching
- LinkedIn API rate limit tracking

### AI/ML Stack

#### LLM Integration: **OpenAI GPT-4 + Anthropic Claude**
**Primary:** OpenAI GPT-4 Turbo for job description generation, interview questions
**Backup:** Anthropic Claude 3 Opus for advanced analysis, fallback provider

**SDK/Libraries:**
- **.NET:** Azure.AI.OpenAI SDK + Anthropic.SDK (unofficial)
- **Prompt Management:** Semantic Kernel (Microsoft) for prompt engineering
- **Cost Tracking:** Custom middleware logging token usage per request

**ML Frameworks (Phase 2+):**
- **Scikit-learn:** Python ML models for engagement scoring, question effectiveness
- **XGBoost/LightGBM:** Gradient boosting for binary classification (offer acceptance prediction)
- **Hosting:** Azure Machine Learning Workspace for model training and deployment

**NLP Processing:**
- **Resume Parsing:** Azure Cognitive Services - Form Recognizer
- **Sentiment Analysis (Phase 2):** Azure Cognitive Services - Text Analytics API
- **Entity Extraction:** spaCy or Azure Cognitive Services

### Infrastructure & DevOps

#### Cloud Platform: **Microsoft Azure**
**Core Services:**
- **Compute:** Azure Kubernetes Service (AKS) for containerized microservices
  - Node pools: 3-10 nodes (Standard_D4s_v3)
  - Auto-scaling: Horizontal Pod Autoscaler (HPA)
  - Ingress: NGINX Ingress Controller with Azure Load Balancer
- **Container Registry:** Azure Container Registry (ACR)
- **DNS:** Azure DNS for custom domain management
- **CDN:** Azure CDN for static asset delivery
- **API Management:** Azure API Management (Developer tier for MVP, Standard for production)

**Kubernetes Stack:**
- **Orchestration:** Azure Kubernetes Service (AKS) 1.28+
- **Service Mesh:** Istio or Linkerd (optional, Phase 2 for advanced traffic management)
- **Secrets Management:** Azure Key Vault with CSI driver
- **Monitoring:** Prometheus + Grafana or Azure Monitor for containers
- **Logging:** Fluentd + Azure Log Analytics

#### CI/CD Pipeline: **Azure DevOps or GitHub Actions**
**Recommended:** GitHub Actions (modern, GitHub-native, free for private repos)

**Pipeline Stages:**
1. **Build:** .NET build, npm build, Docker image creation
2. **Test:** Unit tests, integration tests, E2E tests (Playwright)
3. **Security Scan:** SonarQube, Snyk, OWASP Dependency Check
4. **Deploy to Dev:** Auto-deploy on main branch merge
5. **Deploy to Staging:** Manual approval gate
6. **Deploy to Production:** Manual approval + rollback capability

**Infrastructure as Code:**
- **Terraform:** Azure resource provisioning (AKS, SQL, Blob Storage)
- **Helm Charts:** Kubernetes application deployment
- **Azure Bicep:** Alternative to Terraform (Azure-native DSL)

#### Monitoring & Observability

**Application Monitoring:**
- **Azure Application Insights** (integrated with .NET services)
  - Request tracking, exception logging
  - Custom metrics (AI API costs, LinkedIn sync status)
  - Real-time alerts on failures

**Infrastructure Monitoring:**
- **Azure Monitor** for resource metrics (CPU, memory, disk)
- **Log Analytics Workspace** for centralized log aggregation
- **Alerts:** Critical error alerts via email/SMS, PagerDuty integration

**APM (Application Performance Monitoring):**
- **Azure Application Insights APM** or **Datadog**
- Distributed tracing across microservices
- Database query performance monitoring
- External API latency tracking (LinkedIn, OpenAI, Team Connect)

### Third-Party Integrations

#### Authentication: **Teamified Accounts (OAuth 2.0 / OIDC)**
**SDK:** IdentityModel.OidcClient (.NET) or oidc-client-ts (React)
**Flow:** Authorization Code Flow with PKCE
**Token Storage:** HttpOnly cookies (backend) + memory storage (frontend)

#### LinkedIn Jobs API
**SDK:** Custom HTTP client (LinkedIn doesn't provide official SDK)
**Authentication:** OAuth 2.0 with LinkedIn developer app credentials
**Rate Limits:** 100 requests/day (free tier), 500/day (paid tier)
**Webhooks:** Polling-based sync every 5 minutes (no webhook support)

#### Team Connect (Interview Scheduling)
**Integration Type:** REST API integration (custom implementation)
**Features:**
- Calendar sync (Google Calendar, Outlook via Microsoft Graph API)
- Automated meeting invitations
- Timezone management with IANA timezone database

**Calendar API SDKs:**
- **Google Calendar:** Google.Apis.Calendar.v3 (.NET)
- **Microsoft Graph:** Microsoft.Graph SDK for Outlook/Teams
- **iCal Generation:** Ical.Net library for .ics file creation

#### External Candidate Portal
**Integration Type:** REST API + Webhooks
**Data Exchange:**
- Candidate profiles (JSON API)
- AI screening results (JSON API)
- Real-time status updates (webhooks)

**SDK:** Custom API client with retry logic and circuit breakers

### Security & Compliance Stack

**Authentication & Authorization:**
- **OAuth 2.0 / OpenID Connect:** Teamified Accounts integration
- **JWT Tokens:** Access tokens (15 min expiry), Refresh tokens (7 days)
- **MFA:** Delegated to Teamified Accounts
- **RBAC:** Custom role-based access control (Recruiter, Manager, Client, Admin)

**Data Encryption:**
- **In-Transit:** TLS 1.3 for all API communication
- **At-Rest:** Azure SQL Database Transparent Data Encryption (TDE)
- **Blob Storage:** Server-side encryption with Microsoft-managed keys
- **Secrets:** Azure Key Vault for API keys, connection strings

**Compliance Tools:**
- **GDPR:** Azure Policy for data residency, custom data deletion workflows
- **Audit Logging:** SQL temporal tables + Azure Monitor logs
- **Data Anonymization:** Faker.NET for test data generation
- **Vulnerability Scanning:** Snyk, WhiteSource Bolt, Azure Security Center

**Security Headers:**
- Helmet.js equivalent for .NET (NWebsec middleware)
- Content Security Policy (CSP)
- CORS policies (whitelist approach)

### Testing Stack

**Unit Testing:**
- **Framework:** xUnit.net (.NET) + Jest (React)
- **Mocking:** Moq (.NET) + MSW (Mock Service Worker for React)
- **Coverage:** Coverlet (80% minimum code coverage target)

**Integration Testing:**
- **Framework:** xUnit.net with WebApplicationFactory
- **Database:** Testcontainers for SQL Server (Docker-based test DB)
- **API Testing:** REST Assured equivalent or custom HTTP test client

**E2E Testing:**
- **Framework:** Playwright (cross-browser support, faster than Selenium)
- **Test Scenarios:** Critical user flows (job creation, candidate progression)

**Load Testing:**
- **Tool:** k6 or Azure Load Testing
- **Targets:** 1000 concurrent users, <2s API response time

### Recommended Development Tools

**IDEs:**
- **Backend:** Visual Studio 2022 or JetBrains Rider
- **Frontend:** VS Code with ESLint, Prettier, TypeScript extensions

**API Testing:**
- **Postman** or **Insomnia** for manual API testing
- **Swagger UI** for auto-generated API documentation

**Database Management:**
- **Azure Data Studio** or **SQL Server Management Studio**
- **Entity Framework Core Migrations** for schema versioning

**Version Control:**
- **Git** with **GitHub** (recommended) or **Azure Repos**
- **Branching Strategy:** GitFlow (main, develop, feature/*, hotfix/*)

---

## System Architecture

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Frontend Layer (React)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │  Client      │  │  Recruiter   │  │  Admin       │             │
│  │  Dashboard   │  │  Portal      │  │  Console     │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
│                           │                                          │
│                           ▼                                          │
│                  Azure CDN (Static Assets)                          │
└─────────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    API Gateway Layer (Azure API Management)         │
│  - Rate Limiting   - API Versioning   - Request/Response Transform │
└─────────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│             Microservices Layer (Azure Kubernetes Service)          │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │ Job Service  │  │ Candidate    │  │ AI Service   │             │
│  │ - CRUD       │  │ Service      │  │ - GPT-4 Gen  │             │
│  │ - Approval   │  │ - Pipeline   │  │ - Sentiment  │             │
│  │ - LinkedIn   │  │ - Stages     │  │ - Questions  │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │ Notification │  │ Budget       │  │ Analytics    │             │
│  │ Service      │  │ Service      │  │ Service      │             │
│  │ - Email/SMS  │  │ - Approval   │  │ - Dashboards │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐                                │
│  │ Document     │  │ Integration  │                                │
│  │ Service      │  │ Service      │                                │
│  │ - Resumes    │  │ - External   │                                │
│  └──────────────┘  └──────────────┘                                │
└─────────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Data & Storage Layer                           │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │ Azure SQL    │  │ Azure Blob   │  │ Azure Cache  │             │
│  │ Database     │  │ Storage      │  │ for Redis    │             │
│  │ (Serverless) │  │ (Documents)  │  │ (Caching)    │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
└─────────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    External Integrations                            │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │ Teamified    │  │ LinkedIn     │  │ Team Connect │             │
│  │ Accounts     │  │ Jobs API     │  │ Scheduling   │             │
│  │ (OAuth)      │  │              │  │              │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │ External     │  │ OpenAI/      │  │ Azure        │             │
│  │ Candidate    │  │ Anthropic    │  │ Cognitive    │             │
│  │ Portal       │  │ APIs         │  │ Services     │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
└─────────────────────────────────────────────────────────────────────┘
```

### Database Schema Overview

**Core Tables:**
- `Tenants` - Multi-tenant organizations
- `Users` - User profiles (synced from Teamified Accounts)
- `Jobs` - Job requests with employment type-specific fields
- `JobPipelineStages` - Customizable pipeline stages per job
- `Candidates` - Candidate profiles and application data
- `CandidatePipelineStatus` - Current stage and progression tracking
- `Decisions` - Accept/reject decisions with audit trail
- `Documents` - Resume and document metadata (files in Blob Storage)
- `BudgetApprovals` - Employment type-specific budget workflows
- `Notifications` - Multi-channel notification queue
- `AuditLogs` - Comprehensive audit trail (temporal tables)

**AI/ML Tables (Phase 2):**
- `InterviewQuestions` - Question library with effectiveness tracking
- `SentimentScores` - Candidate engagement scoring history
- `MLModels` - Model metadata and version tracking

---

## Implementation Phases

### Phase 1: MVP Foundation (Months 1-4)

**Month 1: Infrastructure & Authentication**
- Azure resource provisioning (AKS, SQL Database, Blob Storage)
- Kubernetes cluster setup with Helm charts
- CI/CD pipeline configuration (GitHub Actions)
- Teamified Accounts OAuth 2.0 integration
- Basic RBAC implementation
- Development environment setup

**Month 2: Core Job Management & LinkedIn Integration**
- Job request CRUD with employment type support
- Role-based approval workflows (client vs recruiter jobs)
- AI job description generation (OpenAI GPT-4 integration)
- LinkedIn Jobs API integration (posting, sync)
- Job editing and audit trails
- Basic job listing dashboard

**Month 3: Candidate Pipeline & Decision Framework**
- Configurable 6-stage pipeline implementation
- Pipeline stage customization during job creation/editing
- Candidate profile management
- Accept/reject decision framework with audit trails
- Candidate movement between stages
- External portal API integration for screening data import
- Application history timeline

**Month 4: Client Dashboard & Job Detail Interface**
- Client position dashboard (Story 2.6)
- Job detail page split-screen layout (Story 2.7)
- Resume viewer and document management
- Basic email notifications
- MVP deployment to staging environment
- User acceptance testing (UAT)

**MVP Deliverables:**
- ✅ Core job management with AI job description generation
- ✅ LinkedIn job posting and sync
- ✅ Configurable 6-stage pipeline
- ✅ Client dashboard and job detail interface
- ✅ Basic candidate management and stage progression
- ✅ Accept/reject decision workflows
- ✅ Email notifications
- ✅ Teamified Accounts authentication

### Phase 2: Enhanced Features & Data Collection (Months 5-8)

**Month 5: Interview Management & Team Connect**
- Team Connect API integration for interview scheduling
- Interview scheduling workflows with calendar sync
- AI interview question generation (template-based MVP)
- Question library management
- Interview notes and feedback collection

**Month 6: Budget Approval & Document Verification**
- Employment type-specific budget approval workflows
- Evidence-based approval process
- Service agreement generation for contracts
- Basic document verification (manual upload/review)
- Budget analytics dashboard

**Month 7: Advanced Analytics & Sentiment Analysis Baseline**
- Advanced analytics dashboards (hiring funnel, time-to-hire)
- Source effectiveness analysis
- Employment type comparison dashboards
- Basic sentiment analysis (email response time tracking)
- Engagement scoring (rule-based, 0-100 scale)
- Manual recruiter alerts for declining engagement

**Month 8: Candidate Portal & Data Collection Infrastructure**
- Candidate portal interface development (Story 5.1)
- Interactive candidate actions (assessments, interview scheduling)
- Portal activity tracking infrastructure
- Data collection pipeline for ML training (Phase 3)
- Production deployment

**Phase 2 Deliverables:**
- ✅ Team Connect interview scheduling integration
- ✅ AI interview question generation (template-based)
- ✅ Budget approval workflows with employment type calculations
- ✅ Advanced analytics dashboards
- ✅ Basic sentiment analysis (email tracking)
- ✅ Candidate portal for self-service actions
- ✅ Data collection infrastructure for future ML models

### Phase 3: ML/AI Optimization & Automation (Months 9-12)

**Prerequisites:** 50-200 completed hires with outcomes data

**Month 9: ML Model Development**
- NLP sentiment analysis model training
- Engagement scoring ML model (XGBoost/Random Forest)
- Historical interview question effectiveness tracking
- Competing offer detection pattern recognition
- Model deployment to Azure ML Workspace

**Month 10: AI Automation Features**
- Live interview assistant with real-time follow-up suggestions
- Automated bias detection in interview questions
- Predictive offer acceptance analytics
- Proactive candidate engagement interventions
- ML-powered question personalization

**Month 11: Advanced Portal & Integrations**
- Portal activity monitoring (login frequency, session duration)
- Assessment engagement metrics
- Document upload timeliness tracking
- Multi-channel notifications (SMS, Slack, Teams)
- Advanced assessment platform integrations

**Month 12: Optimization & Scale**
- Performance optimization (API response times, database queries)
- Advanced caching strategies
- Predictive analytics (hiring completion forecasts)
- Model retraining pipeline automation
- Multi-tenant white-label branding (Phase 3 optional)

**Phase 3 Deliverables:**
- ✅ ML-based sentiment analysis with 80%+ accuracy
- ✅ AI-powered interview question optimization
- ✅ Live interview assistant
- ✅ Competing offer detection
- ✅ Predictive analytics
- ✅ Multi-channel notifications
- ✅ Advanced assessment integrations

---

## Development Roadmap

### Sprint Structure (2-week sprints)

**Sprint 0 (Week 1-2): Project Kickoff & Setup**
- Azure subscription setup and resource group creation
- Development team onboarding and tool setup
- Repository structure and branching strategy
- CI/CD pipeline skeleton
- Architecture review and approval
- PRD refinement workshops

**Sprint 1-2 (Week 3-6): Infrastructure & Authentication**
- Epic 1 Stories: 1.1 (Azure Infrastructure), 1.2 (Teamified Accounts)
- AKS cluster provisioning with Terraform
- Azure SQL Database and Blob Storage setup
- OAuth 2.0 integration with Teamified Accounts
- RBAC implementation
- Monitoring and logging setup

**Sprint 3-4 (Week 7-10): Job Management Foundation**
- Epic 1 Story 1.3: Core Job Management System
- Job request CRUD APIs and database schema
- Employment type-specific field templates
- Role-based approval workflows
- Job editing and audit trails
- Basic job listing UI

**Sprint 5-6 (Week 11-14): AI Job Descriptions & LinkedIn**
- Epic 1 Stories: 1.5 (AI Job Description), 1.6 (LinkedIn Integration)
- OpenAI GPT-4 integration for job description generation
- LinkedIn Jobs API integration (posting, sync)
- AI-generated content review and editing UI
- LinkedIn posting triggers and synchronization
- Error handling and retry logic

**Sprint 7-8 (Week 15-18): Candidate Pipeline Core**
- Epic 2 Stories: 2.2 (Pipeline Configuration), 2.3 (Accept/Reject), 2.4 (Progression)
- 6-stage pipeline implementation with customization
- Accept/reject decision framework
- Candidate profile management
- Pipeline progression engine
- Decision audit trails

**Sprint 9-10 (Week 19-22): External Portal Integration**
- Epic 2 Stories: 2.1 (External Portal API), 2.5 (Data Sync)
- External portal API client implementation
- Candidate data import from screening portal
- AI screening results integration
- Real-time webhook processing
- Data validation and error handling

**Sprint 11-12 (Week 23-26): Client Dashboard & Job Detail UI**
- Epic 2 Stories: 2.6 (Client Dashboard), 2.7 (Job Detail Interface)
- Client position dashboard with pipeline visualization
- Job detail split-screen layout
- Resume viewer implementation
- Application history timeline
- Move to Next Stage / Disqualify workflows
- Employment type color coding

**Sprint 13 (Week 27-28): Notifications & MVP Stabilization**
- Epic 5 Story 5.3: Multi-Channel Notification System (email only for MVP)
- Email notification templates
- Notification preferences
- In-app notification center
- MVP bug fixes and testing

**Sprint 14 (Week 29-30): MVP Testing & Deployment**
- UAT with pilot users
- Performance testing and optimization
- Security audit and penetration testing
- Production deployment
- Documentation finalization
- MVP retrospective

**Total MVP Duration:** 7-8 months (14 sprints + buffer)

---

## Team Structure & Resource Allocation

### Recommended Team Composition (MVP Phase 1)

**Core Development Team (6-10 people):**

1. **Engineering Manager / Tech Lead (1)**
   - Overall architecture and technical decisions
   - Sprint planning and velocity tracking
   - Code review and quality assurance
   - Risk management
   - **Time:** Full-time (100%)

2. **Backend Engineers (2-3)**
   - .NET microservices development
   - API design and implementation
   - Database schema design
   - Integration development (LinkedIn, Teamified Accounts, Team Connect)
   - **Time:** Full-time (100%)
   - **Skills:** C#/.NET Core, Entity Framework, Azure, REST APIs, OAuth 2.0

3. **Frontend Engineers (2)**
   - React UI development
   - State management and API integration
   - Responsive design implementation
   - UI/UX component library
   - **Time:** Full-time (100%)
   - **Skills:** React, TypeScript, Redux, Material-UI, CSS

4. **Full-Stack Engineer (1)**
   - Bridge frontend and backend teams
   - End-to-end feature development
   - Integration testing
   - **Time:** Full-time (100%)
   - **Skills:** .NET + React, API integration, problem-solving

5. **DevOps Engineer (1)**
   - Azure infrastructure management
   - CI/CD pipeline maintenance
   - Kubernetes cluster operations
   - Monitoring and alerting setup
   - **Time:** Full-time (100%)
   - **Skills:** Azure, Kubernetes, Terraform, Docker, GitHub Actions

6. **QA Engineer (1)**
   - Test plan creation and execution
   - Automated test development (unit, integration, E2E)
   - Bug tracking and regression testing
   - Performance and load testing
   - **Time:** Full-time (100%)
   - **Skills:** Playwright, xUnit, API testing, test automation

**Extended Team (Part-time/Advisory):**

7. **UI/UX Designer (0.5 FTE)**
   - Dashboard and interface design
   - User flow optimization
   - Design system creation
   - Usability testing
   - **Time:** Part-time (50%)

8. **Data Scientist / ML Engineer (0.25 FTE for Phase 1, 1.0 FTE for Phase 2-3)**
   - OpenAI/Anthropic prompt engineering
   - ML model design (Phase 2+)
   - Data pipeline architecture
   - **Time:** Part-time consultation (Phase 1), Full-time (Phase 2-3)

9. **Security Specialist (0.25 FTE)**
   - Security architecture review
   - Penetration testing
   - Compliance audits (GDPR, CCPA)
   - **Time:** Consulting basis (quarterly reviews)

10. **Product Manager (1)**
    - Backlog prioritization
    - Stakeholder communication
    - User story refinement
    - Sprint planning facilitation
    - **Time:** Full-time (100%)

**Total Estimated Headcount:** 8-10 FTE for MVP (Phase 1)

### Skill Requirements Matrix

| Role | Primary Skills | Nice-to-Have | Tools |
|------|---------------|--------------|-------|
| Backend Engineer | C#, .NET Core 8, EF Core, Azure SQL, REST APIs, OAuth 2.0 | Microservices, Event-driven architecture, Redis | Visual Studio, Postman, Azure Portal |
| Frontend Engineer | React 18, TypeScript, Redux, Material-UI, REST API integration | Vite, Storybook, Accessibility | VS Code, Figma, DevTools |
| DevOps Engineer | Azure (AKS, ACR, SQL), Kubernetes, Terraform, Docker, GitHub Actions | Helm, Istio, Prometheus | kubectl, Terraform, Azure CLI |
| QA Engineer | Playwright, xUnit, Jest, API testing, test automation | k6 load testing, security testing | Postman, Playwright, Azure Test Plans |
| UI/UX Designer | Figma, Adobe XD, responsive design, user research | Design systems, accessibility, prototyping | Figma, Miro, UsabilityHub |

---

## Development Environment Setup

### Local Development Requirements

**Hardware:**
- **CPU:** 4+ cores (Intel i5/i7 or AMD Ryzen 5/7)
- **RAM:** 16GB minimum, 32GB recommended
- **Disk:** 500GB SSD (for Docker images, databases, IDE)

**Software:**
- **OS:** Windows 11, macOS, or Ubuntu 22.04 LTS
- **Docker Desktop:** 4.25+ (for local Kubernetes, databases)
- **Node.js:** 20 LTS
- **.NET SDK:** 8.0
- **Git:** 2.40+
- **IDE:** Visual Studio 2022 or VS Code + extensions

### Environment Tiers

**1. Local Development**
- Docker Compose for local services (SQL Server, Redis)
- LocalStack for Azure service emulation (optional)
- Mock external APIs (LinkedIn, Teamified Accounts)
- Hot reload enabled for fast iteration

**2. Development (Shared)**
- Azure Dev/Test subscription
- Shared AKS cluster with namespace per developer
- Shared Azure SQL Database (dev tier)
- Continuous deployment from `develop` branch

**3. Staging (Pre-Production)**
- Production-like environment
- Manual deployment from `release/*` branches
- Full integration testing
- Performance and load testing

**4. Production**
- Manual deployment from `main` branch with approval gates
- Blue-green deployment strategy for zero-downtime
- Automated rollback on failure
- 24/7 monitoring and alerting

### Configuration Management

**Secrets Management:**
- **Local:** User secrets (.NET) + .env files (React) - NOT committed to Git
- **Azure:** Azure Key Vault for all environments (Dev, Staging, Prod)
- **CI/CD:** GitHub Secrets for deployment credentials

**Environment Variables:**
- `ASPNETCORE_ENVIRONMENT` (Development, Staging, Production)
- `REACT_APP_API_URL` (API base URL per environment)
- `AZURE_SQL_CONNECTION_STRING` (from Key Vault)
- `OPENAI_API_KEY` (from Key Vault)
- `TEAMIFIED_OAUTH_CLIENT_ID` (from Key Vault)

---

## DevOps & Deployment Strategy

### CI/CD Pipeline (GitHub Actions)

**Continuous Integration (CI) - On Pull Request:**
```yaml
name: CI Pipeline

on:
  pull_request:
    branches: [develop, main]

jobs:
  backend-test:
    runs-on: ubuntu-latest
    steps:
      - Checkout code
      - Setup .NET 8
      - Restore NuGet packages
      - Build solution
      - Run unit tests (xUnit)
      - Run integration tests
      - Code coverage report (Coverlet)
      - Upload coverage to Codecov

  frontend-test:
    runs-on: ubuntu-latest
    steps:
      - Checkout code
      - Setup Node.js 20
      - Install dependencies (pnpm)
      - Run ESLint
      - Run Prettier
      - Run unit tests (Jest)
      - Build production bundle

  security-scan:
    runs-on: ubuntu-latest
    steps:
      - Checkout code
      - Run Snyk security scan
      - Run OWASP dependency check
      - SonarQube code quality analysis
```

**Continuous Deployment (CD) - On Merge to Main:**
```yaml
name: CD Pipeline - Production

on:
  push:
    branches: [main]

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    steps:
      - Checkout code
      - Build Docker images (backend services, frontend)
      - Tag with version (semantic versioning)
      - Push to Azure Container Registry

  deploy-to-staging:
    needs: build-and-push
    runs-on: ubuntu-latest
    steps:
      - Deploy to AKS staging namespace (Helm upgrade)
      - Run smoke tests
      - Run E2E tests (Playwright)
      - Load test with k6

  deploy-to-production:
    needs: deploy-to-staging
    runs-on: ubuntu-latest
    environment: production
    steps:
      - Manual approval gate (required)
      - Blue-green deployment to production AKS
      - Health check on new deployment
      - Gradual traffic shift (0% → 25% → 50% → 100%)
      - Automatic rollback on failure
      - Notify team on Slack/Teams
```

### Deployment Strategy: Blue-Green with Canary

**Approach:**
1. **Blue (Current Production):** Serving 100% of traffic
2. **Green (New Deployment):** Deploy new version to parallel environment
3. **Smoke Tests:** Validate green deployment health
4. **Canary Traffic:** Route 10% traffic to green, monitor errors/latency
5. **Gradual Shift:** Increase to 25% → 50% → 100% over 30 minutes
6. **Rollback:** Automatic if error rate >1% or latency >2s
7. **Cleanup:** Decommission blue environment after 24 hours

**Tools:**
- **Istio Service Mesh:** Traffic splitting and routing
- **Prometheus + Grafana:** Real-time metrics monitoring
- **Azure Application Insights:** Error rate tracking

### Database Migration Strategy

**Approach:** Forward-only migrations with backward compatibility

**Tools:** Entity Framework Core Migrations

**Process:**
1. **Local:** Generate migration with `dotnet ef migrations add`
2. **Dev:** Auto-apply migrations on deployment
3. **Staging:** Manual migration review and approval
4. **Production:** Manual migration with backup and rollback plan

**Best Practices:**
- Never drop columns in production (mark as deprecated, remove in future release)
- Add new columns as nullable, populate data, then add NOT NULL constraint
- Test migrations on production-size dataset in staging

---

## Security & Compliance Implementation

### Authentication & Authorization

**OAuth 2.0 / OpenID Connect with Teamified Accounts:**
- **Token Expiry:** Access tokens (15 min), Refresh tokens (7 days)
- **Token Storage:** HttpOnly cookies (backend), memory storage (frontend)
- **PKCE:** Proof Key for Code Exchange for public clients
- **MFA:** Delegated to Teamified Accounts (no custom implementation)

**Role-Based Access Control (RBAC):**
- **Roles:** Admin, Recruiter Manager, Recruiter, Client, Candidate
- **Permissions:** Granular permissions per API endpoint
- **Claims-Based:** JWT claims for user roles and tenant context

### Data Protection

**Encryption:**
- **In-Transit:** TLS 1.3 for all API communication, HTTPS-only
- **At-Rest:** Azure SQL TDE (Transparent Data Encryption), Blob Storage encryption
- **Application-Level:** Sensitive fields (SSN, salary) encrypted with AES-256

**Data Retention:**
- **Active Candidates:** Indefinite (until manual deletion or GDPR request)
- **Archived Candidates:** 7 years (compliance requirement)
- **Audit Logs:** 10 years (SOX compliance)
- **Temporary Files:** 30 days (auto-delete with Blob Storage lifecycle policy)

**GDPR Compliance:**
- **Right to Access:** API endpoint for candidate data export (JSON)
- **Right to Erasure:** Hard delete workflow with cascade across all tables
- **Consent Management:** Explicit consent checkboxes in candidate portal
- **Data Portability:** Export to standard format (JSON, CSV)
- **Breach Notification:** Azure Security Center alerts, 72-hour notification SLA

### Vulnerability Management

**Static Application Security Testing (SAST):**
- **SonarQube:** Code quality and security vulnerabilities
- **Snyk:** Dependency vulnerability scanning
- **OWASP Dependency Check:** Known CVE detection

**Dynamic Application Security Testing (DAST):**
- **OWASP ZAP:** Automated penetration testing
- **Burp Suite:** Manual security testing (quarterly)

**Security Headers:**
- `Content-Security-Policy: default-src 'self'`
- `X-Frame-Options: DENY` (prevent clickjacking)
- `X-Content-Type-Options: nosniff`
- `Strict-Transport-Security: max-age=31536000`

---

## Cost Estimates & Budget Planning

### MVP Phase 1 (4-6 months) Cost Breakdown

**Personnel Costs (6-month estimate):**
- 2 Backend Engineers: $120k/year × 2 × 0.5 = **$120,000**
- 2 Frontend Engineers: $110k/year × 2 × 0.5 = **$110,000**
- 1 Full-Stack Engineer: $115k/year × 0.5 = **$57,500**
- 1 DevOps Engineer: $130k/year × 0.5 = **$65,000**
- 1 QA Engineer: $90k/year × 0.5 = **$45,000**
- 1 Engineering Manager: $150k/year × 0.5 = **$75,000**
- 0.5 UI/UX Designer: $100k/year × 0.5 × 0.5 = **$25,000**
- **Subtotal Personnel:** ~**$497,500**

**Azure Infrastructure Costs (6 months):**
- **AKS Cluster:** 3 nodes × Standard_D4s_v3 @ $140/month = $420/month × 6 = **$2,520**
- **Azure SQL Database:** Serverless (2-8 vCores) @ $300/month × 6 = **$1,800**
- **Azure Blob Storage:** 100GB hot tier @ $20/month × 6 = **$120**
- **Azure Cache for Redis:** Basic tier @ $15/month × 6 = **$90**
- **Azure Application Insights:** 10GB/month @ $50/month × 6 = **$300**
- **Azure Load Balancer:** Standard tier @ $30/month × 6 = **$180**
- **Azure Container Registry:** Standard tier @ $20/month × 6 = **$120**
- **Bandwidth:** 500GB/month @ $50/month × 6 = **$300**
- **Subtotal Azure:** ~**$5,430**

**Third-Party Services (6 months):**
- **OpenAI API:** 1M tokens/month @ $0.03/1k = $30/month × 6 = **$180**
- **LinkedIn Jobs API:** Basic tier (100 posts/month) @ $0 = **$0** (free tier)
- **GitHub:** Team plan @ $4/user × 10 × 6 = **$240**
- **Monitoring (Datadog/New Relic):** Optional, $150/month × 6 = **$900**
- **SSL Certificates:** Azure-managed (free) = **$0**
- **Subtotal Services:** ~**$1,320**

**Software Licenses & Tools (one-time + 6 months):**
- **Visual Studio Enterprise:** $250/month × 3 × 6 = **$4,500** (or use Community edition - free)
- **Figma Professional:** $15/user × 2 × 6 = **$180**
- **Postman Team:** $12/user × 5 × 6 = **$360**
- **Subtotal Tools:** ~**$5,040**

**Testing & Security (one-time):**
- **Load Testing (k6 Cloud):** $500
- **Security Audit (Penetration Testing):** $5,000
- **Accessibility Audit:** $2,000
- **Subtotal:** ~**$7,500**

**Contingency (10%):** ~**$51,700**

### Total MVP Budget: **$568,490** (approximately $250k-$400k depending on team size and location)

**Phase 2 (Months 5-8) Estimate:** +$350,000 (ML engineer, expanded team)  
**Phase 3 (Months 9-12) Estimate:** +$400,000 (ML infrastructure, optimization)

**Total Project Budget (12 months):** ~**$1.3M - $1.5M**

### Ongoing Operational Costs (Monthly, Post-Launch)

- **Azure Infrastructure:** $3,000/month (scales with usage)
- **OpenAI/Anthropic APIs:** $200-$1,000/month (depends on AI usage)
- **LinkedIn Jobs API:** $100/month (paid tier for higher limits)
- **Monitoring & Logging:** $300/month
- **Support & Maintenance:** 20% of development cost annually (~$100k/year or $8,300/month)

**Total Monthly OpEx:** ~**$12,000 - $15,000/month**

---

## Risk Management & Mitigation

### Technical Risks

| Risk | Likelihood | Impact | Mitigation Strategy |
|------|-----------|--------|---------------------|
| **LinkedIn API rate limits** | High | Medium | Implement intelligent caching, batch processing, polling optimization. Consider paid tier for higher limits. |
| **OpenAI API downtime** | Medium | High | Implement fallback to Anthropic Claude, cache AI-generated content, allow manual job description editing. |
| **Azure service outages** | Low | High | Multi-region deployment (Phase 3), comprehensive backup strategy, disaster recovery plan with 2-hour RTO. |
| **Database performance issues** | Medium | Medium | Regular performance tuning, query optimization, read replicas for analytics, caching layer (Redis). |
| **Kubernetes complexity** | Medium | Medium | Hire experienced DevOps engineer, use managed AKS, comprehensive monitoring, runbooks for common issues. |

### Integration Risks

| Risk | Likelihood | Impact | Mitigation Strategy |
|------|-----------|--------|---------------------|
| **Teamified Accounts API changes** | Low | High | Maintain abstraction layer, version API contracts, automated integration tests, communication with Teamified team. |
| **Team Connect API unavailable** | Medium | Medium | Build integration as optional feature, fallback to manual scheduling, alternative calendar integrations (Google/Outlook). |
| **External portal schema changes** | High | High | API versioning, backward compatibility, data validation layer, change notification process with portal team. |

### Timeline Risks

| Risk | Likelihood | Impact | Mitigation Strategy |
|------|-----------|--------|---------------------|
| **Scope creep** | High | High | Strict change control process, MVP discipline, dedicated product manager, regular stakeholder alignment. |
| **Underestimated complexity** | Medium | High | Add 20% buffer to estimates, bi-weekly sprint retrospectives, early prototyping of complex features. |
| **Resource unavailability** | Medium | Medium | Cross-training team members, documentation-first culture, knowledge sharing sessions. |

### Security Risks

| Risk | Likelihood | Impact | Mitigation Strategy |
|------|-----------|--------|---------------------|
| **Data breach** | Low | Critical | End-to-end encryption, regular security audits, penetration testing, Azure Security Center, incident response plan. |
| **GDPR non-compliance** | Medium | Critical | Legal review of data handling, explicit consent workflows, data deletion processes, privacy by design. |
| **Unauthorized access** | Medium | High | MFA enforcement, RBAC, audit logging, session timeout, IP whitelisting for admin. |

### Mitigation Best Practices

1. **Weekly Risk Review:** Engineering manager reviews top 5 risks in sprint planning
2. **Early Warning System:** Automated alerts for API errors, performance degradation, security events
3. **Contingency Budget:** 10-15% reserved for unforeseen issues
4. **Regular Stakeholder Updates:** Bi-weekly demos, monthly steering committee meetings
5. **Knowledge Transfer:** Pair programming, code reviews, documentation

---

## Success Metrics & KPIs

### MVP Success Criteria (Phase 1)

**Technical Metrics:**
- ✅ API response time <2 seconds (95th percentile)
- ✅ System uptime >99.5%
- ✅ Zero critical security vulnerabilities
- ✅ Code coverage >80%
- ✅ LinkedIn sync latency <5 minutes

**User Adoption Metrics:**
- ✅ 80%+ of users create jobs using AI job description generation
- ✅ 90%+ of jobs successfully posted to LinkedIn
- ✅ 70%+ of recruiters use accept/reject decision framework
- ✅ 50%+ of users access analytics dashboard weekly

**Business Metrics:**
- ✅ 15%+ reduction in time-to-hire vs manual processes
- ✅ 20%+ increase in job posting quality (measured by applicant volume)
- ✅ Net Promoter Score (NPS) >40 for AI features

---

## Appendix

### Technology Selection Rationale

**Why .NET Core over Node.js for Backend?**
- Enterprise-grade performance and type safety
- Better Azure integration and tooling
- Strong async/await support for external API calls
- Mature ecosystem for microservices (Dapr, Steeltoe)
- Easier debugging and profiling

**Why React over Angular/Vue?**
- Largest ecosystem and community
- Excellent TypeScript support
- Mature UI libraries (Material-UI, Ant Design)
- Better performance for complex dashboards
- Easier to find experienced developers

**Why Azure over AWS/GCP?**
- Best integration with .NET stack
- Unified security model (Azure AD, Key Vault)
- Excellent SQL Server hosting (Azure SQL)
- Strong Kubernetes support (AKS)
- Familiarity with existing team (if applicable)

**Why Kubernetes over Azure App Service?**
- Microservices architecture flexibility
- Better resource utilization and cost control
- Portable across cloud providers (avoid lock-in)
- Advanced traffic management (Istio, canary deployments)
- Future-proof for scale

### Recommended Learning Resources

**For Backend Engineers:**
- [Microsoft Learn: .NET Microservices Architecture](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/)
- [Azure Kubernetes Service Documentation](https://learn.microsoft.com/en-us/azure/aks/)
- [Entity Framework Core Best Practices](https://learn.microsoft.com/en-us/ef/core/)

**For Frontend Engineers:**
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [Redux Toolkit Official Tutorial](https://redux-toolkit.js.org/tutorials/overview)
- [Material-UI Documentation](https://mui.com/)

**For DevOps Engineers:**
- [Azure DevOps Labs](https://www.azuredevopslabs.com/)
- [Kubernetes Best Practices](https://kubernetes.io/docs/concepts/cluster-administration/)
- [Terraform Azure Provider](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs)

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-13 | Product Manager | Initial implementation guide creation with technical stack and phased roadmap |

---

**Next Steps:**
1. Review and approve technical stack with engineering leadership
2. Provision Azure development environment
3. Recruit and onboard development team
4. Conduct architecture review workshop
5. Begin Sprint 0 with infrastructure setup

For questions or clarifications, contact the Product Manager or Engineering Manager.
