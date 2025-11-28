import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  permissions?: string[];
  roles?: string[];
  requireAll?: boolean;
  fallback?: ReactNode;
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  permissions = [],
  roles = [],
  requireAll = false,
  fallback,
  redirectTo = '/'
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, hasPermission, hasAnyPermission, hasAllPermissions, hasRole } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  let hasAccess = true;

  if (permissions.length > 0) {
    if (requireAll) {
      hasAccess = hasAllPermissions(permissions);
    } else {
      hasAccess = hasAnyPermission(permissions);
    }
  }

  if (hasAccess && roles.length > 0) {
    hasAccess = roles.some(role => hasRole(role));
  }

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h2>
          <p className="text-gray-600 dark:text-gray-400">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

interface RequirePermissionProps {
  permission: string | string[];
  children: ReactNode;
  fallback?: ReactNode;
  requireAll?: boolean;
}

export function RequirePermission({ permission, children, fallback = null, requireAll = false }: RequirePermissionProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = useAuth();

  const permissions = Array.isArray(permission) ? permission : [permission];
  
  let hasAccess = false;
  if (requireAll) {
    hasAccess = hasAllPermissions(permissions);
  } else if (permissions.length === 1) {
    hasAccess = hasPermission(permissions[0]);
  } else {
    hasAccess = hasAnyPermission(permissions);
  }

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

interface RequireRoleProps {
  role: string | string[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function RequireRole({ role, children, fallback = null }: RequireRoleProps) {
  const { hasRole } = useAuth();

  const roles = Array.isArray(role) ? role : [role];
  const hasAccess = roles.some(r => hasRole(r));

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

interface RequireInternalUserProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function RequireInternalUser({ children, fallback = null }: RequireInternalUserProps) {
  const { isInternalUser } = useAuth();

  if (!isInternalUser()) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

interface RequireClientUserProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function RequireClientUser({ children, fallback = null }: RequireClientUserProps) {
  const { isClientUser } = useAuth();

  if (!isClientUser()) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
