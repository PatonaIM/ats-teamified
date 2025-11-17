import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from './db.js';
import OpenAI from 'openai';
import { postJobToLinkedIn, shouldAutoPostToLinkedIn, syncJobToLinkedIn, getLinkedInSyncStatus, retryLinkedInSync } from './services/linkedin.js';
import { getCandidates, getCandidateById, createCandidate, updateCandidate, addCandidateDocument, addCandidateCommunication, moveCandidateToStage, deleteCandidate } from './services/candidates.js';
import sanitizeHtml from 'sanitize-html';
import { randomUUID } from 'crypto';

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
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'X-API-Key']
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
        COALESCE(status, 'published') as status,
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
      queryText += ` AND COALESCE(status, 'published') = $${paramIndex}`;
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
    
    if (jobId) filters.jobId = parseInt(jobId);
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
    const candidate = await getCandidateById(parseInt(id));
    
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
    const candidate = await updateCandidate(parseInt(id), req.body);
    
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
    const result = await deleteCandidate(parseInt(id));
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
    const document = await addCandidateDocument(parseInt(id), req.body);
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
    const communication = await addCandidateCommunication(parseInt(id), req.body);
    res.status(201).json(communication);
  } catch (error) {
    console.error('[Candidates API] Error adding communication:', error);
    res.status(500).json({ error: 'Failed to add communication', details: error.message });
  }
});

// PUT /api/candidates/:id/stage - Move candidate to different pipeline stage
app.put('/api/candidates/:id/stage', async (req, res) => {
  try {
    const { id } = req.params;
    const { stage, userId, notes } = req.body;
    
    if (!stage) {
      return res.status(400).json({ error: 'Stage is required' });
    }
    
    const candidate = await moveCandidateToStage(parseInt(id), stage, userId, notes);
    res.json(candidate);
  } catch (error) {
    console.error('[Candidates API] Error moving candidate:', error);
    res.status(500).json({ error: 'Failed to move candidate', details: error.message });
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
      [parseInt(jobId)]
    );
    
    res.json({
      success: true,
      jobId: parseInt(jobId),
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
      [parseInt(jobId), stageName, stageOrder, false, JSON.stringify(config || {})]
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
      [JSON.stringify(config), parseInt(stageId), parseInt(jobId)]
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
      [parseInt(stageId), parseInt(jobId)]
    );
    
    if (stageResult.rows.length === 0) {
      return res.status(404).json({ error: 'Stage not found' });
    }
    
    const stageName = stageResult.rows[0].stage_name;
    
    const countResult = await query(
      'SELECT COUNT(*) as count FROM candidates WHERE job_id = $1 AND current_stage = $2',
      [parseInt(jobId), stageName]
    );
    
    const candidateCount = parseInt(countResult.rows[0].count);
    const canDelete = candidateCount === 0;
    
    console.log('[Workflow Builder] Stage candidate count:', { jobId, stageId, stageName, candidateCount, canDelete });
    
    res.json({
      success: true,
      jobId: parseInt(jobId),
      stageId: parseInt(stageId),
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

// DELETE /api/jobs/:jobId/pipeline-stages/:stageId - Delete stage (only if no candidates)
app.delete('/api/jobs/:jobId/pipeline-stages/:stageId', requireWorkflowBuilder, async (req, res) => {
  try {
    const { jobId, stageId } = req.params;
    
    const stageResult = await query(
      'SELECT stage_name, is_default FROM job_pipeline_stages WHERE id = $1 AND job_id = $2',
      [parseInt(stageId), parseInt(jobId)]
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
      [parseInt(jobId), stage_name]
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
      [parseInt(stageId), parseInt(jobId)]
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
