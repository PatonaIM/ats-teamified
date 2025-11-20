import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from './db.js';
import OpenAI from 'openai';
import { postJobToLinkedIn, shouldAutoPostToLinkedIn, syncJobToLinkedIn, getLinkedInSyncStatus, retryLinkedInSync } from './services/linkedin.js';
import { getCandidates, getCandidateById, createCandidate, updateCandidate, addCandidateDocument, addCandidateCommunication, moveCandidateToStage, disqualifyCandidate, deleteCandidate } from './services/candidates.js';
import sanitizeHtml from 'sanitize-html';
import { randomUUID } from 'crypto';
import { authenticateRequest, optionalAuth, requireRole } from './middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Validate OpenAI API key on startup
if (!process.env.OPENAI_API_KEY) {
  console.error('❌ ERROR: OPENAI_API_KEY environment variable is not set.');
  console.error('   AI job description generation will not work.');
  console.error('   Please add OPENAI_API_KEY to your environment secrets.');
}

// LinkedIn Integration Feature Flag
const LINKEDIN_ENABLED = process.env.LINKEDIN_ENABLED === 'true';
console.log(`[LinkedIn] Integration ${LINKEDIN_ENABLED ? 'ENABLED' : 'DISABLED (mock mode)'}`);
if (LINKEDIN_ENABLED && (!process.env.LINKEDIN_CLIENT_ID || !process.env.LINKEDIN_CLIENT_SECRET)) {
  console.warn('⚠️  WARNING: LINKEDIN_ENABLED=true but credentials not configured.');
  console.warn('   LinkedIn posting will use mock implementation.');
}

// Workflow Builder Feature Flag
const WORKFLOW_BUILDER_ENABLED = process.env.WORKFLOW_BUILDER_ENABLED === 'true';
console.log(`[Workflow Builder] Feature ${WORKFLOW_BUILDER_ENABLED ? 'ENABLED ✅' : 'DISABLED 🔒 (add WORKFLOW_BUILDER_ENABLED=true to Replit Secrets to enable)'}`);

// Feature Flag Middleware
const requireWorkflowBuilder = (req, res, next) => {
  if (!WORKFLOW_BUILDER_ENABLED) {
    return res.status(403).json({ 
      error: 'Feature not enabled',
      message: 'Workflow Builder is currently disabled. Please contact your administrator.'
    });
  }
  next();
};

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'X-API-Key', 'X-Client-ID']
}));
app.use(express.json());

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Helper function to normalize employment type
const normalizeEmploymentType = (type) => {
  if (!type) return 'fullTime'; // default
  const normalized = type.toLowerCase().replace(/[-\s]/g, '');
  const mapping = {
    'fulltime': 'fullTime',
    'parttime': 'partTime',
    'contract': 'contract',
    'eor': 'eor'
  };
  return mapping[normalized] || 'fullTime';
};

