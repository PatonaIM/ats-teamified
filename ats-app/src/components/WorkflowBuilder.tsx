import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface PipelineStage {
  id: number;
  jobId: number;
  stageName: string;
  stageOrder: number;
  isDefault: boolean;
  config: Record<string, any>;
  createdAt: string;
}

const FIXED_BOTTOM_STAGES = ['Offer', 'Offer Accepted'];

interface SortableStageCardProps {
  stage: PipelineStage;
  index: number;
  onEdit: (stage: PipelineStage) => void;
  onDelete: (stage: PipelineStage) => void;
}

function SortableStageCard({ stage, index, onEdit, onDelete }: SortableStageCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stage.id, disabled: stage.isDefault });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border rounded-lg p-4 ${
        stage.isDefault
          ? 'bg-gray-50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600'
          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 cursor-move'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          {!stage.isDefault && (
            <div
              {...attributes}
              {...listeners}
              className="flex-shrink-0 mt-1 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
              </svg>
            </div>
          )}
          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
            stage.isDefault
              ? 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
              : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
          }`}>
            {index + 1}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              {stage.stageName}
            </h3>
            {stage.isDefault && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 mt-1">
                Fixed Stage
              </span>
            )}
            {stage.config?.description && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {stage.config.description}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-1 ml-2">
          <button
            onClick={() => onEdit(stage)}
            className="p-1.5 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
            title="Edit stage"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          {!stage.isDefault && (
            <button
              onClick={() => onDelete(stage)}
              className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              title="Delete stage"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function WorkflowBuilder() {
  const { jobId, templateId } = useParams<{ jobId?: string; templateId?: string }>();
  const navigate = useNavigate();
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [newStageName, setNewStageName] = useState<string>('');
  const [isAddingStage, setIsAddingStage] = useState<boolean>(false);
  const [candidateCounts, setCandidateCounts] = useState<Record<number, number>>({});
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editingStage, setEditingStage] = useState<PipelineStage | null>(null);
  const [editStageName, setEditStageName] = useState<string>('');
  const [editStageDescription, setEditStageDescription] = useState<string>('');
  
  const isTemplateMode = !!templateId;
  const entityId = templateId || jobId;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchStages = async () => {
    try {
      setLoading(true);
      console.log('[WorkflowBuilder] Fetching stages, templateId:', templateId, 'jobId:', jobId);
      
      let response;
      if (isTemplateMode) {
        const url = `/api/pipeline-templates/${templateId}`;
        console.log('[WorkflowBuilder] Fetching template from:', url);
        response = await fetch(url);
        console.log('[WorkflowBuilder] Response received:', response.ok, response.status);
      } else {
        console.log('[WorkflowBuilder] Job mode, fetching:', `/api/jobs/${jobId}/pipeline-stages`);
        response = await fetch(`/api/jobs/${jobId}/pipeline-stages`);
        console.log('[WorkflowBuilder] Response received:', response.ok, response.status);
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[WorkflowBuilder] Error response:', errorText);
        throw new Error(`Failed to fetch pipeline stages: ${response.status}`);
      }

      const data = await response.json();
      console.log('[WorkflowBuilder] Data received, keys:', Object.keys(data));
      console.log('[WorkflowBuilder] Data stages count:', data.stages?.length || 0);
      
      if (isTemplateMode) {
        const stagesList = data.stages || [];
        console.log('[WorkflowBuilder] Template mode - mapping', stagesList.length, 'stages');
        const templateStages = stagesList.map((stage: any) => ({
          id: stage.id,
          jobId: 0,
          stageName: stage.stage_name,
          stageOrder: stage.stage_order,
          isDefault: stage.stage_type === 'fixed',
          config: stage.stage_config || {},
          createdAt: ''
        }));
        console.log('[WorkflowBuilder] Setting stages:', templateStages.length);
        setStages(templateStages);
        console.log('[WorkflowBuilder] Stages set successfully');
      } else {
        console.log('[WorkflowBuilder] Job mode - setting stages');
        setStages(data.stages);
        await fetchCandidateCounts(data.stages);
      }
      
      setError(null);
      console.log('[WorkflowBuilder] Fetch complete, clearing loading state');
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
    console.log('[WorkflowBuilder] useEffect triggered, entityId:', entityId, 'isTemplateMode:', isTemplateMode);
    if (entityId) {
      fetchStages();
    } else {
      console.error('[WorkflowBuilder] No entityId available!');
      setError('No template or job ID provided');
      setLoading(false);
    }
  }, [entityId, isTemplateMode]);

  const handleAddStage = async () => {
    if (!newStageName.trim()) {
      return;
    }

    setIsAddingStage(true);

    try {
      const firstBottomStageIndex = stages.findIndex(s => 
        FIXED_BOTTOM_STAGES.includes(s.stageName)
      );
      
      const newOrder = firstBottomStageIndex !== -1 ? firstBottomStageIndex : stages.length;

      const url = isTemplateMode
        ? `/api/pipeline-templates/${templateId}/stages`
        : `/api/jobs/${jobId}/pipeline-stages`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage_name: newStageName.trim(),
          stage_order: newOrder,
          stage_type: 'custom',
          stage_config: {}
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || 'Failed to add stage');
      }

      setNewStageName('');
      await fetchStages();
    } catch (err: any) {
      console.error('[Workflow Builder] Error adding stage:', err);
      setError(err.message);
    } finally {
      setIsAddingStage(false);
    }
  };

  const handleDeleteStage = async (stage: PipelineStage) => {
    if (!isTemplateMode && candidateCounts[stage.id] > 0) {
      alert(`Cannot delete stage "${stage.stageName}": ${candidateCounts[stage.id]} candidate(s) are currently in this stage.`);
      return;
    }

    if (!confirm(`Are you sure you want to delete the stage "${stage.stageName}"?`)) {
      return;
    }

    try {
      const url = isTemplateMode
        ? `/api/pipeline-templates/${templateId}/stages/${stage.id}`
        : `/api/jobs/${jobId}/pipeline-stages/${stage.id}`;
      
      const response = await fetch(url, {
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

  const handleEditStage = (stage: PipelineStage) => {
    setEditingStage(stage);
    setEditStageName(stage.stageName);
    setEditStageDescription(stage.config?.description || '');
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingStage || !editStageName.trim()) {
      alert('Please enter a stage name');
      return;
    }

    try {
      const updatedConfig = {
        ...editingStage.config,
        description: editStageDescription.trim()
      };

      const url = isTemplateMode
        ? `/api/pipeline-templates/${templateId}/stages/${editingStage.id}`
        : `/api/jobs/${jobId}/pipeline-stages/${editingStage.id}`;

      const response = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage_name: editStageName.trim(),
          stage_config: updatedConfig
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update stage');
      }

      setIsEditModalOpen(false);
      setEditingStage(null);
      setEditStageName('');
      setEditStageDescription('');
      await fetchStages();
    } catch (err: any) {
      console.error('[Workflow Builder] Error updating stage:', err);
      alert(`Failed to update stage: ${err.message}`);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = stages.findIndex(s => s.id === active.id);
    const newIndex = stages.findIndex(s => s.id === over.id);

    const movedStage = stages[oldIndex];
    if (movedStage.isDefault) {
      alert('Fixed stages cannot be reordered');
      return;
    }

    const targetStage = stages[newIndex];
    if (targetStage.isDefault) {
      alert('Cannot move stages into fixed stage positions');
      return;
    }

    const reorderedStages = arrayMove(stages, oldIndex, newIndex);

    const fixedStageIndices = new Map<number, number>();
    stages.forEach((stage, idx) => {
      if (stage.isDefault) {
        fixedStageIndices.set(stage.id, idx);
      }
    });

    for (const [stageId, originalIdx] of fixedStageIndices) {
      const currentIdx = reorderedStages.findIndex(s => s.id === stageId);
      if (currentIdx !== originalIdx) {
        alert('Cannot reorder: this would move fixed stages out of position');
        return;
      }
    }

    setStages(reorderedStages);

    try {
      const stageOrders = reorderedStages.map((stage, index) => ({
        id: stage.id,
        stage_order: index
      }));

      const url = isTemplateMode
        ? `/api/pipeline-templates/${templateId}/stages/reorder`
        : `/api/jobs/${jobId}/pipeline-stages/reorder`;

      const response = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stages: stageOrders })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to reorder stages');
      }

      await fetchStages();
    } catch (err: any) {
      console.error('[Workflow Builder] Error reordering stages:', err);
      alert(`Failed to reorder stages: ${err.message}`);
      await fetchStages();
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Error Loading Workflow</h2>
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <button
            onClick={() => navigate(-1)}
            className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 mb-4 inline-flex items-center text-sm font-medium"
          >
            ← Back to Templates
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Workflow Configuration</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Configure your hiring pipeline stages and workflow
          </p>
        </div>
      </div>

      {/* Two Panel Layout */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* LEFT PANEL: Stages List */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Pipeline Stages</h2>
            
            {/* Inline Add Stage Input */}
            <div className="mb-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newStageName}
                  onChange={(e) => setNewStageName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddStage()}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  placeholder="Type stage name and press Enter..."
                  disabled={isAddingStage}
                />
                <button
                  onClick={handleAddStage}
                  disabled={!newStageName.trim() || isAddingStage}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAddingStage ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Adding...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add
                    </>
                  )}
                </button>
              </div>
            </div>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={stages.map(s => s.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {stages.map((stage, index) => (
                    <SortableStageCard
                      key={stage.id}
                      stage={stage}
                      index={index}
                      onEdit={handleEditStage}
                      onDelete={handleDeleteStage}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>

          {/* RIGHT PANEL: Visual Workflow */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Visual Workflow</h2>
            
            <div className="flex flex-col items-center space-y-4">
              {stages.map((stage, index) => (
                <div key={stage.id} className="w-full">
                  {/* Stage Box */}
                  <div className={`relative rounded-lg p-4 border-2 ${
                    stage.isDefault
                      ? 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50'
                      : 'border-purple-400 dark:border-purple-600 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                        stage.isDefault
                          ? 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                          : 'bg-purple-500 text-white'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {stage.stageName}
                        </h3>
                        {stage.config?.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {stage.config.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Arrow */}
                  {index < stages.length - 1 && (
                    <div className="flex justify-center my-2">
                      <svg className="w-6 h-6 text-purple-400 dark:text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}

              {/* Completion Badge */}
              <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border-2 border-green-400 dark:border-green-600 rounded-lg w-full">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-green-900 dark:text-green-300">Hired!</h3>
                    <p className="text-xs text-green-700 dark:text-green-400">Candidate successfully onboarded</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Stage Modal */}
      {isEditModalOpen && editingStage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Edit Stage
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Stage Name
              </label>
              <input
                type="text"
                value={editStageName}
                onChange={(e) => setEditStageName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="e.g., Technical Interview"
                autoFocus
                disabled={editingStage.isDefault}
              />
              {editingStage.isDefault && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Fixed stages cannot be renamed
                </p>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={editStageDescription}
                onChange={(e) => setEditStageDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                placeholder="Brief description of this stage..."
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingStage(null);
                  setEditStageName('');
                  setEditStageDescription('');
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
