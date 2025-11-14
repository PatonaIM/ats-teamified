import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control']
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
      SELECT 
        id,
        title,
        employment_type,
        COALESCE(status::text, job_status::text) as status,
        department as company_name,
        CONCAT(city, ', ', country) as location,
        remote_flag as remote_ok,
        salary_from as salary_min,
        salary_to as salary_max,
        CONCAT(salary_currency, ' ', salary_text) as salary_display,
        description,
        requirements,
        benefits,
        created_at,
        updated_at,
        0 as candidate_count,
        0 as active_candidates,
        'HR Team' as recruiter_name,
        false as linkedin_synced
      FROM jobs
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
      queryText += ` AND (status::text = $${paramIndex} OR job_status::text = $${paramIndex})`;
      params.push(status);
      paramIndex++;
    }

    if (search) {
      queryText += ` AND (title ILIKE $${paramIndex} OR department ILIKE $${paramIndex} OR location ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    queryText += ' ORDER BY created_at DESC';

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
        contract_duration,
        contract_value,
        service_scope,
        deliverable_milestones,
        payment_schedule,
        hourly_rate,
        hours_per_week,
        max_budget,
        cost_center,
        annual_salary,
        benefits_package,
        total_compensation,
        headcount_impact,
        local_salary,
        eor_service_fee,
        compliance_costs,
        timezone,
        remote_capabilities,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `;
    
    const params = [
      jobData.title,
      generateSlug(jobData.title), // Auto-generate URL-safe slug
      employmentTypeMap[jobData.employmentType] || 'Full-time',
      jobData.description || '',
      jobData.keySkills || '',
      finalDepartment || 'Engineering',
      jobData.experienceLevel || 'mid',
      jobData.city || 'Remote',
      jobData.country || 'Global',
      jobData.remoteOk || false,
      jobData.salaryMin ? parseInt(jobData.salaryMin) : null,
      jobData.salaryMax ? parseInt(jobData.salaryMax) : null,
      jobData.salaryCurrency || 'USD',
      jobStatus,
      'internal_ats', // source: internal ATS system
      createdByRole,
      // Contract fields
      jobData.contractDuration || null,
      jobData.contractValue ? parseFloat(jobData.contractValue.replace(/[^0-9.]/g, '')) : null,
      jobData.serviceScope || null,
      jobData.deliverableMilestones || null,
      jobData.paymentSchedule || null,
      // Part-time fields
      jobData.hourlyRate ? parseFloat(jobData.hourlyRate.replace(/[^0-9.]/g, '')) : null,
      jobData.hoursPerWeek ? parseInt(jobData.hoursPerWeek) : null,
      jobData.maxBudget ? parseFloat(jobData.maxBudget.replace(/[^0-9.]/g, '')) : null,
      jobData.costCenter || null,
      // Full-time fields
      jobData.annualSalary ? parseFloat(jobData.annualSalary.replace(/[^0-9.]/g, '')) : null,
      jobData.benefitsPackage || null,
      jobData.totalCompensation ? parseFloat(jobData.totalCompensation.replace(/[^0-9.]/g, '')) : null,
      jobData.headcountImpact || null,
      // EOR fields
      jobData.localSalary ? parseFloat(jobData.localSalary.replace(/[^0-9.]/g, '')) : null,
      jobData.eorServiceFee ? parseFloat(jobData.eorServiceFee.replace(/[^0-9.]/g, '')) : null,
      jobData.complianceCosts ? parseFloat(jobData.complianceCosts.replace(/[^0-9.]/g, '')) : null,
      jobData.timezone || null,
      jobData.remoteCapabilities || null
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
      linkedin_synced: false
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
