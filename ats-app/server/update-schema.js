import { query } from './db.js';

async function updateSchema() {
  console.log('Starting database schema update...');

  try {
    // Add employment-type-specific columns to jobs table
    console.log('\n1. Adding employment-type-specific columns to jobs table...');
    
    const alterJobsQuery = `
      -- Contract-specific fields
      ALTER TABLE jobs ADD COLUMN IF NOT EXISTS contract_duration VARCHAR(100);
      ALTER TABLE jobs ADD COLUMN IF NOT EXISTS contract_value DECIMAL(12,2);
      ALTER TABLE jobs ADD COLUMN IF NOT EXISTS service_scope TEXT;
      ALTER TABLE jobs ADD COLUMN IF NOT EXISTS deliverable_milestones TEXT;
      ALTER TABLE jobs ADD COLUMN IF NOT EXISTS payment_schedule VARCHAR(100);
      
      -- Part-time-specific fields
      ALTER TABLE jobs ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(10,2);
      ALTER TABLE jobs ADD COLUMN IF NOT EXISTS hours_per_week INTEGER;
      ALTER TABLE jobs ADD COLUMN IF NOT EXISTS max_budget DECIMAL(12,2);
      ALTER TABLE jobs ADD COLUMN IF NOT EXISTS cost_center VARCHAR(100);
      
      -- Full-time-specific fields
      ALTER TABLE jobs ADD COLUMN IF NOT EXISTS annual_salary DECIMAL(12,2);
      ALTER TABLE jobs ADD COLUMN IF NOT EXISTS benefits_package TEXT;
      ALTER TABLE jobs ADD COLUMN IF NOT EXISTS total_compensation DECIMAL(12,2);
      ALTER TABLE jobs ADD COLUMN IF NOT EXISTS headcount_impact VARCHAR(50);
      
      -- EOR-specific fields
      ALTER TABLE jobs ADD COLUMN IF NOT EXISTS local_salary DECIMAL(12,2);
      ALTER TABLE jobs ADD COLUMN IF NOT EXISTS eor_service_fee DECIMAL(12,2);
      ALTER TABLE jobs ADD COLUMN IF NOT EXISTS compliance_costs DECIMAL(12,2);
      ALTER TABLE jobs ADD COLUMN IF NOT EXISTS salary_currency VARCHAR(10) DEFAULT 'USD';
      ALTER TABLE jobs ADD COLUMN IF NOT EXISTS timezone VARCHAR(100);
      ALTER TABLE jobs ADD COLUMN IF NOT EXISTS remote_capabilities TEXT;
      
      -- Core missing fields
      ALTER TABLE jobs ADD COLUMN IF NOT EXISTS experience_level VARCHAR(50);
      ALTER TABLE jobs ADD COLUMN IF NOT EXISTS department VARCHAR(100);
      ALTER TABLE jobs ADD COLUMN IF NOT EXISTS city VARCHAR(100);
      ALTER TABLE jobs ADD COLUMN IF NOT EXISTS country VARCHAR(100);
      ALTER TABLE jobs ADD COLUMN IF NOT EXISTS job_status VARCHAR(50) DEFAULT 'draft';
    `;
    
    await query(alterJobsQuery);
    console.log('✓ Jobs table columns added successfully');

    // Create pipeline stages table
    console.log('\n2. Creating job_pipeline_stages table...');
    
    const createPipelineTableQuery = `
      DROP TABLE IF EXISTS job_pipeline_stages CASCADE;
      
      CREATE TABLE job_pipeline_stages (
        id SERIAL PRIMARY KEY,
        job_id INTEGER NOT NULL,
        stage_name VARCHAR(100) NOT NULL,
        stage_order INTEGER NOT NULL,
        is_default BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_job_pipeline_stages_job_id 
          FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
        UNIQUE(job_id, stage_order)
      );
      
      CREATE INDEX idx_pipeline_job_id ON job_pipeline_stages(job_id);
    `;
    
    await query(createPipelineTableQuery);
    console.log('✓ Pipeline stages table created successfully');

    // Migrate existing data
    console.log('\n3. Updating existing records with default values...');
    
    const updateExistingQuery = `
      UPDATE jobs 
      SET 
        department = COALESCE(company_name, 'Engineering'),
        city = COALESCE(location, 'Remote'),
        country = 'Global',
        salary_currency = 'USD',
        job_status = COALESCE(status, 'active')
      WHERE department IS NULL;
    `;
    
    await query(updateExistingQuery);
    console.log('✓ Existing records updated');

    // Add default pipeline stages for existing jobs without stages
    console.log('\n4. Adding default pipeline stages to existing jobs...');
    
    const addDefaultStagesQuery = `
      INSERT INTO job_pipeline_stages (job_id, stage_name, stage_order, is_default)
      SELECT 
        j.id,
        stage.name,
        stage.order_num,
        true
      FROM jobs j
      CROSS JOIN (
        VALUES 
          ('Screening', 1),
          ('Shortlist', 2),
          ('Client Endorsement', 3),
          ('Client Interview', 4),
          ('Offer', 5),
          ('Offer Accepted', 6)
      ) AS stage(name, order_num)
      WHERE NOT EXISTS (
        SELECT 1 FROM job_pipeline_stages jps WHERE jps.job_id = j.id
      );
    `;
    
    await query(addDefaultStagesQuery);
    console.log('✓ Default pipeline stages added');

    console.log('\n✅ Database schema update completed successfully!');
    console.log('\nNew columns added to jobs table:');
    console.log('  - Contract: contract_duration, contract_value, service_scope, deliverable_milestones, payment_schedule');
    console.log('  - Part-Time: hourly_rate, hours_per_week, max_budget, cost_center');
    console.log('  - Full-Time: annual_salary, benefits_package, total_compensation, headcount_impact');
    console.log('  - EOR: local_salary, eor_service_fee, compliance_costs, salary_currency, timezone, remote_capabilities');
    console.log('  - Core: experience_level, department, city, country, job_status');
    console.log('\nNew table created:');
    console.log('  - job_pipeline_stages (id, job_id, stage_name, stage_order, is_default)');

  } catch (error) {
    console.error('❌ Error updating schema:', error);
    throw error;
  }
}

// Run if executed directly
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

if (import.meta.url === `file://${process.argv[1]}`) {
  updateSchema()
    .then(() => {
      console.log('\nSchema update complete. You can now use the updated fields.');
      process.exit(0);
    })
    .catch(error => {
      console.error('Schema update failed:', error);
      process.exit(1);
    });
}

export { updateSchema };
