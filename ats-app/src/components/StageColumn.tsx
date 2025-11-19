import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import CandidateCard from './CandidateCard';
import SortableCandidateCard from './SortableCandidateCard';

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
}

interface StageColumnProps {
  stage: {
    id: string;
    stageName: string;
    stageOrder: number;
  };
  candidates: Candidate[];
  onDisqualify: (candidateId: string) => void;
  onMoveToNextStage: (candidateId: string) => void;
  isLastStage?: boolean;
  enableDragDrop?: boolean;
}

export default function StageColumn({ 
  stage, 
  candidates, 
  onDisqualify, 
  onMoveToNextStage,
  isLastStage = false,
  enableDragDrop = true
}: StageColumnProps) {
  const { setNodeRef } = useDroppable({
    id: stage.id,
  });

  const candidateIds = candidates.map(c => c.id);

  return (
    <div className="flex-shrink-0 w-80 bg-gray-50 rounded-lg p-4">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-900">{stage.stageName}</h3>
          <span className="text-sm font-medium text-gray-500 bg-white px-2 py-1 rounded-full">
            {candidates.length}
          </span>
        </div>
        <div className="h-1 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full"></div>
      </div>

      <div 
        ref={setNodeRef}
        className="space-y-3 min-h-[100px]"
      >
        {enableDragDrop ? (
          <SortableContext items={candidateIds} strategy={verticalListSortingStrategy}>
            {candidates.map((candidate) => (
              <SortableCandidateCard
                key={candidate.id}
                candidate={candidate}
                onDisqualify={onDisqualify}
                onMoveToNextStage={onMoveToNextStage}
                isLastStage={isLastStage}
              />
            ))}
          </SortableContext>
        ) : (
          <>
            {candidates.map((candidate) => (
              <CandidateCard
                key={candidate.id}
                candidate={candidate}
                onDisqualify={onDisqualify}
                onMoveToNextStage={onMoveToNextStage}
                isLastStage={isLastStage}
              />
            ))}
          </>
        )}

        {candidates.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-sm">
            No candidates in this stage
          </div>
        )}
      </div>
    </div>
  );
}
