import React, { useState } from 'react';
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
  isDefault: boolean;
}

const DEFAULT_STAGES = [
  'Screening',
  'Shortlist',
  'Client Endorsement',
  'Offer',
  'Offer Accepted'
];

const SUGGESTED_STAGES = [
  'Assessment',
  'Coding Round',
  'Interview 1',
  'Interview 2'
];

function SortableStageItem({ stage, index, onRemove, onRename, canRemove, isDefault }: SortableStageItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(stage.name);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `stage-${index}` });

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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 p-3 bg-white border rounded-lg transition-colors ${
        isDefault 
          ? 'border-purple-300 bg-purple-50/30' 
          : 'border-purple-200 hover:border-purple-400'
      }`}
    >
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

      <div className={`flex items-center justify-center w-8 h-8 font-semibold rounded-full text-sm ${
        isDefault ? 'bg-purple-200 text-purple-800' : 'bg-purple-100 text-purple-700'
      }`}>
        {stage.order}
      </div>

      {isEditing && !isDefault ? (
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
          onClick={() => !isDefault && setIsEditing(true)}
          className={`flex-1 text-left px-2 py-1 transition-colors ${
            isDefault 
              ? 'text-gray-800 font-medium cursor-default' 
              : 'text-gray-700 hover:text-purple-700'
          }`}
          disabled={isDefault}
        >
          {stage.name}
          {isDefault && (
            <span className="ml-2 text-xs text-purple-600 font-normal">(Required)</span>
          )}
        </button>
      )}

      {isDefault ? (
        <div className="text-gray-400" title="Required stage - cannot be removed">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
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

export default function PipelineStageEditor({ stages, onChange, minStages = 5 }: PipelineStageEditorProps) {
  const [newStageName, setNewStageName] = useState('');
  const [error, setError] = useState('');

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

  const isDefaultStage = (stageName: string): boolean => {
    return DEFAULT_STAGES.some(
      defaultStage => defaultStage.toLowerCase() === stageName.toLowerCase()
    );
  };

  const getAvailableSuggestions = (): string[] => {
    return SUGGESTED_STAGES.filter(
      suggestion => !stages.some(
        stage => stage.name.toLowerCase() === suggestion.toLowerCase()
      )
    );
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = stages.findIndex((_, idx) => `stage-${idx}` === active.id);
      const newIndex = stages.findIndex((_, idx) => `stage-${idx}` === over.id);

      const reorderedStages = arrayMove(stages, oldIndex, newIndex);
      const updatedStages = reorderedStages.map((stage, idx) => ({
        ...stage,
        order: idx + 1,
      }));
      onChange(updatedStages);
    }
  };

  const handleRemoveStage = (index: number) => {
    const stage = stages[index];
    
    if (isDefaultStage(stage.name)) {
      setError('Required stages cannot be removed');
      setTimeout(() => setError(''), 3000);
      return;
    }

    const removableStagesCount = stages.filter(s => !isDefaultStage(s.name)).length;
    
    if (removableStagesCount <= 0 && stages.length <= minStages) {
      setError(`Minimum ${minStages} stages required`);
      setTimeout(() => setError(''), 3000);
      return;
    }

    const updatedStages = stages
      .filter((_, idx) => idx !== index)
      .map((stage, idx) => ({ ...stage, order: idx + 1 }));
    onChange(updatedStages);
  };

  const handleRenameStage = (index: number, newName: string) => {
    const trimmedName = newName.trim();
    const currentStage = stages[index];
    
    if (isDefaultStage(currentStage.name)) {
      setError('Required stages cannot be renamed');
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

    const newStage: PipelineStage = {
      name: trimmedName,
      order: stages.length + 1,
    };

    onChange([...stages, newStage]);
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-900">Pipeline Stages</h4>
        <span className="text-xs text-gray-500">
          {stages.length} stages • {DEFAULT_STAGES.length} required
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
                canRemove={!isDefaultStage(stage.name)}
                isDefault={isDefaultStage(stage.name)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {availableSuggestions.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-600">💡 Suggested Stages:</p>
          <div className="flex flex-wrap gap-2">
            {availableSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => handleAddStage(suggestion)}
                className="px-3 py-1.5 bg-gradient-to-r from-purple-50 to-blue-50 text-purple-700 border border-purple-200 rounded-lg hover:from-purple-100 hover:to-blue-100 hover:border-purple-300 transition-all text-xs font-medium flex items-center gap-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

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
          + Add Stage
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-gray-600 space-y-1">
        <p className="font-medium text-blue-900">📋 Pipeline Setup Guide:</p>
        <ul className="list-disc list-inside space-y-0.5 text-blue-800">
          <li>5 required stages cannot be removed or renamed</li>
          <li>Drag stages to reorder them</li>
          <li>Click custom stage names to rename</li>
          <li>Add suggested stages with one click or create your own</li>
        </ul>
      </div>
    </div>
  );
}