app.get('/api/jobs', async (req, res) => {
  console.log('[Backend] Received /api/jobs request from:', req.headers['host'], req.headers['origin']);
  try {
    console.log('[Backend] Starting query...');
    const { employmentType, status, search} = req.query;
    
    let queryText = `
      WITH latest_approvals AS (
        SELECT *,
          ROW_NUMBER() OVER (PARTITION BY job_id ORDER BY created_at DESC) AS approval_rank
        FROM job_approvals
      )
      SELECT 
        j.id,
        j.title,
        j.employment_type,
        COALESCE(j.job_status, 'published') as status,
        j.department as company_name,
        CONCAT(j.city, ', ', j.country) as location,
        j.remote_flag as remote_ok,
        j.salary_from as salary_min,
        j.salary_to as salary_max,
        CONCAT(j.salary_currency, ' ', j.salary_text) as salary_display,
        j.description,
        j.requirements,
        j.benefits,
        j.created_at,
        j.updated_at,
        j.created_by_role,
        0 as candidate_count,
        0 as active_candidates,
        'HR Team' as recruiter_name,
        false as linkedin_synced,
        la.id as approval_id,
        la.status as approval_status,
        la.sla_deadline,
        CASE 
          WHEN la.sla_deadline IS NOT NULL AND la.sla_deadline < NOW() THEN 'overdue'
          WHEN la.sla_deadline IS NOT NULL AND la.sla_deadline < NOW() + INTERVAL '6 hours' THEN 'urgent'
          WHEN la.sla_deadline IS NOT NULL THEN 'normal'
          ELSE NULL
        END as approval_priority
      FROM jobs j
      LEFT JOIN latest_approvals la ON j.id = la.job_id AND la.approval_rank = 1
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;

    if (employmentType && employmentType !== 'all') {
      queryText += ` AND LOWER(REPLACE(employment_type, '-', '')) = $${paramIndex}`;
      params.push(employmentType.toLowerCase().replace(/[-\s]/g, ''));
      paramIndex++;
    }

    if (status && status !== 'all') {
      queryText += ` AND COALESCE(j.job_status, 'published') = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (search) {
      queryText += ` AND (j.title ILIKE $${paramIndex} OR j.department ILIKE $${paramIndex} OR (j.city || ', ' || j.country) ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    queryText += ' ORDER BY j.created_at DESC';

    console.log('[Backend] Executing DB query...');
    const result = await query(queryText, params);
    console.log('[Backend] Query returned', result.rows.length, 'jobs');
    
    // Normalize employment_type in response
    const normalizedJobs = result.rows.map(job => ({
      ...job,
      employment_type: normalizeEmploymentType(job.employment_type)
    }));
    
    console.log('[Backend] Sending response with', normalizedJobs.length, 'jobs');
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('X-Powered-By', 'Express');
    res.status(200).json({ jobs: normalizedJobs, total: normalizedJobs.length });
    console.log('[Backend] Response sent successfully');
  } catch (error) {
    console.error('[Backend] Error fetching jobs:', error);
    res.status(500).json({ error: 'Failed to fetch jobs', details: error.message });
  }
});

// Helper function to generate URL-safe slug from title
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100) + '-' + Date.now().toString(36);
}

app.post('/api/jobs', async (req, res) => {
  console.log('[Backend] Received POST /api/jobs request');
  try {
    const jobData = req.body;
    const saveAsDraft = jobData.saveAsDraft === true;
    const createdByRole = jobData.createdByRole || 'recruiter'; // 'client' or 'recruiter'
    
    // Validate required fields
    if (!jobData.title || !jobData.employmentType) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        message: 'Job title and employment type are required' 
      });
    }
    
    // Determine job status based on role and action
    // Map to Azure enum values: draft, published, closed, archived
    let jobStatus;
    if (saveAsDraft) {
      jobStatus = 'draft';
    } else if (createdByRole === 'client') {
      jobStatus = 'draft'; // Client jobs stay draft until approved (use created_by_role to distinguish)
    } else {
      jobStatus = 'published'; // Recruiter jobs go live immediately
    }
    
    // Convert camelCase employment type to database format
    const employmentTypeMap = {
      'fullTime': 'Full-time',
      'partTime': 'Part-time',
      'contract': 'Contract',
      'eor': 'EOR'
    };
    
    // Determine final department value
    const finalDepartment = jobData.department === 'Other' && jobData.departmentOther 
      ? jobData.departmentOther 
      : jobData.department;
    
    const insertQuery = `
      INSERT INTO jobs (
        title,
        slug,
        employment_type,
        description,
        requirements,
        department,
        experience_level,
        city,
        country,
        remote_flag,
        salary_from,
        salary_to,
        salary_currency,
        status,
        source,
        created_by_role,
        benefits,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `;
    
    const params = [
      jobData.title,
      generateSlug(jobData.title), // Auto-generate URL-safe slug
      employmentTypeMap[jobData.employmentType] || 'Full-time',
      jobData.description || '',
      jobData.requirements || '',
      finalDepartment || 'Engineering',
      jobData.experienceLevel || 'mid',
      jobData.city || 'Remote',
      jobData.country || 'Global',
      jobData.remoteFlag || false,
      jobData.salaryFrom ? parseInt(jobData.salaryFrom) : null,
      jobData.salaryTo ? parseInt(jobData.salaryTo) : null,
      jobData.salaryCurrency || 'USD',
      jobStatus,
      'internal_ats', // source: internal ATS system
      createdByRole,
      jobData.benefits || ''
    ];
    
    console.log('[Backend] Inserting new job:', jobData.title, '| Status:', jobStatus, '| Role:', createdByRole);
    const result = await query(insertQuery, params);
    
    const newJob = result.rows[0];
    console.log('[Backend] Job created successfully:', newJob.id);
    
    // Insert default pipeline stages
    if (jobData.pipelineStages && jobData.pipelineStages.length > 0) {
      console.log('[Backend] Inserting', jobData.pipelineStages.length, 'pipeline stages');
      
      for (const stage of jobData.pipelineStages) {
        await query(
          'INSERT INTO job_pipeline_stages (job_id, stage_name, stage_order, is_default) VALUES ($1, $2, $3, $4)',
          [newJob.id, stage.name, stage.order, true]
        );
      }
      console.log('[Backend] Pipeline stages inserted successfully');
    }
    
    // Create approval request if job submitted by Client (not saved as draft)
    if (createdByRole === 'client' && !saveAsDraft) {
      console.log('[Approval] Creating approval request for client job:', newJob.title);
      
      // Calculate SLA deadline (48 hours from now)
      const slaDeadline = new Date();
      slaDeadline.setHours(slaDeadline.getHours() + 48);
      
      try {
        const approvalInsert = `
          INSERT INTO job_approvals (
            job_id,
            submitter_id,
            status,
            sla_deadline,
            created_at
          ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
          RETURNING id
        `;
        
        const approvalResult = await query(approvalInsert, [
          newJob.id,
          'demo-user', // Since we don't have auth, use demo user
          'pending',
          slaDeadline
        ]);
        
        const approvalId = approvalResult.rows[0].id;
        
        // Log approval creation in history
        await query(`
          INSERT INTO approval_history (
            approval_id,
            job_id,
            action,
            user_id,
            details
          ) VALUES ($1, $2, $3, $4, $5)
        `, [
          approvalId,
          newJob.id,
          'submitted',
          'demo-user',
          JSON.stringify({ 
            jobTitle: newJob.title,
            employmentType: newJob.employment_type,
            submittedAt: new Date().toISOString()
          })
        ]);
        
        console.log('[Approval] Approval request created with ID:', approvalId);
        newJob.requiresApproval = true;
        newJob.approvalId = approvalId;
      } catch (approvalError) {
        console.error('[Approval] Failed to create approval request:', approvalError.message);
      }
    }
    
    // Automatic LinkedIn posting based on approval workflow
    if (shouldAutoPostToLinkedIn(newJob)) {
      console.log('[LinkedIn] Auto-posting job to LinkedIn:', newJob.title);
      try {
        await postJobToLinkedIn(newJob);
        newJob.linkedin_synced = true;
      } catch (linkedInError) {
        console.error('[LinkedIn] Failed to auto-post job:', linkedInError.message);
      }
    } else {
      console.log('[LinkedIn] Job requires approval before LinkedIn posting:', newJob.title);
    }
    
    // Return normalized job data
    const normalizedJob = {
      ...newJob,
      employment_type: normalizeEmploymentType(newJob.employment_type),
      company_name: newJob.department,
      location: `${newJob.city}, ${newJob.country}`,
      remote_ok: newJob.remote_ok,
      salary_min: newJob.salary_min,
      salary_max: newJob.salary_max,
      salary_display: newJob.salary_currency,
      candidate_count: 0,
      active_candidates: 0,
      recruiter_name: 'HR Team',
      linkedin_synced: newJob.linkedin_synced || false
    };
    
    res.status(201).json(normalizedJob);
  } catch (error) {
    console.error('[Backend] Error creating job:', error);
    res.status(500).json({ 
      error: 'Failed to create job',
      message: error.message 
    });
  }
});

app.get('/api/jobs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM jobs WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({ error: 'Failed to fetch job', details: error.message });
  }
});

// PUT /api/jobs/:id - Update job (status, details, etc.)
app.put('/api/jobs/:id', async (req, res) => {
  console.log('[Backend] Received PUT /api/jobs/:id request');
  const { id } = req.params;
  const updates = req.body;

  try {
    // Fetch current job
    const jobResult = await query('SELECT * FROM jobs WHERE id = $1', [id]);
    
    if (jobResult.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    const currentJob = jobResult.rows[0];
    console.log('[Backend] Current job:', { id, title: currentJob.title, job_status: currentJob.job_status, created_by_role: currentJob.created_by_role });

    // VALIDATION: Check if status change is allowed
    if (updates.job_status && updates.job_status !== currentJob.job_status) {
      console.log('[Backend] Status change requested:', currentJob.job_status, '→', updates.job_status);

      // Client jobs cannot be published directly - must go through approval
      if (currentJob.created_by_role === 'client' && updates.job_status === 'published') {
        return res.status(403).json({ 
          error: 'Client jobs require approval workflow. Cannot publish directly.',
          details: 'Please submit this job for approval instead.'
        });
      }

      // Only allow draft → published for recruiter jobs
      if (currentJob.job_status === 'draft' && updates.job_status === 'published') {
        if (!currentJob.created_by_role || currentJob.created_by_role === 'client') {
          return res.status(403).json({ 
            error: 'Only recruiter-created jobs can be published directly.',
            details: 'Client jobs must go through the approval workflow.'
          });
        }
      }
    }

    // Build dynamic UPDATE query
    const allowedFields = [
      'title', 'description', 'requirements', 'benefits',
      'employment_type', 'department', 'city', 'country', 'remote_flag',
      'salary_from', 'salary_to', 'salary_currency',
      'contract_duration', 'hours_per_week', 'timezone',
      'job_status'
    ];

    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    // Build SET clause dynamically
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updateFields.push(`${field} = $${paramIndex}`);
        values.push(updates[field]);
        paramIndex++;
      }
    }

    // Track who made the update and when
    updateFields.push(`updated_at = NOW()`);

    // If publishing, set published_at timestamp
    if (updates.job_status === 'published' && currentJob.job_status === 'draft') {
      updateFields.push(`published_at = NOW()`);
      console.log('[Backend] Publishing job - setting published_at timestamp');
    }

    if (updateFields.length === 1) { // Only updated_at
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    values.push(id); // For WHERE clause
    const updateQuery = `
      UPDATE jobs 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    console.log('[Backend] Updating job with fields:', Object.keys(updates));
    const result = await query(updateQuery, values);
    const updatedJob = result.rows[0];

    // AUDIT LOGGING - Track the update
    const auditLog = {
      job_id: id,
      action: updates.job_status === 'published' && currentJob.job_status === 'draft' ? 'published' : 'updated',
      previous_status: currentJob.job_status,
      new_status: updatedJob.job_status,
      updated_fields: Object.keys(updates),
      timestamp: new Date().toISOString()
    };
    console.log('[Backend] Audit log:', auditLog);

    // LINKEDIN POSTING TRIGGER - Auto-post when publishing
    if (updates.job_status === 'published' && currentJob.job_status === 'draft') {
      console.log('[Backend] Job published - checking LinkedIn posting eligibility');
      
      if (LINKEDIN_ENABLED && shouldAutoPostToLinkedIn(updatedJob)) {
        console.log('[LinkedIn] Triggering LinkedIn posting for published job:', updatedJob.title);
        try {
          await postJobToLinkedIn(updatedJob);
          updatedJob.linkedin_synced = true;
          
          // Update linkedin_synced flag in database
          await query(
            'UPDATE jobs SET linkedin_synced = true WHERE id = $1',
            [id]
          );
          
          console.log('[LinkedIn] Job posted to LinkedIn successfully');
        } catch (linkedInError) {
          console.error('[LinkedIn] Failed to post to LinkedIn:', linkedInError.message);
          // Don't fail the entire request if LinkedIn posting fails
        }
      } else {
        console.log('[LinkedIn] Job not eligible for auto-posting or LinkedIn disabled');
      }
    }

    // LINKEDIN SYNC TRIGGER - Update existing LinkedIn posting
    // Sync when updating an already-published job (not the initial draft→published transition)
    if (updatedJob.linkedin_synced && updatedJob.job_status === 'published' && currentJob.job_status === 'published') {
      console.log('[LinkedIn] Job already on LinkedIn - triggering sync for updates');
      if (LINKEDIN_ENABLED) {
        try {
          await syncJobToLinkedIn(id);
          console.log('[LinkedIn] Job synchronized with LinkedIn successfully');
        } catch (syncError) {
          console.error('[LinkedIn] Failed to sync with LinkedIn:', syncError.message);
        }
      }
    }

    // Return normalized job data
    const normalizedJob = {
      ...updatedJob,
      employment_type: normalizeEmploymentType(updatedJob.employment_type),
      company_name: updatedJob.department,
      location: `${updatedJob.city}, ${updatedJob.country}`,
      remote_ok: updatedJob.remote_flag,
      salary_min: updatedJob.salary_from,
      salary_max: updatedJob.salary_to,
      salary_display: updatedJob.salary_currency
    };

    res.json({
      success: true,
      job: normalizedJob,
      audit: auditLog
    });

  } catch (error) {
    console.error('[Backend] Error updating job:', error);
    res.status(500).json({ 
      error: 'Failed to update job',
      message: error.message 
    });
  }
});

// GET /api/dashboard/stats - Get dashboard statistics
app.get('/api/dashboard/stats', async (req, res) => {
  console.log('[Backend] Received GET /api/dashboard/stats request');
  try {
    // Get job statistics
    const jobStats = await query(`
      SELECT 
        COUNT(*) as total_jobs,
        COUNT(*) FILTER (WHERE status = 'published' OR job_status = 'published') as active_jobs,
        COUNT(*) FILTER (WHERE status = 'draft' OR job_status = 'draft') as draft_jobs
      FROM jobs;
    `);
    
    // Get approval statistics
    const approvalStats = await query(`
      SELECT 
        COUNT(*) as pending_approvals,
        COUNT(*) FILTER (WHERE sla_deadline < NOW()) as overdue_approvals
      FROM job_approvals
      WHERE status = 'pending';
    `);
    
    // Get recent jobs
    const recentJobs = await query(`
      SELECT 
        id,
        title,
        employment_type,
        COALESCE(status, job_status) as status,
        city,
        country,
        created_at,
        0 as candidate_count
      FROM jobs
      ORDER BY created_at DESC
      LIMIT 5;
    `);
    
    const stats = {
      totalJobs: parseInt(jobStats.rows[0].total_jobs) || 0,
      activeJobs: parseInt(jobStats.rows[0].active_jobs) || 0,
      draftJobs: parseInt(jobStats.rows[0].draft_jobs) || 0,
      pendingApprovals: parseInt(approvalStats.rows[0].pending_approvals) || 0,
      overdueApprovals: parseInt(approvalStats.rows[0].overdue_approvals) || 0,
      recentJobs: recentJobs.rows
    };
    
    console.log('[Backend] Dashboard stats:', stats);
    res.json(stats);
  } catch (error) {
    console.error('[Backend] Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats', details: error.message });
  }
});

// ===== APPROVAL WORKFLOW ENDPOINTS =====

// GET /api/approvals - List all pending job approvals
app.get('/api/approvals', async (req, res) => {
  console.log('[Backend] Received GET /api/approvals request');
  try {
    const { status = 'pending', sortBy = 'created_at', order = 'asc' } = req.query;
    
    const approvalsQuery = `
      SELECT 
        ja.id as approval_id,
        ja.status as approval_status,
        ja.sla_deadline,
        ja.created_at as submitted_at,
        ja.feedback_comments,
        j.id as job_id,
        j.title,
        j.slug,
        j.employment_type,
        j.department,
        j.city,
        j.country,
        j.remote_flag,
        j.salary_from,
        j.salary_to,
        j.salary_currency,
        j.created_by_role,
        j.description,
        j.requirements,
        j.created_at as job_created_at,
        CASE 
          WHEN ja.sla_deadline < NOW() THEN 'overdue'
          WHEN ja.sla_deadline < NOW() + INTERVAL '6 hours' THEN 'urgent'
          ELSE 'normal'
        END as priority
      FROM job_approvals ja
      JOIN jobs j ON ja.job_id = j.id
      WHERE ja.status = $1
      ORDER BY 
        CASE WHEN ja.sla_deadline < NOW() THEN 0 ELSE 1 END,
        ja.sla_deadline ASC
    `;
    
    const result = await query(approvalsQuery, [status]);
    
    console.log(`[Backend] Found ${result.rows.length} ${status} approvals`);
    res.json(result.rows);
  } catch (error) {
    console.error('[Backend] Error fetching approvals:', error);
    res.status(500).json({ error: 'Failed to fetch approvals', details: error.message });
  }
});

// GET /api/approvals/:id - Get single approval with full job details
app.get('/api/approvals/:id', async (req, res) => {
  console.log(`[Backend] Received GET /api/approvals/${req.params.id}`);
  try {
    const { id } = req.params;
    
    const approvalQuery = `
      SELECT 
        ja.*,
        j.*,
        ja.id as approval_id,
        ja.status as approval_status,
        j.id as job_id
      FROM job_approvals ja
      JOIN jobs j ON ja.job_id = j.id
      WHERE ja.id = $1
    `;
    
    const result = await query(approvalQuery, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Approval not found' });
    }
    
    // Get approval history
    const historyQuery = `
      SELECT * FROM approval_history
      WHERE approval_id = $1
      ORDER BY timestamp DESC
    `;
    const history = await query(historyQuery, [id]);
    
    const approval = {
      ...result.rows[0],
      history: history.rows
    };
    
    res.json(approval);
  } catch (error) {
    console.error('[Backend] Error fetching approval details:', error);
    res.status(500).json({ error: 'Failed to fetch approval details', details: error.message });
  }
});

// POST /api/approvals/:id/approve - Approve a job
app.post('/api/approvals/:id/approve', async (req, res) => {
  console.log(`[Backend] Approving job approval ${req.params.id}`);
  try {
    const { id } = req.params;
    const { approverId = null, comments = '', modifications = null } = req.body;
    
    // Start transaction
    await query('BEGIN');
    
    // Update approval record
    const updateApproval = `
      UPDATE job_approvals
      SET 
        status = 'approved',
        approver_id = $1,
        decision_timestamp = NOW(),
        feedback_comments = $2,
        modifications_made = $3,
        updated_at = NOW()
      WHERE id = $4
      RETURNING job_id
    `;
    
    const approvalResult = await query(updateApproval, [approverId, comments, JSON.stringify(modifications), id]);
    
    if (approvalResult.rows.length === 0) {
      await query('ROLLBACK');
      return res.status(404).json({ error: 'Approval not found' });
    }
    
    const jobId = approvalResult.rows[0].job_id;
    
    // Update job status to published
    await query(`
      UPDATE jobs
      SET 
        status = 'published',
        job_status = 'published',
        approved_by_user_id = $1,
        approved_at = NOW(),
        published_at = NOW(),
        updated_at = NOW()
      WHERE id = $2
    `, [approverId, jobId]);
    
    // Log to approval history
    await query(`
      INSERT INTO approval_history (approval_id, job_id, action, user_id, details)
      VALUES ($1, $2, 'approved', $3, $4)
    `, [id, jobId, approverId, JSON.stringify({ comments, modifications })]);
    
    await query('COMMIT');
    
    console.log(`[Backend] Job ${jobId} approved successfully`);
    res.json({ 
      success: true, 
      message: 'Job approved and published',
      jobId 
    });
  } catch (error) {
    await query('ROLLBACK');
    console.error('[Backend] Error approving job:', error);
    res.status(500).json({ error: 'Failed to approve job', details: error.message });
  }
});

// POST /api/approvals/:id/reject - Reject a job
app.post('/api/approvals/:id/reject', async (req, res) => {
  console.log(`[Backend] Rejecting job approval ${req.params.id}`);
  try {
    const { id } = req.params;
    const { approverId = null, comments } = req.body;
    
    if (!comments || comments.trim().length === 0) {
      return res.status(400).json({ error: 'Feedback comments are required for rejection' });
    }
    
    // Start transaction
    await query('BEGIN');
    
    // Update approval record
    const updateApproval = `
      UPDATE job_approvals
      SET 
        status = 'rejected',
        approver_id = $1,
        decision_timestamp = NOW(),
        feedback_comments = $2,
        updated_at = NOW()
      WHERE id = $3
      RETURNING job_id
    `;
    
    const approvalResult = await query(updateApproval, [approverId, comments, id]);
    
    if (approvalResult.rows.length === 0) {
      await query('ROLLBACK');
      return res.status(404).json({ error: 'Approval not found' });
    }
    
    const jobId = approvalResult.rows[0].job_id;
    
    // Update job status to rejected (keep as draft but mark rejected)
    await query(`
      UPDATE jobs
      SET 
        status = 'draft',
        job_status = 'draft',
        updated_at = NOW()
      WHERE id = $1
    `, [jobId]);
    
    // Log to approval history
    await query(`
      INSERT INTO approval_history (approval_id, job_id, action, user_id, details)
      VALUES ($1, $2, 'rejected', $3, $4)
    `, [id, jobId, approverId, JSON.stringify({ comments })]);
    
    await query('COMMIT');
    
    console.log(`[Backend] Job ${jobId} rejected`);
    res.json({ 
      success: true, 
      message: 'Job rejected with feedback',
      jobId 
    });
  } catch (error) {
    await query('ROLLBACK');
    console.error('[Backend] Error rejecting job:', error);
    res.status(500).json({ error: 'Failed to reject job', details: error.message });
  }
});

// POST /api/approvals/bulk-approve - Bulk approve multiple jobs
app.post('/api/approvals/bulk-approve', async (req, res) => {
  console.log('[Backend] Bulk approving jobs');
  try {
    const { approvalIds, approverId = null, comments = '' } = req.body;
    
    if (!Array.isArray(approvalIds) || approvalIds.length === 0) {
      return res.status(400).json({ error: 'Approval IDs array is required' });
    }
    
    await query('BEGIN');
    
    let successCount = 0;
    const errors = [];
    
    for (const approvalId of approvalIds) {
      try {
        // Update approval
        const result = await query(`
          UPDATE job_approvals
          SET 
            status = 'approved',
            approver_id = $1,
            decision_timestamp = NOW(),
            feedback_comments = $2,
            updated_at = NOW()
          WHERE id = $3
          RETURNING job_id
        `, [approverId, comments, approvalId]);
        
        if (result.rows.length > 0) {
          const jobId = result.rows[0].job_id;
          
          // Update job status
          await query(`
            UPDATE jobs
            SET 
              status = 'published',
              job_status = 'published',
              approved_by_user_id = $1,
              approved_at = NOW(),
              published_at = NOW(),
              updated_at = NOW()
            WHERE id = $2
          `, [approverId, jobId]);
          
          // Log history
          await query(`
            INSERT INTO approval_history (approval_id, job_id, action, user_id, details)
            VALUES ($1, $2, 'bulk_approved', $3, $4)
          `, [approvalId, jobId, approverId, JSON.stringify({ comments, bulkAction: true })]);
          
          successCount++;
        }
      } catch (err) {
        errors.push({ approvalId, error: err.message });
      }
    }
    
    await query('COMMIT');
    
    console.log(`[Backend] Bulk approved ${successCount}/${approvalIds.length} jobs`);
    res.json({ 
      success: true,
      approved: successCount,
      total: approvalIds.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    await query('ROLLBACK');
    console.error('[Backend] Error in bulk approval:', error);
    res.status(500).json({ error: 'Bulk approval failed', details: error.message });
  }
});

// AI Interview Question Generation
app.post('/api/generate-interview-questions', async (req, res) => {
  console.log('[Backend] Received AI interview question generation request');
  try {
    const { jobTitle, employmentType, experienceLevel, keySkills, department } = req.body;
    
    if (!jobTitle) {
      return res.status(400).json({ 
        error: 'Job title is required for interview question generation' 
      });
    }
    
    const employmentTypeContext = {
      contract: 'Focus on project delivery, self-management, and deliverable-oriented questions',
      partTime: 'Focus on time management, prioritization, and efficiency',
      fullTime: 'Focus on long-term growth, team collaboration, and company culture fit',
      eor: 'Focus on remote work capabilities, cross-cultural communication, and independence'
    };

    const prompt = `Generate a comprehensive set of interview questions for the following position:

Job Title: ${jobTitle}
Employment Type: ${employmentType || 'Full-Time'}
Department: ${department || 'Not specified'}
Experience Level: ${experienceLevel || 'Mid-level'}
Key Skills Required: ${keySkills || 'Not specified'}

${employmentTypeContext[employmentType] || employmentTypeContext.fullTime}

Please generate 15-20 interview questions across these categories:

1. Technical/Role-Specific Questions (5-7 questions):
   - Assess core technical skills and job-specific competencies
   - Include both theoretical and practical scenario-based questions
   - Match the experience level appropriately

2. Behavioral Questions (5-7 questions):
   - Use STAR method (Situation, Task, Action, Result)
   - Focus on past experiences and problem-solving
   - Assess soft skills like communication, teamwork, leadership

3. Cultural Fit & Motivation (3-4 questions):
   - Understand candidate values and work style
   - Assess alignment with company culture
   - Gauge long-term commitment and career goals

4. Situational/Problem-Solving (2-3 questions):
   - Present hypothetical scenarios related to the role
   - Assess critical thinking and decision-making

Format each question category clearly with headers. Make questions specific to the role and employment type.`;

    console.log('[Backend] Calling OpenAI API for interview questions...');
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert HR professional and interview specialist. Generate thoughtful, role-specific interview questions that help assess candidate fit comprehensively. Questions should be clear, relevant, and aligned with modern hiring best practices."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1500
    });
    
    const generatedText = completion.choices[0].message.content;
    console.log('[Backend] AI interview questions generated successfully');
    
    // Parse the generated text into structured categories
    const categories = {
      technical: [],
      behavioral: [],
      culturalFit: [],
      situational: []
    };
    
    const lines = generatedText.split('\n').filter(line => line.trim());
    let currentCategory = null;
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Detect category headers
      if (trimmed.toLowerCase().includes('technical') || trimmed.toLowerCase().includes('role-specific')) {
        currentCategory = 'technical';
      } else if (trimmed.toLowerCase().includes('behavioral')) {
        currentCategory = 'behavioral';
      } else if (trimmed.toLowerCase().includes('cultural') || trimmed.toLowerCase().includes('motivation')) {
        currentCategory = 'culturalFit';
      } else if (trimmed.toLowerCase().includes('situational') || trimmed.toLowerCase().includes('problem')) {
        currentCategory = 'situational';
      } else if (currentCategory && trimmed.match(/^\d+[\.)]/)) {
        // Extract question (remove number prefix)
        const question = trimmed.replace(/^\d+[\.)]/, '').trim();
        if (question) {
          categories[currentCategory].push(question);
        }
      }
    }
    
    res.json({ 
      success: true,
      questions: {
        technical: categories.technical,
        behavioral: categories.behavioral,
        culturalFit: categories.culturalFit,
        situational: categories.situational,
        raw: generatedText
      },
      metadata: {
        jobTitle,
        employmentType,
        experienceLevel,
        totalQuestions: categories.technical.length + categories.behavioral.length + categories.culturalFit.length + categories.situational.length,
        generatedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('[Backend] Error generating interview questions:', error);
    
    if (error.code === 'invalid_api_key') {
      return res.status(401).json({ 
        error: 'Invalid OpenAI API key. Please check your configuration.' 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to generate interview questions', 
      details: error.message 
    });
  }
});

// Rate limiting map for AI generation (user -> last request timestamp)
const aiGenerationRateLimit = new Map();
const RATE_LIMIT_WINDOW = 30000; // 30 seconds

// Cleanup old rate limit entries every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  const entriesToDelete = [];
  for (const [userId, timestamp] of aiGenerationRateLimit.entries()) {
    if (now - timestamp > RATE_LIMIT_WINDOW * 10) { // 5 minutes
      entriesToDelete.push(userId);
    }
  }
  entriesToDelete.forEach(userId => aiGenerationRateLimit.delete(userId));
  if (entriesToDelete.length > 0) {
    console.log(`[Rate Limit Cleanup] Removed ${entriesToDelete.length} expired entries`);
  }
}, 300000); // Every 5 minutes

// HTML sanitization configuration
const sanitizeConfig = {
  allowedTags: ['h1', 'h2', 'h3', 'h4', 'p', 'ul', 'ol', 'li', 'strong', 'em', 'br', 'div', 'span'],
  allowedAttributes: {
    'div': ['class'],
    'span': ['class'],
    'p': ['class']
  },
  allowedClasses: {}
};

// AI Job Description Generation - Returns 3 variations with graceful degradation
app.post('/api/generate-job-description', async (req, res) => {
  console.log('[Backend] Received AI job description generation request');
  
  try {
    const { title, city, remoteOk, keySkills, experienceLevel, userId = 'anonymous' } = req.body;
    
    // Validate required fields
    if (!title) {
      return res.status(400).json({ 
        error: 'Job title is required for AI generation' 
      });
    }
    
    // Rate limiting check
    const now = Date.now();
    const lastRequest = aiGenerationRateLimit.get(userId);
    if (lastRequest && (now - lastRequest) < RATE_LIMIT_WINDOW) {
      const remainingTime = Math.ceil((RATE_LIMIT_WINDOW - (now - lastRequest)) / 1000);
      return res.status(429).json({ 
        error: `Please wait ${remainingTime} seconds before generating again` 
      });
    }
    aiGenerationRateLimit.set(userId, now);
    
    // Define three different styles for variations
    const variations = [
      {
        name: 'Professional & Detailed',
        tone: 'Formal and comprehensive',
        style: 'professional and comprehensive, with detailed sections and formal language',
        temperature: 0.6
      },
      {
        name: 'Concise & Direct',
        tone: 'Straightforward and clear',
        style: 'concise and direct, with bullet points and straightforward language',
        temperature: 0.7
      },
      {
        name: 'Engaging & Creative',
        tone: 'Inspiring and dynamic',
        style: 'engaging and creative, with compelling language that excites candidates',
        temperature: 0.8
      }
    ];
    
    console.log('[Backend] Generating 3 job description variations in parallel...');
    
    // Generate all 3 variations with graceful degradation
    const promises = variations.map(async (variation) => {
      try {
        const prompt = `Generate a ${variation.style} job description in HTML format for the following position:

Job Title: ${title}
Location: ${city || 'Not specified'}
Remote Work: ${remoteOk ? 'Yes, remote work available' : 'On-site position'}
Required Skills: ${keySkills || 'Not specified'}
Experience Level: ${experienceLevel || 'Not specified'}

Structure the job description with proper HTML tags:
- Use <h3> for section headings
- Use <p> for paragraphs
- Use <ul> and <li> for lists
- Use <strong> for emphasis

Include these sections:
1. Company Overview (use "We are a dynamic and innovative company" as placeholder)
2. Role Overview
3. Key Responsibilities
4. Required Qualifications
5. Preferred Qualifications

Return ONLY the HTML content, no markdown code blocks or explanations.`;

        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "You are a professional HR expert and job description writer. Create compelling job descriptions in clean HTML format. Return only HTML, no markdown code blocks."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: variation.temperature,
          max_tokens: 1000,
          timeout: 25000 // 25 second timeout
        });
        
        let html = completion.choices[0].message.content.trim();
        
        // Clean up any markdown code blocks if present
        html = html.replace(/```html\n?/g, '').replace(/```\n?$/g, '').trim();
        
        // Sanitize HTML to prevent XSS
        const sanitizedHtml = sanitizeHtml(html, sanitizeConfig);
        
        return {
          status: 'fulfilled',
          value: {
            id: randomUUID(),
            name: variation.name,
            tone: variation.tone,
            description: sanitizedHtml
          }
        };
      } catch (error) {
        console.error(`[Backend] Error generating ${variation.name}:`, error.message);
        return {
          status: 'rejected',
          reason: error.message
        };
      }
    });
    
    const results = await Promise.allSettled(promises);
    
    // Extract successful variations
    const successfulVariations = results
      .filter(r => r.status === 'fulfilled' && r.value.status === 'fulfilled')
      .map(r => r.value.value);
    
    const failedCount = results.length - successfulVariations.length;
    
    if (successfulVariations.length === 0) {
      // All variations failed
      return res.status(500).json({ 
        error: 'Failed to generate any job descriptions. Please try again.',
        details: 'All AI generation attempts failed'
      });
    }
    
    console.log(`[Backend] Successfully generated ${successfulVariations.length}/3 variations`);
    
    res.json({ 
      success: true,
      variations: successfulVariations,
      partialFailure: failedCount > 0,
      failedCount: failedCount,
      message: failedCount > 0 
        ? `Generated ${successfulVariations.length} out of 3 variations` 
        : undefined
    });
    
  } catch (error) {
    console.error('[Backend] Error in job description generation:', error);
    
    if (error.code === 'invalid_api_key' || error.code === 'insufficient_quota') {
      return res.status(401).json({ 
        error: 'OpenAI API configuration issue. Please contact administrator.' 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to generate job description', 
      details: error.message 
    });
  }
});

