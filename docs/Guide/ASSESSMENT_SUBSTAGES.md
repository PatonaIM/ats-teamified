# Technical Assessment Substage Transitions

## Overview
Technical Assessment stage has **5 substages** that track the complete assessment lifecycle from sending the test to reviewing results.

**⚠️ STATUS: PLANNED / NOT YET IMPLEMENTED**  
This document outlines the future implementation plan for the Technical Assessment stage. The substage definitions exist in `substage-definitions.js`, but the full workflow (API endpoints, database fields, UI components) has not been built yet.

**Refer to this document as a specification for future development.**

---

## Substages

### 1. Assessment Sent (20% progress)
**Substage ID:** `assessment_sent`
**Label:** Assessment Sent

**Transition Logic:**
- **Manual/Auto Trigger:** Assessment email sent to candidate
- **Database Field:** `assessment_sent_at` (timestamp)
- **How to Trigger:** 
  - Recruiter clicks "Send Assessment" button
  - System generates unique assessment link
  - Email sent to candidate with test access

**SQL Example:**
```sql
UPDATE candidates 
SET assessment_sent_at = CURRENT_TIMESTAMP,
    candidate_substage = 'assessment_sent'
WHERE id = '<candidate_id>';
```

---

### 2. Assessment In Progress (40% progress)
**Substage ID:** `assessment_in_progress`
**Label:** Assessment In Progress

**Transition Logic:**
- **Auto-Trigger:** Candidate opens assessment link
- **Database Field:** `assessment_started_at` (timestamp)
- **How to Trigger:** 
  - Candidate clicks assessment link in email
  - Auto-tracked when candidate begins test
  - Shows candidate is actively working on assessment

**SQL Example:**
```sql
UPDATE candidates 
SET assessment_started_at = CURRENT_TIMESTAMP,
    candidate_substage = 'assessment_in_progress'
WHERE id = '<candidate_id>';
```

---

### 3. Assessment Submitted (60% progress)
**Substage ID:** `assessment_submitted`
**Label:** Assessment Submitted

**Transition Logic:**
- **Auto-Trigger:** Candidate submits completed assessment
- **Database Field:** `assessment_submitted_at` (timestamp)
- **How to Trigger:** 
  - Candidate clicks "Submit Assessment" button
  - All responses saved to database
  - Assessment portal locked from further changes

**SQL Example:**
```sql
UPDATE candidates 
SET assessment_submitted_at = CURRENT_TIMESTAMP,
    candidate_substage = 'assessment_submitted'
WHERE id = '<candidate_id>';
```

---

### 4. Pending Assessment Review (80% progress)
**Substage ID:** `pending_review`
**Label:** Pending Assessment Review

**Transition Logic:**
- **Auto-Trigger:** Assessment submitted but no score assigned
- **Database Field:** `assessment_score` (NULL check)
- **How to Trigger:** 
  - Automatically set when assessment submitted
  - Awaiting recruiter/reviewer to grade
  - Shows in reviewer queue

**SQL Example:**
```sql
UPDATE candidates 
SET candidate_substage = 'pending_review'
WHERE id = '<candidate_id>'
AND assessment_submitted_at IS NOT NULL
AND assessment_score IS NULL;
```

---

### 5. Assessment Completed (100% progress)
**Substage ID:** `assessment_completed`
**Label:** Assessment Completed

**Transition Logic:**
- **Manual/Auto Trigger:** Reviewer scores the assessment
- **Database Field:** `assessment_score` (integer 0-100)
- **How to Trigger:** 
  - Recruiter reviews submission
  - Assigns score and provides feedback
  - Marks assessment as complete

**SQL Example:**
```sql
UPDATE candidates 
SET assessment_score = 85,
    candidate_substage = 'assessment_completed'
WHERE id = '<candidate_id>';
```

---

## Substage Movement Logic (Planned)

### How the System Will Know When to Progress

**⚠️ This is the planned implementation logic for future development.**

**Substage 1 → 2:** `assessment_sent` to `assessment_in_progress`
- **Trigger:** Candidate clicks assessment link and starts
- **API Call:** POST `/api/assessment/:token/start` (NOT IMPLEMENTED)
- **Database Indicator:** `assessment_started_at` IS NOT NULL
- **Auto-Set Fields:** 
  - `assessment_started_at = CURRENT_TIMESTAMP`
  - `candidate_substage = 'assessment_in_progress'`
- **Detection Query:**
  ```sql
  SELECT * FROM candidates 
  WHERE candidate_substage = 'assessment_sent'
  AND assessment_started_at IS NOT NULL;
  ```

