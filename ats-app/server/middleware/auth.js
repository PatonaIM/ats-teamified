/**
 * Authentication Middleware
 * Validates bearer tokens with Teamified Accounts SSO
 * Role, organization, and permission data comes directly from Teamified Accounts
 */

const TEAMIFIED_SSO_URL = 'https://teamified-accounts.replit.app/api';
const USE_DEMO_MODE = false;

const ROLE_PERMISSIONS = {
  super_admin: [
    'manage_platform_settings', 'manage_all_organizations', 'view_all_organizations',
    'manage_internal_users', 'view_platform_analytics', 'create_job', 'edit_job',
    'delete_job', 'publish_job', 'view_jobs', 'approve_jobs', 'view_candidates',
    'manage_candidates', 'move_pipeline_stages', 'schedule_interviews',
    'view_candidate_documents', 'download_resumes', 'manage_interview_availability',
    'assign_interviewers', 'view_interview_results', 'submit_interview_feedback',
    'view_global_analytics', 'view_org_analytics', 'export_reports', 'manage_billing',
    'view_invoices', 'manage_contracts', 'view_contracts', 'manage_org_users',
    'invite_users', 'assign_roles', 'view_org_users', 'manage_pipeline_templates',
    'view_pipeline_templates'
  ],
  internal_hr: [
    'view_all_organizations', 'view_jobs', 'view_candidates', 'manage_candidates',
    'move_pipeline_stages', 'schedule_interviews', 'view_candidate_documents',
    'download_resumes', 'assign_interviewers', 'view_interview_results',
    'submit_interview_feedback', 'view_org_analytics', 'view_org_users',
    'view_pipeline_templates'
  ],
  internal_recruiter: [
    'view_all_organizations', 'create_job', 'edit_job', 'publish_job', 'view_jobs',
    'view_candidates', 'manage_candidates', 'move_pipeline_stages', 'schedule_interviews',
    'view_candidate_documents', 'download_resumes', 'assign_interviewers',
    'view_interview_results', 'submit_interview_feedback', 'view_org_analytics',
    'view_org_users', 'view_pipeline_templates', 'manage_pipeline_templates'
  ],
  internal_account_manager: [
    'manage_all_organizations', 'view_all_organizations', 'view_jobs', 'view_candidates',
    'view_candidate_documents', 'view_org_analytics', 'manage_org_users', 'invite_users',
    'assign_roles', 'view_org_users', 'view_pipeline_templates'
  ],
  internal_finance: [
    'view_all_organizations', 'view_jobs', 'view_org_analytics', 'manage_billing',
    'view_invoices', 'manage_contracts', 'view_contracts', 'view_org_users'
  ],
  internal_marketing: [
    'view_all_organizations', 'view_jobs', 'view_platform_analytics', 'view_org_analytics',
    'view_org_users'
  ],
  client_admin: [
    'create_job', 'edit_job', 'delete_job', 'publish_job', 'view_jobs',
    'view_candidates', 'manage_candidates', 'move_pipeline_stages', 'schedule_interviews',
    'view_candidate_documents', 'download_resumes', 'manage_interview_availability',
    'assign_interviewers', 'view_interview_results', 'submit_interview_feedback',
    'view_org_analytics', 'export_reports', 'manage_billing', 'view_invoices',
    'manage_contracts', 'view_contracts', 'manage_org_users', 'invite_users',
    'assign_roles', 'view_org_users', 'manage_pipeline_templates', 'view_pipeline_templates'
  ],
  client_hr: [
    'view_jobs', 'view_candidates', 'manage_candidates', 'move_pipeline_stages',
    'schedule_interviews', 'view_candidate_documents', 'download_resumes',
    'manage_interview_availability', 'assign_interviewers', 'view_interview_results',
    'submit_interview_feedback', 'view_org_analytics', 'view_org_users',
    'view_pipeline_templates'
  ],
  client_recruiter: [
    'create_job', 'edit_job', 'publish_job', 'view_jobs', 'view_candidates',
    'manage_candidates', 'move_pipeline_stages', 'schedule_interviews',
    'view_candidate_documents', 'download_resumes', 'assign_interviewers',
    'view_interview_results', 'submit_interview_feedback', 'view_org_users',
    'view_pipeline_templates'
  ],
  client_finance: [
    'view_jobs', 'view_org_analytics', 'manage_billing', 'view_invoices',
    'view_contracts', 'view_org_users'
  ],
  client_employee: [
    'view_jobs', 'view_org_users'
  ],
  candidate: [
    'view_jobs'
  ]
};

function getPermissionsForRole(roleCode) {
  return ROLE_PERMISSIONS[roleCode] || [];
}

/**
 * Middleware to authenticate requests using Teamified SSO bearer tokens
 */
