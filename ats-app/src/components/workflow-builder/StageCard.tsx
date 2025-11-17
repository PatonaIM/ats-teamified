import { useSortable } from '@dnd-kit/sortable';
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

interface StageCardProps {
  stage: PipelineStage;
  candidateCount: number;
  onEdit: () => void;
  onDelete: () => void;
}

const FIXED_STAGES = ['Screening', 'Shortlist', 'Client Endorsement', 'Offer', 'Offer Accepted'];

export function StageCard({ stage, candidateCount, onEdit, onDelete }: StageCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: stage.id,
    disabled: FIXED_STAGES.includes(stage.stageName)
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isFixed = FIXED_STAGES.includes(stage.stageName);
  const canDelete = !isFixed && candidateCount === 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white dark:bg-gray-800 rounded-lg border-2 ${
        isFixed ? 'border-purple-300 dark:border-purple-600' : 'border-gray-200 dark:border-gray-700'
      } p-4 shadow-sm hover:shadow-md transition-shadow`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          {!isFixed && (
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
              </svg>
            </button>
          )}
          
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {stage.stageName}
              </h3>
              {isFixed && (
                <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 rounded">
                  Fixed
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {candidateCount} {candidateCount === 1 ? 'candidate' : 'candidates'}
              {Object.keys(stage.config).length > 0 && (
                <span className="ml-2 text-purple-600 dark:text-purple-400">
                  • Configured
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            className="px-4 py-2 text-sm font-medium text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
          >
            Configure
          </button>
          {canDelete && (
            <button
              onClick={onDelete}
              className="px-4 py-2 text-sm font-medium text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
