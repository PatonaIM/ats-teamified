import { query } from './db.js';

async function createSubstagesTable() {
  console.log('Creating pipeline_substages table...\n');

  try {
    // Create pipeline_substages table
    console.log('1. Creating pipeline_substages table...');
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS pipeline_substages (
        id SERIAL PRIMARY KEY,
        stage_name VARCHAR(100) NOT NULL,
        substage_id VARCHAR(100) NOT NULL,
        substage_label VARCHAR(255) NOT NULL,
        substage_order INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_stage_substage UNIQUE(stage_name, substage_id),
        CONSTRAINT unique_stage_order UNIQUE(stage_name, substage_order)
      );
      
      CREATE INDEX IF NOT EXISTS idx_substages_stage_name ON pipeline_substages(stage_name);
      CREATE INDEX IF NOT EXISTS idx_substages_order ON pipeline_substages(stage_name, substage_order);
    `;
    await query(createTableQuery);
    console.log('✓ pipeline_substages table created successfully\n');

    // Insert substage data
    console.log('2. Inserting substage definitions...');
    
    const substages = [
      // Screening
      { stage: 'Screening', id: 'application_received', label: 'Application Received', order: 1 },
      { stage: 'Screening', id: 'resume_review', label: 'Resume Review', order: 2 },
      { stage: 'Screening', id: 'initial_assessment', label: 'Initial Assessment', order: 3 },
      { stage: 'Screening', id: 'phone_screen_scheduled', label: 'Phone Screen Scheduled', order: 4 },
      { stage: 'Screening', id: 'phone_screen_completed', label: 'Phone Screen Completed', order: 5 },
      
      // Shortlist
      { stage: 'Shortlist', id: 'under_review', label: 'Under Review', order: 1 },
      { stage: 'Shortlist', id: 'pending_interview', label: 'Pending Interview', order: 2 },
      { stage: 'Shortlist', id: 'interview_scheduled', label: 'Interview Scheduled', order: 3 },
      { stage: 'Shortlist', id: 'interview_completed', label: 'Interview Completed', order: 4 },
      { stage: 'Shortlist', id: 'awaiting_feedback', label: 'Awaiting Feedback', order: 5 },
      
      // Technical Assessment
      { stage: 'Technical Assessment', id: 'assessment_sent', label: 'Assessment Sent', order: 1 },
      { stage: 'Technical Assessment', id: 'assessment_in_progress', label: 'Assessment In Progress', order: 2 },
      { stage: 'Technical Assessment', id: 'assessment_submitted', label: 'Assessment Submitted', order: 3 },
      { stage: 'Technical Assessment', id: 'pending_review', label: 'Pending Assessment Review', order: 4 },
      { stage: 'Technical Assessment', id: 'assessment_completed', label: 'Assessment Completed', order: 5 },
      
      // Human Interview
      { stage: 'Human Interview', id: 'interviewer_assigned', label: 'Interviewer Assigned', order: 1 },
      { stage: 'Human Interview', id: 'interview_scheduled', label: 'Interview Scheduled', order: 2 },
      { stage: 'Human Interview', id: 'interview_in_progress', label: 'Interview In Progress', order: 3 },
      { stage: 'Human Interview', id: 'interview_completed', label: 'Interview Completed', order: 4 },
      { stage: 'Human Interview', id: 'feedback_submitted', label: 'Feedback Submitted', order: 5 },
      
      // Final Interview
      { stage: 'Final Interview', id: 'interview_prep', label: 'Interview Preparation', order: 1 },
      { stage: 'Final Interview', id: 'interview_scheduled', label: 'Interview Scheduled', order: 2 },
      { stage: 'Final Interview', id: 'interview_in_progress', label: 'Interview In Progress', order: 3 },
      { stage: 'Final Interview', id: 'interview_completed', label: 'Interview Completed', order: 4 },
      { stage: 'Final Interview', id: 'decision_pending', label: 'Decision Pending', order: 5 },
      
      // AI Interview
      { stage: 'AI Interview', id: 'ai_interview_sent', label: 'AI Interview Sent', order: 1 },
      { stage: 'AI Interview', id: 'ai_interview_started', label: 'AI Interview Started', order: 2 },
      { stage: 'AI Interview', id: 'ai_interview_completed', label: 'AI Interview Completed', order: 3 },
      { stage: 'AI Interview', id: 'ai_analysis_in_progress', label: 'AI Analysis In Progress', order: 4 },
      { stage: 'AI Interview', id: 'ai_results_ready', label: 'AI Results Ready', order: 5 },
      
      // Offer
      { stage: 'Offer', id: 'offer_preparation', label: 'Offer Preparation', order: 1 },
      { stage: 'Offer', id: 'offer_approval', label: 'Offer Approval', order: 2 },
      { stage: 'Offer', id: 'offer_sent', label: 'Offer Sent', order: 3 },
      { stage: 'Offer', id: 'candidate_reviewing', label: 'Candidate Reviewing Offer', order: 4 },
      { stage: 'Offer', id: 'negotiation', label: 'Negotiation', order: 5 }
    ];

    for (const substage of substages) {
      await query(
        `INSERT INTO pipeline_substages (stage_name, substage_id, substage_label, substage_order) 
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (stage_name, substage_id) DO NOTHING`,
        [substage.stage, substage.id, substage.label, substage.order]
      );
    }
    
    console.log(`✓ Inserted ${substages.length} substage definitions\n`);

    // Verify data
    const result = await query('SELECT COUNT(*) as count FROM pipeline_substages');
    console.log(`✓ Total substages in database: ${result.rows[0].count}\n`);

    console.log('✅ All substages table setup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating substages table:', error);
    process.exit(1);
  }
}

createSubstagesTable();
