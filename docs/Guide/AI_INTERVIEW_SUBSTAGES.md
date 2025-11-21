# AI Interview Stage - Substage Transitions

## Overview
The **AI Interview** stage represents the automated interview process where candidates interact with an AI-powered interviewing system. This stage features fully automated substage progression based on candidate actions and system processing status.

**Stage Type:** Automated Assessment  
**Total Substages:** 5  
**Automation Level:** 100% (all transitions are automatic)  
**Primary Purpose:** Conduct scalable, consistent AI-driven interviews with real-time analysis

---

## Complete Substage Structure

### 🤖 Stage 6: AI Interview

| Order | Substage ID | Label | Progress | Transition Trigger | Data Indicator |
|-------|-------------|-------|----------|-------------------|----------------|
| 1 | `ai_interview_sent` | AI Interview Sent | 20% | **Auto** - AI interview link sent to candidate | `ai_interview_link_sent_at` |
| 2 | `ai_interview_started` | AI Interview Started | 40% | **Auto** - Candidate clicks link and begins | `ai_interview_started_at` |
| 3 | `ai_interview_completed` | AI Interview Completed | 60% | **Auto** - Candidate finishes all questions | `ai_interview_completed_at` |
| 4 | `ai_analysis_in_progress` | AI Analysis In Progress | 80% | **Auto** - System processing responses | `ai_analysis_status = 'processing'` |
| 5 | `ai_results_ready` | AI Results Ready | 100% | **Auto** - Analysis complete, insights ready | `ai_analysis_status = 'completed'` |

---

## Substage Movement Logic

### How the System Knows When to Progress

Each substage transition is triggered by explicit action buttons (NOT by candidate views/clicks). Here's how the system determines when to move to the next substage:

**Substage 1 → 2:** `ai_interview_sent` to `ai_interview_started`
- **Trigger:** Recruiter clicks "Simulate Start" button (MVP) OR Candidate accesses Team Connect link (Production)
- **API Call:** POST `/api/candidates/:id/ai-interview/start`
- **Database Indicator:** `ai_interview_started_at` IS NOT NULL
- **Auto-Set Fields:** 
  - `ai_interview_started_at = CURRENT_TIMESTAMP`
  - `candidate_substage = 'ai_interview_started'`
- **Detection Query:**
  ```sql
  SELECT * FROM candidates 
  WHERE candidate_substage = 'ai_interview_sent'
  AND ai_interview_started_at IS NOT NULL;
  ```
- **⚠️ Important:** Substage does NOT auto-advance when candidate views link - requires explicit start action

**Substage 2 → 3:** `ai_interview_started` to `ai_interview_completed`
- **Trigger:** Recruiter clicks "Complete Interview" button (MVP) OR Candidate submits final response (Production)
- **API Call:** POST `/api/candidates/:id/ai-interview/complete`
- **Database Indicator:** `ai_interview_completed_at` IS NOT NULL
- **Auto-Set Fields:** 
  - `ai_interview_completed_at = CURRENT_TIMESTAMP`
  - `candidate_substage = 'ai_interview_completed'`
  - `ai_analysis_status = 'processing'` (immediately set)
- **Detection Query:**
  ```sql
  SELECT * FROM candidates 
  WHERE candidate_substage = 'ai_interview_started'
  AND ai_interview_completed_at IS NOT NULL;
  ```

**Substage 3 → 4:** `ai_interview_completed` to `ai_analysis_in_progress`
- **Trigger:** AUTOMATIC - Immediately after completion API call
- **Database Indicator:** `ai_analysis_status = 'processing'`
- **Auto-Set Fields:** 
  - `candidate_substage = 'ai_analysis_in_progress'`
- **Detection Query:**
  ```sql
  SELECT * FROM candidates 
  WHERE candidate_substage = 'ai_interview_completed'
  AND ai_analysis_status = 'processing';
  ```
- **Duration:** 2 seconds (mock delay in MVP)

**Substage 4 → 5:** `ai_analysis_in_progress` to `ai_results_ready`
- **Trigger:** AUTOMATIC - After mock processing delay completes
- **Database Indicator:** `ai_analysis_status = 'completed'` AND scores populated
- **Auto-Set Fields:** 
  - `ai_analysis_status = 'completed'`
  - `candidate_substage = 'ai_results_ready'`
  - `ai_technical_score`, `ai_communication_score`, `ai_culture_fit_score` (generated)
  - `ai_overall_score`, `ai_strengths`, `ai_improvements`
