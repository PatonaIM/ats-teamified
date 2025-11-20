# Dynamic Stage Advancement Implementation
**Handling Custom Pipeline Stages Per Job**

---

## Problem

Each job in the ATS has a customizable pipeline with different stages:
- Job A: Screening → Shortlist → Client Endorsement → Technical Test → Interview → Offer → Offer Accepted
- Job B: Screening → Shortlist → Client Endorsement → Coding Round → Panel Interview → Final Interview → Offer → Offer Accepted

We need to dynamically determine the "next stage" for any candidate, regardless of the job's custom pipeline configuration.

---

## Solution: Dynamic Stage Lookup

### 1. Direct Database Implementation (Recommended)

```javascript
/**
 * Advance candidate to next stage dynamically based on job's pipeline configuration
 * @param {number} candidateId - Candidate ID
 * @param {string} userId - User performing the action
 * @param {string} notes - Optional notes about the advancement
 * @returns {Promise<Object>} Result with previous and new stage
 */
async function advanceCandidateDynamically(candidateId, userId, notes = null) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Step 1: Get candidate's current stage and job_id
    const candidateResult = await client.query(`
      SELECT 
        c.current_stage,
        c.job_id,
        c.first_name,
        c.last_name
      FROM candidates c
      WHERE c.id = $1
    `, [candidateId]);
    
    if (candidateResult.rows.length === 0) {
      throw new Error('Candidate not found');
    }
    
    const { current_stage, job_id, first_name, last_name } = candidateResult.rows[0];
    
    // Step 2: Get the job's complete pipeline configuration
    const pipelineResult = await client.query(`
      SELECT 
        stage_name,
        stage_order
      FROM job_pipeline_stages
      WHERE job_id = $1
      ORDER BY stage_order ASC
    `, [job_id]);
    
    if (pipelineResult.rows.length === 0) {
      throw new Error('Job pipeline not configured');
    }
    
    // Step 3: Find current stage in pipeline
    const currentStageIndex = pipelineResult.rows.findIndex(
      stage => stage.stage_name === current_stage
    );
    
    if (currentStageIndex === -1) {
      throw new Error(`Current stage "${current_stage}" not found in job pipeline`);
    }
    
    // Step 4: Check if already at final stage
    if (currentStageIndex === pipelineResult.rows.length - 1) {
      throw new Error('Candidate is already at the final stage (Offer Accepted)');
    }
    
    // Step 5: Get next stage
    const nextStage = pipelineResult.rows[currentStageIndex + 1].stage_name;
    
    // Step 6: Update candidate's stage
    await client.query(`
      UPDATE candidates 
      SET current_stage = $1, updated_at = NOW() 
      WHERE id = $2
    `, [nextStage, candidateId]);
    
    // Step 7: Log to audit trail
    await client.query(`
      INSERT INTO candidate_stage_history (
        candidate_id,
        previous_stage,
        new_stage,
        changed_by_user_id,
        notes,
        changed_at
      ) VALUES ($1, $2, $3, $4, $5, NOW())
    `, [
      candidateId,
      current_stage,
      nextStage,
      userId,
      notes || `Advanced from ${current_stage} to ${nextStage}`
    ]);
    
    await client.query('COMMIT');
    
    return {
      success: true,
      candidateId,
      candidateName: `${first_name} ${last_name}`,
      previousStage: current_stage,
      currentStage: nextStage,
      message: `Candidate advanced from ${current_stage} to ${nextStage}`
    };
    
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
```

### 2. Get Complete Pipeline for a Job

```javascript
/**
 * Get the complete pipeline configuration for a job
 * Useful for displaying progress bars, stage dropdowns, etc.
 * @param {string} jobId - Job UUID
 * @returns {Promise<Array>} Array of stages in order
 */
async function getJobPipeline(jobId) {
  const result = await pool.query(`
    SELECT 
      id,
      stage_name,
      stage_order,
      is_custom
    FROM job_pipeline_stages
    WHERE job_id = $1
    ORDER BY stage_order ASC
  `, [jobId]);
  
  return result.rows;
}

// Example usage:
const pipeline = await getJobPipeline('job-uuid-123');
console.log(pipeline);
// [
//   { id: 1, stage_name: 'Screening', stage_order: 1, is_custom: false },
//   { id: 2, stage_name: 'Shortlist', stage_order: 2, is_custom: false },
//   { id: 3, stage_name: 'Client Endorsement', stage_order: 3, is_custom: false },
//   { id: 4, stage_name: 'Technical Test', stage_order: 4, is_custom: true },
//   { id: 5, stage_name: 'Interview', stage_order: 5, is_custom: true },
//   { id: 6, stage_name: 'Offer', stage_order: 6, is_custom: false },
//   { id: 7, stage_name: 'Offer Accepted', stage_order: 7, is_custom: false }
// ]
```

