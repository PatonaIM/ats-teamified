import { query } from './db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function addAIInterviewFields() {
  console.log('Adding AI Interview tracking fields to candidates table...\n');

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '../database/migrations/011_ai_interview_tracking.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('Executing migration 011_ai_interview_tracking.sql...');
    await query(migrationSQL);
    
    console.log('✓ AI Interview fields added successfully\n');
    console.log('✓ Indexes created successfully\n');
    console.log('✓ Client endorsement fields added successfully\n');

    // Verify columns were added
    const verifyQuery = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'candidates' 
      AND column_name IN ('ai_interview_score', 'ai_analysis_status', 'candidate_substage', 'client_viewed_at')
      ORDER BY column_name;
    `;
    const result = await query(verifyQuery);
    
    console.log('\nVerified columns:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name} (${row.data_type})`);
    });

    console.log('\n✅ AI Interview tracking migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding AI interview fields:', error);
    console.error('\nFull error details:', error.message);
    process.exit(1);
  }
}

addAIInterviewFields();
