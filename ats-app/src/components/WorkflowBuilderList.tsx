import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Loader2, CheckCircle, AlertCircle, MoreVertical } from 'lucide-react';

interface Template {
  id: number;
  name: string;
  description: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

interface TemplateCardProps {
  template: Template;
  onEdit: () => void;
  onDelete: () => void;
}

function TemplateCard({ template, onEdit, onDelete }: TemplateCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700 transition-colors">
      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-base font-medium text-gray-900 dark:text-white truncate">
                {template.name}
              </h3>
              {template.is_default && (
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 flex items-center gap-1 shrink-0">
                  <CheckCircle className="w-3 h-3" />
                  Default
                </span>
              )}
            </div>
            {template.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                {template.description}
              </p>
            )}
            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-500">
              <span>Updated {new Date(template.updated_at).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className="px-3 py-1.5 text-sm font-medium text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-md transition-colors flex items-center gap-1.5"
            >
              <Edit className="w-3.5 h-3.5" />
              Edit
            </button>
            
            {!template.is_default && (
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
                
                {showMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setShowMenu(false)}
                    />
                    <div className="absolute right-0 top-8 z-20 w-36 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1">
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          onDelete();
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function WorkflowBuilderList() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDescription, setNewTemplateDescription] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/pipeline-templates');
      if (!response.ok) throw new Error('Failed to fetch templates');
      
      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async () => {
    if (!newTemplateName.trim()) {
      alert('Please enter a template name');
      return;
    }

    try {
      setCreating(true);
      
      // Create template with default stages (copy from Standard template)
      const response = await fetch('/api/pipeline-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTemplateName.trim(),
          description: newTemplateDescription.trim() || null,
          stages: [
            { name: 'Screening', type: 'fixed', config: { description: 'Initial candidate screening' } },
            { name: 'Shortlist', type: 'fixed', config: { description: 'Qualified candidates' } },
            { name: 'Client Endorsement', type: 'fixed', config: { description: 'Candidates endorsed to client' } },
            { name: 'Offer', type: 'fixed', config: { description: 'Offer extended' } },
            { name: 'Offer Accepted', type: 'fixed', config: { description: 'Offer accepted' } }
          ]
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create template');
      }

      const created = await response.json();
      
      // Reset form
      setNewTemplateName('');
      setNewTemplateDescription('');
      setShowCreateModal(false);
      
      // Refresh list
      await fetchTemplates();
      
      // Navigate to edit the new template
      navigate(`/dashboard/pipeline-templates/${created.id}/edit`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create template');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteTemplate = async (templateId: number, templateName: string) => {
    if (!confirm(`Are you sure you want to delete the template "${templateName}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/pipeline-templates/${templateId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete template');
      }

      await fetchTemplates();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete template');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex items-center gap-3 text-purple-600">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-lg font-medium">Loading templates...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 dark:text-red-400 text-lg mb-4">{error}</p>
          <button
            onClick={fetchTemplates}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Pipeline Templates
            </h1>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Template
            </button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage reusable hiring workflows
          </p>
        </div>

        {/* Templates List */}
        <div className="grid gap-3">
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onEdit={() => navigate(`/dashboard/pipeline-templates/${template.id}/edit`)}
              onDelete={() => handleDeleteTemplate(template.id, template.name)}
            />
          ))}

          {templates.length === 0 && (
            <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="max-w-sm mx-auto">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-base font-medium text-gray-900 dark:text-white mb-2">
                  No templates yet
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  Create your first pipeline template to streamline hiring workflows
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Create Template
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Template Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Create Pipeline Template
              </h2>
            </div>
            
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Name
                </label>
                <input
                  type="text"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  placeholder="e.g., Executive Search Pipeline"
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Description <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={newTemplateDescription}
                  onChange={(e) => setNewTemplateDescription(e.target.value)}
                  placeholder="Describe when to use this template..."
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 px-3 py-2 rounded-md">
                Template will include 5 default stages. Customize after creation.
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex gap-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewTemplateName('');
                  setNewTemplateDescription('');
                }}
                disabled={creating}
                className="flex-1 px-4 py-2 text-sm font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTemplate}
                disabled={creating || !newTemplateName.trim()}
                className="flex-1 px-4 py-2 text-sm font-medium bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Template'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
