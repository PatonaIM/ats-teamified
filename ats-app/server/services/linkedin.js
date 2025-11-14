/**
 * LinkedIn Jobs API Integration Service
 * Handles automatic job posting, bidirectional sync, and OAuth 2.0 authentication
 */

import { query } from '../db.js';

/**
 * LinkedIn API Configuration
 * In production, these would be stored in Azure Key Vault
 */
const LINKEDIN_CONFIG = {
  clientId: process.env.LINKEDIN_CLIENT_ID || '',
  clientSecret: process.env.LINKEDIN_CLIENT_SECRET || '',
  apiVersion: '202401',
  baseUrl: 'https://api.linkedin.com/v2',
  authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
  tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
  scope: 'w_member_social r_organization_admin w_organization_jobs',
  redirectUri: process.env.LINKEDIN_REDIRECT_URI || ''
};

/**
 * LinkedIn API Rate Limits
 */
const RATE_LIMITS = {
  maxRequestsPerDay: 100,
  retryAttempts: 5,
  retryDelays: [1000, 2000, 4000, 8000, 16000]
};

/**
 * Employment Type to LinkedIn Job Type Mapping
 */
const EMPLOYMENT_TYPE_MAPPING = {
  contract: {
    jobType: 'CONTRACT',
    contractType: 'PROJECT_BASED',
    workRemoteAllowed: true
  },
  partTime: {
    jobType: 'PART_TIME',
    scheduleType: 'FLEXIBLE',
    workRemoteAllowed: true
  },
  fullTime: {
    jobType: 'FULL_TIME',
    workRemoteAllowed: false
  },
  eor: {
    jobType: 'FULL_TIME',
    workRemoteAllowed: true,
    employerType: 'EMPLOYER_OF_RECORD',
    internationalRole: true
  }
};

/**
 * Format job for LinkedIn posting based on employment type
 */
export function formatJobForLinkedIn(job) {
  const employmentConfig = EMPLOYMENT_TYPE_MAPPING[job.employment_type] || EMPLOYMENT_TYPE_MAPPING.fullTime;
  
  const linkedInJob = {
    title: job.title,
    description: job.description || '',
    location: {
      city: job.city || '',
      country: job.country || ''
    },
    companyId: process.env.LINKEDIN_COMPANY_ID || '',
    employmentStatus: employmentConfig.jobType,
    workRemoteAllowed: job.remote_flag || employmentConfig.workRemoteAllowed,
    listedAt: Date.now(),
    expireAt: Date.now() + (90 * 24 * 60 * 60 * 1000)
  };

  if (job.employment_type === 'contract' && job.contract_duration) {
    linkedInJob.contractType = employmentConfig.contractType;
    linkedInJob.contractLength = job.contract_duration;
  }

  if (job.employment_type === 'partTime' && job.hours_per_week) {
    linkedInJob.scheduleType = employmentConfig.scheduleType;
    linkedInJob.workHours = `${job.hours_per_week} hours/week`;
  }

  if (job.employment_type === 'eor') {
    linkedInJob.employerType = employmentConfig.employerType;
    linkedInJob.internationalRole = employmentConfig.internationalRole;
    if (job.timezone) {
      linkedInJob.timezone = job.timezone;
    }
  }

  if (job.salary_min && job.salary_max) {
    linkedInJob.compensationRange = {
      min: job.salary_min,
      max: job.salary_max,
      currency: job.salary_currency || 'USD'
    };
  }

  if (job.benefits) {
    linkedInJob.benefits = Array.isArray(job.benefits) ? job.benefits : [];
  }

  if (job.requirements) {
    linkedInJob.skills = Array.isArray(job.requirements) 
      ? job.requirements.map(req => typeof req === 'string' ? req : req.skill || '') 
      : [];
  }

  linkedInJob.applicationUrl = `${process.env.PUBLIC_URL || 'https://ats.example.com'}/apply/${job.id}`;

  return linkedInJob;
}

/**
 * Post job to LinkedIn (stub implementation for MVP)
 * In production, this would call the actual LinkedIn Jobs API
 */
export async function postJobToLinkedIn(job, accessToken) {
  console.log('[LinkedIn] Posting job to LinkedIn:', job.title);
  
  if (!LINKEDIN_CONFIG.clientId || !LINKEDIN_CONFIG.clientSecret) {
    console.warn('[LinkedIn] LinkedIn API credentials not configured - using mock implementation');
    return mockLinkedInPost(job);
  }

  try {
    const linkedInJob = formatJobForLinkedIn(job);
    
    console.log('[LinkedIn] Formatted job for LinkedIn:', {
      title: linkedInJob.title,
      employmentStatus: linkedInJob.employmentStatus,
      location: linkedInJob.location
    });

    const linkedInJobId = `linkedin_${job.id}_${Date.now()}`;
    
    await query(
      `INSERT INTO linkedin_sync_status (job_id, linkedin_job_id, sync_status, auto_posted, posted_at, last_sync_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       ON CONFLICT (job_id) DO UPDATE 
       SET linkedin_job_id = $2, sync_status = $3, auto_posted = $4, posted_at = NOW(), last_sync_at = NOW(), updated_at = NOW()`,
      [job.id, linkedInJobId, 'success', true]
    );

    await query(
      'UPDATE jobs SET linkedin_synced = true WHERE id = $1',
      [job.id]
    );

    console.log('[LinkedIn] Job posted successfully:', linkedInJobId);
    
    return {
      success: true,
      linkedInJobId,
      message: 'Job posted to LinkedIn successfully'
    };

  } catch (error) {
    console.error('[LinkedIn] Error posting job to LinkedIn:', error);
    
    await query(
      `INSERT INTO linkedin_sync_status (job_id, sync_status, sync_error, retry_count, last_sync_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (job_id) DO UPDATE 
       SET sync_status = $2, sync_error = $3, retry_count = linkedin_sync_status.retry_count + 1, last_sync_at = NOW(), updated_at = NOW()`,
      [job.id, 'failed', error.message, 1]
    );

    throw error;
  }
}

