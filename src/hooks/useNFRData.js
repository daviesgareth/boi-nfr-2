import { useState, useEffect } from 'react';
import { fetchAPI } from '../api';
import { useFilters } from '../contexts/FilterContext';

/**
 * Custom hook that fetches NFR data with automatic window/exclusion params.
 *
 * Usage:
 *   const { data, loading, error } = useNFRData('/api/nfr/by-region');
 *
 * Options:
 *   - skipWindow: boolean — don't append window param (e.g. for matching/status)
 *   - extraParams: string — additional query params (e.g. '&groupBy=make')
 *   - deps: array — additional dependency values to trigger refetch
 *   - defaultValue: any — initial value for data (default: null)
 */
export default function useNFRData(endpoint, {
  skipWindow = false,
  extraParams = '',
  deps = [],
  defaultValue = null,
} = {}) {
  const { window: win, excludeParam } = useFilters();
  const [data, setData] = useState(defaultValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const separator = endpoint.includes('?') ? '&' : '?';
    let url = endpoint;

    if (!skipWindow) {
      url += `${separator}window=${win}`;
      url += excludeParam;
    } else {
      // Still add a cache-buster and exclusions
      url += `${separator}_=1`;
      url += excludeParam;
    }

    if (extraParams) {
      url += extraParams;
    }

    fetchAPI(url)
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(e => {
        setError(e.message);
        setLoading(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, win, excludeParam, extraParams, ...deps]);

  return { data, loading, error, setData };
}
