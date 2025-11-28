# Role-Based Access Control (RBAC) System

## Overview

The ATS Platform uses **Teamified Accounts SSO** as the single source of truth for user authentication, roles, organizations, and permissions. This approach ensures:

- **Centralized user management** - All users, roles, and organizations are managed in Teamified Accounts
- **Consistent access control** - Same permissions across all Teamified applications
- **Simplified integration** - No separate RBAC database required in ATS

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Teamified Accounts SSO                        │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │    Users    │──│Organizations │──│   Roles & Permissions  │ │
│  └─────────────┘  └──────────────┘  └────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                    OAuth 2.0 + PKCE
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        ATS Platform                              │
│  ┌──────────────────┐  ┌──────────────────┐                    │
│  │  Auth Middleware │──│  Frontend Auth   │                    │
│  │  (Permission     │  │  Context         │                    │
│  │   Enforcement)   │  │  (UI Gating)     │                    │
│  └──────────────────┘  └──────────────────┘                    │
└─────────────────────────────────────────────────────────────────┘
```

## Role Hierarchy

### Internal Roles (Teamified Employees)

| Role | Code | Access Level | Description |
|------|------|--------------|-------------|
| Super Admin | `super_admin` | Global | Full platform access, system configuration |
| Internal HR | `internal_hr` | Global | HR operations across all organizations |
| Internal Recruiter | `internal_recruiter` | Global | Recruiting across all organizations |
| Internal Account Manager | `internal_account_manager` | Global | Client organization management |
| Internal Finance | `internal_finance` | Global | Financial operations |
| Internal Marketing | `internal_marketing` | Global | Marketing with view-only analytics |

### Client Roles (Organization Users)

| Role | Code | Access Level | Description |
|------|------|--------------|-------------|
| Client Admin | `client_admin` | Organization | Full org access, user management |
| Client HR | `client_hr` | Organization | HR operations within org |
| Client Recruiter | `client_recruiter` | Organization | Recruiting within org |
| Client Finance | `client_finance` | Organization | Financial operations within org |
| Client Employee | `client_employee` | Organization | View-only team collaboration |

### Candidate Role

| Role | Code | Access Level | Description |
|------|------|--------------|-------------|
| Candidate | `candidate` | Public | Job applications, interview participation |

## Permission System

### Permission Categories

| Category | Permissions |
|----------|-------------|
| **Platform Admin** | `manage_platform_settings`, `manage_all_organizations`, `view_all_organizations`, `manage_internal_users`, `view_platform_analytics` |
| **Job Management** | `create_job`, `edit_job`, `delete_job`, `publish_job`, `view_jobs`, `approve_jobs` |
| **Candidate Pipeline** | `view_candidates`, `manage_candidates`, `move_pipeline_stages`, `schedule_interviews`, `view_candidate_documents`, `download_resumes` |
| **Interviews** | `manage_interview_availability`, `assign_interviewers`, `view_interview_results`, `submit_interview_feedback` |
| **Analytics** | `view_global_analytics`, `view_org_analytics`, `export_reports` |
| **Finance** | `manage_billing`, `view_invoices`, `manage_contracts`, `view_contracts` |
| **User Management** | `manage_org_users`, `invite_users`, `assign_roles`, `view_org_users` |
| **Pipeline Templates** | `manage_pipeline_templates`, `view_pipeline_templates` |

### Permission Matrix by Role

| Permission | Super Admin | Internal HR | Internal Recruiter | Internal AM | Internal Finance | Internal Marketing | Client Admin | Client HR | Client Recruiter | Client Finance | Client Employee |
|------------|:-----------:|:-----------:|:------------------:|:-----------:|:----------------:|:------------------:|:------------:|:---------:|:----------------:|:--------------:|:---------------:|
| manage_platform_settings | ✓ | | | | | | | | | | |
| manage_all_organizations | ✓ | | | ✓ | | | | | | | |
| view_all_organizations | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | | | | | |
| create_job | ✓ | | ✓ | | | | ✓ | | ✓ | | |
| edit_job | ✓ | | ✓ | | | | ✓ | | ✓ | | |
| delete_job | ✓ | | | | | | ✓ | | | | |
| publish_job | ✓ | | ✓ | | | | ✓ | | ✓ | | |
| view_jobs | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| approve_jobs | ✓ | | | | | | | | | | |
| view_candidates | ✓ | ✓ | ✓ | ✓ | | | ✓ | ✓ | ✓ | | |
| manage_candidates | ✓ | ✓ | ✓ | | | | ✓ | ✓ | ✓ | | |
| move_pipeline_stages | ✓ | ✓ | ✓ | | | | ✓ | ✓ | ✓ | | |
| schedule_interviews | ✓ | ✓ | ✓ | | | | ✓ | ✓ | ✓ | | |
| view_candidate_documents | ✓ | ✓ | ✓ | ✓ | | | ✓ | ✓ | ✓ | | |
| download_resumes | ✓ | ✓ | ✓ | | | | ✓ | ✓ | ✓ | | |
| manage_interview_availability | ✓ | | | | | | ✓ | ✓ | | | |
| assign_interviewers | ✓ | ✓ | ✓ | | | | ✓ | ✓ | ✓ | | |
| view_interview_results | ✓ | ✓ | ✓ | | | | ✓ | ✓ | ✓ | | |
| submit_interview_feedback | ✓ | ✓ | ✓ | | | | ✓ | ✓ | ✓ | | |
| view_global_analytics | ✓ | | | | | | | | | | |
| view_org_analytics | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | | ✓ | |
| export_reports | ✓ | | | | | | ✓ | | | | |
| manage_billing | ✓ | | | | ✓ | | ✓ | | | ✓ | |
| view_invoices | ✓ | | | | ✓ | | ✓ | | | ✓ | |
| manage_contracts | ✓ | | | | ✓ | | ✓ | | | | |
| view_contracts | ✓ | | | | ✓ | | ✓ | | | ✓ | |
| manage_org_users | ✓ | | | ✓ | | | ✓ | | | | |
| invite_users | ✓ | | | ✓ | | | ✓ | | | | |
| assign_roles | ✓ | | | ✓ | | | ✓ | | | | |
| view_org_users | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| manage_pipeline_templates | ✓ | | ✓ | | | | ✓ | | | | |
| view_pipeline_templates | ✓ | ✓ | ✓ | ✓ | | | ✓ | ✓ | ✓ | | |

## Implementation

### SSO Data Flow

1. **User Login**: User authenticates via Teamified Accounts SSO (OAuth 2.0 + PKCE)
2. **Token Exchange**: ATS receives access token after successful authentication
3. **User Info Request**: ATS calls `/api/v1/sso/me` with the access token
4. **Data Received**: SSO returns user profile with role, organization, and permissions
5. **Session Established**: ATS stores user data in AuthContext for frontend and attaches to `req.user` for backend

### SSO Response Structure

```typescript
interface SSOUserProfile {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: {
    id: string;
    code: string;        // e.g., 'client_recruiter', 'super_admin'
    name: string;        // e.g., 'Client Recruiter', 'Super Admin'
    category: 'internal' | 'client' | 'candidate';
  };
  organization?: {
    id: string;
    name: string;
    slug: string;
    type: 'internal' | 'client';
  };
  permissions?: string[];  // If provided by SSO, otherwise derived from role
}
```

### Backend Middleware

```javascript
import { authenticateRequest, requirePermission, requireRole } from './middleware/auth.js';

