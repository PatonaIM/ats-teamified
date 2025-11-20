# User Story: Customizable Workflow Builder

**Feature**: Enterprise-grade customizable hiring pipeline builder with per-stage configurations

**Status**: Proposed (Not Yet Implemented)

**Version**: 1.0

**Date**: November 17, 2025

---

## 📋 User Story

### **As a** Hiring Manager or Recruiter

### **I want to** customize the hiring pipeline stages for each job with specific configurations (interview settings, automations, SLA, notifications)

### **So that** I can tailor the hiring process to match different role requirements and automate repetitive tasks

---

## 🎯 Business Value

### **Why This Feature?**

1. **Client Differentiation**: Each client can define their unique hiring process
2. **Automation**: Reduce manual work with stage-specific triggers (auto-advance, auto-disqualify)
3. **Compliance**: Enforce required approvals and documentation at specific stages
4. **Flexibility**: Different workflows for different job types (technical vs sales vs executive)
5. **Scalability**: Save workflows as templates and reuse across similar roles
6. **Transparency**: Candidates know what to expect at each stage
7. **Analytics**: Track time-in-stage, conversion rates, and bottlenecks

---

## 📅 Phased Development Timeline

### **Phase 1: MVP Demo-Ready** ⚡
**Timeline**: **3-5 Days** (Days 1-5)  
**Goal**: Functional demo showcasing customizable pipelines

**Deliverables**:
- ✅ Database: Add `stage_config` JSONB column to `job_pipeline_stages`
- ✅ Backend: 4 API endpoints (CRUD for stage configuration)
- ✅ Frontend: Drag-and-drop pipeline builder using `@dnd-kit`
- ✅ Frontend: Stage configuration modal (basic settings)
- ✅ Frontend: Visual pipeline display with stage cards
- ✅ Feature: Add/remove custom stages
- ✅ Feature: Configure stage name, type, and duration
- ✅ Feature: Fixed stages enforcement (top 3 + bottom 2)
- ✅ Testing: Basic unit tests for API endpoints

**Demo Script**: "Create job → Customize workflow → Drag 'AI Interview' stage → Configure (30 min, auto-disqualify < 60) → Save → Show custom pipeline"

**Key Milestone**: ✨ **Can demonstrate customizable hiring pipelines**

---

### **Phase 2: Production-Ready** 🛡️
**Timeline**: **12 Days Total** (Days 1-12)  
**Includes**: MVP (Days 1-5) + Safety Features (Days 6-12)  
**Goal**: Safe live editing with candidates in progress

**Additional Deliverables** (Days 6-12):
- ✅ Backend: Candidate count tracking per stage
- ✅ Backend: Stage rename with auto-migration (multi-table update)
- ✅ Backend: Deletion blocking when candidates present
- ✅ Frontend: Warning modals (delete blocked, rename confirm, config impact)
- ✅ Frontend: Candidate count display on each stage (👥 N)
- ✅ Frontend: Bulk candidate migration tool
- ✅ Feature: Audit trail logging for all modifications
- ✅ Feature: Transaction-safe database operations
- ✅ Testing: Integration tests for candidate migration
- ✅ Testing: E2E tests for workflow editing

**Key Milestone**: 🔒 **Production-safe with candidates in progress**

---

### **Phase 3: Enterprise-Ready** 🚀
**Timeline**: **20 Days Total** (Days 1-20)  
**Includes**: Production (Days 1-12) + Enterprise Features (Days 13-20)  
**Goal**: Full-featured workflow builder with templates

**Additional Deliverables** (Days 13-20):
- ✅ Database: Create `workflow_templates` table
- ✅ Backend: Template CRUD API endpoints
- ✅ Frontend: Template library UI
- ✅ Frontend: Save pipeline as template
- ✅ Frontend: Apply template to new job
- ✅ Feature: Advanced stage configs (automations, SLA, notifications)
- ✅ Feature: Integration settings per stage (HackerRank, Zoom, OpenAI)
- ✅ Feature: Mobile-responsive design
- ✅ Analytics: Time-in-stage tracking
- ✅ Analytics: Conversion rate dashboard
- ✅ Testing: Performance tests (1000+ jobs, 10,000+ candidates)

**Key Milestone**: 🏆 **Enterprise-grade workflow customization**

---

### **Summary: What Gets Delivered When**

| Timeline | Phase | Key Features | Status |
|----------|-------|--------------|--------|
| **Days 1-5** | MVP Demo | Drag-and-drop builder, basic config, visual display | ✨ Demo-ready |
| **Days 6-12** | Production | Candidate safety, auto-migration, bulk tools | 🔒 Production-safe |
| **Days 13-20** | Enterprise | Templates, advanced configs, analytics | 🏆 Enterprise-ready |

