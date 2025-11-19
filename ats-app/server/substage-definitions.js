// Static substage definitions for each stage type
// These are read-only progression markers within stages

export const STAGE_SUBSTAGES = {
  'Screening': [
    { id: 'application_received', label: 'Application Received', order: 1 },
    { id: 'resume_review', label: 'Resume Review', order: 2 },
    { id: 'initial_assessment', label: 'Initial Assessment', order: 3 },
    { id: 'phone_screen_scheduled', label: 'Phone Screen Scheduled', order: 4 },
    { id: 'phone_screen_completed', label: 'Phone Screen Completed', order: 5 }
  ],
  
  'Shortlist': [
    { id: 'under_review', label: 'Under Review', order: 1 },
    { id: 'pending_interview', label: 'Pending Interview', order: 2 },
    { id: 'interview_scheduled', label: 'Interview Scheduled', order: 3 },
    { id: 'interview_completed', label: 'Interview Completed', order: 4 },
    { id: 'awaiting_feedback', label: 'Awaiting Feedback', order: 5 }
  ],
  
  'Technical Assessment': [
    { id: 'assessment_sent', label: 'Assessment Sent', order: 1 },
    { id: 'assessment_in_progress', label: 'Assessment In Progress', order: 2 },
    { id: 'assessment_submitted', label: 'Assessment Submitted', order: 3 },
    { id: 'pending_review', label: 'Pending Assessment Review', order: 4 },
    { id: 'assessment_completed', label: 'Assessment Completed', order: 5 }
  ],
  
  'Human Interview': [
    { id: 'interviewer_assigned', label: 'Interviewer Assigned', order: 1 },
    { id: 'interview_scheduled', label: 'Interview Scheduled', order: 2 },
    { id: 'interview_in_progress', label: 'Interview In Progress', order: 3 },
    { id: 'interview_completed', label: 'Interview Completed', order: 4 },
    { id: 'feedback_submitted', label: 'Feedback Submitted', order: 5 }
  ],
  
  'Final Interview': [
    { id: 'interview_prep', label: 'Interview Preparation', order: 1 },
    { id: 'interview_scheduled', label: 'Interview Scheduled', order: 2 },
    { id: 'interview_in_progress', label: 'Interview In Progress', order: 3 },
    { id: 'interview_completed', label: 'Interview Completed', order: 4 },
    { id: 'decision_pending', label: 'Decision Pending', order: 5 }
  ],
  
  'AI Interview': [
    { id: 'ai_interview_sent', label: 'AI Interview Sent', order: 1 },
    { id: 'ai_interview_started', label: 'AI Interview Started', order: 2 },
    { id: 'ai_interview_completed', label: 'AI Interview Completed', order: 3 },
    { id: 'ai_analysis_in_progress', label: 'AI Analysis In Progress', order: 4 },
    { id: 'ai_results_ready', label: 'AI Results Ready', order: 5 }
  ],
  
  'Offer': [
    { id: 'offer_preparation', label: 'Offer Preparation', order: 1 },
    { id: 'offer_approval', label: 'Offer Approval', order: 2 },
    { id: 'offer_sent', label: 'Offer Sent', order: 3 },
    { id: 'candidate_reviewing', label: 'Candidate Reviewing Offer', order: 4 },
    { id: 'negotiation', label: 'Negotiation', order: 5 }
  ]
};

// Get substages for a specific stage
export function getSubstagesForStage(stageName) {
  return STAGE_SUBSTAGES[stageName] || [];
}

// Validate if substage exists for a given stage
export function isValidSubstage(stageName, substageId) {
  const substages = getSubstagesForStage(stageName);
  return substages.some(s => s.id === substageId);
}

// Get next substage in sequence
export function getNextSubstage(stageName, currentSubstageId) {
  const substages = getSubstagesForStage(stageName);
  const currentIndex = substages.findIndex(s => s.id === currentSubstageId);
  
  if (currentIndex >= 0 && currentIndex < substages.length - 1) {
    return substages[currentIndex + 1];
  }
  
  return null;
}
