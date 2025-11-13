# Story 4.4: Budget Monitoring & Tracking

**Epic:** [Epic 4 - Budget Approval & Employment Type Workflows](../epics/epic-4-budget-approval-employment-workflows.md)  
**Story ID:** 4.4  
**Priority:** Phase 2 - Advanced Features  
**Estimate:** 2 weeks

---

## User Story

**As a** department head,  
**I want** real-time budget tracking and spending visibility,  
**so that** I can manage hiring costs and stay within approved budget limits.

---

## Acceptance Criteria

1. ✅ Budget allocation tracking implemented showing available budget by department and employment type
2. ✅ Spending commitment tracking implemented including pending approvals and future obligations
3. ✅ Budget variance reporting implemented highlighting over/under budget scenarios and projections
4. ✅ Budget alert system implemented warning of approaching budget limits and overspend risks
5. ✅ Budget reallocation tools implemented enabling budget transfers between departments and categories
6. ✅ Cost center integration implemented aligning hiring costs with appropriate accounting structures
7. ✅ Budget forecasting implemented projecting future spending based on hiring pipeline and trends
8. ✅ Budget reporting implemented providing comprehensive financial summaries for management review

---

## Technical Dependencies

**Backend:**
- NestJS budget tracking service
- PostgreSQL tables: budget_allocations, budget_transactions, budget_forecasts
- Financial reporting engine

**Frontend:**
- React budget dashboard
- Charts and visualizations (Chart.js, Recharts)
- Budget allocation interface

---

## Budget Dashboard

```
┌────────────────────────────────────────────────┐
│ Engineering Department Budget - Q4 2025        │
├────────────────────────────────────────────────┤
│ Total Allocated: $2,000,000                    │
│ Committed: $1,450,000 (72.5%)                  │
│ Pending: $350,000 (17.5%)                      │
│ Available: $200,000 (10%)                      │
│                                                │
│ [▓▓▓▓▓▓▓▓▓░] 90% Utilized                      │
│                                                │
│ By Employment Type:                            │
│ Full-Time: $1,200,000 (60%)                    │
│ Contract: $500,000 (25%)                       │
│ Part-Time: $200,000 (10%)                      │
│ EOR: $100,000 (5%)                             │
│                                                │
│ ⚠️ Warning: 90% budget utilized                │
│ Projected overspend: $150,000 if all pending  │
│ approvals are accepted                         │
└────────────────────────────────────────────────┘
```

---

## Budget Alerts

### Warning Thresholds
- **Yellow Alert:** 75% budget utilized
- **Orange Alert:** 85% budget utilized
- **Red Alert:** 95% budget utilized
- **Critical:** Actual overspend

### Alert Actions
```
When 85% threshold reached:
1. Notify department head
2. Flag pending approvals for review
3. Suggest budget reallocation or increase
4. Pause non-critical hiring
```

---

## Database Schema

```typescript
Table: budget_allocations
- id (UUID, PK)
- department (VARCHAR)
- fiscal_year (INTEGER)
- quarter (INTEGER)
- employment_type (ENUM, nullable)
- allocated_amount (DECIMAL)
- committed_amount (DECIMAL)
- pending_amount (DECIMAL)
- available_amount (DECIMAL, computed)

Table: budget_transactions
- id (UUID, PK)
- allocation_id (UUID, FK)
- transaction_type (ENUM: hire, approval, cancellation)
- candidate_id (UUID, FK, nullable)
- amount (DECIMAL)
- transaction_date (TIMESTAMP)
- description (TEXT)
```

---

## Related Requirements

- FR8: Budget Approval Workflows
- FR14: Advanced Analytics Dashboards

---

## Notes

- **Phase 2 Only:** Real-time budget tracking
- **Forecasting:** Project future spending based on pipeline
- **Alerts:** Proactive warnings before overspend
- **Reallocation:** Move budget between departments/types
