import { query } from './db.js';

async function checkSchema() {
  try {
    const result = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'jobs' 
      ORDER BY column_name
    `);
    
    console.log('Azure Database - jobs table columns:');
    result.rows.forEach(row => console.log('  -', row.column_name));
    
    const salaryCheck = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'jobs' 
      AND column_name LIKE '%salary%'
    `);
    
    console.log('\nSalary-related columns:');
    salaryCheck.rows.forEach(row => console.log('  -', row.column_name));
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkSchema();
