import { query } from './db.js';

async function createCandidatesTables() {
  console.log('Creating candidates management tables...\n');

  try {
    // Create candidates table
    console.log('1. Creating candidates table...');
    const createCandidatesTable = `
      CREATE TABLE IF NOT EXISTS candidates (
        id SERIAL PRIMARY KEY,
        job_id UUID NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        current_stage VARCHAR(100) DEFAULT 'Screening',
        source VARCHAR(50) DEFAULT 'direct',
        resume_url TEXT,
        external_portal_id VARCHAR(255),
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_candidates_job FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
        CONSTRAINT unique_candidate_email_per_job UNIQUE(job_id, email),
        CONSTRAINT chk_source CHECK (source IN ('linkedin', 'direct', 'referral', 'portal')),
        CONSTRAINT chk_status CHECK (status IN ('active', 'rejected', 'hired', 'withdrawn'))
      );
      
      CREATE INDEX IF NOT EXISTS idx_candidates_job_id ON candidates(job_id);
      CREATE INDEX IF NOT EXISTS idx_candidates_status ON candidates(status);
      CREATE INDEX IF NOT EXISTS idx_candidates_current_stage ON candidates(current_stage);
      CREATE INDEX IF NOT EXISTS idx_candidates_email ON candidates(email);
    `;
    await query(createCandidatesTable);
    console.log('✓ Candidates table created successfully\n');

    // Create candidate_documents table
    console.log('2. Creating candidate_documents table...');
    const createDocumentsTable = `
      CREATE TABLE IF NOT EXISTS candidate_documents (
        id SERIAL PRIMARY KEY,
        candidate_id INTEGER NOT NULL,
        document_type VARCHAR(50) NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        blob_url TEXT NOT NULL,
        file_size INTEGER,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_documents_candidate FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
        CONSTRAINT chk_document_type CHECK (document_type IN ('resume', 'certificate', 'cover_letter', 'portfolio'))
      );
      
      CREATE INDEX IF NOT EXISTS idx_documents_candidate_id ON candidate_documents(candidate_id);
    `;
    await query(createDocumentsTable);
    console.log('✓ Candidate documents table created successfully\n');

    // Create candidate_communications table
    console.log('3. Creating candidate_communications table...');
    const createCommunicationsTable = `
      CREATE TABLE IF NOT EXISTS candidate_communications (
        id SERIAL PRIMARY KEY,
        candidate_id INTEGER NOT NULL,
        communication_type VARCHAR(50) NOT NULL,
        subject VARCHAR(255),
        content TEXT,
        sent_by_user_id VARCHAR(255),
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_communications_candidate FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
        CONSTRAINT chk_communication_type CHECK (communication_type IN ('email', 'call', 'message'))
      );
      
      CREATE INDEX IF NOT EXISTS idx_communications_candidate_id ON candidate_communications(candidate_id);
      CREATE INDEX IF NOT EXISTS idx_communications_sent_at ON candidate_communications(sent_at DESC);
    `;
    await query(createCommunicationsTable);
    console.log('✓ Candidate communications table created successfully\n');

    // Create candidate_stage_history table
    console.log('4. Creating candidate_stage_history table...');
    const createStageHistoryTable = `
      CREATE TABLE IF NOT EXISTS candidate_stage_history (
        id SERIAL PRIMARY KEY,
        candidate_id INTEGER NOT NULL,
        previous_stage VARCHAR(100),
        new_stage VARCHAR(100) NOT NULL,
        changed_by_user_id VARCHAR(255),
        notes TEXT,
        changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_stage_history_candidate FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
      );
      
      CREATE INDEX IF NOT EXISTS idx_stage_history_candidate_id ON candidate_stage_history(candidate_id);
      CREATE INDEX IF NOT EXISTS idx_stage_history_changed_at ON candidate_stage_history(changed_at DESC);
    `;
    await query(createStageHistoryTable);
    console.log('✓ Candidate stage history table created successfully\n');

    console.log('✅ All candidates tables created successfully!');
    console.log('\nTables created:');
    console.log('  1. candidates - Main candidate profiles');
    console.log('  2. candidate_documents - Document attachments');
    console.log('  3. candidate_communications - Communication logs');
    console.log('  4. candidate_stage_history - Stage change audit trail\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating candidates tables:', error);
    process.exit(1);
  }
}

createCandidatesTables();
