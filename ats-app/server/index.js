import express from 'express';
import cors from 'cors';
import { query } from './db.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

app.get('/api/jobs', async (req, res) => {
  try {
    const { employmentType, status, search } = req.query;
    
    let queryText = `
      SELECT 
        id,
        title,
        employment_type,
        status,
        company_name,
        location,
        remote_ok,
        salary_min,
        salary_max,
        description,
        requirements,
        benefits,
        created_at,
        updated_at,
        candidate_count,
        active_candidates,
        recruiter_name,
        linkedin_synced
      FROM jobs
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;

    if (employmentType && employmentType !== 'all') {
      queryText += ` AND employment_type = $${paramIndex}`;
      params.push(employmentType);
      paramIndex++;
    }

    if (status && status !== 'all') {
      queryText += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (search) {
      queryText += ` AND (title ILIKE $${paramIndex} OR company_name ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    queryText += ' ORDER BY created_at DESC';

    const result = await query(queryText, params);
    res.json({ jobs: result.rows, total: result.rows.length });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ error: 'Failed to fetch jobs', details: error.message });
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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
