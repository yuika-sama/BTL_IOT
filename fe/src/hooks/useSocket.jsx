import { useCallback, useEffect } from 'react';
import socketService from '../services/socketService';

export const useSocket = (options = {}) => {
  useEffect(() => {
    socketService.connect();

    if (options?.disconnectOnUnmount) {
      return () => {
        socketService.disconnect();
      };
    }

    return undefined;
  }, [options?.disconnectOnUnmount]);

  const onSensorData = useCallback((callback) => socketService.onSensorData(callback), []);
  const onAlert = useCallback((callback) => socketService.onAlert(callback), []);
  const onDeviceStatus = useCallback((callback) => socketService.onDeviceStatus(callback), []);
  const on = useCallback((eventName, callback) => socketService.on(eventName, callback), []);
  const emit = useCallback((eventName, data) => socketService.emit(eventName, data), []);
  const isConnected = useCallback(() => socketService.isConnected(), []);

  return {
    onSensorData,
    onAlert,
    onDeviceStatus,
    on,
    emit,
    isConnected,
  };
};

export const useSensorData = (callback) => {
  const { onSensorData } = useSocket();

  useEffect(() => {
    if (typeof callback !== 'function') return undefined;
    return onSensorData(callback);
  }, [callback, onSensorData]);
};

export const useAlerts = (callback) => {
  const { onAlert } = useSocket();

  useEffect(() => {
    if (typeof callback !== 'function') return undefined;
    return onAlert(callback);
  }, [callback, onAlert]);
};

export const useDeviceStatus = (callback) => {
  const { onDeviceStatus } = useSocket();

  useEffect(() => {
    if (typeof callback !== 'function') return undefined;
    return onDeviceStatus(callback);
  }, [callback, onDeviceStatus]);
};

export default useSocket;
