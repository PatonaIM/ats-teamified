# Epic 2: External Portal Integration & Candidate Processing

## Epic Goal
Implement comprehensive external portal integration to receive AI screening results and candidate data while establishing robust candidate pipeline management with accept/reject decision workflows. This epic enables the core candidate processing capabilities that distinguish the ATS system's hybrid architecture approach.

## Priority
**Phase 1 - MVP Foundation** (Portal integration deferred to Phase 2, Pipeline management in MVP)

## Key Deliverables
- External portal API integration with webhooks (Phase 2)
- Bidirectional candidate data synchronization (Phase 2)
- Configurable 6-stage pipeline (Screening → Shortlist → Client Endorsement → Client Interview → Offer → Offer Accepted)
- Accept/reject decision framework with audit trails
- Candidate pipeline progression engine
- Client position dashboard with pipeline visualization
- Job detail page with split-screen candidate management

## User Stories

### Story 2.1: External Portal API Integration *[Phase 2]*

**As a** system integrator,  
**I want** robust API integration with the external portal system,  
**so that** candidate data and AI screening results flow seamlessly into the ATS pipeline.

#### Acceptance Criteria
1. External portal API client implemented with authentication, error handling, and retry mechanisms
2. Candidate data import endpoints implemented receiving complete candidate profiles from external portal
3. AI screening results import functionality implemented with score interpretation and status mapping
4. Real-time webhook integration implemented for immediate candidate status updates from external portal
5. Data transformation layer implemented converting external portal data to ATS data models
6. Integration error handling implemented with logging, alerting, and recovery procedures
7. Candidate data validation implemented ensuring data integrity and completeness requirements
8. Integration health monitoring implemented with status dashboards and performance metrics

---

### Story 2.2: Pipeline Stage Configuration System **[MVP]**

**As a** client administrator,  
**I want** to configure custom pipeline stages and assessment criteria,  
**so that** candidates are evaluated according to our specific hiring requirements.

#### Acceptance Criteria
1. Pipeline configuration interface implemented with drag-and-drop stage arrangement capabilities
2. Stage type library implemented including assessment, interview, review, and custom stage types
3. Assessment integration configuration implemented allowing third-party assessment platform connections
4. Pass/fail threshold configuration implemented for automated stage progression decisions
5. Custom stage criteria definition implemented with flexible rule-based evaluation options
6. Pipeline template system implemented for reusable configurations across similar job types
7. Stage dependency management implemented ensuring logical stage progression requirements
8. Pipeline preview functionality implemented showing candidate journey visualization

---

### Story 2.3: Accept/Reject Decision Framework **[MVP]**

**As a** recruiter,  
**I want** clear accept/reject decision options at every pipeline stage,  
**so that** candidates progress definitively through the hiring process or are removed.

#### Acceptance Criteria
1. Binary decision interface implemented with prominent accept/reject buttons for all stages
2. Rejection reason categorization implemented with required reason selection for audit trails
3. Decision confirmation workflows implemented preventing accidental candidate rejections
4. Irreversible rejection enforcement implemented ensuring rejected candidates cannot re-enter pipeline
5. Decision maker tracking implemented recording user, timestamp, and justification for all decisions
6. Bulk decision capabilities implemented for efficiency in high-volume candidate processing
7. Decision audit reporting implemented for compliance and process improvement analysis
8. Decision notification system implemented alerting stakeholders of stage progression and rejections

---

### Story 2.4: Candidate Pipeline Progression Engine **[MVP]**

**As a** candidate,  
**I want** visibility into my application status and clear next steps,  
**so that** I understand my progress and can take required actions.

#### Acceptance Criteria
1. Pipeline progression logic implemented automatically advancing candidates upon accept decisions
2. Stage completion tracking implemented showing candidate current status and progression history
3. Candidate portal status updates implemented reflecting real-time pipeline changes
4. Next action identification implemented showing candidates required tasks and deadlines
5. Pipeline bottleneck detection implemented alerting recruiters to stalled candidate progressions
6. Stage duration tracking implemented for process optimization and SLA monitoring
7. Candidate communication triggers implemented for status change notifications
8. Pipeline analytics implemented showing stage conversion rates and timing metrics

---

### Story 2.5: Candidate Data Integration & Synchronization *[Phase 2]*

**As a** data manager,  
**I want** comprehensive candidate data synchronization between external portal and ATS,  
**so that** all candidate information remains consistent and accessible.

#### Acceptance Criteria
1. Bidirectional data synchronization implemented maintaining data consistency across systems
2. Candidate profile merge functionality implemented combining external portal and ATS data
3. Document synchronization implemented ensuring all candidate documents available in both systems
4. Assessment results integration implemented linking external and internal assessment data
5. Communication history synchronization implemented providing complete candidate interaction records
6. Data conflict resolution implemented handling discrepancies between system data
7. Sync status monitoring implemented with error detection and recovery procedures
8. Data archival and retention implemented according to compliance and privacy requirements

---

### Story 2.6: Client Position Dashboard **[MVP - FR18]**

**As a** client or recruiter,  
**I want** to see all my open job positions with pipeline stage visualization and candidate counts,  
**so that** I can quickly assess hiring progress and identify positions requiring attention.