**Substage 2 → 3:** `assessment_in_progress` to `assessment_submitted`
- **Trigger:** Candidate clicks "Submit Assessment" button
- **API Call:** POST `/api/assessment/:token/submit` (NOT IMPLEMENTED)
- **Database Indicator:** `assessment_submitted_at` IS NOT NULL
- **Auto-Set Fields:** 
  - `assessment_submitted_at = CURRENT_TIMESTAMP`
  - `assessment_responses` (JSONB with all answers)
  - `assessment_time_spent` (calculated)
  - `candidate_substage = 'assessment_submitted'`
- **Detection Query:**
  ```sql
  SELECT * FROM candidates 
  WHERE candidate_substage = 'assessment_in_progress'
  AND assessment_submitted_at IS NOT NULL;
  ```

**Substage 3 → 4:** `assessment_submitted` to `pending_review`
- **Trigger:** AUTOMATIC - Immediately after submission if no auto-grading
- **Database Indicator:** `assessment_submitted_at` IS NOT NULL AND `assessment_score` IS NULL
- **Auto-Set Fields:** 
  - `candidate_substage = 'pending_review'`
- **Detection Query:**
  ```sql
  SELECT * FROM candidates 
  WHERE candidate_substage = 'assessment_submitted'
  AND assessment_score IS NULL;
  ```
- **⚠️ Note:** This is an automatic transition - no manual action required

**Substage 4 → 5:** `pending_review` to `assessment_completed`
- **Trigger:** Reviewer/Recruiter grades the assessment
- **API Call:** POST `/api/candidates/:id/assessment/grade` (NOT IMPLEMENTED)
- **Database Indicator:** `assessment_score` IS NOT NULL
- **Auto-Set Fields:** 
  - `assessment_score` (0-100)
  - `assessment_feedback` (optional)
  - `candidate_substage = 'assessment_completed'`
- **Detection Query:**
  ```sql
  SELECT * FROM candidates 
  WHERE candidate_substage = 'pending_review'
  AND assessment_score IS NOT NULL;
  ```

### Planned Auto-Transition Rules
```javascript
// Substage 1: Assessment Sent
if (recruiter_sends_assessment) {
  assessment_sent_at = NOW();
  assessment_link = generateUniqueLink();
  candidate_substage = 'assessment_sent';
}

// Substage 2: Assessment In Progress
if (candidate_clicks_start) {
  assessment_started_at = NOW();
  candidate_substage = 'assessment_in_progress';
}

// Substage 3: Assessment Submitted
if (candidate_submits) {
  assessment_submitted_at = NOW();
  assessment_responses = candidateAnswers;
  candidate_substage = 'assessment_submitted';
  
  // Immediate auto-transition to pending_review
  if (!assessment_score) {
    candidate_substage = 'pending_review';
  }
}

// Substage 4: Pending Review
// Automatic - no action needed
// Just waiting for reviewer

// Substage 5: Assessment Completed
if (reviewer_assigns_score) {
  assessment_score = score;
  assessment_feedback = feedback;
  candidate_substage = 'assessment_completed';
}
```

### Time-Based Checks (Optional Future Enhancement)
```javascript
// Detect abandoned assessments (started but not submitted within time limit)
SELECT * FROM candidates
WHERE candidate_substage = 'assessment_in_progress'
AND assessment_started_at < NOW() - INTERVAL '2 hours'
AND assessment_submitted_at IS NULL;

// Mark as abandoned
UPDATE candidates 
SET candidate_substage = 'assessment_abandoned',
    assessment_abandoned = true
WHERE <conditions_above>;
```

---

## Transition Flow

```
Candidate enters Technical Assessment stage
           ↓
[Recruiter sends assessment]
assessment_sent_at = timestamp
           ↓
Substage 1: assessment_sent (20%)
    ↓ DETECTION: assessment_started_at IS NOT NULL
[Candidate opens assessment link]
assessment_started_at = timestamp
           ↓
Substage 2: assessment_in_progress (40%)
    ↓ DETECTION: assessment_submitted_at IS NOT NULL
[Candidate submits completed assessment]
assessment_submitted_at = timestamp
assessment_responses = JSONB
           ↓
Substage 3: assessment_submitted (60%)
    ↓ DETECTION: AUTOMATIC if assessment_score IS NULL
[Auto-transition - awaiting review]
assessment_score = NULL
           ↓
Substage 4: pending_review (80%)
    ↓ DETECTION: assessment_score IS NOT NULL
[Reviewer grades assessment]
assessment_score assigned
           ↓
Substage 5: assessment_completed (100%)
           ↓
Ready to move to next stage
```

---

## Database Schema

### Planned Assessment Tracking Fields
**⚠️ These fields need to be added in a future migration:**

