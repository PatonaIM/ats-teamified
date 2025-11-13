import { query } from './db.js';

async function createApprovalTables() {
  try {
    console.log('Creating approval workflow tables...');
    
    // Create job_approvals table
    const createApprovalsTable = `
      CREATE TABLE IF NOT EXISTS job_approvals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        approver_id UUID,
        decision_timestamp TIMESTAMP,
        feedback_comments TEXT,
        modifications_made JSONB,
        escalation_reason TEXT,
        sla_deadline TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_job FOREIGN KEY (job_id) REFERENCES jobs(id),
        CONSTRAINT chk_status CHECK (status IN ('pending', 'approved', 'rejected', 'escalated', 'conditional'))
      );
    `;
    
    await query(createApprovalsTable);
    console.log('✅ job_approvals table created');
    
    // Create approval_history table
    const createHistoryTable = `
      CREATE TABLE IF NOT EXISTS approval_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        job_id UUID NOT NULL,
        approval_id UUID,
        action VARCHAR(100) NOT NULL,
        user_id UUID,
        user_role VARCHAR(50),
        details JSONB,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_job_history FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
        CONSTRAINT fk_approval FOREIGN KEY (approval_id) REFERENCES job_approvals(id) ON DELETE SET NULL
      );
    `;
    
    await query(createHistoryTable);
    console.log('✅ approval_history table created');
    
    // Create indexes for performance
    await query('CREATE INDEX IF NOT EXISTS idx_approvals_status ON job_approvals(status)');
    await query('CREATE INDEX IF NOT EXISTS idx_approvals_job_id ON job_approvals(job_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_approvals_sla ON job_approvals(sla_deadline) WHERE status = \'pending\'');
    await query('CREATE INDEX IF NOT EXISTS idx_history_job_id ON approval_history(job_id)');
    await query('CREATE INDEX IF NOT EXISTS idx_history_timestamp ON approval_history(timestamp DESC)');
    console.log('✅ Indexes created');
    
    // Auto-create approval records for existing draft jobs
    const autoCreateApprovals = `
      INSERT INTO job_approvals (job_id, status, sla_deadline, created_at)
      SELECT 
        id,
        'pending',
        created_at + INTERVAL '24 hours',
        created_at
      FROM jobs
      WHERE status = 'draft'
        AND created_by_role = 'client'
        AND id NOT IN (SELECT job_id FROM job_approvals)
      ON CONFLICT DO NOTHING;
    `;
    
    const result = await query(autoCreateApprovals);
    console.log(`✅ Auto-created ${result.rowCount || 0} approval records for existing draft jobs`);
    
    console.log('\n✅ Approval workflow tables setup complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating approval tables:', error);
    process.exit(1);
  }
}

createApprovalTables();