#### Acceptance Criteria
1. Dashboard interface implemented displaying all open job positions in card or table view with employment type indicators
2. Real-time pipeline stage visualization implemented showing default stages (Screening → Shortlist → Client Endorsement → Client Interview → Offer → Offer Accepted) with customized stages where configured
3. Candidate count metrics implemented displaying number of candidates per stage for each job position
4. Employment type filtering implemented allowing view filtering by contract, part-time, full-time, or EOR positions
5. Pipeline health indicators implemented showing time-in-stage metrics, accept/reject ratios, and bottleneck alerts
6. Quick access to job detail views implemented via click-through navigation from dashboard job cards
7. Sorting and search functionality implemented allowing organization by posting date, candidate count, employment type, or job title
8. Stage-specific candidate counts displayed with visual progress bars showing distribution across pipeline stages
9. Urgent action indicators implemented highlighting positions with stalled candidates or pending decisions
10. Dashboard refresh implemented with real-time updates as candidates move through stages

**Technical Dependencies:** Supports FR18 (Client Dashboard Interface) with real-time data aggregation from candidate pipeline tables, stage configuration data, and decision tracking systems.

---

### Story 2.7: Job Detail & Candidate Management Interface **[MVP - FR19]**

**As a** recruiter or hiring manager,  
**I want** a comprehensive job detail page with split-screen candidate management,  
**so that** I can efficiently review candidates and make progression decisions without losing context.

#### Acceptance Criteria
1. Split-screen interface layout implemented with distinct left sidebar (stages/candidates) and right sidebar (candidate details) sections
2. Short job info header implemented displaying job title, employment type, posting date, active candidate count, and key metrics on main page
3. Long job info popup/modal implemented with complete job description, requirements, benefits, LinkedIn posting details, and edit job button
4. Left sidebar pipeline stages list implemented with drag-and-drop stage navigation showing stage names and candidate counts per stage
5. Candidate list under each stage implemented displaying candidate cards with name, photo, key qualifications, and current status
6. Stage-specific candidate filtering implemented allowing quick view of candidates in selected pipeline stage
7. Right sidebar candidate details panel implemented with tabbed sections for resume viewer, application history timeline, assessment results, interview notes, and document verification status
8. Resume viewer implemented with inline PDF/document display, highlighting of key qualifications, and download capability
9. Application history timeline implemented showing all candidate movements, decisions, communications, and timestamps
10. Prominent action buttons implemented in right sidebar: "Move to Next Stage" (green) and "Disqualify" (red) with decision confirmation workflows
11. Decision confirmation modals implemented requiring reason selection for disqualification decisions with rejection reason categorization
12. Automatic stage progression implemented moving candidate to next configured stage upon "Move to Next Stage" action with audit trail recording
13. Bulk candidate selection implemented allowing multi-candidate decision workflows for efficiency
14. Keyboard shortcuts implemented for power users (Enter to accept, R to reject, Arrow keys for candidate navigation)
15. Context preservation implemented ensuring job and stage context maintained during candidate review workflow

**Technical Dependencies:** Supports FR19 (Job Detail Page Layout) and integrates with FR6 (Accept/Reject Decision Framework), FR11 (Audit Trails), and Story 2.3 (Decision Framework).

**UI/UX Notes:** Interface follows progressive disclosure principles with essential information visible by default and detailed data accessible through expandable sections. Color coding by employment type (contract=blue, part-time=green, full-time=orange, EOR=purple) applied throughout interface for instant context recognition.

---

## Technical Dependencies
- Node.js + NestJS backend with microservices architecture
- PostgreSQL database with Prisma ORM
- React + Vite + Tailwind CSS + shadcn/ui frontend
- External Candidate Portal API (Phase 2)
- Webhook infrastructure for real-time updates (Phase 2)
- Azure Blob Storage for document synchronization
- HMAC SHA-256 signature verification for webhooks

## Database Schema
**Core Tables:**
- `jobs` - Job postings with employment types
- `job_pipeline_stages` - Customizable pipeline stages per job
- `candidates` - Candidate profiles
- `candidate_pipeline_status` - Current stage tracking
- `decisions` - Accept/reject decisions with audit trail

**External Portal Integration Tables (Phase 2):**
- `portal_assessments` - Assessment assignments and results
- `portal_interviews` - Interview scheduling and confirmations
- `portal_document_requests` - Document requests sent to portal
- `portal_activity_log` - All portal interactions
- `webhook_events` - Incoming webhook events (idempotency)
- `sync_queue` - Queued sync operations with retry logic

## Success Metrics
- 99%+ data synchronization accuracy (Phase 2)
- <2 second pipeline stage updates
- 95%+ accept/reject decision audit trail completeness
- Real-time dashboard updates within 5 seconds
- Zero rejected candidates re-entering pipeline

## Related Functional Requirements
- FR3: External Portal Integration for AI Screening Results (Phase 2)
- FR5: Configurable Pipeline Stages
- FR6: Accept/Reject Decision Framework [MVP]
- FR11: Audit Trails & Data Integrity
- FR17: Team Connect Integration
- FR18: Client Dashboard UI [MVP]
- FR19: Job Detail Page Layout [MVP]

## Notes
**MVP Focus:** Prioritize pipeline configuration, decision framework, and client dashboards. External portal integration deferred to Phase 2 to focus on core hiring workflow first. All screening data initially enters via manual recruiter input until portal integration is complete.
