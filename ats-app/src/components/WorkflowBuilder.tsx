import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
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

interface StageTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: 'custom';
}

const FIXED_BOTTOM_STAGES = ['Offer', 'Offer Accepted'];

const STAGE_TEMPLATES: StageTemplate[] = [
  { id: 'phone-screen', name: 'Phone Screen', description: 'Initial phone interview', icon: '📞', type: 'custom' },
  { id: 'tech-interview', name: 'Technical Interview', description: 'Technical assessment', icon: '💻', type: 'custom' },
  { id: 'culture-fit', name: 'Culture Fit', description: 'Team culture assessment', icon: '🤝', type: 'custom' },
  { id: 'panel-interview', name: 'Panel Interview', description: 'Multi-person interview', icon: '👥', type: 'custom' },
  { id: 'skill-test', name: 'Skills Test', description: 'Practical skills assessment', icon: '✍️', type: 'custom' },
  { id: 'reference-check', name: 'Reference Check', description: 'Verify references', icon: '📋', type: 'custom' },
  { id: 'background-check', name: 'Background Check', description: 'Background verification', icon: '🔍', type: 'custom' },
  { id: 'final-interview', name: 'Final Interview', description: 'Final decision interview', icon: '🎯', type: 'custom' },
];

interface PaletteItemProps {
  template: StageTemplate;
  onClick: (template: StageTemplate) => void;
}

function PaletteItem({ template, onClick }: PaletteItemProps) {
  return (
    <div
      onClick={() => onClick(template)}
      className="bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 border-2 border-dashed border-purple-300 dark:border-purple-700 rounded-lg p-4 cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all"
    >
      <div className="flex items-center gap-3">
        <div className="text-3xl">{template.icon}</div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
            {template.name}
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {template.description}
          </p>
        </div>
        <div className="text-purple-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </div>
      </div>
    </div>
  );
}

interface SortableWorkflowStageProps {
  stage: PipelineStage;
  index: number;
  onConfigure: (stage: PipelineStage) => void;
  onDelete: (stage: PipelineStage) => void;
}

