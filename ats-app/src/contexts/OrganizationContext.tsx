/**
 * Organization Context
 * Manages the currently selected organization for internal users
 * Internal users can view data across all organizations
 */

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import { apiRequest } from '../utils/api';
import { useAuth } from './AuthContext';

export interface ClientOrganization {
  id: string;
  name: string;
  slug: string;
  status: 'active' | 'inactive' | 'suspended';
  created_at?: string;
}

interface OrganizationContextType {
  organizations: ClientOrganization[];
  selectedOrganization: ClientOrganization | null;
  setSelectedOrganization: (org: ClientOrganization | null) => void;
  isLoading: boolean;
  error: string | null;
  refreshOrganizations: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const { isInternalUser, isAuthenticated, role } = useAuth();
  const [organizations, setOrganizations] = useState<ClientOrganization[]>([]);
  const [selectedOrganization, setSelectedOrganization] = useState<ClientOrganization | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasFetchedRef = useRef(false);

  const fetchOrganizations = useCallback(async () => {
    const isInternal = isInternalUser();
    console.log('[OrganizationContext] Checking user:', {
      isAuthenticated,
      isInternal,
      roleCode: role?.code,
      roleCategory: role?.category
    });
    
    if (!isAuthenticated || !isInternal) {
      console.log('[OrganizationContext] Skipping fetch - not internal user');
      setOrganizations([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('[OrganizationContext] Fetching organizations...');
      const response = await apiRequest<{ organizations: ClientOrganization[] }>('/api/organizations');
      const orgs = response.organizations || [];
      setOrganizations(orgs);
      
      const savedOrgId = sessionStorage.getItem('selectedOrganizationId');
      if (savedOrgId) {
        const savedOrg = orgs.find(o => o.id === savedOrgId);
        if (savedOrg) {
          setSelectedOrganization(savedOrg);
        }
      }
      
      console.log('[OrganizationContext] Loaded', orgs.length, 'organizations');
    } catch (err) {
      console.error('[OrganizationContext] Failed to fetch organizations:', err);
      setError('Failed to load organizations');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, isInternalUser, role]);

  useEffect(() => {
    const isInternal = isInternalUser();
    console.log('[OrganizationContext] Effect triggered:', { isAuthenticated, isInternal, roleCode: role?.code });
    
    if (isAuthenticated && isInternal && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchOrganizations();
    }
    
    if (!isAuthenticated) {
      hasFetchedRef.current = false;
    }
  }, [isAuthenticated, role, isInternalUser, fetchOrganizations]);

  const handleSetSelectedOrganization = useCallback((org: ClientOrganization | null) => {
    setSelectedOrganization(org);
    if (org) {
      sessionStorage.setItem('selectedOrganizationId', org.id);
    } else {
      sessionStorage.removeItem('selectedOrganizationId');
    }
  }, []);

  const value: OrganizationContextType = {
    organizations,
    selectedOrganization,
    setSelectedOrganization: handleSetSelectedOrganization,
    isLoading,
    error,
    refreshOrganizations: fetchOrganizations,
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization(): OrganizationContextType {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
}
