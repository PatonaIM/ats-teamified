# Story 5.6: Sentiment Analysis & Candidate Engagement Intelligence **[MVP Priority - FR16.1 Simplified]**

**Epic:** [Epic 5 - Candidate Experience & Notification Platform](../epics/epic-5-candidate-experience-notification.md)  
**Story ID:** 5.6  
**Priority:** Phase 1 - MVP (Simplified), Phase 2 (Full ML)  
**Estimate:** 1 week (MVP), 3 weeks (Phase 2)

---

## User Story

**As a** recruiter or hiring manager,  
**I want** real-time sentiment analysis monitoring candidate engagement levels throughout the hiring pipeline,  
**so that** I can proactively identify and respond to declining candidate interest before losing top talent to competing offers.

---

## Acceptance Criteria

1. ⏸️ Communication pattern analysis implemented tracking email response time trends (baseline vs current), NLP-based tone sentiment scoring (enthusiastic, neutral, formal, declining), message length pattern analysis, and question-asking behavior monitoring as specified in FR16.1 **[Phase 2: NLP; MVP: Response time only]**
2. ⏸️ Candidate portal activity monitoring implemented tracking login frequency, session duration, page interaction depth, assessment engagement patterns, and document upload timeliness with abnormal activity detection and alerting **[Phase 2 - Requires portal]**
3. ✅ Real-time engagement scoring system (0-100) implemented with weighted calculation using response time trends (30%), communication sentiment (25%), portal activity (20%), assessment engagement (15%), and interview interaction (10%) with configurable threshold levels as defined in FR16.1 **[MVP: Simplified using email response time only]**
4. ✅ Proactive alert system implemented with automatic notifications when engagement scores drop below 70 (warning level) or 50 (critical level), recruiter dashboard alerts, recommended intervention actions, and escalation to hiring managers for high-priority candidates **[MVP: Manual alerts]**
5. ⏸️ Competing offer detection implemented using pattern recognition for formality increases in communications, delayed decision-making at offer stage, increased questions about timeline flexibility, references to "other opportunities", and negotiation intensity above role/level baseline **[Phase 2 - Requires NLP]**
6. ✅ Recruiter dashboard integration implemented with real-time candidate health widgets showing color-coded risk levels (green/yellow/red), 30-day engagement trend visualizations with line charts, predictive offer acceptance indicators, and time-to-action recommendations based on urgency **[MVP: Basic risk indicators]**
7. ⏸️ Interview interaction metrics implemented tracking scheduling response time, rescheduling pattern frequency as red flag indicators, pre-interview engagement with preparation materials, and post-interview follow-up communication quality **[Phase 2]**
8. ⏸️ Automated intervention trigger system implemented with score-based actions: engagement <70 alerts recruiter, <50 escalates to hiring manager + expedites process, rescheduling detected triggers personal outreach, portal inactivity >3 days initiates re-engagement campaigns **[Phase 2]**
9. ⏸️ Engagement trend analytics implemented with historical pattern comparison, candidate cohort benchmarking, stage-specific engagement baseline establishment, and declining engagement early warning detection **[Phase 2]**
10. ⏸️ AI/ML integration implemented using OpenAI/Anthropic NLP for email sentiment analysis, time-series pattern recognition for engagement trend detection, behavioral modeling using historical successful vs unsuccessful hire data, and predictive analytics for offer acceptance likelihood as detailed in FR16.3 **[Phase 2]**
11. ✅ Privacy and compliance controls implemented with GDPR-compliant data processing requiring candidate consent, anonymized aggregate data for ML pattern learning, transparent scoring methodology disclosure to candidates, and opt-out capabilities for minimal tracking preferences **[MVP: Basic consent]**
12. ⏸️ Performance optimization implemented targeting API response times <2 seconds for real-time analysis, batch processing for non-urgent analysis within 30 minutes, 80%+ accuracy for engagement risk prediction, and cost management estimated at $0.10-0.50 per candidate as specified in FR16.3 **[Phase 2]**

---

## MVP Implementation Focus

### ✅ Essential for MVP (Criteria 1, 3-4, 6, 11)
- **Email response time tracking:** Measure time between recruiter email and candidate reply
- **Simple engagement scoring:** 0-100 score based ONLY on email response frequency/timing
- **Manual recruiter alerts:** Dashboard shows low-scoring candidates (yellow/red flags)
- **Basic risk indicators:** Color-coded candidate health (green/yellow/red)
- **GDPR compliance:** Basic consent and data processing policies

### ⏸️ Phase 2 Enhancement (Criteria 2, 5, 7-10, 12)
- **Portal activity monitoring:** Requires candidate portal deployment
- **NLP sentiment analysis:** AI-powered email tone analysis
- **Competing offer detection:** Pattern recognition requiring historical data
- **Interview metrics:** Scheduling behavior analysis
- **Automated interventions:** ML-powered proactive actions
- **ML integration:** OpenAI/Anthropic for advanced sentiment, predictive analytics
- **Performance optimization:** Real-time AI analysis at scale

