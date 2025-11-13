# Multi-Employment ATS System - Technical Documentation Repository

## Overview
This repository contains comprehensive technical documentation for a Multi-Employment ATS (Applicant Tracking System) designed to manage diverse employment types (contract, part-time, full-time, EOR) with Azure-native architecture, LinkedIn integration, external portal processing, AI-powered features, and comprehensive compliance capabilities.

## Project Type
**Technical Documentation & Specifications** - This is a documentation repository containing detailed system requirements, product specifications, and architectural guidelines for building a sophisticated multi-employment ATS platform.

## Key Documentation Files

### Primary Documentation
- **docs/brief.md**: Complete system requirements brief with detailed technical specifications, workflow descriptions, feature requirements, and integration details
- **docs/prd.md**: Product Requirements Document (PRD) with functional/non-functional requirements, epic structure, user stories, and comprehensive acceptance criteria
- **server.py**: Simple HTTP server for browsing documentation in Replit environment

### System Capabilities Documented

#### Core Features
- Multi-employment type job management (contract, part-time, full-time, EOR)
- LinkedIn Jobs API integration with bidirectional synchronization
- External portal integration for AI-powered candidate screening
- Configurable pipeline stages with accept/reject decision workflows
- Comprehensive document verification (OCR, government databases, blockchain)
- Budget approval processes with employment type-specific calculations
- Intelligent multi-channel notification system

#### AI-Powered Features (Recently Added)
- **Sentiment Analysis & Candidate Engagement Intelligence**: Real-time monitoring of candidate engagement through communication patterns, portal activity, and predictive analytics for competing offer detection
- **AI-Powered Interview Question Generation**: Role-specific, resume-based question generation with bias detection, historical performance optimization, and live interview assistance

## Architecture
The documented system uses Azure-native architecture with:
- **Database**: Azure SQL Database (Serverless) with multi-tenant support
- **Storage**: Azure Blob Storage with lifecycle management
- **Compute**: Azure Kubernetes Service (AKS) with auto-scaling
- **AI/ML**: OpenAI GPT-4/Anthropic Claude for LLM, custom ML models for predictions
- **Authentication**: Teamified Accounts integration via OAuth 2.0/OpenID Connect
- **Monitoring**: Azure Monitor, Log Analytics, Application Insights

## Recent Changes
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

## AI Features Technical Specifications

### Sentiment Analysis (FR16.1, Story 5.6)
- **Purpose**: Monitor candidate engagement to detect declining interest and competing offers
- **Key Metrics**: Engagement score 0-100 based on response times, sentiment, portal activity
- **Alerts**: Automated warnings at <70 (warning) and <50 (critical) engagement levels
- **Tech Stack**: OpenAI/Anthropic NLP, time-series analysis, behavioral ML models
- **Performance**: <2s response time, 80%+ prediction accuracy, $0.10-0.50 per candidate

### Interview Question Generation (FR16.2, Story 3.7)
- **Purpose**: Generate optimized, bias-free interview questions tailored to roles and candidates
- **Features**: Employment type templates, resume-based customization, live follow-up suggestions
- **Optimization**: ML tracking of question effectiveness requiring 50+ successful hires per role
- **Tech Stack**: GPT-4/Claude for generation, NLP for resume parsing, XGBoost for effectiveness scoring
- **Performance**: <2s response time, 70%+ effectiveness accuracy, $0.10-0.50 per interview prep

## Recommended Next Steps (from Architect Review)
1. **Latency Validation**: Test real-world LLM response times to confirm <2s targets are achievable
2. **Data Readiness Assessment**: Verify availability of 50-100 completed hires and 6+ months historical data
3. **AI Cost Monitoring Plan**: Establish token budgets, caching strategies, and fallback tiers to maintain $0.10-0.50 cost range

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
