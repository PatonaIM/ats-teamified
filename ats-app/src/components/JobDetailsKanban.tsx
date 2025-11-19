import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Briefcase, MapPin, DollarSign, Users, Mail, Phone, FileText, Calendar } from 'lucide-react';
import { apiRequest } from '../utils/api';
import ConfirmationModal from './ConfirmationModal';

interface Job {
  id: string;
  title: string;
  employment_type: string;
  job_status: string;
  department: string;
  location: string;
  salary_from: number | null;
  salary_to: number | null;
  salary_currency: string;
  salary_text: string;
  created_at: string;
}

interface PipelineStage {
  id: string;
  stageName: string;
  stageOrder: number;
}

interface Candidate {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  resume_url: string | null;
  source: string;
  created_at: string;
  current_stage: string;
  status: string;
}

export default function JobDetailsKanban() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  
  const [job, setJob] = useState<Job | null>(null);
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant: 'danger' | 'warning' | 'success' | 'primary';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    variant: 'primary'
  });

  useEffect(() => {
    fetchJobData();
  }, [jobId]);

  useEffect(() => {
    if (stages.length > 0 && !selectedStage) {
      setSelectedStage(stages[0].stageName);
    }
  }, [stages]);

  const fetchJobData = async () => {
    try {
      setLoading(true);
      console.log('[JobDetailsKanban] Fetching data for job:', jobId);
      
      const [jobData, stagesData, candidatesData] = await Promise.all([
        apiRequest<Job>(`/api/jobs/${jobId}`),
        apiRequest<any>(`/api/jobs/${jobId}/pipeline-stages`),
        apiRequest<any>(`/api/candidates?jobId=${jobId}`)
      ]);
      
      console.log('[JobDetailsKanban] Raw data received:', {
        jobData: !!jobData,
        stagesData: typeof stagesData,
        candidatesData: typeof candidatesData
      });
      
      const rawStages = Array.isArray(stagesData?.stages) 
        ? stagesData.stages 
        : Array.isArray(stagesData) 
        ? stagesData 
        : [];
      
      const safeStages = rawStages.map((stage: any) => ({
        id: stage.id,
        stageName: stage.stageName || stage.stage_name,
        stageOrder: stage.stageOrder || stage.stage_order
      }));
      
      const safeCandidates = Array.isArray(candidatesData?.candidates)
        ? candidatesData.candidates
        : Array.isArray(candidatesData)
        ? candidatesData
        : [];
      
      console.log('[JobDetailsKanban] Safe data:', {
        hasJob: !!jobData,
        jobTitle: jobData?.title,
        stagesCount: safeStages.length,
        candidatesCount: safeCandidates.length
      });
      
      setJob(jobData as Job);
      setStages(safeStages);
      setCandidates(safeCandidates.filter((c: Candidate) => c.status === 'active'));
      
      console.log('[JobDetailsKanban] State updated, loading complete');
    } catch (error) {
      console.error('[JobDetailsKanban] Error fetching job data:', error);
    } finally {
      console.log('[JobDetailsKanban] Setting loading to false');
      setLoading(false);
    }
  };

  const getCandidatesForStage = (stageName: string) => {
    return candidates.filter(c => c.current_stage === stageName);
  };

  const getNextStage = (currentStageName: string): string | null => {
    const currentStageIndex = stages.findIndex(s => s.stageName === currentStageName);
    if (currentStageIndex >= 0 && currentStageIndex < stages.length - 1) {
      return stages[currentStageIndex + 1].stageName;
    }
    return null;
  };

  const handleMoveToNextStage = async (candidateId: string) => {
    const candidate = candidates.find(c => c.id === candidateId);
    if (!candidate) return;

    const nextStage = getNextStage(candidate.current_stage);
    if (!nextStage) return;

    const originalCandidates = [...candidates];
    
    setCandidates(candidates.map(c => 
      c.id === candidateId 
        ? { ...c, current_stage: nextStage }
        : c
    ));

    if (selectedCandidate?.id === candidateId) {
      setSelectedCandidate({ ...selectedCandidate, current_stage: nextStage });
    }

    try {
      await apiRequest(`/api/candidates/${candidateId}/stage`, {
        method: 'PATCH',
        body: JSON.stringify({
          stage: nextStage,
          userId: null,
          notes: `Moved to ${nextStage}`
        })
      });
    } catch (error) {
      console.error('Error moving candidate:', error);
      setCandidates(originalCandidates);
      alert('Failed to move candidate. Please try again.');
    }
  };

  const handleDisqualify = (candidateId: string) => {
    const candidate = candidates.find(c => c.id === candidateId);
    if (!candidate) return;

    setConfirmModal({
      isOpen: true,
      title: 'Disqualify Candidate',
      message: `Are you sure you want to disqualify ${candidate.first_name} ${candidate.last_name}? This will remove them from the active pipeline.`,
      variant: 'danger',
      onConfirm: async () => {
        const originalCandidates = [...candidates];
        
        setCandidates(candidates.filter(c => c.id !== candidateId));
        if (selectedCandidate?.id === candidateId) {
          setSelectedCandidate(null);
        }

        try {
          await apiRequest(`/api/candidates/${candidateId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({
              status: 'disqualified',
              reason: 'Disqualified by recruiter',
              userId: null
            })
          });
        } catch (error) {
          console.error('Error disqualifying candidate:', error);
          setCandidates(originalCandidates);
          alert('Failed to disqualify candidate. Please try again.');
        }
        
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">Job not found</p>
          <button
            onClick={() => navigate('/dashboard/jobs')}
            className="text-purple-600 hover:text-purple-700 dark:text-purple-400"
          >
            Back to Jobs
          </button>
        </div>
      </div>
    );
  }

  const filteredCandidates = selectedStage 
    ? getCandidatesForStage(selectedStage)
    : candidates;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-full px-8 py-6">
          <button
            onClick={() => navigate('/dashboard/jobs')}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 mb-4 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back to Jobs</span>
          </button>
          
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {job.title}
            </h1>
            
            <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <Briefcase size={16} />
                <span>{job.employment_type}</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin size={16} />
                <span>{job.location}</span>
              </div>
              {job.salary_from && (
                <div className="flex items-center gap-1">
                  <DollarSign size={16} />
                  <span>{job.salary_currency} {job.salary_from}{job.salary_to && ` - ${job.salary_to}`}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Users size={16} />
                <span>{candidates.length} Active Candidates</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-180px)]">
        {/* Left Side - Horizontal Pipeline & Candidates List */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Horizontal Pipeline Stages */}
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-2 overflow-x-auto">
              {stages.map((stage, index) => {
                const stageCount = getCandidatesForStage(stage.stageName).length;
                const isSelected = selectedStage === stage.stageName;
                
                return (
                  <div key={stage.id} className="flex items-center">
                    <button
                      onClick={() => setSelectedStage(stage.stageName)}
                      className={`
                        flex flex-col items-center justify-center min-w-[140px] h-20 px-4 rounded-lg
                        transition-all duration-200 border-2
                        ${isSelected 
                          ? 'bg-gradient-to-r from-purple-500 to-blue-500 border-transparent text-white shadow-lg scale-105' 
                          : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-purple-400'
                        }
                      `}
                    >
                      <div className="text-lg font-semibold">{stageCount}</div>
                      <div className={`text-xs ${isSelected ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                        {stage.stageName}
                      </div>
                    </button>
                    
                    {index < stages.length - 1 && (
                      <div className="w-8 h-0.5 bg-gray-300 dark:bg-gray-600 mx-2" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Candidates List */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-3">
              {filteredCandidates.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  No candidates in this stage
                </div>
              ) : (
                filteredCandidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    onClick={() => setSelectedCandidate(candidate)}
                    className={`
                      p-4 rounded-lg border cursor-pointer transition-all
                      ${selectedCandidate?.id === candidate.id
                        ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-400'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-purple-300'
                      }
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {candidate.first_name} {candidate.last_name}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {candidate.email}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(candidate.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Side - Candidate Information Panel */}
        <div className="w-[400px] bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 overflow-y-auto">
          {selectedCandidate ? (
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Candidate Details
              </h2>
              
              <div className="space-y-6">
                {/* Name */}
                <div>
                  <div className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Full Name</div>
                  <div className="text-gray-900 dark:text-white font-medium text-lg">
                    {selectedCandidate.first_name} {selectedCandidate.last_name}
                  </div>
                </div>

                {/* Email */}
                <div>
                  <div className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Email</div>
                  <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                    <Mail size={16} className="text-gray-400" />
                    <a href={`mailto:${selectedCandidate.email}`} className="hover:text-purple-600 dark:hover:text-purple-400">
                      {selectedCandidate.email}
                    </a>
                  </div>
                </div>

                {/* Phone */}
                {selectedCandidate.phone && (
                  <div>
                    <div className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Phone</div>
                    <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                      <Phone size={16} className="text-gray-400" />
                      <a href={`tel:${selectedCandidate.phone}`} className="hover:text-purple-600 dark:hover:text-purple-400">
                        {selectedCandidate.phone}
                      </a>
                    </div>
                  </div>
                )}

                {/* Current Stage */}
                <div>
                  <div className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Current Stage</div>
                  <div className="inline-block px-3 py-1 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 text-white text-sm font-medium">
                    {selectedCandidate.current_stage}
                  </div>
                </div>

                {/* Source */}
                <div>
                  <div className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Source</div>
                  <div className="text-gray-900 dark:text-white capitalize">
                    {selectedCandidate.source}
                  </div>
                </div>

                {/* Applied Date */}
                <div>
                  <div className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Applied Date</div>
                  <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                    <Calendar size={16} className="text-gray-400" />
                    {new Date(selectedCandidate.created_at).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </div>
                </div>

                {/* Resume */}
                {selectedCandidate.resume_url && (
                  <div>
                    <div className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Resume</div>
                    <a
                      href={selectedCandidate.resume_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors"
                    >
                      <FileText size={16} />
                      View Resume
                    </a>
                  </div>
                )}

                {/* Actions */}
                <div className="pt-6 border-t border-gray-200 dark:border-gray-700 space-y-3">
                  <button
                    onClick={() => handleMoveToNextStage(selectedCandidate.id)}
                    disabled={!getNextStage(selectedCandidate.current_stage)}
                    className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-all font-medium"
                  >
                    {getNextStage(selectedCandidate.current_stage) 
                      ? `Move to ${getNextStage(selectedCandidate.current_stage)}`
                      : 'Final Stage'
                    }
                  </button>
                  
                  <button
                    onClick={() => handleDisqualify(selectedCandidate.id)}
                    className="w-full px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors font-medium"
                  >
                    Disqualify Candidate
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 p-6 text-center">
              <div>
                <Users size={48} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                <p>Select a candidate to view their details</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText="Confirm"
        cancelText="Cancel"
        confirmVariant={confirmModal.variant}
      />
    </div>
  );
}