// LinkedIn Integration API Endpoints

// POST /api/linkedin/post/:jobId - Manually post job to LinkedIn
app.post('/api/linkedin/post/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    console.log('[LinkedIn API] Manual post request for job:', jobId);
    
    const jobResult = await query('SELECT * FROM jobs WHERE id = $1', [jobId]);
    if (jobResult.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    const job = jobResult.rows[0];
    const result = await postJobToLinkedIn(job);
    
    res.json(result);
  } catch (error) {
    console.error('[LinkedIn API] Error posting job:', error);
    res.status(500).json({ error: 'Failed to post job to LinkedIn', details: error.message });
  }
});

// GET /api/linkedin/status/:jobId - Get LinkedIn sync status
app.get('/api/linkedin/status/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const status = await getLinkedInSyncStatus(jobId);
    
    if (!status) {
      return res.json({ 
        synced: false, 
        message: 'Job not yet posted to LinkedIn' 
      });
    }
    
    res.json({
      synced: status.sync_status === 'success',
      status: status.sync_status,
      linkedInJobId: status.linkedin_job_id,
      lastSyncAt: status.last_sync_at,
      syncError: status.sync_error,
      retryCount: status.retry_count,
      autoPosted: status.auto_posted,
      postedAt: status.posted_at
    });
  } catch (error) {
    console.error('[LinkedIn API] Error getting sync status:', error);
    res.status(500).json({ error: 'Failed to get sync status', details: error.message });
  }
});

// POST /api/linkedin/sync/:jobId - Manually sync job updates
app.post('/api/linkedin/sync/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    console.log('[LinkedIn API] Manual sync request for job:', jobId);
    
    const result = await syncJobToLinkedIn(jobId);
    res.json(result);
  } catch (error) {
    console.error('[LinkedIn API] Error syncing job:', error);
    res.status(500).json({ error: 'Failed to sync job', details: error.message });
  }
});

// POST /api/linkedin/retry/:jobId - Retry failed LinkedIn sync
app.post('/api/linkedin/retry/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    console.log('[LinkedIn API] Retry sync request for job:', jobId);
    
    const result = await retryLinkedInSync(jobId);
    res.json(result);
  } catch (error) {
    console.error('[LinkedIn API] Error retrying sync:', error);
    res.status(500).json({ error: 'Failed to retry sync', details: error.message });
  }
});

// Candidate Management API Endpoints

// GET /api/candidates - Get all candidates with optional filtering
app.get('/api/candidates', async (req, res) => {
  try {
    const { jobId, status, source, search } = req.query;
    const filters = {};
    
    if (jobId) filters.jobId = jobId;
    if (status) filters.status = status;
    if (source) filters.source = source;
    if (search) filters.search = search;
    
    const candidates = await getCandidates(filters);
    res.json({ candidates, total: candidates.length });
  } catch (error) {
    console.error('[Candidates API] Error fetching candidates:', error);
    res.status(500).json({ error: 'Failed to fetch candidates', details: error.message });
  }
});

// GET /api/candidates/:id - Get candidate by ID with full details
app.get('/api/candidates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const candidate = await getCandidateById(id);
    
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }
    
    res.json(candidate);
  } catch (error) {
    console.error('[Candidates API] Error fetching candidate:', error);
    res.status(500).json({ error: 'Failed to fetch candidate', details: error.message });
  }
});

// POST /api/candidates - Create new candidate
app.post('/api/candidates', async (req, res) => {
  try {
    const candidate = await createCandidate(req.body);
    res.status(201).json(candidate);
  } catch (error) {
    console.error('[Candidates API] Error creating candidate:', error);
    
    if (error.message.includes('duplicate key')) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    
    res.status(500).json({ error: 'Failed to create candidate', details: error.message });
  }
});

// PUT /api/candidates/:id - Update candidate
app.put('/api/candidates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const candidate = await updateCandidate(id, req.body);
    
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }
    
    res.json(candidate);
  } catch (error) {
    console.error('[Candidates API] Error updating candidate:', error);
    res.status(500).json({ error: 'Failed to update candidate', details: error.message });
  }
});

// DELETE /api/candidates/:id - Delete candidate
app.delete('/api/candidates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await deleteCandidate(id);
    res.json(result);
  } catch (error) {
    console.error('[Candidates API] Error deleting candidate:', error);
    res.status(500).json({ error: 'Failed to delete candidate', details: error.message });
  }
});

// POST /api/candidates/:id/documents - Add document to candidate
app.post('/api/candidates/:id/documents', async (req, res) => {
  try {
    const { id } = req.params;
    const document = await addCandidateDocument(id, req.body);
    res.status(201).json(document);
  } catch (error) {
    console.error('[Candidates API] Error adding document:', error);
    res.status(500).json({ error: 'Failed to add document', details: error.message });
  }
});

// POST /api/candidates/:id/communications - Add communication log
app.post('/api/candidates/:id/communications', async (req, res) => {
  try {
    const { id } = req.params;
    const communication = await addCandidateCommunication(id, req.body);
    res.status(201).json(communication);
  } catch (error) {
    console.error('[Candidates API] Error adding communication:', error);
    res.status(500).json({ error: 'Failed to add communication', details: error.message });
  }
});

// PUT /api/candidates/:id/stage - Move candidate to different pipeline stage (legacy - deprecated, use PATCH)
app.put('/api/candidates/:id/stage', async (req, res) => {
  try {
    const { id } = req.params;
    const { stage, userId, notes, userRole } = req.body;
    
    if (!stage) {
      return res.status(400).json({ error: 'Stage is required' });
    }
    
    // Get current candidate to check current stage
    const candidateResult = await query('SELECT current_stage FROM candidates WHERE id = $1', [id]);
    if (candidateResult.rows.length === 0) {
      return res.status(404).json({ error: 'Candidate not found' });
    }
    
    const currentStage = candidateResult.rows[0].current_stage;
    
    // Enforce role-based permissions: clients cannot modify candidates in OR move to restricted stages
    if (userRole === 'client') {
      if (CLIENT_VIEW_ONLY_STAGES.includes(currentStage)) {
        console.warn(`[Candidates API] Client attempted to move candidate FROM restricted stage: ${currentStage}`);
        return res.status(403).json({ 
          error: 'Forbidden', 
          message: `Clients do not have permission to modify candidates in "${currentStage}" stage. This action requires recruiter access.`
        });
      }
      if (CLIENT_VIEW_ONLY_STAGES.includes(stage)) {
        console.warn(`[Candidates API] Client attempted to move candidate TO restricted stage: ${stage}`);
        return res.status(403).json({ 
          error: 'Forbidden', 
          message: `Clients do not have permission to move candidates to "${stage}" stage. This action requires recruiter access.`
        });
      }
    }
    
    const candidate = await moveCandidateToStage(id, stage, userId, notes);
    res.json(candidate);
  } catch (error) {
    console.error('[Candidates API] Error moving candidate:', error);
    res.status(500).json({ error: 'Failed to move candidate', details: error.message });
  }
});

// Role-based stage restrictions (view-only for clients)
// Clients can only VIEW these stages, but can interact with Client Endorsement onwards
const CLIENT_VIEW_ONLY_STAGES = [
  'Screening',
  'Shortlist'
];

// PATCH /api/candidates/:id/stage - Move candidate (with role validation)
app.patch('/api/candidates/:id/stage', async (req, res) => {
  try {
    const { id } = req.params;
    const { stage, userId, notes, userRole } = req.body;
    
    if (!stage) {
      return res.status(400).json({ error: 'Stage is required' });
    }
    
    // Get current candidate to check current stage
    const candidateResult = await query('SELECT current_stage FROM candidates WHERE id = $1', [id]);
    if (candidateResult.rows.length === 0) {
      return res.status(404).json({ error: 'Candidate not found' });
    }
    
    const currentStage = candidateResult.rows[0].current_stage;
    
    // Enforce role-based permissions: clients cannot modify candidates in OR move to restricted stages
    if (userRole === 'client') {
      if (CLIENT_VIEW_ONLY_STAGES.includes(currentStage)) {
        console.warn(`[Candidates API] Client attempted to move candidate FROM restricted stage: ${currentStage}`);
        return res.status(403).json({ 
          error: 'Forbidden', 
          message: `Clients do not have permission to modify candidates in "${currentStage}" stage. This action requires recruiter access.`
        });
      }
      if (CLIENT_VIEW_ONLY_STAGES.includes(stage)) {
        console.warn(`[Candidates API] Client attempted to move candidate TO restricted stage: ${stage}`);
        return res.status(403).json({ 
          error: 'Forbidden', 
          message: `Clients do not have permission to move candidates to "${stage}" stage. This action requires recruiter access.`
        });
      }
    }
    
    const candidate = await moveCandidateToStage(id, stage, userId, notes);
    res.json(candidate);
  } catch (error) {
    console.error('[Candidates API] Error moving candidate:', error);
    res.status(500).json({ error: 'Failed to move candidate', details: error.message });
  }
});

// PATCH /api/candidates/:id/status - Update candidate status (with role validation)
app.patch('/api/candidates/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason, userId, userRole } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    
    // Get current candidate to check stage
    const candidateResult = await query('SELECT current_stage FROM candidates WHERE id = $1', [id]);
    if (candidateResult.rows.length === 0) {
      return res.status(404).json({ error: 'Candidate not found' });
    }
    
    const currentStage = candidateResult.rows[0].current_stage;
    
    // Enforce role-based permissions: clients cannot modify candidates in restricted stages
    if (userRole === 'client' && CLIENT_VIEW_ONLY_STAGES.includes(currentStage)) {
      console.warn(`[Candidates API] Client attempted to change status of candidate in restricted stage: ${currentStage}`);
      return res.status(403).json({ 
        error: 'Forbidden', 
        message: `Clients do not have permission to modify candidates in "${currentStage}" stage. This action requires recruiter access.`
      });
    }
    
    // Handle disqualification
    if (status === 'disqualified') {
      const candidate = await disqualifyCandidate(id, reason, userId);
      return res.json(candidate);
    }
    
    // Handle other status updates
    const result = await query(
      'UPDATE candidates SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('[Candidates API] Error updating candidate status:', error);
    res.status(500).json({ error: 'Failed to update candidate status', details: error.message });
  }
});

