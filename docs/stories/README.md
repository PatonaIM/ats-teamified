# User Stories

This directory contains detailed user story documentation for all 38 stories across 6 epics of the Multi-Employment ATS System.

## Story Organization

Stories are organized by Epic number and ID (e.g., `story-1.3-core-job-management.md`). Each story document includes:

- **User Story Statement** - "As a [role], I want [feature], so that [benefit]"
- **Acceptance Criteria** - Detailed, testable requirements
- **Technical Dependencies** - Required technologies, APIs, and services
- **Related Requirements** - Cross-references to PRD functional requirements
- **MVP/Phase 2 Scope** - Clear delineation of what's in MVP vs Phase 2
- **Database Schema** - Data models and tables
- **Notes** - Implementation guidance and priorities

---

## Stories by Epic

### Epic 1: Foundation & Core Infrastructure (8 stories)
**Priority:** Phase 1 - MVP Foundation

| Story ID | Title | Priority | Estimate |
|----------|-------|----------|----------|
| [1.1](./story-1.1-project-foundation-dev-environment.md) | Project Foundation & Development Environment | MVP | 2 weeks |
| [1.2](./story-1.2-authentication-user-management.md) | Authentication & User Management System | MVP | 2 weeks |
| [1.3](./story-1.3-core-job-management.md) | Core Job Management System ⭐ | **MVP** | 3 weeks |
| [1.4](./story-1.4-job-approval-workflow.md) | Job Approval Workflow Management | MVP | 2 weeks |
| [1.5](./story-1.5-ai-job-description-generation.md) | AI-Powered Job Description Generation ⭐ | **MVP** | 2 weeks |
| [1.6](./story-1.6-linkedin-integration.md) | LinkedIn Integration Foundation | MVP | 2 weeks |
| [1.7](./story-1.7-candidate-profile-management.md) | Basic Candidate Profile Management | MVP | 1 week |
| [1.8](./story-1.8-ai-decision-support.md) | AI-Powered Decision Support System | MVP | 2 weeks |

**Total Estimate:** 16 weeks (4 months)

---

### Epic 2: External Portal Integration & Candidate Processing (7 stories)
**Priority:** Phase 1 - MVP (Partial), Phase 2 (Portal Integration)

| Story ID | Title | Priority | Estimate |
|----------|-------|----------|----------|
| [2.1](./story-2.1-external-portal-api-integration.md) | External Portal API Integration | Phase 2 | 3 weeks |
| [2.2](./story-2.2-pipeline-stage-configuration.md) | Pipeline Stage Configuration System ⭐ | **MVP** | 2 weeks |
| [2.3](./story-2.3-accept-reject-decision-framework.md) | Accept/Reject Decision Framework ⭐ | **MVP** | 2 weeks |
| [2.4](./story-2.4-candidate-pipeline-progression.md) | Candidate Pipeline Progression Engine ⭐ | **MVP** | 2 weeks |
| [2.5](./story-2.5-candidate-data-synchronization.md) | Candidate Data Integration & Synchronization | Phase 2 | 3 weeks |
| [2.6](./story-2.6-client-position-dashboard.md) | Client Position Dashboard ⭐ | **MVP** | 2 weeks |
| [2.7](./story-2.7-job-detail-candidate-management.md) | Job Detail & Candidate Management Interface ⭐ | **MVP** | 3 weeks |

**MVP Estimate:** 11 weeks (2.5 months)  
**Phase 2 Estimate:** 6 weeks

---

### Epic 3: Assessment, Interview & Document Verification Systems (7 stories)
**Priority:** Phase 1 - MVP (AI Questions), Phase 2 (Full Platform)

| Story ID | Title | Priority | Estimate |
|----------|-------|----------|----------|
| [3.1](./story-3.1-configurable-assessment-platform.md) | Configurable Assessment Platform | Phase 2 | 3 weeks |
| [3.2](./story-3.2-assessment-execution-candidate-experience.md) | Assessment Execution & Candidate Experience | Phase 2 | 3 weeks |
| [3.3](./story-3.3-document-verification-infrastructure.md) | Document Verification Infrastructure | Phase 2 | 4 weeks |
| [3.4](./story-3.4-manual-document-review.md) | Manual Document Review Workflow | Phase 2 | 2 weeks |
| [3.5](./story-3.5-compliance-verification-reporting.md) | Compliance & Verification Reporting | Phase 2 | 2 weeks |
| [3.6](./story-3.6-interview-scheduling-management.md) | Interview Scheduling & Management System | Phase 2 | 3 weeks |
| [3.7](./story-3.7-ai-interview-question-generation.md) | AI-Powered Interview Question Generation ⭐ | **MVP** | 2 weeks |

