# External Candidate Portal API Documentation
**Multi-Employment ATS System - External Integration**

---

## Overview
This API allows external candidate portals to submit candidates and manage them through the **Screening** and **Shortlist** stages. After Shortlist, candidates are passed to the internal ATS system for Client Endorsement and subsequent stages.

---

## Base URL
```
https://your-ats-domain.com/api/portal
```

---

## Authentication

### API Key Authentication
All external portal endpoints require API key authentication for security.

#### Methods
1. **Header-based** (Recommended):
   ```http
   X-API-Key: your-api-key-here
   ```

2. **Query parameter** (Alternative):
   ```http
   ?apiKey=your-api-key-here
   ```

#### Setup
1. Set environment variable: `PORTAL_API_KEY=your-secret-key`
2. In development mode (no API key set), authentication is skipped

#### Response Codes
- `401 Unauthorized` - No API key provided
- `403 Forbidden` - Invalid API key

---

## Endpoints

### 1. Submit Candidate
Submit a new candidate application to a job posting.

**Endpoint**: `POST /api/portal/candidates`

**Headers**:
```http
Content-Type: application/json
X-API-Key: your-api-key
```

**Request Body**:
```json
{
  "jobId": "job-uuid-here",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "phone": "+1-555-0100",
  "resumeUrl": "https://storage.azure.com/resumes/john-doe.pdf",
  "externalPortalId": "portal-candidate-12345"
}
```

**Required Fields**:
- `jobId` - UUID of the job posting
- `firstName` - Candidate's first name
- `lastName` - Candidate's last name
- `email` - Candidate's email (unique per job)

**Optional Fields**:
- `phone` - Contact phone number
- `resumeUrl` - URL to uploaded resume (Azure Blob Storage)
- `externalPortalId` - Your portal's internal candidate ID

**Success Response** (201 Created):
```json
{
  "success": true,
  "candidate": {
    "id": 42,
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "currentStage": "Screening",
    "status": "active",
    "createdAt": "2025-11-17T10:00:00Z"
  },
  "message": "Candidate submitted successfully to Screening stage"
}
```

**Error Responses**:
- `400 Bad Request`:
  ```json
  {
    "error": "Duplicate email",
    "message": "Candidate with this email already applied to this job"
  }
  ```
- `500 Internal Server Error`:
  ```json
  {
    "error": "Failed to submit candidate",
    "details": "Database connection error"
  }
  ```

**Behavior**:
- Automatically sets `source` to `"portal"`
- Always starts candidate at `"Screening"` stage
- Prevents duplicate email per job (returns 400 if exists)

---

### 2. Advance Candidate Stage
Move a candidate from Screening → Shortlist or Shortlist → Client Endorsement.

**Endpoint**: `PUT /api/portal/candidates/:id/advance`

**Headers**:
```http
Content-Type: application/json
X-API-Key: your-api-key
```

**URL Parameters**:
- `id` - Candidate ID (integer)

**Request Body**:
```json
{
  "notes": "Strong technical background, excellent communication",
  "portalUserId": "portal-recruiter-456"
}
```

**Optional Fields**:
- `notes` - Notes about why candidate is advancing (stored in audit log)
- `portalUserId` - Your portal's user ID who made the decision

**Success Response** (200 OK):
```json
{
  "success": true,
  "candidate": {
    "id": 42,
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "previousStage": "Screening",
    "currentStage": "Shortlist",
    "updatedAt": "2025-11-17T11:30:00Z"
  },
  "message": "Candidate advanced from Screening to Shortlist"
}
```

**Stage Transitions**:
| Current Stage | Next Stage |
|--------------|-----------|
| Screening | Shortlist |
| Shortlist | Client Endorsement |

**Error Responses**:
- `400 Bad Request` (invalid stage transition):
  ```json
  {
    "error": "Invalid stage transition",
    "message": "Cannot advance from Client Endorsement. Portal can only advance from Screening or Shortlist."
  }
  ```