### 3. Get Next Stage Without Updating

```javascript
/**
 * Preview what the next stage would be without updating the candidate
 * Useful for UI previews, validation, etc.
 * @param {number} candidateId - Candidate ID
 * @returns {Promise<Object>} Current and next stage info
 */
async function getNextStagePreview(candidateId) {
  const result = await pool.query(`
    WITH candidate_info AS (
      SELECT 
        c.id,
        c.current_stage,
        c.job_id
      FROM candidates c
      WHERE c.id = $1
    ),
    pipeline_stages AS (
      SELECT 
        jps.stage_name,
        jps.stage_order
      FROM job_pipeline_stages jps
      INNER JOIN candidate_info ci ON jps.job_id = ci.job_id
      ORDER BY jps.stage_order ASC
    ),
    current_stage_info AS (
      SELECT 
        ps.stage_name AS current_stage,
        ps.stage_order AS current_order,
        ci.job_id
      FROM pipeline_stages ps
      INNER JOIN candidate_info ci ON ps.stage_name = ci.current_stage
    )
    SELECT 
      csi.current_stage,
      csi.current_order,
      ps.stage_name AS next_stage,
      ps.stage_order AS next_order,
      (ps.stage_order IS NULL) AS is_final_stage
    FROM current_stage_info csi
    LEFT JOIN pipeline_stages ps ON ps.stage_order = csi.current_order + 1
  `, [candidateId]);
  
  if (result.rows.length === 0) {
    throw new Error('Candidate not found');
  }
  
  const stage = result.rows[0];
  
  return {
    currentStage: stage.current_stage,
    nextStage: stage.next_stage,
    canAdvance: !stage.is_final_stage,
    message: stage.is_final_stage 
      ? 'Candidate is at the final stage'
      : `Can advance to ${stage.next_stage}`
  };
}
```

---

## External Portal Implementation

### Portal-Specific Stage Advancement (Restricted)

For external portals that can only advance through Screening → Shortlist → Client Endorsement:

```javascript
/**
 * External portal stage advancement with stage ownership validation
 * Portal can only advance: Screening → Shortlist → Client Endorsement
 * @param {number} candidateId - Candidate ID
 * @param {string} portalUserId - Portal user performing the action
 * @param {string} notes - Optional notes
 * @returns {Promise<Object>} Result with previous and new stage
 */
async function advanceCandidatePortal(candidateId, portalUserId, notes = null) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Get candidate info with pipeline
    const result = await pool.query(`
      SELECT 
        c.current_stage,
        c.job_id,
        jps.stage_name,
        jps.stage_order
      FROM candidates c
      INNER JOIN job_pipeline_stages jps ON jps.job_id = c.job_id
      ORDER BY jps.stage_order ASC
    `, [candidateId]);
    
    if (result.rows.length === 0) {
      throw new Error('Candidate not found');
    }
    
    const currentStage = result.rows[0].current_stage;
    const pipeline = result.rows.map(r => r.stage_name);
    
    // Portal stage boundaries (fixed positions in pipeline)
    const PORTAL_STAGES = ['Screening', 'Shortlist', 'Client Endorsement'];
    
    // Validate current stage is within portal ownership
    if (!PORTAL_STAGES.includes(currentStage)) {
      throw new Error(
        `Portal cannot advance candidates from "${currentStage}". ` +
        `Portal can only manage: ${PORTAL_STAGES.join(', ')}`
      );
    }
    
    // Find next stage
    const currentIndex = pipeline.findIndex(s => s === currentStage);
    const nextStage = pipeline[currentIndex + 1];
    
    // Validate next stage doesn't exceed portal boundaries
    if (currentStage === 'Client Endorsement') {
      throw new Error(
        'Candidate is at Client Endorsement (handoff point). ' +
        'Internal ATS will take over from here.'
      );
    }
    
    // Update stage
    await client.query(`
      UPDATE candidates 
      SET current_stage = $1, updated_at = NOW() 
      WHERE id = $2
    `, [nextStage, candidateId]);
    
    // Log to audit trail
    await client.query(`
      INSERT INTO candidate_stage_history (
        candidate_id, previous_stage, new_stage, 
        changed_by_user_id, notes
      ) VALUES ($1, $2, $3, $4, $5)
    `, [candidateId, currentStage, nextStage, portalUserId, notes]);
    
    await client.query('COMMIT');
    
    return {
      success: true,
      previousStage: currentStage,
      currentStage: nextStage,
      isHandoffPoint: nextStage === 'Client Endorsement',
      message: nextStage === 'Client Endorsement'
        ? 'Candidate endorsed for client review (handoff to Internal ATS)'
        : `Candidate advanced from ${currentStage} to ${nextStage}`
    };
    
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
```

