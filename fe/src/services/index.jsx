// Export tất cả services
import deviceService from './deviceService';
import dataSensorService from './dataSensorService';
import actionHistoryService from './actionHistoryService';
import socketService from './socketService';

export {
  deviceService,
  dataSensorService,
  actionHistoryService,
  socketService,
};

// Export default object chứa tất cả services
export default {
  device: deviceService,
  dataSensor: dataSensorService,
  actionHistory: actionHistoryService,
  socket: socketService,
};
