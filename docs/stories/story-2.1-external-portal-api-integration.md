# Story 2.1: External Portal API Integration *[Phase 2]*

**Epic:** [Epic 2 - External Portal Integration & Candidate Processing](../epics/epic-2-external-portal-integration.md)  
**Story ID:** 2.1  
**Priority:** Phase 2 - Advanced Features  
**Estimate:** 3 weeks

---

## User Story

**As a** system integrator,  
**I want** robust API integration with the external portal system,  
**so that** candidate data and AI screening results flow seamlessly into the ATS pipeline.

---

## Acceptance Criteria

1. ✅ External portal API client implemented with authentication, error handling, and retry mechanisms
2. ✅ Candidate data import endpoints implemented receiving complete candidate profiles from external portal
3. ✅ AI screening results import functionality implemented with score interpretation and status mapping
4. ✅ Real-time webhook integration implemented for immediate candidate status updates from external portal
5. ✅ Data transformation layer implemented converting external portal data to ATS data models
6. ✅ Integration error handling implemented with logging, alerting, and recovery procedures
7. ✅ Candidate data validation implemented ensuring data integrity and completeness requirements
8. ✅ Integration health monitoring implemented with status dashboards and performance metrics

---

## Technical Dependencies

**External Portal:**
- Portal API documentation and credentials
- Webhook endpoints and HMAC authentication
- REST API for outbound calls

**Backend:**
- NestJS portal integration service
- PostgreSQL tables: portal_activity_log, webhook_events, sync_queue
- Redis for idempotency tracking

**Security:**
- HMAC SHA-256 signature verification
- API key management (Azure Key Vault)
- Retry logic with exponential backoff

---

## Integration Flows

### 1. Assessment Results Flow
```
External Portal → Webhook → ATS
- Assessment completed
- Scores and analysis imported
- Candidate stage updated automatically
```

### 2. Interview Scheduling Flow
```
ATS → REST API → External Portal
- Interview request sent
- Portal schedules with candidate
- Confirmation webhook back to ATS
```

### 3. Document Upload Flow
```
External Portal → Webhook → ATS
- Document uploaded by candidate
- File transferred to Azure Blob Storage
- Verification workflow triggered
```

### 4. Offer Acceptance Flow
```
ATS → REST API → External Portal
- Offer sent to candidate
- Candidate accepts via portal
- Webhook confirms acceptance
- ATS updates candidate to "Hired"
```

---

## Database Schema

```typescript
Table: portal_assessments
- id (UUID, PK)
- candidate_id (UUID, FK)
- assessment_type (VARCHAR)
- status (ENUM: pending, completed, failed)
- score (DECIMAL)
- portal_assessment_id (VARCHAR)
- completed_at (TIMESTAMP)

Table: webhook_events
- id (UUID, PK)
- event_type (VARCHAR)
- event_id (VARCHAR, UNIQUE) // idempotency
- payload (JSONB)
- processed (BOOLEAN)
- received_at (TIMESTAMP)

Table: sync_queue
- id (UUID, PK)
- operation_type (VARCHAR)
- entity_id (UUID)
- retry_count (INTEGER)
- last_attempt (TIMESTAMP)
- next_retry (TIMESTAMP)
- status (ENUM: pending, processing, completed, failed)
```

---

## Related Requirements

- FR3: External Portal Integration
- FR17: Team Connect Integration
- NFR5: Integration Requirements
- NFR1: Security Requirements (HMAC, API keys)

---

## Notes

- **Phase 2 Only:** Deferred until candidate portal is operational
- **Idempotency:** Use event_id to prevent duplicate webhook processing
- **Retry Logic:** Exponential backoff (1s → 2s → 4s → 8s → 16s)
- **Circuit Breaker:** Stop retries after 5 consecutive failures
- **Monitoring:** Track webhook delivery success rates and latency