### Realistic MVP Baseline
```
✅ What MVP Delivers:
- Track email response times for all candidates
- Calculate simple engagement score (fast response = high score)
- Dashboard shows candidates with declining response patterns
- Recruiters manually review and decide interventions

❌ What MVP Defers:
- NLP analysis of email sentiment/tone
- Portal activity tracking (no portal yet)
- Competing offer detection (no ML models)
- Automated intervention triggers
- Predictive analytics (requires 50-100 completed hires)
```

---

## Technical Dependencies

**MVP:**
- NestJS engagement tracking service
- PostgreSQL tables: candidate_communications, engagement_scores
- Email parsing for response time calculation
- Basic scoring algorithm (rule-based)

**Phase 2:**
- OpenAI/Anthropic for NLP sentiment analysis
- ML libraries (scikit-learn) for pattern recognition
- Time-series analysis for trend detection
- Candidate portal activity data

---

## MVP Engagement Scoring Algorithm

```typescript
// Simple rule-based scoring (MVP)
function calculateEngagementScore(candidateId: string): number {
  const emails = getRecentEmails(candidateId, days: 30);
  
  let score = 100; // Start at 100
  
  // Deduct points for slow/no responses
  emails.forEach(email => {
    const responseTime = email.responseTimeHours;
    
    if (responseTime === null) {
      score -= 15; // No response
    } else if (responseTime > 48) {
      score -= 10; // Very slow (>2 days)
    } else if (responseTime > 24) {
      score -= 5; // Slow (>1 day)
    }
    // Fast responses (< 24h) maintain score
  });
  
  // Floor at 0
  return Math.max(0, score);
}

// Alert thresholds
if (score < 70) {
  createAlert('warning', candidateId);
}
if (score < 50) {
  createAlert('critical', candidateId);
  escalateToManager(candidateId);
}
```

---

## Phase 2: NLP Sentiment Analysis

```typescript
// Email sentiment analysis (Phase 2)
async function analyzeEmailSentiment(emailText: string): Promise<SentimentScore> {
  const prompt = `
    Analyze the sentiment and engagement level of this candidate email.
    Rate on scale 0-100 for:
    - Enthusiasm
    - Professionalism
    - Interest level
    
    Email: "${emailText}"
  `;
  
  const analysis = await callLLM(prompt); // GPT-4/Claude
  
  return {
    enthusiasm: analysis.enthusiasm,
    professionalism: analysis.professionalism,
    interest: analysis.interest,
    overallSentiment: (analysis.enthusiasm + analysis.interest) / 2
  };
}
```

---

## Recruiter Dashboard (MVP)

```
┌────────────────────────────────────────────┐
│ Candidate Engagement Health                │
├────────────────────────────────────────────┤
│ 🔴 Critical Risk (3 candidates)            │
│   • John Doe - Score: 42                   │
│     Last response: 5 days ago              │
│   • Jane Smith - Score: 38                 │
│     No response to last 3 emails           │
│                                            │
│ 🟡 Warning (8 candidates)                  │
│   • Mike Jones - Score: 65                 │
│     Response time increasing               │
│   • Sarah Lee - Score: 68                  │
│     2 days since last response             │
│                                            │
│ 🟢 Healthy (24 candidates)                 │
│                                            │
│ [View Details] [Export Report]             │
└────────────────────────────────────────────┘
```

---

## Database Schema

```typescript
Table: candidate_communications
- id (UUID, PK)
- candidate_id (UUID, FK)
- job_id (UUID, FK)
- communication_type (ENUM: email, portal_message, sms)
- sent_at (TIMESTAMP)
- responded_at (TIMESTAMP, nullable)
- response_time_hours (DECIMAL, nullable, computed)
- sentiment_score (DECIMAL, nullable) // Phase 2
- created_at (TIMESTAMP)

Table: engagement_scores
- id (UUID, PK)
- candidate_id (UUID, FK)
- job_id (UUID, FK)
- score (DECIMAL) // 0-100
- score_components (JSONB) // Breakdown by factor
- calculated_at (TIMESTAMP)
- alert_level (ENUM: none, warning, critical)

Table: engagement_alerts
- id (UUID, PK)
- candidate_id (UUID, FK)
- alert_level (ENUM: warning, critical)
- reason (TEXT)
- created_at (TIMESTAMP)
- acknowledged_by_user_id (UUID, FK, nullable)
- acknowledged_at (TIMESTAMP, nullable)
```

---

## Related Requirements

- FR16.1: Sentiment Analysis & Candidate Engagement Intelligence [MVP - Simplified]
- FR16.3: AI Integration Technical Specifications
- FR12: Multi-Channel Notifications (alerts)

---

## Notes

- **MVP Critical:** Engagement tracking is a key AI differentiator
- **MVP Scope:** Email response time tracking ONLY (no NLP, no portal)
- **Data Bootstrap:** MVP collects email engagement data for Phase 2 ML
- **Phase 2 ML:** Add NLP sentiment analysis after 50-100 completed hires
- **Manual Intervention:** MVP alerts recruiters, they decide actions
- **Cost Target:** $0.10-0.50 per candidate (Phase 2 ML costs)
