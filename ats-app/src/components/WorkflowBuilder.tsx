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
  useDraggable,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { StageConfigPanel } from './workflow-builder/StageConfigModal';

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

// Stage Library is now completely empty - clients must create their own custom stages
// No default stage templates are provided
const STAGE_TEMPLATES: StageTemplate[] = [];

interface PaletteItemProps {
  template: StageTemplate;
  onClick: (template: StageTemplate) => void;
}

function PaletteItem({ template, onClick }: PaletteItemProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `palette-${template.id}`,
    data: { type: 'palette-item', template }
  });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <button
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => !isDragging && onClick(template)}
      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-3 cursor-grab active:cursor-grabbing hover:border-purple-400 dark:hover:border-purple-600 hover:shadow-sm transition-all text-left group"
    >
      <div className="flex items-start gap-2">
        <div className="text-2xl shrink-0">{template.icon}</div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 dark:text-white text-sm truncate">
            {template.name}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
            {template.description}
          </p>
        </div>
        <div className="text-gray-300 dark:text-gray-600 group-hover:text-purple-500 dark:group-hover:text-purple-400 transition-colors shrink-0">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </div>
      </div>
    </button>
  );
}

interface SortableWorkflowStageProps {
  stage: PipelineStage;
  index: number;
  onConfigure: (stage: PipelineStage) => void;
  onDelete: (stage: PipelineStage) => void;
  isSelected: boolean;
}