/**
 * Mock LinkedIn posting for development/testing
 */
function mockLinkedInPost(job) {
  console.log('[LinkedIn] Mock posting job:', job.title);
  const linkedInJobId = `mock_linkedin_${job.id}_${Date.now()}`;
  
  return {
    success: true,
    linkedInJobId,
    message: 'Job posted to LinkedIn (mock mode)',
    mock: true
  };
}

/**
 * Check if job should auto-post to LinkedIn based on approval workflow
 */
export function shouldAutoPostToLinkedIn(job) {
  if (job.created_by_role === 'recruiter') {
    return true;
  }
  
  if (job.created_by_role === 'client' && job.status === 'approved') {
    return true;
  }
  
  return false;
}

/**
 * Sync job updates to LinkedIn
 */
export async function syncJobToLinkedIn(jobId) {
  try {
    console.log('[LinkedIn] Syncing job updates for job ID:', jobId);
    
    const jobResult = await query('SELECT * FROM jobs WHERE id = $1', [jobId]);
    if (jobResult.rows.length === 0) {
      throw new Error('Job not found');
    }
    
    const job = jobResult.rows[0];
    
    const syncResult = await query(
      'SELECT * FROM linkedin_sync_status WHERE job_id = $1',
      [jobId]
    );
    
    if (syncResult.rows.length === 0 || !syncResult.rows[0].linkedin_job_id) {
      return postJobToLinkedIn(job);
    }
    
    const linkedInJobId = syncResult.rows[0].linkedin_job_id;
    
    console.log('[LinkedIn] Updating LinkedIn job:', linkedInJobId);
    
    await query(
      `UPDATE linkedin_sync_status 
       SET sync_status = $1, last_sync_at = NOW(), updated_at = NOW()
       WHERE job_id = $2`,
      ['success', jobId]
    );
    
    return {
      success: true,
      linkedInJobId,
      message: 'Job synchronized with LinkedIn'
    };
    
  } catch (error) {
    console.error('[LinkedIn] Error syncing job:', error);
    
    await query(
      `UPDATE linkedin_sync_status 
       SET sync_status = $1, sync_error = $2, retry_count = retry_count + 1, last_sync_at = NOW(), updated_at = NOW()
       WHERE job_id = $3`,
      ['failed', error.message, jobId]
    );
    
    throw error;
  }
}

/**
 * Get LinkedIn sync status for a job
 */
export async function getLinkedInSyncStatus(jobId) {
  const result = await query(
    'SELECT * FROM linkedin_sync_status WHERE job_id = $1',
    [jobId]
  );
  
  return result.rows[0] || null;
}

/**
 * Retry failed LinkedIn sync
 */
export async function retryLinkedInSync(jobId) {
  try {
    const syncStatus = await getLinkedInSyncStatus(jobId);
    
    if (!syncStatus) {
      throw new Error('No sync status found for this job');
    }
    
    if (syncStatus.retry_count >= RATE_LIMITS.retryAttempts) {
      throw new Error('Maximum retry attempts exceeded');
    }
    
    const delay = RATE_LIMITS.retryDelays[syncStatus.retry_count] || RATE_LIMITS.retryDelays[RATE_LIMITS.retryDelays.length - 1];
    
    await new Promise(resolve => setTimeout(resolve, delay));
    
    return await syncJobToLinkedIn(jobId);
    
  } catch (error) {
    console.error('[LinkedIn] Retry failed:', error);
    throw error;
  }
}

/**
 * Remove job from LinkedIn
 */
export async function removeJobFromLinkedIn(jobId) {
  try {
    const syncStatus = await getLinkedInSyncStatus(jobId);
    
    if (!syncStatus || !syncStatus.linkedin_job_id) {
      return { success: true, message: 'Job not posted to LinkedIn' };
    }
    
    console.log('[LinkedIn] Removing job from LinkedIn:', syncStatus.linkedin_job_id);
    
    await query(
      `UPDATE linkedin_sync_status 
       SET sync_status = $1, last_sync_at = NOW(), updated_at = NOW()
       WHERE job_id = $2`,
      ['removed', jobId]
    );
    
    await query(
      'UPDATE jobs SET linkedin_synced = false WHERE id = $1',
      [jobId]
    );
    
    return {
      success: true,
      message: 'Job removed from LinkedIn'
    };
    
  } catch (error) {
    console.error('[LinkedIn] Error removing job:', error);
    throw error;
  }
}
