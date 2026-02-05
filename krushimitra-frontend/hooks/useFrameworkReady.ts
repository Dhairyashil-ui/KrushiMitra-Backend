import { useEffect, useState } from 'react';

declare global {
  interface Window {
    frameworkReady?: () => void;
  }
}

export function useFrameworkReady() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Set ready state after a small delay to ensure components are mounted
    const timer = setTimeout(() => {
      setIsReady(true);
      window.frameworkReady?.();
    }, 50);

    return () => clearTimeout(timer);
  }, []);

  return isReady;
}