- **Detection Query:**
  ```sql
  SELECT * FROM candidates 
  WHERE candidate_substage = 'ai_analysis_in_progress'
  AND ai_analysis_status = 'completed';
  ```

### Auto-Transition Rules (Backend)
```javascript
// Substage 1: AI Interview Sent
// Manual button click only - NO auto-transition
if (recruiter_clicks_send_button) {
  ai_interview_link_sent_at = NOW();
  candidate_substage = 'ai_interview_sent';
}

// Substage 2: AI Interview Started
// Explicit action required - NOT triggered by viewing link
if (recruiter_clicks_simulate_start) {  // MVP
  ai_interview_started_at = NOW();
  candidate_substage = 'ai_interview_started';
}

// Substage 3: AI Interview Completed
// Explicit completion action
if (recruiter_clicks_complete) {  // MVP
  ai_interview_completed_at = NOW();
  ai_analysis_status = 'processing';
  candidate_substage = 'ai_interview_completed';
  // Immediately trigger auto-progression to substage 4
}

// Substage 4: AI Analysis In Progress
// Automatic progression after completion
setTimeout(() => {
  candidate_substage = 'ai_analysis_in_progress';
}, 0);  // Immediate

// Substage 5: AI Results Ready
// Automatic after 2-second mock processing
setTimeout(() => {
  ai_analysis_status = 'completed';
  ai_technical_score = generateMockScore();
  ai_communication_score = generateMockScore();
  ai_culture_fit_score = generateMockScore();
  candidate_substage = 'ai_results_ready';
}, 2000);  // 2 seconds in MVP
```

---

## Database Schema Requirements

### Required Fields in `candidates` Table

```sql
-- Timestamp tracking fields
ai_interview_link_sent_at TIMESTAMP NULL,
ai_interview_started_at TIMESTAMP NULL,
ai_interview_completed_at TIMESTAMP NULL,

-- Analysis status tracking
ai_analysis_status VARCHAR(50) NULL,  -- values: 'pending', 'processing', 'completed', 'failed'
ai_analysis_completed_at TIMESTAMP NULL,

-- Interview data storage
ai_interview_link VARCHAR(500) NULL,  -- Unique interview URL
ai_interview_token VARCHAR(100) NULL,  -- Security token for link validation
ai_interview_responses JSONB NULL,     -- Stores all Q&A pairs
ai_interview_duration_seconds INTEGER NULL,  -- Total time taken
ai_interview_score DECIMAL(5,2) NULL,  -- Overall AI score (0-100)
ai_sentiment_score DECIMAL(5,2) NULL,  -- Sentiment analysis score
ai_confidence_score DECIMAL(5,2) NULL, -- AI confidence in assessment
ai_analysis_report JSONB NULL          -- Detailed analysis results
```

### Optional Tracking Fields

```sql
-- Engagement metrics
ai_interview_questions_total INTEGER DEFAULT 0,
ai_interview_questions_answered INTEGER DEFAULT 0,
ai_interview_retries INTEGER DEFAULT 0,

-- Behavioral tracking
ai_interview_paused_count INTEGER DEFAULT 0,
ai_interview_last_activity_at TIMESTAMP NULL,
ai_interview_abandoned BOOLEAN DEFAULT false,
ai_interview_abandoned_at TIMESTAMP NULL
```

---

## Implementation Details

### 1. **AI Interview Link Generation** (Substage 1 Entry)

```javascript
async function sendAIInterviewInvitation(candidateId) {
  const candidate = await db.query.candidates.findFirst({
    where: eq(candidates.id, candidateId)
  });
  
  // Generate unique secure link
  const interviewToken = crypto.randomUUID();
  const interviewLink = `${process.env.AI_INTERVIEW_BASE_URL}/interview/${interviewToken}`;
  
  // Update candidate record
  await db.update(candidates)
    .set({
      ai_interview_link: interviewLink,
      ai_interview_token: interviewToken,
      ai_interview_link_sent_at: new Date(),
      candidate_substage: 'ai_interview_sent'
    })
    .where(eq(candidates.id, candidateId));
  
  // Send email with interview link
  await sendEmail({
    to: candidate.email,
    subject: 'Complete Your AI Interview',
    template: 'ai-interview-invitation',
    data: { interviewLink, candidateName: candidate.first_name }
  });
  
  console.log(`[AI Interview] Link sent to ${candidate.email}`);
}
```

