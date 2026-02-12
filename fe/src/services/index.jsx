// Export tất cả services
import deviceService from './deviceService';
import sensorService from './sensorService';
import dataSensorService from './dataSensorService';
import actionHistoryService from './actionHistoryService';
import alertService from './alertService';
import socketService from './socketService';

export {
  deviceService,
  sensorService,
  dataSensorService,
  actionHistoryService,
  alertService,
  socketService,
};

// Export default object chứa tất cả services
export default {
  device: deviceService,
  sensor: sensorService,
  dataSensor: dataSensorService,
  actionHistory: actionHistoryService,
  alert: alertService,
  socket: socketService,
};
