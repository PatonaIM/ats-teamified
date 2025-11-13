# Story 4.1: Employment Type-Specific Budget Calculation

**Epic:** [Epic 4 - Budget Approval & Employment Type Workflows](../epics/epic-4-budget-approval-employment-workflows.md)  
**Story ID:** 4.1  
**Priority:** Phase 2 - Advanced Features  
**Estimate:** 2 weeks

---

## User Story

**As a** finance manager,  
**I want** accurate budget calculations based on employment type and candidate specifics,  
**so that** hiring decisions reflect true financial impact and comply with budget policies.

---

## Acceptance Criteria

1. ✅ Contract budget calculation implemented considering total project value, duration, and deliverable milestones
2. ✅ Part-time budget calculation implemented based on hourly rates, estimated hours, and duration projections
3. ✅ Full-time budget calculation implemented including salary, benefits, overhead, and long-term cost projections
4. ✅ EOR budget calculation implemented with service fees, local employment costs, and compliance expenses
5. ✅ Market rate integration implemented providing salary benchmarking and competitive analysis
6. ✅ Budget impact analysis implemented showing department and company-wide financial implications
7. ✅ Currency and tax calculation implemented supporting international hiring and local requirements
8. ✅ Budget variance analysis implemented comparing actual costs against approved budgets

---

## Technical Dependencies

**Backend:**
- NestJS budget calculation service
- PostgreSQL tables: budget_calculations, market_rates
- Market rate APIs (Glassdoor, Payscale, Salary.com)
- Currency conversion API

**Frontend:**
- React budget calculator interface
- Real-time calculation display
- Budget approval workflows

---

## Budget Calculation Formulas

### Contract Position
```typescript
Total Contract Cost = (
  Project Value +
  Milestone Payments +
  Service Fees (15-20%) +
  Currency Conversion Fees
) × Duration Multiplier
```

### Part-Time Position
```typescript
Annual Part-Time Cost = (
  Hourly Rate × 
  Weekly Hours × 
  52 weeks
) + Prorated Benefits + Administrative Overhead
```

### Full-Time Position
```typescript
Total Annual Cost = (
  Base Salary +
  Benefits (25-35% of salary) +
  Overhead (office, equipment, 20-30%) +
  Taxes and Compliance (varies by location)
)

5-Year Projection = Annual Cost × 5 × (1 + Annual Increase Rate)
```

### EOR Position
```typescript
EOR Total Cost = (
  Local Salary +
  Local Benefits (country-specific) +
  EOR Service Fee (8-15% of salary) +
  Compliance Costs +
  Currency Conversion
)
```

---

## Market Rate Integration

**Data Sources:**
- Glassdoor salary data
- Payscale compensation reports
- LinkedIn Salary Insights
- Indeed salary trends
- Internal historical data

**Benchmarking:**
```
Position: Senior Full-Stack Developer
Location: San Francisco, CA
Experience: 5-7 years

Market Data:
- 25th percentile: $120,000
- Median: $145,000
- 75th percentile: $170,000
- 90th percentile: $200,000

Candidate Expectation: $155,000
Assessment: Competitive (57th percentile)
```

---

## Database Schema

```typescript
Table: budget_calculations
- id (UUID, PK)
- candidate_id (UUID, FK)
- job_id (UUID, FK)
- employment_type (ENUM)
- base_compensation (DECIMAL)
- benefits_cost (DECIMAL)
- overhead_cost (DECIMAL)
- total_annual_cost (DECIMAL)
- total_project_cost (DECIMAL, nullable)
- currency (VARCHAR)
- calculation_date (TIMESTAMP)
- approved (BOOLEAN)

Table: market_rates
- id (UUID, PK)
- job_title (VARCHAR)
- location (VARCHAR)
- experience_level (VARCHAR)
- percentile_25 (DECIMAL)
- median (DECIMAL)
- percentile_75 (DECIMAL)
- percentile_90 (DECIMAL)
- data_source (VARCHAR)
- updated_at (TIMESTAMP)
```

---

## Related Requirements

- FR8: Budget Approval Workflows
- FR15: Employment Type-Specific Workflows

---

## Notes

- **Phase 2 Only:** Advanced budget calculations deferred
- **MVP Baseline:** Simple salary input, manual budget approval
- **Market Integration:** Connect to salary data APIs for benchmarking
- **Currency:** Support multi-currency for international hiring
