import { message } from 'antd';
import { useEffect, useMemo } from 'react';

export const useMessage = () => {
  // Create a message instance that properly consumes the Ant Design context
  const messageApi = useMemo(() => message, []);

  // Ensure we're in client-side rendering
  useEffect(() => {
    if (typeof window === 'undefined') {
      console.warn('useMessage hook should only be used in client-side components');
    }
  }, []);

  return messageApi;
};