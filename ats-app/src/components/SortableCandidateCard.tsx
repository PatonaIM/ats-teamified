import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import CandidateCard from './CandidateCard';

interface Substage {
  id: string;
  label: string;
  order: number;
}

interface SortableCandidateCardProps {
  candidate: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
    resume_url: string | null;
    source: string;
    created_at: string;
    current_stage: string;
    candidate_substage?: string | null;
  };
  onDisqualify: (candidateId: string) => void;
  onMoveToNextStage: (candidateId: string) => void;
  isLastStage?: boolean;
  substages?: Substage[];
  loadingSubstages?: boolean;
}

export default function SortableCandidateCard({ 
  candidate, 
  onDisqualify, 
  onMoveToNextStage,
  isLastStage,
  substages,
  loadingSubstages
}: SortableCandidateCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: candidate.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-move"
    >
      <CandidateCard
        candidate={candidate}
        onDisqualify={onDisqualify}
        onMoveToNextStage={onMoveToNextStage}
        isLastStage={isLastStage}
        substages={substages}
        loadingSubstages={loadingSubstages}
      />
    </div>
  );
}