- `404 Not Found`:
  ```json
  {
    "error": "Candidate not found"
  }
  ```

**Audit Trail**:
- Logs previous stage, new stage, user ID, and notes to `candidate_stage_history` table

---

### 3. Get Candidates by Job
Retrieve all candidates for a specific job, optionally filtered by stage or status.

**Endpoint**: `GET /api/portal/jobs/:jobId/candidates`

**Headers**:
```http
X-API-Key: your-api-key
```

**URL Parameters**:
- `jobId` - Job UUID

**Query Parameters**:
- `stage` (optional) - Filter by pipeline stage (e.g., `Screening`, `Shortlist`)
- `status` (optional) - Filter by candidate status (`active`, `rejected`, `hired`, `withdrawn`)

**Example Requests**:
```http
GET /api/portal/jobs/abc-123/candidates
GET /api/portal/jobs/abc-123/candidates?stage=Screening
GET /api/portal/jobs/abc-123/candidates?stage=Shortlist&status=active
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "jobId": "abc-123",
  "totalCount": 15,
  "filters": {
    "stage": "Screening",
    "status": "active"
  },
  "candidates": [
    {
      "id": 42,
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "phone": "+1-555-0100",
      "currentStage": "Screening",
      "source": "portal",
      "status": "active",
      "resumeUrl": "https://storage.azure.com/resumes/john-doe.pdf",
      "createdAt": "2025-11-17T10:00:00Z",
      "updatedAt": "2025-11-17T10:00:00Z"
    }
  ]
}
```

**Use Cases**:
- Dashboard: Get all candidates in Screening stage
- Metrics: Count candidates by stage
- List view: Display all portal-sourced candidates for a job

---

### 4. Get Candidate Details
Retrieve complete candidate profile including documents, communications, and stage history.

**Endpoint**: `GET /api/portal/candidates/:id`

**Headers**:
```http
X-API-Key: your-api-key
```

**URL Parameters**:
- `id` - Candidate ID (integer)

**Success Response** (200 OK):
```json
{
  "success": true,
  "candidate": {
    "id": 42,
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "+1-555-0100",
    "currentStage": "Shortlist",
    "source": "portal",
    "status": "active",
    "resumeUrl": "https://storage.azure.com/resumes/john-doe.pdf",
    "externalPortalId": "portal-candidate-12345",
    "jobTitle": "Senior Software Engineer",
    "employmentType": "fullTime",
    "createdAt": "2025-11-17T10:00:00Z",
    "updatedAt": "2025-11-17T11:30:00Z",
    "documents": [
      {
        "id": 1,
        "document_type": "resume",
        "file_name": "john-doe-resume.pdf",
        "blob_url": "https://storage.azure.com/resumes/john-doe.pdf",
        "file_size": 524288,
        "uploaded_at": "2025-11-17T10:00:00Z"
      }
    ],
    "communications": [
      {
        "id": 5,
        "candidate_id": 42,
        "communication_type": "email",
        "subject": "Application Received",
        "content": "Thank you for applying...",
        "sent_by_user_id": "system",
        "sent_at": "2025-11-17T10:05:00Z"
      }
    ],
    "stageHistory": [
      {
        "id": 10,
        "previousStage": "Screening",
        "newStage": "Shortlist",
        "changedBy": "portal-recruiter-456",
        "notes": "Strong technical background",
        "changedAt": "2025-11-17T11:30:00Z"
      }
    ]
  }
}
```

**Error Responses**:
- `404 Not Found`:
  ```json
  {
    "error": "Candidate not found"
  }
  ```

---

### 5. Update Candidate
Update limited candidate information (security-restricted to specific fields).

**Endpoint**: `PUT /api/portal/candidates/:id`

**Headers**:
```http
Content-Type: application/json
X-API-Key: your-api-key
```

**URL Parameters**:
- `id` - Candidate ID (integer)