```sql
-- Assessment lifecycle timestamps
assessment_sent_at       TIMESTAMP  -- When assessment email sent
assessment_started_at    TIMESTAMP  -- When candidate opened assessment
assessment_submitted_at  TIMESTAMP  -- When candidate submitted responses

-- Assessment results
assessment_score         INTEGER    -- Final score (0-100)
assessment_feedback      TEXT       -- Reviewer's comments
assessment_link          VARCHAR    -- Unique assessment URL
assessment_token         VARCHAR    -- Security token for access
assessment_time_limit    INTEGER    -- Time limit in minutes
assessment_time_spent    INTEGER    -- Actual time taken in minutes

-- Assessment metadata
assessment_type          VARCHAR    -- 'coding', 'written', 'multiple_choice'
assessment_difficulty    VARCHAR    -- 'easy', 'medium', 'hard'
assessment_responses     JSONB      -- Store all answers
```

**Migration Status:** Not yet created - these fields do not exist in the database yet.

---

## API Usage (Planned - Not Yet Implemented)

**⚠️ The following API endpoints are proposed designs and have not been implemented yet.**

### 1. Send Assessment
**Endpoint:** `POST /api/candidates/:id/assessment/send` (NOT IMPLEMENTED)

**Request Body:**
```json
{
  "assessmentType": "coding",
  "difficulty": "medium",
  "timeLimit": 90
}
```

**Effect:**
- Generates unique assessment link and token
- Sets `assessment_sent_at = CURRENT_TIMESTAMP`
- Updates `candidate_substage = 'assessment_sent'`
- Sends email with assessment instructions

**Response:**
```json
{
  "success": true,
  "message": "Assessment sent successfully",
  "assessmentLink": "https://assessment-platform.com/test/token123",
  "timeLimit": 90
}
```

---

### 2. Start Assessment (Candidate Action)
**Endpoint:** `POST /api/assessment/:token/start` (NOT IMPLEMENTED)

**Effect:**
- Validates token
- Sets `assessment_started_at = CURRENT_TIMESTAMP`
- Updates `candidate_substage = 'assessment_in_progress'`
- Returns assessment questions

**Response:**
```json
{
  "success": true,
  "questions": [...],
  "timeLimit": 90,
  "startedAt": "2025-11-21T10:00:00Z"
}
```

---

### 3. Submit Assessment (Candidate Action)
**Endpoint:** `POST /api/assessment/:token/submit` (NOT IMPLEMENTED)

**Request Body:**
```json
{
  "responses": [
    { "questionId": 1, "answer": "..." },
    { "questionId": 2, "answer": "..." }
  ],
  "timeSpent": 75
}
```

**Effect:**
- Stores responses in JSONB field
- Sets `assessment_submitted_at = CURRENT_TIMESTAMP`
- Records time spent
- Updates `candidate_substage = 'assessment_submitted'`
- Auto-transitions to `pending_review`

**Response:**
```json
{
  "success": true,
  "message": "Assessment submitted successfully",
  "submittedAt": "2025-11-21T11:15:00Z",
  "timeSpent": 75
}
```

---

### 4. Grade Assessment (Recruiter Action)
**Endpoint:** `POST /api/candidates/:id/assessment/grade` (NOT IMPLEMENTED)

**Request Body:**
```json
{
  "score": 85,
  "feedback": "Strong technical skills, excellent problem-solving approach"
}
```

**Effect:**
- Sets `assessment_score = 85`
- Stores reviewer feedback
- Updates `candidate_substage = 'assessment_completed'`

**Response:**
```json
{
  "success": true,
  "message": "Assessment graded successfully",
  "score": 85,
  "candidate": {
    "id": 1,
    "candidate_substage": "assessment_completed"
  }
}
```

---

## UI Implementation Notes

### Recruiter Dashboard
**Action Buttons:**
1. **"Send Assessment"** 
   - Visible when: `assessment_sent_at` is NULL
   - Opens modal to select assessment type and difficulty
   
2. **"View Submission"**
   - Visible when: Assessment submitted
   - Shows candidate's responses
   
3. **"Grade Assessment"**
   - Visible when: In `pending_review` substage
   - Opens grading interface with score input

### Candidate Portal
**Assessment Interface:**
1. **Pre-Start Screen:**
   - Shows time limit, number of questions
   - Instructions and rules
   - "Start Assessment" button
   
2. **Active Assessment:**
   - Timer countdown display
   - Question navigation
   - Progress indicator
   - "Submit Assessment" button
   
3. **Post-Submission:**
   - Confirmation message
   - Time spent display
   - "Awaiting Review" status

---

## Auto-Transition Logic

