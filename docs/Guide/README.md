# ATS System Guides

Welcome to the comprehensive guide collection for the Applicant Tracking System (ATS). These documents provide detailed information about system architecture, workflows, testing procedures, and implementation details.

---

## 📚 Available Guides

### 🔄 Substage & Workflow Guides

#### [Substage Transition Guide](SUBSTAGE_TRANSITION_GUIDE.md)
**Complete reference for all pipeline substages and transition mechanisms**

- All 9 stages with 5 substages each (45 total substages)
- Transition triggers (automatic, semi-automatic, manual)
- Data indicators that determine transitions
- Implementation code examples
- Database schema recommendations
- API endpoint documentation

**Use this guide when:**
- Understanding how substages progress
- Implementing transition automation
- Debugging substage issues
- Planning new stage workflows

---

#### [End-to-End Testing Guide](END_TO_END_TESTING_GUIDE.md)
**Step-by-step testing procedures for the complete candidate journey**

- Viewing substages on candidate cards
- Testing interview scheduling workflows
- Sending and tracking assessments
- Complete candidate journey (all 9 stages)
- Substage transition testing
- Client endorsement flow
- Troubleshooting common issues

**Use this guide when:**
- Testing new features
- Validating substage functionality
- Training new team members
- Quality assurance testing
- Demonstrating system capabilities

---

### 📋 Product & Planning Documents

#### [brief.md](brief.md)
High-level project overview and objectives

#### [prd.md](prd.md)
Product Requirements Document - Detailed feature specifications

#### [implementation-guide.md](implementation-guide.md)
Technical implementation guidelines and best practices

---

### 🏗️ Architecture & Integration

#### [DATABASE_SCHEMA_ANALYSIS.md](DATABASE_SCHEMA_ANALYSIS.md)
Complete database schema documentation with relationships and constraints

#### [EXTERNAL_PORTAL_API.md](EXTERNAL_PORTAL_API.md)
External API integration specifications and endpoints

#### [EXTERNAL_PORTAL_INTEGRATION_ARCHITECTURE.md](EXTERNAL_PORTAL_INTEGRATION_ARCHITECTURE.md)
Architecture for external portal integration

---

### 📊 Pipeline & Workflow

#### [CANDIDATE_PIPELINE_COMPLETE_GUIDE.md](CANDIDATE_PIPELINE_COMPLETE_GUIDE.md)
Complete candidate pipeline documentation

#### [DYNAMIC_STAGE_ADVANCEMENT.md](DYNAMIC_STAGE_ADVANCEMENT.md)
Dynamic stage progression rules and logic

#### [WORKFLOW_BUILDER_UI_GUIDE.md](WORKFLOW_BUILDER_UI_GUIDE.md)
User interface guide for the workflow builder feature

#### [USER_STORY_CUSTOMIZABLE_WORKFLOW_BUILDER.md](USER_STORY_CUSTOMIZABLE_WORKFLOW_BUILDER.md)
User story and requirements for customizable workflow builder

---

### 📅 Interview Scheduling

#### [interview-scheduling-setup.md](interview-scheduling-setup.md)
Setup guide for interview scheduling features

#### [user-stories-interview-scheduling.md](user-stories-interview-scheduling.md)
User stories and requirements for interview scheduling

---

### 🎨 UI & Design

#### [ui-specifications.md](ui-specifications.md)
User interface specifications and design guidelines

---

## 🚀 Quick Start

### For New Team Members

1. **Start with**: [brief.md](brief.md) - Understand project goals
2. **Read**: [prd.md](prd.md) - Learn feature requirements
3. **Study**: [Substage Transition Guide](SUBSTAGE_TRANSITION_GUIDE.md) - Understand core workflow
4. **Practice**: [End-to-End Testing Guide](END_TO_END_TESTING_GUIDE.md) - Hands-on testing

### For Developers

1. **Architecture**: [DATABASE_SCHEMA_ANALYSIS.md](DATABASE_SCHEMA_ANALYSIS.md)
2. **Implementation**: [implementation-guide.md](implementation-guide.md)
3. **Substages**: [Substage Transition Guide](SUBSTAGE_TRANSITION_GUIDE.md)
4. **Testing**: [End-to-End Testing Guide](END_TO_END_TESTING_GUIDE.md)

### For QA/Testing

1. **Testing Guide**: [End-to-End Testing Guide](END_TO_END_TESTING_GUIDE.md)
2. **Workflows**: [Substage Transition Guide](SUBSTAGE_TRANSITION_GUIDE.md)
3. **UI Specs**: [ui-specifications.md](ui-specifications.md)

### For Product Managers

1. **Requirements**: [prd.md](prd.md)
2. **User Stories**: [user-stories-interview-scheduling.md](user-stories-interview-scheduling.md)
3. **Workflow Builder**: [USER_STORY_CUSTOMIZABLE_WORKFLOW_BUILDER.md](USER_STORY_CUSTOMIZABLE_WORKFLOW_BUILDER.md)

