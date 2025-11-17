import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { StageCard } from './workflow-builder/StageCard';
import { StageConfigModal } from './workflow-builder/StageConfigModal';

interface PipelineStage {
  id: number;
  jobId: number;
  stageName: string;
  stageOrder: number;
  isDefault: boolean;
  config: Record<string, any>;
  createdAt: string;
}

const FIXED_TOP_STAGES = ['Screening', 'Shortlist', 'Client Endorsement'];
const FIXED_BOTTOM_STAGES = ['Offer', 'Offer Accepted'];

export function WorkflowBuilder() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStage, setSelectedStage] = useState<PipelineStage | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [candidateCounts, setCandidateCounts] = useState<Record<number, number>>({});

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const fetchStages = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/jobs/${jobId}/pipeline-stages`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch pipeline stages');
      }

      const data = await response.json();
      setStages(data.stages);
      setError(null);

      await fetchCandidateCounts(data.stages);
    } catch (err: any) {
      console.error('[Workflow Builder] Error fetching stages:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCandidateCounts = async (stageList: PipelineStage[]) => {
    const counts: Record<number, number> = {};
    
    await Promise.all(
      stageList.map(async (stage) => {
        try {
          const response = await fetch(`/api/jobs/${jobId}/pipeline-stages/${stage.id}/candidate-count`);
          if (response.ok) {
            const data = await response.json();
            counts[stage.id] = data.candidateCount;
          }
        } catch (err) {
          console.error(`Failed to fetch candidate count for stage ${stage.id}:`, err);
          counts[stage.id] = 0;
        }
      })
    );

    setCandidateCounts(counts);
  };

  useEffect(() => {
    if (jobId) {
      fetchStages();
    }
  }, [jobId]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const activeStage = stages.find(s => s.id === active.id);
    const overStage = stages.find(s => s.id === over.id);

    if (!activeStage || !overStage) return;

    if (FIXED_TOP_STAGES.includes(activeStage.stageName) || FIXED_BOTTOM_STAGES.includes(activeStage.stageName)) {
      alert(`Cannot move fixed stage: ${activeStage.stageName}`);
      return;
    }

    const previousStages = [...stages];

    const oldIndex = stages.findIndex(s => s.id === active.id);
    const newIndex = stages.findIndex(s => s.id === over.id);

    const fixedTopCount = FIXED_TOP_STAGES.length;
    const fixedBottomStart = stages.length - FIXED_BOTTOM_STAGES.length;

    if (newIndex < fixedTopCount || newIndex >= fixedBottomStart) {
      alert('Cannot move stages to fixed positions');
      return;
    }

    const reordered = arrayMove([...stages], oldIndex, newIndex);
    reordered.forEach((stage, index) => {
      stage.stageOrder = index;
    });

    setStages(reordered);

    try {
      const stageOrders = reordered.map((stage) => ({
        stageId: stage.id,
        newOrder: stage.stageOrder
      }));

      const response = await fetch(`/api/jobs/${jobId}/pipeline-stages/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stageOrders })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to reorder stages');
      }

      const data = await response.json();
      setStages(data.stages);
    } catch (err: any) {
      console.error('[Workflow Builder] Error persisting reorder:', err);
      alert(`Failed to save stage order: ${err.message}`);
      setStages(previousStages);
    }
  };

  const handleEditStage = (stage: PipelineStage) => {
    setSelectedStage(stage);
    setIsModalOpen(true);
  };

  const handleSaveStageConfig = async (config: Record<string, any>) => {
    if (!selectedStage) return;

    try {
      const response = await fetch(`/api/jobs/${jobId}/pipeline-stages/${selectedStage.id}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save configuration');
      }

      const data = await response.json();
      
      setStages(prev => prev.map(s => s.id === selectedStage.id ? data.stage : s));
      setIsModalOpen(false);
      setSelectedStage(null);
    } catch (err: any) {
      console.error('[Workflow Builder] Error saving config:', err);
      alert(`Failed to save configuration: ${err.message}`);
    }
  };

  const handleDeleteStage = async (stageId: number) => {
    const stage = stages.find(s => s.id === stageId);
    if (!stage) return;

    if (candidateCounts[stageId] > 0) {
      alert(`Cannot delete stage "${stage.stageName}": ${candidateCounts[stageId]} candidate(s) are currently in this stage.`);
      return;
    }

    if (!confirm(`Are you sure you want to delete the stage "${stage.stageName}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/jobs/${jobId}/pipeline-stages/${stageId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete stage');
      }

      await fetchStages();
    } catch (err: any) {
      console.error('[Workflow Builder] Error deleting stage:', err);
      alert(`Failed to delete stage: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading workflow...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-600 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Feature Not Available</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 mb-4 inline-flex items-center"
          >
            ← Back to Job
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Customize Workflow</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Configure your hiring pipeline stages. Drag to reorder (except fixed stages).
          </p>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={stages.map(s => s.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {stages.map((stage) => (
                <StageCard
                  key={stage.id}
                  stage={stage}
                  candidateCount={candidateCounts[stage.id] || 0}
                  onEdit={() => handleEditStage(stage)}
                  onDelete={() => handleDeleteStage(stage.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {isModalOpen && selectedStage && (
          <StageConfigModal
            stage={selectedStage}
            onClose={() => {
              setIsModalOpen(false);
              setSelectedStage(null);
            }}
            onSave={handleSaveStageConfig}
          />
        )}
      </div>
    </div>
  );
}
