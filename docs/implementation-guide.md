# Multi-Employment ATS System - Implementation Guide

**Document Version:** 2.0  
**Date:** November 13, 2025  
**Status:** Production-Ready - Updated for Node.js + Tailwind CSS Stack

## Executive Summary

This implementation guide provides a comprehensive roadmap for building the Multi-Employment ATS System, a sophisticated applicant tracking platform supporting diverse employment types (contract, part-time, full-time, EOR) with Azure-native architecture, AI-powered capabilities, and LinkedIn integration.

**Project Scope:** MVP delivery in 4-6 months with 7-9 person full-stack TypeScript development team  
**Estimated Budget:** $500,000 - $550,000 for MVP (Phase 1) - **12% cost savings vs .NET stack**  
**Technology Approach:** Azure-native cloud architecture with TypeScript microservices, React + Tailwind CSS frontend, Node.js + NestJS backend, PostgreSQL database  
**Design System:** Purple (#A16AE8) + Blue (#8096FD) color scheme with shadcn/ui components

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
- **UI Framework:** Tailwind CSS + shadcn/ui
  - Utility-first CSS framework for custom designs
  - Pre-built accessible components from shadcn/ui
  - **Brand Colors:** Purple (#A16AE8) + Blue (#8096FD)
  - Employment type color coding support
  - Mobile-responsive out of the box
  - Excellent customization flexibility
- **State Management:** Redux Toolkit + RTK Query or Zustand
  - Centralized state for complex workflows
  - Built-in caching for API calls
  - DevTools for debugging
  - Zustand as lightweight alternative for simpler state
- **Routing:** React Router v6 or TanStack Router
  - Nested routes for job detail pages
  - Protected routes for authentication
  - Type-safe routing with TanStack Router
- **Form Management:** React Hook Form + Zod
  - Type-safe form validation
  - Employment type-specific field validation
  - Seamless integration with shadcn/ui form components
- **Date/Time:** date-fns or Day.js
  - Timezone-aware scheduling for Team Connect integration
- **Rich Text Editor:** Tiptap or Lexical
  - AI-generated job description editing
  - LinkedIn formatting preview
  - Better Tailwind CSS integration than TinyMCE
- **PDF Viewer:** react-pdf or PDF.js
  - Resume viewing in candidate detail panel
- **Drag & Drop:** @dnd-kit
  - Pipeline stage customization
  - Candidate movement between stages
  - Excellent accessibility support

**Build Tools:**
- **Bundler:** Vite (faster than Webpack, excellent DX)
- **Package Manager:** pnpm (faster, disk-efficient)
- **Code Quality:** ESLint + Prettier + Husky (pre-commit hooks)
- **Tailwind Config:** Custom theme with purple/blue brand colors

### Backend Stack

#### Primary Framework: **Node.js 20 LTS + NestJS**
**Rationale:** Full-stack TypeScript consistency, excellent PostgreSQL support, rapid MVP delivery, perfect fit for Tailwind + shadcn/ui ecosystem

**Why Node.js + NestJS is Optimal:**
- ✅ **Full-Stack TypeScript:** Same language across frontend and backend reduces context switching
- ✅ **Faster MVP Delivery:** Rapid prototyping with NestJS CLI and TypeScript ecosystem
- ✅ **Team Efficiency:** Full-stack developers can work across entire stack (6-10 person team)
- ✅ **PostgreSQL Native Support:** Prisma ORM provides excellent type safety and developer experience
- ✅ **Azure-Ready:** Mature Azure SDK for JavaScript, excellent support for all Azure services
- ✅ **Tailwind Ecosystem Fit:** Better integration with React + Tailwind CSS + shadcn/ui stack

**Core Components:**

**API Layer:**
- **Framework:** NestJS 10+ (TypeScript-first, enterprise architecture)
- **API Documentation:** Swagger/OpenAPI with @nestjs/swagger decorators
- **API Gateway:** Azure API Management or custom NestJS gateway
- **Authentication:** Passport.js with custom SSO strategy (SSO provider under development)
- **Validation:** class-validator + class-transformer (built into NestJS)

**Service Architecture (Microservices):**
- **Job Management Service** - Job creation, approval workflows, LinkedIn sync
- **Candidate Service** - Candidate profiles, pipeline management, stage progression
- **AI Service** - Job description generation, interview questions, sentiment analysis
- **Notification Service** - Multi-channel notifications (email, in-app, future SMS/Slack)
- **Document Service** - Resume storage, document verification
- **Budget Service** - Employment type-specific budget calculations, approval workflows
- **Analytics Service** - Dashboard metrics, reporting, funnel visualization
- **Integration Service** - External portal API, LinkedIn API, Team Connect API

**Supporting Libraries:**
- **ORM:** Prisma 5+ (recommended) or TypeORM
  - Type-safe database client with auto-completion
  - Automatic TypeScript type generation from schema
  - Built-in migrations with Prisma Migrate
  - Excellent PostgreSQL support
- **Background Jobs:** Bull (Redis-based) or Azure Functions
  - Scheduled LinkedIn sync
  - Email batch processing
  - ML model training jobs
- **Caching:** ioredis client for Azure Cache for Redis
- **Logging:** Winston or Pino with Azure Application Insights integration
- **HTTP Client:** Axios with retry interceptors or native fetch with Undici
- **Message Queue:** @azure/service-bus SDK
  - Async candidate pipeline updates
  - Notification queuing
- **Testing:** Jest (unit tests) + Supertest (integration tests)

### Database & Storage

#### Primary Database: **Azure Database for PostgreSQL (Flexible Server)**
**Rationale:** Open-source, excellent Node.js/Prisma support, advanced JSON capabilities, cost-effective, battle-tested at scale

**Configuration:**
- **Tier:** Flexible Server (General Purpose)
- **Compute:** Burstable (B2s: 2 vCores) for dev, General Purpose (D4s: 4 vCores) for production
- **Storage:** 128GB initial, auto-grow enabled up to 16TB
- **High Availability:** Zone-redundant HA (99.99% SLA) for production
- **Backup:** Automated backups with 7-35 days retention, point-in-time restore
- **Version:** PostgreSQL 15 or 16 (latest stable)

**Schema Design:**
- **Multi-tenant:** TenantId column on all tables with row-level security (RLS policies)
- **Audit Tables:** Temporal tables using PostgreSQL triggers or application-level versioning
- **Indexing Strategy:** 
  - Composite B-tree indexes on (tenant_id, frequently_queried_columns)
  - GIN indexes for JSONB columns (candidate metadata, custom fields)
  - Partial indexes for common filters (e.g., WHERE status = 'active')
- **JSON Support:** JSONB columns for flexible employment type-specific fields
- **Full-Text Search:** PostgreSQL's built-in tsvector for resume and job description search

**Why PostgreSQL over Azure SQL:**
- ✅ **Better Prisma Support:** Prisma was built with PostgreSQL as first-class citizen
- ✅ **Advanced JSON:** Superior JSONB support for flexible schemas
- ✅ **Cost-Effective:** 30-40% lower cost than Azure SQL for same workload
- ✅ **Open Source:** No vendor lock-in, easier migration if needed
- ✅ **Full-Text Search:** Built-in tsvector without additional services
- ✅ **Node.js Ecosystem:** Better library support (pg, Prisma, TypeORM)

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
- **Node.js:** openai SDK (official) + @anthropic-ai/sdk (official)
- **Prompt Management:** LangChain.js or custom prompt templates with template literals
- **Cost Tracking:** Custom NestJS middleware logging token usage per request

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
1. **Build:** npm build (frontend + backend), Docker image creation
2. **Test:** Unit tests (Jest), integration tests (Supertest), E2E tests (Playwright)
3. **Security Scan:** SonarQube, Snyk, npm audit
4. **Deploy to Dev:** Auto-deploy on develop branch merge
5. **Deploy to Staging:** Manual approval gate
6. **Deploy to Production:** Manual approval + rollback capability

**Infrastructure as Code:**
- **Terraform:** Azure resource provisioning (AKS, PostgreSQL, Blob Storage, Redis)
- **Helm Charts:** Kubernetes application deployment
- **Azure Bicep:** Alternative to Terraform (Azure-native DSL)

#### Monitoring & Observability

**Application Monitoring:**
- **Azure Application Insights** (integrated with Node.js via applicationinsights SDK)
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

#### Authentication: **Custom SSO Provider (OAuth 2.0 / OIDC) - Under Development**
**SDK:** Passport.js (Node.js) + custom SSO strategy + oidc-client-ts (React)
**Flow:** Authorization Code Flow with PKCE
**Token Storage:** HttpOnly cookies (backend) + memory storage (frontend)
**Integration Strategy:**
- Build abstraction layer for SSO provider during development
- Implement OAuth 2.0 client with configurable endpoints
- Support standard OIDC discovery for future provider changes
- Fallback to local development auth for testing

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
- **Google Calendar:** googleapis npm package
- **Microsoft Graph:** @microsoft/microsoft-graph-client
- **iCal Generation:** ical-generator or node-ical libraries

#### External Candidate Portal
**Integration Type:** REST API + Webhooks
**Data Exchange:**
- Candidate profiles (JSON API)
- AI screening results (JSON API)
- Real-time status updates (webhooks)

**SDK:** Custom API client with retry logic and circuit breakers

### Security & Compliance Stack

**Authentication & Authorization:**
- **OAuth 2.0 / OpenID Connect:** Custom SSO provider integration (under development)
- **JWT Tokens:** Access tokens (15 min expiry), Refresh tokens (7 days)
- **MFA:** Delegated to SSO provider
- **RBAC:** Custom role-based access control (Recruiter, Manager, Client, Admin)
- **Implementation:** Passport.js with custom OAuth 2.0 strategy + @nestjs/passport

**Data Encryption:**
- **In-Transit:** TLS 1.3 for all API communication
- **At-Rest:** PostgreSQL Transparent Data Encryption (TDE) via Azure
- **Blob Storage:** Server-side encryption with Microsoft-managed keys
- **Secrets:** Azure Key Vault for API keys, connection strings
- **Column-Level:** pgcrypto extension for sensitive fields (SSN, salary)

**Compliance Tools:**
- **GDPR:** Azure Policy for data residency, custom data deletion workflows
- **Audit Logging:** PostgreSQL triggers + Azure Monitor logs
- **Data Anonymization:** @faker-js/faker for test data generation
- **Vulnerability Scanning:** Snyk, npm audit, Azure Security Center

**Security Headers:**
- **Helmet.js:** Security headers middleware for Express/NestJS
- Content Security Policy (CSP) with custom Tailwind CSS nonce
- CORS policies (whitelist approach)
- Rate limiting with @nestjs/throttler

### Testing Stack

**Unit Testing:**
- **Framework:** Jest (Node.js + React)
- **Mocking:** jest.mock + MSW (Mock Service Worker for React)
- **Coverage:** Jest built-in coverage with istanbul/nyc (80% minimum code coverage target)
- **Configuration:** jest.config.js with coverage thresholds for branches, functions, lines, statements

**Integration Testing:**
- **Framework:** Jest + Supertest (for NestJS APIs)
- **Database:** Testcontainers for PostgreSQL (Docker-based test DB)
- **API Testing:** Supertest for HTTP endpoint testing

**E2E Testing:**
- **Framework:** Playwright (cross-browser support, faster than Selenium)
- **Test Scenarios:** Critical user flows (job creation, candidate progression)

**Load Testing:**
- **Tool:** k6 or Azure Load Testing
- **Targets:** 1000 concurrent users, <2s API response time

### Recommended Development Tools

**IDEs:**
- **Full-Stack:** VS Code with extensions (ESLint, Prettier, TypeScript, Tailwind CSS IntelliSense)
- **Alternative:** JetBrains WebStorm for advanced TypeScript support

**API Testing:**
- **Postman** or **Insomnia** for manual API testing
- **Swagger UI** for auto-generated API documentation

**Database Management:**
- **pgAdmin** or **Azure Data Studio** (supports PostgreSQL)
- **Prisma Studio** for visual database browsing
- **Prisma Migrate** or **TypeORM Migrations** for schema versioning

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
│  │ PostgreSQL   │  │ Azure Blob   │  │ Azure Cache  │             │
│  │ (Azure DB    │  │ Storage      │  │ for Redis    │             │
│  │ Flexible)    │  │ (Documents)  │  │ (Caching)    │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
└─────────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    External Integrations                            │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │ Custom SSO   │  │ LinkedIn     │  │ Team Connect │             │
│  │ Provider     │  │ Jobs API     │  │ Scheduling   │             │
│  │ (OAuth OIDC) │  │              │  │              │             │
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
- `Users` - User profiles (synced from Custom SSO Provider)
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

**External Portal Integration Tables:**
- `PortalAssessments` - Assessment assignments and results
- `PortalInterviews` - Interview scheduling and confirmations
- `PortalDocumentRequests` - Document requests sent to portal
- `PortalActivityLog` - All portal interactions and timestamps
- `WebhookEvents` - Incoming webhook events from external portal
- `SyncQueue` - Queued sync operations with retry logic

---

## External Portal Integration Architecture

### Overview

The ATS system integrates bidirectionally with an **External Candidate Portal** where candidates complete assessments, upload documents, confirm interviews, and accept offers. This integration ensures real-time synchronization of candidate data between both systems.

### Integration Pattern

**Architecture Type:** Event-driven microservices with REST APIs + Webhooks

```
┌─────────────────────────────────────────────────────────────────────┐
│                        ATS System (Our System)                      │
│                                                                      │
│  ┌────────────────────┐         ┌────────────────────┐             │
│  │  Integration       │         │  Webhook Handler   │             │
│  │  Service           │◄────────│  Service           │             │
│  │  (Outbound)        │         │  (Inbound)         │             │
│  └────────────────────┘         └────────────────────┘             │
│           │                              ▲                          │
│           │ POST /api/v1/...            │ POST /webhooks/...       │
│           ▼                              │                          │
└───────────────────────────────────────────────────────────────────┘
            │                              │
            │ HTTPS (REST)                 │ HTTPS (Webhooks)
            ▼                              │
┌───────────────────────────────────────────────────────────────────┐
│                   External Candidate Portal API                    │
│                                                                     │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐      │
│  │  Assessments   │  │  Interviews    │  │  Documents     │      │
│  │  API           │  │  API           │  │  API           │      │
│  └────────────────┘  └────────────────┘  └────────────────┘      │
└───────────────────────────────────────────────────────────────────┘
```

### Data Flow Scenarios

#### 1. Assessment Assignment Flow

**ATS → Portal (Outbound):**
```typescript
// ATS Integration Service
POST https://candidate-portal.example.com/api/v1/assessments

Request:
{
  "candidate_id": "cand_12345",
  "assessment_type": "technical_javascript",
  "job_id": "job_67890",
  "due_date": "2025-11-20T23:59:59Z",
  "callback_url": "https://ats.example.com/webhooks/portal/assessment-completed",
  "metadata": {
    "ats_candidate_id": "uuid-here",
    "ats_job_id": "uuid-here"
  }
}

Response:
{
  "assessment_id": "assess_abc123",
  "candidate_portal_url": "https://portal.example.com/assessments/assess_abc123",
  "status": "pending",
  "created_at": "2025-11-13T10:00:00Z"
}
```

**Portal → ATS (Inbound Webhook):**
```typescript
// Webhook received when candidate completes assessment
POST https://ats.example.com/webhooks/portal/assessment-completed

Request:
{
  "event": "assessment.completed",
  "timestamp": "2025-11-14T14:30:00Z",
  "assessment_id": "assess_abc123",
  "candidate_id": "cand_12345",
  "results": {
    "score": 85,
    "time_taken_minutes": 45,
    "completed_at": "2025-11-14T14:30:00Z",
    "breakdown": {
      "code_quality": 90,
      "problem_solving": 80,
      "best_practices": 85
    }
  },
  "metadata": {
    "ats_candidate_id": "uuid-here",
    "ats_job_id": "uuid-here"
  },
  "signature": "sha256_hmac_signature_here"
}

Response (from ATS):
{
  "received": true,
  "processed_at": "2025-11-14T14:30:01Z"
}
```

#### 2. Interview Scheduling Flow

**ATS → Portal (Team Connect Integration):**
```typescript
// ATS creates interview via Team Connect, notifies portal
POST https://candidate-portal.example.com/api/v1/interviews

Request:
{
  "candidate_id": "cand_12345",
  "job_id": "job_67890",
  "interview_type": "technical",
  "proposed_slots": [
    {"start": "2025-11-15T14:00:00Z", "end": "2025-11-15T15:00:00Z"},
    {"start": "2025-11-16T10:00:00Z", "end": "2025-11-16T11:00:00Z"}
  ],
  "meeting_link": "https://zoom.us/j/123456789",
  "interviewers": ["Jane Smith", "Mike Johnson"],
  "callback_url": "https://ats.example.com/webhooks/portal/interview-confirmed"
}

Response:
{
  "interview_id": "int_xyz789",
  "status": "awaiting_confirmation",
  "candidate_portal_url": "https://portal.example.com/interviews/int_xyz789"
}
```

**Portal → ATS (Candidate Confirms):**
```typescript
POST https://ats.example.com/webhooks/portal/interview-confirmed

Request:
{
  "event": "interview.confirmed",
  "timestamp": "2025-11-13T09:15:00Z",
  "interview_id": "int_xyz789",
  "candidate_id": "cand_12345",
  "selected_slot": {
    "start": "2025-11-15T14:00:00Z",
    "end": "2025-11-15T15:00:00Z"
  },
  "status": "confirmed",
  "signature": "sha256_hmac_signature_here"
}
```

#### 3. Document Request Flow

**ATS → Portal:**
```typescript
POST https://candidate-portal.example.com/api/v1/document-requests

Request:
{
  "candidate_id": "cand_12345",
  "job_id": "job_67890",
  "documents_required": [
    {
      "type": "portfolio",
      "description": "Please upload your design portfolio",
      "required": true
    },
    {
      "type": "references",
      "description": "2-3 professional references",
      "required": true
    }
  ],
  "due_date": "2025-11-20T23:59:59Z",
  "callback_url": "https://ats.example.com/webhooks/portal/document-uploaded"
}
```

**Portal → ATS (Document Uploaded):**
```typescript
POST https://ats.example.com/webhooks/portal/document-uploaded

Request:
{
  "event": "document.uploaded",
  "timestamp": "2025-11-14T16:45:00Z",
  "candidate_id": "cand_12345",
  "document_type": "portfolio",
  "document": {
    "filename": "sarah_johnson_portfolio.pdf",
    "size_bytes": 1258291,
    "content_type": "application/pdf",
    "download_url": "https://portal.example.com/documents/download/doc_abc123?token=temp_token",
    "checksum_sha256": "abcdef123456..."
  },
  "signature": "sha256_hmac_signature_here"
}

// ATS downloads document from provided URL and stores in Azure Blob Storage
```

#### 4. Offer Acceptance Flow

**ATS → Portal:**
```typescript
POST https://candidate-portal.example.com/api/v1/offers

Request:
{
  "candidate_id": "cand_12345",
  "job_id": "job_67890",
  "offer_letter_url": "https://ats-blob.example.com/offers/offer_letter_123.pdf",
  "offer_details": {
    "position": "Senior Full-Stack Developer",
    "salary": "$120,000",
    "start_date": "2025-12-01",
    "employment_type": "full-time"
  },
  "requires_signature": true,
  "expiry_date": "2025-11-30T23:59:59Z",
  "callback_url": "https://ats.example.com/webhooks/portal/offer-accepted"
}
```

**Portal → ATS (Offer Decision):**
```typescript
POST https://ats.example.com/webhooks/portal/offer-accepted

Request:
{
  "event": "offer.accepted",
  "timestamp": "2025-11-16T11:20:00Z",
  "candidate_id": "cand_12345",
  "offer_id": "offer_123",
  "decision": "accepted",
  "signed_document_url": "https://portal.example.com/documents/signed/offer_123_signed.pdf",
  "signature_timestamp": "2025-11-16T11:19:45Z",
  "signature": "sha256_hmac_signature_here"
}
```

### API Design Specifications

#### Authentication

**Method:** API Key + HMAC Signature

```typescript
// Outbound requests (ATS → Portal)
headers: {
  'Authorization': 'Bearer API_KEY_FROM_PORTAL',
  'Content-Type': 'application/json',
  'X-ATS-Request-ID': 'unique-request-id',
  'X-ATS-Timestamp': '2025-11-13T10:00:00Z'
}

// Inbound webhooks (Portal → ATS)
// Verify HMAC signature in request body
function verifyWebhookSignature(payload: string, signature: string): boolean {
  const secret = process.env.PORTAL_WEBHOOK_SECRET;
  const computedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(computedSignature)
  );
}
```

#### Retry Logic

**Outbound Requests (ATS → Portal):**
```typescript
// Exponential backoff with max 5 retries
const retryConfig = {
  maxRetries: 5,
  baseDelay: 1000, // 1 second
  maxDelay: 60000, // 1 minute
  backoffFactor: 2
};

async function sendToPortalWithRetry(endpoint: string, data: any) {
  for (let attempt = 0; attempt < retryConfig.maxRetries; attempt++) {
    try {
      const response = await axios.post(endpoint, data, { timeout: 30000 });
      
      // Log success to SyncQueue table
      await db.syncQueue.update({
        status: 'completed',
        completed_at: new Date(),
        response: response.data
      });
      
      return response.data;
    } catch (error) {
      const delay = Math.min(
        retryConfig.baseDelay * Math.pow(retryConfig.backoffFactor, attempt),
        retryConfig.maxDelay
      );
      
      if (attempt < retryConfig.maxRetries - 1) {
        await sleep(delay);
        continue;
      }
      
      // Log failure to SyncQueue table
      await db.syncQueue.update({
        status: 'failed',
        error: error.message,
        retry_count: attempt + 1
      });
      
      throw error;
    }
  }
}
```

**Inbound Webhooks (Portal → ATS):**
```typescript
// Idempotency check using event ID
async function handleWebhook(req: Request, res: Response) {
  const eventId = req.body.event_id || req.headers['x-event-id'];
  
  // Check if already processed
  const existing = await db.webhookEvents.findOne({ event_id: eventId });
  if (existing) {
    return res.status(200).json({ received: true, duplicate: true });
  }
  
  // Verify signature
  if (!verifyWebhookSignature(req.rawBody, req.body.signature)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  // Store event for idempotency
  await db.webhookEvents.create({
    event_id: eventId,
    event_type: req.body.event,
    payload: req.body,
    received_at: new Date(),
    status: 'processing'
  });
  
  // Process webhook asynchronously
  processWebhookAsync(req.body);
  
  // Respond immediately (within 5 seconds)
  return res.status(200).json({ received: true, processed_at: new Date() });
}
```

### Database Schema for Portal Integration

```sql
-- Portal Assessments
CREATE TABLE portal_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES candidates(id),
  job_id UUID NOT NULL REFERENCES jobs(id),
  portal_assessment_id VARCHAR(255) NOT NULL UNIQUE,
  assessment_type VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL, -- pending, in_progress, completed, overdue
  score INTEGER,
  time_taken_minutes INTEGER,
  breakdown JSONB, -- Performance breakdown by category
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  portal_url TEXT,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Portal Interviews
CREATE TABLE portal_interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES candidates(id),
  job_id UUID NOT NULL REFERENCES jobs(id),
  portal_interview_id VARCHAR(255) NOT NULL UNIQUE,
  interview_type VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL, -- awaiting_confirmation, confirmed, rescheduled, declined, completed
  scheduled_start TIMESTAMPTZ,
  scheduled_end TIMESTAMPTZ,
  meeting_link TEXT,
  interviewers JSONB, -- Array of interviewer names
  candidate_confirmed_at TIMESTAMPTZ,
  portal_url TEXT,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Portal Document Requests
CREATE TABLE portal_document_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES candidates(id),
  job_id UUID NOT NULL REFERENCES jobs(id),
  portal_request_id VARCHAR(255) NOT NULL UNIQUE,
  document_type VARCHAR(100) NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL, -- pending, uploaded, overdue
  required BOOLEAN DEFAULT true,
  due_date TIMESTAMPTZ,
  uploaded_at TIMESTAMPTZ,
  document_id UUID REFERENCES documents(id), -- Link to uploaded document
  portal_url TEXT,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Portal Activity Log
CREATE TABLE portal_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES candidates(id),
  activity_type VARCHAR(100) NOT NULL, -- assessment_completed, interview_confirmed, document_uploaded, etc.
  description TEXT,
  metadata JSONB,
  occurred_at TIMESTAMPTZ NOT NULL,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Webhook Events (Idempotency)
CREATE TABLE webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id VARCHAR(255) NOT NULL UNIQUE, -- From external portal
  event_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  status VARCHAR(50) NOT NULL, -- processing, completed, failed
  error_message TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  INDEX idx_webhook_events_event_id (event_id),
  INDEX idx_webhook_events_event_type (event_type),
  INDEX idx_webhook_events_status (status)
);

-- Sync Queue (Retry Management)
CREATE TABLE sync_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(100) NOT NULL, -- assessment, interview, document, offer
  entity_id UUID NOT NULL,
  operation VARCHAR(50) NOT NULL, -- create, update, delete
  endpoint TEXT NOT NULL,
  payload JSONB NOT NULL,
  status VARCHAR(50) NOT NULL, -- pending, in_progress, completed, failed
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 5,
  last_error TEXT,
  next_retry_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  response JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  INDEX idx_sync_queue_status (status),
  INDEX idx_sync_queue_next_retry (next_retry_at) WHERE status = 'pending'
);
```

### Real-time Synchronization

**WebSocket Connection (Optional - Phase 2):**
```typescript
// For real-time updates without polling
import { io } from 'socket.io-client';

const socket = io('wss://candidate-portal.example.com', {
  auth: {
    token: process.env.PORTAL_API_KEY
  }
});

socket.on('candidate.activity', (data) => {
  // Real-time updates: assessment started, document uploaded, etc.
  updateCandidateActivityUI(data);
});
```

**Polling Fallback (MVP - Phase 1):**
```typescript
// Poll for updates every 5 minutes as fallback
setInterval(async () => {
  const pendingAssessments = await db.portalAssessments.find({
    status: 'pending',
    last_synced_at: { lt: new Date(Date.now() - 5 * 60 * 1000) }
  });
  
  for (const assessment of pendingAssessments) {
    const status = await fetchAssessmentStatus(assessment.portal_assessment_id);
    await updateAssessmentStatus(assessment.id, status);
  }
}, 5 * 60 * 1000);
```

### Error Handling

**Circuit Breaker Pattern:**
```typescript
import CircuitBreaker from 'opossum';

const circuitBreakerOptions = {
  timeout: 30000, // 30 seconds
  errorThresholdPercentage: 50,
  resetTimeout: 60000 // 1 minute
};

const portalApiCall = new CircuitBreaker(async (endpoint, data) => {
  return await axios.post(endpoint, data);
}, circuitBreakerOptions);

portalApiCall.on('open', () => {
  console.error('Circuit breaker opened - Portal API unavailable');
  // Alert operations team
});

portalApiCall.on('halfOpen', () => {
  console.info('Circuit breaker half-open - Testing Portal API');
});
```

### Security Considerations

1. **HMAC Signature Verification**: All webhook payloads must be signed
2. **API Key Rotation**: Keys rotated every 90 days
3. **TLS 1.3**: All communication encrypted
4. **Rate Limiting**: 1000 requests/minute per tenant
5. **IP Whitelisting**: Portal API IPs whitelisted in ATS firewall
6. **Request Timeout**: 30-second timeout on all outbound requests
7. **Data Validation**: Schema validation on all webhook payloads

### Monitoring & Observability

**Key Metrics:**
- Webhook processing time (target: < 500ms)
- Sync queue success rate (target: > 99%)
- API call latency (target: < 1 second p95)
- Failed webhooks requiring manual intervention
- Document download success rate

**Alerts:**
- Circuit breaker open for > 5 minutes
- Sync queue failures > 10 in 1 hour
- Webhook processing backlog > 100 events
- Assessment overdue notifications not sent

**Logging:**
```typescript
// Structured logging for all portal interactions
logger.info('Portal API call', {
  endpoint: '/api/v1/assessments',
  candidate_id: 'uuid',
  job_id: 'uuid',
  response_time_ms: 250,
  status_code: 200,
  request_id: 'req_123'
});
```

---

## Implementation Phases

### Phase 1: MVP Foundation (Months 1-4)

**Month 1: Infrastructure & Authentication**
- Azure resource provisioning (AKS, PostgreSQL Flexible Server, Blob Storage, Redis)
- Kubernetes cluster setup with Helm charts
- CI/CD pipeline configuration (GitHub Actions)
- Custom SSO provider OAuth 2.0 abstraction layer implementation
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
- ✅ Client dashboard and job detail interface (Tailwind CSS + shadcn/ui)
- ✅ Basic candidate management and stage progression
- ✅ Accept/reject decision frameworks
- ✅ Email notifications
- ✅ Custom SSO authentication (abstraction layer ready)

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
- Epic 1 Stories: 1.1 (Azure Infrastructure), 1.2 (Custom SSO Provider)
- AKS cluster provisioning with Terraform
- Azure Database for PostgreSQL Flexible Server and Blob Storage setup
- OAuth 2.0 abstraction layer for Custom SSO provider (with local auth fallback)
- RBAC implementation with Passport.js
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

2. **Full-Stack TypeScript Engineers (3-4)**
   - NestJS microservices development
   - React + Tailwind CSS UI development
   - API design and implementation
   - Database schema design with Prisma
   - Integration development (LinkedIn, Custom SSO, Team Connect)
   - **Time:** Full-time (100%)
   - **Skills:** TypeScript, Node.js, NestJS, React, Prisma, PostgreSQL, REST APIs, OAuth 2.0, Tailwind CSS

   **Note:** Full-stack TypeScript engineers are preferred over separate backend/frontend specialists to maximize team efficiency with a 6-10 person team. This reduces context switching and enables faster feature delivery.

6. **DevOps Engineer (1)**
   - Azure infrastructure management
   - CI/CD pipeline maintenance
   - Kubernetes cluster operations
   - PostgreSQL and Redis management
   - Monitoring and alerting setup
   - **Time:** Full-time (100%)
   - **Skills:** Azure, Kubernetes, Terraform, Docker, GitHub Actions, PostgreSQL, Node.js deployment

5. **QA Engineer (1)**
   - Test plan creation and execution
   - Automated test development (unit, integration, E2E)
   - Bug tracking and regression testing
   - Performance and load testing
   - **Time:** Full-time (100%)
   - **Skills:** Playwright, Jest, Supertest, API testing, test automation

**Extended Team (Part-time/Advisory):**

7. **UI/UX Designer (0.5 FTE)**
   - Dashboard and interface design (Tailwind CSS + shadcn/ui)
   - User flow optimization
   - Design system creation with purple (#A16AE8) + blue (#8096FD) brand colors
   - Usability testing
   - **Time:** Part-time (50%)
   - **Skills:** Figma, Tailwind CSS, shadcn/ui, responsive design

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

**Total Estimated Headcount:** 7-9 FTE for MVP (Phase 1)

**Note on Team Structure:** The recommended approach prioritizes full-stack TypeScript engineers over separate backend (.NET) and frontend (React) specialists. This organizational choice:
- Reduces context switching between languages (single TypeScript codebase)
- Enables faster feature delivery with end-to-end ownership
- Improves team velocity with smaller headcount (7-9 vs 8-10)
- Simplifies hiring (one job description vs multiple specializations)
- Better aligns with Tailwind CSS + shadcn/ui + Prisma TypeScript-first ecosystem

### Skill Requirements Matrix

| Role | Primary Skills | Nice-to-Have | Tools |
|------|---------------|--------------|-------|
| Full-Stack TypeScript Engineer | TypeScript, Node.js, NestJS, React 18, Prisma, PostgreSQL, REST APIs, OAuth 2.0, Tailwind CSS, shadcn/ui | Microservices, Event-driven architecture, Redis, Azure | VS Code, Postman, pgAdmin, Prisma Studio |
| DevOps Engineer | Azure (AKS, ACR, PostgreSQL), Kubernetes, Terraform, Docker, GitHub Actions | Helm, Istio, Prometheus, Node.js performance tuning | kubectl, Terraform, Azure CLI |
| QA Engineer | Playwright, Jest, Supertest, API testing, test automation, TypeScript | k6 load testing, security testing | Postman, Playwright, Jest |
| UI/UX Designer | Figma, Tailwind CSS, shadcn/ui, responsive design, user research | Design systems, accessibility, prototyping | Figma, Miro, UsabilityHub |

---

## Development Environment Setup

### Local Development Requirements

**Hardware:**
- **CPU:** 4+ cores (Intel i5/i7 or AMD Ryzen 5/7)
- **RAM:** 16GB minimum, 32GB recommended
- **Disk:** 500GB SSD (for Docker images, databases, IDE)

**Software:**
- **OS:** Windows 11, macOS, or Ubuntu 22.04 LTS
- **Docker Desktop:** 4.25+ (for local PostgreSQL, Redis, testing)
- **Node.js:** 20 LTS
- **pnpm:** 8+ (package manager)
- **Git:** 2.40+
- **IDE:** VS Code with extensions (ESLint, Prettier, TypeScript, Tailwind CSS IntelliSense, Prisma)

### Environment Tiers

**1. Local Development**
- Docker Compose for local services (PostgreSQL, Redis)
- LocalStack for Azure service emulation (optional)
- Mock external APIs (LinkedIn, Custom SSO)
- Hot reload enabled (Vite HMR for React, NestJS watch mode)

**2. Development (Shared)**
- Azure Dev/Test subscription
- Shared AKS cluster with namespace per developer
- Shared Azure Database for PostgreSQL (Burstable B2s tier)
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
- **Local:** .env files (NOT committed to Git) with dotenv package
- **Azure:** Azure Key Vault for all environments (Dev, Staging, Prod)
- **CI/CD:** GitHub Secrets for deployment credentials

**Environment Variables:**
- `NODE_ENV` (development, staging, production)
- `VITE_API_URL` (API base URL per environment for React)
- `DATABASE_URL` (PostgreSQL connection string from Key Vault)
- `REDIS_URL` (Redis connection string from Key Vault)
- `OPENAI_API_KEY` (from Key Vault)
- `SSO_CLIENT_ID` / `SSO_CLIENT_SECRET` (from Key Vault)

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

**Tools:** Prisma Migrate (recommended) or TypeORM Migrations

**Process:**
1. **Local:** Generate migration with `npx prisma migrate dev --name migration_name`
2. **Dev:** Auto-apply migrations on deployment with `prisma migrate deploy`
3. **Staging:** Manual migration review and approval
4. **Production:** Manual migration with backup and rollback plan

**Best Practices:**
- Never drop columns in production (mark as deprecated, remove in future release)
- Add new columns as nullable, populate data, then add NOT NULL constraint
- Test migrations on production-size dataset in staging
- Use `prisma migrate diff` to review changes before applying
- Always create backup before production migrations

---

## Security & Compliance Implementation

### Authentication & Authorization

**OAuth 2.0 / OpenID Connect with Custom SSO Provider:**
- **Token Expiry:** Access tokens (15 min), Refresh tokens (7 days)
- **Token Storage:** HttpOnly cookies (backend), memory storage (frontend)
- **PKCE:** Proof Key for Code Exchange for public clients
- **MFA:** Delegated to Custom SSO Provider (handled by SSO provider)
- **Implementation:** Passport.js with custom OAuth 2.0 strategy, abstraction layer for configurability

**Role-Based Access Control (RBAC):**
- **Roles:** Admin, Recruiter Manager, Recruiter, Client, Candidate
- **Permissions:** Granular permissions per API endpoint
- **Claims-Based:** JWT claims for user roles and tenant context

### Data Protection

**Encryption:**
- **In-Transit:** TLS 1.3 for all API communication, HTTPS-only
- **At-Rest:** PostgreSQL TDE (Transparent Data Encryption via Azure), Blob Storage encryption
- **Column-Level:** pgcrypto extension for sensitive fields (SSN, salary) with AES-256
- **Application-Level:** Additional encryption layer with crypto-js for highly sensitive data

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
- 3-4 Full-Stack TypeScript Engineers: $120k/year × 3.5 × 0.5 = **$210,000**
- 1 DevOps Engineer: $130k/year × 0.5 = **$65,000**
- 1 QA Engineer: $95k/year × 0.5 = **$47,500**
- 1 Engineering Manager: $150k/year × 0.5 = **$75,000**
- 0.5 UI/UX Designer: $105k/year × 0.5 × 0.5 = **$26,250**
- 0.25 Data Scientist/ML Engineer: $140k/year × 0.25 × 0.5 = **$17,500**
- **Subtotal Personnel:** ~**$441,250**

**Azure Infrastructure Costs (6 months):**
- **AKS Cluster:** 3 nodes × Standard_D4s_v3 @ $140/month = $420/month × 6 = **$2,520**
- **Azure Database for PostgreSQL:** Flexible Server (Burstable B2s) @ $180/month × 6 = **$1,080**
- **Azure Blob Storage:** 100GB hot tier @ $20/month × 6 = **$120**
- **Azure Cache for Redis:** Basic tier @ $15/month × 6 = **$90**
- **Azure Application Insights:** 10GB/month @ $50/month × 6 = **$300**
- **Azure Load Balancer:** Standard tier @ $30/month × 6 = **$180**
- **Azure Container Registry:** Standard tier @ $20/month × 6 = **$120**
- **Bandwidth:** 500GB/month @ $50/month × 6 = **$300**
- **Subtotal Azure:** ~**$4,710**

**Third-Party Services (6 months):**
- **OpenAI API:** 1M tokens/month @ $0.03/1k = $30/month × 6 = **$180**
- **LinkedIn Jobs API:** Basic tier (100 posts/month) @ $0 = **$0** (free tier)
- **GitHub:** Team plan @ $4/user × 10 × 6 = **$240**
- **Monitoring (Datadog/New Relic):** Optional, $150/month × 6 = **$900**
- **SSL Certificates:** Azure-managed (free) = **$0**
- **Subtotal Services:** ~**$1,320**

**Software Licenses & Tools (one-time + 6 months):**
- **VS Code:** Free (open source)
- **Figma Professional:** $15/user × 2 × 6 = **$180**
- **Postman Team:** $12/user × 5 × 6 = **$360**
- **GitHub Team:** $4/user × 8 × 6 = **$192**
- **Subtotal Tools:** ~**$732**

**Testing & Security (one-time):**
- **Load Testing (k6 Cloud):** $500
- **Security Audit (Penetration Testing):** $5,000
- **Accessibility Audit:** $2,000
- **Subtotal:** ~**$7,500**

**Contingency (10%):** ~**$45,700**

### Total MVP Budget: **$502,692** (~$500k-$550k depending on team size and location)

**Cost Savings vs .NET Stack:** ~$66k (12% reduction) due to:
- Smaller team (7-9 vs 8-10 FTE)
- No Visual Studio Enterprise licenses ($4,500 saved)
- Lower PostgreSQL costs vs Azure SQL ($720 saved)
- Full-stack engineers reduce coordination overhead

**Phase 2 (Months 5-8) Estimate:** +$320,000 (ML engineer, expanded team - lower than .NET estimate)  
**Phase 3 (Months 9-12) Estimate:** +$370,000 (ML infrastructure, optimization - lower than .NET estimate)

**Total Project Budget (12 months):** ~**$1.19M - $1.24M** (12% savings vs .NET stack estimate of $1.3M-$1.5M)

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
| **Custom SSO Provider API changes** | Medium | High | Maintain abstraction layer, version API contracts, automated integration tests, OIDC discovery endpoint support for dynamic updates. |
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

**Why Node.js + NestJS over .NET for Backend?**
- Full-stack TypeScript consistency (same language frontend and backend)
- Faster MVP delivery with smaller team (6-10 people)
- Better PostgreSQL ecosystem (Prisma, TypeORM, node-postgres)
- Excellent Tailwind CSS + shadcn/ui integration
- Easier to hire full-stack TypeScript developers
- Enterprise-grade with NestJS architecture (similar to .NET structure)
- Mature Azure SDK for JavaScript

**Why React over Angular/Vue?**
- Largest ecosystem and community
- Excellent TypeScript support
- Tailwind CSS + shadcn/ui are React-first
- Better performance for complex dashboards
- Easier to find experienced developers

**Why Tailwind CSS + shadcn/ui over Material-UI?**
- Custom branding with purple (#A16AE8) + blue (#8096FD) color scheme
- Utility-first approach for faster development
- Smaller bundle size (only used utilities)
- Better design flexibility and customization
- shadcn/ui provides accessible, headless components
- No opinionated design system to override

**Why PostgreSQL over Azure SQL?**
- Better Prisma/TypeORM support (built for PostgreSQL)
- Superior JSONB support for flexible schemas
- 30-40% lower cost for same workload
- Open-source, no vendor lock-in
- Built-in full-text search (tsvector)
- Better Node.js ecosystem integration

**Why Azure over AWS/GCP?**
- Excellent PostgreSQL hosting (Azure Database for PostgreSQL)
- Unified security model (Azure AD, Key Vault)
- Strong Kubernetes support (AKS)
- Mature Node.js SDK (@azure/*)
- Cost-effective for startups

**Why Kubernetes over Azure App Service?**
- Microservices architecture flexibility
- Better resource utilization and cost control
- Portable across cloud providers (avoid lock-in)
- Advanced traffic management (Istio, canary deployments)
- Future-proof for scale

### Tailwind CSS Configuration Example

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand Colors
        primary: {
          DEFAULT: '#A16AE8', // Purple
          50: '#F5F0FF',
          100: '#EBE2FF',
          200: '#D6C5FF',
          300: '#C2A8FF',
          400: '#AD8BFF',
          500: '#A16AE8', // Primary Purple
          600: '#8B4FD9',
          700: '#7335CA',
          800: '#5B1CB6',
          900: '#430397',
        },
        secondary: {
          DEFAULT: '#8096FD', // Blue
          50: '#F0F3FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A4BBFE',
          400: '#8096FD', // Secondary Blue
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
        },
        // Employment Type Colors
        contract: '#FF6B6B',
        parttime: '#4ECDC4',
        fulltime: '#45B7D1',
        eor: '#FFA07A',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
```

### shadcn/ui Components Setup

```bash
# Initialize shadcn/ui
npx shadcn-ui@latest init

# Add commonly used components
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add form
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add select
npx shadcn-ui@latest add table
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add toast
```

### Recommended Learning Resources

**For Full-Stack Engineers:**
- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma Quickstart](https://www.prisma.io/docs/getting-started/quickstart)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Azure SDK for JavaScript](https://learn.microsoft.com/en-us/javascript/api/overview/azure/)

**For Frontend Engineers:**
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Redux Toolkit Official Tutorial](https://redux-toolkit.js.org/tutorials/overview)

**For Backend Engineers:**
- [NestJS Microservices](https://docs.nestjs.com/microservices/basics)
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)
- [PostgreSQL Performance Tuning](https://www.postgresql.org/docs/current/performance-tips.html)

**For DevOps Engineers:**
- [Azure Kubernetes Service Documentation](https://learn.microsoft.com/en-us/azure/aks/)
- [Kubernetes Best Practices](https://kubernetes.io/docs/concepts/cluster-administration/)
- [Terraform Azure Provider](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 2.0 | 2025-11-13 | Product Manager | **Major Stack Update:** Node.js + NestJS backend (from .NET), Tailwind CSS + shadcn/ui frontend (from Material-UI), PostgreSQL (from Azure SQL), Custom SSO provider (from Teamified Accounts), Purple/Blue brand colors, Full-stack TypeScript team structure, Updated cost estimates (~$66k savings) |
| 1.0 | 2025-11-13 | Product Manager | Initial implementation guide creation with technical stack and phased roadmap |

---

**Next Steps:**
1. Review and approve technical stack with engineering leadership
2. Provision Azure development environment
3. Recruit and onboard development team
4. Conduct architecture review workshop
5. Begin Sprint 0 with infrastructure setup

For questions or clarifications, contact the Product Manager or Engineering Manager.