---

## 🔑 Key Concepts

### Pipeline Stages
The ATS uses 9 main pipeline stages:
1. **Screening** - Initial application review
2. **Shortlist** - Qualified candidates
3. **Technical Assessment** - Skills testing
4. **Human Interview** - Recruiter interviews
5. **Final Interview** - Executive interviews
6. **AI Interview** - Automated screening
7. **Offer** - Offer generation and negotiation
8. **Client Endorsement** - Client approval
9. **Offer Accepted** - Onboarding process

### Substages
Each stage has 5 substages that track detailed progress:
- **Total Substages**: 45 (9 stages × 5 substages)
- **Visual Progress**: Mini progress bars on candidate cards
- **Gradient Design**: Purple → Blue gradient fill
- **Auto-Transitions**: Time-based and event-based updates
- **Manual Control**: Recruiter can override when needed

### Key Features

#### Interview Scheduling
- Recruiter creates available time slots
- Candidates self-book via public link
- Automatic substage updates
- Email confirmations and reminders
- Calendar integration (.ics files)

#### Assessment Management
- Send technical/behavioral assessments
- Track completion status via substages
- Auto-scoring and manual review
- Auto-advance on passing score
- Third-party platform integration

#### Substage Tracking
- Real-time progress visualization
- 5-segment progress bars
- Current substage labels
- Percentage completion
- Transition history logging

---

## 📖 Document Organization

```
docs/Guide/
├── README.md (this file)
│
├── Core Workflow Guides
│   ├── SUBSTAGE_TRANSITION_GUIDE.md
│   └── END_TO_END_TESTING_GUIDE.md
│
├── Product Documentation
│   ├── brief.md
│   ├── prd.md
│   └── implementation-guide.md
│
├── Technical Architecture
│   ├── DATABASE_SCHEMA_ANALYSIS.md
│   ├── EXTERNAL_PORTAL_API.md
│   └── EXTERNAL_PORTAL_INTEGRATION_ARCHITECTURE.md
│
├── Feature-Specific Guides
│   ├── CANDIDATE_PIPELINE_COMPLETE_GUIDE.md
│   ├── DYNAMIC_STAGE_ADVANCEMENT.md
│   ├── WORKFLOW_BUILDER_UI_GUIDE.md
│   ├── USER_STORY_CUSTOMIZABLE_WORKFLOW_BUILDER.md
│   ├── interview-scheduling-setup.md
│   └── user-stories-interview-scheduling.md
│
└── Design & UI
    └── ui-specifications.md
```

---

## 🔧 Common Tasks

### How to Test Interview Scheduling
→ See [End-to-End Testing Guide - Part 2](END_TO_END_TESTING_GUIDE.md#part-2-testing-interview-scheduling)

### How to Send Assessments
→ See [End-to-End Testing Guide - Part 3](END_TO_END_TESTING_GUIDE.md#part-3-sending-and-testing-assessments)

### How Substages Transition
→ See [Substage Transition Guide](SUBSTAGE_TRANSITION_GUIDE.md#automation-mechanisms)

### How to Add New Substages
→ See [Substage Transition Guide - Database Schema](SUBSTAGE_TRANSITION_GUIDE.md#database-schema-additions)

### How to Configure Workflows
→ See [Workflow Builder UI Guide](WORKFLOW_BUILDER_UI_GUIDE.md)

### Understanding Database Schema
→ See [Database Schema Analysis](DATABASE_SCHEMA_ANALYSIS.md)

---

## 🎯 System Highlights

### Visual Progress Tracking
- **Mini progress bars** on every candidate card
- **5-segment design** representing 5 substages
- **Gradient aesthetics** (purple → blue)
- **Always visible** with proper loading states
- **Real-time updates** when substages change

### Automated Workflows
- **Time-based transitions**: Interviews start/end automatically
- **Event-based transitions**: Bookings, submissions trigger updates
- **Manual overrides**: Recruiters can adjust as needed
- **Audit trail**: All transitions logged for compliance

### Smart Integration
- **Interview scheduling**: Self-service booking for candidates
- **Assessment platforms**: Codility, HackerRank integration
- **Email notifications**: Invitations, confirmations, reminders
- **Calendar sync**: .ics file generation (Google/Outlook ready)

---

## 📞 Support & Contribution

### Need Help?
- Check the appropriate guide above
- Review the [Troubleshooting section](END_TO_END_TESTING_GUIDE.md#troubleshooting)
- Search the codebase for specific implementations

### Want to Contribute?
- Follow [implementation-guide.md](implementation-guide.md)
- Update guides when adding features
- Test using [End-to-End Testing Guide](END_TO_END_TESTING_GUIDE.md)

---

## 📅 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Nov 20, 2025 | Initial guide collection created |
| | | - Substage Transition Guide added |
| | | - End-to-End Testing Guide added |
| | | - All existing docs organized |

---

**Last Updated**: November 20, 2025  
**Maintained By**: ATS Development Team
