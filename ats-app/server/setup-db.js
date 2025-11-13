import { query } from './db.js';

async function setupDatabase() {
  try {
    console.log('🔧 Setting up database schema...');

    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS jobs (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        employment_type VARCHAR(50) NOT NULL,
        status VARCHAR(50) DEFAULT 'active',
        company_name VARCHAR(255),
        location VARCHAR(255),
        remote_ok BOOLEAN DEFAULT false,
        salary_min INTEGER,
        salary_max INTEGER,
        description TEXT,
        requirements TEXT[],
        benefits TEXT[],
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        candidate_count INTEGER DEFAULT 0,
        active_candidates INTEGER DEFAULT 0,
        recruiter_name VARCHAR(255),
        linkedin_synced BOOLEAN DEFAULT false
      );
    `;

    await query(createTableQuery);
    console.log('✅ Jobs table created or already exists');

    const countResult = await query('SELECT COUNT(*) FROM jobs');
    const jobCount = parseInt(countResult.rows[0].count);

    if (jobCount === 0) {
      console.log('📝 Inserting sample job data...');

      const sampleJobs = [
        {
          title: 'Senior Full-Stack Developer',
          employment_type: 'fullTime',
          status: 'active',
          company_name: 'TechCorp Inc.',
          location: 'San Francisco, CA',
          remote_ok: true,
          salary_min: 120000,
          salary_max: 150000,
          description: 'Join our team to build cutting-edge web applications',
          requirements: ['React', 'Node.js', 'TypeScript', '5+ years experience'],
          benefits: ['Health insurance', '401k', 'Remote work', 'Unlimited PTO'],
          candidate_count: 12,
          active_candidates: 8,
          recruiter_name: 'John Doe',
          linkedin_synced: true
        },
        {
          title: 'DevOps Engineer',
          employment_type: 'contract',
          status: 'active',
          company_name: 'CloudScale Solutions',
          location: 'Austin, TX',
          remote_ok: true,
          salary_min: 90000,
          salary_max: 120000,
          description: 'Help us scale our infrastructure and automate deployments',
          requirements: ['AWS', 'Kubernetes', 'Docker', 'CI/CD'],
          benefits: ['Flexible hours', 'Remote work', 'Learning budget'],
          candidate_count: 8,
          active_candidates: 5,
          recruiter_name: 'Jane Smith',
          linkedin_synced: false
        },
        {
          title: 'UX/UI Designer',
          employment_type: 'partTime',
          status: 'active',
          company_name: 'DesignHub Agency',
          location: 'New York, NY',
          remote_ok: false,
          salary_min: 60000,
          salary_max: 80000,
          description: 'Create beautiful and intuitive user experiences',
          requirements: ['Figma', 'Adobe Creative Suite', 'User research', '3+ years experience'],
          benefits: ['Flexible schedule', 'Professional development', 'Creative freedom'],
          candidate_count: 15,
          active_candidates: 12,
          recruiter_name: 'Sarah Johnson',
          linkedin_synced: true
        },
        {
          title: 'Data Analyst (EOR)',
          employment_type: 'eor',
          status: 'active',
          company_name: 'Global Analytics Ltd.',
          location: 'London, UK',
          remote_ok: true,
          salary_min: 70000,
          salary_max: 95000,
          description: 'Analyze data and provide insights for strategic decisions',
          requirements: ['SQL', 'Python', 'Tableau', 'Statistics'],
          benefits: ['Global team', 'Remote work', 'Career growth', 'International exposure'],
          candidate_count: 10,
          active_candidates: 7,
          recruiter_name: 'Michael Brown',
          linkedin_synced: true
        },
        {
          title: 'Frontend Developer',
          employment_type: 'fullTime',
          status: 'active',
          company_name: 'StartupXYZ',
          location: 'Seattle, WA',
          remote_ok: true,
          salary_min: 100000,
          salary_max: 130000,
          description: 'Build responsive and performant web applications',
          requirements: ['React', 'TypeScript', 'CSS', 'REST APIs'],
          benefits: ['Equity options', 'Health insurance', 'Remote work', 'Growth opportunities'],
          candidate_count: 20,
          active_candidates: 14,
          recruiter_name: 'Emily Davis',
          linkedin_synced: false
        },
        {
          title: 'Project Manager (Contract)',
          employment_type: 'contract',
          status: 'active',
          company_name: 'ConsultCo',
          location: 'Chicago, IL',
          remote_ok: true,
          salary_min: 80000,
          salary_max: 110000,
          description: 'Lead cross-functional teams to deliver projects on time',
          requirements: ['PMP certification', 'Agile/Scrum', 'Stakeholder management', '7+ years'],
          benefits: ['Flexible hours', 'Remote work', 'Competitive rate'],
          candidate_count: 6,
          active_candidates: 4,
          recruiter_name: 'Robert Wilson',
          linkedin_synced: true
        }
      ];

      for (const job of sampleJobs) {
        await query(
          `INSERT INTO jobs (
            title, employment_type, status, company_name, location, remote_ok,
            salary_min, salary_max, description, requirements, benefits,
            candidate_count, active_candidates, recruiter_name, linkedin_synced
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
          [
            job.title, job.employment_type, job.status, job.company_name,
            job.location, job.remote_ok, job.salary_min, job.salary_max,
            job.description, job.requirements, job.benefits,
            job.candidate_count, job.active_candidates, job.recruiter_name,
            job.linkedin_synced
          ]
        );
      }

      console.log(`✅ Inserted ${sampleJobs.length} sample jobs`);
    } else {
      console.log(`ℹ️  Database already has ${jobCount} jobs`);
    }

    console.log('🎉 Database setup complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up database:', error);
    process.exit(1);
  }
}

setupDatabase();
