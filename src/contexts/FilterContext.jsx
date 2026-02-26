import React, { createContext, useContext, useState, useMemo } from 'react';

const FilterContext = createContext(null);

export function FilterProvider({ children }) {
  const [window, setWindow] = useState('core');
  const [timeframe, setTimeframe] = useState('rolling13');
  const [exclusions, setExclusions] = useState([]);

  const toggleExclusion = (key) => {
    setExclusions(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const clearExclusions = () => setExclusions([]);

  const excludeParam = useMemo(
    () => exclusions.length > 0 ? `&exclude=${exclusions.join(',')}` : '',
    [exclusions]
  );

  const timeframeParam = useMemo(
    () => `&timeframe=${timeframe}`,
    [timeframe]
  );

  const value = {
    window,
    setWindow,
    timeframe,
    setTimeframe,
    exclusions,
    toggleExclusion,
    clearExclusions,
    excludeParam,
    timeframeParam,
  };

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
}

export function useFilters() {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error('useFilters must be used within FilterProvider');
  return ctx;
}
