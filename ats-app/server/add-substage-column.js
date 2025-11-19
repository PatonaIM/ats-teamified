import { query } from './db.js';

async function addSubstageColumn() {
  console.log('Adding candidate_substage column to candidates table...\n');

  try {
    // Add candidate_substage column
    const addColumn = `
      ALTER TABLE candidates 
      ADD COLUMN IF NOT EXISTS candidate_substage VARCHAR(100);
    `;
    await query(addColumn);
    console.log('✓ candidate_substage column added successfully\n');

    // Add index for performance
    const addIndex = `
      CREATE INDEX IF NOT EXISTS idx_candidates_substage ON candidates(candidate_substage);
    `;
    await query(addIndex);
    console.log('✓ Index on candidate_substage created successfully\n');

    console.log('✅ Substage column migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding substage column:', error);
    process.exit(1);
  }
}

addSubstageColumn();
