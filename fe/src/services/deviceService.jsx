import baseApi from './baseApi.jsx';

const deviceService = {
  getAllDevicesInfo: async () => {
    const response = await baseApi.get('/dashboard/devices');
    return {
      success: Boolean(response?.success),
      data: Array.isArray(response?.data) ? response.data : [],
    };
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
    const response = await baseApi.post(`/devices/${deviceId}/toggle`);
    return {
      success: Boolean(response?.success),
      data: response?.data || { id: deviceId },
    };
  },
  toggleAutoMode: async (deviceId) => {
    const response = await baseApi.post(`/devices/${deviceId}/toggle-auto`);
    return {
      success: Boolean(response?.success),
      data: response?.data || { id: deviceId },
    };
  }
};

export default deviceService;
