import { query } from '../db.js';
import { getNextSubstage } from '../substage-definitions.js';

export class AutoTransitionService {
  
  async checkAndTransitionAll() {
    console.log('[AutoTransition] Starting auto-transition check for all stages...');
    
    const results = {
      screening: await this.checkScreeningTransitions(),
      shortlist: await this.checkShortlistTransitions(),
      technicalAssessment: await this.checkTechnicalAssessmentTransitions(),
      humanInterview: await this.checkHumanInterviewTransitions(),
      finalInterview: await this.checkFinalInterviewTransitions(),
      aiInterview: await this.checkAIInterviewTransitions(),
      offer: await this.checkOfferTransitions(),
      clientEndorsement: await this.checkClientEndorsementTransitions(),
      offerAccepted: await this.checkOfferAcceptedTransitions()
    };
    
    const totalTransitions = Object.values(results).reduce((sum, count) => sum + count, 0);
    console.log(`[AutoTransition] Completed. Total transitions: ${totalTransitions}`);
    
    return results;
  }

  async checkScreeningTransitions() {
    let transitionCount = 0;

    const candidates = await query(
      `SELECT c.id, c.candidate_substage, c.resume_url, c.phone, c.updated_at,
              COALESCE(
                (SELECT changed_at FROM candidate_stage_history 
                 WHERE candidate_id = c.id AND new_stage = 'Screening' 
                 ORDER BY changed_at DESC LIMIT 1),
                c.created_at
              ) as stage_entry_time
       FROM candidates c
       WHERE c.current_stage = 'Screening'`
    );

    for (const candidate of candidates.rows) {
      const oldSubstage = candidate.candidate_substage;
      let newSubstage = oldSubstage;
      
      const now = new Date();
      const updatedAt = new Date(candidate.updated_at);
      const stageEntryTime = new Date(candidate.stage_entry_time);
      const hoursSinceUpdate = (now - updatedAt) / (1000 * 60 * 60);
      const daysSinceStageEntry = (now - stageEntryTime) / (1000 * 60 * 60 * 24);

      if (!oldSubstage || oldSubstage === 'application_received') {
        if (candidate.resume_url) {
          newSubstage = 'resume_review';
        }
      }
      
      else if (oldSubstage === 'resume_review') {
        if (hoursSinceUpdate >= 24) {
          newSubstage = 'initial_assessment';
        }
      }
      
      else if (oldSubstage === 'initial_assessment') {
        if (daysSinceStageEntry >= 2) {
          newSubstage = 'phone_screen_scheduled';
        }
      }
      
      else if (oldSubstage === 'phone_screen_scheduled') {
        if (daysSinceStageEntry >= 3) {
          newSubstage = 'phone_screen_completed';
        }
      }

      if (newSubstage !== oldSubstage) {
        await this.updateSubstage(candidate.id, newSubstage, 'Screening');
        transitionCount++;
      }
    }

    return transitionCount;
  }

  async checkShortlistTransitions() {
    let transitionCount = 0;

    const candidates = await query(
      `SELECT c.id, c.candidate_substage, c.updated_at,
              COUNT(DISTINCT cs.id) as stage_changes
       FROM candidates c
       LEFT JOIN candidate_stage_history cs ON cs.candidate_id = c.id AND cs.new_stage = 'Shortlist'
       WHERE c.current_stage = 'Shortlist'
       GROUP BY c.id, c.candidate_substage, c.updated_at`
    );

    for (const candidate of candidates.rows) {
      const oldSubstage = candidate.candidate_substage;
      let newSubstage = oldSubstage;

      if (!oldSubstage || oldSubstage === 'under_review') {
        const age = new Date() - new Date(candidate.updated_at);
        const hoursSinceUpdate = age / (1000 * 60 * 60);
        
        if (hoursSinceUpdate >= 48) {
          newSubstage = 'pending_interview';
        }
      }

      if (newSubstage !== oldSubstage) {
        await this.updateSubstage(candidate.id, newSubstage, 'Shortlist');
        transitionCount++;
      }
    }

    return transitionCount;
  }

