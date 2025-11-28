/**
 * Authentication Middleware
 * Validates bearer tokens with Teamified Accounts SSO
 */

const TEAMIFIED_SSO_URL = 'https://teamified-accounts.replit.app/api';
const USE_DEMO_MODE = false; // Disabled for SSO testing with actual users

/**
 * Middleware to authenticate requests using Teamified SSO bearer tokens
 * @param {*} req Express request object
 * @param {*} res Express response object
 * @param {*} next Express next function
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

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Demo mode: allow mock authentication for development
    if (USE_DEMO_MODE && token === 'demo-token') {
      console.log('[Auth Middleware] Demo mode: Accepting demo token');
      req.user = {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'demo@ats-platform.com',
        name: 'Demo Client',
        role: 'client',
        avatar: undefined
      };
      return next();
    }

    const response = await fetch(`${TEAMIFIED_SSO_URL}/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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

    req.user = {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      role: userData.role,
      avatar: userData.avatar
    };

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
 * Sets req.user if valid token exists, otherwise continues without user
 */
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    
    // No auth header - continue without user
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.substring(7);
    
    // Demo mode: allow mock authentication
    if (USE_DEMO_MODE && token === 'demo-token') {
      console.log('[Auth Middleware] Demo mode: Accepting demo token');
      req.user = {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'demo@ats-platform.com',
        name: 'Demo Client',
        role: 'client',
        avatar: undefined
      };
      return next();
    }

    const response = await fetch(`${TEAMIFIED_SSO_URL}/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      // Invalid token - continue without user
      console.warn('[Optional Auth] Token validation failed:', response.status);
      req.user = null;
      return next();
    }

    const userData = await response.json();

    if (userData && userData.id) {
      req.user = {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
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
 * Optional middleware for role-based access control
 * Usage: requireRole('client') or requireRole(['client', 'recruiter'])
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

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Access denied. Required role: ${roles.join(' or ')}`
      });
    }

    next();
  };
}

export {
  authenticateRequest,
  optionalAuth,
  requireRole
};
