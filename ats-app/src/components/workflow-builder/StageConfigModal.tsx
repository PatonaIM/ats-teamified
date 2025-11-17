import { useState, useEffect } from 'react';

interface PipelineStage {
  id: number;
  jobId: number;
  stageName: string;
  stageOrder: number;
  isDefault: boolean;
  config: Record<string, any>;
  createdAt: string;
}

interface StageConfigModalProps {
  stage: PipelineStage;
  onClose: () => void;
  onSave: (config: Record<string, any>) => void;
}

type StageCategory = 'ai-interview' | 'human-interview' | 'assessment' | 'general';

function determineStageCategory(stage: PipelineStage): StageCategory {
  const stageName = stage.stageName.toLowerCase();
  const config = stage.config || {};
  
  // Check if explicitly configured as AI interview
  if (config.interviewType === 'ai') {
    return 'ai-interview';
  }
  
  // Check for assessment-type stages
  if (
    stageName.includes('test') ||
    stageName.includes('assessment') ||
    stageName.includes('background check') ||
    stageName.includes('reference check') ||
    config.assessmentType && config.assessmentType !== 'none'
  ) {
    return 'assessment';
  }
  
  // Check for interview-type stages
  if (
    stageName.includes('interview') ||
    stageName.includes('screen') ||
    stageName.includes('culture fit') ||
    stageName.includes('panel')
  ) {
    return 'human-interview';
  }
  
  return 'general';
}