  async checkTechnicalAssessmentTransitions() {
    let transitionCount = 0;

    try {
      const candidates = await query(
        `SELECT id, candidate_substage, 
                assessment_sent_at, assessment_started_at, 
                assessment_submitted_at, assessment_score
         FROM candidates 
         WHERE current_stage = 'Technical Assessment'`
      );

      for (const candidate of candidates.rows) {
        const oldSubstage = candidate.candidate_substage;
        let newSubstage = oldSubstage;

        if (oldSubstage === 'assessment_sent' && candidate.assessment_started_at) {
          newSubstage = 'assessment_in_progress';
        }
        
        else if (oldSubstage === 'assessment_in_progress' && candidate.assessment_submitted_at) {
          newSubstage = 'assessment_submitted';
        }
        
        else if (oldSubstage === 'assessment_submitted' && candidate.assessment_submitted_at && !candidate.assessment_score) {
          newSubstage = 'pending_review';
        }
        
        else if (oldSubstage === 'pending_review' && candidate.assessment_score !== null) {
          newSubstage = 'assessment_completed';
        }

        if (newSubstage !== oldSubstage) {
          await this.updateSubstage(candidate.id, newSubstage, 'Technical Assessment');
          transitionCount++;
        }
      }
    } catch (error) {
      if (error.message && error.message.includes('does not exist')) {
        console.log('[AutoTransition] Technical Assessment: Database fields not yet implemented, skipping...');
        return 0;
      }
      throw error;
    }

    return transitionCount;
  }

  async checkHumanInterviewTransitions() {
    let transitionCount = 0;

    const candidates = await query(
      `SELECT c.id, c.candidate_substage,
              c.interviewer_name, c.selected_slot_id, c.meeting_link,
              c.interview_completed_at, c.interview_feedback, c.interview_notes,
              s.start_time, s.end_time
       FROM candidates c
       LEFT JOIN interview_slots s ON c.selected_slot_id = s.id
       WHERE c.current_stage = 'Human Interview'`
    );

    for (const candidate of candidates.rows) {
      const oldSubstage = candidate.candidate_substage;
      let newSubstage = oldSubstage;

      if (oldSubstage === 'interviewer_assigned' && candidate.selected_slot_id && candidate.meeting_link) {
        newSubstage = 'interview_scheduled';
      }
      
      else if (oldSubstage === 'interview_scheduled' && candidate.start_time) {
        const now = new Date();
        const startTime = new Date(candidate.start_time);
        const endTime = new Date(candidate.end_time);
        
        if (now >= startTime && now <= endTime) {
          newSubstage = 'interview_in_progress';
        }
      }
      
      else if (oldSubstage === 'interview_in_progress' && candidate.interview_completed_at) {
        newSubstage = 'interview_completed';
      }
      
      else if (oldSubstage === 'interview_completed' && (candidate.interview_feedback || candidate.interview_notes)) {
        newSubstage = 'feedback_submitted';
      }

      if (newSubstage !== oldSubstage) {
        await this.updateSubstage(candidate.id, newSubstage, 'Human Interview');
        transitionCount++;
      }
    }

    return transitionCount;
  }

  async checkFinalInterviewTransitions() {
    let transitionCount = 0;

    const candidates = await query(
      `SELECT c.id, c.candidate_substage, c.updated_at,
              c.interview_scheduled_at, c.interview_completed_at
       FROM candidates c
       WHERE c.current_stage = 'Final Interview'`
    );

    for (const candidate of candidates.rows) {
      const oldSubstage = candidate.candidate_substage;
      let newSubstage = oldSubstage;

      if (oldSubstage === 'interview_prep') {
        const age = new Date() - new Date(candidate.updated_at);
        const hoursSinceUpdate = age / (1000 * 60 * 60);
        
        if (hoursSinceUpdate >= 24) {
          newSubstage = 'interview_scheduled';
        }
      }
      
      else if (oldSubstage === 'interview_scheduled' && candidate.interview_scheduled_at) {
        const now = new Date();
        const scheduledTime = new Date(candidate.interview_scheduled_at);
        
        const timeDiff = scheduledTime - now;
        const minutesUntil = timeDiff / (1000 * 60);
        
        if (minutesUntil <= 15 && minutesUntil >= -120) {
          newSubstage = 'interview_in_progress';
        }
      }
      
      else if (oldSubstage === 'interview_in_progress' && candidate.interview_completed_at) {
        newSubstage = 'interview_completed';
      }
      
      else if (oldSubstage === 'interview_completed') {
        const age = new Date() - new Date(candidate.interview_completed_at || candidate.updated_at);
        const hoursSinceCompletion = age / (1000 * 60 * 60);
        
        if (hoursSinceCompletion >= 1) {
          newSubstage = 'decision_pending';
        }
      }

      if (newSubstage !== oldSubstage) {
        await this.updateSubstage(candidate.id, newSubstage, 'Final Interview');
        transitionCount++;
      }
    }

    return transitionCount;
  }