**MVP Estimate:** 2 weeks  
**Phase 2 Estimate:** 17 weeks (4 months)

---

### Epic 4: Budget Approval & Employment Type Workflows (5 stories)
**Priority:** Phase 2 - Advanced Features

| Story ID | Title | Priority | Estimate |
|----------|-------|----------|----------|
| [4.1](./story-4.1-employment-type-budget-calculation.md) | Employment Type-Specific Budget Calculation | Phase 2 | 2 weeks |
| [4.2](./story-4.2-evidence-based-approval-documentation.md) | Evidence-Based Approval Documentation | Phase 2 | 2 weeks |
| [4.3](./story-4.3-approval-workflow-management.md) | Approval Workflow Management | Phase 2 | 2 weeks |
| [4.4](./story-4.4-budget-monitoring-tracking.md) | Budget Monitoring & Tracking | Phase 2 | 2 weeks |
| [4.5](./story-4.5-employment-type-workflow-optimization.md) | Employment Type Workflow Optimization | Phase 2 | 2 weeks |

**Total Estimate:** 10 weeks (2.5 months) - Phase 2 Only

---

### Epic 5: Candidate Experience & Notification Platform (6 stories)
**Priority:** Phase 1 - MVP (Email + Sentiment), Phase 2 (Full Portal)

| Story ID | Title | Priority | Estimate |
|----------|-------|----------|----------|
| [5.1](./story-5.1-candidate-portal-interface.md) | Candidate Portal Interface Development | Phase 2 | 3 weeks |
| [5.2](./story-5.2-interactive-candidate-actions.md) | Interactive Candidate Actions & Self-Service | Phase 2 | 3 weeks |
| [5.3](./story-5.3-multi-channel-notification-infrastructure.md) | Multi-Channel Notification Infrastructure ⭐ | **MVP** (Email) | 1 week (MVP) |
| [5.4](./story-5.4-intelligent-notification-logic.md) | Intelligent Notification Logic & Behavioral Optimization | Phase 2 | 3 weeks |
| [5.5](./story-5.5-candidate-engagement-analytics.md) | Candidate Engagement & Experience Analytics | Phase 2 | 2 weeks |
| [5.6](./story-5.6-sentiment-analysis-engagement-intelligence.md) | Sentiment Analysis & Candidate Engagement Intelligence ⭐ | **MVP** (Simplified) | 1 week (MVP) |

**MVP Estimate:** 2 weeks  
**Phase 2 Estimate:** 13 weeks (3 months)

---

### Epic 6: Analytics, Reporting & System Optimization (5 stories)
**Priority:** Phase 1 - MVP (Descriptive), Phase 2 (Predictive)

| Story ID | Title | Priority | Estimate |
|----------|-------|----------|----------|
| [6.1](./story-6.1-hiring-funnel-analytics.md) | Hiring Funnel Analytics & Performance Metrics ⭐ | **MVP** (Descriptive) | 2 weeks (MVP) |
| [6.2](./story-6.2-budget-financial-analytics.md) | Budget & Financial Analytics | Phase 2 | 2 weeks |
| [6.3](./story-6.3-customizable-reporting-dashboard.md) | Customizable Reporting & Dashboard System | Phase 2 | 3 weeks |
| [6.4](./story-6.4-system-performance-optimization.md) | System Performance & Optimization Analytics | Phase 2 | 2 weeks |
| [6.5](./story-6.5-compliance-audit-reporting.md) | Compliance & Audit Reporting | Phase 2 | 2 weeks |

**MVP Estimate:** 2 weeks  
**Phase 2 Estimate:** 9 weeks (2 months)

---

## MVP vs Phase 2 Summary

### Phase 1 - MVP Foundation (21 stories, ~6 months)

**Epic 1 - Foundation (8 stories, 16 weeks):**
- Complete project setup and infrastructure
- Authentication with Custom SSO Provider
- Job management with AI job descriptions ⭐
- LinkedIn integration
- Basic candidate profiles

**Epic 2 - Pipeline Management (5 stories, 11 weeks):**
- Pipeline stage configuration ⭐
- Accept/reject decision framework ⭐
- Client dashboard ⭐
- Job detail page ⭐

**Epic 3 - AI Interview Questions (1 story, 2 weeks):**
- Employment type question templates ⭐
- Resume-based customization

