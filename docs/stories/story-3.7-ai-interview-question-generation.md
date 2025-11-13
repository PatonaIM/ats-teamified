# Story 3.7: AI-Powered Interview Question Generation **[MVP Priority - FR16.2]**

**Epic:** [Epic 3 - Assessment, Interview & Document Verification Systems](../epics/epic-3-assessment-interview-document-verification.md)  
**Story ID:** 3.7  
**Priority:** Phase 1 - MVP Foundation ⭐  
**Estimate:** 2 weeks

---

## User Story

**As a** hiring manager or recruiter,  
**I want** AI-generated role-specific interview questions optimized for hiring success,  
**so that** I can conduct more effective interviews with questions tailored to employment type, candidate background, and proven performance indicators.

---

## Acceptance Criteria

1. ✅ Employment type-specific question templates implemented generating targeted questions for contract (project delivery, self-management), part-time (time management, flexibility), full-time (growth, culture, collaboration), and EOR positions (remote work, cross-cultural communication, timezone management) as defined in FR16.2 **[MVP]**
2. ✅ Resume-based question customization implemented using AI analysis to generate personalized questions relating candidate's specific prior experience to job requirements with technical deep-dive capabilities **[MVP]**
3. ⏸️ Historical performance tracking implemented monitoring which questions correlate with successful hires (retention >1 year, high performance ratings) with prediction accuracy scoring requiring minimum 50 successful hires per role as specified in FR16.2 **[Phase 2 - Requires Data]**
4. ⏸️ Question effectiveness analytics dashboard implemented showing prediction accuracy percentages, usage statistics, and continuous improvement recommendations with A/B testing capabilities for question variations **[Phase 2 - Requires Data]**
5. ⏸️ Live interview assistant implemented providing real-time AI-suggested follow-up questions based on candidate responses, probing technical depth, revealing problem-solving approaches, and testing decision-making frameworks **[Phase 2 - Requires Portal]**
6. ⏸️ Bias detection and mitigation implemented with automatic flagging of discriminatory questions (illegal, age, national origin, family status), inclusive language recommendations, and compliance monitoring across protected characteristics as specified in FR16.2 **[Phase 2 - Requires NLP]**
7. ✅ Interview preparation workflow implemented with pre-interview AI analysis generating 15-20 questions, recruiter customization interface for selecting 8-12 final questions, question distribution to interview panels with scoring rubrics, and post-interview response quality analysis **[MVP - Manual Selection]**
8. ✅ Question library management implemented with centralized repository organized by role and employment type, effectiveness tracking with usage analytics and prediction accuracy, and client-specific customization options **[MVP]**
9. ⏸️ Interview scorecard integration implemented with AI-suggested evaluation criteria, structured scoring systems, and comparative candidate analysis benchmarked against historical data **[Phase 2 - Requires Data]**
10. ✅ AI model integration implemented using OpenAI GPT-4/Anthropic Claude for advanced question generation, GPT-3.5 for template-based questions, and NLP for resume parsing with skill extraction as detailed in FR16.3 **[MVP - LLM Only]**
11. ⏸️ Privacy and compliance controls implemented with candidate consent for interview recording/transcription, GDPR-compliant data processing, anonymized ML training data, and transparent bias audit reporting **[Phase 2 - Advanced Privacy]**
12. ✅ Cost optimization implemented with question caching for similar roles, batch processing, token optimization for LLM calls, targeting estimated $0.10-0.50 per interview preparation as specified in FR16.3 **[MVP]**

---

## MVP Implementation Focus

### ✅ Essential for MVP (Criteria 1-2, 7-8, 10, 12)
- **Employment type question templates:** Curated libraries for contract, part-time, full-time, EOR
- **Basic resume keyword matching:** Extract skills/experience from resume, generate related questions
- **Interview preparation workflow:** Generate 15-20 questions, recruiter selects 8-12
- **Question library management:** Store and organize questions by role/type
- **LLM integration:** GPT-4/Claude for template enhancement and customization
- **Cost optimization:** Cache common questions, optimize API calls

### ⏸️ Phase 2 Enhancement (Criteria 3-6, 9, 11)
- **Historical performance tracking:** Requires 50+ hires per role for ML training
- **Effectiveness analytics:** Prediction accuracy, A/B testing
- **Live interview assistant:** Real-time suggestions during interviews
- **Automated bias detection:** NLP-powered discriminatory language flagging
- **Scorecard integration:** AI-suggested evaluation criteria
- **Advanced privacy:** Recording consent, GDPR compliance

### Realistic MVP Baseline
```
✅ What MVP Delivers:
- Employment type question libraries (curated, not ML-generated)
- Resume keyword → question matching (basic NLP, not deep learning)
- Interview prep workflow (generate → select → distribute)
- Question repository with basic tagging

❌ What MVP Defers:
- ML effectiveness tracking (no historical data yet)
- Live interview assistant (requires portal integration)
- Automated bias detection (requires NLP models)
- Predictive scoring (requires completed hire data)
```

---

## Technical Dependencies

**AI/ML:**
- OpenAI GPT-4 or Anthropic Claude (question generation)
- Resume parsing library (basic NLP)
- Question caching (Redis)

