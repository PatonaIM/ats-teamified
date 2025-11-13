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
    
    // Validate required fields
    if (!jobData.title || !jobData.employmentType) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        message: 'Job title and employment type are required' 
      });
    }
    
    // Convert camelCase employment type to database format
    const employmentTypeMap = {
      'fullTime': 'Full-time',
      'partTime': 'Part-time',
      'contract': 'Contract',
      'eor': 'EOR'
    };
    
    const insertQuery = `
      INSERT INTO jobs (
        title,
        employment_type,
        description,
        requirements,
        department,
        city,
        country,
        remote_flag,
        salary_from,
        salary_to,
        salary_currency,
        salary_text,
        job_status,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `;
    
    const params = [
      jobData.title,
      employmentTypeMap[jobData.employmentType] || 'Full-time',
      jobData.description || '',
      jobData.keySkills || '',
      'Engineering',
      'Remote',
      'Global',
      true,
      null,
      null,
      'USD',
      '',
      'active'
    ];
    
    console.log('[Backend] Inserting new job:', jobData.title);
    const result = await query(insertQuery, params);
    
    const newJob = result.rows[0];
    console.log('[Backend] Job created successfully:', newJob.id);
    
    // Return normalized job data
    const normalizedJob = {
      ...newJob,
      employment_type: normalizeEmploymentType(newJob.employment_type),
      status: newJob.job_status || newJob.status,
      company_name: newJob.department,
      location: `${newJob.city}, ${newJob.country}`,
      remote_ok: newJob.remote_flag,
      salary_min: newJob.salary_from,
      salary_max: newJob.salary_to,
      salary_display: `${newJob.salary_currency} ${newJob.salary_text}`,
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