function SortableWorkflowStage({ stage, index, onConfigure, onDelete }: SortableWorkflowStageProps) {
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

  const isFixedBottom = FIXED_BOTTOM_STAGES.includes(stage.stageName);

  return (
    <div ref={setNodeRef} style={style} className="w-full">
      <div className={`relative rounded-lg p-4 border-2 transition-all ${
        isFixedBottom
          ? 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50'
          : 'border-purple-400 dark:border-purple-600 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 hover:shadow-md'
      }`}>
        <div className="flex items-center gap-3">
          {!isFixedBottom && (
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
              </svg>
            </div>
          )}
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
            isFixedBottom
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
          <div className="flex items-center gap-2">
            <button
              onClick={() => onConfigure(stage)}
              className="p-2 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
              title="Configure stage"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            {!isFixedBottom && (
              <button
                onClick={() => onDelete(stage)}
                className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                title="Delete stage"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {index < (stage.stageOrder === 0 ? 999 : 999) && (
        <div className="flex justify-center my-2">
          <svg className="w-6 h-6 text-purple-400 dark:text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      )}
    </div>
  );
}

export function WorkflowBuilder() {
  const { jobId, templateId } = useParams<{ jobId?: string; templateId?: string }>();
  const navigate = useNavigate();
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState<boolean>(false);
  const [configuringStage, setConfiguringStage] = useState<PipelineStage | null>(null);
  const [configStageName, setConfigStageName] = useState<string>('');
  const [configStageDescription, setConfigStageDescription] = useState<string>('');
  const [candidateCounts, setCandidateCounts] = useState<Record<number, number>>({});
  
  const isTemplateMode = !!templateId;
  const entityId = templateId || jobId;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchStages = useCallback(async () => {
    console.log('[WorkflowBuilder] fetchStages called, templateId:', templateId, 'isTemplateMode:', isTemplateMode);
    try {
      setLoading(true);
      
      let response;
      if (isTemplateMode) {
        console.log('[WorkflowBuilder] Fetching template:', templateId);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        try {
          response = await fetch(`/api/pipeline-templates/${templateId}`, {
            signal: controller.signal
          });
          clearTimeout(timeoutId);
        } catch (fetchError: any) {
          if (fetchError.name === 'AbortError') {
            console.error('[WorkflowBuilder] Fetch timed out after 5 seconds');
            throw new Error('Request timed out');
          }
          throw fetchError;
        }
      } else {
        console.log('[WorkflowBuilder] Fetching job pipeline:', jobId);
        response = await fetch(`/api/jobs/${jobId}/pipeline-stages`);
      }
      
      console.log('[WorkflowBuilder] Response received, ok:', response.ok, 'status:', response.status);
      if (!response.ok) {
        throw new Error(`Failed to fetch pipeline stages: ${response.status}`);
      }

      const data = await response.json();
      console.log('[WorkflowBuilder] Data received, has stages:', !!data.stages);
      
      if (isTemplateMode) {
        const stagesList = data.stages || [];
        console.log('[WorkflowBuilder] Mapping', stagesList.length, 'template stages');
        const templateStages = stagesList.map((stage: any) => ({
          id: stage.id,
          jobId: 0,
          stageName: stage.stage_name,
          stageOrder: stage.stage_order,
          isDefault: stage.stage_type === 'fixed',
          config: stage.stage_config || {},
          createdAt: ''
        }));
        setStages(templateStages);
        console.log('[WorkflowBuilder] Stages set:', templateStages.length);
      } else {
        setStages(data.stages);
        
        // Fetch candidate counts for job mode
        const counts: Record<number, number> = {};
        await Promise.all(
          data.stages.map(async (stage: PipelineStage) => {
            try {
              const response = await fetch(`/api/jobs/${jobId}/pipeline-stages/${stage.id}/candidate-count`);
              if (response.ok) {
                const countData = await response.json();
                counts[stage.id] = countData.candidateCount;
              }
            } catch (err) {
              counts[stage.id] = 0;
            }
          })
        );
        setCandidateCounts(counts);
      }
      
      setError(null);
    } catch (err: any) {
      console.error('[Workflow Builder] Error fetching stages:', err);
      setError(err.message);
    } finally {
      console.log('[WorkflowBuilder] Setting loading to false');
      setLoading(false);
    }
  }, [isTemplateMode, templateId, jobId]);

  useEffect(() => {
    console.log('[WorkflowBuilder] useEffect triggered, entityId:', entityId, 'isTemplateMode:', isTemplateMode);
    
    if (!entityId) {
      console.log('[WorkflowBuilder] No entityId, showing error');
      setError('No template or job ID provided');
      setLoading(false);
      return;
    }

    fetchStages();
  }, [entityId, isTemplateMode, fetchStages]);

  const handleDragStart = (_event: DragStartEvent) => {
    // Track active drag item if needed for visual feedback
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
      return;
    }

    const targetStage = stages[newIndex];
    if (targetStage.isDefault) {
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
        throw new Error('Failed to reorder stages');
      }

      await fetchStages();
    } catch (err: any) {
      await fetchStages();
    }
  };

  const handleAddStageFromTemplate = async (template: StageTemplate) => {
    setConfigStageName(template.name);
    setConfigStageDescription(template.description);
    setConfiguringStage({
      id: -1,
      jobId: 0,
      stageName: template.name,
      stageOrder: -1,
      isDefault: false,
      config: { description: template.description },
      createdAt: ''
    });
    setIsConfigModalOpen(true);
  };

  const handleSaveStageConfig = async () => {
    if (!configStageName.trim()) {
      return;
    }

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
          stage_name: configStageName.trim(),
          stage_order: newOrder,
          stage_type: 'custom',
          stage_config: {
            description: configStageDescription.trim()
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add stage');
      }

      setIsConfigModalOpen(false);
      setConfiguringStage(null);
      setConfigStageName('');
      setConfigStageDescription('');
      await fetchStages();
    } catch (err: any) {
      console.error('[Workflow Builder] Error adding stage:', err);
      setError(err.message);
    }
  };

  const handleConfigureStage = (stage: PipelineStage) => {
    setConfiguringStage(stage);
    setConfigStageName(stage.stageName);
    setConfigStageDescription(stage.config?.description || '');
    setIsConfigModalOpen(true);
  };

  const handleUpdateStageConfig = async () => {
    if (!configuringStage || !configStageName.trim()) {
      return;
    }

    try {
      const updatedConfig = {
        ...configuringStage.config,
        description: configStageDescription.trim()
      };

      const url = isTemplateMode
        ? `/api/pipeline-templates/${templateId}/stages/${configuringStage.id}`
        : `/api/jobs/${jobId}/pipeline-stages/${configuringStage.id}`;

      const response = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage_name: configStageName.trim(),
          stage_config: updatedConfig
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update stage');
      }

      setIsConfigModalOpen(false);
      setConfiguringStage(null);
      setConfigStageName('');
      setConfigStageDescription('');
      await fetchStages();
    } catch (err: any) {
      console.error('[Workflow Builder] Error updating stage:', err);
      setError(err.message);
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
        throw new Error('Failed to delete stage');
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Workflow Builder</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Click stages from the library to add them to your workflow
          </p>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* Two Panel Layout */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* LEFT PANEL: Stage Library/Palette */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Stage Library</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Click a stage to add it to your workflow →
              </p>
              
              <div className="grid grid-cols-1 gap-3">
                {STAGE_TEMPLATES.map((template) => (
                  <PaletteItem 
                    key={template.id} 
                    template={template} 
                    onClick={handleAddStageFromTemplate}
                  />
                ))}
              </div>
            </div>

            {/* RIGHT PANEL: Workflow Canvas */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Workflow</h2>
              
              <SortableContext
                items={stages.map(s => s.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="flex flex-col items-center space-y-0">
                  {stages.length === 0 ? (
                    <div className="text-center py-12">
                      <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      <p className="text-gray-500 dark:text-gray-400">
                        Click stages from the library to add them to your workflow
                      </p>
                    </div>
                  ) : (
                    stages.map((stage, index) => (
                      <SortableWorkflowStage
                        key={stage.id}
                        stage={stage}
                        index={index}
                        onConfigure={handleConfigureStage}
                        onDelete={handleDeleteStage}
                      />
                    ))
                  )}
                </div>
              </SortableContext>

              {/* Completion Badge */}
              {stages.length > 0 && (
                <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border-2 border-green-400 dark:border-green-600 rounded-lg">
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
              )}
            </div>
          </div>
        </div>

      </DndContext>

      {/* Configuration Modal */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {configuringStage && configuringStage.id !== -1 ? 'Configure Stage' : 'Add Stage'}
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Stage Name
              </label>
              <input
                type="text"
                value={configStageName}
                onChange={(e) => setConfigStageName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="e.g., Technical Interview"
                autoFocus
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={configStageDescription}
                onChange={(e) => setConfigStageDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                placeholder="Brief description of this stage..."
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setIsConfigModalOpen(false);
                  setConfiguringStage(null);
                  setConfigStageName('');
                  setConfigStageDescription('');
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={configuringStage && configuringStage.id !== -1 ? handleUpdateStageConfig : handleSaveStageConfig}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                {configuringStage && configuringStage.id !== -1 ? 'Save Changes' : 'Add Stage'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
