import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
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
}

function SortableStageItem({ stage, index, onRemove, onRename, canRemove }: SortableStageItemProps) {
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
      className="flex items-center gap-2 p-3 bg-white border border-purple-200 rounded-lg hover:border-purple-400 transition-colors"
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

      <div className="flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-700 font-semibold rounded-full text-sm">
        {stage.order}
      </div>

      {isEditing ? (
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
          onClick={() => setIsEditing(true)}
          className="flex-1 text-left px-2 py-1 text-gray-700 hover:text-purple-700 transition-colors"
        >
          {stage.name}
        </button>
      )}

      {canRemove && (
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
      )}
    </div>
  );
}

export default function PipelineStageEditor({ stages, onChange, minStages = 3 }: PipelineStageEditorProps) {
  const [newStageName, setNewStageName] = useState('');
  const [error, setError] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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
    if (stages.length <= minStages) {
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

  const handleAddStage = () => {
    const trimmedName = newStageName.trim();

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-900">Pipeline Stages</h4>
        <span className="text-xs text-gray-500">{stages.length} stages (min: {minStages})</span>
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
                canRemove={stages.length > minStages}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <div className="flex gap-2">
        <input
          type="text"
          value={newStageName}
          onChange={(e) => setNewStageName(e.target.value)}
          onKeyDown={handleKeyDownAdd}
          placeholder="Enter new stage name..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
        />
        <button
          type="button"
          onClick={handleAddStage}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
        >
          + Add Stage
        </button>
      </div>

      <p className="text-xs text-gray-500 italic">
        💡 Tip: Drag stages to reorder, click to rename, or remove stages you don't need
      </p>
    </div>
  );
}
