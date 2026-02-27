// src/hooks/useUnsavedChangesGuard.ts
import { useEffect } from 'react';

export function useUnsavedChangesGuard(isDirty: boolean) {
  // Handle browser beforeunload (page refresh/close) and back/forward buttons
  useEffect(() => {
    if (!isDirty) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // Modern browsers show a generic message, but this is required for the prompt to appear.
      event.returnValue = '';
    };

    const handlePopState = (_: PopStateEvent) => {
      // Check if user wants to leave
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to leave? Your changes will be lost.'
      );
      
      if (!confirmed) {
        // Prevent navigation by pushing the current state back
        window.history.pushState(null, '', window.location.pathname);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isDirty]);
}
