# Story 6.1: Hiring Funnel Analytics & Performance Metrics **[MVP Priority - FR14]**

**Epic:** [Epic 6 - Analytics, Reporting & System Optimization](../epics/epic-6-analytics-reporting-optimization.md)  
**Story ID:** 6.1  
**Priority:** Phase 1 - MVP (Descriptive), Phase 2 (Predictive)  
**Estimate:** 2 weeks (MVP), 2 weeks (Phase 2)

---

## User Story

**As a** recruiting director,  
**I want** detailed hiring funnel analytics and performance metrics,  
**so that** I can identify bottlenecks, optimize processes, and improve hiring outcomes.

---

## Acceptance Criteria

1. ✅ Hiring funnel visualization implemented showing candidate flow through all pipeline stages **[MVP]**
2. ✅ Stage conversion rate analytics implemented measuring progression success at each stage **[MVP]**
3. ✅ Time-to-hire metrics implemented tracking duration from application to hiring completion **[MVP]**
4. ✅ Source effectiveness analysis implemented measuring candidate quality and success rates by source **[MVP]**
5. ✅ Employment type performance comparison implemented showing metrics across different hiring types **[MVP]**
6. ✅ Recruiter performance analytics implemented measuring individual and team hiring success **[MVP - Simplified]**
7. ✅ Pipeline health monitoring implemented identifying stalled candidates and process bottlenecks **[MVP]**
8. ⏸️ Predictive analytics implemented forecasting hiring completion times and success probabilities **[Phase 2]**

---

## MVP Implementation Focus

### ✅ Essential for MVP (Criteria 1-5, 7)
- **Hiring funnel visualization:** Visual pipeline showing candidate counts per stage
- **Conversion rates:** Calculate stage-to-stage progression percentages
- **Time-to-hire:** Track days from application to offer accepted
- **Source effectiveness:** Compare LinkedIn, referrals, direct applications
- **Employment type metrics:** Contract vs part-time vs full-time vs EOR
- **Pipeline health:** Flag candidates stalled >7 days

### ✅ MVP Simplified (Criteria 6)
- **Recruiter metrics:** Basic hire count, time-to-fill per recruiter
- **Phase 2:** Advanced team analytics and benchmarking

### ⏸️ Phase 2 Enhancement (Criteria 8)
- **Predictive analytics:** Forecast time-to-hire based on current pipeline
- **Success probability:** ML models predicting hire likelihood
- **Requires:** 100+ completed hires for training data

---

## Technical Dependencies

**Backend:**
- NestJS analytics service
- PostgreSQL views for aggregated metrics
- Materialized views for performance

**Frontend:**
- React analytics dashboard
- Chart.js or Recharts for visualizations
- Real-time data updates

---

## Hiring Funnel Visualization (MVP)

```
┌────────────────────────────────────────────┐
│ Hiring Funnel - November 2025              │
├────────────────────────────────────────────┤
│                                            │
│ Screening (150)         100%               │
│      ↓ 60% conversion                      │
│ Shortlist (90)          60%                │
│      ↓ 44% conversion                      │
│ Client Endorsement (40) 27%                │
│      ↓ 75% conversion                      │
│ Client Interview (30)   20%                │
│      ↓ 50% conversion                      │
│ Offer (15)              10%                │
│      ↓ 80% conversion                      │
│ Offer Accepted (12)     8%                 │
│                                            │
│ Overall Conversion: 8%                     │
│ Average Time-to-Hire: 32 days             │
└────────────────────────────────────────────┘
```

---

## Key Metrics Dashboard

```
┌──────────────┬──────────────┬──────────────┐
│ Time-to-Hire │ Conversion   │ Active Jobs  │
│   32 days    │     8%       │     24       │
│   ↑ 2 days   │   ↓ 1%      │   ↑ 3        │
└──────────────┴──────────────┴──────────────┘

Source Effectiveness:
• LinkedIn: 45% of hires, 12% conversion
• Referrals: 30% of hires, 25% conversion
• Direct: 15% of hires, 5% conversion
• Other: 10% of hires, 8% conversion

Employment Type Performance:
• Full-Time: 28 days avg, 10% conversion
• Contract: 18 days avg, 12% conversion
• Part-Time: 22 days avg, 15% conversion
• EOR: 35 days avg, 6% conversion
```

---

## Database Views (MVP)

```sql
-- Hiring funnel metrics
CREATE VIEW v_hiring_funnel AS
SELECT 
  j.id as job_id,
  j.title,
  j.employment_type,
  COUNT(DISTINCT c.id) FILTER (WHERE c.current_stage = 'Screening') as screening_count,
  COUNT(DISTINCT c.id) FILTER (WHERE c.current_stage = 'Shortlist') as shortlist_count,
  COUNT(DISTINCT c.id) FILTER (WHERE c.current_stage = 'Client Endorsement') as endorsement_count,
  COUNT(DISTINCT c.id) FILTER (WHERE c.current_stage = 'Client Interview') as interview_count,
  COUNT(DISTINCT c.id) FILTER (WHERE c.current_stage = 'Offer') as offer_count,
  COUNT(DISTINCT c.id) FILTER (WHERE c.current_stage = 'Offer Accepted') as accepted_count,
  ROUND(100.0 * COUNT(DISTINCT c.id) FILTER (WHERE c.current_stage = 'Offer Accepted') / 
        NULLIF(COUNT(DISTINCT c.id) FILTER (WHERE c.current_stage = 'Screening'), 0), 2) as overall_conversion_rate
FROM jobs j
LEFT JOIN candidates c ON j.id = c.job_id
WHERE j.status = 'active'
GROUP BY j.id;

-- Time-to-hire metrics
CREATE VIEW v_time_to_hire AS
SELECT
  j.id as job_id,
  j.title,
  j.employment_type,
  AVG(DATE_PART('day', c.hired_at - c.created_at)) as avg_days_to_hire,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY DATE_PART('day', c.hired_at - c.created_at)) as median_days_to_hire
FROM jobs j
JOIN candidates c ON j.id = c.job_id
WHERE c.status = 'hired'
GROUP BY j.id;

-- Source effectiveness
CREATE VIEW v_source_effectiveness AS
SELECT
  c.source,
  COUNT(*) as total_candidates,
  COUNT(*) FILTER (WHERE c.status = 'hired') as hired_count,
  ROUND(100.0 * COUNT(*) FILTER (WHERE c.status = 'hired') / COUNT(*), 2) as conversion_rate
FROM candidates c
GROUP BY c.source;
```

---

## Related Requirements

- FR14: Advanced Analytics Dashboards [MVP - Descriptive]
- FR11: Audit Trails & Data Integrity

---

## Notes

- **MVP Critical:** Analytics dashboard is essential for data-driven hiring
- **Descriptive Analytics:** MVP shows what happened (facts and trends)
- **Phase 2 Predictive:** ML forecasts what will happen (requires historical data)
- **Real-Time:** Update metrics as candidates progress
- **Bottleneck Detection:** Highlight stages with low conversion or long duration
