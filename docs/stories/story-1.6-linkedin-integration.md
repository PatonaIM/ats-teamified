# Story 1.6: LinkedIn Integration Foundation

**Epic:** [Epic 1 - Foundation & Core Infrastructure](../epics/epic-1-foundation-core-infrastructure.md)  
**Story ID:** 1.6  
**Priority:** Phase 1 - MVP Foundation  
**Estimate:** 2 weeks

---

## User Story

**As a** recruiter,  
**I want** automatic LinkedIn job posting with approval-based activation and real-time synchronization,  
**so that** job openings reach candidates on LinkedIn while maintaining consistency with ATS data and proper oversight.

---

## Acceptance Criteria

1. ✅ LinkedIn Jobs API integration implemented with authentication and error handling
2. ✅ Conditional automatic job posting triggered upon job approval (client jobs) or job creation (recruiter jobs) with employment type-specific formatting
3. ✅ Real-time bidirectional synchronization implemented for job updates between ATS and LinkedIn
4. ✅ Employment type-specific job posting templates created optimized for LinkedIn display
5. ✅ LinkedIn application routing implemented directing candidates to external portal
6. ✅ Sync status tracking implemented showing last sync time, success/failure status, and error details
7. ✅ Manual sync override functionality provided for urgent updates and error recovery
8. ✅ LinkedIn job performance metrics integrated into ATS dashboard for application tracking
9. ✅ Approval-based posting workflow implemented preventing LinkedIn activation until recruiter manager approval for client-submitted jobs

---

## Technical Dependencies

**LinkedIn API:**
- LinkedIn Jobs API credentials
- OAuth 2.0 authentication
- API rate limiting handling

**Backend:**
- NestJS LinkedIn integration service
- Job sync queue (Redis or database)
- Webhook handler for LinkedIn events

**Database:**
- LinkedIn sync status table
- Application tracking table

---

## LinkedIn Jobs API Flow

### 1. Authentication
```typescript
// OAuth 2.0 flow for LinkedIn API access
- Client ID and Client Secret (stored in Azure Key Vault)
- Access token generation and refresh
- Token expiration handling
```

### 2. Job Posting Trigger
```typescript
// Automatic posting conditions:
IF (job.created_by_role === 'recruiter') {
  // Auto-post immediately upon job creation
  postToLinkedIn(job);
} ELSE IF (job.created_by_role === 'client' && job.status === 'approved') {
  // Post only after manager approval
  postToLinkedIn(job);
}
```

### 3. Bidirectional Sync
- **ATS → LinkedIn:** Job updates, status changes, job closures
- **LinkedIn → ATS:** Application counts, candidate referrals, job performance metrics

---

## Employment Type Formatting

**Contract:**
```json
{
  "jobType": "CONTRACT",
  "contractType": "PROJECT_BASED",
  "duration": "6 months",
  "workRemoteAllowed": true
}
```

**Part-Time:**
```json
{
  "jobType": "PART_TIME",
  "workHours": "20 hours/week",
  "scheduleType": "FLEXIBLE"
}
```

**Full-Time:**
```json
{
  "jobType": "FULL_TIME",
  "benefits": ["Health Insurance", "401k", "PTO"],
  "workRemoteAllowed": false
}
```

**EOR:**
```json
{
  "jobType": "FULL_TIME",
  "workRemoteAllowed": true,
  "employerType": "EMPLOYER_OF_RECORD",
  "internationalRole": true
}
```

---

## Error Handling

**Sync Failures:**
- Exponential backoff retry (1s, 2s, 4s, 8s, 16s)
- Circuit breaker pattern after 5 consecutive failures
- Manual retry option for recruiters
- Alert notifications for persistent failures

**Rate Limiting:**
- LinkedIn API: 100 requests per day per app
- Queue jobs if rate limit approached
- Prioritize new postings over updates

---

## Related Requirements

- FR2: LinkedIn Automatic Posting & Synchronization
- FR11: Audit Trails & Data Integrity
- NFR1: Security Requirements (API credentials)
- NFR5: Integration Requirements

---

## Notes

- **Critical MVP Integration:** LinkedIn is primary candidate source
- **Application Routing:** Direct applicants to external candidate portal
- **Sync Frequency:** Real-time for new jobs, hourly for updates
- **Metrics Tracking:** Monitor application counts, views, click-through rates
- **Manual Override:** Always provide manual sync option for urgent changes
