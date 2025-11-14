import React from 'react';
import { X, Check, Sparkles } from 'lucide-react';

interface JobDescriptionVariation {
  id: string;
  name: string;
  tone: string;
  description: string;
}

interface JobDescriptionSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  variations: JobDescriptionVariation[];
  onSelect: (description: string) => void;
  partialFailure?: boolean;
  failedCount?: number;
}

const JobDescriptionSelector: React.FC<JobDescriptionSelectorProps> = ({
  isOpen,
  onClose,
  variations,
  onSelect,
  partialFailure = false,
  failedCount = 0
}) => {
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [hoveredId, setHoveredId] = React.useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelect = () => {
    const selected = variations.find(v => v.id === selectedId);
    if (selected) {
      onSelect(selected.description);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-purple-600" />
              Select Your Job Description
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Choose the style that best fits your needs
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Partial Failure Warning */}
        {partialFailure && (
          <div className="mx-6 mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
            <p className="text-sm text-yellow-800">
              Generated {variations.length} out of 3 variations ({failedCount} failed)
            </p>
          </div>
        )}

        {/* Variations Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {variations.map((variation) => (
              <div
                key={variation.id}
                onClick={() => setSelectedId(variation.id)}
                onMouseEnter={() => setHoveredId(variation.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={`relative border-2 rounded-xl p-4 cursor-pointer transition-all duration-200 ${
                  selectedId === variation.id
                    ? 'border-purple-500 shadow-lg shadow-purple-200 bg-purple-50'
                    : hoveredId === variation.id
                    ? 'border-gray-300 shadow-md'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {/* Selection Indicator */}
                {selectedId === variation.id && (
                  <div className="absolute top-3 right-3 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}

                {/* Variation Header */}
                <div className="mb-3">
                  <h3 className="font-semibold text-lg text-gray-900">
                    {variation.name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {variation.tone}
                  </p>
                </div>

                {/* HTML Preview */}
                <div 
                  className="prose prose-sm max-w-none overflow-y-auto max-h-96 pr-2 
                    [&>h3]:text-base [&>h3]:font-semibold [&>h3]:text-gray-800 [&>h3]:mt-3 [&>h3]:mb-2
                    [&>p]:text-sm [&>p]:text-gray-700 [&>p]:leading-relaxed [&>p]:mb-2
                    [&>ul]:text-sm [&>ul]:text-gray-700 [&>ul]:my-2
                    [&>li]:ml-4 [&>li]:mb-1
                    [&>strong]:text-gray-900 [&>strong]:font-semibold"
                  dangerouslySetInnerHTML={{ __html: variation.description }}
                />

                {/* Hover Effect */}
                {hoveredId === variation.id && selectedId !== variation.id && (
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-blue-50/50 rounded-xl pointer-events-none" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-600">
            {selectedId 
              ? `Selected: ${variations.find(v => v.id === selectedId)?.name}` 
              : 'Click on a variation to select'}
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSelect}
              disabled={!selectedId}
              className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              Apply Selected
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDescriptionSelector;