**Request Body**:
```json
{
  "phone": "+1-555-0199",
  "resumeUrl": "https://storage.azure.com/resumes/john-doe-updated.pdf",
  "externalPortalId": "portal-candidate-updated-12345"
}
```

**Allowed Fields** (security restriction):
- `phone` - Update phone number
- `resumeUrl` - Update resume URL
- `externalPortalId` - Update your portal's internal ID

**Restricted Fields** (cannot be changed by portal):
- `firstName`, `lastName`, `email` - Identity fields
- `currentStage` - Use `/advance` endpoint instead
- `status` - Managed by internal ATS
- `source` - Locked to "portal"

**Success Response** (200 OK):
```json
{
  "success": true,
  "candidate": {
    "id": 42,
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "+1-555-0199",
    "resumeUrl": "https://storage.azure.com/resumes/john-doe-updated.pdf",
    "externalPortalId": "portal-candidate-updated-12345",
    "updatedAt": "2025-11-17T12:00:00Z"
  },
  "message": "Candidate updated successfully"
}
```

**Error Responses**:
- `400 Bad Request`:
  ```json
  {
    "error": "No valid fields to update",
    "allowedFields": ["phone", "resumeUrl", "externalPortalId"]
  }
  ```
- `404 Not Found`:
  ```json
  {
    "error": "Candidate not found"
  }
  ```

---

## Workflow Integration

### Typical Portal Flow

```
┌─────────────────────────────────────────────┐
│  External Candidate Portal                 │
└─────────────┬───────────────────────────────┘
              │
              │ 1. Candidate applies
              ▼
┌─────────────────────────────────────────────┐
│  POST /api/portal/candidates                │
│  Status: Screening (automatic)              │
└─────────────┬───────────────────────────────┘
              │
              │ 2. Portal reviews application
              ▼
┌─────────────────────────────────────────────┐
│  PUT /api/portal/candidates/:id/advance     │
│  Screening → Shortlist                      │
└─────────────┬───────────────────────────────┘
              │
              │ 3. Portal completes screening
              ▼
┌─────────────────────────────────────────────┐
│  PUT /api/portal/candidates/:id/advance     │
│  Shortlist → Client Endorsement             │
└─────────────┬───────────────────────────────┘
              │
              │ 4. Handoff to Internal ATS
              ▼
┌─────────────────────────────────────────────┐
│  Internal ATS manages remaining stages:     │
│  - Client Endorsement                       │
│  - [Custom Stages]                          │
│  - Offer                                    │
│  - Offer Accepted                           │
└─────────────────────────────────────────────┘
```

---

## Data Models

### Candidate Object
```typescript
{
  id: number;                    // Internal ATS candidate ID
  firstName: string;             // Candidate first name
  lastName: string;              // Candidate last name
  email: string;                 // Unique email per job
  phone?: string;                // Contact phone
  currentStage: string;          // Current pipeline stage
  source: 'portal';              // Always 'portal' for external submissions
  status: 'active' | 'rejected' | 'hired' | 'withdrawn';
  resumeUrl?: string;            // Azure Blob Storage URL
  externalPortalId?: string;     // Your portal's internal ID
  jobTitle?: string;             // Associated job title
  employmentType?: string;       // Job employment type
  createdAt: string;             // ISO 8601 timestamp
  updatedAt: string;             // ISO 8601 timestamp
}
```

### Stage Names (Portal Scope)
- `Screening` - Initial candidate review
- `Shortlist` - Candidates passed initial screening
- `Client Endorsement` - Handoff point (internal ATS takes over)

---

## Error Handling

### Standard Error Format
```json
{
  "error": "Error type",
  "message": "Human-readable error description",
  "details": "Technical error details (optional)"
}
```

### HTTP Status Codes
| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Candidate successfully created |
| 400 | Bad Request | Invalid input data |
| 401 | Unauthorized | Missing API key |
| 403 | Forbidden | Invalid API key |
| 404 | Not Found | Resource not found |
| 500 | Internal Server Error | Server-side error |

