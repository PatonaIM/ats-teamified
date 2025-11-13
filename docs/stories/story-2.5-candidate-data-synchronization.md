# Story 2.5: Candidate Data Integration & Synchronization *[Phase 2]*

**Epic:** [Epic 2 - External Portal Integration & Candidate Processing](../epics/epic-2-external-portal-integration.md)  
**Story ID:** 2.5  
**Priority:** Phase 2 - Advanced Features  
**Estimate:** 3 weeks

---

## User Story

**As a** data manager,  
**I want** comprehensive candidate data synchronization between external portal and ATS,  
**so that** all candidate information remains consistent and accessible.

---

## Acceptance Criteria

1. ✅ Bidirectional data synchronization implemented maintaining data consistency across systems
2. ✅ Candidate profile merge functionality implemented combining external portal and ATS data
3. ✅ Document synchronization implemented ensuring all candidate documents available in both systems
4. ✅ Assessment results integration implemented linking external and internal assessment data
5. ✅ Communication history synchronization implemented providing complete candidate interaction records
6. ✅ Data conflict resolution implemented handling discrepancies between system data
7. ✅ Sync status monitoring implemented with error detection and recovery procedures
8. ✅ Data archival and retention implemented according to compliance and privacy requirements

---

## Technical Dependencies

**Backend:**
- NestJS data sync service
- PostgreSQL sync tracking tables
- Azure Blob Storage for document sync
- Redis for sync queue management

**External Portal:**
- Bidirectional API access
- Webhook subscriptions
- Document transfer APIs

---

## Synchronization Flows

### 1. Profile Data Sync
```
ATS ←→ External Portal
- Contact information
- Employment preferences
- Skills and qualifications
- Work history
```

### 2. Document Sync
```
ATS → Azure Blob Storage ← External Portal
- Resume files
- Certificates
- Reference letters
- Assessment results
```

### 3. Communication History Sync
```
ATS ←→ External Portal
- Email communications
- Portal messages
- Interview notes
- Feedback comments
```

---

## Conflict Resolution

**Merge Strategy:**
```typescript
// Last-write-wins with timestamp comparison
function mergeData(atsData, portalData) {
  if (atsData.updated_at > portalData.updated_at) {
    return atsData; // ATS is newer
  } else {
    return portalData; // Portal is newer
  }
}

// Manual review for critical fields
const criticalFields = ['email', 'phone', 'name'];
if (hasConflict(atsData, portalData, criticalFields)) {
  flagForManualReview(candidateId);
}
```

---

## Related Requirements

- FR3: External Portal Integration
- FR11: Audit Trails & Data Integrity
- NFR7: Compliance Requirements (GDPR data handling)

---

## Notes

- **Phase 2 Only:** Requires operational external portal
- **Conflict Resolution:** Automated for non-critical fields, manual for critical
- **Data Retention:** Follow GDPR/CCPA retention policies
- **Sync Frequency:** Real-time for critical updates, hourly batch for non-urgent
