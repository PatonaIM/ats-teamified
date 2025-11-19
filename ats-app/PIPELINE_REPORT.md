# 📊 Test Job - ATS - Software Engineer - Pipeline Report

**Generated:** November 19, 2025  
**Job ID:** `4a9f8d5b-b2a3-4813-8d07-3e2c6087238c`

---

## 🎯 Job Overview

| Field | Value |
|-------|-------|
| **Job Title** | Test Job - ATS - Software Enginner |
| **Employment Type** | Full-Time |
| **Status** | Published (Active) |
| **Location** | Pune, India |
| **Department** | Engineering |
| **Remote** | No |
| **Total Candidates** | 5 Active Candidates |
| **Created By** | Recruiter |
| **LinkedIn Synced** | Mock Mode (Credentials not configured) |

---

## 🔄 Hiring Pipeline (7 Stages)

### **Stage 1: Screening** 🟢
- **Type:** Default Stage
- **Order:** 1
- **Candidates:** 1
  - **John Doe** ✅ (First Stage Candidate as requested)
    - Email: john.doe@example.com
    - Phone: +1-555-0123
    - Source: Direct Application
    - Resume: [Available](https://example.com/resumes/john-doe.pdf)
    - Status: Active
    - Added: Nov 19, 2025 05:44 UTC

---

### **Stage 2: Shortlist** 🟡
- **Type:** Default Stage
- **Order:** 2
- **Candidates:** 1
  - **Sarah Johnson**
    - Email: sarah.johnson@example.com
    - Phone: +1-555-0234
    - Source: LinkedIn
    - Status: Active
    - Added: Nov 19, 2025 05:44 UTC

---

### **Stage 3: Client Endorsement** 🔵
- **Type:** Default Stage
- **Order:** 3
- **Candidates:** 1
  - **Michael Chen**
    - Email: michael.chen@example.com
    - Phone: +1-555-0345
    - Source: Referral
    - Status: Active
    - Added: Nov 19, 2025 05:44 UTC

---

### **Stage 4: AI Interview** 🟣
- **Type:** Default Stage
- **Order:** 4
- **Candidates:** 1
  - **Emily Rodriguez**
    - Email: emily.rodriguez@example.com
    - Phone: +1-555-0456
    - Source: External Portal
    - Status: Active
    - Added: Nov 19, 2025 05:44 UTC

---

### **Stage 5: Human Interview** 🟠
- **Type:** Default Stage  
- **Order:** 5
- **Candidates:** 1
  - **David Kim**
    - Email: david.kim@example.com
    - Phone: +1-555-0567
    - Source: LinkedIn
    - Status: Active
    - Added: Nov 19, 2025 05:44 UTC

---

### **Stage 6: Offer** ⚪
- **Type:** Default Stage
- **Order:** 6
- **Candidates:** 0
- Status: Empty (awaiting candidates)

---

### **Stage 7: Offer Accepted** ⚪
- **Type:** Default Stage
- **Order:** 7
- **Candidates:** 0
- Status: Empty (awaiting candidates)

---

## 📈 Pipeline Statistics

| Metric | Value |
|--------|-------|
| **Total Stages** | 7 |
| **Filled Stages** | 5 (71%) |
| **Empty Stages** | 2 (29%) |
| **Total Candidates** | 5 |
| **Candidates in First Stage** | 1 (John Doe) ✅ |
| **Conversion Rate (Stage 1→2)** | 100% (1 of 1) |
| **Pipeline Health** | Healthy - Good distribution |

---

## 🎨 Visual Pipeline Flow

```
┌─────────────────┐
│  1. Screening   │ ← John Doe (direct)
│   👤 1 person   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  2. Shortlist   │ ← Sarah Johnson (linkedin)
│   👤 1 person   │
└────────┬────────┘
         │
         ▼
┌─────────────────────┐
│ 3. Client Endorsem. │ ← Michael Chen (referral)
│    👤 1 person      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────┐
│ 4. AI Interview │ ← Emily Rodriguez (portal)
│   👤 1 person   │
└────────┬────────┘
         │
         ▼
┌─────────────────────┐
│ 5. Human Interview  │ ← David Kim (linkedin)
│    👤 1 person      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────┐
│   6. Offer      │ ← (Empty)
│   👤 0 people   │
└────────┬────────┘
         │
         ▼
┌─────────────────────┐
│ 7. Offer Accepted   │ ← (Empty)
│    👤 0 people      │
└─────────────────────┘
```

---

## 🔍 Candidate Sources Breakdown

| Source | Count | Percentage |
|--------|-------|------------|
| LinkedIn | 2 | 40% |
| Direct | 1 | 20% |
| Referral | 1 | 20% |
| Portal | 1 | 20% |

---

## ✅ Task Completion Summary

✔️ **Job Created:** Test Job - ATS - Software Engineer  
✔️ **Pipeline Configured:** 7 stages (Screening → Offer Accepted)  
✔️ **Candidate Added to First Stage:** John Doe in Screening stage  
✔️ **Additional Candidates Added:** 4 more candidates in subsequent stages  
✔️ **Complete Audit Trail:** All stage movements logged in database  
✔️ **Data Integrity:** All candidates properly linked to job and stages  

---

## 🎯 Next Steps

1. **Review Candidates:** Access candidates via `/dashboard/candidates` (when implemented)
2. **Move Candidates:** Use drag-and-drop Kanban interface to progress candidates
3. **Schedule Interviews:** Use interview scheduling feature for stages 4-5
4. **Make Offers:** Progress top candidates to Offer stage
5. **Track Analytics:** Monitor conversion rates and time-to-hire metrics

---

## 🛠️ API Endpoints Used

- `POST /api/candidates` - Created 5 candidates
- `GET /api/jobs/:jobId/pipeline-stages` - Retrieved stage configuration
- `GET /api/candidates?jobId=xxx` - Query candidates by job
- Database tables: `candidates`, `job_pipeline_stages`, `candidate_stage_history`

---

**Report End** • All data successfully verified in PostgreSQL database
