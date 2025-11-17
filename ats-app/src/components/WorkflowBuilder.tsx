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
// import { StageConfigPanel } from './workflow-builder/StageConfigModal'; // Temporarily disabled

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
  { id: 'tech-interview', name: 'Technical Interview', description: 'Technical assessment', icon: '💻', type: 'custom' },
  { id: 'culture-fit', name: 'Culture Fit', description: 'Team culture assessment', icon: '🤝', type: 'custom' },
  { id: 'panel-interview', name: 'Panel Interview', description: 'Multi-person interview', icon: '👥', type: 'custom' },
  { id: 'skill-test', name: 'Skills Test', description: 'Practical skills assessment', icon: '✍️', type: 'custom' },
  { id: 'final-interview', name: 'Final Interview', description: 'Final decision interview', icon: '🎯', type: 'custom' },
];

type StageCategory = 'ai-interview' | 'human-interview' | 'assessment' | 'general';

function determineStageCategory(stage: PipelineStage): StageCategory {
  const stageName = stage.stageName.toLowerCase();
  const config = stage.config || {};
  
  const hasAIKeyword = /\bai\b/.test(stageName);
  
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
  
  if (
    stageName.includes('test') ||
    stageName.includes('assessment') ||
    stageName.includes('background check') ||
    stageName.includes('reference check') ||
    (config.assessmentType && config.assessmentType !== 'none')
  ) {
    return 'assessment';
  }
  
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
    <div ref={setNodeRef} style={style} className="w-full flex justify-center">
      <div 
        onClick={handleCardClick}
        className={`relative rounded-md p-2.5 border-2 transition-all w-full max-w-[200px] cursor-pointer ${
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
      
      const url = isTemplateMode 
        ? `/api/pipeline-templates/${templateId}`
        : `/api/jobs/${jobId}/pipeline-stages`;
      
      console.log('[WorkflowBuilder] Fetching from:', url);
      
      // Use XMLHttpRequest with setTimeout workaround
      const data: any = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url);
        xhr.onload = () => {
          setTimeout(() => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(JSON.parse(xhr.responseText));
            } else {
              reject(new Error(`HTTP ${xhr.status}`));
            }
          }, 0);
        };
        xhr.onerror = () => setTimeout(() => reject(new Error('Network error')), 0);
        xhr.send();
      });
      
      console.log('[WorkflowBuilder] Data received:', data);
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

  // Auto-select first stage - DISABLED to debug fetch hang
  // useEffect(() => {
  //   if (stages.length > 0 && !configuringStage && !hasAutoSelectedRef.current) {
  //     const firstConfigurable = stages.find(s => !FIXED_BOTTOM_STAGES.includes(s.stageName));
  //     if (firstConfigurable) {
  //       setConfiguringStage(firstConfigurable);
  //       hasAutoSelectedRef.current = true;
  //     }
  //   }
  // }, [stages, configuringStage]);

  useEffect(() => {
    console.log('[WorkflowBuilder] useEffect triggered, entityId:', entityId, 'isTemplateMode:', isTemplateMode);
    
    if (!entityId) {
      console.log('[WorkflowBuilder] No entityId, showing error');
      setError('No template or job ID provided');
      setLoading(false);
      return;
    }

    // TEMP: Use hardcoded data to show UI while debugging fetch hang
    setTemplateName('Full Stack Tech Role');
    setStages([
      { id: 1, jobId: 0, stageName: 'Screening', stageOrder: 0, isDefault: true, config: { description: 'Initial candidate screening' }, createdAt: '' },
      { id: 2, jobId: 0, stageName: 'Shortlist', stageOrder: 1, isDefault: true, config: { description: 'Qualified candidates' }, createdAt: '' },
      { id: 3, jobId: 0, stageName: 'Client Endorsement', stageOrder: 2, isDefault: true, config: { description: 'Candidates endorsed to client' }, createdAt: '' },
      { id: 4, jobId: 0, stageName: 'Offer', stageOrder: 3, isDefault: true, config: { description: 'Offer extended' }, createdAt: '' },
      { id: 5, jobId: 0, stageName: 'Offer Accepted', stageOrder: 4, isDefault: true, config: { description: 'Offer accepted' }, createdAt: '' }
    ]);
    setLoading(false);
    
    // fetchStages(); // Disabled - using hardcoded data
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
    setConfiguringStage({
      id: -1,
      jobId: 0,
      stageName: template.name,
      stageOrder: -1,
      isDefault: false,
      config: { description: template.description },
      createdAt: ''
    });
  };

  const handleConfigureStage = (stage: PipelineStage) => {
    setConfiguringStage(stage);
  };

  // handleUpdateStageConfig temporarily disabled while StageConfigPanel is disabled

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
          <div className="max-w-[1280px] mx-auto px-6 py-4">
            <button
              onClick={() => navigate(-1)}
              className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 mb-2 inline-flex items-center text-sm font-medium"
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
            <div className="lg:col-span-3">
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
            <div className="lg:col-span-5">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Workflow Pipeline</h2>
                    <span className="text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/40 px-2 py-0.5 rounded-full">{stages.length} stages</span>
                  </div>
                </div>
                <div className="p-4">
              
              <SortableContext
                items={stages.map(s => s.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="flex flex-col items-center space-y-0">
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
                      <SortableWorkflowStage
                        key={stage.id}
                        stage={stage}
                        index={index}
                        onConfigure={handleConfigureStage}
                        onDelete={handleDeleteStage}
                        isSelected={configuringStage?.id === stage.id}
                      />
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
            <div className="lg:col-span-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden sticky top-6">
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Stage Configuration</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {configuringStage ? 'Customize stage settings' : 'Select a stage to configure'}
                  </p>
                </div>

                {configuringStage ? (
                  <div className="p-4 max-h-[calc(100vh-200px)] overflow-y-auto">
                    <div className="space-y-5">
                      {(() => {
                        const stageCategory = determineStageCategory(configuringStage);
                        
                        return (
                          <>
                            {/* AI Interview Configuration */}
                            {stageCategory === 'ai-interview' && (
                              <>
                                <div className="pb-3 border-b border-gray-200 dark:border-gray-700">
                                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                    <span>🤖</span>
                                    AI Interview Configuration
                                  </h3>
                                </div>
                                
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                    AI Model
                                  </label>
                                  <select
                                    value={configuringStage.config?.aiModel || 'gpt-4'}
                                    onChange={(e) => setConfiguringStage({
                                      ...configuringStage,
                                      config: { ...configuringStage.config, aiModel: e.target.value }
                                    })}
                                    className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                                  >
                                    <option value="gpt-4">GPT-4 (Advanced)</option>
                                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Fast)</option>
                                    <option value="claude-3">Claude 3 (Opus)</option>
                                  </select>
                                </div>

                                <div>
                                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                    Interview Duration (minutes)
                                  </label>
                                  <input
                                    type="number"
                                    min="15"
                                    max="120"
                                    step="15"
                                    value={configuringStage.config?.aiInterviewDuration || 45}
                                    onChange={(e) => setConfiguringStage({
                                      ...configuringStage,
                                      config: { ...configuringStage.config, aiInterviewDuration: parseInt(e.target.value) }
                                    })}
                                    className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                                  />
                                </div>

                                <div>
                                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                    Number of Questions
                                  </label>
                                  <input
                                    type="number"
                                    min="5"
                                    max="30"
                                    value={configuringStage.config?.aiQuestionCount || 15}
                                    onChange={(e) => setConfiguringStage({
                                      ...configuringStage,
                                      config: { ...configuringStage.config, aiQuestionCount: parseInt(e.target.value) }
                                    })}
                                    className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                                  />
                                </div>

                                <div>
                                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Question Categories
                                  </label>
                                  <div className="space-y-2">
                                    {['Technical', 'Behavioral', 'Cultural Fit', 'Situational'].map((category) => (
                                      <label key={category} className="flex items-center gap-2">
                                        <input
                                          type="checkbox"
                                          checked={configuringStage.config?.aiCategories?.[category] || false}
                                          onChange={(e) => setConfiguringStage({
                                            ...configuringStage,
                                            config: { 
                                              ...configuringStage.config, 
                                              aiCategories: { 
                                                ...configuringStage.config?.aiCategories, 
                                                [category]: e.target.checked 
                                              } 
                                            }
                                          })}
                                          className="rounded text-purple-600 focus:ring-purple-500"
                                        />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">{category}</span>
                                      </label>
                                    ))}
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Sentiment Analysis
                                  </label>
                                  <label className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={configuringStage.config?.aiSentimentAnalysis || false}
                                      onChange={(e) => setConfiguringStage({
                                        ...configuringStage,
                                        config: { ...configuringStage.config, aiSentimentAnalysis: e.target.checked }
                                      })}
                                      className="rounded text-purple-600 focus:ring-purple-500"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">Enable real-time sentiment analysis</span>
                                  </label>
                                </div>

                                <div>
                                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                    AI Evaluation Criteria
                                  </label>
                                  <textarea
                                    value={configuringStage.config?.aiEvaluationCriteria || ''}
                                    onChange={(e) => setConfiguringStage({
                                      ...configuringStage,
                                      config: { ...configuringStage.config, aiEvaluationCriteria: e.target.value }
                                    })}
                                    rows={3}
                                    className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                                    placeholder="Enter criteria for AI to evaluate responses..."
                                  />
                                </div>
                              </>
                            )}

                            {/* Assessment Configuration */}
                            {stageCategory === 'assessment' && (
                              <>
                                <div className="pb-3 border-b border-gray-200 dark:border-gray-700">
                                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                    <span>✍️</span>
                                    Assessment Configuration
                                  </h3>
                                </div>

                                <div>
                                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                    Assessment Type
                                  </label>
                                  <select
                                    value={configuringStage.config?.assessmentType || 'technical'}
                                    onChange={(e) => setConfiguringStage({
                                      ...configuringStage,
                                      config: { ...configuringStage.config, assessmentType: e.target.value }
                                    })}
                                    className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
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
                                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                    Assessment Duration (minutes)
                                  </label>
                                  <input
                                    type="number"
                                    min="15"
                                    max="480"
                                    step="15"
                                    value={configuringStage.config?.assessmentDuration || 120}
                                    onChange={(e) => setConfiguringStage({
                                      ...configuringStage,
                                      config: { ...configuringStage.config, assessmentDuration: parseInt(e.target.value) }
                                    })}
                                    className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                                  />
                                </div>

                                <div>
                                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                    Assessment Platform
                                  </label>
                                  <select
                                    value={configuringStage.config?.assessmentPlatform || 'internal'}
                                    onChange={(e) => setConfiguringStage({
                                      ...configuringStage,
                                      config: { ...configuringStage.config, assessmentPlatform: e.target.value }
                                    })}
                                    className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
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
                                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                    Assessment Instructions
                                  </label>
                                  <textarea
                                    value={configuringStage.config?.assessmentInstructions || ''}
                                    onChange={(e) => setConfiguringStage({
                                      ...configuringStage,
                                      config: { ...configuringStage.config, assessmentInstructions: e.target.value }
                                    })}
                                    rows={3}
                                    className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                                    placeholder="Enter instructions for the assessment..."
                                  />
                                </div>

                                <div>
                                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                    Passing Score (%)
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={configuringStage.config?.passingScore || 70}
                                    onChange={(e) => setConfiguringStage({
                                      ...configuringStage,
                                      config: { ...configuringStage.config, passingScore: parseInt(e.target.value) }
                                    })}
                                    className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                                  />
                                </div>

                                <div>
                                  <label className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={configuringStage.config?.autoAdvanceOnPass || false}
                                      onChange={(e) => setConfiguringStage({
                                        ...configuringStage,
                                        config: { ...configuringStage.config, autoAdvanceOnPass: e.target.checked }
                                      })}
                                      className="rounded text-purple-600 focus:ring-purple-500"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">Auto-advance on pass</span>
                                  </label>
                                </div>
                              </>
                            )}

                            {/* Human Interview Configuration */}
                            {stageCategory === 'human-interview' && (
                              <>
                                <div className="pb-3 border-b border-gray-200 dark:border-gray-700">
                                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                    <span>👤</span>
                                    Interview Configuration
                                  </h3>
                                </div>

                                <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                          Interview Mode
                        </label>
                        <select
                          value={configuringStage.config?.interviewMode || 'phone'}
                          onChange={(e) => setConfiguringStage({
                            ...configuringStage,
                            config: { ...configuringStage.config, interviewMode: e.target.value }
                          })}
                          className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="phone">Phone Screening</option>
                          <option value="video">Video Interview</option>
                          <option value="onsite">On-site Interview</option>
                          <option value="panel">Panel Interview</option>
                        </select>
                      </div>

                      {/* Interview Duration */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                          Duration (minutes)
                        </label>
                        <input
                          type="number"
                          min="15"
                          max="480"
                          step="15"
                          value={configuringStage.config?.interviewDuration || 60}
                          onChange={(e) => setConfiguringStage({
                            ...configuringStage,
                            config: { ...configuringStage.config, interviewDuration: parseInt(e.target.value) }
                          })}
                          className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                        />
                      </div>

                      {/* Interview Template */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                          Interview Template
                        </label>
                        <select
                          value={configuringStage.config?.interviewTemplate || 'standard'}
                          onChange={(e) => setConfiguringStage({
                            ...configuringStage,
                            config: { ...configuringStage.config, interviewTemplate: e.target.value }
                          })}
                          className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="standard">Standard Interview</option>
                          <option value="technical-deep-dive">Technical Deep Dive</option>
                          <option value="behavioral-focus">Behavioral Focus</option>
                          <option value="leadership-assessment">Leadership Assessment</option>
                          <option value="culture-fit">Culture Fit Evaluation</option>
                          <option value="custom">Custom Template</option>
                        </select>
                      </div>

                      {/* AI Tools Section */}
                      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                        <h4 className="text-xs font-semibold text-gray-900 dark:text-white mb-3">AI Tools</h4>
                        <div className="space-y-2.5">
                          <label className="flex items-start gap-2">
                            <input
                              type="checkbox"
                              checked={configuringStage.config?.aiInterviewQuestions || false}
                              onChange={(e) => setConfiguringStage({
                                ...configuringStage,
                                config: { ...configuringStage.config, aiInterviewQuestions: e.target.checked }
                              })}
                              className="mt-0.5 rounded text-purple-600 focus:ring-purple-500"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">AI-Assisted Question Generation</span>
                          </label>
                          <label className="flex items-start gap-2">
                            <input
                              type="checkbox"
                              checked={configuringStage.config?.aiSentimentAnalysis || false}
                              onChange={(e) => setConfiguringStage({
                                ...configuringStage,
                                config: { ...configuringStage.config, aiSentimentAnalysis: e.target.checked }
                              })}
                              className="mt-0.5 rounded text-purple-600 focus:ring-purple-500"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">Real-time Sentiment Analysis</span>
                          </label>
                        </div>
                      </div>

                                {/* Evaluation Criteria */}
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                    Evaluation Criteria
                                  </label>
                                  <textarea
                                    value={configuringStage.config?.evaluationCriteria || ''}
                                    onChange={(e) => setConfiguringStage({
                            ...configuringStage,
                            config: { ...configuringStage.config, evaluationCriteria: e.target.value }
                          })}
                          rows={2}
                          className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                          placeholder="Technical skills, Communication, Cultural fit..."
                        />
                      </div>

                      {/* Automation Section */}
                      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                        <h4 className="text-xs font-semibold text-gray-900 dark:text-white mb-3">Automation</h4>
                        <div className="space-y-3">
                          <label className="flex items-start gap-2">
                            <input
                              type="checkbox"
                              checked={configuringStage.config?.autoAdvance || false}
                              onChange={(e) => setConfiguringStage({
                                ...configuringStage,
                                config: { ...configuringStage.config, autoAdvance: e.target.checked }
                              })}
                              className="mt-0.5 rounded text-purple-600 focus:ring-purple-500"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">Auto-advance on completion</span>
                          </label>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                              Email Template
                            </label>
                            <select
                              value={configuringStage.config?.emailTemplate || 'none'}
                              onChange={(e) => setConfiguringStage({
                                ...configuringStage,
                                config: { ...configuringStage.config, emailTemplate: e.target.value }
                              })}
                              className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
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
                      </div>

                      {/* SLA & Visibility */}
                      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                        <h4 className="text-xs font-semibold text-gray-900 dark:text-white mb-3">SLA & Visibility</h4>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                              SLA Duration (days)
                            </label>
                            <input
                              type="number"
                              min="1"
                              max="90"
                              value={configuringStage.config?.slaDays || 7}
                              onChange={(e) => setConfiguringStage({
                                ...configuringStage,
                                config: { ...configuringStage.config, slaDays: parseInt(e.target.value) }
                              })}
                              className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                          
                          <label className="flex items-start gap-2">
                            <input
                              type="checkbox"
                              checked={configuringStage.config?.externalPortalVisible || false}
                              onChange={(e) => setConfiguringStage({
                                ...configuringStage,
                                config: { ...configuringStage.config, externalPortalVisible: e.target.checked }
                              })}
                              className="mt-0.5 rounded text-purple-600 focus:ring-purple-500"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">Visible to External Portal</span>
                          </label>
                        </div>
                      </div>

                      {/* Save Button */}
                      <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                        <button
                          onClick={() => alert('Backend integration pending - configuration will be saved later')}
                          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-all shadow-sm"
                        >
                          Save Configuration
                        </button>
                      </div>
                    </div>
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
