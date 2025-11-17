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
        const response = await fetch('/api/feature-flags');
        if (response.ok) {
          const flags: FeatureFlags = await response.json();
          setEnabled(flags.workflowBuilder);
        } else {
          console.warn('[Workflow Builder] Failed to fetch feature flags');
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
