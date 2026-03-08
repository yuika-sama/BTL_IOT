import { useCallback } from 'react';

export const useSocket = (options = {}) => {
  const onSensorData = useCallback(() => () => { }, []);
  const onAlert = useCallback(() => () => { }, []);
  const onDeviceStatus = useCallback(() => () => { }, []);
  const on = useCallback(() => () => { }, []);
  const emit = useCallback(() => { }, []);
  const isConnected = useCallback(() => false, []);

  return {
    onSensorData,
    onAlert,
    onDeviceStatus,
    on,
    emit,
    isConnected,
  };
};

export const useSensorData = (callback) => { };
export const useAlerts = (callback) => { };
export const useDeviceStatus = (callback) => { };

export default useSocket;
