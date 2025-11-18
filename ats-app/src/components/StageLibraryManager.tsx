import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface StageTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  client_id: string | null;
  is_default: boolean;
  created_at: string;
}

interface StageLibraryManagerProps {
  onClose?: () => void;
}

const CATEGORIES = ['Technical', 'HR', 'Management', 'Assessment', 'Administrative', 'Custom'];
const ICONS = ['📝', '💻', '🔧', '🏗️', '👥', '🗣️', '👔', '🤝', '👨‍💼', '📞', '📋', '🔍', '🎯', '✅', '🏛️'];

export default function StageLibraryManager({ onClose }: StageLibraryManagerProps) {
  const [templates, setTemplates] = useState<StageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Custom',
    icon: '📋'
  });

  useEffect(() => {
    fetchTemplates();
  }, [user?.clientId]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const headers: HeadersInit = {};
      
      // Add client ID to headers for server-side authentication
      if (user?.clientId) {
        headers['X-Client-ID'] = user.clientId;
      }
      
      const response = await fetch('/api/stage-library', { headers });
      
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      } else {
        setError('Failed to fetch stage templates');
      }
    } catch (err) {
      setError('Error fetching stage templates');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.name.trim()) {
      setError('Stage name is required');
      return;
    }

    try {
      const url = editingId 
        ? `/api/stage-library/${editingId}`
        : '/api/stage-library';
      
      const method = editingId ? 'PUT' : 'POST';
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      
      // Add client ID to headers for server-side authentication
      if (user?.clientId) {
        headers['X-Client-ID'] = user.clientId;
      }
      
      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify({
          ...formData,
          userId: user?.id
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(editingId ? 'Template updated successfully!' : 'Template created successfully!');
        setFormData({ name: '', description: '', category: 'Custom', icon: '📋' });
        setIsCreating(false);
        setEditingId(null);
        fetchTemplates();
      } else {
        setError(data.error || 'Failed to save template');
      }
    } catch (err) {
      setError('Error saving template');
      console.error(err);
    }
  };

  const handleEdit = (template: StageTemplate) => {
    setFormData({
      name: template.name,
      description: template.description || '',
      category: template.category || 'Custom',
      icon: template.icon || '📋'
    });
    setEditingId(template.id);
    setIsCreating(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) {
      return;
    }

    try {
      const headers: HeadersInit = {};
      
      // Add client ID to headers for server-side authentication
      if (user?.clientId) {
        headers['X-Client-ID'] = user.clientId;
      }
      
      const response = await fetch(`/api/stage-library/${id}`, {
        method: 'DELETE',
        headers
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Template deleted successfully!');
        fetchTemplates();
      } else {
        setError(data.error || 'Failed to delete template');
      }
    } catch (err) {
      setError('Error deleting template');
      console.error(err);
    }
  };

  const handleCancel = () => {
    setFormData({ name: '', description: '', category: 'Custom', icon: '📋' });
    setIsCreating(false);
    setEditingId(null);
    setError('');
  };

  const defaultTemplates = templates.filter(t => t.is_default);
  const customTemplates = templates.filter(t => !t.is_default);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Stage Library</h2>
              <p className="text-sm text-gray-600 mt-1">
                Manage your pipeline stage templates
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Messages */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}
          {success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
              {success}
            </div>
          )}

          {/* Create/Edit Form */}
          {isCreating && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {editingId ? 'Edit Template' : 'Create New Template'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stage Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="e.g., Technical Interview"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Describe when to use this stage..."
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Icon
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {ICONS.map(icon => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setFormData({ ...formData, icon })}
                        className={`w-10 h-10 text-xl flex items-center justify-center rounded-lg border-2 transition-all ${
                          formData.icon === icon
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-purple-300'
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                  >
                    {editingId ? 'Update Template' : 'Create Template'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Create Button */}
          {!isCreating && (
            <button
              onClick={() => setIsCreating(true)}
              className="w-full py-3 border-2 border-dashed border-purple-300 rounded-lg text-purple-600 hover:border-purple-400 hover:bg-purple-50 transition-all font-medium flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Custom Template
            </button>
          )}

          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full"></div>
              <p className="mt-2 text-gray-600">Loading templates...</p>
            </div>
          ) : (
            <>
              {/* Default Templates */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span>🏢</span>
                  Default Teamified Templates
                  <span className="text-sm font-normal text-gray-500">({defaultTemplates.length})</span>
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {defaultTemplates.map(template => (
                    <div
                      key={template.id}
                      className="p-4 border border-purple-200 rounded-lg bg-gradient-to-br from-purple-50 to-blue-50"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{template.icon}</span>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900">{template.name}</h4>
                          {template.description && (
                            <p className="text-xs text-gray-600 mt-1">{template.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                              {template.category}
                            </span>
                            <span className="text-xs text-purple-600 font-medium">
                              Default
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom Templates */}
              {customTemplates.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <span>⚙️</span>
                    Your Custom Templates
                    <span className="text-sm font-normal text-gray-500">({customTemplates.length})</span>
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {customTemplates.map(template => (
                      <div
                        key={template.id}
                        className="p-4 border border-green-200 rounded-lg bg-gradient-to-br from-green-50 to-teal-50"
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">{template.icon}</span>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900">{template.name}</h4>
                            {template.description && (
                              <p className="text-xs text-gray-600 mt-1">{template.description}</p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                                {template.category}
                              </span>
                              <span className="text-xs text-green-600 font-medium">
                                Custom
                              </span>
                            </div>
                            <div className="flex gap-2 mt-3">
                              <button
                                onClick={() => handleEdit(template)}
                                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(template.id)}
                                className="text-xs text-red-600 hover:text-red-700 font-medium"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-600 text-center">
            💡 These templates will appear as suggestions when creating pipeline stages in jobs and workflow templates
          </p>
        </div>
      </div>
    </div>
  );
}
