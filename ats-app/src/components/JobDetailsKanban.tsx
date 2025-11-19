import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DndContext, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { ArrowLeft, Briefcase, MapPin, DollarSign, Users } from 'lucide-react';
import { apiRequest } from '../utils/api';
import StageColumn from './StageColumn';
import CandidateCard from './CandidateCard';
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
  const [activeCandidateId, setActiveCandidateId] = useState<string | null>(null);
  
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

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    fetchJobData();
  }, [jobId]);

  const fetchJobData = async () => {
    try {
      setLoading(true);
      console.log('[JobDetailsKanban] Fetching data for job:', jobId);
      
      const [jobData, stagesData, candidatesData] = await Promise.all([
        apiRequest<Job>(`/api/jobs/${jobId}`),
        apiRequest<{ stages: PipelineStage[] }>(`/api/jobs/${jobId}/pipeline-stages`),
        apiRequest<{ candidates: Candidate[] }>(`/api/candidates?jobId=${jobId}`)
      ]);
      
      console.log('[JobDetailsKanban] Data received:', {
        hasJob: !!jobData,
        jobTitle: jobData?.title,
        stagesCount: stagesData.stages?.length || 0,
        candidatesCount: candidatesData.candidates?.length || 0
      });
      
      setJob(jobData as Job);
      setStages(stagesData.stages || []);
      setCandidates((candidatesData.candidates || []).filter(c => c.status === 'active'));
      
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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      return;
    }

    const candidateId = active.id as string;
    const newStageId = over.id as string;
    const newStage = stages.find(s => s.id === newStageId);
    
    if (!newStage) return;

    const candidate = candidates.find(c => c.id === candidateId);
    if (!candidate || candidate.current_stage === newStage.stageName) {
      return;
    }

    const originalCandidates = [...candidates];
    
    setCandidates(candidates.map(c => 
      c.id === candidateId 
        ? { ...c, current_stage: newStage.stageName }
        : c
    ));

    try {
      await apiRequest(`/api/candidates/${candidateId}/stage`, {
        method: 'PUT',
        body: JSON.stringify({
          stage: newStage.stageName,
          userId: null,
          notes: `Moved via drag-and-drop to ${newStage.stageName}`
        })
      });
    } catch (error) {
      console.error('Error moving candidate:', error);
      setCandidates(originalCandidates);
      alert('Failed to move candidate. Please try again.');
    }
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

    try {
      await apiRequest(`/api/candidates/${candidateId}/stage`, {
        method: 'PUT',
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

        try {
          await apiRequest(`/api/candidates/${candidateId}/disqualify`, {
            method: 'PATCH',
            body: JSON.stringify({
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

  const getEmploymentTypeColor = (type: string) => {
    const colors = {
      contract: 'text-blue-600 bg-blue-50',
      partTime: 'text-green-600 bg-green-50',
      fullTime: 'text-orange-600 bg-orange-50',
      eor: 'text-purple-600 bg-purple-50'
    };
    return colors[type as keyof typeof colors] || 'text-gray-600 bg-gray-50';
  };

  const getEmploymentTypeLabel = (type: string) => {
    const labels = {
      contract: 'Contract',
      partTime: 'Part-Time',
      fullTime: 'Full-Time',
      eor: 'EOR'
    };
    return labels[type as keyof typeof labels] || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-gray-600">Job not found</p>
          <button
            onClick={() => navigate('/dashboard/jobs')}
            className="mt-4 text-purple-600 hover:text-purple-700"
          >
            Back to Jobs
          </button>
        </div>
      </div>
    );
  }

  const activeCandidate = activeCandidateId 
    ? candidates.find(c => c.id === activeCandidateId) 
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-6 py-4">
          <button
            onClick={() => navigate('/dashboard/jobs')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft size={20} />
            Back to Jobs
          </button>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Briefcase size={16} />
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEmploymentTypeColor(job.employment_type)}`}>
                    {getEmploymentTypeLabel(job.employment_type)}
                  </span>
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
      </div>

      <div className="p-6">
        <DndContext
          sensors={sensors}
          onDragEnd={handleDragEnd}
          onDragStart={(event) => setActiveCandidateId(event.active.id as string)}
        >
          <div className="flex gap-4 overflow-x-auto pb-4">
            {stages.map((stage, index) => (
              <StageColumn
                key={stage.id}
                stage={stage}
                candidates={getCandidatesForStage(stage.stageName)}
                onDisqualify={handleDisqualify}
                onMoveToNextStage={handleMoveToNextStage}
                isLastStage={index === stages.length - 1}
                enableDragDrop={true}
              />
            ))}
          </div>

          <DragOverlay>
            {activeCandidate && (
              <CandidateCard
                candidate={activeCandidate}
                onDisqualify={() => {}}
                onMoveToNextStage={() => {}}
              />
            )}
          </DragOverlay>
        </DndContext>
      </div>

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText="Confirm"
        cancelText="Cancel"
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        confirmVariant={confirmModal.variant}
      />
    </div>
  );
}
