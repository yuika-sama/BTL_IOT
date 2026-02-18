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
   * Lấy danh sách devices với pagination và filters (Admin)
   * @param {Object} params - Query parameters
   * @returns {Promise} Danh sách devices
   */
  getAll: async (params = {}) => {
    try {
      const response = await baseApi.get('/devices', { params });
      return response;
    } catch (error) {
      console.error('Error fetching all devices:', error);
      throw error;
    }
  },

  /**
   * Tạo device mới (Admin)
   * @param {Object} data - Device data
   * @returns {Promise} Device đã tạo
   */
  create: async (data) => {
    try {
      const response = await baseApi.post('/devices', data);
      return response;
    } catch (error) {
      console.error('Error creating device:', error);
      throw error;
    }
  },

  /**
   * Cập nhật device (Admin)
   * @param {string} id - Device ID
   * @param {Object} data - Device data
   * @returns {Promise} Device đã cập nhật
   */
  update: async (id, data) => {
    try {
      const response = await baseApi.put(`/devices/${id}`, data);
      return response;
    } catch (error) {
      console.error('Error updating device:', error);
      throw error;
    }
  },

  /**
   * Xóa device (Admin)
   * @param {string} id - Device ID
   * @returns {Promise} Kết quả xóa
   */
  delete: async (id) => {
    try {
      const response = await baseApi.delete(`/devices/${id}`);
      return response;
    } catch (error) {
      console.error('Error deleting device:', error);
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
  
  toggleAutoMode: async (deviceId) => {
    try {      
      const response = await baseApi.patch(`/devices/${deviceId}/auto-toggle`);
      return response;
    } catch (error) {
      console.error(`Error toggling auto mode for device ${deviceId}:`, error);
      throw error;
    }
  }
};

export default deviceService;
