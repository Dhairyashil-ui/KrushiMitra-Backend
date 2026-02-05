import { router } from 'expo-router';

interface NavigationOptions {
  transitionDelay?: number;
  onComplete?: () => void;
}

/**
 * Navigate to a new screen with a smooth transition
 * @param path - The path to navigate to
 * @param options - Navigation options
 */
export const navigateWithTransition = (
  path: any, 
  options: NavigationOptions = {}
) => {
  const { transitionDelay = 300, onComplete } = options;
  
  // Add a small delay to allow transition animation to complete
  setTimeout(() => {
    router.push(path);
    if (onComplete) onComplete();
  }, transitionDelay);
};

/**
 * Replace the current screen with a new screen with a smooth transition
 * @param path - The path to navigate to
 * @param options - Navigation options
 */
export const replaceWithTransition = (
  path: any, 
  options: NavigationOptions = {}
) => {
  const { transitionDelay = 300, onComplete } = options;
  
  // Add a small delay to allow transition animation to complete
  setTimeout(() => {
    router.replace(path);
    if (onComplete) onComplete();
  }, transitionDelay);
};

/**
 * Go back with a smooth transition
 * @param options - Navigation options
 */
export const backWithTransition = (options: NavigationOptions = {}) => {
  const { transitionDelay = 300, onComplete } = options;
  
  // Add a small delay to allow transition animation to complete
  setTimeout(() => {
    router.back();
    if (onComplete) onComplete();
  }, transitionDelay);
};

export default {
  navigateWithTransition,
  replaceWithTransition,
  backWithTransition
};