**Epic 5 - Basic Notifications (2 stories, 2 weeks):**
- Email + in-app notifications ⭐
- Basic sentiment analysis (email response time) ⭐

**Epic 6 - Descriptive Analytics (1 story, 2 weeks):**
- Hiring funnel visualization ⭐
- Conversion rates and time-to-hire metrics

**Total MVP:** ~33 weeks (7-8 months with buffer)

---

### Phase 2 - Advanced Features (17 stories, ~10 months)

**Epic 2 - External Portal (2 stories, 6 weeks):**
- Portal API integration
- Bidirectional data sync

**Epic 3 - Full Assessment Platform (6 stories, 17 weeks):**
- Assessment platform
- Document verification (Azure Cognitive Services)
- Interview scheduling (Team Connect)
- Compliance reporting

**Epic 4 - Budget Workflows (5 stories, 10 weeks):**
- Employment type budgets
- Multi-level approval chains
- Financial analytics

**Epic 5 - Full Candidate Portal (4 stories, 13 weeks):**
- Candidate portal interface
- Self-service actions
- Multi-channel notifications (SMS, Slack, Teams)
- Full NLP sentiment analysis

**Epic 6 - Predictive Analytics (4 stories, 9 weeks):**
- Predictive hiring forecasts
- Custom report builder
- System performance monitoring
- Compliance automation

**Total Phase 2:** ~55 weeks (13-14 months with buffer)

---

## Story Priorities

### ⭐ Critical MVP Stories (11 stories)
These stories MUST be completed for MVP launch:

1. **Story 1.3** - Core Job Management System
2. **Story 1.5** - AI Job Description Generation
3. **Story 2.2** - Pipeline Stage Configuration
4. **Story 2.3** - Accept/Reject Decision Framework
5. **Story 2.4** - Candidate Pipeline Progression
6. **Story 2.6** - Client Position Dashboard
7. **Story 2.7** - Job Detail & Candidate Management
8. **Story 3.7** - AI Interview Question Generation
9. **Story 5.3** - Email + In-App Notifications
10. **Story 5.6** - Basic Sentiment Analysis
11. **Story 6.1** - Hiring Funnel Analytics

---

## Technology Stack by Story

### Backend (Node.js + NestJS)
- All 38 stories use NestJS microservices architecture
- PostgreSQL with Prisma ORM for all data persistence
- Redis for caching and real-time features

### Frontend (React + Vite)
- All UI stories use React + Vite + TypeScript
- Tailwind CSS + shadcn/ui for all components
- Responsive design for all interfaces

### AI/ML
- **Stories 1.5, 3.7** - OpenAI GPT-4 / Anthropic Claude (MVP)
- **Stories 5.6, 6.1** - Basic ML in MVP, advanced ML in Phase 2

### Azure Services
- **Story 1.1** - AKS, PostgreSQL Flexible Server, Blob Storage
- **Story 3.3** - Azure Cognitive Services (OCR, Form Recognizer)
- **Story 6.4** - Azure Monitor, Application Insights

### Third-Party Integrations
- **Story 1.2** - Custom SSO Provider (OAuth 2.0/OIDC)
- **Story 1.6** - LinkedIn Jobs API
- **Story 2.1** - External Candidate Portal API (Phase 2)
- **Story 3.6** - Team Connect, Zoom, Teams, Meet (Phase 2)
- **Story 5.3** - SendGrid/AWS SES (MVP), Twilio (Phase 2)

---

## Related Documentation

- **[Epic Documentation](../epics/)** - High-level epic overviews
- **[Product Requirements Document (PRD)](../prd.md)** - Functional requirements
- **[System Requirements Brief](../brief.md)** - Detailed specifications
- **[Implementation Guide](../implementation-guide.md)** - Technical architecture
- **[UI Specifications](../ui-specifications.md)** - Design system

---

## Story Naming Convention

```
story-[epic].[number]-[slug].md

Examples:
- story-1.1-project-foundation-dev-environment.md
- story-2.6-client-position-dashboard.md
- story-3.7-ai-interview-question-generation.md
```

---

## Status Tracking

Use labels in your project management tool:
- `mvp` - Must complete for MVP launch
- `phase-2` - Deferred to Phase 2
- `ai-powered` - Includes AI/ML capabilities
- `portal-dependent` - Requires candidate portal operational
- `data-dependent` - Requires historical data for ML training

---

*Last Updated: November 13, 2025*  
*Total Stories: 38*  
*MVP Stories: 21*  
*Phase 2 Stories: 17*