### 2. **Interview Start Tracking** (Substage 1 → 2)

```javascript
// API endpoint: POST /api/ai-interview/:token/start
async function startAIInterview(req, res) {
  const { token } = req.params;
  
  // Validate token
  const candidate = await db.query.candidates.findFirst({
    where: eq(candidates.ai_interview_token, token)
  });
  
  if (!candidate) {
    return res.status(404).json({ error: 'Invalid interview link' });
  }
  
  // Check if already completed
  if (candidate.ai_interview_completed_at) {
    return res.status(400).json({ error: 'Interview already completed' });
  }
  
  // Update to "started" substage
  await db.update(candidates)
    .set({
      ai_interview_started_at: new Date(),
      candidate_substage: 'ai_interview_started',
      ai_interview_last_activity_at: new Date()
    })
    .where(eq(candidates.id, candidate.id));
  
  // Fetch AI-generated questions for this job
  const questions = await getAIInterviewQuestions(candidate.job_id);
  
  res.json({ 
    success: true, 
    candidateId: candidate.id,
    questions 
  });
}
```

### 3. **Interview Completion** (Substage 2 → 3)

```javascript
// API endpoint: POST /api/ai-interview/:token/submit
async function submitAIInterview(req, res) {
  const { token } = req.params;
  const { responses, duration } = req.body;
  
  const candidate = await db.query.candidates.findFirst({
    where: eq(candidates.ai_interview_token, token)
  });
  
  if (!candidate) {
    return res.status(404).json({ error: 'Invalid interview link' });
  }
  
  // Store responses and update substage
  await db.update(candidates)
    .set({
      ai_interview_responses: JSON.stringify(responses),
      ai_interview_duration_seconds: duration,
      ai_interview_completed_at: new Date(),
      ai_interview_questions_total: responses.length,
      ai_interview_questions_answered: responses.filter(r => r.answer).length,
      candidate_substage: 'ai_interview_completed',
      ai_analysis_status: 'pending'
    })
    .where(eq(candidates.id, candidate.id));
  
  // Trigger AI analysis asynchronously
  processAIAnalysis(candidate.id).catch(err => {
    console.error('[AI Analysis] Processing failed:', err);
  });
  
  res.json({ 
    success: true, 
    message: 'Interview submitted successfully. AI analysis will be ready shortly.' 
  });
}
```

### 4. **AI Analysis Processing** (Substage 3 → 4 → 5)

```javascript
async function processAIAnalysis(candidateId) {
  try {
    // Update to "processing" substage
    await db.update(candidates)
      .set({
        ai_analysis_status: 'processing',
        candidate_substage: 'ai_analysis_in_progress'
      })
      .where(eq(candidates.id, candidateId));
    
    const candidate = await db.query.candidates.findFirst({
      where: eq(candidates.id, candidateId),
      with: { job: true }
    });
    
    // Call OpenAI for analysis
    const analysisResult = await analyzeInterviewWithAI({
      jobTitle: candidate.job.title,
      jobDescription: candidate.job.description,
      responses: JSON.parse(candidate.ai_interview_responses),
      candidateName: `${candidate.first_name} ${candidate.last_name}`
    });
    
    // Update with completed analysis results
    await db.update(candidates)
      .set({
        ai_analysis_status: 'completed',
        candidate_substage: 'ai_results_ready',
        ai_analysis_completed_at: new Date(),
        ai_interview_score: analysisResult.overallScore,
        ai_sentiment_score: analysisResult.sentimentScore,
        ai_confidence_score: analysisResult.confidenceScore,
        ai_analysis_report: JSON.stringify(analysisResult.detailedReport)
      })
      .where(eq(candidates.id, candidateId));
    
    console.log(`[AI Analysis] Completed for candidate ${candidateId}, score: ${analysisResult.overallScore}`);
    
  } catch (error) {
    console.error('[AI Analysis] Error processing:', error);
    
    // Mark as failed
    await db.update(candidates)
      .set({
        ai_analysis_status: 'failed',
        candidate_substage: 'ai_interview_completed' // Revert to previous substage
      })
      .where(eq(candidates.id, candidateId));
  }
}
```

