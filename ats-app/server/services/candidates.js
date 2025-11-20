/**
 * Candidate Profile Management Service
 * Handles candidate CRUD operations, document management, and communication logging
 */

import { query } from '../db.js';

/**
 * Get all candidates with optional filtering
 */
export async function getCandidates(filters = {}) {
  let queryText = `
    SELECT 
      c.*,
      j.title as job_title,
      j.employment_type,
      COUNT(DISTINCT cd.id) as document_count,
      COUNT(DISTINCT cc.id) as communication_count
    FROM candidates c
    LEFT JOIN jobs j ON c.job_id = j.id
    LEFT JOIN candidate_documents cd ON c.id = cd.candidate_id
    LEFT JOIN candidate_communications cc ON c.id = cc.candidate_id
    WHERE 1=1
  `;
  
  const params = [];
  let paramIndex = 1;

  if (filters.jobId) {
    queryText += ` AND c.job_id = $${paramIndex}`;
    params.push(filters.jobId);
    paramIndex++;
  }

  if (filters.status) {
    queryText += ` AND c.status = $${paramIndex}`;
    params.push(filters.status);
    paramIndex++;
  }

  if (filters.source) {
    queryText += ` AND c.source = $${paramIndex}`;
    params.push(filters.source);
    paramIndex++;
  }

  if (filters.search) {
    queryText += ` AND (c.first_name ILIKE $${paramIndex} OR c.last_name ILIKE $${paramIndex} OR c.email ILIKE $${paramIndex})`;
    params.push(`%${filters.search}%`);
    paramIndex++;
  }

  queryText += ' GROUP BY c.id, j.title, j.employment_type ORDER BY c.created_at DESC';

  const result = await query(queryText, params);
  return result.rows;
}

/**
 * Get candidate by ID with full details
 */
export async function getCandidateById(candidateId) {
  const candidateResult = await query(
    `SELECT 
      c.*,
      j.title as job_title,
      j.employment_type,
      j.department as company_name,
      j.city,
      j.country
    FROM candidates c
    LEFT JOIN jobs j ON c.job_id = j.id
    WHERE c.id = $1`,
    [candidateId]
  );

  if (candidateResult.rows.length === 0) {
    return null;
  }

  const candidate = candidateResult.rows[0];

  const documentsResult = await query(
    'SELECT * FROM candidate_documents WHERE candidate_id = $1 ORDER BY uploaded_at DESC',
    [candidateId]
  );

  const communicationsResult = await query(
    'SELECT * FROM candidate_communications WHERE candidate_id = $1 ORDER BY sent_at DESC',
    [candidateId]
  );

  const stageHistoryResult = await query(
    'SELECT * FROM candidate_stage_history WHERE candidate_id = $1 ORDER BY changed_at DESC',
    [candidateId]
  );

  return {
    ...candidate,
    documents: documentsResult.rows,
    communications: communicationsResult.rows,
    stageHistory: stageHistoryResult.rows
  };
}

/**
 * Create new candidate
 */
export async function createCandidate(candidateData) {
  const {
    jobId,
    firstName,
    lastName,
    email,
    phone,
    currentStage,
    source = 'direct',
    resumeUrl,
    externalPortalId
  } = candidateData;

  const result = await query(
    `INSERT INTO candidates (
      job_id, first_name, last_name, email, phone, 
      current_stage, source, resume_url, external_portal_id, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *`,
    [
      jobId,
      firstName,
      lastName,
      email,
      phone,
      currentStage || 'Screening',
      source,
      resumeUrl,
      externalPortalId,
      'active'
    ]
  );

  return result.rows[0];
}

/**
 * Update candidate
 */
