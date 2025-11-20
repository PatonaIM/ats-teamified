import { useState } from 'react';
import { Mail, Phone, FileText, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

interface Substage {
  id: string;
  label: string;
  order: number;
}

interface CandidateCardProps {
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

export default function CandidateCard({ 
  candidate, 
  onDisqualify, 
  onMoveToNextStage,
  isLastStage = false,
  substages = [],
  loadingSubstages = false
}: CandidateCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const getSourceColor = (source: string) => {
    const colors = {
      linkedin: 'bg-blue-500',
      direct: 'bg-purple-500',
      referral: 'bg-green-500',
      portal: 'bg-orange-500'
    };
    return colors[source.toLowerCase() as keyof typeof colors] || 'bg-gray-500';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow mb-3">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-full ${getSourceColor(candidate.source)} flex items-center justify-center text-white font-semibold text-sm flex-shrink-0`}>
            {getInitials(candidate.first_name, candidate.last_name)}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 truncate">
                  {candidate.first_name} {candidate.last_name}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 capitalize">
                    {candidate.source}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatDate(candidate.created_at)}
                  </span>
                </div>
              </div>
              
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
            </div>

            <div className="flex items-center gap-1 mt-2 text-sm text-gray-600">
              <Mail size={14} className="flex-shrink-0" />
              <a 
                href={`mailto:${candidate.email}`}
                className="truncate hover:text-purple-600 transition-colors"
              >
                {candidate.email}
              </a>
            </div>

            {candidate.phone && (
              <div className="flex items-center gap-1 mt-1 text-sm text-gray-600">
                <Phone size={14} className="flex-shrink-0" />
                <a 
                  href={`tel:${candidate.phone}`}
                  className="hover:text-purple-600 transition-colors"
                >
                  {candidate.phone}
                </a>
              </div>
            )}

            {/* Mini Progress Bar - Always Visible */}
            <div className="mt-3">
              {loadingSubstages ? (
                <div className="flex items-center gap-1">
                  <div className="h-1.5 rounded-full flex-1 bg-gray-200 animate-pulse"></div>
                </div>
              ) : substages.length > 0 ? (
                <>
                  <div className="flex items-center gap-1">
                    {(() => {
                      const currentSubstageOrder = candidate.candidate_substage 
                        ? substages.find(s => s.id === candidate.candidate_substage)?.order || 0
                        : 0;
                      
                      return substages.map((substage, index) => {
                        const isCompleted = substage.order <= currentSubstageOrder;
                        
                        return (
                          <div key={substage.id} className="flex items-center gap-1 flex-1">
                            <div
                              className={`
                                h-1.5 rounded-full flex-1 transition-all
                                ${isCompleted 
                                  ? 'bg-gradient-to-r from-purple-500 to-blue-500' 
                                  : 'bg-gray-200'
                                }
                              `}
                              title={substage.label}
                            />
                            {index < substages.length - 1 && (
                              <div className="w-0.5 h-1 bg-gray-200"></div>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>
                  {candidate.candidate_substage && (
                    <div className="text-[10px] text-gray-500 mt-1">
                      {substages.find(s => s.id === candidate.candidate_substage)?.label || 'In Progress'}
                    </div>
                  )}
                </>
              ) : (
                <div className="h-1.5 rounded-full bg-gray-100 flex items-center justify-center">
                  <div className="text-[9px] text-gray-400 px-1">No progress tracking</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
            {candidate.resume_url && (
              <div>
                <h5 className="text-xs font-semibold text-gray-700 mb-2">Resume</h5>
                <a
                  href={candidate.resume_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 transition-colors"
                >
                  <FileText size={16} />
                  View Resume
                  <ExternalLink size={14} />
                </a>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => onDisqualify(candidate.id)}
                className="flex-1 px-3 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
              >
                Disqualify
              </button>
              
              {!isLastStage && (
                <button
                  onClick={() => onMoveToNextStage(candidate.id)}
                  className="flex-1 px-3 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-sm"
                >
                  Move to Next Stage
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
