import React, { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useAuth } from '../contexts/AuthContext';

interface PipelineStage {
  name: string;
  order: number;
}

interface PipelineStageEditorProps {
  stages: PipelineStage[];
  onChange: (stages: PipelineStage[]) => void;
  minStages?: number;
}

interface SortableStageItemProps {
  stage: PipelineStage;
  index: number;
  onRemove: () => void;
  onRename: (newName: string) => void;
  canRemove: boolean;
  isFixedPosition: boolean;
}

interface StageTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  client_id: string | null;
  is_default: boolean;
}

const FIXED_TOP_STAGES = ['Screening', 'Shortlist', 'Client Endorsement'];
const FIXED_BOTTOM_STAGES = ['Offer', 'Offer Accepted'];

function SortableStageItem({ stage, index, onRemove, onRename, canRemove, isFixedPosition }: SortableStageItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(stage.name);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: `stage-${index}`,
    disabled: isFixedPosition,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleSaveEdit = () => {
    const trimmedValue = editValue.trim();
    if (trimmedValue && trimmedValue !== stage.name) {
      onRename(trimmedValue);
    } else {
      setEditValue(stage.name);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      setEditValue(stage.name);
      setIsEditing(false);
    }
  };

  const isTopFixed = index < FIXED_TOP_STAGES.length;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 p-3 bg-white border rounded-lg transition-colors ${
        isFixedPosition 
          ? 'border-purple-300 bg-purple-50/30' 
          : 'border-purple-200 hover:border-purple-400'
      }`}
    >
      {isFixedPosition ? (
        <div className="text-gray-400" title="Fixed position - cannot be moved">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
      ) : (
        <button
          type="button"
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-purple-600 transition-colors"
          {...attributes}
          {...listeners}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
          </svg>
        </button>
      )}

      <div className={`flex items-center justify-center w-8 h-8 font-semibold rounded-full text-sm ${
        isFixedPosition ? 'bg-purple-200 text-purple-800' : 'bg-purple-100 text-purple-700'
      }`}>
        {stage.order}
      </div>

      {isEditing && !isFixedPosition ? (
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSaveEdit}
          onKeyDown={handleKeyDown}
          className="flex-1 px-2 py-1 border border-purple-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
          autoFocus
        />
      ) : (
        <button
          type="button"
          onClick={() => !isFixedPosition && setIsEditing(true)}
          className={`flex-1 text-left px-2 py-1 transition-colors ${
            isFixedPosition 
              ? 'text-gray-800 font-medium cursor-default' 
              : 'text-gray-700 hover:text-purple-700'
          }`}
          disabled={isFixedPosition}
        >
          {stage.name}
          {isFixedPosition && (
            <span className="ml-2 text-xs text-purple-600 font-normal">
              {isTopFixed ? '(Fixed Top)' : '(Fixed Bottom)'}
            </span>
          )}
        </button>
      )}

      {isFixedPosition ? (
        <div className="w-5 h-5"></div>
      ) : canRemove ? (
        <button
          type="button"
          onClick={onRemove}
          className="text-red-500 hover:text-red-700 transition-colors"
          title="Remove stage"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      ) : (
        <div className="w-5 h-5"></div>
      )}
    </div>
  );
}

export default function PipelineStageEditor({ stages, onChange }: PipelineStageEditorProps) {
  const [newStageName, setNewStageName] = useState('');
  const [error, setError] = useState('');
  const [stageTemplates, setStageTemplates] = useState<StageTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const { user } = useAuth();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const fetchStageTemplates = async () => {
      try {
        setLoadingTemplates(true);
        const headers: HeadersInit = {};
        
        // Add client ID to headers for server-side authentication
        if (user?.clientId) {
          headers['X-Client-ID'] = user.clientId;
        }
        
        const response = await fetch('/api/stage-library', { headers });
        
        if (response.ok) {
          const data = await response.json();
          setStageTemplates(data.templates || []);
        } else {
          console.error('Failed to fetch stage templates');
        }
      } catch (error) {
        console.error('Error fetching stage templates:', error);
      } finally {
        setLoadingTemplates(false);
      }
    };

    fetchStageTemplates();
  }, [user?.clientId]);

  const isFixedStage = (index: number): boolean => {
    return index < FIXED_TOP_STAGES.length || 
           index >= stages.length - FIXED_BOTTOM_STAGES.length;
  };

  const getAvailableSuggestions = (): StageTemplate[] => {
    return stageTemplates.filter(
      template => !stages.some(
        stage => stage.name.toLowerCase() === template.name.toLowerCase()
      )
    );
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = stages.findIndex((_, idx) => `stage-${idx}` === active.id);
      const newIndex = stages.findIndex((_, idx) => `stage-${idx}` === over.id);

      const firstMovableIndex = FIXED_TOP_STAGES.length;
      const lastMovableIndex = stages.length - FIXED_BOTTOM_STAGES.length - 1;

      if (newIndex < firstMovableIndex || newIndex > lastMovableIndex) {
        setError('Stages can only be reordered within the middle section');
        setTimeout(() => setError(''), 3000);
        return;
      }

      const topFixed = stages.slice(0, FIXED_TOP_STAGES.length);
      const bottomFixed = stages.slice(-FIXED_BOTTOM_STAGES.length);
      const middleStages = stages.slice(FIXED_TOP_STAGES.length, -FIXED_BOTTOM_STAGES.length);

      const adjustedOldIndex = oldIndex - FIXED_TOP_STAGES.length;
      const adjustedNewIndex = newIndex - FIXED_TOP_STAGES.length;

      const reorderedMiddle = arrayMove(middleStages, adjustedOldIndex, adjustedNewIndex);

      const finalStages = [...topFixed, ...reorderedMiddle, ...bottomFixed];
      const updatedStages = finalStages.map((stage, idx) => ({
        ...stage,
        order: idx + 1,
      }));
      
      onChange(updatedStages);
    }
  };

  const handleRemoveStage = (index: number) => {
    if (isFixedStage(index)) {
      setError('Fixed stages cannot be removed');
      setTimeout(() => setError(''), 3000);
      return;
    }

    const topFixed = stages.slice(0, FIXED_TOP_STAGES.length);
    const bottomFixed = stages.slice(-FIXED_BOTTOM_STAGES.length);
    const middleStages = stages.slice(FIXED_TOP_STAGES.length, -FIXED_BOTTOM_STAGES.length);

    const adjustedIndex = index - FIXED_TOP_STAGES.length;
    const updatedMiddle = middleStages.filter((_, idx) => idx !== adjustedIndex);

    const finalStages = [...topFixed, ...updatedMiddle, ...bottomFixed];
    const updatedStages = finalStages.map((stage, idx) => ({
      ...stage,
      order: idx + 1,
    }));
    
    onChange(updatedStages);
  };

  const handleRenameStage = (index: number, newName: string) => {
    const trimmedName = newName.trim();
    
    if (isFixedStage(index)) {
      setError('Fixed stages cannot be renamed');
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (!trimmedName) {
      setError('Stage name cannot be empty');
      setTimeout(() => setError(''), 3000);
      return;
    }

    const isDuplicate = stages.some((stage, idx) => 
      idx !== index && stage.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (isDuplicate) {
      setError('Stage name must be unique');
      setTimeout(() => setError(''), 3000);
      return;
    }

    const updatedStages = stages.map((stage, idx) =>
      idx === index ? { ...stage, name: trimmedName } : stage
    );
    onChange(updatedStages);
  };

  const handleAddStage = (stageName?: string) => {
    const trimmedName = (stageName || newStageName).trim();

    if (!trimmedName) {
      setError('Please enter a stage name');
      setTimeout(() => setError(''), 3000);
      return;
    }

    const isDuplicate = stages.some(
      (stage) => stage.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (isDuplicate) {
      setError('Stage name must be unique');
      setTimeout(() => setError(''), 3000);
      return;
    }

    const topFixed = stages.slice(0, FIXED_TOP_STAGES.length);
    const bottomFixed = stages.slice(-FIXED_BOTTOM_STAGES.length);
    const middleStages = stages.slice(FIXED_TOP_STAGES.length, -FIXED_BOTTOM_STAGES.length);

    const newStage: PipelineStage = {
      name: trimmedName,
      order: 0,
    };

    const updatedMiddle = [...middleStages, newStage];
    const finalStages = [...topFixed, ...updatedMiddle, ...bottomFixed];
    
    const updatedStages = finalStages.map((stage, idx) => ({
      ...stage,
      order: idx + 1,
    }));

    onChange(updatedStages);
    setNewStageName('');
    setError('');
  };

  const handleKeyDownAdd = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddStage();
    }
  };

  const availableSuggestions = getAvailableSuggestions();
  const middleStagesCount = stages.length - FIXED_TOP_STAGES.length - FIXED_BOTTOM_STAGES.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-900">Pipeline Stages</h4>
        <span className="text-xs text-gray-500">
          {stages.length} stages • {middleStagesCount} custom
        </span>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={stages.map((_, idx) => `stage-${idx}`)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {stages.map((stage, index) => (
              <SortableStageItem
                key={`stage-${index}`}
                stage={stage}
                index={index}
                onRemove={() => handleRemoveStage(index)}
                onRename={(newName) => handleRenameStage(index, newName)}
                canRemove={!isFixedStage(index)}
                isFixedPosition={isFixedStage(index)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {loadingTemplates ? (
        <div className="py-2 text-center">
          <div className="inline-block animate-spin h-4 w-4 border-2 border-purple-600 border-t-transparent rounded-full"></div>
          <span className="ml-2 text-xs text-gray-500">Loading stage templates...</span>
        </div>
      ) : availableSuggestions.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-600">
            💡 Suggested Stages (Added to Middle):
            <span className="ml-2 text-gray-500 font-normal">
              {availableSuggestions.filter(t => t.is_default).length} default • {availableSuggestions.filter(t => !t.is_default).length} custom
            </span>
          </p>
          <div className="flex flex-wrap gap-2">
            {availableSuggestions.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => handleAddStage(template.name)}
                className={`px-3 py-1.5 border rounded-lg hover:border-purple-300 transition-all text-xs font-medium flex items-center gap-1.5 ${
                  template.is_default
                    ? 'bg-gradient-to-r from-purple-50 to-blue-50 text-purple-700 border-purple-200 hover:from-purple-100 hover:to-blue-100'
                    : 'bg-gradient-to-r from-green-50 to-teal-50 text-green-700 border-green-200 hover:from-green-100 hover:to-teal-100'
                }`}
                title={template.description || template.name}
              >
                <span>{template.icon || '📋'}</span>
                <span>{template.name}</span>
                {!template.is_default && (
                  <span className="text-[10px] bg-green-200 text-green-800 px-1 py-0.5 rounded">
                    Custom
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex gap-2">
        <input
          type="text"
          value={newStageName}
          onChange={(e) => setNewStageName(e.target.value)}
          onKeyDown={handleKeyDownAdd}
          placeholder="Enter custom stage name..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
        />
        <button
          type="button"
          onClick={() => handleAddStage()}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
        >
          + Add to Middle
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-gray-600 space-y-1">
        <p className="font-medium text-blue-900">📋 Pipeline Structure:</p>
        <ul className="list-disc list-inside space-y-0.5 text-blue-800">
          <li><strong>Top 3 Fixed:</strong> Screening → Shortlist → Client Endorsement</li>
          <li><strong>Middle Section:</strong> Add and drag custom stages here</li>
          <li><strong>Bottom 2 Fixed:</strong> Offer → Offer Accepted</li>
        </ul>
      </div>
    </div>
  );
}
