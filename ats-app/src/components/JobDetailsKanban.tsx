import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Briefcase, MapPin, DollarSign, Users, Mail, Phone, Calendar, ChevronRight, Download, ChevronDown, FileText, Eye } from 'lucide-react';
import { apiRequest } from '../utils/api';
import ConfirmationModal from './ConfirmationModal';
import { useAuth } from '../contexts/AuthContext';
import InterviewScheduling from './InterviewScheduling';

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
  candidate_substage: string | null;
  status: string;
}

interface Substage {
  id: string;
  label: string;
  order: number;
}

// Stages that are view-only for clients but editable for recruiters
// Clients can only VIEW these stages, but can interact with Client Endorsement onwards
const CLIENT_VIEW_ONLY_STAGES = [
  'Screening',
  'Shortlist'
];

export default function JobDetailsKanban() {
  const params = useParams<{ jobId: string }>();
  const jobId = params.jobId;
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  
  console.log('[JobDetailsKanban] Component loaded with jobId:', jobId);
  
  const [job, setJob] = useState<Job | null>(null);
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set());
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [stageSubstages, setStageSubstages] = useState<Record<string, Substage[]>>({});
  const [loadingSubstages, setLoadingSubstages] = useState<Set<string>>(new Set());
  
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
    if (jobId) {
      fetchJobData();
    }
  }, [jobId]);

  useEffect(() => {
    if (stages.length > 0 && expandedStages.size === 0) {
      setExpandedStages(new Set([stages[0].stageName]));
    }
  }, [stages]);

  useEffect(() => {
    if (selectedCandidate && selectedCandidate.current_stage) {
      setExpandedStages(prev => new Set([...prev, selectedCandidate.current_stage]));
      fetchSubstagesForStage(selectedCandidate.current_stage);
    }
  }, [selectedCandidate]);
  
  const fetchSubstagesForStage = async (stageName: string) => {
    if (stageSubstages[stageName]) return; // Already fetched
    
    setLoadingSubstages(prev => new Set([...prev, stageName]));
    
    try {
      const response = await apiRequest<{ stageName: string; substages: Substage[] }>(
        `/api/substages/${encodeURIComponent(stageName)}`
      );
      setStageSubstages(prev => ({ ...prev, [stageName]: response.substages }));
    } catch (error) {
      console.error('Failed to fetch substages:', error);
    } finally {
      setLoadingSubstages(prev => {
        const updated = new Set(prev);
        updated.delete(stageName);
        return updated;
      });
    }
  };
  
  const formatSubstageLabel = (substageId: string): string => {
    // Convert IDs like "interview_scheduled" to "Interview Scheduled"
    return substageId.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };
  
  const handleUpdateSubstage = async (candidateId: string, newSubstage: string) => {
    if (!user) return;
    
    try {
      await apiRequest(`/api/candidates/${candidateId}/substage`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          substage: newSubstage,
          userId: user.id,
          userRole: user.role
        })
      });
      
      // Update local state
      setCandidates(prev => 
        prev.map(c => c.id === candidateId ? { ...c, candidate_substage: newSubstage } : c)
      );
      
      if (selectedCandidate?.id === candidateId) {
        setSelectedCandidate(prev => prev ? { ...prev, candidate_substage: newSubstage } : null);
      }
    } catch (error) {
      console.error('Failed to update substage:', error);
      if (error instanceof Error && error.message.includes('Forbidden')) {
        alert('You do not have permission to update the substage for this candidate.');
      } else {
        alert('Failed to update substage. Please try again.');
      }
    }
  };

  const fetchJobData = async () => {
    console.log('[JobDetailsKanban] fetchJobData called for jobId:', jobId);
    setLoading(true);
    
    try {
      console.log('[JobDetailsKanban] Starting Promise.all for API calls');
      const results = await Promise.all([
        apiRequest<any>(`/api/jobs/${jobId}`).catch(e => { console.error('Job fetch error:', e); return null; }),
        apiRequest<any>(`/api/jobs/${jobId}/pipeline-stages`).catch(e => { console.error('Stages fetch error:', e); return { stages: [] }; }),
        apiRequest<any>(`/api/candidates?jobId=${jobId}`).catch(e => { console.error('Candidates fetch error:', e); return { candidates: [] }; })
      ]);
      
      console.log('[JobDetailsKanban] Promise.all completed, processing results');
      const [jobData, stagesData, candidatesData] = results;
      
      if (jobData) {
        console.log('[JobDetailsKanban] Setting job data:', jobData.title);
        setJob(jobData);
      }
      
      const rawStages = Array.isArray(stagesData?.stages) ? stagesData.stages : [];
      const safeStages = rawStages.map((stage: any) => ({
        id: stage.id,
        stageName: stage.stageName || stage.stage_name || 'Unknown',
        stageOrder: stage.stageOrder || stage.stage_order || 0
      }));
      console.log('[JobDetailsKanban] Setting', safeStages.length, 'stages');
      setStages(safeStages);
      
      const safeCandidates = Array.isArray(candidatesData?.candidates) ? candidatesData.candidates : [];
      const activeCandidates = safeCandidates.filter((c: any) => c.status === 'active');
      console.log('[JobDetailsKanban] Setting', activeCandidates.length, 'candidates');
      setCandidates(activeCandidates);
      
    } catch (error) {
      console.error('[JobDetailsKanban] Critical error:', error);
    }
    
    console.log('[JobDetailsKanban] Setting loading = false');
    setLoading(false);
  };

  const toggleStage = (stageName: string) => {
    setExpandedStages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stageName)) {
        newSet.delete(stageName);
      } else {
        newSet.add(stageName);
      }
      return newSet;
    });
  };

  const getCandidatesForStage = (stageName: string) => {
    return candidates.filter(c => c.current_stage === stageName);
  };

  const isViewOnlyForUser = (stageName: string): boolean => {
    // During auth loading, default to restricted access for security
    if (authLoading) {
      return CLIENT_VIEW_ONLY_STAGES.includes(stageName);
    }
    
    const isClient = user?.role === 'client';
    const isRestrictedStage = CLIENT_VIEW_ONLY_STAGES.includes(stageName);
    return isClient && isRestrictedStage;
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage: nextStage,
          userId: null,
          userRole: user?.role || 'client',
          notes: `Moved to ${nextStage}`
        })
      });
    } catch (error) {
      console.error('Error moving candidate:', error);
      setCandidates(originalCandidates);
      
      // Handle permission errors specifically
      if (error instanceof Error && error.message.includes('Forbidden')) {
        alert('You do not have permission to perform this action.');
      } else {
        alert('Failed to move candidate. Please try again.');
      }
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
              userId: null,
              userRole: user?.role || 'client'
            })
          });
        } catch (error) {
          console.error('Error disqualifying candidate:', error);
          setCandidates(originalCandidates);
          
          // Handle permission errors specifically
          if (error instanceof Error && error.message.includes('Forbidden')) {
            alert('You do not have permission to perform this action.');
          } else {
            alert('Failed to disqualify candidate. Please try again.');
          }
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

  const totalCandidates = candidates.length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-8 py-4">
        <button
          onClick={() => navigate('/dashboard/jobs')}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 mb-3 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back to All Jobs</span>
        </button>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {job.title}
            </h1>
            
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
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
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Applicants</div>
            <div className="text-3xl font-bold text-purple-600">{totalCandidates}</div>
            <div className="text-xs text-gray-400">0 Disqualified</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Pipeline Stages with Accordion */}
        <div className="w-[420px] bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
          <div className="p-4">
            <h3 className="text-xs uppercase font-semibold text-gray-500 dark:text-gray-400 mb-3">
              Pipeline Stages
            </h3>
            
            <div className="space-y-2">
              {stages.map((stage) => {
                const stageCandidates = getCandidatesForStage(stage.stageName);
                const isExpanded = expandedStages.has(stage.stageName);
                
                return (
                  <div key={stage.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    {/* Stage Header */}
                    <button
                      onClick={() => toggleStage(stage.stageName)}
                      aria-expanded={isExpanded}
                      aria-controls={`stage-${stage.id}`}
                      className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        {isExpanded ? (
                          <ChevronDown size={18} className="text-gray-500 dark:text-gray-400" />
                        ) : (
                          <ChevronRight size={18} className="text-gray-500 dark:text-gray-400" />
                        )}
                        <div className="flex items-center gap-2 flex-1">
                          <span className="font-semibold text-sm text-gray-900 dark:text-white">
                            {stage.stageName}
                          </span>
                          {isViewOnlyForUser(stage.stageName) && (
                            <span title="View only for clients">
                              <Eye size={14} className="text-blue-500" />
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-xs font-bold px-2 py-1 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 text-white">
                        {stageCandidates.length}
                      </span>
                    </button>

                    {/* Collapsible Candidate List */}
                    {isExpanded && (
                      <div id={`stage-${stage.id}`} className="bg-white dark:bg-gray-800">
                        {stageCandidates.length === 0 ? (
                          <div className="px-4 py-6 text-center text-sm text-gray-400">
                            No candidates in this stage
                          </div>
                        ) : (
                          <div className="divide-y divide-gray-200 dark:divide-gray-700">
                            {stageCandidates.map((candidate) => (
                              <button
                                key={candidate.id}
                                onClick={() => setSelectedCandidate(candidate)}
                                className={`
                                  w-full text-left px-4 py-3 transition-colors
                                  ${selectedCandidate?.id === candidate.id
                                    ? 'bg-purple-50 dark:bg-purple-900/20'
                                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                  }
                                `}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <div className="font-semibold text-sm text-gray-900 dark:text-white">
                                    {candidate.first_name} {candidate.last_name}
                                  </div>
                                  {selectedCandidate?.id === candidate.id && (
                                    <ChevronRight size={16} className="text-purple-500" />
                                  )}
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                                  {candidate.email}
                                </div>
                                {candidate.candidate_substage && (
                                  <div className="text-xs text-purple-600 dark:text-purple-400 mt-1 font-medium">
                                    {formatSubstageLabel(candidate.candidate_substage)}
                                  </div>
                                )}
                                <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                  Applied {new Date(candidate.created_at).toLocaleDateString()}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right - Candidate Details with Resume Preview */}
        <div className="flex-1 bg-gray-50 dark:bg-gray-900 overflow-y-auto">
          {selectedCandidate ? (
            <div className="p-8 max-w-4xl">
              {/* Candidate Header */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {selectedCandidate.first_name} {selectedCandidate.last_name}
                    </h2>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="inline-block px-3 py-1 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 text-white text-sm font-medium">
                        {selectedCandidate.current_stage}
                      </div>
                      {isViewOnlyForUser(selectedCandidate.current_stage) && (
                        <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium">
                          <Eye size={12} />
                          View Only
                        </div>
                      )}
                    </div>
                    
                    {/* Substage Progress */}
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                      <div className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3 flex items-center justify-between">
                        <span>Progress</span>
                        {isViewOnlyForUser(selectedCandidate.current_stage) && (
                          <span className="text-xs text-gray-400 dark:text-gray-500 font-normal normal-case">(View Only)</span>
                        )}
                      </div>
                      
                      {loadingSubstages.has(selectedCandidate.current_stage) ? (
                        <div className="flex items-center justify-center py-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-2 border-purple-500 border-t-transparent"></div>
                        </div>
                      ) : stageSubstages[selectedCandidate.current_stage]?.length > 0 ? (
                        <>
                          <div className="flex items-center gap-2 mb-3">
                            {stageSubstages[selectedCandidate.current_stage].map((substage, index) => {
                            const isCompleted = selectedCandidate.candidate_substage 
                              ? substage.order <= (stageSubstages[selectedCandidate.current_stage].find(s => s.id === selectedCandidate.candidate_substage)?.order || 0)
                              : false;
                            const isCurrent = selectedCandidate.candidate_substage === substage.id;
                            const isViewOnly = isViewOnlyForUser(selectedCandidate.current_stage);
                            
                            return (
                              <div key={substage.id} className="flex items-center gap-2 flex-1">
                                <button
                                  onClick={() => !isViewOnly && handleUpdateSubstage(selectedCandidate.id, substage.id)}
                                  disabled={isViewOnly}
                                  className={`
                                    relative flex-1 h-3 rounded-full transition-all
                                    ${isCompleted 
                                      ? 'bg-gradient-to-r from-purple-500 to-blue-500 shadow-sm' 
                                      : 'bg-gray-200 dark:bg-gray-600'
                                    }
                                    ${!isViewOnly ? 'cursor-pointer hover:shadow-md hover:scale-105' : 'cursor-not-allowed opacity-75'}
                                  `}
                                  title={substage.label}
                                >
                                  {isCurrent && (
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 bg-white dark:bg-gray-800 rounded-full border-2 border-purple-500 shadow-lg"></div>
                                  )}
                                </button>
                                {index < stageSubstages[selectedCandidate.current_stage].length - 1 && (
                                  <div className="w-1.5 h-0.5 bg-gray-300 dark:bg-gray-600"></div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                          {selectedCandidate.candidate_substage && (
                            <div className="text-xs text-gray-600 dark:text-gray-400 text-center">
                              Current: <span className="font-medium text-purple-600 dark:text-purple-400">
                                {formatSubstageLabel(selectedCandidate.candidate_substage)}
                              </span>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-2">
                          No progress tracking available for this stage
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {!isViewOnlyForUser(selectedCandidate.current_stage) ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDisqualify(selectedCandidate.id)}
                        className="px-4 py-2 bg-white dark:bg-gray-700 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm font-medium"
                      >
                        Disqualify
                      </button>
                      
                      <button
                        onClick={() => handleMoveToNextStage(selectedCandidate.id)}
                        disabled={!getNextStage(selectedCandidate.current_stage)}
                        className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-all text-sm font-medium"
                      >
                        {getNextStage(selectedCandidate.current_stage) 
                          ? `Move to next stage`
                          : 'Final Stage'
                        }
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
                      <Eye size={16} />
                      <span>View-only access for this stage</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                      Email
                    </div>
                    <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                      <Mail size={16} className="text-gray-400" />
                      <a href={`mailto:${selectedCandidate.email}`} className="hover:text-purple-600 dark:hover:text-purple-400">
                        {selectedCandidate.email}
                      </a>
                    </div>
                  </div>

                  {selectedCandidate.phone && (
                    <div>
                      <div className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                        Phone
                      </div>
                      <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                        <Phone size={16} className="text-gray-400" />
                        <a href={`tel:${selectedCandidate.phone}`} className="hover:text-purple-600 dark:hover:text-purple-400">
                          {selectedCandidate.phone}
                        </a>
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                      Source
                    </div>
                    <div className="text-gray-900 dark:text-white capitalize">
                      {selectedCandidate.source}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                      Applied Date
                    </div>
                    <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                      <Calendar size={16} className="text-gray-400" />
                      {new Date(selectedCandidate.created_at).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </div>
                  </div>
                </div>

                {selectedCandidate.resume_url && (
                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <a
                      href={selectedCandidate.resume_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors"
                    >
                      <Download size={16} />
                      Download Resume
                    </a>
                  </div>
                )}
              </div>

              {/* Resume Preview */}
              {selectedCandidate.resume_url && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
                  <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText size={20} className="text-purple-500" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Resume Preview</h3>
                      </div>
                      <a
                        href={selectedCandidate.resume_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 flex items-center gap-1"
                      >
                        <Download size={14} />
                        Download
                      </a>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    {selectedCandidate.resume_url.toLowerCase().endsWith('.pdf') ? (
                      <div className="relative w-full" style={{ height: '800px' }}>
                        <iframe
                          src={`${selectedCandidate.resume_url}#toolbar=0`}
                          className="w-full h-full border border-gray-200 dark:border-gray-700 rounded"
                          title="Resume Preview"
                          sandbox="allow-same-origin"
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <FileText size={48} className="text-gray-300 dark:text-gray-600 mb-4" />
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                          Preview not available for this file type
                        </p>
                        <a
                          href={selectedCandidate.resume_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-lg transition-all"
                        >
                          <Download size={16} />
                          Download Resume
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Interview Scheduling */}
              <InterviewScheduling
                candidateId={selectedCandidate.id}
                jobId={jobId!}
                currentStage={selectedCandidate.current_stage}
                stages={stages}
                isViewOnly={isViewOnlyForUser(selectedCandidate.current_stage)}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 p-6 text-center">
              <Users size={64} className="mb-4 text-gray-300 dark:text-gray-600" />
              <p className="text-lg font-medium">Select a candidate to view details</p>
              <p className="text-sm mt-2">Click on any candidate from the list to see their full profile</p>
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