// PATCH /api/candidates/:id/disqualify - Disqualify candidate
app.patch('/api/candidates/:id/disqualify', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, userId } = req.body;
    
    const candidate = await disqualifyCandidate(id, reason, userId);
    res.json(candidate);
  } catch (error) {
    console.error('[Candidates API] Error disqualifying candidate:', error);
    res.status(500).json({ error: 'Failed to disqualify candidate', details: error.message });
  }
});

// GET /api/substages/:stageName - Get available substages for a stage (from database)
app.get('/api/substages/:stageName', async (req, res) => {
  try {
    const { stageName } = req.params;
    
    const result = await query(
      `SELECT substage_id as id, substage_label as label, substage_order as "order"
       FROM pipeline_substages 
       WHERE stage_name = $1 
       ORDER BY substage_order ASC`,
      [stageName]
    );
    
    const substages = result.rows;
    res.json({ stageName, substages });
  } catch (error) {
    console.error('[Substages API] Error getting substages:', error);
    res.status(500).json({ error: 'Failed to get substages', details: error.message });
  }
});

// PATCH /api/candidates/:id/substage - Update candidate substage (with role validation)
app.patch('/api/candidates/:id/substage', async (req, res) => {
  try {
    const { id } = req.params;
    const { substage, userId, userRole } = req.body;
    
    // Get current candidate to check stage
    const candidateResult = await query(
      'SELECT current_stage, candidate_substage FROM candidates WHERE id = $1', 
      [id]
    );
    
    if (candidateResult.rows.length === 0) {
      return res.status(404).json({ error: 'Candidate not found' });
    }
    
    const { current_stage: currentStage, candidate_substage: currentSubstage } = candidateResult.rows[0];
    
    // NOTE: Substage movement now enabled for ALL stages (including Screening and Shortlist)
    // Role-based restrictions removed to allow full substage progression tracking
    // if (userRole === 'client' && CLIENT_VIEW_ONLY_STAGES.includes(currentStage)) {
    //   console.warn(`[Substages API] Client attempted to change substage in restricted stage: ${currentStage}`);
    //   return res.status(403).json({ 
    //     error: 'Forbidden', 
    //     message: `Clients do not have permission to modify candidates in "${currentStage}" stage. This action requires recruiter access.`
    //   });
    // }
    
    // Validate substage belongs to current stage (check database)
    if (substage) {
      const validationResult = await query(
        'SELECT COUNT(*) as count FROM pipeline_substages WHERE stage_name = $1 AND substage_id = $2',
        [currentStage, substage]
      );
      
      if (validationResult.rows[0].count === 0) {
        return res.status(400).json({ 
          error: 'Invalid substage', 
          message: `Substage "${substage}" is not valid for stage "${currentStage}"`
        });
      }
    }
    
    // Update substage
    const result = await query(
      'UPDATE candidates SET candidate_substage = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [substage, id]
    );
    
    console.log(`[Substages API] Updated candidate ${id} substage: ${currentSubstage} → ${substage} by ${userId || 'system'}`);
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('[Substages API] Error updating substage:', error);
    res.status(500).json({ error: 'Failed to update substage', details: error.message });
  }
});

// ===== CLIENT ENDORSEMENT TRACKING ENDPOINTS =====

// POST /api/candidates/:id/submit-to-client - Mark candidate as submitted to client
app.post('/api/candidates/:id/submit-to-client', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    
    // Check if candidate exists and is in Client Endorsement stage
    const candidateResult = await query(
      'SELECT id, current_stage, submitted_to_client_at FROM candidates WHERE id = $1',
      [id]
    );
    
    if (candidateResult.rows.length === 0) {
      return res.status(404).json({ error: 'Candidate not found' });
    }
    
    const candidate = candidateResult.rows[0];
    
    if (candidate.current_stage !== 'Client Endorsement') {
      return res.status(400).json({ 
        error: 'Invalid stage', 
        message: 'Candidate must be in Client Endorsement stage to submit to client' 
      });
    }
    
    // Set submitted_to_client_at timestamp and move to first substage
    const result = await query(
      `UPDATE candidates 
       SET submitted_to_client_at = CURRENT_TIMESTAMP,
           candidate_substage = 'client_review_pending',
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [id]
    );
    
    console.log(`[Client Endorsement] Candidate ${id} submitted to client by ${userId || 'system'}`);
    
    res.json({
      success: true,
      candidate: result.rows[0],
      message: 'Candidate submitted to client successfully'
    });
  } catch (error) {
    console.error('[Client Endorsement] Error submitting to client:', error);
    res.status(500).json({ error: 'Failed to submit to client', details: error.message });
  }
});

// POST /api/candidates/:id/client-view - Auto-track when client views candidate profile
app.post('/api/candidates/:id/client-view', async (req, res) => {
  try {
    const { id } = req.params;
    const { clientId, clientEmail } = req.body;
    
    // Check if candidate exists and is in Client Endorsement stage
    const candidateResult = await query(
      'SELECT id, current_stage, candidate_substage, client_viewed_at FROM candidates WHERE id = $1',
      [id]
    );
    
    if (candidateResult.rows.length === 0) {
      return res.status(404).json({ error: 'Candidate not found' });
    }
    
    const candidate = candidateResult.rows[0];
    
    // Only track view if in Client Endorsement and not already viewed
    if (candidate.current_stage === 'Client Endorsement' && !candidate.client_viewed_at) {
      await query(
        `UPDATE candidates 
         SET client_viewed_at = CURRENT_TIMESTAMP,
             candidate_substage = 'client_reviewing',
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [id]
      );
      
      console.log(`[Client Endorsement] Candidate ${id} viewed by client ${clientEmail || clientId || 'unknown'}`);
      
      res.json({
        success: true,
        message: 'Client view tracked successfully',
        substage_updated: true,
        new_substage: 'client_reviewing'
      });
    } else {
      // Just return success without updating (already viewed or not in right stage)
      res.json({
        success: true,
        message: 'View recorded',
        substage_updated: false
      });
    }
  } catch (error) {
    console.error('[Client Endorsement] Error tracking client view:', error);
    res.status(500).json({ error: 'Failed to track client view', details: error.message });
  }
});

// POST /api/candidates/:id/mark-viewed - Manual mark as viewed by recruiter
app.post('/api/candidates/:id/mark-viewed', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, userRole } = req.body;
    
    // Check permissions (only recruiters can manually mark)
    if (userRole === 'client') {
      return res.status(403).json({ 
        error: 'Forbidden', 
        message: 'Only recruiters can manually mark candidates as viewed by client' 
      });
    }
    
    const candidateResult = await query(
      'SELECT id, current_stage, candidate_substage FROM candidates WHERE id = $1',
      [id]
    );
    
    if (candidateResult.rows.length === 0) {
      return res.status(404).json({ error: 'Candidate not found' });
    }
    
    const candidate = candidateResult.rows[0];
    
    if (candidate.current_stage !== 'Client Endorsement') {
      return res.status(400).json({ 
        error: 'Invalid stage', 
        message: 'Candidate must be in Client Endorsement stage' 
      });
    }
    
    // Manually set client_viewed_at and update substage
    const result = await query(
      `UPDATE candidates 
       SET client_viewed_at = CURRENT_TIMESTAMP,
           candidate_substage = 'client_reviewing',
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [id]
    );
    
    console.log(`[Client Endorsement] Candidate ${id} manually marked as viewed by recruiter ${userId || 'unknown'}`);
    
    res.json({
      success: true,
      candidate: result.rows[0],
      message: 'Candidate marked as viewed by client'
    });
  } catch (error) {
    console.error('[Client Endorsement] Error marking as viewed:', error);
    res.status(500).json({ error: 'Failed to mark as viewed', details: error.message });
  }
});

// ===== AI INTERVIEW API ENDPOINTS (Team Connect Integration) =====

// POST /api/candidates/:id/ai-interview/send - Send AI interview link (mock)
app.post('/api/candidates/:id/ai-interview/send', async (req, res) => {
  try {
    const { id } = req.params;
    
    const candidateResult = await query(
      'SELECT * FROM candidates WHERE id = $1',
      [id]
    );
    
    if (candidateResult.rows.length === 0) {
      return res.status(404).json({ error: 'Candidate not found' });
    }
    
    const candidate = candidateResult.rows[0];
    
    // Mock: Generate unique token and link
    const mockToken = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const mockLink = `https://teamconnect.example.com/interview/${mockToken}`;
    
    // Update candidate with AI interview link
    await query(
      `UPDATE candidates 
       SET ai_interview_link = $1,
           ai_interview_token = $2,
           ai_interview_link_sent_at = CURRENT_TIMESTAMP,
           candidate_substage = 'ai_interview_sent',
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [mockLink, mockToken, id]
    );
    
    console.log(`[AI Interview] Link sent to candidate ${candidate.email} (mock)`);
    
    res.json({
      success: true,
      message: 'AI interview link sent successfully',
      interview_link: mockLink,
      substage: 'ai_interview_sent'
    });
  } catch (error) {
    console.error('[AI Interview] Error sending link:', error);
    res.status(500).json({ error: 'Failed to send AI interview link', details: error.message });
  }
});

// POST /api/candidates/:id/ai-interview/start - Start AI interview (mock)
app.post('/api/candidates/:id/ai-interview/start', async (req, res) => {
  try {
    const { id } = req.params;
    
    const candidateResult = await query(
      'SELECT * FROM candidates WHERE id = $1',
      [id]
    );
    
    if (candidateResult.rows.length === 0) {
      return res.status(404).json({ error: 'Candidate not found' });
    }
    
    const candidate = candidateResult.rows[0];
    
    if (!candidate.ai_interview_link_sent_at) {
      return res.status(400).json({ 
        error: 'Invalid state', 
        message: 'AI interview link must be sent before starting' 
      });
    }
    
    // Update to started state
    await query(
      `UPDATE candidates 
       SET ai_interview_started_at = CURRENT_TIMESTAMP,
           candidate_substage = 'ai_interview_started',
           ai_interview_last_activity_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [id]
    );
    
    console.log(`[AI Interview] Candidate ${id} started AI interview (mock)`);
    
    res.json({
      success: true,
      message: 'AI interview started',
      substage: 'ai_interview_started',
      mock_questions: [
        'Tell me about your experience with React and TypeScript.',
        'Describe a challenging technical problem you solved.',
        'How do you approach code reviews and collaboration?',
        'What interests you about this position?',
        'Where do you see yourself in 3-5 years?'
      ]
    });
  } catch (error) {
    console.error('[AI Interview] Error starting interview:', error);
    res.status(500).json({ error: 'Failed to start AI interview', details: error.message });
  }
});

// POST /api/candidates/:id/ai-interview/complete - Complete AI interview with mock scoring
app.post('/api/candidates/:id/ai-interview/complete', async (req, res) => {
  try {
    const { id } = req.params;
    const { responses, duration } = req.body;
    
    const candidateResult = await query(
      'SELECT * FROM candidates WHERE id = $1',
      [id]
    );
    
    if (candidateResult.rows.length === 0) {
      return res.status(404).json({ error: 'Candidate not found' });
    }
    
    const candidate = candidateResult.rows[0];
    
    if (!candidate.ai_interview_started_at) {
      return res.status(400).json({ 
        error: 'Invalid state', 
        message: 'AI interview must be started before completing' 
      });
    }
    
    // Mock: Generate realistic AI scores
    const mockOverallScore = Math.floor(Math.random() * 30) + 65; // 65-95
    const mockSentimentScore = Math.floor(Math.random() * 20) + 75; // 75-95
    const mockConfidenceScore = Math.floor(Math.random() * 15) + 80; // 80-95
    
    const mockAnalysisReport = {
      overall_score: mockOverallScore,
      sentiment_score: mockSentimentScore,
      confidence_score: mockConfidenceScore,
      recommendation: mockOverallScore >= 85 ? 'Strong Hire' : mockOverallScore >= 75 ? 'Hire' : 'Maybe',
      strengths: [
        'Strong technical communication skills',
        'Demonstrates problem-solving abilities',
        'Good cultural fit indicators',
        'Enthusiasm for the role'
      ],
      improvements: [
        'Could provide more specific examples',
        'Consider elaborating on team collaboration'
      ],
      category_scores: {
        technical_skills: Math.floor(Math.random() * 20) + 75,
        communication: Math.floor(Math.random() * 20) + 75,
        cultural_fit: Math.floor(Math.random() * 20) + 75,
        problem_solving: Math.floor(Math.random() * 20) + 75
      },
      analyzed_at: new Date().toISOString(),
      analysis_duration_ms: 1500
    };
    
    // Update to completed and processing state
    await query(
      `UPDATE candidates 
       SET ai_interview_completed_at = CURRENT_TIMESTAMP,
           ai_interview_responses = $1,
           ai_interview_duration_seconds = $2,
           ai_interview_questions_total = $3,
           ai_interview_questions_answered = $4,
           candidate_substage = 'ai_interview_completed',
           ai_analysis_status = 'pending',
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5`,
      [
        JSON.stringify(responses || []),
        duration || 0,
        responses?.length || 0,
        responses?.filter(r => r.answer).length || 0,
        id
      ]
    );
    
    // Simulate AI analysis processing (in real app, this would be async)
    setTimeout(async () => {
      try {
        await query(
          `UPDATE candidates 
           SET ai_analysis_status = 'completed',
               candidate_substage = 'ai_results_ready',
               ai_interview_score = $1,
               ai_sentiment_score = $2,
               ai_confidence_score = $3,
               ai_analysis_report = $4,
               ai_analysis_completed_at = CURRENT_TIMESTAMP,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $5`,
          [
            mockOverallScore,
            mockSentimentScore,
            mockConfidenceScore,
            JSON.stringify(mockAnalysisReport),
            id
          ]
        );
        console.log(`[AI Interview] Analysis completed for candidate ${id} - Score: ${mockOverallScore}/100`);
      } catch (err) {
        console.error('[AI Interview] Error updating analysis results:', err);
      }
    }, 2000); // Mock 2 second processing delay
    
    console.log(`[AI Interview] Candidate ${id} completed AI interview, processing...`);
    
    res.json({
      success: true,
      message: 'AI interview submitted successfully. Analysis will be ready shortly.',
      substage: 'ai_analysis_in_progress',
      estimated_analysis_time: '2-3 seconds'
    });
  } catch (error) {
    console.error('[AI Interview] Error completing interview:', error);
    res.status(500).json({ error: 'Failed to complete AI interview', details: error.message });
  }
});

// GET /api/candidates/:id/ai-interview/results - Get AI interview results
app.get('/api/candidates/:id/ai-interview/results', async (req, res) => {
  try {
    const { id } = req.params;
    
    const candidateResult = await query(
      `SELECT 
        id,
        first_name,
        last_name,
        email,
        candidate_substage,
        ai_interview_score,
        ai_sentiment_score,
        ai_confidence_score,
        ai_analysis_report,
        ai_analysis_status,
        ai_interview_completed_at,
        ai_analysis_completed_at,
        ai_interview_duration_seconds
       FROM candidates 
       WHERE id = $1`,
      [id]
    );
    
    if (candidateResult.rows.length === 0) {
      return res.status(404).json({ error: 'Candidate not found' });
    }
    
    const candidate = candidateResult.rows[0];
    
    if (!candidate.ai_interview_completed_at) {
      return res.status(400).json({ 
        error: 'Results not available', 
        message: 'Candidate has not completed AI interview yet' 
      });
    }
    
    if (candidate.ai_analysis_status !== 'completed') {
      return res.json({
        status: 'processing',
        message: 'AI analysis is still in progress',
        substage: candidate.candidate_substage
      });
    }
    
    res.json({
      status: 'completed',
      candidate: {
        id: candidate.id,
        name: `${candidate.first_name} ${candidate.last_name}`,
        email: candidate.email
      },
      scores: {
        overall: candidate.ai_interview_score,
        sentiment: candidate.ai_sentiment_score,
        confidence: candidate.ai_confidence_score
      },
      analysis: candidate.ai_analysis_report,
      metadata: {
        completed_at: candidate.ai_interview_completed_at,
        analyzed_at: candidate.ai_analysis_completed_at,
        duration_seconds: candidate.ai_interview_duration_seconds
      }
    });
  } catch (error) {
    console.error('[AI Interview] Error fetching results:', error);
    res.status(500).json({ error: 'Failed to fetch AI interview results', details: error.message });
  }
});

