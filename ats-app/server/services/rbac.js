import { query } from '../db.js';

export async function getUserRoleAndPermissions(userEmail) {
  try {
    const result = await query(`
      SELECT 
        uo.id as user_org_id,
        uo.user_id,
        uo.user_email,
        uo.user_name,
        o.id as organization_id,
        o.name as organization_name,
        o.slug as organization_slug,
        o.type as organization_type,
        r.id as role_id,
        r.code as role_code,
        r.name as role_name,
        r.scope as role_scope,
        r.hierarchy_level,
        COALESCE(
          array_agg(DISTINCT p.code) FILTER (WHERE p.code IS NOT NULL),
          ARRAY[]::VARCHAR[]
        ) as permissions
      FROM user_organizations uo
      JOIN organizations o ON uo.organization_id = o.id
      LEFT JOIN user_role_assignments ura ON uo.id = ura.user_organization_id
      LEFT JOIN roles r ON ura.role_id = r.id
      LEFT JOIN role_permissions rp ON r.id = rp.role_id
      LEFT JOIN permissions p ON rp.permission_id = p.id
      WHERE uo.user_email = $1
        AND (ura.expires_at IS NULL OR ura.expires_at > NOW())
      GROUP BY uo.id, uo.user_id, uo.user_email, uo.user_name, 
               o.id, o.name, o.slug, o.type,
               r.id, r.code, r.name, r.scope, r.hierarchy_level
    `, [userEmail]);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    
    return {
      userId: row.user_id,
      email: row.user_email,
      name: row.user_name,
      organization: {
        id: row.organization_id,
        name: row.organization_name,
        slug: row.organization_slug,
        type: row.organization_type
      },
      role: row.role_code ? {
        id: row.role_id,
        code: row.role_code,
        name: row.role_name,
        scope: row.role_scope,
        hierarchyLevel: row.hierarchy_level
      } : null,
      permissions: row.permissions || []
    };
  } catch (error) {
    console.error('[RBAC] Error getting user role and permissions:', error);
    throw error;
  }
}

export async function checkUserPermission(userEmail, requiredPermission) {
  try {
    const userInfo = await getUserRoleAndPermissions(userEmail);
    if (!userInfo || !userInfo.permissions) {
      return false;
    }
    return userInfo.permissions.includes(requiredPermission);
  } catch (error) {
    console.error('[RBAC] Error checking permission:', error);
    return false;
  }
}

export async function checkUserPermissions(userEmail, requiredPermissions, mode = 'allOf') {
  try {
    const userInfo = await getUserRoleAndPermissions(userEmail);
    if (!userInfo || !userInfo.permissions) {
      return false;
    }

    if (mode === 'anyOf') {
      return requiredPermissions.some(p => userInfo.permissions.includes(p));
    } else {
      return requiredPermissions.every(p => userInfo.permissions.includes(p));
    }
  } catch (error) {
    console.error('[RBAC] Error checking permissions:', error);
    return false;
  }
}

export async function getUsersByOrganization(organizationId) {
  try {
    const result = await query(`
      SELECT 
        uo.user_id,
        uo.user_email,
        uo.user_name,
        uo.joined_at,
        r.code as role_code,
        r.name as role_name
      FROM user_organizations uo
      LEFT JOIN user_role_assignments ura ON uo.id = ura.user_organization_id
      LEFT JOIN roles r ON ura.role_id = r.id
      WHERE uo.organization_id = $1
      ORDER BY uo.joined_at DESC
    `, [organizationId]);

    return result.rows;
  } catch (error) {
    console.error('[RBAC] Error getting organization users:', error);
    throw error;
  }
}

export async function getAllRoles() {
  try {
    const result = await query(`
      SELECT id, code, name, description, scope, hierarchy_level
      FROM roles
      ORDER BY scope, hierarchy_level
    `);
    return result.rows;
  } catch (error) {
    console.error('[RBAC] Error getting roles:', error);
    throw error;
  }
}

export async function getAllPermissions() {
  try {
    const result = await query(`
      SELECT id, code, name, description, resource, action
      FROM permissions
      ORDER BY resource, action
    `);
    return result.rows;
  } catch (error) {
    console.error('[RBAC] Error getting permissions:', error);
    throw error;
  }
}

export async function isInternalUser(userEmail) {
  try {
    const userInfo = await getUserRoleAndPermissions(userEmail);
    return userInfo?.organization?.type === 'internal';
  } catch (error) {
    console.error('[RBAC] Error checking if internal user:', error);
    return false;
  }
}

export async function createOrUpdateUserRole(userEmail, userName, organizationSlug, roleCode, assignedBy) {
  try {
    const orgResult = await query(`SELECT id FROM organizations WHERE slug = $1`, [organizationSlug]);
    if (orgResult.rows.length === 0) {
      throw new Error(`Organization not found: ${organizationSlug}`);
    }
    const organizationId = orgResult.rows[0].id;

    const roleResult = await query(`SELECT id FROM roles WHERE code = $1`, [roleCode]);
    if (roleResult.rows.length === 0) {
      throw new Error(`Role not found: ${roleCode}`);
    }
    const roleId = roleResult.rows[0].id;

    const userOrgResult = await query(`
      INSERT INTO user_organizations (user_id, user_email, user_name, organization_id, is_default)
      VALUES ($1, $2, $3, $4, true)
      ON CONFLICT (user_id, organization_id) DO UPDATE SET
        user_email = EXCLUDED.user_email,
        user_name = EXCLUDED.user_name
      RETURNING id
    `, [userEmail, userEmail, userName, organizationId]);

    const userOrgId = userOrgResult.rows[0].id;

    await query(`
      DELETE FROM user_role_assignments WHERE user_organization_id = $1
    `, [userOrgId]);

    await query(`
      INSERT INTO user_role_assignments (user_organization_id, role_id, assigned_by)
      VALUES ($1, $2, $3)
    `, [userOrgId, roleId, assignedBy]);

    return await getUserRoleAndPermissions(userEmail);
  } catch (error) {
    console.error('[RBAC] Error creating/updating user role:', error);
    throw error;
  }
}
