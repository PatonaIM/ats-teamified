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

app.use(cors());
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
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `;
    
    const params = [
      jobData.title,
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

if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 API available at http://localhost:${PORT}/api/jobs`);
});
