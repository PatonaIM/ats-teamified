import { query } from '../db.js';

async function createRBACTables() {
  try {
    console.log('🔧 Creating RBAC system tables...');

    await query(`
      CREATE TABLE IF NOT EXISTS organizations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(100) UNIQUE NOT NULL,
        type VARCHAR(50) NOT NULL CHECK (type IN ('internal', 'client')),
        status VARCHAR(50) DEFAULT 'active',
        settings JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ organizations table created');

    await query(`
      CREATE TABLE IF NOT EXISTS roles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        scope VARCHAR(50) NOT NULL CHECK (scope IN ('global', 'organization')),
        hierarchy_level INTEGER NOT NULL,
        is_system BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ roles table created');

    await query(`
      CREATE TABLE IF NOT EXISTS permissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(100) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        resource VARCHAR(50) NOT NULL,
        action VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ permissions table created');

    await query(`
      CREATE TABLE IF NOT EXISTS role_permissions (
        role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
        permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
        PRIMARY KEY (role_id, permission_id)
      );
    `);
    console.log('✅ role_permissions table created');

    await query(`
      CREATE TABLE IF NOT EXISTS user_organizations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(255) NOT NULL,
        user_email VARCHAR(255) NOT NULL,
        user_name VARCHAR(255),
        organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
        is_default BOOLEAN DEFAULT false,
        joined_at TIMESTAMP DEFAULT NOW(),
        UNIQUE (user_id, organization_id)
      );
    `);
    console.log('✅ user_organizations table created');

    await query(`
      CREATE TABLE IF NOT EXISTS user_role_assignments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_organization_id UUID REFERENCES user_organizations(id) ON DELETE CASCADE,
        role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
        assigned_by VARCHAR(255),
        assigned_at TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP,
        UNIQUE (user_organization_id, role_id)
      );
    `);
    console.log('✅ user_role_assignments table created');

    await query(`CREATE INDEX IF NOT EXISTS idx_user_orgs_user_id ON user_organizations(user_id);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_user_orgs_email ON user_organizations(user_email);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_role_assignments_user_org ON user_role_assignments(user_organization_id);`);
    console.log('✅ Indexes created');

    console.log('🎉 RBAC tables created successfully!');
  } catch (error) {
    console.error('❌ Error creating RBAC tables:', error);
    throw error;
  }
}

async function seedRoles() {
  try {
    console.log('🌱 Seeding roles...');

    const roles = [
      { code: 'super_admin', name: 'Super Admin', description: 'Full platform access', scope: 'global', hierarchy_level: 1 },
      { code: 'internal_hr', name: 'Internal HR', description: 'Global HR operations', scope: 'global', hierarchy_level: 2 },
      { code: 'internal_recruiter', name: 'Internal Recruiter', description: 'Recruiting & ATS management', scope: 'global', hierarchy_level: 3 },
      { code: 'internal_account_manager', name: 'Internal Account Manager', description: 'Client relationship management', scope: 'global', hierarchy_level: 3 },
      { code: 'internal_finance', name: 'Internal Finance', description: 'Financial operations', scope: 'global', hierarchy_level: 3 },
      { code: 'internal_marketing', name: 'Internal Marketing', description: 'Marketing analytics (view-only)', scope: 'global', hierarchy_level: 4 },
      { code: 'client_admin', name: 'Client Admin', description: 'Full organization access', scope: 'organization', hierarchy_level: 1 },
      { code: 'client_hr', name: 'Client HR', description: 'HR operations for organization', scope: 'organization', hierarchy_level: 2 },
      { code: 'client_recruiter', name: 'Client Recruiter', description: 'Recruitment management', scope: 'organization', hierarchy_level: 3 },
      { code: 'client_finance', name: 'Client Finance', description: 'Finance operations', scope: 'organization', hierarchy_level: 3 },
      { code: 'client_employee', name: 'Client Employee', description: 'Team member (limited access)', scope: 'organization', hierarchy_level: 4 },
    ];

    for (const role of roles) {
      await query(`
        INSERT INTO roles (code, name, description, scope, hierarchy_level)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (code) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          scope = EXCLUDED.scope,
          hierarchy_level = EXCLUDED.hierarchy_level
      `, [role.code, role.name, role.description, role.scope, role.hierarchy_level]);
    }

    console.log(`✅ Seeded ${roles.length} roles`);
  } catch (error) {
    console.error('❌ Error seeding roles:', error);
    throw error;
  }
}

async function seedPermissions() {
  try {
    console.log('🌱 Seeding permissions...');

    const permissions = [
      { code: 'manage_platform_settings', name: 'Manage Platform Settings', resource: 'platform', action: 'manage' },
      { code: 'manage_all_organizations', name: 'Manage All Organizations', resource: 'organizations', action: 'manage' },
      { code: 'view_all_organizations', name: 'View All Organizations', resource: 'organizations', action: 'view' },
      { code: 'manage_internal_users', name: 'Manage Internal Users', resource: 'users', action: 'manage' },
      { code: 'view_platform_analytics', name: 'View Platform Analytics', resource: 'analytics', action: 'view' },
      { code: 'create_job', name: 'Create Job', resource: 'jobs', action: 'create' },
      { code: 'edit_job', name: 'Edit Job', resource: 'jobs', action: 'edit' },
      { code: 'delete_job', name: 'Delete Job', resource: 'jobs', action: 'delete' },
      { code: 'publish_job', name: 'Publish Job', resource: 'jobs', action: 'publish' },
      { code: 'view_jobs', name: 'View Jobs', resource: 'jobs', action: 'view' },
      { code: 'approve_jobs', name: 'Approve Jobs', resource: 'jobs', action: 'approve' },
      { code: 'view_candidates', name: 'View Candidates', resource: 'candidates', action: 'view' },
      { code: 'manage_candidates', name: 'Manage Candidates', resource: 'candidates', action: 'manage' },
      { code: 'move_pipeline_stages', name: 'Move Pipeline Stages', resource: 'candidates', action: 'move' },
      { code: 'schedule_interviews', name: 'Schedule Interviews', resource: 'interviews', action: 'schedule' },
      { code: 'view_candidate_documents', name: 'View Candidate Documents', resource: 'documents', action: 'view' },
      { code: 'download_resumes', name: 'Download Resumes', resource: 'documents', action: 'download' },
      { code: 'manage_interview_availability', name: 'Manage Interview Availability', resource: 'interviews', action: 'manage_availability' },
      { code: 'assign_interviewers', name: 'Assign Interviewers', resource: 'interviews', action: 'assign' },
      { code: 'view_interview_results', name: 'View Interview Results', resource: 'interviews', action: 'view_results' },
      { code: 'submit_interview_feedback', name: 'Submit Interview Feedback', resource: 'interviews', action: 'feedback' },
      { code: 'view_global_analytics', name: 'View Global Analytics', resource: 'analytics', action: 'view_global' },
      { code: 'view_org_analytics', name: 'View Organization Analytics', resource: 'analytics', action: 'view_org' },
      { code: 'export_reports', name: 'Export Reports', resource: 'reports', action: 'export' },
      { code: 'manage_billing', name: 'Manage Billing', resource: 'billing', action: 'manage' },
      { code: 'view_invoices', name: 'View Invoices', resource: 'billing', action: 'view' },
      { code: 'manage_contracts', name: 'Manage Contracts', resource: 'contracts', action: 'manage' },
      { code: 'view_contracts', name: 'View Contracts', resource: 'contracts', action: 'view' },
      { code: 'manage_org_users', name: 'Manage Organization Users', resource: 'org_users', action: 'manage' },
      { code: 'invite_users', name: 'Invite Users', resource: 'org_users', action: 'invite' },
      { code: 'assign_roles', name: 'Assign Roles', resource: 'org_users', action: 'assign_roles' },
      { code: 'view_org_users', name: 'View Organization Users', resource: 'org_users', action: 'view' },
      { code: 'manage_pipeline_templates', name: 'Manage Pipeline Templates', resource: 'pipelines', action: 'manage' },
      { code: 'view_pipeline_templates', name: 'View Pipeline Templates', resource: 'pipelines', action: 'view' },
    ];

    for (const perm of permissions) {
      await query(`
        INSERT INTO permissions (code, name, description, resource, action)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (code) DO UPDATE SET
          name = EXCLUDED.name,
          resource = EXCLUDED.resource,
          action = EXCLUDED.action
      `, [perm.code, perm.name, perm.description || '', perm.resource, perm.action]);
    }

    console.log(`✅ Seeded ${permissions.length} permissions`);
  } catch (error) {
    console.error('❌ Error seeding permissions:', error);
    throw error;
  }
}

async function seedRolePermissions() {
  try {
    console.log('🌱 Seeding role-permission mappings...');

    const rolePermissions = {
      'super_admin': [
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
      'internal_hr': [
        'view_all_organizations', 'view_platform_analytics', 'create_job', 'edit_job',
        'publish_job', 'view_jobs', 'view_candidates', 'manage_candidates',
        'move_pipeline_stages', 'schedule_interviews', 'view_candidate_documents',
        'download_resumes', 'manage_interview_availability', 'assign_interviewers',
        'view_interview_results', 'submit_interview_feedback', 'view_org_analytics',
        'view_org_users', 'view_pipeline_templates'
      ],
      'internal_recruiter': [
        'view_all_organizations', 'view_platform_analytics', 'create_job', 'edit_job',
        'delete_job', 'publish_job', 'view_jobs', 'approve_jobs', 'view_candidates',
        'manage_candidates', 'move_pipeline_stages', 'schedule_interviews',
        'view_candidate_documents', 'download_resumes', 'manage_interview_availability',
        'assign_interviewers', 'view_interview_results', 'submit_interview_feedback',
        'view_org_analytics', 'view_org_users', 'manage_pipeline_templates',
        'view_pipeline_templates'
      ],
      'internal_account_manager': [
        'manage_all_organizations', 'view_all_organizations', 'view_platform_analytics',
        'view_jobs', 'view_candidates', 'view_candidate_documents', 'view_interview_results',
        'view_org_analytics', 'manage_org_users', 'invite_users', 'assign_roles',
        'view_org_users', 'view_pipeline_templates'
      ],
      'internal_finance': [
        'view_all_organizations', 'view_platform_analytics', 'manage_billing',
        'view_invoices', 'manage_contracts', 'view_contracts', 'view_org_analytics',
        'export_reports'
      ],
      'internal_marketing': [
        'view_all_organizations', 'view_platform_analytics', 'view_jobs',
        'view_global_analytics', 'view_org_analytics'
      ],
      'client_admin': [
        'create_job', 'edit_job', 'delete_job', 'publish_job', 'view_jobs', 'approve_jobs',
        'view_candidates', 'manage_candidates', 'move_pipeline_stages', 'schedule_interviews',
        'view_candidate_documents', 'download_resumes', 'manage_interview_availability',
        'assign_interviewers', 'view_interview_results', 'submit_interview_feedback',
        'view_org_analytics', 'export_reports', 'view_invoices', 'view_contracts',
        'manage_org_users', 'invite_users', 'assign_roles', 'view_org_users',
        'manage_pipeline_templates', 'view_pipeline_templates'
      ],
      'client_hr': [
        'create_job', 'edit_job', 'publish_job', 'view_jobs', 'view_candidates',
        'manage_candidates', 'move_pipeline_stages', 'schedule_interviews',
        'view_candidate_documents', 'download_resumes', 'manage_interview_availability',
        'assign_interviewers', 'view_interview_results', 'submit_interview_feedback',
        'view_org_analytics', 'view_org_users', 'view_pipeline_templates'
      ],
      'client_recruiter': [
        'create_job', 'edit_job', 'publish_job', 'view_jobs', 'view_candidates',
        'manage_candidates', 'move_pipeline_stages', 'schedule_interviews',
        'view_candidate_documents', 'download_resumes', 'assign_interviewers',
        'view_interview_results', 'submit_interview_feedback', 'view_org_users',
        'view_pipeline_templates'
      ],
      'client_finance': [
        'view_jobs', 'view_org_analytics', 'export_reports', 'view_invoices',
        'view_contracts', 'view_org_users'
      ],
      'client_employee': [
        'view_jobs', 'view_interview_results', 'submit_interview_feedback', 'view_org_users'
      ]
    };

    for (const [roleCode, permCodes] of Object.entries(rolePermissions)) {
      const roleResult = await query(`SELECT id FROM roles WHERE code = $1`, [roleCode]);
      if (roleResult.rows.length === 0) continue;
      const roleId = roleResult.rows[0].id;

      for (const permCode of permCodes) {
        const permResult = await query(`SELECT id FROM permissions WHERE code = $1`, [permCode]);
        if (permResult.rows.length === 0) continue;
        const permId = permResult.rows[0].id;

        await query(`
          INSERT INTO role_permissions (role_id, permission_id)
          VALUES ($1, $2)
          ON CONFLICT (role_id, permission_id) DO NOTHING
        `, [roleId, permId]);
      }
    }

    console.log('✅ Role-permission mappings seeded');
  } catch (error) {
    console.error('❌ Error seeding role-permissions:', error);
    throw error;
  }
}

async function seedOrganizations() {
  try {
    console.log('🌱 Seeding organizations...');

    const organizations = [
      { name: 'Teamified', slug: 'teamified', type: 'internal' },
      { name: 'Stark Industries Inc.', slug: 'stark-industries', type: 'client' },
    ];

    for (const org of organizations) {
      await query(`
        INSERT INTO organizations (name, slug, type)
        VALUES ($1, $2, $3)
        ON CONFLICT (slug) DO UPDATE SET
          name = EXCLUDED.name,
          type = EXCLUDED.type
      `, [org.name, org.slug, org.type]);
    }

    console.log(`✅ Seeded ${organizations.length} organizations`);
  } catch (error) {
    console.error('❌ Error seeding organizations:', error);
    throw error;
  }
}

async function seedTestUsers() {
  try {
    console.log('🌱 Seeding test user accounts...');

    const teamifiedOrg = await query(`SELECT id FROM organizations WHERE slug = 'teamified'`);
    const starkOrg = await query(`SELECT id FROM organizations WHERE slug = 'stark-industries'`);

    if (teamifiedOrg.rows.length === 0 || starkOrg.rows.length === 0) {
      console.log('⚠️ Organizations not found, skipping user seeding');
      return;
    }

    const teamifiedId = teamifiedOrg.rows[0].id;
    const starkId = starkOrg.rows[0].id;

    const internalUsers = [
      { email: 'admin@teamified.com', name: 'Admin User', role: 'super_admin' },
      { email: 'sarah.chen@teamified.com', name: 'Sarah Chen', role: 'internal_hr' },
      { email: 'marcus.johnson@teamified.com', name: 'Marcus Johnson', role: 'internal_recruiter' },
      { email: 'elena.rodriguez@teamified.com', name: 'Elena Rodriguez', role: 'internal_account_manager' },
      { email: 'david.kim@teamified.com', name: 'David Kim', role: 'internal_finance' },
      { email: 'lisa.wong@teamified.com', name: 'Lisa Wong', role: 'internal_marketing' },
    ];

    const clientUsers = [
      { email: 'tony.stark@starkindustries.com', name: 'Tony Stark', role: 'client_admin' },
      { email: 'nick.fury@starkindustries.com', name: 'Nick Fury', role: 'client_admin' },
      { email: 'steve.rogers@starkindustries.com', name: 'Steve Rogers', role: 'client_hr' },
      { email: 'clint.barton@starkindustries.com', name: 'Clint Barton', role: 'client_recruiter' },
      { email: 'natasha.romanoff@starkindustries.com', name: 'Natasha Romanoff', role: 'client_finance' },
      { email: 'pepper.potts@starkindustries.com', name: 'Pepper Potts', role: 'client_employee' },
      { email: 'peter.parker@starkindustries.com', name: 'Peter Parker', role: 'client_employee' },
      { email: 'bruce.banner@starkindustries.com', name: 'Bruce Banner', role: 'client_employee' },
    ];

    for (const user of internalUsers) {
      const userOrgResult = await query(`
        INSERT INTO user_organizations (user_id, user_email, user_name, organization_id, is_default)
        VALUES ($1, $2, $3, $4, true)
        ON CONFLICT (user_id, organization_id) DO UPDATE SET
          user_email = EXCLUDED.user_email,
          user_name = EXCLUDED.user_name
        RETURNING id
      `, [user.email, user.email, user.name, teamifiedId]);

      const roleResult = await query(`SELECT id FROM roles WHERE code = $1`, [user.role]);
      if (roleResult.rows.length > 0 && userOrgResult.rows.length > 0) {
        await query(`
          INSERT INTO user_role_assignments (user_organization_id, role_id)
          VALUES ($1, $2)
          ON CONFLICT (user_organization_id, role_id) DO NOTHING
        `, [userOrgResult.rows[0].id, roleResult.rows[0].id]);
      }
    }

    for (const user of clientUsers) {
      const userOrgResult = await query(`
        INSERT INTO user_organizations (user_id, user_email, user_name, organization_id, is_default)
        VALUES ($1, $2, $3, $4, true)
        ON CONFLICT (user_id, organization_id) DO UPDATE SET
          user_email = EXCLUDED.user_email,
          user_name = EXCLUDED.user_name
        RETURNING id
      `, [user.email, user.email, user.name, starkId]);

      const roleResult = await query(`SELECT id FROM roles WHERE code = $1`, [user.role]);
      if (roleResult.rows.length > 0 && userOrgResult.rows.length > 0) {
        await query(`
          INSERT INTO user_role_assignments (user_organization_id, role_id)
          VALUES ($1, $2)
          ON CONFLICT (user_organization_id, role_id) DO NOTHING
        `, [userOrgResult.rows[0].id, roleResult.rows[0].id]);
      }
    }

    console.log(`✅ Seeded ${internalUsers.length + clientUsers.length} test users`);
  } catch (error) {
    console.error('❌ Error seeding test users:', error);
    throw error;
  }
}

export async function runRBACMigration() {
  try {
    await createRBACTables();
    await seedRoles();
    await seedPermissions();
    await seedRolePermissions();
    await seedOrganizations();
    await seedTestUsers();
    console.log('🎉 RBAC migration completed successfully!');
  } catch (error) {
    console.error('❌ RBAC migration failed:', error);
    throw error;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runRBACMigration()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