### 5. **AI Analysis Function (OpenAI Integration)**

```javascript
async function analyzeInterviewWithAI({ jobTitle, jobDescription, responses, candidateName }) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  
  const prompt = `
You are an expert HR interviewer analyzing a candidate's AI interview responses.

Job Title: ${jobTitle}
Job Description: ${jobDescription}
Candidate: ${candidateName}

Interview Responses:
${responses.map((r, i) => `Q${i + 1}: ${r.question}\nA${i + 1}: ${r.answer}`).join('\n\n')}

Analyze the responses and provide:
1. Overall Score (0-100) based on relevance, quality, and depth
2. Sentiment Score (0-100) indicating positivity and enthusiasm
3. Confidence Score (0-100) in the assessment accuracy
4. Detailed breakdown by category (technical skills, communication, cultural fit)
5. Key strengths (3-5 bullet points)
6. Areas for improvement (3-5 bullet points)
7. Recommendation (Strong Hire / Hire / Maybe / No Hire)

Return response as JSON.
`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.3
  });
  
  const analysis = JSON.parse(response.choices[0].message.content);
  
  return {
    overallScore: analysis.overall_score || 0,
    sentimentScore: analysis.sentiment_score || 0,
    confidenceScore: analysis.confidence_score || 0,
    detailedReport: analysis
  };
}
```

---

## Key Substage Differences

### **Substage 1 vs 2: `ai_interview_sent` → `ai_interview_started`**
- **Trigger:** Candidate clicks the unique interview link
- **Data Indicator:** `ai_interview_started_at` timestamp populated
- **Business Logic:** Link validation, expiry check (optional 7-day expiry)
- **User Action Required:** Yes (candidate must click link)

### **Substage 2 vs 3: `ai_interview_started` → `ai_interview_completed`**
- **Trigger:** Candidate submits final answer in interview UI
- **Data Indicator:** `ai_interview_completed_at` timestamp populated
- **Business Logic:** All responses stored in JSONB field
- **User Action Required:** Yes (candidate must complete all questions)

### **Substage 3 vs 4: `ai_interview_completed` → `ai_analysis_in_progress`**
- **Trigger:** Automatic after submission
- **Data Indicator:** `ai_analysis_status = 'processing'`
- **Business Logic:** Background job queued for AI analysis
- **User Action Required:** No (fully automatic)
- **Average Duration:** 10-30 seconds depending on response length

### **Substage 4 vs 5: `ai_analysis_in_progress` → `ai_results_ready`**
- **Trigger:** AI analysis completes successfully
- **Data Indicator:** `ai_analysis_status = 'completed'`
- **Business Logic:** Analysis results stored, scores calculated
- **User Action Required:** No (fully automatic)
- **Failure Handling:** Reverts to `ai_interview_completed` if analysis fails

---

## Frontend Display Logic

### Progress Bar Component
```tsx
// Display AI Interview progress with gradient
function AIInterviewProgress({ candidate }: { candidate: Candidate }) {
  const substages = [
    { id: 'ai_interview_sent', label: 'Interview Sent', progress: 20 },
    { id: 'ai_interview_started', label: 'Started', progress: 40 },
    { id: 'ai_interview_completed', label: 'Completed', progress: 60 },
    { id: 'ai_analysis_in_progress', label: 'Analyzing', progress: 80 },
    { id: 'ai_results_ready', label: 'Results Ready', progress: 100 }
  ];
  
  const currentSubstage = substages.find(s => s.id === candidate.candidate_substage);
  const progressPercent = currentSubstage?.progress || 0;
  
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-gray-600 mb-1">
        <span>{currentSubstage?.label || 'Not Started'}</span>
        <span>{progressPercent}%</span>
      </div>
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      
      {/* Show spinner when analyzing */}
      {candidate.ai_analysis_status === 'processing' && (
        <div className="flex items-center gap-2 mt-2 text-sm text-purple-600">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-600 border-t-transparent" />
          <span>AI analyzing responses...</span>
        </div>
      )}
    </div>
  );
}
```