**Fastest Demo Path**: **Day 3** (minimal viable demo)  
**Recommended Demo**: **Day 5** (polished MVP)  
**Production Deployment**: **Day 12**  
**Full Feature Set**: **Day 20**

---

## 🏗️ Architecture: Non-Destructive Design

### **Core Principle: ADDITIVE ONLY**

All database changes are **non-destructive additions**. No existing fields in `jobs` or `candidates` tables are deleted or modified.

### **Safe Rollback Strategy**

✅ **Can be disabled** via feature flag  
✅ **Can be removed** without breaking core ATS  
✅ **Preserves existing data** (jobs, candidates remain intact)  
✅ **Backward compatible** (works with old pipelines)

---

## 📊 Database Changes (ADDITIVE ONLY)

### **1. Extend Existing Table: `job_pipeline_stages`**

**Current Schema** (Keep all existing fields):
```sql
CREATE TABLE job_pipeline_stages (
  id SERIAL PRIMARY KEY,
  job_id INTEGER REFERENCES jobs(id),
  stage_name VARCHAR(100),
  stage_order INTEGER,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**➕ ADD New Column** (Non-destructive):
```sql
-- ADD ONLY - DO NOT DELETE ANY EXISTING COLUMNS
ALTER TABLE job_pipeline_stages 
ADD COLUMN IF NOT EXISTS stage_config JSONB DEFAULT '{}'::jsonb;