---

## REST API Endpoint Implementation

### Updated `/api/portal/candidates/:id/advance` Endpoint

```javascript
// In server/index.js

app.put('/api/portal/candidates/:id/advance', portalApiAuth, async (req, res) => {
  const candidateId = parseInt(req.params.id);
  const { notes, portalUserId } = req.body;
  
  try {
    const result = await advanceCandidatePortal(
      candidateId,
      portalUserId || 'portal-user',
      notes
    );
    
    res.json(result);
    
  } catch (error) {
    console.error('Error advancing candidate:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: 'Candidate not found' });
    }
    
    if (error.message.includes('Portal cannot advance')) {
      return res.status(400).json({
        error: 'Invalid stage transition',
        message: error.message
      });
    }
    
    res.status(500).json({
      error: 'Failed to advance candidate',
      details: error.message
    });
  }
});
```

---

## UI Integration Examples

### 1. Kanban Board - Move to Next Stage Button

```javascript
// React component for candidate card
function CandidateCard({ candidate, jobId, onStageChange }) {
  const [nextStage, setNextStage] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Load next stage on mount
  useEffect(() => {
    async function loadNextStage() {
      const preview = await getNextStagePreview(candidate.id);
      setNextStage(preview);
    }
    loadNextStage();
  }, [candidate.id]);
  
  const handleAdvance = async () => {
    setLoading(true);
    try {
      await advanceCandidateDynamically(
        candidate.id,
        currentUser.id,
        'Moved via Kanban board'
      );
      onStageChange(); // Refresh board
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="candidate-card">
      <h3>{candidate.firstName} {candidate.lastName}</h3>
      <p>Current: {candidate.currentStage}</p>
      
      {nextStage?.canAdvance && (
        <button 
          onClick={handleAdvance}
          disabled={loading}
        >
          Move to {nextStage.nextStage} →
        </button>
      )}
      
      {!nextStage?.canAdvance && (
        <span className="final-stage">Final Stage</span>
      )}
    </div>
  );
}
```

### 2. External Portal - Stage Progression

```javascript
// External portal dashboard
async function portalAdvanceCandidate(candidateId) {
  try {
    const response = await fetch(
      `https://ats.example.com/api/portal/candidates/${candidateId}/advance`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.PORTAL_API_KEY
        },
        body: JSON.stringify({
          notes: 'Candidate qualified for next stage',
          portalUserId: 'portal-recruiter-123'
        })
      }
    );
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to advance candidate');
    }
    
    // Handle handoff notification
    if (result.isHandoffPoint) {
      alert(
        'Candidate has been endorsed for client review! ' +
        'Internal ATS team will take over from here.'
      );
    } else {
      alert(`Candidate moved to ${result.currentStage}`);
    }
    
    return result;
    
  } catch (error) {
    console.error('Error advancing candidate:', error);
    alert(error.message);
  }
}
```

### 3. Progress Indicator with Dynamic Pipeline

```javascript
// Display candidate progress through custom pipeline
async function CandidatePipelineProgress({ candidateId, jobId }) {
  const [pipeline, setPipeline] = useState([]);
  const [currentStage, setCurrentStage] = useState('');
  
  useEffect(() => {
    async function loadData() {
      // Get job's pipeline configuration
      const stages = await getJobPipeline(jobId);
      setPipeline(stages);
      
      // Get candidate's current stage
      const candidate = await fetch(`/api/candidates/${candidateId}`).then(r => r.json());
      setCurrentStage(candidate.currentStage);
    }
    loadData();
  }, [candidateId, jobId]);
  
  return (
    <div className="pipeline-progress">
      {pipeline.map((stage, index) => {
        const isActive = stage.stage_name === currentStage;
        const isPast = pipeline.findIndex(s => s.stage_name === currentStage) > index;
        
        return (
          <div 
            key={stage.id}
            className={`stage ${isActive ? 'active' : ''} ${isPast ? 'completed' : ''}`}
          >
            <div className="stage-number">{index + 1}</div>
            <div className="stage-name">{stage.stage_name}</div>
            {stage.is_custom && <span className="custom-badge">Custom</span>}
          </div>
        );
      })}
    </div>
  );
}
```

---

## Edge Cases & Validation

### 1. Handle Missing Pipeline Configuration

```javascript
// Validate job has pipeline configured before advancing
const pipelineCheck = await pool.query(
  'SELECT COUNT(*) FROM job_pipeline_stages WHERE job_id = $1',
  [jobId]
);

