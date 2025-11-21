import { query } from './db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function addHumanInterviewFields() {
  console.log('Adding Human Interview tracking fields to candidates table...\n');

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '../database/migrations/012_human_interview_tracking.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('Executing migration 012_human_interview_tracking.sql...');
    await query(migrationSQL);
    
    console.log('✓ Human Interview fields added successfully\n');
    console.log('✓ Indexes created successfully\n');
    console.log('✓ Foreign key constraint added successfully\n');

    // Verify columns were added
    const verifyQuery = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'candidates' 
      AND column_name IN ('interviewer_name', 'interviewer_email', 'selected_slot_id', 'meeting_platform', 'meeting_link', 'interview_scheduled_at')
      ORDER BY column_name;
    `;
    const result = await query(verifyQuery);
    
    console.log('\nVerified columns:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name} (${row.data_type})`);
    });

  } catch (error) {
    console.error('Error adding Human Interview fields:', error);
    throw error;
  }
}

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  addHumanInterviewFields()
    .then(() => {
      console.log('\n✅ Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Migration failed:', error);
      process.exit(1);
    });
}

export { addHumanInterviewFields };
