import baseApi from './baseApi';

const deviceService = {
  /**
   * Lấy thông tin tất cả thiết bị
   * @returns {Promise} Danh sách thiết bị
   */
  getAllDevicesInfo: async () => {
    try {
      const response = await baseApi.get('/devices/info');
      return response;
    } catch (error) {
      console.error('Error fetching devices info:', error);
      throw error;
    }
  },

  /**
   * Toggle trạng thái thiết bị (ON/OFF)
   * @param {string} deviceId - ID của thiết bị
   * @returns {Promise} Kết quả toggle
   */
  toggleStatus: async (deviceId) => {
    try {
      const response = await baseApi.patch(`/devices/${deviceId}/toggle`);
      return response;
    } catch (error) {
      console.error(`Error toggling device ${deviceId}:`, error);
      throw error;
    }
  },

  /**
   * Lấy thông tin một device theo ID
   * @param {String} deviceId - ID của device
   */
  getDeviceById: async (deviceId) => {
    try {
      const response = await baseApi.get(`/devices/${deviceId}`);
      return response;
    } catch (error) {
      console.error('Error fetching device:', error);
      throw error;
    }
  },
};

export default deviceService;
