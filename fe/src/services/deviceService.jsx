const deviceService = {
  getAllDevicesInfo: async () => {
    return { success: true, data: [] };
  },
  getAll: async (params = {}) => {
    return { success: true, data: { devices: [], pagination: { page: 1, limit: 10, totalPages: 0, totalItems: 0 } } };
  },
  create: async (data) => {
    return { success: true, data: { ...data, id: Date.now().toString() } };
  },
  update: async (id, data) => {
    return { success: true, data: { id, ...data } };
  },
  delete: async (id) => {
    return { success: true, data: { id } };
  },
  toggleStatus: async (deviceId) => {
    return { success: true, data: { id: deviceId, status: 'UNKNOWN' } };
  },
  toggleAutoMode: async (deviceId) => {
    return { success: true, data: { id: deviceId, autoMode: false } };
  }
};

export default deviceService;
