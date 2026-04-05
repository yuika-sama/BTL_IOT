import baseApi from './baseApi.js';

const deviceService = {
  getAllDevicesInfo: async () => {
    const response = await baseApi.get('/dashboard/devices');
    return {
      success: Boolean(response?.success),
      data: Array.isArray(response?.data) ? response.data : [],
    };
  },
  toggleStatus: async (deviceId) => {
    const response = await baseApi.post(`/devices/${deviceId}/toggle`);
    return {
      success: Boolean(response?.success),
      data: response?.data || { id: deviceId },
      message: response?.message || '',
    };
  }
};

export default deviceService;