### Automatic Progression to Pending Review
```javascript
// After candidate submits assessment
async function onAssessmentSubmit(candidateId, responses) {
  await db.update(candidates)
    .set({
      assessment_submitted_at: new Date(),
      assessment_responses: JSON.stringify(responses),
      candidate_substage: 'assessment_submitted'
    })
    .where(eq(candidates.id, candidateId));
  
  // Auto-transition to pending review if no score
  const candidate = await db.query.candidates.findFirst({
    where: eq(candidates.id, candidateId)
  });
  
  if (!candidate.assessment_score) {
    await db.update(candidates)
      .set({ candidate_substage: 'pending_review' })
      .where(eq(candidates.id, candidateId));
  }
}
```

---

## Testing Example

### Complete Assessment Workflow
```sql
-- 1. Send assessment
UPDATE candidates 
SET assessment_sent_at = CURRENT_TIMESTAMP,
    assessment_link = 'https://assessment-platform.com/test/abc123',
    assessment_type = 'coding',
    assessment_difficulty = 'medium',
    candidate_substage = 'assessment_sent'
WHERE id = 1;

-- 2. Candidate starts
UPDATE candidates 
SET assessment_started_at = CURRENT_TIMESTAMP,
    candidate_substage = 'assessment_in_progress'
WHERE id = 1;

-- 3. Candidate submits
UPDATE candidates 
SET assessment_submitted_at = CURRENT_TIMESTAMP,
    assessment_time_spent = 75,
    assessment_responses = '{"q1": "answer1", "q2": "answer2"}',
    candidate_substage = 'assessment_submitted'
WHERE id = 1;

-- 4. Auto-transition to pending review
UPDATE candidates 
SET candidate_substage = 'pending_review'
WHERE id = 1 AND assessment_score IS NULL;

-- 5. Reviewer grades
UPDATE candidates 
SET assessment_score = 85,
    assessment_feedback = 'Excellent work',
    candidate_substage = 'assessment_completed'
WHERE id = 1;
```

---

## Progress Visualization

**Substage 1 (20%):**
```
[████        ] [            ] [            ] [            ] [            ]
Assessment Sent
```

**Substage 5 (100%):**
```
[████████████] [████████████] [████████████] [████████████] [████████████]
Assessment Completed
```

---

## Key Points

✅ **5 substages** for complete assessment tracking
✅ **Automatic progression** from submitted → pending review
✅ **Time tracking** for assessment duration
✅ **JSONB storage** for flexible response formats
✅ **Token-based security** for assessment access
✅ **Multiple assessment types** supported (coding, written, MCQ)

---

## Integration Options

### 1. **HackerRank Integration**
```javascript
// Send candidate to HackerRank
const hackerRankLink = await createHackerRankTest({
  candidateEmail: candidate.email,
  testType: 'coding',
  difficulty: 'medium'
});

await db.update(candidates).set({
  assessment_link: hackerRankLink,
  assessment_sent_at: new Date(),
  candidate_substage: 'assessment_sent'
});
```

### 2. **Codility Integration**
```javascript
// Use Codility API
const codilityTest = await codility.createTest({
  candidateEmail: candidate.email,
  duration: 90,
  questions: ['algorithm', 'data-structures']
});
```

### 3. **Custom Assessment Platform**
```javascript
// Use internal assessment system
const customTest = await internalAPI.generateTest({
  difficulty: 'hard',
  topics: ['javascript', 'react', 'node.js']
});
```

---

## Future Enhancements

### 1. Auto-Grading for MCQ
```sql
-- Add auto-grading capability
ALTER TABLE candidates ADD COLUMN assessment_auto_graded BOOLEAN DEFAULT false;
ALTER TABLE candidates ADD COLUMN assessment_manual_review_required BOOLEAN DEFAULT false;
```

### 2. Proctoring Integration
```sql
-- Track proctoring data
ALTER TABLE candidates ADD COLUMN assessment_proctored BOOLEAN DEFAULT false;
ALTER TABLE candidates ADD COLUMN assessment_violations INTEGER DEFAULT 0;
ALTER TABLE candidates ADD COLUMN assessment_proctoring_report JSONB;
```

### 3. Adaptive Difficulty
```javascript
// Adjust difficulty based on performance
if (currentScore > 80) {
  nextQuestionDifficulty = 'hard';
} else if (currentScore < 50) {
  nextQuestionDifficulty = 'easy';
}
```

---

## Related Documentation

- [Complete Substage Transition Guide](./SUBSTAGE_TRANSITION_GUIDE.md)
- [AI Interview Substages](./AI_INTERVIEW_SUBSTAGES.md)
- [Human Interview Substages](./HUMAN_INTERVIEW_SUBSTAGES.md)
- [Client Endorsement Substages](./CLIENT_ENDORSEMENT_SUBSTAGES.md)

---

**Last Updated**: November 21, 2025  
**Version**: 1.0 (Foundation for assessment workflow)
