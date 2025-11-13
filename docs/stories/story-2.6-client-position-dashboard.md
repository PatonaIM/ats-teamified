# Story 2.6: Client Position Dashboard **[MVP - FR18]**

**Epic:** [Epic 2 - External Portal Integration & Candidate Processing](../epics/epic-2-external-portal-integration.md)  
**Story ID:** 2.6  
**Priority:** Phase 1 - MVP Foundation ⭐  
**Estimate:** 2 weeks

---

## User Story

**As a** client or recruiter,  
**I want** to see all my open job positions with pipeline stage visualization and candidate counts,  
**so that** I can quickly assess hiring progress and identify positions requiring attention.

---

## Acceptance Criteria

1. ✅ Dashboard interface implemented displaying all open job positions in card or table view with employment type indicators
2. ✅ Real-time pipeline stage visualization implemented showing default stages (Screening → Shortlist → Client Endorsement → Client Interview → Offer → Offer Accepted) with customized stages where configured
3. ✅ Candidate count metrics implemented displaying number of candidates per stage for each job position
4. ✅ Employment type filtering implemented allowing view filtering by contract, part-time, full-time, or EOR positions
5. ✅ Pipeline health indicators implemented showing time-in-stage metrics, accept/reject ratios, and bottleneck alerts
6. ✅ Quick access to job detail views implemented via click-through navigation from dashboard job cards
7. ✅ Sorting and search functionality implemented allowing organization by posting date, candidate count, employment type, or job title
8. ✅ Stage-specific candidate counts displayed with visual progress bars showing distribution across pipeline stages
9. ✅ Urgent action indicators implemented highlighting positions with stalled candidates or pending decisions
10. ✅ Dashboard refresh implemented with real-time updates as candidates move through stages

---

## Technical Dependencies

**Backend:**
- NestJS dashboard aggregation service
- PostgreSQL views for aggregated metrics
- Redis for real-time data caching

**Frontend:**
- React dashboard with Tailwind CSS
- shadcn/ui card components
- Real-time updates (WebSocket or polling)

---

## Dashboard Layout

### Job Card View
```
┌─────────────────────────────────────────┐
│ Senior Full-Stack Developer    [EDIT]  │
│ Full-Time • Posted 14 days ago         │
├─────────────────────────────────────────┤
│ Pipeline: [▓▓▓░░░] 35 candidates       │
│                                         │
│ Screening (15) → Shortlist (12) →      │
│ Client Endorsement (5) → Interview (2) │
│ → Offer (1) → Accepted (0)             │
│                                         │
│ ⚠️ 3 candidates stalled >7 days        │
│ ✓ 5 pending your review                │
└─────────────────────────────────────────┘
```

### Employment Type Color Coding
- **Contract:** Blue (#3B82F6)
- **Part-Time:** Green (#10B981)
- **Full-Time:** Orange (#F59E0B)
- **EOR:** Purple (#A16AE8)

---

## Database Views

```sql
-- Aggregated job metrics view
CREATE VIEW v_job_dashboard AS
SELECT 
  j.id,
  j.title,
  j.employment_type,
  j.created_at,
  COUNT(DISTINCT c.id) as total_candidates,
  COUNT(DISTINCT CASE WHEN c.current_stage = 'Screening' THEN c.id END) as screening_count,
  COUNT(DISTINCT CASE WHEN c.current_stage = 'Shortlist' THEN c.id END) as shortlist_count,
  COUNT(DISTINCT CASE WHEN c.current_stage = 'Client Endorsement' THEN c.id END) as endorsement_count,
  COUNT(DISTINCT CASE WHEN c.current_stage = 'Client Interview' THEN c.id END) as interview_count,
  COUNT(DISTINCT CASE WHEN c.current_stage = 'Offer' THEN c.id END) as offer_count,
  COUNT(DISTINCT CASE WHEN c.current_stage = 'Offer Accepted' THEN c.id END) as accepted_count,
  COUNT(DISTINCT CASE WHEN cps.is_stalled = true THEN c.id END) as stalled_count
FROM jobs j
LEFT JOIN candidates c ON j.id = c.job_id
LEFT JOIN candidate_pipeline_status cps ON c.id = cps.candidate_id
WHERE j.status = 'active'
GROUP BY j.id;
```

---

## Related Requirements

- FR18: Client Dashboard Interface [MVP]
- FR5: Configurable Pipeline Stages
- FR14: Advanced Analytics Dashboards

---

## Notes

- **MVP Critical:** Dashboard is the primary interface for clients and recruiters
- **Real-Time:** Update counts as candidates move through pipeline
- **Performance:** Use database views for efficient aggregation
- **Mobile Responsive:** Ensure usability on tablets and phones
