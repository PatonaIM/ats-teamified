import { useState, useEffect } from 'react';

interface FeatureFlags {
  workflowBuilder: boolean;
  linkedin: boolean;
}

export function useWorkflowBuilder() {
  const [enabled, setEnabled] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkFeatureFlag = async () => {
      try {
        console.log('[Workflow Builder] Fetching feature flags...');
        const response = await fetch('/api/feature-flags');
        if (response.ok) {
          const flags: FeatureFlags = await response.json();
          console.log('[Workflow Builder] Feature flags received:', flags);
          console.log('[Workflow Builder] Workflow Builder enabled:', flags.workflowBuilder);
          setEnabled(flags.workflowBuilder);
        } else {
          console.warn('[Workflow Builder] Failed to fetch feature flags, status:', response.status);
          setEnabled(false);
        }
      } catch (error) {
        console.error('[Workflow Builder] Error checking feature flag:', error);
        setEnabled(false);
      } finally {
        setLoading(false);
      }
    };

    checkFeatureFlag();
  }, []);

  return { enabled, loading };
}
