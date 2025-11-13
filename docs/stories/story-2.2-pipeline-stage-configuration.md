# Story 2.2: Pipeline Stage Configuration System **[MVP]**

**Epic:** [Epic 2 - External Portal Integration & Candidate Processing](../epics/epic-2-external-portal-integration.md)  
**Story ID:** 2.2  
**Priority:** Phase 1 - MVP Foundation ⭐  
**Estimate:** 2 weeks

---

## User Story

**As a** client administrator,  
**I want** to configure custom pipeline stages and assessment criteria,  
**so that** candidates are evaluated according to our specific hiring requirements.

---

## Acceptance Criteria

1. ✅ Pipeline configuration interface implemented with drag-and-drop stage arrangement capabilities
2. ✅ Stage type library implemented including assessment, interview, review, and custom stage types
3. ✅ Assessment integration configuration implemented allowing third-party assessment platform connections
4. ✅ Pass/fail threshold configuration implemented for automated stage progression decisions
5. ✅ Custom stage criteria definition implemented with flexible rule-based evaluation options
6. ✅ Pipeline template system implemented for reusable configurations across similar job types
7. ✅ Stage dependency management implemented ensuring logical stage progression requirements
8. ✅ Pipeline preview functionality implemented showing candidate journey visualization

---

## Technical Dependencies

**Backend:**
- NestJS pipeline configuration service
- PostgreSQL tables: job_pipeline_stages, pipeline_templates, stage_rules

**Frontend:**
- React drag-and-drop interface (react-beautiful-dnd or dnd-kit)
- Tailwind CSS + shadcn/ui components
- Pipeline visualization

---

## Default Pipeline Stages

**Standard 6-Stage Pipeline:**
1. **Screening** - Initial candidate review
2. **Shortlist** - Qualified candidates
3. **Client Endorsement** - Client approval to proceed
4. **Client Interview** - Formal interview process
5. **Offer** - Offer extended
6. **Offer Accepted** - Candidate hired

**Customization Options:**
- Add additional stages (e.g., "Technical Assessment", "Reference Check")
- Remove optional stages
- Rename stages for branding
- Reorder stages (with logical validation)

---

## Database Schema

```typescript
Table: job_pipeline_stages
- id (UUID, PK)
- job_id (UUID, FK)
- stage_name (VARCHAR)
- stage_type (ENUM: screening, assessment, interview, review, offer, custom)
- stage_order (INTEGER)
- is_required (BOOLEAN)
- auto_progression_enabled (BOOLEAN)
- pass_threshold (DECIMAL, nullable)
- created_at (TIMESTAMP)

Table: pipeline_templates
- id (UUID, PK)
- template_name (VARCHAR)
- employment_type (ENUM: contract, part_time, full_time, eor)
- stages_config (JSONB) // Array of stage configurations
- created_by_user_id (UUID, FK)
- is_default (BOOLEAN)
```

---

## Related Requirements

- FR5: Configurable Pipeline Stages
- FR6: Accept/Reject Decision Framework
- FR11: Audit Trails & Data Integrity

---

## Notes

- **MVP Critical:** Pipeline configuration is core to candidate management
- **Default Stages:** Always start with 6-stage default, allow customization
- **Templates:** Save common configurations for reuse
- **Validation:** Prevent illogical stage orders (e.g., Offer before Interview)