### Results Display (Substage 5)
```tsx
// Show AI analysis results when ready
function AIInterviewResults({ candidate }: { candidate: Candidate }) {
  if (candidate.candidate_substage !== 'ai_results_ready') {
    return <p className="text-gray-500">Results not ready yet</p>;
  }
  
  const report = JSON.parse(candidate.ai_analysis_report || '{}');
  
  return (
    <div className="space-y-4">
      {/* Overall Score */}
      <div className="flex items-center gap-4">
        <div className="text-4xl font-bold text-purple-600">
          {candidate.ai_interview_score}/100
        </div>
        <div>
          <div className="text-sm font-medium">Overall AI Score</div>
          <div className="text-xs text-gray-500">
            Confidence: {candidate.ai_confidence_score}%
          </div>
        </div>
      </div>
      
      {/* Recommendation Badge */}
      <div className="inline-block px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-medium">
        {report.recommendation || 'No recommendation'}
      </div>
      
      {/* Strengths */}
      <div>
        <h4 className="font-semibold mb-2">Strengths</h4>
        <ul className="list-disc list-inside space-y-1 text-sm">
          {report.strengths?.map((s, i) => <li key={i}>{s}</li>)}
        </ul>
      </div>
      
      {/* Areas for Improvement */}
      <div>
        <h4 className="font-semibold mb-2">Areas for Improvement</h4>
        <ul className="list-disc list-inside space-y-1 text-sm">
          {report.improvements?.map((imp, i) => <li key={i}>{imp}</li>)}
        </ul>
      </div>
    </div>
  );
}
```

---

## Error Handling & Edge Cases

### 1. **Interview Link Expiry**
```javascript
// Check if link is expired (7 days)
const LINK_EXPIRY_DAYS = 7;
const linkAge = Date.now() - new Date(candidate.ai_interview_link_sent_at).getTime();
const isExpired = linkAge > LINK_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

if (isExpired) {
  return res.status(400).json({ 
    error: 'Interview link expired. Please contact recruiter for new link.' 
  });
}
```

### 2. **Abandoned Interviews**
```javascript
// Cron job: Mark interviews abandoned if not completed within 24 hours of start
async function markAbandonedInterviews() {
  const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  await db.update(candidates)
    .set({
      ai_interview_abandoned: true,
      ai_interview_abandoned_at: new Date()
    })
    .where(and(
      isNotNull(candidates.ai_interview_started_at),
      isNull(candidates.ai_interview_completed_at),
      lt(candidates.ai_interview_started_at, cutoffTime)
    ));
}
```

### 3. **Analysis Failure Retry**
```javascript
// Retry failed analysis up to 3 times
async function retryFailedAnalysis() {
  const failedCandidates = await db.query.candidates.findMany({
    where: and(
      eq(candidates.ai_analysis_status, 'failed'),
      lt(candidates.ai_interview_retries, 3)
    )
  });
  
  for (const candidate of failedCandidates) {
    await db.update(candidates)
      .set({ ai_interview_retries: candidate.ai_interview_retries + 1 })
      .where(eq(candidates.id, candidate.id));
    
    await processAIAnalysis(candidate.id);
  }
}
```

---

## Testing Checklist

- [ ] **Substage 1:** AI interview link sent successfully via email
- [ ] **Substage 2:** Link click tracked, interview starts correctly
- [ ] **Substage 3:** Responses submitted and stored in JSONB
- [ ] **Substage 4:** Analysis status updates to 'processing' immediately
- [ ] **Substage 5:** Analysis completes with scores and report
- [ ] **Error:** Expired links rejected with clear message
- [ ] **Error:** Already completed interviews blocked
- [ ] **Error:** Failed analysis retries automatically
- [ ] **Frontend:** Progress bar shows correct substage visually
- [ ] **Frontend:** Results display when `ai_results_ready`

---

## Related Documentation

- [Complete Substage Transition Guide](./SUBSTAGE_TRANSITION_GUIDE.md)
- [Client Endorsement Substages](./SUBSTAGE_TRANSITION_GUIDE.md#stage-8-client-endorsement)
- [Database Schema Analysis](./DATABASE_SCHEMA_ANALYSIS.md)
- [End-to-End Testing Guide](./END_TO_END_TESTING_GUIDE.md)

---

**Document Version:** 1.0  
**Last Updated:** November 20, 2025  
**Maintainer:** ATS Development Team
