import { useEffect, useRef, useCallback } from 'react';
import socketService from '../services/socketService';

/**
 * Custom hook để sử dụng Socket.IO trong React components
 * @param {Object} options - Cấu hình options
 * @param {Boolean} options.autoConnect - Tự động kết nối khi mount (default: true)
 * @param {Boolean} options.autoDisconnect - Tự động ngắt kết nối khi unmount (default: true)
 */
export const useSocket = (options = {}) => {
  const {
    autoConnect = true,
    autoDisconnect = true,
  } = options;

  const socketRef = useRef(socketService);
  const listenersRef = useRef([]);

  useEffect(() => {
    if (autoConnect) {
      socketRef.current.connect();
    }

    return () => {
      // Cleanup: remove tất cả listeners khi component unmount
      listenersRef.current.forEach((unsubscribe) => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      });
      listenersRef.current = [];

      if (autoDisconnect) {
        socketRef.current.disconnect();
      }
    };
  }, [autoConnect, autoDisconnect]);

  /**
   * Lắng nghe sensor data
   */
  const onSensorData = useCallback((callback) => {
    const unsubscribe = socketRef.current.onSensorData(callback);
    listenersRef.current.push(unsubscribe);
    return unsubscribe;
  }, []);

  /**
   * Lắng nghe alerts
   */
  const onAlert = useCallback((callback) => {
    const unsubscribe = socketRef.current.onAlert(callback);
    listenersRef.current.push(unsubscribe);
    return unsubscribe;
  }, []);

  /**
   * Lắng nghe device status
   */
  const onDeviceStatus = useCallback((callback) => {
    const unsubscribe = socketRef.current.onDeviceStatus(callback);
    listenersRef.current.push(unsubscribe);
    return unsubscribe;
  }, []);

  /**
   * Lắng nghe event tùy chỉnh
   */
  const on = useCallback((eventName, callback) => {
    const unsubscribe = socketRef.current.on(eventName, callback);
    listenersRef.current.push(unsubscribe);
    return unsubscribe;
  }, []);

  /**
   * Emit event
   */
  const emit = useCallback((eventName, data) => {
    socketRef.current.emit(eventName, data);
  }, []);

  /**
   * Kiểm tra trạng thái kết nối
   */
  const isConnected = useCallback(() => {
    return socketRef.current.isConnected();
  }, []);

  return {
    onSensorData,
    onAlert,
    onDeviceStatus,
    on,
    emit,
    isConnected,
  };
};

/**
 * Hook để lắng nghe sensor data với state management
 * @param {Function} callback - Optional callback khi nhận data mới
 */
export const useSensorData = (callback) => {
  const { onSensorData } = useSocket({ autoDisconnect: false });

  useEffect(() => {
    if (!callback) return;

    const unsubscribe = onSensorData(callback);
    return unsubscribe;
  }, [callback, onSensorData]);
};

/**
 * Hook để lắng nghe alerts với state management
 * @param {Function} callback - Optional callback khi nhận alert mới
 */
export const useAlerts = (callback) => {
  const { onAlert } = useSocket({ autoDisconnect: false });

  useEffect(() => {
    if (!callback) return;

    const unsubscribe = onAlert(callback);
    return unsubscribe;
  }, [callback, onAlert]);
};

/**
 * Hook để lắng nghe device status với state management
 * @param {Function} callback - Optional callback khi nhận status mới
 */
export const useDeviceStatus = (callback) => {
  const { onDeviceStatus } = useSocket({ autoDisconnect: false });

  useEffect(() => {
    if (!callback) return;

    const unsubscribe = onDeviceStatus(callback);
    return unsubscribe;
  }, [callback, onDeviceStatus]);
};

export default useSocket;
