# 📊 ATS System - Views & Navigation Guide

## ✅ Available Views to See Jobs and Candidates

### 1. **Jobs Dashboard** 📋
**Route:** `/dashboard/jobs`  
**Features:**
- View all published jobs
- Filter by employment type (Contract, Part-Time, Full-Time, EOR)
- Filter by status (Draft, Active, Paused, Filled, Closed)
- Search jobs by title, location, or company
- See candidate count for each job
- Create new jobs
- Publish recruiter jobs directly
- View job details

**Quick Access:**
```
http://localhost:5000/dashboard/jobs
```

**What You'll See:**
- Job cards with title, employment type, location
- Status badges (Draft, Active, Paused, Filled)
- Candidate counts
- Action buttons (View Details, Publish, etc.)

---

### 2. **Candidates View** 👥 ⭐ NEW!
**Route:** `/dashboard/candidates`  
**Features:**
- View ALL candidates across all jobs in one place
- Filter by job
- Filter by pipeline stage
- Filter by source (LinkedIn, Direct, Referral, Portal)
- Search by name, email, or job title
- See candidate details (email, phone, stage, source)
- View resumes
- Navigate to candidate's job

**Quick Access:**
```
http://localhost:5000/dashboard/candidates
```

**What You'll See:**
| Candidate | Contact | Job | Stage | Source | Applied | Actions |
|-----------|---------|-----|-------|--------|---------|---------|
| John Doe | john.doe@email.com | Software Engineer | Screening | Direct | Nov 19 | Resume, Job |

**Summary Stats:**
- Total Candidates
- Active Candidates  
- Total Jobs
- Pipeline Stages Count

---

### 3. **Job Details Page** 📄
**Route:** `/dashboard/jobs/:jobId`  
**Features:**
- View complete job information
- See job description, requirements, benefits
- Employment type details
- Location and salary information
- View all pipeline stages
- See candidates in each stage

**Quick Access for Test Job:**
```
http://localhost:5000/dashboard/jobs/4a9f8d5b-b2a3-4813-8d07-3e2c6087238c
```

---

### 4. **Direct API Access** 🔌

#### Get All Jobs:
```bash
curl http://localhost:5000/api/jobs
```

#### Get All Candidates:
```bash
curl http://localhost:5000/api/candidates
```

#### Get Candidates for Specific Job:
```bash
curl "http://localhost:5000/api/candidates?jobId=4a9f8d5b-b2a3-4813-8d07-3e2c6087238c"
```

#### Get Pipeline Stages for Job:
```bash
curl "http://localhost:5000/api/jobs/4a9f8d5b-b2a3-4813-8d07-3e2c6087238c/pipeline-stages"
```

---

## 🎯 Your Test Job Data

### **Test Job - ATS - Software Enginner**
**Job ID:** `4a9f8d5b-b2a3-4813-8d07-3e2c6087238c`

### Pipeline with Candidates:

1. **Screening** - 1 candidate
   - John Doe (direct)

2. **Shortlist** - 1 candidate
   - Sarah Johnson (linkedin)

3. **Client Endorsement** - 1 candidate
   - Michael Chen (referral)

4. **AI Interview** - 1 candidate
   - Emily Rodriguez (portal)

5. **Human Interview** - 1 candidate
   - David Kim (linkedin)

6. **Offer** - 0 candidates

7. **Offer Accepted** - 0 candidates

---

## 🚀 Quick Navigation Guide

### From Dashboard Home (`/dashboard`):
1. Click **"Jobs"** in sidebar → See all jobs
2. Click **"Candidates"** in sidebar → See all candidates
3. Click **"Approvals"** in sidebar → See job approval queue
4. Click **"Pipeline Configuration"** → Manage workflow templates

### From Jobs Dashboard:
1. Click **"View Details"** button on any job → See job details and pipeline
2. Click **"Create Job"** button → Create new job with pipeline preview
3. Use filters to find specific jobs

### From Candidates Page:
1. Select a job from dropdown → Filter candidates by job
2. Select a stage from dropdown → Filter by pipeline stage
3. Click email → Send email to candidate
4. Click arrow icon → Navigate to candidate's job
5. Click external link icon → View candidate's resume

---

## 📊 Database Tables You Can Query

### Candidates Table:
```sql
SELECT 
  c.first_name || ' ' || c.last_name as name,
  c.email,
  c.current_stage,
  c.source,
  c.status,
  j.title as job_title
FROM candidates c
JOIN jobs j ON c.job_id = j.id
WHERE j.id = '4a9f8d5b-b2a3-4813-8d07-3e2c6087238c';
```

### Pipeline Stages with Candidate Counts:
```sql
SELECT 
  jps.stage_name,
  jps.stage_order,
  COUNT(c.id) as candidate_count
FROM job_pipeline_stages jps
LEFT JOIN candidates c ON c.job_id = jps.job_id AND c.current_stage = jps.stage_name
WHERE jps.job_id = '4a9f8d5b-b2a3-4813-8d07-3e2c6087238c'
GROUP BY jps.id, jps.stage_name, jps.stage_order
ORDER BY jps.stage_order;
```

---

## ✨ Features in Each View

### Candidates Page Features:
- ✅ Searchable table with all candidates
- ✅ Filter by job, stage, and source
- ✅ Clickable emails for direct contact
- ✅ Resume links (when available)
- ✅ Navigate to candidate's job
- ✅ Live statistics cards
- ✅ Color-coded stages and sources
- ✅ Status badges (active/inactive)
- ✅ Formatted dates
- ✅ Responsive design

### Jobs Dashboard Features:
- ✅ Job cards with employment type colors
- ✅ Status management (Publish, Pause, Close)
- ✅ LinkedIn sync status
- ✅ Candidate count badges
- ✅ Search and filters
- ✅ Create job modal with pipeline preview

---

## 🎨 UI Highlights

**Candidates Page:**
- Gradient avatar bubbles with initials
- Color-coded stage badges
- Color-coded source badges
- Statistics cards with gradients
- Hover effects on table rows
- Responsive table design

**Jobs Dashboard:**
- Employment type color coding
- Status icons and badges
- Confirmation modals with custom styling
- Pipeline preview in job creation
- Action buttons with hover effects

---

## 📝 Summary

**You now have 2 main views to see jobs and candidates:**

1. **Jobs Dashboard** → See all jobs, create jobs, manage status
2. **Candidates Page** → See all candidates, filter by job/stage, contact candidates

**Plus supporting views:**
- Job Details → Individual job with pipeline
- Approvals → Job approval workflow
- Pipeline Configuration → Manage templates

**All views are accessible from the dashboard sidebar!** 🎉
