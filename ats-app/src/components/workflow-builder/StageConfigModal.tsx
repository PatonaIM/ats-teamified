import { useState, useEffect, type FormEvent } from 'react';

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
  
  // Helper: Check if "ai" appears as a standalone word (not substring)
  const hasAIKeyword = /\bai\b/.test(stageName);
  
  // PRIORITY 1: Check for AI interview indicators (check BEFORE general interview patterns)
  // Use property presence check (in operator) not truthy check to handle false/0 values
  if (
    config.interviewType === 'ai' ||
    (hasAIKeyword && (stageName.includes('interview') || stageName.includes('evaluation') || stageName.includes('screen'))) ||
    'aiModel' in config ||
    'aiQuestionCount' in config ||
    'aiSentimentAnalysis' in config ||
    'aiCategories' in config ||
    'aiEvaluationCriteria' in config ||
    'aiInterviewDuration' in config
  ) {
    return 'ai-interview';
  }
  
  // PRIORITY 2: Check for assessment-type stages
  if (
    stageName.includes('test') ||
    stageName.includes('assessment') ||
    stageName.includes('background check') ||
    stageName.includes('reference check') ||
    (config.assessmentType && config.assessmentType !== 'none')
  ) {
    return 'assessment';
  }
  
  // PRIORITY 3: Check for human interview-type stages
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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {stage.stageName}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {stageCategory === 'ai-interview' && 'AI Interview Settings'}
              {stageCategory === 'human-interview' && 'Interview Settings'}
              {stageCategory === 'assessment' && 'Assessment Settings'}
              {stageCategory === 'general' && 'Stage Settings'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          {/* Scrollable Content */}
          <div className="overflow-y-auto flex-1 px-6 py-4 space-y-6">
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

              {/* Video Interview Specific Fields */}
              {config.interviewMode === 'video' && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg space-y-4 border border-blue-200 dark:border-blue-800">
                  <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-200 flex items-center gap-2">
                    <span>📹</span>
                    Video Interview Settings
                  </h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Video Platform
                    </label>
                    <select
                      value={config.videoPlatform || 'zoom'}
                      onChange={(e) => updateConfig('videoPlatform', e.target.value)}
                      className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                    >
                      <option value="zoom">Zoom</option>
                      <option value="teams">Microsoft Teams</option>
                      <option value="meet">Google Meet</option>
                      <option value="webex">Cisco Webex</option>
                      <option value="custom">Custom Link</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Recording Enabled
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={config.videoRecording || false}
                        onChange={(e) => updateConfig('videoRecording', e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Record video interview for later review
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Auto-generate Meeting Link
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={config.autoGenerateLink || false}
                        onChange={(e) => updateConfig('autoGenerateLink', e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Automatically create meeting link when scheduling
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Waiting Room
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={config.waitingRoom !== false}
                        onChange={(e) => updateConfig('waitingRoom', e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Enable waiting room for candidates
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Panel Interview Specific Fields */}
              {config.interviewMode === 'panel' && (
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg space-y-4 border border-purple-200 dark:border-purple-800">
                  <h4 className="text-sm font-semibold text-purple-900 dark:text-purple-200 flex items-center gap-2">
                    <span>👥</span>
                    Panel Interview Settings
                  </h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Number of Interviewers
                    </label>
                    <input
                      type="number"
                      min="2"
                      max="10"
                      value={config.panelSize || 3}
                      onChange={(e) => updateConfig('panelSize', parseInt(e.target.value))}
                      className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Scoring Method
                    </label>
                    <select
                      value={config.panelScoringMethod || 'average'}
                      onChange={(e) => updateConfig('panelScoringMethod', e.target.value)}
                      className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                    >
                      <option value="average">Average All Scores</option>
                      <option value="consensus">Require Consensus</option>
                      <option value="majority">Majority Vote</option>
                      <option value="weighted">Weighted by Role</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Individual Feedback Required
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={config.individualFeedbackRequired !== false}
                        onChange={(e) => updateConfig('individualFeedbackRequired', e.target.checked)}
                        className="w-4 h-4 text-purple-600 rounded"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Each interviewer must submit feedback separately
                      </span>
                    </div>
                  </div>
                </div>
              )}

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

              {/* AI Question Generation Settings (shown when enabled) */}
              {config.aiInterviewQuestions && (
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg space-y-4 border border-purple-200 dark:border-purple-800">
                  <h4 className="text-sm font-semibold text-purple-900 dark:text-purple-200 flex items-center gap-2">
                    <span>🤖</span>
                    AI Question Generation Settings
                  </h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Number of AI Questions
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="20"
                      value={config.aiQuestionCount || 10}
                      onChange={(e) => updateConfig('aiQuestionCount', parseInt(e.target.value))}
                      className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Question Focus Areas
                    </label>
                    <div className="space-y-2">
                      {['Technical Skills', 'Problem Solving', 'Communication', 'Leadership', 'Cultural Fit'].map((focus) => (
                        <div key={focus} className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={config.aiFocusAreas?.[focus] || false}
                            onChange={(e) => updateConfig('aiFocusAreas', { 
                              ...config.aiFocusAreas, 
                              [focus]: e.target.checked 
                            })}
                            className="w-4 h-4 text-purple-600 rounded"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{focus}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

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
                  <option value="criteria">Criteria Corp</option>
                  <option value="pymetrics">Pymetrics</option>
                  <option value="external">External Link</option>
                </select>
              </div>

              {/* Platform-Specific Settings */}
              {['hackerrank', 'codility', 'leetcode'].includes(config.assessmentPlatform) && (
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg space-y-4 border border-green-200 dark:border-green-800">
                  <h4 className="text-sm font-semibold text-green-900 dark:text-green-200 flex items-center gap-2">
                    <span>💻</span>
                    Coding Platform Settings
                  </h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Test Link/ID
                    </label>
                    <input
                      type="text"
                      value={config.platformTestId || ''}
                      onChange={(e) => updateConfig('platformTestId', e.target.value)}
                      placeholder={`Enter ${config.assessmentPlatform} test link or ID`}
                      className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Difficulty Level
                    </label>
                    <select
                      value={config.codingDifficulty || 'medium'}
                      onChange={(e) => updateConfig('codingDifficulty', e.target.value)}
                      className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                      <option value="expert">Expert</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Programming Languages Allowed
                    </label>
                    <div className="space-y-2">
                      {['JavaScript', 'Python', 'Java', 'C++', 'Go', 'Ruby'].map((lang) => (
                        <div key={lang} className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={config.allowedLanguages?.[lang] !== false}
                            onChange={(e) => updateConfig('allowedLanguages', { 
                              ...config.allowedLanguages, 
                              [lang]: e.target.checked 
                            })}
                            className="w-4 h-4 text-green-600 rounded"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{lang}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Background Check Specific Settings */}
              {config.assessmentType === 'background-check' && (
                <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg space-y-4 border border-orange-200 dark:border-orange-800">
                  <h4 className="text-sm font-semibold text-orange-900 dark:text-orange-200 flex items-center gap-2">
                    <span>🔍</span>
                    Background Check Details
                  </h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Check Types
                    </label>
                    <div className="space-y-2">
                      {['Criminal Record', 'Employment History', 'Education Verification', 'Credit Check', 'Drug Test'].map((checkType) => (
                        <div key={checkType} className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={config.backgroundCheckTypes?.[checkType] || false}
                            onChange={(e) => updateConfig('backgroundCheckTypes', { 
                              ...config.backgroundCheckTypes, 
                              [checkType]: e.target.checked 
                            })}
                            className="w-4 h-4 text-orange-600 rounded"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{checkType}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Background Check Provider
                    </label>
                    <input
                      type="text"
                      value={config.backgroundCheckProvider || ''}
                      onChange={(e) => updateConfig('backgroundCheckProvider', e.target.value)}
                      placeholder="e.g., Checkr, GoodHire, Sterling"
                      className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              )}

              {/* Reference Check Specific Settings */}
              {config.assessmentType === 'reference-check' && (
                <div className="bg-teal-50 dark:bg-teal-900/20 p-4 rounded-lg space-y-4 border border-teal-200 dark:border-teal-800">
                  <h4 className="text-sm font-semibold text-teal-900 dark:text-teal-200 flex items-center gap-2">
                    <span>📞</span>
                    Reference Check Details
                  </h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Number of References Required
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={config.referencesRequired || 3}
                      onChange={(e) => updateConfig('referencesRequired', parseInt(e.target.value))}
                      className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Reference Type Required
                    </label>
                    <div className="space-y-2">
                      {['Manager', 'Colleague', 'Direct Report', 'Client', 'Any'].map((refType) => (
                        <div key={refType} className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={config.referenceTypes?.[refType] || false}
                            onChange={(e) => updateConfig('referenceTypes', { 
                              ...config.referenceTypes, 
                              [refType]: e.target.checked 
                            })}
                            className="w-4 h-4 text-teal-600 rounded"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{refType}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Reference Check Questions
                    </label>
                    <textarea
                      value={config.referenceQuestions || ''}
                      onChange={(e) => updateConfig('referenceQuestions', e.target.value)}
                      placeholder="Enter questions to ask references (one per line)"
                      rows={4}
                      className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              )}

              {/* Skills Test Specific Settings */}
              {config.assessmentType === 'skills' && (
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg space-y-4 border border-indigo-200 dark:border-indigo-800">
                  <h4 className="text-sm font-semibold text-indigo-900 dark:text-indigo-200 flex items-center gap-2">
                    <span>⚡</span>
                    Skills Test Details
                  </h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Test Format
                    </label>
                    <select
                      value={config.skillsTestFormat || 'multiple-choice'}
                      onChange={(e) => updateConfig('skillsTestFormat', e.target.value)}
                      className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                    >
                      <option value="multiple-choice">Multiple Choice</option>
                      <option value="practical">Practical Demonstration</option>
                      <option value="simulation">Simulation/Scenario</option>
                      <option value="portfolio-review">Portfolio Review</option>
                      <option value="mixed">Mixed Format</option>
                    </select>
                  </div>

                  {/* Practical Demonstration Specific Settings */}
                  {config.skillsTestFormat === 'practical' && (
                    <div className="bg-cyan-50 dark:bg-cyan-900/20 p-4 rounded-lg space-y-4 border border-cyan-200 dark:border-cyan-800">
                      <h4 className="text-sm font-semibold text-cyan-900 dark:text-cyan-200 flex items-center gap-2">
                        <span>🛠️</span>
                        Practical Demonstration Settings
                      </h4>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Task/Exercise Type
                        </label>
                        <select
                          value={config.practicalTaskType || 'hands-on'}
                          onChange={(e) => updateConfig('practicalTaskType', e.target.value)}
                          className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                        >
                          <option value="hands-on">Hands-on Task</option>
                          <option value="live-demo">Live Demonstration</option>
                          <option value="project-based">Project-Based Assignment</option>
                          <option value="role-play">Role Play Exercise</option>
                          <option value="work-sample">Work Sample Creation</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Task Description
                        </label>
                        <textarea
                          value={config.practicalTaskDescription || ''}
                          onChange={(e) => updateConfig('practicalTaskDescription', e.target.value)}
                          placeholder="Describe the practical task candidates need to complete..."
                          rows={3}
                          className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Required Tools/Software
                        </label>
                        <input
                          type="text"
                          value={config.requiredTools || ''}
                          onChange={(e) => updateConfig('requiredTools', e.target.value)}
                          placeholder="e.g., Excel, Photoshop, CAD software"
                          className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Materials Provided
                        </label>
                        <textarea
                          value={config.materialsProvided || ''}
                          onChange={(e) => updateConfig('materialsProvided', e.target.value)}
                          placeholder="List materials or resources provided to candidates..."
                          rows={2}
                          className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Evaluation Criteria
                        </label>
                        <div className="space-y-2">
                          {['Quality of Work', 'Speed/Efficiency', 'Problem-Solving Approach', 'Attention to Detail', 'Following Instructions', 'Creativity/Innovation'].map((criteria) => (
                            <div key={criteria} className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={config.practicalEvaluationCriteria?.[criteria] || false}
                                onChange={(e) => updateConfig('practicalEvaluationCriteria', { 
                                  ...config.practicalEvaluationCriteria, 
                                  [criteria]: e.target.checked 
                                })}
                                className="w-4 h-4 text-cyan-600 rounded"
                              />
                              <span className="text-sm text-gray-700 dark:text-gray-300">{criteria}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Observation Method
                        </label>
                        <select
                          value={config.observationMethod || 'in-person'}
                          onChange={(e) => updateConfig('observationMethod', e.target.value)}
                          className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                        >
                          <option value="in-person">In-Person Observation</option>
                          <option value="video-call">Video Call Observation</option>
                          <option value="screen-recording">Screen Recording Review</option>
                          <option value="submitted-work">Review Submitted Work Product</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Allow Questions During Task
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={config.allowQuestionsDuringTask !== false}
                            onChange={(e) => updateConfig('allowQuestionsDuringTask', e.target.checked)}
                            className="w-4 h-4 text-cyan-600 rounded"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            Candidates can ask clarifying questions while performing the task
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Time Limit per Task (minutes)
                        </label>
                        <input
                          type="number"
                          min="10"
                          max="480"
                          step="5"
                          value={config.practicalTimeLimit || 60}
                          onChange={(e) => updateConfig('practicalTimeLimit', parseInt(e.target.value))}
                          className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Skills Being Tested
                    </label>
                    <div className="space-y-2">
                      {['Communication', 'Microsoft Office', 'Data Analysis', 'Project Management', 'Customer Service', 'Technical Writing'].map((skill) => (
                        <div key={skill} className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={config.skillsToTest?.[skill] || false}
                            onChange={(e) => updateConfig('skillsToTest', { 
                              ...config.skillsToTest, 
                              [skill]: e.target.checked 
                            })}
                            className="w-4 h-4 text-indigo-600 rounded"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{skill}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Additional Skills (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={config.customSkills || ''}
                      onChange={(e) => updateConfig('customSkills', e.target.value)}
                      placeholder="e.g., Excel VBA, SQL, Design Thinking"
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
                      max="100"
                      value={config.skillsQuestionCount || 20}
                      onChange={(e) => updateConfig('skillsQuestionCount', parseInt(e.target.value))}
                      className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Proctoring
                    </label>
                    <select
                      value={config.skillsProctoring || 'none'}
                      onChange={(e) => updateConfig('skillsProctoring', e.target.value)}
                      className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                    >
                      <option value="none">No Proctoring</option>
                      <option value="browser-lockdown">Browser Lockdown</option>
                      <option value="webcam">Webcam Monitoring</option>
                      <option value="live-proctor">Live Proctor</option>
                      <option value="ai-proctor">AI Proctoring</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Allow Retakes
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={config.allowRetakes || false}
                        onChange={(e) => updateConfig('allowRetakes', e.target.checked)}
                        className="w-4 h-4 text-indigo-600 rounded"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Allow candidates to retake the test if they fail
                      </span>
                    </div>
                  </div>

                  {config.allowRetakes && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Maximum Retakes
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="5"
                        value={config.maxRetakes || 2}
                        onChange={(e) => updateConfig('maxRetakes', parseInt(e.target.value))}
                        className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                      />
                    </div>
                  )}
                </div>
              )}

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
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-800/50 shrink-0">
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 text-sm font-medium bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {saving && (
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// Inline Panel Version (for WorkflowBuilder)
interface StageConfigPanelProps {
  stage: PipelineStage;
  onSave: (config: Record<string, any>, stageName?: string) => void;
  onLibrarySaved?: () => void; // Callback to refresh Stage Library after saving
}

interface Substage {
  id: string;
  label: string;
  order: number;
}

export function StageConfigPanel({ stage, onSave, onLibrarySaved }: StageConfigPanelProps) {
  const [config, setConfig] = useState<Record<string, any>>(stage.config || {});
  const [stageName, setStageName] = useState<string>(stage.stageName);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveToLibrary, setSaveToLibrary] = useState<boolean>(false);
  const [substages, setSubstages] = useState<Substage[]>([]);
  const [loadingSubstages, setLoadingSubstages] = useState<boolean>(false);
  const stageCategory = determineStageCategory(stage);
  const isNewStage = stage.id === -1;
  const isFixedStage = ['Screening', 'Shortlist', 'Client Endorsement', 'Offer', 'Offer Accepted'].includes(stage.stageName);

  // Reset config and stage name when stage changes
  useEffect(() => {
    setConfig(stage.config || {});
    setStageName(stage.stageName);
  }, [stage.id, stage.config, stage.stageName]);

  // Fetch substages for the current stage
  useEffect(() => {
    const fetchSubstages = async () => {
      if (!stage.stageName || isNewStage) {
        setSubstages([]);
        return;
      }

      setLoadingSubstages(true);
      try {
        const response = await fetch(`/api/substages/${encodeURIComponent(stage.stageName)}`);
        if (response.ok) {
          const data = await response.json();
          setSubstages(data.substages || []);
        }
      } catch (error) {
        console.error('Failed to fetch substages:', error);
        setSubstages([]);
      } finally {
        setLoadingSubstages(false);
      }
    };

    fetchSubstages();
  }, [stage.stageName, isNewStage]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Validate stage name for new stages
    if (isNewStage && (!stageName || stageName.trim() === '')) {
      alert('Please enter a stage name');
      return;
    }
    
    setSaving(true);
    try {
      // Save the stage to workflow
      await onSave(config, isNewStage ? stageName : undefined);
      
      // Save to Stage Library if checked
      if (saveToLibrary && !isFixedStage) {
        try {
          const response = await fetch('/api/stage-library', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: stageName,
              description: config.description || `Custom ${stageCategory} stage`,
              category: stageCategory,
              icon: stageCategory === 'ai-interview' ? '🤖' : 
                    stageCategory === 'human-interview' ? '👤' :
                    stageCategory === 'assessment' ? '✍️' : '📋'
            })
          });
          
          if (response.ok) {
            console.log('[Stage Library] Stage saved to library:', stageName);
            // Notify parent to refresh the Stage Library list
            if (onLibrarySaved) {
              onLibrarySaved();
            }
          }
        } catch (error) {
          console.error('[Stage Library] Failed to save to library:', error);
          // Don't block the main save operation
        }
      }
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (key: string, value: any) => {
    if (isFixedStage) return; // Prevent changes to fixed stages
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Fixed Stage Notice */}
      {isFixedStage && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Fixed Workflow Stage:</strong> This is a core stage and cannot be modified or deleted. Configuration is view-only.
            </div>
          </div>
        </div>
      )}
      
      {/* Stage Name - Editable for new stages */}
      <div className="pb-3 border-b border-gray-200 dark:border-gray-700">
        {isNewStage ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Stage Name *
            </label>
            <input
              type="text"
              value={stageName}
              onChange={(e) => setStageName(e.target.value)}
              placeholder="Enter stage name (e.g., Technical Interview, Background Check)"
              className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              autoFocus
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Name this stage to identify it in your workflow
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {stage.stageName}
            </h3>
            <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">
              {stageCategory === 'ai-interview' && 'AI'}
              {stageCategory === 'human-interview' && 'Interview'}
              {stageCategory === 'assessment' && 'Assessment'}
              {stageCategory === 'general' && 'General'}
            </span>
          </div>
        )}
      </div>

      {/* AI Interview Configuration */}
      {stageCategory === 'ai-interview' && (
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <span>🤖</span>
            AI Interview Configuration
          </h4>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              AI Model
            </label>
            <select
              value={config.aiModel || 'gpt-4'}
              onChange={(e) => updateConfig('aiModel', e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white"
            >
              <option value="gpt-4">GPT-4 (Advanced)</option>
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Fast)</option>
              <option value="claude-3">Claude 3 (Opus)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Interview Duration (minutes)
            </label>
            <input
              type="number"
              min="15"
              max="120"
              step="15"
              value={config.aiInterviewDuration || 45}
              onChange={(e) => updateConfig('aiInterviewDuration', parseInt(e.target.value))}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Number of Questions
            </label>
            <input
              type="number"
              min="5"
              max="30"
              value={config.aiQuestionCount || 15}
              onChange={(e) => updateConfig('aiQuestionCount', parseInt(e.target.value))}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Question Categories
            </label>
            <div className="space-y-2">
              {['Technical', 'Behavioral', 'Cultural Fit', 'Situational'].map((category) => (
                <div key={category} className="flex items-center gap-2">
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Sentiment Analysis
            </label>
            <div className="flex items-center gap-2">
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              AI Evaluation Criteria
            </label>
            <textarea
              value={config.aiEvaluationCriteria || ''}
              onChange={(e) => updateConfig('aiEvaluationCriteria', e.target.value)}
              placeholder="Enter criteria for AI to evaluate responses"
              rows={3}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white"
            />
          </div>
        </div>
      )}

      {/* Human Interview Configuration */}
      {stageCategory === 'human-interview' && (
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <span>👤</span>
            Interview Configuration
          </h4>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Interviewer Name <span className="text-xs text-gray-500">(With Whom)</span>
            </label>
            <input
              type="text"
              value={config.interviewerName || ''}
              onChange={(e) => updateConfig('interviewerName', e.target.value)}
              placeholder="Enter interviewer's name"
              className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Interview Duration (minutes)
            </label>
            <input
              type="number"
              min="15"
              max="480"
              step="15"
              value={config.interviewDuration || 60}
              onChange={(e) => updateConfig('interviewDuration', parseInt(e.target.value))}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Meeting Platform
            </label>
            <select
              value={config.meetingPlatform || 'google-meet'}
              onChange={(e) => updateConfig('meetingPlatform', e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white"
            >
              <option value="google-meet">Google Meet</option>
              <option value="zoom">Zoom</option>
              <option value="microsoft-teams">Microsoft Teams</option>
              <option value="phone">Phone Call</option>
              <option value="onsite">On-site</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Schedule Call
            </label>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                checked={config.autoSchedule || false}
                onChange={(e) => updateConfig('autoSchedule', e.target.checked)}
                className="w-4 h-4 text-purple-600 rounded"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Enable automatic scheduling
              </span>
            </div>
            <textarea
              value={config.schedulingNotes || ''}
              onChange={(e) => updateConfig('schedulingNotes', e.target.value)}
              placeholder="Add scheduling notes or preferences (optional)"
              rows={2}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Interviewer Notes Template
            </label>
            <textarea
              value={config.notesTemplate || ''}
              onChange={(e) => updateConfig('notesTemplate', e.target.value)}
              placeholder="Enter template for interviewer notes (optional)"
              rows={2}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white"
            />
          </div>
        </div>
      )}

      {/* Assessment Configuration */}
      {stageCategory === 'assessment' && (
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <span>✍️</span>
            Assessment Configuration
          </h4>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Assessment Type
            </label>
            <select
              value={config.assessmentType || 'technical'}
              onChange={(e) => updateConfig('assessmentType', e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white"
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Assessment Duration (minutes)
            </label>
            <input
              type="number"
              min="15"
              max="480"
              step="15"
              value={config.assessmentDuration || 120}
              onChange={(e) => updateConfig('assessmentDuration', parseInt(e.target.value))}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Assessment Platform
            </label>
            <select
              value={config.assessmentPlatform || 'internal'}
              onChange={(e) => updateConfig('assessmentPlatform', e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white"
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Assessment Instructions
            </label>
            <textarea
              value={config.assessmentInstructions || ''}
              onChange={(e) => updateConfig('assessmentInstructions', e.target.value)}
              placeholder="Enter instructions for the assessment..."
              rows={4}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Passing Score (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={config.passingScore || 70}
              onChange={(e) => updateConfig('passingScore', parseInt(e.target.value))}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Auto-advance on Pass
            </label>
            <div className="flex items-center gap-2">
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
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
          Automation & Notifications
        </h4>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Auto-advance on completion
          </label>
          <div className="flex items-center gap-2">
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
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Email Template
          </label>
          <select
            value={config.emailTemplate || 'none'}
            onChange={(e) => updateConfig('emailTemplate', e.target.value)}
            className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white"
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
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
          SLA & Visibility
        </h4>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            SLA Duration (days)
          </label>
          <input
            type="number"
            min="1"
            max="90"
            value={config.slaDays || 7}
            onChange={(e) => updateConfig('slaDays', parseInt(e.target.value))}
            className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Visible to External Portal
          </label>
          <div className="flex items-center gap-2">
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

      {/* Substage Progress Tracking - View Only */}
      {!isNewStage && (
        <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <span>📊</span>
              Substage Progress Tracking
            </h4>
            <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">
              View Only
            </span>
          </div>

          {loadingSubstages ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            </div>
          ) : substages.length > 0 ? (
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/10 dark:to-blue-900/10 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                This stage has {substages.length} substages that track candidate progress. These are displayed on candidate cards as a mini progress bar.
              </p>
              <div className="space-y-2">
                {substages.map((substage) => (
                  <div
                    key={substage.id}
                    className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-md p-3 shadow-sm"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs font-bold shrink-0">
                      {substage.order}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {substage.label}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {Math.round((substage.order / substages.length) * 100)}% progress when reached
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: substages.length }).map((_, i) => (
                        <div
                          key={i}
                          className={`h-1.5 w-6 rounded-full ${
                            i < substage.order
                              ? 'bg-gradient-to-r from-purple-500 to-blue-500'
                              : 'bg-gray-200 dark:bg-gray-700'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-purple-200 dark:border-purple-800">
                <p className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-2">
                  <span>💡</span>
                  <span>
                    <strong>How it works:</strong> As candidates move through this stage, their progress is automatically tracked and displayed as a visual progress bar on their candidate card. Transitions can be manual or automatic based on actions like booking interviews or submitting assessments.
                  </span>
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6 text-center border border-gray-200 dark:border-gray-700">
              <div className="text-4xl mb-2">📊</div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                No substages defined for this stage
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                Custom stages don't have predefined substages. Only system stages have automatic progress tracking.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Save to Library & Save Button */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700 sticky bottom-0 bg-white dark:bg-gray-800 space-y-3">
        {/* Save to Library Checkbox - Only show for custom stages */}
        {!isFixedStage && (
          <div className="flex items-center gap-2 px-1">
            <input
              type="checkbox"
              id="saveToLibrary"
              checked={saveToLibrary}
              onChange={(e) => setSaveToLibrary(e.target.checked)}
              className="w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
            />
            <label htmlFor="saveToLibrary" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none">
              💾 Save to Stage Library for reuse
            </label>
          </div>
        )}
        
        <button
          type="submit"
          disabled={saving || isFixedStage}
          className="w-full px-4 py-2.5 text-sm font-semibold bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {saving && (
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          {isFixedStage ? 'Fixed Stage (Read Only)' : (saving ? 'Saving...' : 'Save Changes')}
        </button>
      </div>
    </form>
  );
}