export function StageConfigModal({ stage, onClose, onSave }: StageConfigModalProps) {
  const [config, setConfig] = useState<Record<string, any>>(stage.config || {});
  const [saving, setSaving] = useState<boolean>(false);
  const stageCategory = determineStageCategory(stage);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(config);
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (key: string, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Configure Stage: {stage.stageName}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {stageCategory === 'ai-interview' && 'AI-powered interview configuration'}
              {stageCategory === 'human-interview' && 'Human interview settings'}
              {stageCategory === 'assessment' && 'Assessment and testing configuration'}
              {stageCategory === 'general' && 'Customize settings for this pipeline stage'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
          {/* AI Interview Configuration */}
          {stageCategory === 'ai-interview' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="text-2xl">🤖</span>
                AI Interview Configuration
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  AI Model
                </label>
                <select
                  value={config.aiModel || 'gpt-4'}
                  onChange={(e) => updateConfig('aiModel', e.target.value)}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                >
                  <option value="gpt-4">GPT-4 (Advanced)</option>
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Fast)</option>
                  <option value="claude-3">Claude 3 (Opus)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Interview Duration (minutes)
                </label>
                <input
                  type="number"
                  min="15"
                  max="120"
                  step="15"
                  value={config.aiInterviewDuration || 45}
                  onChange={(e) => updateConfig('aiInterviewDuration', parseInt(e.target.value))}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Number of Questions
                </label>
                <input
                  type="number"
                  min="5"
                  max="30"
                  value={config.aiQuestionCount || 15}
                  onChange={(e) => updateConfig('aiQuestionCount', parseInt(e.target.value))}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Question Categories
                </label>
                <div className="space-y-2">
                  {['Technical', 'Behavioral', 'Cultural Fit', 'Situational'].map((category) => (
                    <div key={category} className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={config.aiCategories?.[category] || false}
                        onChange={(e) => updateConfig('aiCategories', { 
                          ...config.aiCategories, 
                          [category]: e.target.checked 
                        })}
                        className="w-4 h-4 text-purple-600 rounded"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{category}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sentiment Analysis
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={config.aiSentimentAnalysis || false}
                    onChange={(e) => updateConfig('aiSentimentAnalysis', e.target.checked)}
                    className="w-4 h-4 text-purple-600 rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Enable real-time sentiment analysis during interview
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  AI Evaluation Criteria
                </label>
                <textarea
                  value={config.aiEvaluationCriteria || ''}
                  onChange={(e) => updateConfig('aiEvaluationCriteria', e.target.value)}
                  placeholder="Enter criteria for AI to evaluate responses (e.g., technical depth, clarity, problem-solving approach)"
                  rows={3}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                />
              </div>
            </div>
          )}

          {/* Human Interview Configuration */}
          {stageCategory === 'human-interview' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="text-2xl">👤</span>
                Interview Configuration
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Interview Mode
                </label>
                <select
                  value={config.interviewMode || 'phone'}
                  onChange={(e) => updateConfig('interviewMode', e.target.value)}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                >
                  <option value="phone">Phone Screening</option>
                  <option value="video">Video Interview</option>
                  <option value="onsite">On-site Interview</option>
                  <option value="panel">Panel Interview</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Interview Duration (minutes)
                </label>
                <input
                  type="number"
                  min="15"
                  max="480"
                  step="15"
                  value={config.interviewDuration || 60}
                  onChange={(e) => updateConfig('interviewDuration', parseInt(e.target.value))}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Interview Template
                </label>
                <select
                  value={config.interviewTemplate || 'standard'}
                  onChange={(e) => updateConfig('interviewTemplate', e.target.value)}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                >
                  <option value="standard">Standard Interview</option>
                  <option value="technical-deep-dive">Technical Deep Dive</option>
                  <option value="behavioral-focus">Behavioral Focus</option>
                  <option value="leadership-assessment">Leadership Assessment</option>
                  <option value="culture-fit">Culture Fit Evaluation</option>
                  <option value="custom">Custom Template</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  AI-Assisted Question Generation
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={config.aiInterviewQuestions || false}
                    onChange={(e) => updateConfig('aiInterviewQuestions', e.target.checked)}
                    className="w-4 h-4 text-purple-600 rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Generate AI-powered interview questions
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Evaluation Criteria
                </label>
                <textarea
                  value={config.evaluationCriteria || ''}
                  onChange={(e) => updateConfig('evaluationCriteria', e.target.value)}
                  placeholder="Enter evaluation criteria (e.g., Technical skills, Communication, Cultural fit)"
                  rows={3}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Interviewer Notes Template
                </label>
                <textarea
                  value={config.notesTemplate || ''}
                  onChange={(e) => updateConfig('notesTemplate', e.target.value)}
                  placeholder="Enter template for interviewer notes (optional)"
                  rows={2}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                />
              </div>
            </div>
          )}

          {/* Assessment Configuration */}
          {stageCategory === 'assessment' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="text-2xl">✍️</span>
                Assessment Configuration
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Assessment Type
                </label>
                <select
                  value={config.assessmentType || 'technical'}
                  onChange={(e) => updateConfig('assessmentType', e.target.value)}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                >
                  <option value="technical">Technical Assessment</option>
                  <option value="coding">Coding Challenge</option>
                  <option value="case-study">Case Study</option>
                  <option value="presentation">Presentation</option>
                  <option value="personality">Personality Test</option>
                  <option value="skills">Skills Test</option>
                  <option value="background-check">Background Check</option>
                  <option value="reference-check">Reference Check</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Assessment Duration (minutes)
                </label>
                <input
                  type="number"
                  min="15"
                  max="480"
                  step="15"
                  value={config.assessmentDuration || 120}
                  onChange={(e) => updateConfig('assessmentDuration', parseInt(e.target.value))}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Assessment Platform
                </label>
                <select
                  value={config.assessmentPlatform || 'internal'}
                  onChange={(e) => updateConfig('assessmentPlatform', e.target.value)}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                >
                  <option value="internal">Internal Platform</option>
                  <option value="hackerrank">HackerRank</option>
                  <option value="codility">Codility</option>
                  <option value="leetcode">LeetCode</option>
                  <option value="testgorilla">TestGorilla</option>
                  <option value="external">External Link</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Assessment Instructions
                </label>
                <textarea
                  value={config.assessmentInstructions || ''}
                  onChange={(e) => updateConfig('assessmentInstructions', e.target.value)}
                  placeholder="Enter instructions for the assessment..."
                  rows={4}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Passing Score (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={config.passingScore || 70}
                  onChange={(e) => updateConfig('passingScore', parseInt(e.target.value))}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Auto-advance on Pass
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={config.autoAdvanceOnPass || false}
                    onChange={(e) => updateConfig('autoAdvanceOnPass', e.target.checked)}
                    className="w-4 h-4 text-purple-600 rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Automatically advance candidates who pass the assessment
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* General Configuration - shown for all stages */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Automation & Notifications
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Auto-advance on completion
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={config.autoAdvance || false}
                  onChange={(e) => updateConfig('autoAdvance', e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Automatically move candidates to next stage when marked complete
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Template
              </label>
              <select
                value={config.emailTemplate || 'none'}
                onChange={(e) => updateConfig('emailTemplate', e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
              >
                <option value="none">No automated email</option>
                <option value="invite">Interview Invitation</option>
                <option value="reminder">Interview Reminder</option>
                <option value="assessment-link">Assessment Link</option>
                <option value="feedback">Feedback Request</option>
                <option value="rejection">Rejection Notice</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              SLA & Visibility
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                SLA Duration (days)
              </label>
              <input
                type="number"
                min="1"
                max="90"
                value={config.slaDays || 7}
                onChange={(e) => updateConfig('slaDays', parseInt(e.target.value))}
                className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Visible to External Portal
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={config.externalPortalVisible || false}
                  onChange={(e) => updateConfig('externalPortalVisible', e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Show this stage to external partners
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-6 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving && (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {saving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