function SortableWorkflowStage({ stage, index, onConfigure, onDelete, isSelected }: SortableWorkflowStageProps) {
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

  const handleCardClick = () => {
    if (!isDragging && !isFixedBottom) {
      onConfigure(stage);
    }
  };

  return (
    <div ref={setNodeRef} style={style} className="w-full">
      <div 
        onClick={handleCardClick}
        className={`relative rounded-md p-2 border-2 transition-all w-full cursor-pointer ${
        isSelected
          ? 'border-purple-500 dark:border-purple-400 bg-purple-50 dark:bg-purple-900/20 shadow-md ring-2 ring-purple-200 dark:ring-purple-800'
          : isFixedBottom
            ? 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 hover:border-gray-400 dark:hover:border-gray-500'
            : 'border-purple-200 dark:border-purple-800 bg-white dark:bg-gray-800 hover:border-purple-400 dark:hover:border-purple-600 hover:shadow-md'
      }`}>
        <div className="flex flex-col gap-2">
          {/* Header: Number badge and drag handle */}
          <div className="flex items-center justify-between">
            <div className={`w-7 h-7 rounded flex items-center justify-center text-sm font-semibold ${
              isFixedBottom
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
            }`}>
              {index + 1}
            </div>
            {!isFixedBottom && (
              <div
                {...attributes}
                {...listeners}
                onClick={(e) => e.stopPropagation()}
                className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                </svg>
              </div>
            )}
          </div>

          {/* Title and badge */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1 line-clamp-2 leading-tight">
              {stage.stageName}
            </h3>
            <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${
              isFixedBottom
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
            }`}>
              {isFixedBottom ? 'Fixed' : 'Custom'}
            </span>
          </div>

          {/* Description */}
          {stage.config?.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 min-h-[2rem]">
              {stage.config.description}
            </p>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 pt-1.5 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onConfigure(stage);
              }}
              className="flex-1 px-2 py-1 text-xs font-medium text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded transition-colors"
              title="Configure"
            >
              Configure
            </button>
            {!isFixedBottom && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(stage);
                }}
                className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                title="Delete"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {index < (stage.stageOrder === 0 ? 999 : 999) && (
        <div className="flex justify-center my-1.5">
          <svg className="w-5 h-5 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      )}
    </div>
  );
}

interface WorkflowBuilderProps {
  templateId?: number;
  jobId?: number;
  hideBackButton?: boolean;
}

export function WorkflowBuilder({ templateId: propTemplateId, jobId: propJobId, hideBackButton = false }: WorkflowBuilderProps = {}) {
  const params = useParams<{ jobId?: string; templateId?: string }>();
  const navigate = useNavigate();
  
  // Use props if provided, otherwise fall back to URL params
  const templateId = propTemplateId || (params.templateId ? parseInt(params.templateId) : undefined);
  const jobId = propJobId || (params.jobId ? parseInt(params.jobId) : undefined);
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [configuringStage, setConfiguringStage] = useState<PipelineStage | null>(null);
  const [candidateCounts, setCandidateCounts] = useState<Record<number, number>>({});
  const [templateName, setTemplateName] = useState<string>('');
  
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
        response = await fetch(`/api/pipeline-templates/${templateId}`);
        console.log('[WorkflowBuilder] Fetch completed');
      } else {
        console.log('[WorkflowBuilder] Fetching job pipeline:', jobId);
        response = await fetch(`/api/jobs/${jobId}/pipeline-stages`);
      }
      
      console.log('[WorkflowBuilder] Response received, ok:', response.ok, 'status:', response.status);
      if (!response.ok) {
        throw new Error(`Failed to fetch pipeline stages: ${response.status}`);
      }

      console.log('[WorkflowBuilder] About to parse JSON...');
      const data = await response.json();
      console.log('[WorkflowBuilder] Data received, has stages:', !!data.stages, 'stage count:', data.stages?.length);
      
      if (isTemplateMode) {
        // Store template name
        setTemplateName(data.name || 'Untitled Template');
        
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

  // Reconcile configuringStage when stages update (keep selection by ID)
  useEffect(() => {
    if (configuringStage && stages.length > 0) {
      // Skip reconciliation for draft stages (id === -1)
      if (configuringStage.id !== -1) {
        const updatedStage = stages.find(s => s.id === configuringStage.id);
        if (updatedStage && updatedStage !== configuringStage) {
          setConfiguringStage(updatedStage);
        } else if (!updatedStage) {
          // Stage was deleted, clear selection
          setConfiguringStage(null);
        }
      }
    } else if (!configuringStage && stages.length > 0) {
      // Auto-select first configurable (non-fixed) stage on initial load
      const firstConfigurable = stages.find(s => !FIXED_BOTTOM_STAGES.includes(s.stageName));
      if (firstConfigurable) {
        setConfiguringStage(firstConfigurable);
      }
    }
  }, [stages]);

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

    if (!over) {
      return;
    }

    // Check if dragging from palette (adding new stage)
    if (active.data.current?.type === 'palette-item') {
      const template = active.data.current.template as StageTemplate;
      // Trigger the add stage flow with configuration modal
      handleAddStageFromTemplate(template);
      return;
    }

    // Otherwise, handle reordering of existing stages
    if (active.id === over.id) {
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
    // For custom stages, open configuration with empty/placeholder name
    if (template.id === 'custom') {
      setConfiguringStage({
        id: -1,
        jobId: 0,
        stageName: 'New Stage',
        stageOrder: -1,
        isDefault: false,
        config: { description: 'Custom workflow stage' },
        createdAt: ''
      });
    } else {
      // For template stages, use the template name
      setConfiguringStage({
        id: -1,
        jobId: 0,
        stageName: template.name,
        stageOrder: -1,
        isDefault: false,
        config: { description: template.description },
        createdAt: ''
      });
    }
  };

  const handleConfigureStage = (stage: PipelineStage) => {
    setConfiguringStage(stage);
  };

  const handleUpdateStageConfig = async (config: Record<string, any>, stageName?: string) => {
    if (!configuringStage) {
      return;
    }

    try {
      if (configuringStage.id === -1) {
        // Adding a new stage
        const firstBottomStageIndex = stages.findIndex(s => 
          FIXED_BOTTOM_STAGES.includes(s.stageName)
        );
        const newOrder = firstBottomStageIndex !== -1 ? firstBottomStageIndex : stages.length;

        // Use the provided stage name or fall back to the configuring stage name
        const finalStageName = stageName?.trim() || configuringStage.stageName;

        const url = isTemplateMode
          ? `/api/pipeline-templates/${templateId}/stages`
          : `/api/jobs/${jobId}/pipeline-stages`;

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            stage_name: finalStageName,
            stage_order: newOrder,
            stage_type: 'custom',
            stage_config: config
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || errorData.error || 'Failed to add stage');
        }
        
        // Get the created stage from response and select it immediately
        const responseData = await response.json();
        const createdStage: PipelineStage = {
          id: responseData.id,
          jobId: responseData.job_id || 0,
          stageName: responseData.stage_name,
          stageOrder: responseData.stage_order,
          isDefault: responseData.stage_type === 'fixed',
          config: responseData.stage_config || {},
          createdAt: responseData.created_at || ''
        };
        
        // Update selection to the newly created stage immediately
        setConfiguringStage(createdStage);
      } else {
        // Updating existing stage
        const url = isTemplateMode
          ? `/api/pipeline-templates/${templateId}/stages/${configuringStage.id}`
          : `/api/jobs/${jobId}/pipeline-stages/${configuringStage.id}`;

        const response = await fetch(url, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            stage_config: config
          })
        });

        if (!response.ok) {
          throw new Error('Failed to update stage');
        }
      }

      await fetchStages();
    } catch (err: any) {
      console.error('[Workflow Builder] Error saving stage:', err);
      setError(err.message);
      throw err;
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
      {!hideBackButton && (
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="px-6 py-3">
            <button
              onClick={() => navigate(-1)}
              className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 mb-1.5 inline-flex items-center text-sm font-medium"
            >
              ← Back
            </button>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                {isTemplateMode && templateName ? templateName : 'Workflow Builder'}
              </h1>
              {isTemplateMode && (
                <span className="text-[11px] font-semibold text-white px-2 py-0.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full shadow-sm">
                  Template
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* Three Panel Layout */}
        <div className="mx-auto px-6 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            
            {/* LEFT PANEL: Stage Library */}
            <div className="lg:col-span-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Stage Library</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{STAGE_TEMPLATES.length} available stages</p>
                </div>
                
                <div className="p-4 space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
                  {/* Add Custom Stage Button */}
                  <button
                    onClick={() => handleAddStageFromTemplate({
                      id: 'custom',
                      name: 'Custom Stage',
                      description: 'Create a custom workflow stage',
                      icon: '⚙️',
                      type: 'custom'
                    })}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 border border-purple-500 dark:border-purple-600 rounded-md p-3 cursor-pointer transition-all text-left group shadow-sm"
                  >
                    <div className="flex items-start gap-2">
                      <div className="text-2xl shrink-0">➕</div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white text-sm truncate">
                          Add Custom Stage
                        </h3>
                        <p className="text-xs text-purple-100 line-clamp-1">
                          Create your own workflow stage
                        </p>
                      </div>
                    </div>
                  </button>
                  
                  {/* Stage Templates */}
                  {STAGE_TEMPLATES.map((template) => (
                    <PaletteItem 
                      key={template.id} 
                      template={template} 
                      onClick={handleAddStageFromTemplate}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* MIDDLE PANEL: Workflow Canvas */}
            <div className="lg:col-span-3">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Workflow Pipeline</h2>
                    <span className="text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/40 px-2 py-0.5 rounded-full">{stages.length} stages</span>
                  </div>
                </div>
                <div className="p-3">
              
              <SortableContext
                items={stages.map(s => s.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="flex flex-col items-center">
                  {stages.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                        No stages yet
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        Click stages from library to add
                      </p>
                    </div>
                  ) : (
                    stages.map((stage, index) => (
                      <div key={stage.id} className="w-full flex flex-col items-center">
                        <SortableWorkflowStage
                          stage={stage}
                          index={index}
                          onConfigure={handleConfigureStage}
                          onDelete={handleDeleteStage}
                          isSelected={configuringStage?.id === stage.id}
                        />
                        {/* Arrow between stages */}
                        {index < stages.length - 1 && (
                          <div className="py-1 flex items-center justify-center">
                            <svg className="w-5 h-5 text-purple-400 dark:text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                            </svg>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </SortableContext>

              {/* Completion Badge */}
              {stages.length > 0 && (
                <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-md bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-green-900 dark:text-green-300">Hired!</h3>
                      <p className="text-xs text-green-700 dark:text-green-400">Candidate successfully onboarded</p>
                    </div>
                  </div>
                </div>
              )}
              </div>
              </div>
            </div>

            {/* RIGHT PANEL: Stage Configuration */}
            <div className="lg:col-span-5">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden sticky top-6">
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Stage Configuration</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {configuringStage ? 'Customize stage settings' : 'Select a stage to configure'}
                  </p>
                </div>

                {configuringStage ? (
                  <div className="p-4 max-h-[calc(100vh-200px)] overflow-y-auto">
                    <StageConfigPanel
                      key={configuringStage.id === -1 ? `draft-${configuringStage.stageName}` : configuringStage.id}
                      stage={configuringStage}
                      onSave={handleUpdateStageConfig}
                    />
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                      No stage selected
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      Click on a stage to view and edit its configuration
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

      </DndContext>
    </div>
  );
}
