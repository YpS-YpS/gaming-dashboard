import { createContext, useContext, useState, useEffect } from 'react';
import { programs as fallbackPrograms } from '../data/programs';

const ProgramsContext = createContext(null);

export function ProgramsProvider({ children }) {
  const [programs, setPrograms] = useState(fallbackPrograms);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/programs')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (!cancelled && Array.isArray(data) && data.length > 0) {
          setPrograms(data);
        }
      })
      .catch(err => {
        if (!cancelled) setError(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <ProgramsContext.Provider value={{ programs, loading, error }}>
      {children}
    </ProgramsContext.Provider>
  );
}

export function usePrograms() {
  const ctx = useContext(ProgramsContext);
  if (!ctx) throw new Error('usePrograms must be used within ProgramsProvider');
  return ctx;
}
