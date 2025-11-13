# ATS System Epics

This directory contains detailed epic documentation for the Multi-Employment ATS System, organized by functional area and development phase.

## Epic Overview

### Phase 1 - MVP Foundation (Months 1-6)

| Epic | Priority | Key Deliverables | Status |
|------|----------|------------------|--------|
| **[Epic 1: Foundation & Core Infrastructure](./epic-1-foundation-core-infrastructure.md)** | **MVP** | Authentication, Job Management, AI Job Descriptions, LinkedIn Integration | Planning |
| **[Epic 2: External Portal Integration](./epic-2-external-portal-integration.md)** | **MVP** (Partial) | Pipeline Configuration, Accept/Reject Framework, Client Dashboard, Job Detail Page | Planning |
| **[Epic 3: Assessment, Interview & Document Verification](./epic-3-assessment-interview-document-verification.md)** | **MVP** (AI Questions Only) | AI Interview Question Generation (Simplified) | Planning |
| **[Epic 6: Analytics, Reporting & System Optimization](./epic-6-analytics-reporting-optimization.md)** | **MVP** (Descriptive) | Hiring Funnel Analytics, Performance Metrics, Pipeline Health Monitoring | Planning |

### Phase 2 - Advanced Features (Months 7-10)

| Epic | Priority | Key Deliverables | Status |
|------|----------|------------------|--------|
| **[Epic 2: External Portal Integration](./epic-2-external-portal-integration.md)** | **Phase 2** (Portal) | External Portal API, Webhooks, Bidirectional Sync, Assessment Integration | Planning |
| **[Epic 3: Assessment, Interview & Document Verification](./epic-3-assessment-interview-document-verification.md)** | **Phase 2** (Full) | Assessment Platform, Document Verification, Interview Scheduling, AI Enhancements | Planning |
| **[Epic 4: Budget Approval & Employment Type Workflows](./epic-4-budget-approval-employment-workflows.md)** | **Phase 2** | Budget Calculations, Approval Workflows, Financial Analytics | Planning |
| **[Epic 5: Candidate Experience & Notification Platform](./epic-5-candidate-experience-notification.md)** | **Phase 2** (Full) | Candidate Portal, Multi-Channel Notifications, Full Sentiment Analysis | Planning |
| **[Epic 6: Analytics, Reporting & System Optimization](./epic-6-analytics-reporting-optimization.md)** | **Phase 2** (Predictive) | Predictive Analytics, Custom Reports, System Performance Monitoring | Planning |

### Phase 3 - Enterprise Enhancements (Months 11-14)

- Multi-tenant white-label branding
- Advanced ML model optimization
- Additional third-party integrations

---

## Epic Descriptions

### Epic 1: Foundation & Core Infrastructure
**Goal:** Establish foundational ATS system with authentication, job management, AI-powered job description generation, and LinkedIn integration.

**Key Features:**
- Custom SSO Provider OAuth 2.0/OpenID Connect integration
- Role-based job approval workflows
- AI job description generation (GPT-4/Claude)
- LinkedIn Jobs API bidirectional sync
- Basic candidate profile management

**Stories:** 1.1 - 1.8  
**Duration:** 4 months  
**Team:** 7-9 FTE

---

### Epic 2: External Portal Integration & Candidate Processing
**Goal:** Implement candidate pipeline management with external portal integration for assessments, interviews, and documents.

**Key Features:**
- **MVP:** Configurable 6-stage pipeline, accept/reject decisions, client dashboard, job detail page
- **Phase 2:** External portal webhooks, assessment/interview/document sync, bidirectional data flow

**Stories:** 2.1 - 2.7  
**Duration:** 2 months (MVP), 3 months (Phase 2)  
**Team:** 5-7 FTE

---

### Epic 3: Assessment, Interview & Document Verification Systems
**Goal:** Build comprehensive evaluation platform with AI-powered interview questions, assessments, and document verification.

**Key Features:**
- **MVP:** AI interview question generation (employment type templates + resume matching)
- **Phase 2:** Full assessment platform, document verification (OCR, blockchain), interview scheduling (Team Connect)

**Stories:** 3.1 - 3.7  
**Duration:** 1 month (MVP), 4 months (Phase 2)  
**Team:** 4-6 FTE

---

### Epic 4: Budget Approval & Employment Type Workflows
**Goal:** Implement employment type-specific budget calculations and multi-level approval workflows.

**Key Features:**
- Employment type budget calculators (contract, part-time, full-time, EOR)
- Evidence-based approval documentation
- Budget monitoring and forecasting
- Workflow optimization by employment type

**Stories:** 4.1 - 4.5  
**Duration:** 3 months (Phase 2)  
**Team:** 3-5 FTE