// Require authentication
app.get('/api/jobs', authenticateRequest, (req, res) => {
  // req.user contains full user data with role, org, permissions
});

// Require specific permission
app.post('/api/jobs', 
  authenticateRequest, 
  requirePermission('create_job'),
  (req, res) => { /* ... */ }
);

// Require specific role
app.post('/api/admin/settings',
  authenticateRequest,
  requireRole('super_admin'),
  (req, res) => { /* ... */ }
);

// Require multiple permissions (any)
app.put('/api/jobs/:id',
  authenticateRequest,
  requirePermission(['edit_job', 'manage_jobs']),
  (req, res) => { /* ... */ }
);

// Require multiple permissions (all)
app.delete('/api/jobs/:id',
  authenticateRequest,
  requirePermission(['delete_job', 'manage_jobs'], { requireAll: true }),
  (req, res) => { /* ... */ }
);
```

### Frontend Permission Checking

```tsx
import { useAuth } from '../contexts/AuthContext';
import { RequirePermission, RequireRole, RequireInternalUser } from '../components/ProtectedRoute';

function JobsPage() {
  const { hasPermission, hasRole, isInternalUser } = useAuth();
  
  return (
    <div>
      {/* Conditional rendering based on permission */}
      {hasPermission('create_job') && (
        <button>Create Job</button>
      )}
      
      {/* Using helper components */}
      <RequirePermission permission="view_candidates">
        <CandidateList />
      </RequirePermission>
      
      <RequireRole role={['super_admin', 'internal_recruiter']}>
        <AdminPanel />
      </RequireRole>
      
      <RequireInternalUser>
        <InternalToolbar />
      </RequireInternalUser>
    </div>
  );
}
```

### Protected Routes

```tsx
import { ProtectedRoute } from '../components/ProtectedRoute';