  async checkAIInterviewTransitions() {
    let transitionCount = 0;

    const candidates = await query(
      `SELECT id, candidate_substage, current_stage,
              ai_interview_link_sent_at, ai_interview_started_at,
              ai_interview_completed_at, ai_analysis_status
       FROM candidates 
       WHERE current_stage IN ('AI Interview', 'Ai Interview')`
    );

    for (const candidate of candidates.rows) {
      const oldSubstage = candidate.candidate_substage;
      let newSubstage = oldSubstage;

      if (oldSubstage === 'ai_interview_sent' && candidate.ai_interview_started_at) {
        newSubstage = 'ai_interview_started';
      }
      
      else if (oldSubstage === 'ai_interview_started' && candidate.ai_interview_completed_at) {
        newSubstage = 'ai_interview_completed';
      }
      
      else if (oldSubstage === 'ai_interview_completed' && candidate.ai_analysis_status === 'processing') {
        newSubstage = 'ai_analysis_in_progress';
      }
      
      else if (oldSubstage === 'ai_analysis_in_progress' && candidate.ai_analysis_status === 'completed') {
        newSubstage = 'ai_results_ready';
      }

      if (newSubstage !== oldSubstage) {
        await this.updateSubstage(candidate.id, newSubstage, candidate.current_stage);
        transitionCount++;
      }
    }

    return transitionCount;
  }

  async checkOfferTransitions() {
    let transitionCount = 0;

    const candidates = await query(
      `SELECT id, candidate_substage, updated_at
       FROM candidates 
       WHERE current_stage = 'Offer'`
    );

    for (const candidate of candidates.rows) {
      const oldSubstage = candidate.candidate_substage;
      let newSubstage = oldSubstage;
      
      const age = new Date() - new Date(candidate.updated_at);
      const hoursSinceUpdate = age / (1000 * 60 * 60);

      if (oldSubstage === 'offer_preparation' && hoursSinceUpdate >= 12) {
        newSubstage = 'offer_approval';
      }
      
      else if (oldSubstage === 'offer_approval' && hoursSinceUpdate >= 24) {
        newSubstage = 'offer_sent';
      }
      
      else if (oldSubstage === 'offer_sent' && hoursSinceUpdate >= 48) {
        newSubstage = 'candidate_reviewing';
      }

      if (newSubstage !== oldSubstage) {
        await this.updateSubstage(candidate.id, newSubstage, 'Offer');
        transitionCount++;
      }
    }

    return transitionCount;
  }

  async checkClientEndorsementTransitions() {
    let transitionCount = 0;

    const candidates = await query(
      `SELECT id, candidate_substage, submitted_to_client_at, client_viewed_at
       FROM candidates 
       WHERE current_stage = 'Client Endorsement'`
    );

    for (const candidate of candidates.rows) {
      const oldSubstage = candidate.candidate_substage;
      let newSubstage = oldSubstage;

      if (!oldSubstage || oldSubstage === 'client_review_pending') {
        if (candidate.client_viewed_at) {
          newSubstage = 'client_reviewing';
        }
      }

      if (newSubstage !== oldSubstage) {
        await this.updateSubstage(candidate.id, newSubstage, 'Client Endorsement');
        transitionCount++;
      }
    }

    return transitionCount;
  }

