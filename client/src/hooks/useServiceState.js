import { useState, useEffect } from 'react';
import { getServiceState } from '../utils/time';

export function useServiceState() {
  const [serviceState, setServiceState] = useState(getServiceState());

  useEffect(() => {
    const timer = setInterval(() => {
      setServiceState(getServiceState());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return serviceState;
}