---

## Rate Limiting
- **Development**: No rate limits
- **Production**: 100 requests/minute per API key (recommended)

---

## Security Best Practices

### 1. API Key Management
- Store API key in environment variables (never hardcode)
- Rotate keys quarterly
- Use different keys for dev/staging/production

### 2. HTTPS Only
- All API requests must use HTTPS
- HTTP requests will be rejected in production

### 3. Input Validation
- Always validate email format
- Sanitize all text inputs
- Validate jobId exists before submission

### 4. Resume Upload
- Upload resumes to Azure Blob Storage first
- Pass `resumeUrl` (not base64 data) to API
- Use SAS tokens for secure blob access

---

## Example Integration (JavaScript)

### Setup API Client
```javascript
const API_BASE_URL = 'https://your-ats-domain.com/api/portal';
const API_KEY = process.env.PORTAL_API_KEY;

class ATSPortalClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
        ...options.headers
      }
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'API request failed');
    }
    
    return data;
  }

  // Submit new candidate
  async submitCandidate(candidateData) {
    return this.request('/candidates', {
      method: 'POST',
      body: JSON.stringify(candidateData)
    });
  }

  // Advance candidate to next stage
  async advanceCandidate(candidateId, notes = null, userId = null) {
    return this.request(`/candidates/${candidateId}/advance`, {
      method: 'PUT',
      body: JSON.stringify({ notes, portalUserId: userId })
    });
  }

  // Get candidates for a job
  async getCandidatesByJob(jobId, filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/jobs/${jobId}/candidates?${params}`);
  }

  // Get candidate details
  async getCandidate(candidateId) {
    return this.request(`/candidates/${candidateId}`);
  }

  // Update candidate
  async updateCandidate(candidateId, updates) {
    return this.request(`/candidates/${candidateId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }
}

// Usage
const client = new ATSPortalClient(API_KEY);

// Submit candidate
const result = await client.submitCandidate({
  jobId: 'job-uuid-123',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  phone: '+1-555-0100',
  resumeUrl: 'https://storage.azure.com/resumes/john-doe.pdf'
});

console.log('Candidate created:', result.candidate.id);

// Advance to Shortlist
await client.advanceCandidate(
  result.candidate.id,
  'Strong technical skills',
  'portal-recruiter-123'
);

// Get all candidates in Screening
const screeningCandidates = await client.getCandidatesByJob(
  'job-uuid-123',
  { stage: 'Screening', status: 'active' }
);
```

---

## Testing

### Development Mode Testing
When `PORTAL_API_KEY` is not set, authentication is skipped:

```bash
# Test without API key (development)
curl -X POST http://localhost:5000/api/portal/candidates \
  -H "Content-Type: application/json" \
  -d '{
    "jobId": "test-job-uuid",
    "firstName": "Test",
    "lastName": "Candidate",
    "email": "test@example.com"
  }'
```

### Production Testing
```bash
# Test with API key
curl -X POST https://your-domain.com/api/portal/candidates \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-secret-key" \
  -d '{
    "jobId": "real-job-uuid",
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane@example.com"
  }'
```

---

## Webhooks (Future Enhancement)
In Phase 2, we plan to add webhooks to notify your portal when:
- Candidate advances past Client Endorsement (internal ATS takes over)
- Candidate receives offer
- Candidate is hired or rejected

---

## Support & Contact
For API support, integration questions, or to request a production API key:
- Email: api-support@your-ats-domain.com
- Documentation: https://docs.your-ats-domain.com
- Status Page: https://status.your-ats-domain.com

---

## Changelog

### Version 1.0 (2025-11-17)
- Initial release
- Endpoints: Submit, Advance, Get by Job, Get by ID, Update
- API key authentication
- Screening and Shortlist stage management

---

**End of Documentation**