---

### Epic 5: Candidate Experience & Notification Platform
**Goal:** Deliver exceptional candidate experience with multi-channel notifications and sentiment analysis.

**Key Features:**
- **MVP:** Email notifications, in-app alerts, basic engagement scoring (email response time)
- **Phase 2:** Candidate portal, SMS/Slack/Teams, NLP sentiment analysis, competing offer detection

**Stories:** 5.1 - 5.6  
**Duration:** 1 month (MVP), 3 months (Phase 2)  
**Team:** 4-6 FTE

---

### Epic 6: Analytics, Reporting & System Optimization
**Goal:** Create comprehensive analytics platform with descriptive and predictive capabilities.

**Key Features:**
- **MVP:** Hiring funnel visualization, conversion rates, time-to-hire, source effectiveness
- **Phase 2:** Predictive analytics, custom report builder, financial analytics, compliance reporting

**Stories:** 6.1 - 6.5  
**Duration:** 2 months (MVP), 3 months (Phase 2)  
**Team:** 3-5 FTE

---

## MVP Strategy: AI-Powered Differentiation

The MVP prioritizes **AI-assisted hiring capabilities** as the core competitive advantage:

### MVP AI Features (Phase 1)
1. **AI Job Description Generation** - GPT-4/Claude prompt-based generation
2. **AI Interview Question Generation** - Employment type templates + resume matching
3. **Sentiment Analysis** - Email response time tracking with basic engagement scoring
4. **Analytics Dashboards** - Descriptive metrics (funnel, conversions, time-to-hire)

### Phase 2 ML Enhancements
- NLP sentiment analysis with 80%+ accuracy
- Historical interview question effectiveness tracking
- Competing offer detection via pattern recognition
- Predictive analytics (hiring forecasts, candidate success predictions)

**Data Requirements:** Phase 2 ML features require 50-200 completed hires for training data. MVP focuses on data collection infrastructure.

---

## Technology Stack

**Backend:**
- Node.js + NestJS (TypeScript)
- PostgreSQL (Azure Database for PostgreSQL Flexible Server)
- Prisma ORM
- Redis (Azure Cache for Redis)

**Frontend:**
- React + Vite
- Tailwind CSS + shadcn/ui
- TypeScript

**AI/ML:**
- OpenAI GPT-4 / Anthropic Claude (LLM)
- Custom ML models for predictions (Phase 2)

**Infrastructure:**
- Azure Kubernetes Service (AKS)
- Azure Blob Storage
- Azure Monitor + Application Insights
- GitHub Actions (CI/CD)

**Integrations:**
- Custom SSO Provider (OAuth 2.0/OIDC)
- LinkedIn Jobs API
- Team Connect (Interview Scheduling - Phase 2)
- External Candidate Portal (Phase 2)

---

## Epic Dependencies

```
Epic 1 (Foundation)
    ↓
Epic 2 (Pipeline - MVP) + Epic 3 (AI Questions - MVP) + Epic 6 (Analytics - MVP)
    ↓
Epic 2 (Portal - Phase 2) ← Enables → Epic 5 (Full Sentiment - Phase 2)
    ↓
Epic 3 (Full - Phase 2) + Epic 4 (Phase 2) + Epic 6 (Predictive - Phase 2)
```

**Critical Path:** Epic 1 → Epic 2 (MVP) → Epic 2 (Portal) → Epic 5 (Full Sentiment)

---

## Success Metrics

### MVP (Phase 1)
- ✅ Functional job posting with AI descriptions
- ✅ LinkedIn integration operational
- ✅ 6-stage candidate pipeline configured
- ✅ Accept/reject decisions with audit trails
- ✅ AI interview questions generated
- ✅ Basic engagement scoring (email response time)
- ✅ Hiring funnel analytics dashboard

### Phase 2
- ✅ External portal integration complete
- ✅ NLP sentiment analysis 80%+ accuracy
- ✅ Assessment platform operational
- ✅ Document verification automated
- ✅ Multi-channel notifications active
- ✅ Predictive analytics models trained
- ✅ Budget approval workflows implemented

---

## Related Documentation

- **[Product Requirements Document (PRD)](../prd.md)** - Complete functional requirements
- **[System Requirements Brief](../brief.md)** - Detailed feature specifications
- **[Implementation Guide](../implementation-guide.md)** - Technical architecture and roadmap
- **[UI Specifications](../ui-specifications.md)** - Design system and wireframes

---

## Epic Status Legend

- **Planning** - Requirements defined, not yet started
- **In Progress** - Active development
- **In Review** - Development complete, testing in progress
- **Complete** - Deployed to production
- **Blocked** - Waiting on dependencies or decisions

---

*Last Updated: November 13, 2025*