async function authenticateRequest(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing or invalid Authorization header. Expected format: Bearer <token>'
      });
    }

    const token = authHeader.substring(7);
    
    if (USE_DEMO_MODE && token === 'demo-token') {
      console.log('[Auth Middleware] Demo mode: Accepting demo token');
      req.user = {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'clint.barton@starkindustries.com',
        name: 'Clint Barton',
        role: {
          id: 'client-recruiter',
          code: 'client_recruiter',
          name: 'Client Recruiter',
          category: 'client'
        },
        organization: {
          id: 'stark-org',
          name: 'Stark Industries Inc.',
          slug: 'stark-industries',
          type: 'client'
        },
        permissions: getPermissionsForRole('client_recruiter'),
        avatar: undefined
      };
      return next();
    }
    
    if (USE_DEMO_MODE && token === 'admin-token') {
      console.log('[Auth Middleware] Admin mode: Accepting admin token');
      req.user = {
        id: '00000000-0000-0000-0000-000000000002',
        email: 'admin@teamified.com',
        name: 'Admin User',
        role: {
          id: 'super-admin',
          code: 'super_admin',
          name: 'Super Admin',
          category: 'internal'
        },
        organization: {
          id: 'teamified-org',
          name: 'Teamified',
          slug: 'teamified',
          type: 'internal'
        },
        permissions: getPermissionsForRole('super_admin'),
        avatar: undefined
      };
      return next();
    }

    const response = await fetch(`${TEAMIFIED_SSO_URL}/v1/sso/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      console.warn('[Auth Middleware] Token validation failed:', response.status);
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired access token'
      });
    }

    const userData = await response.json();

    if (!userData || !userData.id) {
      console.error('[Auth Middleware] Invalid user data from SSO');
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Failed to retrieve user profile'
      });
    }

    const roleCode = userData.role?.code || userData.role;
    const permissions = userData.permissions || getPermissionsForRole(roleCode);

    req.user = {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      role: userData.role || null,
      organization: userData.organization || null,
      permissions: permissions,
      avatar: userData.avatar
    };

    console.log('[Auth Middleware] User authenticated:', req.user.email, 'Role:', roleCode);
    next();
  } catch (error) {
    console.error('[Auth Middleware] Authentication error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication service unavailable'
    });
  }
}

/**
 * Optional authentication middleware - doesn't fail if no token is present
 */
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.substring(7);
    
    if (USE_DEMO_MODE && token === 'demo-token') {
      req.user = {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'clint.barton@starkindustries.com',
        name: 'Clint Barton',
        role: {
          id: 'client-recruiter',
          code: 'client_recruiter',
          name: 'Client Recruiter',
          category: 'client'
        },
        organization: {
          id: 'stark-org',
          name: 'Stark Industries Inc.',
          slug: 'stark-industries',
          type: 'client'
        },
        permissions: getPermissionsForRole('client_recruiter'),
        avatar: undefined
      };
      return next();
    }
    
    if (USE_DEMO_MODE && token === 'admin-token') {
      req.user = {
        id: '00000000-0000-0000-0000-000000000002',
        email: 'admin@teamified.com',
        name: 'Admin User',
        role: {
          id: 'super-admin',
          code: 'super_admin',
          name: 'Super Admin',
          category: 'internal'
        },
        organization: {
          id: 'teamified-org',
          name: 'Teamified',
          slug: 'teamified',
          type: 'internal'
        },
        permissions: getPermissionsForRole('super_admin'),
        avatar: undefined
      };
      return next();
    }

    const response = await fetch(`${TEAMIFIED_SSO_URL}/v1/sso/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      req.user = null;
      return next();
    }

    const userData = await response.json();

    if (userData && userData.id) {
      const roleCode = userData.role?.code || userData.role;
      req.user = {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role || null,
        organization: userData.organization || null,
        permissions: userData.permissions || getPermissionsForRole(roleCode),
        avatar: userData.avatar
      };
    } else {
      req.user = null;
    }

    next();
  } catch (error) {
    console.error('[Optional Auth] Error:', error);
    req.user = null;
    next();
  }
}

/**
 * Middleware for role-based access control
 * Usage: requireRole('client_admin') or requireRole(['client_admin', 'super_admin'])
 */
function requireRole(allowedRoles) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    const userRoleCode = req.user.role?.code || req.user.role;
    if (!roles.includes(userRoleCode)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Access denied. Required role: ${roles.join(' or ')}`
      });
    }

    next();
  };
}

/**
 * Middleware for permission-based access control
 * Usage: requirePermission('create_job') or requirePermission(['create_job', 'edit_job'], { requireAll: false })
 */
function requirePermission(requiredPermissions, options = {}) {
  const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];
  const { requireAll = false } = options;
  
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    const userPermissions = req.user.permissions || [];
    
    let hasAccess;
    if (requireAll) {
      hasAccess = permissions.every(p => userPermissions.includes(p));
    } else {
      hasAccess = permissions.some(p => userPermissions.includes(p));
    }

    if (!hasAccess) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Access denied. Required permission: ${permissions.join(requireAll ? ' and ' : ' or ')}`
      });
    }

    next();
  };
}

/**
 * Middleware to enforce organization-scoped access
 * Ensures client users can only access resources within their organization
 */
function requireOrganization(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required'
    });
  }

  const isInternalUser = req.user.role?.category === 'internal' || 
                         req.user.organization?.type === 'internal';
  
  if (isInternalUser) {
    return next();
  }

  if (!req.user.organization?.id) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Organization membership required'
    });
  }

  next();
}

export {
  authenticateRequest,
  optionalAuth,
  requireRole,
  requirePermission,
  requireOrganization,
  getPermissionsForRole,
  ROLE_PERMISSIONS
};
