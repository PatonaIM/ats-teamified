/**
 * Organization Selector Component
 * Dropdown for internal users to filter by client organization
 */

import { useState, useRef, useEffect } from 'react';
import { Building2, ChevronDown, Check, X, Search, Globe } from 'lucide-react';
import { useOrganization, type ClientOrganization } from '../contexts/OrganizationContext';
import { useAuth } from '../contexts/AuthContext';

export function OrganizationSelector() {
  const { isInternalUser } = useAuth();
  const { 
    organizations, 
    selectedOrganization, 
    setSelectedOrganization, 
    isLoading 
  } = useOrganization();
  
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isInternalUser()) {
    return null;
  }

  const filteredOrgs = organizations.filter(org =>
    org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    org.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (org: ClientOrganization | null) => {
    setSelectedOrganization(org);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
          selectedOrganization
            ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700 text-purple-700 dark:text-purple-300'
            : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
        } hover:border-purple-400 dark:hover:border-purple-500`}
      >
        {selectedOrganization ? (
          <Building2 className="w-4 h-4" />
        ) : (
          <Globe className="w-4 h-4" />
        )}
        <span className="text-sm font-medium max-w-[150px] truncate">
          {isLoading ? 'Loading...' : selectedOrganization?.name || 'All Organizations'}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
          <div className="p-2 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search organizations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500"
                autoFocus
              />
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto">
            <button
              onClick={() => handleSelect(null)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                !selectedOrganization ? 'bg-purple-50 dark:bg-purple-900/20' : ''
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <Globe className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900 dark:text-white">All Organizations</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">View data across all clients</div>
              </div>
              {!selectedOrganization && (
                <Check className="w-4 h-4 text-purple-600" />
              )}
            </button>

            {filteredOrgs.length === 0 && searchQuery && (
              <div className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                No organizations found
              </div>
            )}

            {filteredOrgs.map((org) => (
              <button
                key={org.id}
                onClick={() => handleSelect(org)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                  selectedOrganization?.id === org.id ? 'bg-purple-50 dark:bg-purple-900/20' : ''
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-600 dark:to-gray-700 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{org.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{org.slug}</div>
                </div>
                {selectedOrganization?.id === org.id && (
                  <Check className="w-4 h-4 text-purple-600 flex-shrink-0" />
                )}
                <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                  org.status === 'active' 
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                }`}>
                  {org.status}
                </span>
              </button>
            ))}
          </div>

          {selectedOrganization && (
            <div className="p-2 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => handleSelect(null)}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
                Clear filter
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
