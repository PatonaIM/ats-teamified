/**
 * Authentication Context
 * Manages global authentication state, user session, and RBAC permissions
 * Role and permission data comes directly from Teamified Accounts SSO
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import {
  initiateLogin,
  validateToken,
  getStoredToken,
  storeUserProfile,
  type UserProfile,
} from '../utils/auth';

interface Role {
  id: string;
  code: string;
  name: string;
  category: 'internal' | 'client' | 'candidate';
}

interface Organization {
  id: string;
  name: string;
  slug: string;
  type: 'internal' | 'client';
}

const ROLE_PERMISSIONS: Record<string, string[]> = {
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

interface AuthContextType {
  user: UserProfile | null;
  role: Role | null;
  permissions: string[];
  organization: Organization | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => Promise<void>;
  loginDemo: () => void;
  loginAdmin: () => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  hasRole: (roleCode: string) => boolean;
  isInternalUser: () => boolean;
  isClientUser: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapSSODataToRBAC(userProfile: UserProfile): {
  role: Role | null;
  permissions: string[];
  organization: Organization | null;
} {
  console.log('[AuthContext] Raw SSO user profile:', JSON.stringify(userProfile, null, 2));
  
  let role: Role | null = null;
  let organization: Organization | null = null;
  let permissions: string[] = [];
  
  // Handle role - SSO might return it in different formats
  const ssoRole = userProfile.role;
  const roleCode = userProfile.role_code || userProfile.roleCode || (typeof ssoRole === 'string' ? ssoRole : ssoRole?.code);
  const roleName = userProfile.role_name || userProfile.roleName || (typeof ssoRole === 'object' ? ssoRole?.name : undefined);
  const roleCategory = userProfile.role_category || userProfile.roleCategory || (typeof ssoRole === 'object' ? ssoRole?.category : undefined);
  
  console.log('[AuthContext] Extracted role data:', { roleCode, roleName, roleCategory, ssoRole });
  
  if (roleCode || ssoRole) {
    // Determine category based on role code if not provided
    let category: 'internal' | 'client' | 'candidate' = 'client';
    const codeToCheck = (roleCode || '').toLowerCase();
    
    if (codeToCheck.includes('super') || codeToCheck.includes('admin') || 
        codeToCheck.includes('internal') || codeToCheck === 'platform_admin') {
      category = 'internal';
    } else if (codeToCheck.includes('candidate')) {
      category = 'candidate';
    }
    
    role = {
      id: (typeof ssoRole === 'object' ? ssoRole?.id : roleCode) || roleCode || 'unknown',
      code: roleCode || (typeof ssoRole === 'string' ? ssoRole : 'unknown'),
      name: roleName || roleCode || 'Unknown Role',
      category: (roleCategory as 'internal' | 'client' | 'candidate') || category
    };
    
    permissions = userProfile.permissions || ROLE_PERMISSIONS[role.code] || [];
    console.log('[AuthContext] Mapped role:', role);
  } else {
    console.log('[AuthContext] No role in SSO profile');
  }
  
  // Handle organization - SSO might return it in different formats
  const ssoOrg = userProfile.organization;
  const orgId = userProfile.organization_id || userProfile.organizationId || userProfile.org_id || (typeof ssoOrg === 'object' ? ssoOrg?.id : undefined);
  const orgName = userProfile.organization_name || userProfile.organizationName || userProfile.org_name || (typeof ssoOrg === 'object' ? ssoOrg?.name : undefined);
  const orgSlug = userProfile.organization_slug || userProfile.organizationSlug || userProfile.org_slug || (typeof ssoOrg === 'object' ? ssoOrg?.slug : undefined);
  const orgType = userProfile.organization_type || userProfile.organizationType || userProfile.org_type || (typeof ssoOrg === 'object' ? ssoOrg?.type : undefined);
  
  console.log('[AuthContext] Extracted org data:', { orgId, orgName, orgSlug, orgType, ssoOrg });
  
  if (orgId || ssoOrg) {
    // Determine org type based on org name/slug if not provided
    let type: 'internal' | 'client' = 'client';
    const nameToCheck = (orgName || orgSlug || '').toLowerCase();
    if (nameToCheck.includes('teamified') || nameToCheck.includes('internal')) {
      type = 'internal';
    }
    
    organization = {
      id: orgId || (typeof ssoOrg === 'string' ? ssoOrg : 'unknown'),
      name: orgName || 'Unknown Organization',
      slug: orgSlug || orgName?.toLowerCase().replace(/\s+/g, '-') || 'unknown',
      type: (orgType as 'internal' | 'client') || type
    };
    console.log('[AuthContext] Mapped organization:', organization);
  } else {
    console.log('[AuthContext] No organization in SSO profile');
  }
  
  return { role, permissions, organization };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const updateRBACFromProfile = useCallback((userProfile: UserProfile) => {
    const { role: mappedRole, permissions: mappedPermissions, organization: mappedOrg } = 
      mapSSODataToRBAC(userProfile);
    
    setRole(mappedRole);
    setPermissions(mappedPermissions);
    setOrganization(mappedOrg);
    
    console.log('[AuthContext] RBAC loaded from SSO:', {
      roleCode: mappedRole?.code,
      roleCategory: mappedRole?.category,
      orgType: mappedOrg?.type,
      orgName: mappedOrg?.name,
      permissions: mappedPermissions.length
    });
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('[AuthContext] Initializing authentication...');
        
        const token = getStoredToken();
        if (!token) {
          console.log('[AuthContext] No stored token found');
          setIsLoading(false);
          return;
        }

        const userProfile = await validateToken(token);
        if (userProfile) {
          setUser(userProfile);
          storeUserProfile(userProfile);
          updateRBACFromProfile(userProfile);
          console.log('[AuthContext] Session restored for user:', userProfile.email);
        } else {
          console.warn('[AuthContext] Token validation failed, keeping session for retry');
          setUser(null);
        }
      } catch (error) {
        console.error('[AuthContext] Session initialization failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [updateRBACFromProfile]);

  const login = async () => {
    try {
      await initiateLogin();
    } catch (error) {
      console.error('[AuthContext] Login failed:', error);
      throw error;
    }
  };

  const loginDemo = () => {
    const demoUser: UserProfile = {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'clint.barton@starkindustries.com',
      name: 'Clint Barton',
      avatar: undefined,
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
      }
    };
    
    setUser(demoUser);
    storeUserProfile(demoUser);
    sessionStorage.setItem('demo_mode', 'true');
    sessionStorage.setItem('auth_access_token', 'demo-token');
    
    updateRBACFromProfile(demoUser);
    
    console.log('[AuthContext] Demo mode activated as Client Recruiter');
  };

  const loginAdmin = () => {
    const adminUser: UserProfile = {
      id: '00000000-0000-0000-0000-000000000002',
      email: 'admin@teamified.com',
      name: 'Admin User',
      avatar: undefined,
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
      }
    };
    
    setUser(adminUser);
    storeUserProfile(adminUser);
    sessionStorage.setItem('demo_mode', 'true');
    sessionStorage.setItem('auth_access_token', 'admin-token');
    
    updateRBACFromProfile(adminUser);
    
    console.log('[AuthContext] Admin mode activated as Super Admin');
  };

  const logout = () => {
    setUser(null);
    setRole(null);
    setPermissions([]);
    setOrganization(null);
    
    sessionStorage.removeItem('demo_mode');
    sessionStorage.removeItem('selectedOrganizationId');
    sessionStorage.removeItem('auth_access_token');
    sessionStorage.removeItem('auth_refresh_token');
    sessionStorage.removeItem('auth_expires_at');
    sessionStorage.removeItem('auth_user_profile');
    sessionStorage.clear();
    
    console.log('[AuthContext] User logged out, all session data cleared');
    
    window.location.href = '/';
  };

  const refreshUser = async () => {
    const token = getStoredToken();
    if (!token) {
      throw new Error('No access token found');
    }

    const userProfile = await validateToken(token);
    if (userProfile) {
      setUser(userProfile);
      storeUserProfile(userProfile);
      updateRBACFromProfile(userProfile);
    } else {
      setUser(null);
      throw new Error('Token validation failed');
    }
  };

  const hasPermission = useCallback((permission: string): boolean => {
    return permissions.includes(permission);
  }, [permissions]);

  const hasAnyPermission = useCallback((requiredPermissions: string[]): boolean => {
    return requiredPermissions.some(p => permissions.includes(p));
  }, [permissions]);

  const hasAllPermissions = useCallback((requiredPermissions: string[]): boolean => {
    return requiredPermissions.every(p => permissions.includes(p));
  }, [permissions]);

  const hasRole = useCallback((roleCode: string): boolean => {
    return role?.code === roleCode;
  }, [role]);

  const isInternalUser = useCallback((): boolean => {
    console.log('[AuthContext] isInternalUser check:', {
      roleCode: role?.code,
      roleName: role?.name,
      roleCategory: role?.category,
      orgType: organization?.type
    });
    
    // Check organization type
    if (organization?.type === 'internal') {
      console.log('[AuthContext] isInternalUser: TRUE (org type is internal)');
      return true;
    }
    
    // Check role category
    if (role?.category === 'internal') {
      console.log('[AuthContext] isInternalUser: TRUE (role category is internal)');
      return true;
    }
    
    // Check known internal role codes (case-insensitive, handle spaces/underscores)
    const internalRoleCodes = [
      'super_admin', 'superadmin', 'admin', 
      'internal_hr', 'internalhr',
      'internal_recruiter', 'internalrecruiter',
      'internal_account_manager', 'internalaccountmanager',
      'internal_finance', 'internalfinance',
      'internal_marketing', 'internalmarketing',
      'internal_hiring_manager', 'internalhiringmanager',
      'platform_admin', 'platformadmin'
    ];
    
    if (role?.code) {
      const normalizedCode = role.code.toLowerCase().replace(/[\s-]/g, '_');
      const normalizedCodeNoSeparator = role.code.toLowerCase().replace(/[\s_-]/g, '');
      console.log('[AuthContext] Checking role code:', { original: role.code, normalized: normalizedCode, noSep: normalizedCodeNoSeparator });
      if (internalRoleCodes.includes(normalizedCode) || internalRoleCodes.includes(normalizedCodeNoSeparator)) {
        console.log('[AuthContext] isInternalUser: TRUE (role code matches)');
        return true;
      }
    }
    
    // Check if role name contains "internal" or "super" or "admin"
    if (role?.name) {
      const lowerName = role.name.toLowerCase();
      if (lowerName.includes('internal') || lowerName.includes('super admin') || lowerName === 'admin') {
        console.log('[AuthContext] isInternalUser: TRUE (role name matches)');
        return true;
      }
    }
    
    console.log('[AuthContext] isInternalUser: FALSE');
    return false;
  }, [organization, role]);

  const isClientUser = useCallback((): boolean => {
    return organization?.type === 'client' || role?.category === 'client';
  }, [organization, role]);

  const value: AuthContextType = {
    user,
    role,
    permissions,
    organization,
    isAuthenticated: !!user,
    isLoading,
    login,
    loginDemo,
    loginAdmin,
    logout,
    refreshUser,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    isInternalUser,
    isClientUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