// ===== EXTERNAL CANDIDATE PORTAL API ENDPOINTS =====

// Middleware for API key validation (optional - can be enabled via env var)
const validatePortalApiKey = (req, res, next) => {
  const expectedApiKey = process.env.PORTAL_API_KEY;
  
  // Skip validation if no API key is configured (development mode)
  if (!expectedApiKey) {
    console.log('[Portal API] No API key configured - skipping validation (DEV MODE)');
    return next();
  }
  
  const providedKey = req.headers['x-api-key'] || req.query.apiKey;
  
  if (!providedKey) {
    return res.status(401).json({ error: 'API key required', message: 'Provide X-API-Key header or apiKey query parameter' });
  }
  
  if (providedKey !== expectedApiKey) {
    console.warn('[Portal API] Invalid API key attempt:', providedKey.substring(0, 8) + '...');
    return res.status(403).json({ error: 'Invalid API key' });
  }
  
  next();
};

// POST /api/portal/candidates - Submit candidate from external portal
app.post('/api/portal/candidates', validatePortalApiKey, async (req, res) => {
  try {
    console.log('[Portal API] Received candidate submission:', req.body);
    
    const candidateData = {
      ...req.body,
      source: 'portal', // Always mark as portal source
      currentStage: 'Screening' // Always start at Screening
    };
    
    const candidate = await createCandidate(candidateData);
    
    console.log('[Portal API] Candidate created successfully:', candidate.id);
    res.status(201).json({
      success: true,
      candidate: {
        id: candidate.id,
        firstName: candidate.first_name,
        lastName: candidate.last_name,
        email: candidate.email,
        currentStage: candidate.current_stage,
        status: candidate.status,
        createdAt: candidate.created_at
      },
      message: 'Candidate submitted successfully to Screening stage'
    });
  } catch (error) {
    console.error('[Portal API] Error creating candidate:', error);
    
    if (error.message.includes('duplicate key')) {
      return res.status(400).json({ 
        error: 'Duplicate email', 
        message: 'Candidate with this email already applied to this job' 
      });
    }
    
    res.status(500).json({ error: 'Failed to submit candidate', details: error.message });
  }
});

// PUT /api/portal/candidates/:id/advance - Advance candidate to next stage (dynamic based on job pipeline)
app.put('/api/portal/candidates/:id/advance', validatePortalApiKey, async (req, res) => {
  try {
    const { id } = req.params;
    const { notes, portalUserId } = req.body;
    
    console.log('[Portal API] Advancing candidate:', id);
    
    // Get candidate's current stage and job_id
    const candidateResult = await query(
      'SELECT current_stage, job_id, first_name, last_name FROM candidates WHERE id = $1',
      [parseInt(id)]
    );
    
    if (candidateResult.rows.length === 0) {
      return res.status(404).json({ error: 'Candidate not found' });
    }
    
    const { current_stage, job_id } = candidateResult.rows[0];
    
    // Get job's complete pipeline configuration
    const pipelineResult = await query(
      'SELECT stage_name, stage_order FROM job_pipeline_stages WHERE job_id = $1 ORDER BY stage_order ASC',
      [job_id]
    );
    
    if (pipelineResult.rows.length === 0) {
      return res.status(500).json({ 
        error: 'Job pipeline not configured',
        message: 'This job does not have a configured pipeline. Please contact system administrator.'
      });
    }
    
    const pipeline = pipelineResult.rows;
    
    // Find current stage in pipeline
    const currentStageIndex = pipeline.findIndex(stage => stage.stage_name === current_stage);
    
    if (currentStageIndex === -1) {
      return res.status(400).json({ 
        error: 'Invalid current stage',
        message: `Current stage "${current_stage}" not found in job pipeline`
      });
    }
    
    // Portal stage boundaries (fixed positions, not names)
    const PORTAL_STAGES = ['Screening', 'Shortlist', 'Client Endorsement'];
    
    // Validate current stage is within portal ownership
    if (!PORTAL_STAGES.includes(current_stage)) {
      return res.status(400).json({ 
        error: 'Invalid stage transition', 
        message: `Portal cannot advance candidates from "${current_stage}". Portal can only manage: ${PORTAL_STAGES.join(', ')}`
      });
    }
    
    // Check if already at final portal stage (Client Endorsement)
    if (current_stage === 'Client Endorsement') {
      return res.status(400).json({ 
        error: 'Handoff point reached', 
        message: 'Candidate is at Client Endorsement (handoff to Internal ATS). Portal cannot advance beyond this stage.'
      });
    }
    
    // Check if at last stage in pipeline
    if (currentStageIndex === pipeline.length - 1) {
      return res.status(400).json({ 
        error: 'Already at final stage',
        message: 'Candidate is already at the final stage in the pipeline'
      });
    }
    
    // Get next stage from pipeline
    const newStage = pipeline[currentStageIndex + 1].stage_name;
    
    // Move candidate to next stage
    const candidate = await moveCandidateToStage(
      parseInt(id), 
      newStage, 
      portalUserId || 'portal-system', 
      notes || `Advanced from ${current_stage} via external portal`
    );
    
    const isHandoffPoint = newStage === 'Client Endorsement';
    
    console.log('[Portal API] Candidate advanced:', current_stage, '→', newStage, isHandoffPoint ? '(HANDOFF)' : '');
    res.json({
      success: true,
      candidate: {
        id: candidate.id,
        firstName: candidate.first_name,
        lastName: candidate.last_name,
        email: candidate.email,
        previousStage: current_stage,
        currentStage: newStage,
        updatedAt: candidate.updated_at
      },
      isHandoffPoint,
      message: isHandoffPoint 
        ? `Candidate endorsed for client review (handoff to Internal ATS)`
        : `Candidate advanced from ${current_stage} to ${newStage}`
    });
  } catch (error) {
    console.error('[Portal API] Error advancing candidate:', error);
    res.status(500).json({ error: 'Failed to advance candidate', details: error.message });
  }
});

// GET /api/portal/jobs/:jobId/candidates - Get candidates for a job (optionally filtered by stage)
app.get('/api/portal/jobs/:jobId/candidates', validatePortalApiKey, async (req, res) => {
  try {
    const { jobId } = req.params;
    const { stage, status } = req.query;
    
    console.log('[Portal API] Fetching candidates for job:', jobId, { stage, status });
    
    const filters = {
      jobId,
      ...(status && { status })
    };
    
    // Get candidates using existing service
    const candidates = await getCandidates(filters);
    
    // Filter by stage if specified (getCandidates doesn't support stage filter)
    let filteredCandidates = candidates;
    if (stage) {
      filteredCandidates = candidates.filter(c => c.current_stage === stage);
    }
    
    res.json({
      success: true,
      jobId,
      totalCount: filteredCandidates.length,
      filters: { stage, status },
      candidates: filteredCandidates.map(c => ({
        id: c.id,
        firstName: c.first_name,
        lastName: c.last_name,
        email: c.email,
        phone: c.phone,
        currentStage: c.current_stage,
        source: c.source,
        status: c.status,
        resumeUrl: c.resume_url,
        createdAt: c.created_at,
        updatedAt: c.updated_at
      }))
    });
  } catch (error) {
    console.error('[Portal API] Error fetching candidates:', error);
    res.status(500).json({ error: 'Failed to fetch candidates', details: error.message });
  }
});

// GET /api/portal/candidates/:id - Get candidate details by ID
app.get('/api/portal/candidates/:id', validatePortalApiKey, async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('[Portal API] Fetching candidate details:', id);
    
    const candidate = await getCandidateById(parseInt(id));
    
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }
    
    res.json({
      success: true,
      candidate: {
        id: candidate.id,
        firstName: candidate.first_name,
        lastName: candidate.last_name,
        email: candidate.email,
        phone: candidate.phone,
        currentStage: candidate.current_stage,
        source: candidate.source,
        status: candidate.status,
        resumeUrl: candidate.resume_url,
        externalPortalId: candidate.external_portal_id,
        jobTitle: candidate.job_title,
        employmentType: candidate.employment_type,
        createdAt: candidate.created_at,
        updatedAt: candidate.updated_at,
        documents: candidate.documents || [],
        communications: candidate.communications || [],
        stageHistory: candidate.stageHistory?.map(h => ({
          id: h.id,
          previousStage: h.previous_stage,
          newStage: h.new_stage,
          changedBy: h.changed_by_user_id,
          notes: h.notes,
          changedAt: h.changed_at
        })) || []
      }
    });
  } catch (error) {
    console.error('[Portal API] Error fetching candidate:', error);
    res.status(500).json({ error: 'Failed to fetch candidate', details: error.message });
  }
});

// PUT /api/portal/candidates/:id - Update candidate information
app.put('/api/portal/candidates/:id', validatePortalApiKey, async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('[Portal API] Updating candidate:', id, req.body);
    
    // Prevent external portal from changing certain fields
    const allowedUpdates = {
      ...(req.body.phone && { phone: req.body.phone }),
      ...(req.body.resumeUrl && { resumeUrl: req.body.resumeUrl }),
      ...(req.body.externalPortalId && { externalPortalId: req.body.externalPortalId })
    };
    
    if (Object.keys(allowedUpdates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update', allowedFields: ['phone', 'resumeUrl', 'externalPortalId'] });
    }
    
    const candidate = await updateCandidate(parseInt(id), allowedUpdates);
    
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }
    
    res.json({
      success: true,
      candidate: {
        id: candidate.id,
        firstName: candidate.first_name,
        lastName: candidate.last_name,
        email: candidate.email,
        phone: candidate.phone,
        resumeUrl: candidate.resume_url,
        externalPortalId: candidate.external_portal_id,
        updatedAt: candidate.updated_at
      },
      message: 'Candidate updated successfully'
    });
  } catch (error) {
    console.error('[Portal API] Error updating candidate:', error);
    res.status(500).json({ error: 'Failed to update candidate', details: error.message });
  }
});

// ===== WORKFLOW BUILDER API ENDPOINTS (Feature-Flagged) =====

// GET /api/jobs/:jobId/pipeline-stages - Get all pipeline stages with configurations
app.get('/api/jobs/:jobId/pipeline-stages', requireWorkflowBuilder, async (req, res) => {
  try {
    const { jobId } = req.params;
    
    console.log('[Workflow Builder] Fetching pipeline stages for job:', jobId);
    
    const result = await query(
      `SELECT 
        id, 
        job_id, 
        stage_name, 
        stage_order, 
        is_default,
        stage_config,
        created_at
      FROM job_pipeline_stages 
      WHERE job_id = $1 
      ORDER BY stage_order ASC`,
      [jobId]
    );
    
    res.json({
      success: true,
      jobId: jobId,
      stages: result.rows.map(stage => ({
        id: stage.id,
        jobId: stage.job_id,
        stageName: stage.stage_name,
        stageOrder: stage.stage_order,
        isDefault: stage.is_default,
        config: stage.stage_config || {},
        createdAt: stage.created_at
      }))
    });
  } catch (error) {
    console.error('[Workflow Builder] Error fetching pipeline stages:', error);
    res.status(500).json({ error: 'Failed to fetch pipeline stages', details: error.message });
  }
});

// POST /api/jobs/:jobId/pipeline-stages - Create new custom pipeline stage
app.post('/api/jobs/:jobId/pipeline-stages', requireWorkflowBuilder, async (req, res) => {
  try {
    const { jobId } = req.params;
    const { stageName, stageOrder, config } = req.body;
    
    if (!stageName || stageOrder === undefined) {
      return res.status(400).json({ error: 'stageName and stageOrder are required' });
    }
    
    console.log('[Workflow Builder] Creating new stage:', { jobId, stageName, stageOrder });
    
    const result = await query(
      `INSERT INTO job_pipeline_stages (job_id, stage_name, stage_order, is_default, stage_config)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, job_id, stage_name, stage_order, is_default, stage_config, created_at`,
      [jobId, stageName, stageOrder, false, JSON.stringify(config || {})]
    );
    
    const newStage = result.rows[0];
    
    res.status(201).json({
      success: true,
      stage: {
        id: newStage.id,
        jobId: newStage.job_id,
        stageName: newStage.stage_name,
        stageOrder: newStage.stage_order,
        isDefault: newStage.is_default,
        config: newStage.stage_config || {},
        createdAt: newStage.created_at
      }
    });
  } catch (error) {
    console.error('[Workflow Builder] Error creating stage:', error);
    res.status(500).json({ error: 'Failed to create stage', details: error.message });
  }
});

