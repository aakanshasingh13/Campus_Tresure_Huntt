import { useEffect, useState } from 'react';
import {
  BackendConnectionSnapshot,
  BackendDiscoveryController,
} from '../lib/backendDiscovery';

export function useBackendDiscovery(): BackendConnectionSnapshot {
  const [snapshot, setSnapshot] = useState<BackendConnectionSnapshot>({
    status: 'searching',
    detail: 'Searching for the Campus Quest backend...',
  });

  useEffect(() => {
    const controller = new BackendDiscoveryController();
    const unsubscribe = controller.subscribe(setSnapshot);
    controller.start();
    return () => {
      unsubscribe();
      controller.stop();
    };
  }, []);

  return snapshot;
}
