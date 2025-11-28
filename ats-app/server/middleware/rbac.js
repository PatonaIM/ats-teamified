import { getUserRoleAndPermissions } from '../services/rbac.js';

export function requirePermissions(requiredPermissions, options = {}) {
  const { mode = 'allOf' } = options;

  return async (req, res, next) => {
    try {
      const userEmail = req.user?.email;
      
      if (!userEmail) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required'
        });
      }

      const userInfo = await getUserRoleAndPermissions(userEmail);
      
      if (!userInfo) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'User not found in RBAC system'
        });
      }

      const userPermissions = userInfo.permissions || [];
      let hasPermission = false;

      if (mode === 'anyOf') {
        hasPermission = requiredPermissions.some(p => userPermissions.includes(p));
      } else {
        hasPermission = requiredPermissions.every(p => userPermissions.includes(p));
      }

      if (!hasPermission) {
        console.log(`[RBAC] Access denied for ${userEmail}. Required: ${requiredPermissions.join(', ')}, Has: ${userPermissions.join(', ')}`);
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Insufficient permissions',
          required: requiredPermissions,
          mode
        });
      }

      req.rbac = userInfo;
      next();
    } catch (error) {
      console.error('[RBAC] Middleware error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Error checking permissions'
      });
    }
  };
}

export function requireRole(requiredRoles) {
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

  return async (req, res, next) => {
    try {
      const userEmail = req.user?.email;
      
      if (!userEmail) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required'
        });
      }

      const userInfo = await getUserRoleAndPermissions(userEmail);
      
      if (!userInfo || !userInfo.role) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'User role not found'
        });
      }

      if (!roles.includes(userInfo.role.code)) {
        console.log(`[RBAC] Role access denied for ${userEmail}. Required: ${roles.join(', ')}, Has: ${userInfo.role.code}`);
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Insufficient role',
          required: roles,
          current: userInfo.role.code
        });
      }

      req.rbac = userInfo;
      next();
    } catch (error) {
      console.error('[RBAC] Role middleware error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Error checking role'
      });
    }
  };
}

export function requireInternalUser() {
  return async (req, res, next) => {
    try {
      const userEmail = req.user?.email;
      
      if (!userEmail) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required'
        });
      }

      const userInfo = await getUserRoleAndPermissions(userEmail);
      
      if (!userInfo || userInfo.organization?.type !== 'internal') {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Internal user access required'
        });
      }

      req.rbac = userInfo;
      next();
    } catch (error) {
      console.error('[RBAC] Internal user check error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Error checking user type'
      });
    }
  };
}

export function enforceOrganization() {
  return async (req, res, next) => {
    try {
      const userEmail = req.user?.email;
      const requestedOrgId = req.params.orgId || req.query.organizationId || req.body?.organizationId;
      
      if (!userEmail) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required'
        });
      }

      const userInfo = await getUserRoleAndPermissions(userEmail);
      
      if (!userInfo) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'User not found'
        });
      }

      if (userInfo.organization?.type === 'internal') {
        req.rbac = userInfo;
        return next();
      }

      if (requestedOrgId && requestedOrgId !== userInfo.organization?.id) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Access to this organization is not allowed'
        });
      }

      req.rbac = userInfo;
      req.organizationId = userInfo.organization?.id;
      next();
    } catch (error) {
      console.error('[RBAC] Organization check error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Error checking organization access'
      });
    }
  };
}

export function attachPrincipal() {
  return async (req, res, next) => {
    try {
      const userEmail = req.user?.email;
      
      if (userEmail) {
        const userInfo = await getUserRoleAndPermissions(userEmail);
        req.rbac = userInfo;
      }
      
      next();
    } catch (error) {
      console.error('[RBAC] Error attaching principal:', error);
      next();
    }
  };
}
