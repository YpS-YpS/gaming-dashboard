import { useEffect } from 'react';

export const useKeyboardShortcut = (key, callback, deps = []) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === key) {
        callback(e);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [key, callback, ...deps]);
};

export default useKeyboardShortcut;
