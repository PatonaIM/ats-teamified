# Client Endorsement Substage Transitions

## Overview
Client Endorsement stage has **2 substages** that track the client review process with specific automated and manual transition logic.

---

## Substages

### 1. Pending Client Review (50% progress)
**Substage ID:** `client_review_pending`
**Label:** Pending Client Review

**Transition Logic:**
- **Manual Trigger:** When recruiter submits candidate to client
- **Database Field:** `submitted_to_client_at` (timestamp)
- **How to Trigger:** 
  - Use "Submit to Client" button in UI
  - Or set `submitted_to_client_at = CURRENT_TIMESTAMP`

**SQL Example:**
```sql
UPDATE candidates 
SET submitted_to_client_at = CURRENT_TIMESTAMP,
    candidate_substage = 'client_review_pending'
WHERE id = '<candidate_id>';
```

---

### 2. Client Reviewing (100% progress)
**Substage ID:** `client_reviewing`
**Label:** Client Reviewing

**Transition Logic:**
- **Auto-Transition:** When client views the candidate profile
- **Database Field:** `client_viewed_at` (timestamp)
- **How to Trigger:** 
  - Auto-triggered when client portal accessed
  - Or manually set `client_viewed_at = CURRENT_TIMESTAMP`

**SQL Example:**
```sql
UPDATE candidates 
SET client_viewed_at = CURRENT_TIMESTAMP,
    candidate_substage = 'client_reviewing'
WHERE id = '<candidate_id>';
```

---

## Transition Flow

```
Candidate enters Client Endorsement stage
           ↓
[Recruiter submits to client]
submitted_to_client_at = timestamp
           ↓
Substage 1: client_review_pending (50%)
           ↓
[Client views profile]
client_viewed_at = timestamp
           ↓
Substage 2: client_reviewing (100%)
           ↓
Ready to move to next stage
```

---

## Database Schema

### New Timestamp Fields
```sql
-- Added to candidates table
submitted_to_client_at  TIMESTAMP  -- When recruiter submits to client
client_viewed_at        TIMESTAMP  -- When client views the profile
```

---

## API Usage

### Three Ways to Track Client Views

#### **Method 1: Submit to Client (Manual Trigger)**
When recruiter explicitly submits candidate to client:

```bash
POST /api/candidates/{id}/submit-to-client
Content-Type: application/json

{
  "userId": "recruiter_id"
}
```

**Response:**
```json
{
  "success": true,
  "candidate": { ... },
  "message": "Candidate submitted to client successfully"
}
```

**Effect:**
- Sets `submitted_to_client_at = CURRENT_TIMESTAMP`
- Updates `candidate_substage = 'client_review_pending'`

---

#### **Method 2: Auto-Track Client View (Automatic)**
When client views candidate profile in client portal:

```bash
POST /api/candidates/{id}/client-view
Content-Type: application/json

{
  "clientId": "client_user_id",
  "clientEmail": "client@company.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Client view tracked successfully",
  "substage_updated": true,
  "new_substage": "client_reviewing"
}
```

**Effect:**
- Sets `client_viewed_at = CURRENT_TIMESTAMP`
- Updates `candidate_substage = 'client_reviewing'`
- Only triggers once (won't update if already viewed)

**When to use:**
- In client portal's candidate detail page
- Add this API call when client opens candidate profile
- Tracks authentic client engagement

---

#### **Method 3: Manual Mark as Viewed (Recruiter Override)**
When recruiter manually confirms client has viewed:

```bash
POST /api/candidates/{id}/mark-viewed
Content-Type: application/json

{
  "userId": "recruiter_id",
  "userRole": "recruiter"
}
```

**Response:**
```json
{
  "success": true,
  "candidate": { ... },
  "message": "Candidate marked as viewed by client"
}
```

**Effect:**
- Sets `client_viewed_at = CURRENT_TIMESTAMP`
- Updates `candidate_substage = 'client_reviewing'`
- Requires recruiter role (clients cannot use this)

**When to use:**
- Client confirmed view via phone/email
- Manual correction/override
- Testing or troubleshooting

---

## UI Implementation Notes

### Recommended UI Actions

**In Candidate Details Panel:**
1. **"Submit to Client" Button** 
   - Visible when: `submitted_to_client_at` is NULL
   - Action: Sets timestamp and moves to `client_review_pending`
   
2. **"Mark as Viewed by Client" Button** (Admin only)
   - Visible when: In `client_review_pending` substage
   - Action: Sets `client_viewed_at` and moves to `client_reviewing`

---

## Testing Example

### Test with Priyanka Nemade

Current status:
- **Stage:** Client Endorsement
- **Substage:** client_review_pending (50%)
- **submitted_to_client_at:** 2025-11-20T08:11:15.636Z
- **client_viewed_at:** NULL

To simulate client viewing:
```sql
UPDATE candidates 
SET client_viewed_at = CURRENT_TIMESTAMP,
    candidate_substage = 'client_reviewing'
WHERE email = 'priyanka.nemade@teamified.com';
```

---

## Progress Visualization

**Substage 1 (50%):**
```
[████████████] [            ]
Pending Client Review
```

**Substage 2 (100%):**
```
[████████████] [████████████]
Client Reviewing
```

---

## Key Points

✅ **2 substages only** (reduced from 5)
✅ **First substage:** Manual submission trigger
✅ **Second substage:** Auto-transition on client view
✅ **Timestamp-based** tracking for audit trail
✅ **Progressive disclosure** - shows client engagement status

---

## Future Enhancements

1. **Email Notifications:**
   - Notify client when candidate submitted
   - Notify recruiter when client views profile

2. **Analytics:**
   - Track average time between submission and client view
   - Monitor client engagement rates

3. **Client Portal Integration:**
   - Automatic tracking when client logs in
   - Real-time substage updates
