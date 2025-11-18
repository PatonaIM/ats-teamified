import { useState } from 'react';

interface StageTypeSelectorProps {
  stageName: string;
  onConfirm: (finalStageName: string, stageConfig: Record<string, any>) => void;
  onCancel: () => void;
}

export default function StageTypeSelector({ stageName, onConfirm, onCancel }: StageTypeSelectorProps) {
  const [step, setStep] = useState<'type' | 'hr-type'>('type');

  const handleTypeSelection = (type: 'ai' | 'human') => {
    if (type === 'ai') {
      // AI interview - no need to ask about HR type
      const config = {
        interviewType: 'ai',
        aiModel: 'gpt-4',
        aiQuestionCount: 15,
        aiInterviewDuration: 45,
        aiSentimentAnalysis: true
      };
      onConfirm(`AI ${stageName}`, config);
    } else {
      // Human interview - ask if client HR or teamified HR
      setStep('hr-type');
    }
  };

  const handleHRTypeSelection = (hrType: 'client' | 'teamified') => {
    const config = {
      interviewType: 'human',
      interviewMode: 'video',
      hrType: hrType,
      videoPlatform: hrType === 'teamified' ? 'teams' : 'zoom',
      interviewDuration: 60
    };
    onConfirm(`${hrType === 'client' ? 'Client HR' : 'Teamified HR'} ${stageName}`, config);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {step === 'type' ? 'Select Interview Type' : 'Select HR Type'}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {step === 'type' 
              ? `Configure "${stageName}" stage` 
              : 'Who will conduct this interview?'}
          </p>
        </div>

        {/* Body */}
        <div className="p-6">
          {step === 'type' ? (
            <div className="space-y-3">
              <button
                onClick={() => handleTypeSelection('ai')}
                className="w-full p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-purple-500 dark:hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all group"
              >
                <div className="flex items-start gap-3">
                  <div className="text-3xl">🤖</div>
                  <div className="flex-1 text-left">
                    <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-purple-700 dark:group-hover:text-purple-300">
                      AI Interview
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Automated interview powered by AI with sentiment analysis and evaluation
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleTypeSelection('human')}
                className="w-full p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group"
              >
                <div className="flex items-start gap-3">
                  <div className="text-3xl">👤</div>
                  <div className="flex-1 text-left">
                    <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-300">
                      Human Interview
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Interview conducted by a human interviewer (phone, video, or on-site)
                    </p>
                  </div>
                </div>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <button
                onClick={() => handleHRTypeSelection('client')}
                className="w-full p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-green-500 dark:hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all group"
              >
                <div className="flex items-start gap-3">
                  <div className="text-3xl">🏢</div>
                  <div className="flex-1 text-left">
                    <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-green-700 dark:group-hover:text-green-300">
                      Client HR
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Interview conducted by client's internal HR team
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleHRTypeSelection('teamified')}
                className="w-full p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-purple-500 dark:hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all group"
              >
                <div className="flex items-start gap-3">
                  <div className="text-3xl">🎯</div>
                  <div className="flex-1 text-left">
                    <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-purple-700 dark:group-hover:text-purple-300">
                      Teamified HR
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Interview conducted by Teamified's professional HR consultants
                    </p>
                  </div>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          {step === 'hr-type' && (
            <button
              onClick={() => setStep('type')}
              className="px-4 py-2 text-sm font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
            >
              ← Back
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