  async checkOfferAcceptedTransitions() {
    let transitionCount = 0;

    const candidates = await query(
      `SELECT c.id, c.candidate_substage, c.updated_at,
              COALESCE(
                (SELECT changed_at FROM candidate_stage_history 
                 WHERE candidate_id = c.id AND new_stage = 'Offer Accepted' 
                 ORDER BY changed_at DESC LIMIT 1),
                c.created_at
              ) as stage_entry_time
       FROM candidates c
       WHERE c.current_stage = 'Offer Accepted'`
    );

    for (const candidate of candidates.rows) {
      const oldSubstage = candidate.candidate_substage;
      let newSubstage = oldSubstage;
      
      const now = new Date();
      const updatedAt = new Date(candidate.updated_at);
      const stageEntryTime = new Date(candidate.stage_entry_time);
      const daysSinceUpdate = (now - updatedAt) / (1000 * 60 * 60 * 24);
      const daysSinceStageEntry = (now - stageEntryTime) / (1000 * 60 * 60 * 24);

      if (!oldSubstage || oldSubstage === 'offer_accepted') {
        if (daysSinceUpdate >= 1) {
          newSubstage = 'background_check';
        }
      }
      
      else if (oldSubstage === 'background_check') {
        if (daysSinceStageEntry >= 4) {
          newSubstage = 'documentation';
        }
      }
      
      else if (oldSubstage === 'documentation') {
        if (daysSinceStageEntry >= 6) {
          newSubstage = 'onboarding_prep';
        }
      }
      
      else if (oldSubstage === 'onboarding_prep') {
        if (daysSinceStageEntry >= 11) {
          newSubstage = 'ready_to_start';
        }
      }

      if (newSubstage !== oldSubstage) {
        await this.updateSubstage(candidate.id, newSubstage, 'Offer Accepted');
        transitionCount++;
      }
    }

    return transitionCount;
  }

  async updateSubstage(candidateId, newSubstage, stageName) {
    try {
      await query(
        `UPDATE candidates 
         SET candidate_substage = $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [newSubstage, candidateId]
      );
      
      console.log(`[AutoTransition] ${stageName}: Candidate ${candidateId} → ${newSubstage}`);
      
      return true;
    } catch (error) {
      console.error(`[AutoTransition] Error updating substage for ${candidateId}:`, error);
      return false;
    }
  }

  async checkTimeBasedTransitions() {
    console.log('[AutoTransition] Running time-based transition checks...');
    
    await this.checkInterviewTimeTransitions();
    await this.checkStaleSubstageTransitions();
    
    return true;
  }

  async checkInterviewTimeTransitions() {
    const result = await query(
      `UPDATE candidates c
       SET candidate_substage = 'interview_in_progress',
           updated_at = CURRENT_TIMESTAMP
       FROM interview_slots s
       WHERE c.selected_slot_id = s.id
       AND c.current_stage = 'Human Interview'
       AND c.candidate_substage = 'interview_scheduled'
       AND s.start_time <= CURRENT_TIMESTAMP
       AND s.end_time > CURRENT_TIMESTAMP
       RETURNING c.id`
    );
    
    if (result.rows.length > 0) {
      console.log(`[AutoTransition] Auto-started ${result.rows.length} interviews based on time`);
    }
    
    return result.rows.length;
  }

  async checkStaleSubstageTransitions() {
    const staleThreshold = 7;
    
    const result = await query(
      `SELECT id, current_stage, candidate_substage, updated_at
       FROM candidates
       WHERE updated_at < CURRENT_TIMESTAMP - INTERVAL '${staleThreshold} days'
       AND candidate_substage IS NOT NULL
       AND status = 'active'
       ORDER BY updated_at ASC
       LIMIT 100`
    );
    
    if (result.rows.length > 0) {
      console.log(`[AutoTransition] Found ${result.rows.length} candidates with stale substages (>${staleThreshold} days old)`);
    }
    
    return result.rows;
  }
}

export const autoTransitionService = new AutoTransitionService();