export async function updateCandidate(candidateId, updates) {
  const camelToSnakeMap = {
    firstName: 'first_name',
    lastName: 'last_name',
    email: 'email',
    phone: 'phone',
    currentStage: 'current_stage',
    source: 'source',
    resumeUrl: 'resume_url',
    status: 'status'
  };

  const fields = [];
  const values = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(updates)) {
    const dbField = camelToSnakeMap[key] || key;
    const allowedFields = Object.values(camelToSnakeMap);
    
    if (allowedFields.includes(dbField)) {
      fields.push(`${dbField} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  }

  if (fields.length === 0) {
    throw new Error('No valid fields to update');
  }

  fields.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(candidateId);

  const queryText = `
    UPDATE candidates 
    SET ${fields.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *
  `;

  const result = await query(queryText, values);
  return result.rows[0];
}

/**
 * Add document to candidate
 */
export async function addCandidateDocument(candidateId, documentData) {
  const { documentType, fileName, blobUrl, fileSize } = documentData;

  const result = await query(
    `INSERT INTO candidate_documents (
      candidate_id, document_type, file_name, blob_url, file_size
    ) VALUES ($1, $2, $3, $4, $5)
    RETURNING *`,
    [candidateId, documentType, fileName, blobUrl, fileSize]
  );

  return result.rows[0];
}

/**
 * Add communication log to candidate
 */
export async function addCandidateCommunication(candidateId, communicationData) {
  const { communicationType, subject, content, sentByUserId } = communicationData;

  const result = await query(
    `INSERT INTO candidate_communications (
      candidate_id, communication_type, subject, content, sent_by_user_id
    ) VALUES ($1, $2, $3, $4, $5)
    RETURNING *`,
    [candidateId, communicationType, subject, content, sentByUserId]
  );

  return result.rows[0];
}

/**
 * Move candidate to different pipeline stage
 */
export async function moveCandidateToStage(candidateId, newStage, userId = null, notes = null) {
  const currentCandidateResult = await query(
    'SELECT current_stage FROM candidates WHERE id = $1',
    [candidateId]
  );

  if (currentCandidateResult.rows.length === 0) {
    throw new Error('Candidate not found');
  }

  const previousStage = currentCandidateResult.rows[0].current_stage;

  // Get the first substage for the new stage (default substage)
  const substageResult = await query(
    `SELECT substage_id 
     FROM pipeline_substages 
     WHERE stage_name = $1 
     ORDER BY substage_order ASC 
     LIMIT 1`,
    [newStage]
  );
  
  const defaultSubstage = substageResult.rows.length > 0 
    ? substageResult.rows[0].substage_id 
    : null;

  // Update stage and set default substage
  const result = await query(
    `UPDATE candidates 
     SET current_stage = $1, 
         candidate_substage = $2,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $3
     RETURNING *`,
    [newStage, defaultSubstage, candidateId]
  );

  await query(
    `INSERT INTO candidate_stage_history (candidate_id, previous_stage, new_stage, changed_by_user_id, notes)
     VALUES ($1, $2, $3, $4, $5)`,
    [candidateId, previousStage, newStage, userId, notes]
  );

  return result.rows[0];
}

/**
 * Disqualify candidate
 */
export async function disqualifyCandidate(candidateId, reason = null, userId = null) {
  const currentCandidateResult = await query(
    'SELECT status, current_stage FROM candidates WHERE id = $1',
    [candidateId]
  );

  if (currentCandidateResult.rows.length === 0) {
    throw new Error('Candidate not found');
  }

  const previousStatus = currentCandidateResult.rows[0].status;
  const currentStage = currentCandidateResult.rows[0].current_stage;

  const result = await query(
    `UPDATE candidates 
     SET status = 'disqualified', updated_at = CURRENT_TIMESTAMP
     WHERE id = $1
     RETURNING *`,
    [candidateId]
  );

  await query(
    `INSERT INTO candidate_stage_history (candidate_id, previous_stage, new_stage, changed_by_user_id, notes)
     VALUES ($1, $2, $3, $4, $5)`,
    [candidateId, currentStage, 'Disqualified', userId, reason || 'Candidate disqualified']
  );

  return result.rows[0];
}

/**
 * Delete candidate
 */
export async function deleteCandidate(candidateId) {
  await query('DELETE FROM candidates WHERE id = $1', [candidateId]);
  return { success: true, message: 'Candidate deleted successfully' };
}
