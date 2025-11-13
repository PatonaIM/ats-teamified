# Story 2.4: Candidate Pipeline Progression Engine **[MVP]**

**Epic:** [Epic 2 - External Portal Integration & Candidate Processing](../epics/epic-2-external-portal-integration.md)  
**Story ID:** 2.4  
**Priority:** Phase 1 - MVP Foundation ⭐  
**Estimate:** 2 weeks

---

## User Story

**As a** candidate,  
**I want** visibility into my application status and clear next steps,  
**so that** I understand my progress and can take required actions.

---

## Acceptance Criteria

1. ✅ Pipeline progression logic implemented automatically advancing candidates upon accept decisions
2. ✅ Stage completion tracking implemented showing candidate current status and progression history
3. ✅ Candidate portal status updates implemented reflecting real-time pipeline changes
4. ✅ Next action identification implemented showing candidates required tasks and deadlines
5. ✅ Pipeline bottleneck detection implemented alerting recruiters to stalled candidate progressions
6. ✅ Stage duration tracking implemented for process optimization and SLA monitoring
7. ✅ Candidate communication triggers implemented for status change notifications
8. ✅ Pipeline analytics implemented showing stage conversion rates and timing metrics

---

## Technical Dependencies

**Backend:**
- NestJS pipeline progression service
- PostgreSQL tables: candidate_pipeline_status, stage_history
- Redis for real-time updates

**Frontend:**
- React candidate pipeline visualization
- Real-time status updates (WebSocket or polling)
- Progress tracking UI

---

## Pipeline Progression Logic

### Automatic Advancement
```typescript
// When recruiter accepts candidate at current stage
function progressCandidate(candidateId: string) {
  const currentStage = getCurrentStage(candidateId);
  const nextStage = getNextStage(currentStage);
  
  // Update candidate status
  updateCandidateStage(candidateId, nextStage);
  
  // Create history record
  logStageTransition(candidateId, currentStage, nextStage);
  
  // Send notifications
  notifyCandidate(candidateId, nextStage);
  notifyRecruiters(candidateId, nextStage);
  
  // Check for required actions
  identifyNextActions(candidateId, nextStage);
}
```

### Bottleneck Detection
```typescript
// Alert if candidate stalled >7 days
const stalledCandidates = candidates.filter(c => {
  const daysSinceLastUpdate = getDaysSince(c.last_updated);
  return daysSinceLastUpdate > 7 && c.status === 'active';
});

// Escalate if stalled >14 days
const criticalCandidates = stalledCandidates.filter(c => 
  getDaysSince(c.last_updated) > 14
);
```

---

## Database Schema

```typescript
Table: candidate_pipeline_status
- id (UUID, PK)
- candidate_id (UUID, FK)
- job_id (UUID, FK)
- current_stage (VARCHAR)
- entered_stage_at (TIMESTAMP)
- days_in_stage (INTEGER, computed)
- next_action_required (VARCHAR, nullable)
- next_action_deadline (TIMESTAMP, nullable)
- is_stalled (BOOLEAN, computed)

Table: stage_history
- id (UUID, PK)
- candidate_id (UUID, FK)
- job_id (UUID, FK)
- from_stage (VARCHAR)
- to_stage (VARCHAR)
- transitioned_by_user_id (UUID, FK)
- transition_reason (TEXT)
- timestamp (TIMESTAMP)
```

---

## Stage Duration Tracking

**Metrics:**
- Average time in each stage
- Median vs mean comparison
- Stage-specific bottlenecks
- Employment type comparisons

**Alerts:**
- Yellow flag: >7 days in stage
- Red flag: >14 days in stage
- Auto-escalation: >21 days in stage

---

## Related Requirements

- FR5: Configurable Pipeline Stages
- FR6: Accept/Reject Decision Framework
- FR14: Advanced Analytics Dashboards

---

## Notes

- **MVP Critical:** Smooth pipeline progression is essential for user experience
- **Real-Time Updates:** Candidates see status changes immediately
- **Bottleneck Alerts:** Proactively identify stalled candidates
- **Analytics:** Track stage duration for process optimization