**Backend:**
- NestJS interview questions service
- PostgreSQL tables: interview_questions, question_library, question_usage
- Azure Key Vault (API keys)

**Frontend:**
- React question generation interface
- Question selection/customization UI
- Interview prep dashboard

---

## Employment Type Question Templates

### Contract Position Questions
```
Project Delivery & Self-Management:
1. Describe a project where you delivered results independently with minimal oversight.
2. How do you manage scope creep when working on contract deliverables?
3. Walk me through your process for estimating project timelines and managing client expectations.
4. Tell me about a time you had to pivot project strategy mid-contract.
```

### Part-Time Position Questions
```
Time Management & Flexibility:
1. How do you prioritize tasks when working limited hours per week?
2. Describe your approach to context-switching between part-time roles or responsibilities.
3. How do you ensure consistent quality output with reduced availability?
4. Tell me about a time you managed competing priorities with time constraints.
```

### Full-Time Position Questions
```
Growth, Culture & Collaboration:
1. Where do you see yourself in 3-5 years within our organization?
2. Describe how you've contributed to team culture in previous roles.
3. Tell me about a cross-functional project where you collaborated with multiple teams.
4. How do you approach professional development and skill growth?
```

### EOR Position Questions
```
Remote Work & Cross-Cultural Communication:
1. How do you maintain productivity and focus when working remotely full-time?
2. Describe your experience working across multiple time zones.
3. Tell me about a time you navigated cultural differences in a remote team.
4. How do you build relationships with colleagues you've never met in person?
```

---

## Question Generation Workflow (MVP)

```typescript
// Step 1: Generate questions from template + resume
async function generateInterviewQuestions(
  jobId: string,
  candidateId: string,
  employmentType: EmploymentType
): Promise<InterviewQuestion[]> {
  
  // Get employment type template
  const template = await getQuestionTemplate(employmentType);
  
  // Parse candidate resume
  const resume = await getCandidateResume(candidateId);
  const skills = extractSkills(resume); // Basic NLP
  
  // Generate customized questions via LLM
  const prompt = `
    Generate 15-20 interview questions for a ${employmentType} position.
    
    Job Requirements: ${job.requirements}
    Candidate Skills: ${skills.join(', ')}
    
    Use this template as a guide: ${template}
    
    Customize questions to relate the candidate's ${skills} to the job requirements.
  `;
  
  const questions = await callLLM(prompt); // GPT-4/Claude
  
  // Store in question library
  await saveToQuestionLibrary(questions, { jobId, candidateId, employmentType });
  
  return questions;
}

// Step 2: Recruiter selects final questions
function selectFinalQuestions(questions: Question[]): Question[] {
  // Recruiter manually selects 8-12 questions from generated 15-20
  return selectedQuestions;
}

// Step 3: Distribute to interview panel
async function distributeQuestions(
  interviewId: string,
  questions: Question[]
): Promise<void> {
  // Send selected questions to interviewers with scoring rubric
  await sendToInterviewers(interviewId, questions);
}
```

---

## Cost Optimization

**Target:** $0.10-0.50 per interview preparation

**Strategies:**
1. **Question Caching:** Store generated questions for similar roles
2. **Template Reuse:** Use curated templates, enhance with LLM
3. **Batch Processing:** Generate questions in batches for efficiency
4. **Token Optimization:** Minimize prompt length, maximize output quality

**Estimated Costs:**
- GPT-4: ~2,000 tokens per generation = $0.06
- Question caching: 70% cache hit rate
- Effective cost: $0.02-0.20 per interview prep

---

## Database Schema

```typescript
Table: interview_questions
- id (UUID, PK)
- question_text (TEXT)
- employment_type (ENUM: contract, part_time, full_time, eor)
- category (VARCHAR) // technical, behavioral, situational
- difficulty_level (ENUM: easy, medium, hard)
- ai_generated (BOOLEAN)
- effectiveness_score (DECIMAL, nullable) // Phase 2
- usage_count (INTEGER)
- created_at (TIMESTAMP)

Table: question_library
- id (UUID, PK)
- job_id (UUID, FK)
- candidate_id (UUID, FK, nullable)
- question_id (UUID, FK)
- customization_notes (TEXT)
- selected_for_interview (BOOLEAN)
- created_at (TIMESTAMP)

Table: question_usage
- id (UUID, PK)
- question_id (UUID, FK)
- interview_id (UUID, FK)
- interviewer_feedback (TEXT, nullable)
- candidate_hired (BOOLEAN, nullable) // Phase 2 tracking
```

---

## Related Requirements

- FR16.2: AI-Powered Interview Question Generation [MVP]
- FR16.3: AI Integration Technical Specifications
- NFR1: Security Requirements (API key management)

---

## Notes

- **MVP Critical Feature:** AI interview questions are a key differentiator
- **Data Bootstrap:** MVP collects usage data for Phase 2 ML models
- **Human-in-Loop:** Always require recruiter to select final questions
- **Template-Based:** MVP uses curated templates enhanced by LLM, not pure ML
- **Phase 2 ML:** Historical effectiveness tracking after 50+ hires per role