if (parseInt(pipelineCheck.rows[0].count) === 0) {
  throw new Error(
    'Job pipeline not configured. Please set up pipeline stages before managing candidates.'
  );
}
```

### 2. Handle Stage Name Changes

```javascript
// If job's pipeline stages are renamed, update candidates in bulk
async function migrateCandidateStages(jobId, oldStageName, newStageName) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Update candidates
    await client.query(`
      UPDATE candidates 
      SET current_stage = $1 
      WHERE job_id = $2 AND current_stage = $3
    `, [newStageName, jobId, oldStageName]);
    
    // Update stage history records
    await client.query(`
      UPDATE candidate_stage_history 
      SET previous_stage = $1 
      WHERE candidate_id IN (
        SELECT id FROM candidates WHERE job_id = $2
      ) AND previous_stage = $3
    `, [newStageName, jobId, oldStageName]);
    
    await client.query(`
      UPDATE candidate_stage_history 
      SET new_stage = $1 
      WHERE candidate_id IN (
        SELECT id FROM candidates WHERE job_id = $2
      ) AND new_stage = $3
    `, [newStageName, jobId, oldStageName]);
    
    await client.query('COMMIT');
    
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
```

### 3. Bulk Stage Advancement

```javascript
// Advance multiple candidates at once (e.g., after interview round)
async function bulkAdvanceCandidates(candidateIds, userId, notes) {
  const results = [];
  
  for (const candidateId of candidateIds) {
    try {
      const result = await advanceCandidateDynamically(candidateId, userId, notes);
      results.push({ candidateId, success: true, ...result });
    } catch (error) {
      results.push({ candidateId, success: false, error: error.message });
    }
  }
  
  return {
    total: candidateIds.length,
    successful: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    results
  };
}
```

---

## Performance Optimization

### Cache Pipeline Configuration

```javascript
// Cache job pipelines to avoid repeated queries
const pipelineCache = new Map();

async function getCachedJobPipeline(jobId) {
  if (pipelineCache.has(jobId)) {
    return pipelineCache.get(jobId);
  }
  
  const pipeline = await getJobPipeline(jobId);
  pipelineCache.set(jobId, pipeline);
  
  // Clear cache after 5 minutes
  setTimeout(() => pipelineCache.delete(jobId), 5 * 60 * 1000);
  
  return pipeline;
}
```

---

## Summary

**Key Implementation Points:**

1. **Always query `job_pipeline_stages`** - Never hardcode stage sequences
2. **Use `stage_order` column** - This determines the correct sequence
3. **Validate stage ownership** - External portal vs Internal ATS boundaries
4. **Log all transitions** - Maintain complete audit trail in `candidate_stage_history`
5. **Handle edge cases** - Final stage, missing pipeline, invalid transitions
6. **Cache when appropriate** - Pipeline configs don't change frequently

**Stage Advancement Flow:**
```
1. Get candidate's current_stage and job_id
2. Query job_pipeline_stages for that job (ORDER BY stage_order)
3. Find current stage in pipeline array
4. Get next stage (current index + 1)
5. Validate transition is allowed
6. Update candidate.current_stage
7. Log to candidate_stage_history
8. Commit transaction
```

This approach works for any custom pipeline configuration and ensures data integrity across stage transitions.