-- Add index for JSONB queries (optional, for performance)
CREATE INDEX IF NOT EXISTS idx_job_pipeline_stages_stage_config 
ON job_pipeline_stages USING GIN (stage_config);
```

**What `stage_config` Contains**:
```json
{
  "stageType": "ai_interview",
  "interviewConfig": {
    "mode": "ai_video",
    "duration": 30,
    "platform": "openai",
    "candidateInstructions": "Complete within 48 hours"
  },
  "automations": [
    {
      "trigger": "score_below",
      "threshold": 60,
      "action": "auto_disqualify"
    }
  ],
  "visibility": {
    "visibleToClient": true,
    "visibleToCandidate": false
  },
  "slaSettings": {
    "targetCompletionTime": 48
  },
  "notifications": [...],
  "integrations": {...}
}
```

---

### **2. New Table: `workflow_templates`** (Optional)

**Purpose**: Save reusable workflow templates

```sql
CREATE TABLE IF NOT EXISTS workflow_templates (
  id SERIAL PRIMARY KEY,
  template_name VARCHAR(200) NOT NULL,
  description TEXT,
  created_by INTEGER REFERENCES users(id),
  organization_id INTEGER,
  stages_config JSONB NOT NULL,
  is_default BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_workflow_templates_org 
ON workflow_templates(organization_id);
```

**What `stages_config` Contains**:
```json
{
  "stages": [
    {
      "stageName": "Screening",
      "stageOrder": 1,
      "isDefault": true,
      "stageConfig": {...}
    },
    {
      "stageName": "AI Interview",
      "stageOrder": 4,
      "isDefault": false,
      "stageConfig": {
        "stageType": "ai_interview",
        "interviewConfig": {...}
      }
    }
  ]
}
```

---

### **3. Extend Existing Table: `jobs`** (Optional Link to Templates)

**➕ ADD New Column** (Non-destructive):
```sql
-- ADD ONLY - DO NOT DELETE ANY EXISTING COLUMNS
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS workflow_template_id INTEGER REFERENCES workflow_templates(id);

-- NULL means job uses default/custom pipeline
-- Non-NULL means job was created from a template
```

**Rollback-Safe**:
- If `workflow_template_id` is NULL → Job works with existing pipeline
- If column is dropped later → Jobs still work (just lose template reference)

---

### **4. NO CHANGES to `candidates` Table**

**✅ KEEP AS-IS**:
```sql
-- candidates table remains unchanged
-- current_stage (VARCHAR) already works with stage names
-- No modifications needed!
```

**Why?**:
- `candidates.current_stage` already stores stage names as strings
- Stage rename auto-migration handles updates
- No structural changes needed

---

## 🔧 API Endpoints (New)

### **Stage Configuration Management**

```
GET    /api/jobs/:jobId/pipeline-stages
       → List all stages with configs

GET    /api/jobs/:jobId/pipeline-stages/:stageId
       → Get single stage with config

POST   /api/jobs/:jobId/pipeline-stages
       → Create new stage with config

PUT    /api/jobs/:jobId/pipeline-stages/:stageId/config
       → Update stage configuration

PUT    /api/jobs/:jobId/pipeline-stages/:stageId/rename
       → Rename stage (with auto-migration)

DELETE /api/jobs/:jobId/pipeline-stages/:stageId
       → Delete stage (blocked if candidates present)

GET    /api/jobs/:jobId/pipeline-stages/:stageId/candidate-count
       → Check if stage can be deleted
```

### **Workflow Template Management**

```
GET    /api/workflow-templates
       → List all templates (org-specific)

GET    /api/workflow-templates/:templateId
       → Get template details

POST   /api/workflow-templates
       → Save current job pipeline as template

PUT    /api/workflow-templates/:templateId
       → Update template

DELETE /api/workflow-templates/:templateId
       → Delete template

POST   /api/jobs/:jobId/apply-template/:templateId
       → Apply template to job
```

### **Bulk Candidate Operations**

```
POST   /api/jobs/:jobId/candidates/bulk-move
       → Move candidates from one stage to another
       → Body: { fromStage, toStage, candidateIds[], note }
```

---

## 🎨 UI Components (New)

### **1. Workflow Builder Page**
- Path: `/jobs/:jobId/workflow-builder`
- Drag-and-drop interface
- Stage library sidebar
- Visual pipeline preview

### **2. Stage Configuration Modal**
- Opens when clicking "Edit" on a stage
- 10 configuration sections (see UI guide)
- Save/Cancel actions

### **3. Warning Modals**
- Delete stage (blocked if candidates)
- Rename stage (auto-migration notice)
- Edit config (impact warning)

### **4. Bulk Migration Tool**
- Move candidates between stages
- Audit trail notes
- Post-migration actions

### **5. Template Library**
- Save pipeline as template
- Browse saved templates
- Apply template to new job

---

## 🔐 Feature Flag Architecture

### **Environment Variable**

```bash
# .env
WORKFLOW_BUILDER_ENABLED=false  # Default: disabled
```

### **Backend Guard**

```javascript
// middleware/featureFlags.js
export const requireWorkflowBuilder = (req, res, next) => {
  if (process.env.WORKFLOW_BUILDER_ENABLED !== 'true') {
    return res.status(403).json({
      error: 'Feature disabled',
      message: 'Workflow Builder is not enabled for this environment'
    });
  }
  next();
};

// Apply to all workflow builder routes
app.use('/api/jobs/:jobId/pipeline-stages', requireWorkflowBuilder);
app.use('/api/workflow-templates', requireWorkflowBuilder);
```

### **Frontend Guard**

```javascript
// hooks/useFeatureFlag.js
export const useWorkflowBuilder = () => {
  return process.env.VITE_WORKFLOW_BUILDER_ENABLED === 'true';
};

// In JobsPage.tsx
const workflowBuilderEnabled = useWorkflowBuilder();

{workflowBuilderEnabled && (
  <Button onClick={openWorkflowBuilder}>
    Customize Workflow
  </Button>
)}
```

---

## 🛡️ Safe Rollback Plan

### **Scenario: Need to Remove Feature**

**Step 1: Disable via Feature Flag**
```bash
WORKFLOW_BUILDER_ENABLED=false
```
- UI buttons disappear
- API endpoints return 403
- Feature is invisible to users

**Step 2: Keep Data (Optional)**
```sql
-- Data remains in database
-- Can re-enable later by setting flag to true
-- No data loss
```

**Step 3: Remove Code (If Permanent)**
```bash
# Remove UI components
rm -rf src/components/WorkflowBuilder/

# Remove API routes
# Delete workflow builder routes from server/index.js

# Keep database schema (data is harmless)
# stage_config column can remain (defaults to empty JSON)
```

**Step 4: Drop Database Objects (If Needed)**
```sql
-- ONLY if permanently removing and cleaning up
-- This is OPTIONAL and NOT required for rollback

-- Drop template table (if created)
DROP TABLE IF EXISTS workflow_templates CASCADE;

-- Drop added column from jobs (optional)
ALTER TABLE jobs DROP COLUMN IF EXISTS workflow_template_id;

-- Drop added column from job_pipeline_stages (optional)
ALTER TABLE job_pipeline_stages DROP COLUMN IF EXISTS stage_config;

-- NOTE: Dropping stage_config is safe because:
-- 1. It's a JSONB column with default '{}'
-- 2. Core pipeline still works with stage_name + stage_order
-- 3. No foreign key dependencies
```

---

## ✅ Acceptance Criteria

### **MVP (Demo-Ready)**

- [ ] User can access Workflow Builder from job page
- [ ] User can drag-and-drop stages to reorder
- [ ] User can add new custom stages between fixed stages
- [ ] User can configure basic stage settings (name, type, duration)
- [ ] User can delete empty custom stages
- [ ] Fixed stages (top 3, bottom 2) cannot be deleted
- [ ] Pipeline saves to database with `stage_config` JSONB
- [ ] Visual pipeline displays correctly

### **Production-Ready**

- [ ] Candidate count displays on each stage
- [ ] Warning modal blocks deletion of stages with candidates
- [ ] Stage rename auto-migrates candidates and history
- [ ] Bulk candidate migration tool works
- [ ] Audit trail logs all stage modifications
- [ ] API validates stage modifications
- [ ] Error handling for edge cases

### **Enterprise-Ready**

- [ ] Template library UI functional
- [ ] User can save pipeline as template
- [ ] User can apply template to new job
- [ ] Advanced stage configs work (automations, SLA, notifications)
- [ ] Integration settings configurable per stage
- [ ] Mobile-responsive design
- [ ] Analytics dashboard (time-in-stage, conversion rates)

---

## 🧪 Testing Strategy

### **Unit Tests**

```javascript
// Test stage configuration CRUD
describe('Stage Configuration API', () => {
  test('should create stage with config', async () => {
    const response = await request(app)
      .post('/api/jobs/1/pipeline-stages')
      .send({
        stageName: 'AI Interview',
        stageOrder: 4,
        stageConfig: {
          stageType: 'ai_interview',
          interviewConfig: { duration: 30 }
        }
      });
    
    expect(response.status).toBe(201);
    expect(response.body.stageConfig.stageType).toBe('ai_interview');
  });
  
  test('should block deletion with candidates', async () => {
    // Create candidate in stage
    await createCandidate({ jobId: 1, currentStage: 'AI Interview' });
    
    const response = await request(app)
      .delete('/api/jobs/1/pipeline-stages/5');
    
    expect(response.status).toBe(400);
    expect(response.body.error).toContain('Cannot delete stage');
  });
});
```

### **Integration Tests**

```javascript
// Test stage rename with candidate migration
test('should auto-migrate candidates on rename', async () => {
  // Create job with stage
  const job = await createJob();
  const stage = await createStage({ jobId: job.id, stageName: 'Old Name' });
  
  // Create candidate in stage
  const candidate = await createCandidate({ 
    jobId: job.id, 
    currentStage: 'Old Name' 
  });
  
  // Rename stage
  await request(app)
    .put(`/api/jobs/${job.id}/pipeline-stages/${stage.id}/rename`)
    .send({ newStageName: 'New Name' });
  
  // Verify candidate migrated
  const updated = await getCandidate(candidate.id);
  expect(updated.currentStage).toBe('New Name');
});
```

### **E2E Tests (Playwright)**

```javascript
// Test workflow builder UI
test('should customize pipeline via drag-and-drop', async ({ page }) => {
  await page.goto('/jobs/1/workflow-builder');
  
  // Drag AI Interview from library
  await page.dragAndDrop(
    '[data-stage="ai_interview"]',
    '[data-drop-zone="custom-stages"]'
  );
  
  // Configure stage
  await page.click('[data-stage-id="5"] [data-action="edit"]');
  await page.fill('[name="duration"]', '30');
  await page.click('button:has-text("Save Configuration")');
  
  // Verify saved
  await expect(page.locator('[data-stage-id="5"]')).toContainText('30 min');
});
```

---

## 📦 Dependencies

### **Already Installed** ✅

- `@dnd-kit/core` - Drag-and-drop library
- `@dnd-kit/sortable` - Sortable list utilities
- `@dnd-kit/utilities` - Helper functions
- `openai` - AI integration (for AI interview stages)

### **New Dependencies** (If Needed)

None! All required packages already installed.

---

## 🚀 Migration Path

### **Phase 1: Database Schema** (Day 1)

```bash
# Add stage_config column
npm run db:push --force

# Verify column exists
psql $DATABASE_URL -c "SELECT column_name FROM information_schema.columns WHERE table_name='job_pipeline_stages' AND column_name='stage_config';"
```

### **Phase 2: Backend API** (Day 2-3)

- Create API endpoints for stage configuration
- Implement stage modification safeguards
- Add candidate count checks

### **Phase 3: Frontend UI** (Day 3-5)

- Build workflow builder page
- Implement drag-and-drop
- Create configuration modal
- Add warning dialogs

### **Phase 4: Testing & Polish** (Day 5)

- Write unit tests
- Test edge cases
- Polish UI/UX

---

## 📝 Success Metrics

### **Adoption**

- % of jobs using custom workflows (vs default)
- Number of workflow templates created
- Template reuse rate

### **Efficiency**

- Time saved per job creation (with templates)
- Reduction in manual candidate advancement
- Average time-in-stage improvement

### **Quality**

- Candidate conversion rate improvement
- Stage completion rate
- SLA compliance rate

---

## 🔮 Future Enhancements

### **V2.0: Advanced Automation**

- Conditional stage routing (if X then Y, else Z)
- Multi-path pipelines (A/B testing)
- AI-powered workflow optimization suggestions

### **V3.0: External Integrations**

- Slack notifications per stage
- Calendar auto-scheduling (Calendly, Google Calendar)
- Assessment platform integrations (HackerRank, Codility)
- Video interview platforms (Zoom, Teams, Spark Hire)

### **V4.0: Analytics & Insights**

- Funnel analysis per stage
- Bottleneck detection
- Predictive time-to-hire
- Workflow performance comparison

---

## ⚠️ Risks & Mitigations

### **Risk 1: Complex JSONB Queries**

**Impact**: Performance degradation with large datasets

**Mitigation**:
- Add GIN index on `stage_config` column
- Cache frequently accessed configs
- Limit JSONB depth to 3 levels

### **Risk 2: Data Migration Errors**

**Impact**: Lost candidate references on stage rename

**Mitigation**:
- Wrap all migrations in database transactions
- Test with production-like data volumes
- Add rollback scripts

### **Risk 3: Feature Creep**

**Impact**: Delayed MVP, over-engineered solution

**Mitigation**:
- Stick to 3-phase roadmap (MVP → Production → Enterprise)
- Demo after each phase
- Get user feedback before next phase

---

## 📚 Documentation

### **Technical Docs**

- [CANDIDATE_PIPELINE_COMPLETE_GUIDE.md](./CANDIDATE_PIPELINE_COMPLETE_GUIDE.md) - Complete technical reference
- [WORKFLOW_BUILDER_UI_GUIDE.md](./WORKFLOW_BUILDER_UI_GUIDE.md) - UI/UX visual guide
- [DATABASE_SCHEMA_ANALYSIS.md](./DATABASE_SCHEMA_ANALYSIS.md) - Database architecture

### **API Reference**

- Auto-generated from OpenAPI spec (future)
- Currently documented in technical guide

---

## ✅ Definition of Done

### **MVP Complete When**:

- [ ] All MVP acceptance criteria met
- [ ] Unit tests pass (>80% coverage)
- [ ] API endpoints documented
- [ ] Feature flag implemented
- [ ] Demo script prepared
- [ ] Code reviewed and merged
- [ ] Deployed to staging environment
- [ ] Successfully demoed to stakeholders

### **Production Complete When**:

- [ ] All production acceptance criteria met
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Performance tested (1000+ jobs, 10,000+ candidates)
- [ ] Security audit passed
- [ ] Rollback plan documented and tested
- [ ] Deployed to production
- [ ] Monitoring dashboards created

---

## 🎯 Rollback Checklist

### **If Feature Must Be Removed**:

**Immediate (< 1 hour)**:
- [ ] Set `WORKFLOW_BUILDER_ENABLED=false`
- [ ] Verify UI buttons hidden
- [ ] Verify API endpoints return 403
- [ ] Monitor error logs

**Short-term (< 1 week)**:
- [ ] Remove UI components from codebase
- [ ] Remove API routes from server
- [ ] Update documentation

**Long-term (Optional)**:
- [ ] Drop `workflow_templates` table
- [ ] Drop `workflow_template_id` from jobs table
- [ ] Drop `stage_config` from job_pipeline_stages table
- [ ] Archive feature branch

**Data Preservation**:
- [ ] Export workflow templates before deletion
- [ ] Backup stage configs for analysis
- [ ] Document lessons learned

---

## 📧 Stakeholder Communication

### **Announcement Template**

```
Subject: New Feature: Customizable Workflow Builder

Hi Team,

We're excited to announce a new feature: Customizable Workflow Builder!

What's New:
• Create custom hiring pipelines for each job
• Configure stage-specific settings (duration, automations, SLA)
• Save and reuse workflow templates
• Safely edit live workflows with candidates in progress

Rollout Plan:
• Week 1: MVP demo (basic customization)
• Week 2-3: Production release (safety features)
• Week 4-5: Enterprise features (templates, analytics)

Feature Flag:
This feature can be enabled/disabled via WORKFLOW_BUILDER_ENABLED flag.

Feedback:
Please share your thoughts at team@example.com

Thanks!
```

---

**End of User Story**

**Ready for Implementation**: ✅  
**Safe for Rollback**: ✅  
**Non-Destructive**: ✅