// PUT /api/jobs/:jobId/pipeline-stages/:stageId/config - Update stage configuration
app.put('/api/jobs/:jobId/pipeline-stages/:stageId/config', requireWorkflowBuilder, async (req, res) => {
  try {
    const { jobId, stageId } = req.params;
    const { config } = req.body;
    
    if (!config || typeof config !== 'object') {
      return res.status(400).json({ error: 'config object is required' });
    }
    
    console.log('[Workflow Builder] Updating stage config:', { jobId, stageId, config });
    
    const result = await query(
      `UPDATE job_pipeline_stages 
       SET stage_config = $1
       WHERE id = $2 AND job_id = $3
       RETURNING id, job_id, stage_name, stage_order, is_default, stage_config, created_at`,
      [JSON.stringify(config), stageId, jobId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Stage not found' });
    }
    
    const updatedStage = result.rows[0];
    
    res.json({
      success: true,
      stage: {
        id: updatedStage.id,
        jobId: updatedStage.job_id,
        stageName: updatedStage.stage_name,
        stageOrder: updatedStage.stage_order,
        isDefault: updatedStage.is_default,
        config: updatedStage.stage_config || {},
        createdAt: updatedStage.created_at
      }
    });
  } catch (error) {
    console.error('[Workflow Builder] Error updating stage config:', error);
    res.status(500).json({ error: 'Failed to update stage config', details: error.message });
  }
});

// GET /api/jobs/:jobId/pipeline-stages/:stageId/candidate-count - Check if stage has candidates
app.get('/api/jobs/:jobId/pipeline-stages/:stageId/candidate-count', requireWorkflowBuilder, async (req, res) => {
  try {
    const { jobId, stageId } = req.params;
    
    const stageResult = await query(
      'SELECT stage_name FROM job_pipeline_stages WHERE id = $1 AND job_id = $2',
      [stageId, jobId]
    );
    
    if (stageResult.rows.length === 0) {
      return res.status(404).json({ error: 'Stage not found' });
    }
    
    const stageName = stageResult.rows[0].stage_name;
    
    const countResult = await query(
      'SELECT COUNT(*) as count FROM candidates WHERE job_id = $1 AND current_stage = $2',
      [jobId, stageName]
    );
    
    const candidateCount = parseInt(countResult.rows[0].count);
    const canDelete = candidateCount === 0;
    
    console.log('[Workflow Builder] Stage candidate count:', { jobId, stageId, stageName, candidateCount, canDelete });
    
    res.json({
      success: true,
      jobId: jobId,
      stageId: stageId,
      stageName,
      candidateCount,
      canDelete,
      message: canDelete 
        ? 'Stage can be safely deleted'
        : `Cannot delete stage: ${candidateCount} candidate(s) currently in this stage`
    });
  } catch (error) {
    console.error('[Workflow Builder] Error checking candidate count:', error);
    res.status(500).json({ error: 'Failed to check candidate count', details: error.message });
  }
});

// PUT /api/jobs/:jobId/pipeline-stages/reorder - Reorder pipeline stages
app.put('/api/jobs/:jobId/pipeline-stages/reorder', requireWorkflowBuilder, async (req, res) => {
  try {
    const { jobId } = req.params;
    const { stageOrders } = req.body;
    
    if (!Array.isArray(stageOrders) || stageOrders.length === 0) {
      return res.status(400).json({ error: 'stageOrders array is required' });
    }
    
    console.log('[Workflow Builder] Reordering stages for job:', jobId, stageOrders);
    
    for (const entry of stageOrders) {
      if (!entry || typeof entry !== 'object') {
        return res.status(400).json({ 
          error: 'Invalid stageOrders entry',
          message: 'Each stageOrders entry must be an object with stageId and newOrder fields'
        });
      }
      if (typeof entry.stageId !== 'number' || !Number.isInteger(entry.stageId)) {
        return res.status(400).json({ 
          error: 'Invalid stageId type',
          message: 'All stageId values must be integers'
        });
      }
      if (typeof entry.newOrder !== 'number' || !Number.isInteger(entry.newOrder)) {
        return res.status(400).json({ 
          error: 'Invalid newOrder type',
          message: 'All newOrder values must be integers'
        });
      }
      if (entry.newOrder < 0) {
        return res.status(400).json({ 
          error: 'Invalid newOrder value',
          message: 'Stage order values cannot be negative'
        });
      }
    }
    
    const FIXED_TOP_STAGES = ['Screening', 'Shortlist', 'Client Endorsement'];
    const FIXED_BOTTOM_STAGES = ['Offer', 'Offer Accepted'];
    const FIXED_STAGES = [...FIXED_TOP_STAGES, ...FIXED_BOTTOM_STAGES];
    
    await query('BEGIN');
    
    let currentStagesResult;
    try {
      currentStagesResult = await query(
        'SELECT id, stage_name, stage_order FROM job_pipeline_stages WHERE job_id = $1 ORDER BY stage_order ASC FOR UPDATE',
        [jobId]
      );
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
    
    const currentStages = currentStagesResult.rows;
    
    if (currentStages.length === 0) {
      await query('ROLLBACK');
      return res.status(404).json({ error: 'No stages found for this job' });
    }
    
    if (stageOrders.length !== currentStages.length) {
      await query('ROLLBACK');
      return res.status(400).json({ 
        error: 'Invalid stage count',
        message: `Expected ${currentStages.length} stages, got ${stageOrders.length}`
      });
    }
    
    const providedStageIds = new Set(stageOrders.map(s => s.stageId));
    const currentStageIds = new Set(currentStages.map(s => s.id));
    
    for (const id of currentStageIds) {
      if (!providedStageIds.has(id)) {
        await query('ROLLBACK');
        return res.status(400).json({ 
          error: 'Missing stage in reorder',
          message: `Stage ID ${id} is missing from the reorder payload`
        });
      }
    }
    
    const newOrders = stageOrders.map(s => s.newOrder);
    if (new Set(newOrders).size !== newOrders.length) {
      await query('ROLLBACK');
      return res.status(400).json({ 
        error: 'Duplicate stage orders',
        message: 'Each stage must have a unique order'
      });
    }
    
    const sortedOrders = [...newOrders].sort((a, b) => a - b);
    for (let i = 0; i < sortedOrders.length; i++) {
      if (sortedOrders[i] !== i) {
        await query('ROLLBACK');
        return res.status(400).json({ 
          error: 'Invalid stage order sequence',
          message: `Stage orders must be a contiguous sequence from 0 to ${currentStages.length - 1}. Got: ${sortedOrders.join(', ')}`
        });
      }
    }
    
    const stageIdToStage = new Map(currentStages.map(s => [s.id, s]));
    
    for (const { stageId, newOrder } of stageOrders) {
      const stage = stageIdToStage.get(stageId);
      
      if (!stage) {
        await query('ROLLBACK');
        return res.status(400).json({ 
          error: 'Invalid stage ID',
          message: `Stage ID ${stageId} does not exist for this job`
        });
      }
      
      const isFixedStage = FIXED_STAGES.includes(stage.stage_name);
      
      if (isFixedStage && newOrder !== stage.stage_order) {
        await query('ROLLBACK');
        return res.status(400).json({ 
          error: 'Cannot move fixed stage',
          message: `Stage "${stage.stage_name}" is a fixed stage and must remain at position ${stage.stage_order}`
        });
      }
    }
    
    try {
      for (const { stageId, newOrder } of stageOrders) {
        await query(
          'UPDATE job_pipeline_stages SET stage_order = $1 WHERE id = $2 AND job_id = $3',
          [newOrder, stageId, jobId]
        );
      }
      
      await query('COMMIT');
      
      const result = await query(
        `SELECT id, job_id, stage_name, stage_order, is_default, stage_config, created_at
         FROM job_pipeline_stages 
         WHERE job_id = $1 
         ORDER BY stage_order ASC`,
        [jobId]
      );
      
      res.json({
        success: true,
        stages: result.rows.map(stage => ({
          id: stage.id,
          jobId: stage.job_id,
          stageName: stage.stage_name,
          stageOrder: stage.stage_order,
          isDefault: stage.is_default,
          config: stage.stage_config || {},
          createdAt: stage.created_at
        }))
      });
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('[Workflow Builder] Error reordering stages:', error);
    res.status(500).json({ error: 'Failed to reorder stages', details: error.message });
  }
});

// DELETE /api/jobs/:jobId/pipeline-stages/:stageId - Delete stage (only if no candidates)
app.delete('/api/jobs/:jobId/pipeline-stages/:stageId', requireWorkflowBuilder, async (req, res) => {
  try {
    const { jobId, stageId } = req.params;
    
    const stageResult = await query(
      'SELECT stage_name, is_default FROM job_pipeline_stages WHERE id = $1 AND job_id = $2',
      [stageId, jobId]
    );
    
    if (stageResult.rows.length === 0) {
      return res.status(404).json({ error: 'Stage not found' });
    }
    
    const { stage_name, is_default } = stageResult.rows[0];
    
    if (is_default) {
      return res.status(403).json({ 
        error: 'Cannot delete default stage',
        message: 'Default stages (Screening, Shortlist, Client Endorsement, Offer, Offer Accepted) cannot be deleted'
      });
    }
    
    const countResult = await query(
      'SELECT COUNT(*) as count FROM candidates WHERE job_id = $1 AND current_stage = $2',
      [jobId, stage_name]
    );
    
    const candidateCount = parseInt(countResult.rows[0].count);
    
    if (candidateCount > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete stage with candidates',
        message: `Stage has ${candidateCount} candidate(s). Please move or remove them first.`,
        candidateCount
      });
    }
    
    await query(
      'DELETE FROM job_pipeline_stages WHERE id = $1 AND job_id = $2',
      [stageId, jobId]
    );
    
    console.log('[Workflow Builder] Stage deleted:', { jobId, stageId, stageName: stage_name });
    
    res.json({
      success: true,
      message: `Stage "${stage_name}" deleted successfully`
    });
  } catch (error) {
    console.error('[Workflow Builder] Error deleting stage:', error);
    res.status(500).json({ error: 'Failed to delete stage', details: error.message });
  }
});

// ===========================
// PIPELINE TEMPLATE API ENDPOINTS
// ===========================

// GET /api/pipeline-templates - List all pipeline templates
app.get('/api/pipeline-templates', requireWorkflowBuilder, async (req, res) => {
  try {
    console.log('[Pipeline Templates] Fetching all templates');
    
    const templatesResult = await query(
      `SELECT id, name, description, is_default, created_at, updated_at 
       FROM pipeline_templates 
       ORDER BY is_default DESC, name ASC`
    );
    
    res.json({ templates: templatesResult.rows });
  } catch (error) {
    console.error('[Pipeline Templates] Error fetching templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates', details: error.message });
  }
});

// GET /api/pipeline-templates/:id - Get a single template with stages
app.get('/api/pipeline-templates/:id', requireWorkflowBuilder, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('[Pipeline Templates] Fetching template:', id);
    
    const templateResult = await query(
      'SELECT id, name, description, is_default, created_at, updated_at FROM pipeline_templates WHERE id = $1',
      [parseInt(id)]
    );
    
    console.log('[Pipeline Templates] Template query complete, rows:', templateResult.rows.length);
    
    if (templateResult.rows.length === 0) {
      console.log('[Pipeline Templates] Template not found:', id);
      return res.status(404).json({ error: 'Template not found' });
    }
    
    console.log('[Pipeline Templates] Fetching stages for template:', id);
    const stagesResult = await query(
      'SELECT id, stage_name, stage_order, stage_type, stage_config FROM pipeline_template_stages WHERE template_id = $1 ORDER BY stage_order ASC',
      [parseInt(id)]
    );
    
    console.log('[Pipeline Templates] Stages query complete, rows:', stagesResult.rows.length);
    
    const template = {
      ...templateResult.rows[0],
      stages: stagesResult.rows
    };
    
    console.log('[Pipeline Templates] Sending response for template:', id);
    return res.json(template);
  } catch (error) {
    console.error('[Pipeline Templates] Error fetching template:', error);
    res.status(500).json({ error: 'Failed to fetch template', details: error.message });
  }
});

// POST /api/pipeline-templates - Create a new template
app.post('/api/pipeline-templates', requireWorkflowBuilder, async (req, res) => {
  try {
    const { name, description, stages } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Template name is required' });
    }
    
    if (!stages || !Array.isArray(stages) || stages.length === 0) {
      return res.status(400).json({ error: 'Template must have at least one stage' });
    }
    
    console.log('[Pipeline Templates] Creating new template:', name);
    
    // Create template
    const templateResult = await query(
      'INSERT INTO pipeline_templates (name, description) VALUES ($1, $2) RETURNING id, name, description, is_default, created_at',
      [name.trim(), description || null]
    );
    
    const template = templateResult.rows[0];
    
    // Create stages
    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i];
      await query(
        'INSERT INTO pipeline_template_stages (template_id, stage_name, stage_order, stage_type, stage_config) VALUES ($1, $2, $3, $4, $5)',
        [template.id, stage.name, i, stage.type || 'custom', stage.config || {}]
      );
    }
    
    // Fetch complete template with stages
    const stagesResult = await query(
      'SELECT id, stage_name, stage_order, stage_type, stage_config FROM pipeline_template_stages WHERE template_id = $1 ORDER BY stage_order ASC',
      [template.id]
    );
    
    res.json({
      ...template,
      stages: stagesResult.rows
    });
  } catch (error) {
    console.error('[Pipeline Templates] Error creating template:', error);
    
    if (error.code === '23505') { // Unique constraint violation
      return res.status(409).json({ error: 'A template with this name already exists' });
    }
    
    res.status(500).json({ error: 'Failed to create template', details: error.message });
  }
});

// PUT /api/pipeline-templates/:id - Update a template
app.put('/api/pipeline-templates/:id', requireWorkflowBuilder, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    
    console.log('[Pipeline Templates] Updating template:', id);
    
    const result = await query(
      'UPDATE pipeline_templates SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING id, name, description, is_default, created_at, updated_at',
      [name, description, parseInt(id)]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('[Pipeline Templates] Error updating template:', error);
    res.status(500).json({ error: 'Failed to update template', details: error.message });
  }
});

// DELETE /api/pipeline-templates/:id - Delete a template
app.delete('/api/pipeline-templates/:id', requireWorkflowBuilder, async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('[Pipeline Templates] Deleting template:', id);
    
    // Check if template is the default
    const templateResult = await query(
      'SELECT is_default FROM pipeline_templates WHERE id = $1',
      [parseInt(id)]
    );
    
    if (templateResult.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    if (templateResult.rows[0].is_default) {
      return res.status(400).json({ error: 'Cannot delete the default template' });
    }
    
    // Check if template is in use by jobs (only if column exists)
    try {
      const jobsResult = await query(
        'SELECT COUNT(*) as count FROM jobs WHERE pipeline_template_id = $1',
        [parseInt(id)]
      );
      
      const jobCount = parseInt(jobsResult.rows[0].count);
      
      if (jobCount > 0) {
        return res.status(400).json({ 
          error: 'Template is in use',
          message: `This template is being used by ${jobCount} job(s). Please reassign those jobs to another template first.`,
          jobCount
        });
      }
    } catch (columnError) {
      // Column doesn't exist (Azure DB), skip this check
      // Since jobs were created before templates feature, no jobs use templates
      console.log('[Pipeline Templates] Skipping job usage check - pipeline_template_id column not found');
    }
    
    // Delete template (stages will be deleted automatically due to CASCADE)
    await query('DELETE FROM pipeline_templates WHERE id = $1', [parseInt(id)]);
    
    res.json({ success: true, message: 'Template deleted successfully' });
  } catch (error) {
    console.error('[Pipeline Templates] Error deleting template:', error);
    res.status(500).json({ error: 'Failed to delete template', details: error.message });
  }
});

