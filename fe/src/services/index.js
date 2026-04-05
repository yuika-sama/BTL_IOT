// Export tất cả services
import deviceService from './deviceService.js';
import dataSensorService from './dataSensorService.js';
import actionHistoryService from './actionHistoryService.js';
import socketService from './socketService.js';

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
