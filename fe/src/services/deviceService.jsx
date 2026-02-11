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
   * @param {string} status - Trạng thái mới ('ON' hoặc 'OFF')
   * @returns {Promise} Kết quả toggle
   */
  toggleDeviceStatus: async (deviceId, status) => {
    try {
      const response = await baseApi.patch(`/devices/${deviceId}/toggle`, { status });
      return response;
    } catch (error) {
      console.error(`Error toggling device ${deviceId}:`, error);
      throw error;
    }
  },
};

export default deviceService;