// POST /api/pipeline-templates/:id/stages - Add a stage to template
app.post('/api/pipeline-templates/:id/stages', requireWorkflowBuilder, async (req, res) => {
  const { id } = req.params;
  const { stage_name, stage_type, stage_config, stage_order } = req.body;
  
  try {
    console.log('[Pipeline Templates] Adding stage to template:', id, 'at position:', stage_order);
    
    await query('BEGIN');
    
    try {
      await query(
        'UPDATE pipeline_template_stages SET stage_order = stage_order + 1000 WHERE template_id = $1 AND stage_order >= $2',
        [parseInt(id), stage_order]
      );
      
      const result = await query(
        'INSERT INTO pipeline_template_stages (template_id, stage_name, stage_order, stage_type, stage_config) VALUES ($1, $2, $3, $4, $5) RETURNING id, stage_name, stage_order, stage_type, stage_config',
        [parseInt(id), stage_name, stage_order, stage_type || 'custom', stage_config || {}]
      );
      
      await query(
        'UPDATE pipeline_template_stages SET stage_order = stage_order - 999 WHERE template_id = $1 AND stage_order >= $2',
        [parseInt(id), stage_order + 1000]
      );
      
      await query('UPDATE pipeline_templates SET updated_at = CURRENT_TIMESTAMP WHERE id = $1', [parseInt(id)]);
      
      await query('COMMIT');
      
      return res.json(result.rows[0]);
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('[Pipeline Templates] Error adding stage:', error);
    
    // Handle duplicate stage name error
    if (error.code === '23505' && error.constraint === 'unique_template_stage_name') {
      return res.status(400).json({ 
        error: 'Duplicate stage name', 
        message: `A stage named "${stage_name}" already exists in this template. Please use a different name.`,
        field: 'stage_name'
      });
    }
    
    return res.status(500).json({ error: 'Failed to add stage', details: error.message });
  }
});

// PUT /api/pipeline-templates/:id/stages/:stageId/config - Update template stage config
app.put('/api/pipeline-templates/:id/stages/:stageId/config', requireWorkflowBuilder, async (req, res) => {
  try {
    const { id, stageId } = req.params;
    const { stage_config } = req.body;
    
    console.log('[Pipeline Templates] Updating stage config:', id, stageId);
    
    const result = await query(
      'UPDATE pipeline_template_stages SET stage_config = $1 WHERE id = $2 AND template_id = $3 RETURNING id, stage_name, stage_order, stage_type, stage_config',
      [stage_config || {}, stageId, parseInt(id)]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Stage not found' });
    }
    
    await query('UPDATE pipeline_templates SET updated_at = CURRENT_TIMESTAMP WHERE id = $1', [parseInt(id)]);
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('[Pipeline Templates] Error updating stage config:', error);
    res.status(500).json({ error: 'Failed to update stage config', details: error.message });
  }
});

// PUT /api/pipeline-templates/:id/stages/reorder - Reorder template stages
app.put('/api/pipeline-templates/:id/stages/reorder', requireWorkflowBuilder, async (req, res) => {
  try {
    const { id } = req.params;
    const { stageOrders } = req.body;
    
    if (!stageOrders || !Array.isArray(stageOrders) || stageOrders.length === 0) {
      return res.status(400).json({ error: 'stageOrders must be a non-empty array' });
    }
    
    console.log('[Pipeline Templates] Reordering stages for template:', id, stageOrders);
    
    // Validate payload structure
    for (const entry of stageOrders) {
      if (!entry || typeof entry !== 'object') {
        return res.status(400).json({ 
          error: 'Invalid stageOrders entry',
          message: 'Each stageOrders entry must be an object with stageId and newOrder fields'
        });
      }
      if (typeof entry.stageId !== 'number' || !Number.isInteger(entry.stageId)) {
        return res.status(400).json({ 
          error: 'Invalid stageId type',
          message: 'All stageId values must be integers'
        });
      }
      if (typeof entry.newOrder !== 'number' || !Number.isInteger(entry.newOrder)) {
        return res.status(400).json({ 
          error: 'Invalid newOrder type',
          message: 'All newOrder values must be integers'
        });
      }
      if (entry.newOrder < 0) {
        return res.status(400).json({ 
          error: 'Invalid newOrder value',
          message: 'Stage order values cannot be negative'
        });
      }
    }
    
    await query('BEGIN');
    
    let currentStagesResult;
    try {
      currentStagesResult = await query(
        'SELECT id, stage_name, stage_order, stage_type FROM pipeline_template_stages WHERE template_id = $1 ORDER BY stage_order ASC FOR UPDATE',
        [parseInt(id)]
      );
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
    
    const currentStages = currentStagesResult.rows;
    
    if (currentStages.length === 0) {
      await query('ROLLBACK');
      return res.status(404).json({ error: 'No stages found for this template' });
    }
    
    if (stageOrders.length !== currentStages.length) {
      await query('ROLLBACK');
      return res.status(400).json({ 
        error: 'Invalid stage count',
        message: `Expected ${currentStages.length} stages, got ${stageOrders.length}`
      });
    }
    
    // Validation: Check all current stage IDs are present
    const providedStageIds = new Set(stageOrders.map(s => s.stageId));
    const currentStageIds = new Set(currentStages.map(s => s.id));
    
    for (const id of currentStageIds) {
      if (!providedStageIds.has(id)) {
        await query('ROLLBACK');
        return res.status(400).json({ 
          error: 'Missing stage in reorder',
          message: `Stage ID ${id} is missing from the reorder payload`
        });
      }
    }
    
    // Validation: Check for duplicate newOrder values
    const newOrders = stageOrders.map(s => s.newOrder);
    if (new Set(newOrders).size !== newOrders.length) {
      await query('ROLLBACK');
      return res.status(400).json({ 
        error: 'Duplicate stage orders',
        message: 'Each stage must have a unique order'
      });
    }
    
    // Validation: Ensure contiguous sequence
    const sortedOrders = [...newOrders].sort((a, b) => a - b);
    for (let i = 0; i < sortedOrders.length; i++) {
      if (sortedOrders[i] !== i) {
        await query('ROLLBACK');
        return res.status(400).json({ 
          error: 'Invalid stage order sequence',
          message: `Stage orders must be a contiguous sequence from 0 to ${currentStages.length - 1}. Got: ${sortedOrders.join(', ')}`
        });
      }
    }
    
    try {
      // Update all stage orders
      for (const { stageId, newOrder } of stageOrders) {
        await query(
          'UPDATE pipeline_template_stages SET stage_order = $1 WHERE id = $2 AND template_id = $3',
          [newOrder, stageId, parseInt(id)]
        );
      }
      
      await query('UPDATE pipeline_templates SET updated_at = CURRENT_TIMESTAMP WHERE id = $1', [parseInt(id)]);
      await query('COMMIT');
      
      // Fetch updated stages
      const updatedStages = await query(
        'SELECT id, stage_name, stage_order, stage_type, stage_config FROM pipeline_template_stages WHERE template_id = $1 ORDER BY stage_order ASC',
        [parseInt(id)]
      );
      
      res.json({ stages: updatedStages.rows });
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('[Pipeline Templates] Error reordering stages:', error);
    res.status(500).json({ error: 'Failed to reorder stages', details: error.message });
  }
});

// DELETE /api/pipeline-templates/:id/stages/:stageId - Delete a stage from template
app.delete('/api/pipeline-templates/:id/stages/:stageId', requireWorkflowBuilder, async (req, res) => {
  try {
    const { id, stageId } = req.params;
    
    console.log('[Pipeline Templates] Deleting stage from template:', id, stageId);
    
    // Check if stage exists and get its type
    const stageResult = await query(
      'SELECT stage_name, stage_type FROM pipeline_template_stages WHERE id = $1 AND template_id = $2',
      [stageId, parseInt(id)]
    );
    
    if (stageResult.rows.length === 0) {
      return res.status(404).json({ error: 'Stage not found' });
    }
    
    const { stage_name, stage_type } = stageResult.rows[0];
    
    // Prevent deletion of fixed stages
    if (stage_type === 'fixed') {
      return res.status(400).json({ 
        error: 'Cannot delete fixed stage',
        message: `Stage "${stage_name}" is a fixed stage and cannot be deleted`
      });
    }
    
    await query('DELETE FROM pipeline_template_stages WHERE id = $1 AND template_id = $2', [stageId, parseInt(id)]);
    await query('UPDATE pipeline_templates SET updated_at = CURRENT_TIMESTAMP WHERE id = $1', [parseInt(id)]);
    
    res.json({ success: true, message: `Stage "${stage_name}" deleted successfully` });
  } catch (error) {
    console.error('[Pipeline Templates] Error deleting stage:', error);
    res.status(500).json({ error: 'Failed to delete stage', details: error.message });
  }
});

// POST /api/jobs/:jobId/assign-template - Assign a template to a job (creates pipeline stages)
app.post('/api/jobs/:jobId/assign-template', requireWorkflowBuilder, async (req, res) => {
  try {
    const { jobId } = req.params;
    const { templateId } = req.body;
    
    if (!templateId) {
      return res.status(400).json({ error: 'templateId is required' });
    }
    
    console.log('[Pipeline Templates] Assigning template to job:', { jobId, templateId });
    
    // Fetch template stages
    const stagesResult = await query(
      'SELECT stage_name, stage_order, stage_type, stage_config FROM pipeline_template_stages WHERE template_id = $1 ORDER BY stage_order ASC',
      [parseInt(templateId)]
    );
    
    if (stagesResult.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found or has no stages' });
    }
    
    await query('BEGIN');
    
    try {
      // Delete existing job pipeline stages
      await query('DELETE FROM job_pipeline_stages WHERE job_id = $1', [jobId]);
      
      // Create new stages from template
      for (const stage of stagesResult.rows) {
        await query(
          'INSERT INTO job_pipeline_stages (job_id, stage_name, stage_order, stage_config) VALUES ($1, $2, $3, $4)',
          [jobId, stage.stage_name, stage.stage_order, stage.stage_config]
        );
      }
      
      // Update job with template reference
      await query(
        'UPDATE jobs SET pipeline_template_id = $1 WHERE id = $2',
        [parseInt(templateId), jobId]
      );
      
      await query('COMMIT');
      
      // Fetch created stages
      const createdStages = await query(
        'SELECT id, stage_name, stage_order, stage_config FROM job_pipeline_stages WHERE job_id = $1 ORDER BY stage_order ASC',
        [jobId]
      );
      
      res.json({ 
        success: true, 
        message: 'Template assigned successfully',
        stages: createdStages.rows
      });
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('[Pipeline Templates] Error assigning template:', error);
    res.status(500).json({ error: 'Failed to assign template', details: error.message });
  }
});

// ============================================
// INTERVIEW SCHEDULING ENDPOINTS
// ============================================

// Utility function to generate time slots
function generateTimeSlots(config) {
  const {
    startDate,
    endDate,
    startTime,
    endTime,
    durationMinutes,
    breakMinutes = 0,
    excludeDates = [],
    excludeDays = []
  } = config;

  const slots = [];
  const current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    const dateStr = current.toISOString().split('T')[0];
    const dayOfWeek = current.getDay();
    
    if (excludeDates.includes(dateStr) || excludeDays.includes(dayOfWeek)) {
      current.setDate(current.getDate() + 1);
      continue;
    }

    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    const dayStart = new Date(current);
    dayStart.setHours(startHour, startMinute, 0, 0);

    const dayEnd = new Date(current);
    dayEnd.setHours(endHour, endMinute, 0, 0);

    let slotStart = new Date(dayStart);
    while (slotStart < dayEnd) {
      const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60000);
      
      if (slotEnd <= dayEnd) {
        slots.push({
          start_time: slotStart.toISOString(),
          end_time: slotEnd.toISOString()
        });
      }

      slotStart = new Date(slotEnd.getTime() + breakMinutes * 60000);
    }

    current.setDate(current.getDate() + 1);
  }

  return slots;
}

// POST /api/jobs/:jobId/stages/:stageId/slots - Create interview slots
// Optional authentication: If authenticated, uses req.user.id; otherwise requires createdBy in body
app.post('/api/jobs/:jobId/stages/:stageId/slots', authenticateRequest, async (req, res) => {
  const { jobId, stageId } = req.params;
  const {
    slotConfig,
    interviewType,
    videoLink,
    location,
    timezone = 'UTC',
    maxBookings = 1,
    interviewerIds = [],
    bufferBefore = 0,
    bufferAfter = 0,
    createdBy
  } = req.body;

  try {
    // Use authenticated user ID if available via middleware, otherwise fall back to body parameter
    const effectiveCreatedBy = req.user?.id || createdBy;
    
    if (!slotConfig || !interviewType || !effectiveCreatedBy) {
      return res.status(400).json({ 
        error: 'Missing required fields: slotConfig, interviewType' + (!effectiveCreatedBy ? ', createdBy (or authentication required)' : '')
      });
    }

    if (!['phone', 'video', 'onsite'].includes(interviewType)) {
      return res.status(400).json({ 
        error: 'Invalid interview type. Must be: phone, video, or onsite' 
      });
    }

    const stageCheck = await query(
      'SELECT id FROM job_pipeline_stages WHERE id = $1 AND job_id = $2',
      [stageId, jobId]
    );

    if (stageCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Stage not found for this job' });
    }

    const timeSlots = generateTimeSlots(slotConfig);

    if (timeSlots.length === 0) {
      return res.status(400).json({ error: 'No slots generated from configuration' });
    }

    await query('BEGIN');
    const insertedSlots = [];

    try {
      for (const slot of timeSlots) {
        const result = await query(`
          INSERT INTO interview_slots (
            job_id, stage_id, interviewer_ids, start_time, end_time,
            duration_minutes, buffer_before_minutes, buffer_after_minutes,
            interview_type, video_link, location, timezone, max_bookings,
            created_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          RETURNING *
        `, [
          jobId, stageId, JSON.stringify(interviewerIds),
          slot.start_time, slot.end_time, slotConfig.durationMinutes,
          bufferBefore, bufferAfter, interviewType, videoLink, location,
          timezone, maxBookings, effectiveCreatedBy
        ]);

        insertedSlots.push(result.rows[0]);
      }

      await query('COMMIT');
      
      res.status(201).json({
        success: true,
        message: `Created ${insertedSlots.length} interview slots`,
        slots: insertedSlots
      });
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error creating interview slots:', error);
    res.status(500).json({ error: 'Failed to create interview slots' });
  }
});

// POST /api/interview-slots - Create general availability interview slots (not tied to specific job/stage)
// Optional authentication: If authenticated, uses req.user.id; otherwise requires createdBy in body
app.post('/api/interview-slots', optionalAuth, async (req, res) => {
  const {
    start_time,
    end_time,
    duration_minutes,
    interview_type,
    video_link,
    location,
    timezone = 'UTC',
    max_bookings = 1,
    interviewer_ids = [],
    buffer_before = 0,
    buffer_after = 0,
    job_id = null,
    stage_id = null,
    createdBy
  } = req.body;

  try {
    // Use authenticated user ID if available via middleware, otherwise fall back to body parameter
    const effectiveCreatedBy = req.user?.id || createdBy;
    
    if (!start_time || !end_time || !duration_minutes || !interview_type || !effectiveCreatedBy) {
      return res.status(400).json({ 
        error: 'Missing required fields: start_time, end_time, duration_minutes, interview_type' + (!effectiveCreatedBy ? ', createdBy (or authentication required)' : '')
      });
    }

    if (!['phone', 'video', 'onsite'].includes(interview_type)) {
      return res.status(400).json({ 
        error: 'Invalid interview type. Must be: phone, video, or onsite' 
      });
    }

    const result = await query(`
      INSERT INTO interview_slots (
        job_id, stage_id, interviewer_ids, start_time, end_time,
        duration_minutes, buffer_before_minutes, buffer_after_minutes,
        interview_type, video_link, location, timezone, max_bookings,
        created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `, [
      job_id, stage_id, JSON.stringify(interviewer_ids),
      start_time, end_time, duration_minutes,
      buffer_before, buffer_after, interview_type, video_link, location,
      timezone, max_bookings, effectiveCreatedBy
    ]);

    res.status(201).json({
      success: true,
      message: 'Created interview slot',
      slot: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating interview slot:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create interview slot',
      message: error.message 
    });
  }
});

// GET /api/jobs/:jobId/stages/:stageId/slots - Get all slots for a job/stage
app.get('/api/jobs/:jobId/stages/:stageId/slots', async (req, res) => {
  const { jobId, stageId } = req.params;
  const { status } = req.query;

  try {
    let queryText = `
      SELECT s.*, 
        COALESCE(
          json_agg(
            json_build_object(
              'id', b.id,
              'candidate_id', b.candidate_id,
              'status', b.status,
              'booked_at', b.booked_at,
              'confirmed_email', b.confirmed_email
            )
          ) FILTER (WHERE b.id IS NOT NULL), '[]'
        ) as bookings
      FROM interview_slots s
      LEFT JOIN interview_bookings b ON b.slot_id = s.id
      WHERE s.job_id = $1 AND s.stage_id = $2
    `;

    const params = [jobId, stageId];

    if (status) {
      queryText += ` AND s.status = $3`;
      params.push(status);
    }

    queryText += ` GROUP BY s.id ORDER BY s.start_time ASC`;

    const result = await query(queryText, params);
    
    res.json({
      success: true,
      slots: result.rows
    });
  } catch (error) {
    console.error('Error fetching slots:', error);
    res.status(500).json({ error: 'Failed to fetch slots' });
  }
});

// GET /api/interview-slots/my-slots - Get all slots created by current client
// Optional authentication: Uses req.user.id if authenticated, otherwise requires userId in query
app.get('/api/interview-slots/my-slots', optionalAuth, async (req, res) => {
  try {
    const userId = req.user?.id || req.query.userId; // Derived from validated auth token or query param
    
    if (!userId) {
      return res.status(400).json({
        error: 'Missing userId',
        message: 'Either authenticate or provide userId in query parameters'
      });
    }
    
    const result = await query(`
      SELECT 
        s.*, 
        j.title as job_title,
        jps.stage_name
      FROM interview_slots s
      LEFT JOIN jobs j ON j.id = s.job_id
      LEFT JOIN job_pipeline_stages jps ON jps.id = s.stage_id
      WHERE s.created_by = $1
      ORDER BY s.start_time DESC
    `, [userId]);
    
    res.json({
      success: true,
      slots: result.rows
    });
  } catch (error) {
    console.error('Error fetching client slots:', error);
    res.status(500).json({ error: 'Failed to fetch slots' });
  }
});

// GET /api/candidates/:candidateId/jobs/:jobId/available-slots - Get available slots (public)
app.get('/api/candidates/:candidateId/jobs/:jobId/available-slots', async (req, res) => {
  const { candidateId, jobId } = req.params;
  const { stageId } = req.query;

  try {
    let queryText = `
      SELECT 
        s.id, s.start_time, s.end_time, s.duration_minutes,
        s.interview_type, s.video_link, s.location, s.timezone,
        s.max_bookings, s.current_bookings,
        (s.max_bookings - s.current_bookings) as available_spots
      FROM interview_slots s
      WHERE s.job_id = $1
        AND s.status = 'available'
        AND s.current_bookings < s.max_bookings
        AND s.start_time > NOW()
    `;

    const params = [jobId];

    if (stageId) {
      queryText += ` AND s.stage_id = $2`;
      params.push(stageId);
    }

    queryText += ` ORDER BY s.start_time ASC`;

    const result = await query(queryText, params);
    
    res.json({
      success: true,
      availableSlots: result.rows
    });
  } catch (error) {
    console.error('Error fetching available slots:', error);
    res.status(500).json({ error: 'Failed to fetch available slots' });
  }
});

// POST /api/slots/:slotId/book - Book an interview slot
app.post('/api/slots/:slotId/book', async (req, res) => {
  const { slotId } = req.params;
  const { candidateId, confirmedEmail, candidateTimezone = 'UTC', notes } = req.body;

  if (!candidateId || !confirmedEmail) {
    return res.status(400).json({ 
      error: 'Missing required fields: candidateId, confirmedEmail' 
    });
  }

  try {
    await query('BEGIN');

    // Lock and validate the slot
    const slotResult = await query(
      `SELECT s.*, j.id as job_id_check 
       FROM interview_slots s
       JOIN job_pipeline_stages ps ON ps.id = s.stage_id
       JOIN jobs j ON j.id = ps.job_id
       WHERE s.id = $1 FOR UPDATE`,
      [slotId]
    );

    if (slotResult.rows.length === 0) {
      await query('ROLLBACK');
      return res.status(404).json({ error: 'Interview slot not found' });
    }

    const slot = slotResult.rows[0];

    // Verify slot is still available (check again after lock)
    if (slot.current_bookings >= slot.max_bookings) {
      await query('ROLLBACK');
      return res.status(409).json({ 
        error: 'This slot is no longer available. Please select another time.' 
      });
    }

    // Verify slot is in the future (at least 4 hours from now)
    const slotTime = new Date(slot.start_time);
    const minBookingTime = new Date(Date.now() + 4 * 60 * 60 * 1000);
    
    if (slotTime < minBookingTime) {
      await query('ROLLBACK');
      return res.status(400).json({ 
        error: 'Cannot book slots less than 4 hours in advance' 
      });
    }

    // Verify candidate exists and belongs to the same job
    const candidateCheck = await query(
      `SELECT id FROM candidates WHERE id = $1 AND job_id = $2`,
      [candidateId, slot.job_id]
    );

    if (candidateCheck.rows.length === 0) {
      await query('ROLLBACK');
      return res.status(403).json({ 
        error: 'Candidate not found or does not belong to this job' 
      });
    }

    // Verify stage belongs to the same job
    const stageCheck = await query(
      `SELECT id FROM job_pipeline_stages WHERE id = $1 AND job_id = $2`,
      [slot.stage_id, slot.job_id]
    );

    if (stageCheck.rows.length === 0) {
      await query('ROLLBACK');
      return res.status(400).json({ 
        error: 'Invalid stage configuration' 
      });
    }

    // Check for existing confirmed booking for this candidate and stage
    const existingBooking = await query(
      `SELECT id FROM interview_bookings 
       WHERE candidate_id = $1 AND stage_id = $2 AND status = 'confirmed'`,
      [candidateId, slot.stage_id]
    );

    if (existingBooking.rows.length > 0) {
      await query('ROLLBACK');
      return res.status(409).json({ 
        error: 'You already have a confirmed interview for this stage' 
      });
    }

    // Create the booking
    const bookingResult = await query(`
      INSERT INTO interview_bookings (
        slot_id, candidate_id, job_id, stage_id,
        confirmed_email, candidate_timezone, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      slotId, candidateId, slot.job_id, slot.stage_id,
      confirmedEmail, candidateTimezone, notes
    ]);

    // The trigger update_slot_booking_count will auto-increment current_bookings

    await query('COMMIT');

    const booking = bookingResult.rows[0];

    res.status(201).json({
      success: true,
      message: 'Interview booked successfully',
      booking: {
        ...booking,
        slot: slot
      }
    });
  } catch (error) {
    await query('ROLLBACK');
    console.error('Error booking slot:', error);
    res.status(500).json({ error: 'Failed to book interview slot' });
  }
});

// GET /api/bookings/:bookingToken - Get booking details by token
app.get('/api/bookings/:bookingToken', async (req, res) => {
  const { bookingToken } = req.params;

  try {
    const result = await query(`
      SELECT 
        b.*,
        s.start_time, s.end_time, s.duration_minutes,
        s.interview_type, s.video_link, s.location, s.timezone as slot_timezone,
        j.title as job_title, j.department as company_name,
        c.first_name, c.last_name, c.email
      FROM interview_bookings b
      JOIN interview_slots s ON s.id = b.slot_id
      JOIN jobs j ON j.id = b.job_id
      JOIN candidates c ON c.id = b.candidate_id
      WHERE b.booking_token = $1
    `, [bookingToken]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.json({
      success: true,
      booking: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({ error: 'Failed to fetch booking details' });
  }
});

// POST /api/bookings/:bookingToken/cancel - Cancel booking
app.post('/api/bookings/:bookingToken/cancel', async (req, res) => {
  const { bookingToken } = req.params;
  const { cancellationReason } = req.body;

  try {
    await query('BEGIN');

    const result = await query(
      `UPDATE interview_bookings 
       SET status = 'cancelled', 
           cancellation_reason = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE booking_token = $2 AND status = 'confirmed'
       RETURNING *`,
      [cancellationReason, bookingToken]
    );

    if (result.rows.length === 0) {
      await query('ROLLBACK');
      return res.status(404).json({ 
        error: 'Booking not found or already cancelled' 
      });
    }

    await query('COMMIT');

    res.json({
      success: true,
      message: 'Interview cancelled successfully',
      booking: result.rows[0]
    });
  } catch (error) {
    await query('ROLLBACK');
    console.error('Error cancelling booking:', error);
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
});

// GET /api/jobs/:jobId/bookings - Get all bookings for a job
app.get('/api/jobs/:jobId/bookings', async (req, res) => {
  const { jobId } = req.params;
  const { status, stageId, startDate, endDate } = req.query;

  try {
    let queryText = `
      SELECT 
        b.*,
        s.start_time, s.end_time, s.duration_minutes,
        s.interview_type, s.video_link, s.location,
        c.first_name, c.last_name, c.email, c.phone,
        ps.stage_name
      FROM interview_bookings b
      JOIN interview_slots s ON s.id = b.slot_id
      JOIN candidates c ON c.id = b.candidate_id
      JOIN job_pipeline_stages ps ON ps.id = b.stage_id
      WHERE b.job_id = $1
    `;

    const params = [jobId];
    let paramIndex = 2;

    if (status) {
      queryText += ` AND b.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (stageId) {
      queryText += ` AND b.stage_id = $${paramIndex}`;
      params.push(stageId);
      paramIndex++;
    }

    if (startDate) {
      queryText += ` AND s.start_time >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      queryText += ` AND s.start_time <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    queryText += ` ORDER BY s.start_time ASC`;

    const result = await query(queryText, params);
    
    res.json({
      success: true,
      bookings: result.rows
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// DELETE /api/slots/:slotId - Delete a slot (only if no confirmed bookings)
app.delete('/api/slots/:slotId', async (req, res) => {
  const { slotId } = req.params;

  try {
    await query('BEGIN');

    const bookingCheck = await query(
      `SELECT COUNT(*) as count FROM interview_bookings 
       WHERE slot_id = $1 AND status = 'confirmed'`,
      [slotId]
    );

    if (parseInt(bookingCheck.rows[0].count) > 0) {
      await query('ROLLBACK');
      return res.status(409).json({ 
        error: 'Cannot delete slot with confirmed bookings' 
      });
    }

    const result = await query(
      'DELETE FROM interview_slots WHERE id = $1 RETURNING *',
      [slotId]
    );

    if (result.rows.length === 0) {
      await query('ROLLBACK');
      return res.status(404).json({ error: 'Slot not found' });
    }

    await query('COMMIT');

    res.json({
      success: true,
      message: 'Slot deleted successfully'
    });
  } catch (error) {
    await query('ROLLBACK');
    console.error('Error deleting slot:', error);
    res.status(500).json({ error: 'Failed to delete slot' });
  }
});

// =============================================================================
// STAGE LIBRARY ENDPOINTS - Client-specific stage templates
// =============================================================================

// Middleware to extract and validate client ID from request
const getClientId = (req) => {
  // ⚠️  SECURITY WARNING: This implementation is for DEMO/DEV purposes only!
  //
  // PRODUCTION REQUIREMENTS:
  // 1. Derive clientId from authenticated JWT token or server-side session
  // 2. Validate token signature using secret key
  // 3. Never trust client-provided headers for tenant isolation
  // 4. Use proper auth middleware (e.g., passport, express-jwt) 
  //
  // Current implementation uses X-Client-ID header which is still spoofable.
  // This provides protection at the application layer but NOT at the authentication layer.
  // A malicious user can still set any X-Client-ID header value.
  //
  // Example production fix:
  //   const token = req.headers['authorization']?.split(' ')[1];
  //   const decoded = jwt.verify(token, process.env.JWT_SECRET);
  //   return decoded.clientId;
  //
  const clientId = req.headers['x-client-id'];
  
  if (!clientId) {
    // For demo/dev mode, return null to create client-agnostic stages
    // NULL client_id creates stages that are accessible to all clients
    return null;
  }
  
  return clientId;
};

// GET /api/stage-library - Get all stage templates for authenticated client
app.get('/api/stage-library', async (req, res) => {
  try {
    // Security: Get clientId from server-side auth context, NOT from client input
    const clientId = getClientId(req);
    console.log('[Stage Library] Fetching templates for clientId:', clientId);

    // Only return client-specific custom stages (no default templates)
    // Default templates are hidden unless client explicitly creates them
    // Use IS NOT DISTINCT FROM to properly handle NULL client_id
    const result = await query(`
      SELECT 
        id, name, description, category, icon,
        client_id, is_default, created_at
      FROM stage_library
      WHERE client_id IS NOT DISTINCT FROM $1
      ORDER BY 
        category ASC,
        name ASC
    `, [clientId]);

    console.log('[Stage Library] Query returned', result.rows.length, 'templates');
    console.log('[Stage Library] Templates:', result.rows.map(r => r.name).join(', ') || '(none)');

    // Prevent browser caching to ensure fresh data
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    res.json({
      success: true,
      templates: result.rows
    });
  } catch (error) {
    console.error('[Stage Library] Error fetching stage library:', error);
    res.status(500).json({ error: 'Failed to fetch stage library' });
  }
});

// GET /api/stage-library/:id - Get specific stage template
app.get('/api/stage-library/:id', async (req, res) => {
  const { id } = req.params;
  
  // Security: Get clientId from server-side auth context
  const clientId = getClientId(req);

  try {
    const result = await query(
      'SELECT * FROM stage_library WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Stage template not found' });
    }

    const template = result.rows[0];

    // Security: Verify ownership - only return if default OR owned by authenticated client
    if (!template.is_default && template.client_id !== clientId) {
      return res.status(403).json({ 
        error: 'You do not have permission to view this template' 
      });
    }

    res.json({
      success: true,
      template: template
    });
  } catch (error) {
    console.error('Error fetching stage template:', error);
    res.status(500).json({ error: 'Failed to fetch stage template' });
  }
});

// POST /api/stage-library - Create new client-specific stage template
app.post('/api/stage-library', async (req, res) => {
  const { name, description, category, icon, userId } = req.body;
  
  // Security: Get clientId from server-side auth context
  const clientId = getClientId(req);

  if (!name) {
    return res.status(400).json({ 
      error: 'Missing required field: name' 
    });
  }

  try {
    const result = await query(`
      INSERT INTO stage_library (
        name, description, category, icon, client_id, created_by, is_default
      )
      VALUES ($1, $2, $3, $4, $5, $6, FALSE)
      RETURNING *
    `, [name, description, category, icon, clientId, userId || null]);

    res.status(201).json({
      success: true,
      message: 'Stage template created successfully',
      template: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating stage template:', error);
    
    if (error.code === '23505') {
      return res.status(409).json({ 
        error: 'A stage template with this name already exists for your organization' 
      });
    }
    
    res.status(500).json({ error: 'Failed to create stage template' });
  }
});

// PUT /api/stage-library/:id - Update client-specific stage template
app.put('/api/stage-library/:id', async (req, res) => {
  const { id } = req.params;
  const { name, description, category, icon } = req.body;
  
  // Security: Get clientId from server-side auth context
  const clientId = getClientId(req);

  try {
    const checkResult = await query(
      'SELECT * FROM stage_library WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Stage template not found' });
    }

    const template = checkResult.rows[0];

    if (template.is_default) {
      return res.status(403).json({ 
        error: 'Cannot modify default Teamified templates' 
      });
    }

    // Security: Verify ownership - prevent cross-tenant modification
    if (template.client_id !== clientId) {
      return res.status(403).json({ 
        error: 'You do not have permission to modify this template' 
      });
    }

    const result = await query(`
      UPDATE stage_library
      SET 
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        category = COALESCE($3, category),
        icon = COALESCE($4, icon),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *
    `, [name, description, category, icon, id]);

    res.json({
      success: true,
      message: 'Stage template updated successfully',
      template: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating stage template:', error);
    res.status(500).json({ error: 'Failed to update stage template' });
  }
});

// DELETE /api/stage-library/:id - Delete client-specific stage template
app.delete('/api/stage-library/:id', async (req, res) => {
  const { id } = req.params;
  
  // Security: Get clientId from server-side auth context
  const clientId = getClientId(req);

  try {
    const checkResult = await query(
      'SELECT * FROM stage_library WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Stage template not found' });
    }

    const template = checkResult.rows[0];

    if (template.is_default) {
      return res.status(403).json({ 
        error: 'Cannot delete default Teamified templates' 
      });
    }

    // Security: Verify ownership - prevent cross-tenant deletion
    if (template.client_id !== clientId) {
      return res.status(403).json({ 
        error: 'You do not have permission to delete this template' 
      });
    }

    await query('DELETE FROM stage_library WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Stage template deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting stage template:', error);
    res.status(500).json({ error: 'Failed to delete stage template' });
  }
});

// GET /api/feature-flags - Public endpoint to check enabled features (no auth required)
app.get('/api/feature-flags', (req, res) => {
  res.json({
    workflowBuilder: WORKFLOW_BUILDER_ENABLED,
    linkedin: LINKEDIN_ENABLED
  });
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

export { app };

if (import.meta.url === `file://${process.argv[1]}`) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 API available at http://localhost:${PORT}/api/jobs`);
  });
}