<Route 
  path="/admin" 
  element={
    <ProtectedRoute 
      permissions={['manage_platform_settings']}
      redirectTo="/"
    >
      <AdminPage />
    </ProtectedRoute>
  } 
/>

<Route 
  path="/jobs/create" 
  element={
    <ProtectedRoute 
      permissions={['create_job']}
      fallback={<AccessDenied />}
    >
      <CreateJobPage />
    </ProtectedRoute>
  } 
/>
```

## Organization Scoping

### Internal Users
- Have cross-organization access
- Can view and manage resources across all client organizations
- Identified by `organization.type === 'internal'` or `role.category === 'internal'`

### Client Users
- Organization-scoped access only
- Can only view/manage resources within their assigned organization
- Identified by `organization.type === 'client'` or `role.category === 'client'`

### Enforcement

Backend automatically enforces organization scoping:

```javascript
// Example: Get jobs with org scoping
app.get('/api/jobs', authenticateRequest, async (req, res) => {
  const { organization, role } = req.user;
  
  let query = db.select().from(jobs);
  
  // Internal users see all, clients see only their org
  if (role.category === 'client' && organization) {
    query = query.where(eq(jobs.organizationId, organization.id));
  }
  
  const results = await query;
  res.json({ jobs: results });
});
```

## Demo Mode

For development and testing, demo tokens are available:

| Token | User | Role | Organization |
|-------|------|------|--------------|
| `demo-token` | Clint Barton | Client Recruiter | Stark Industries |
| `admin-token` | Admin User | Super Admin | Teamified (Internal) |

Use these tokens in the Authorization header:
```
Authorization: Bearer demo-token
Authorization: Bearer admin-token
```

## Test Accounts

### Internal Team Users

| Email | Role | Access Level |
|-------|------|--------------|
| admin@teamified.com | Super Admin | Full Platform Access |
| sarah.chen@teamified.com | Internal HR | Global - HR Operations |
| marcus.johnson@teamified.com | Internal Recruiter | Global - Recruiting & ATS |
| elena.rodriguez@teamified.com | Internal Account Manager | Global - Client Management |
| david.kim@teamified.com | Internal Finance | Global - Financial Operations |
| lisa.wong@teamified.com | Internal Marketing | Global - Marketing (View-only) |

### Client Organization Users (Stark Industries Inc.)

| Email | Role | Access Level |
|-------|------|--------------|
| tony.stark@starkindustries.com | Client Admin | Full organization access |
| nick.fury@starkindustries.com | Client Admin | Full organization access |
| steve.rogers@starkindustries.com | Client HR | HR operations |
| clint.barton@starkindustries.com | Client Recruiter | Recruitment management |
| natasha.romanoff@starkindustries.com | Client Finance | Finance operations |
| pepper.potts@starkindustries.com | Client Employee | Team member |
| peter.parker@starkindustries.com | Client Employee | Team member |
| bruce.banner@starkindustries.com | Client Employee | Team member |

## Security Considerations

1. **Token Validation**: All tokens are validated against Teamified Accounts SSO
2. **PKCE Protection**: OAuth flow uses PKCE to prevent code interception
3. **State Parameter**: CSRF protection via state parameter validation
4. **Permission Fallback**: If SSO doesn't provide permissions, they're derived from role
5. **Organization Isolation**: Client users cannot access other organizations' data
6. **Audit Logging**: All authentication events are logged for compliance

## Teamified Accounts Documentation

For complete SSO and user management documentation, see:
**https://teamified-accounts.replit.app/docs**
