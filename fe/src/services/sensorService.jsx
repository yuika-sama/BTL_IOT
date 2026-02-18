import baseApi from './baseApi';

const sensorService = {
  /**
   * Lấy giá trị mới nhất của tất cả cảm biến (temperature, humidity, light, dust)
   * @returns {Promise} Giá trị mới nhất của 4 loại cảm biến
   */
  getLatestValues: async () => {
    try {
      const response = await baseApi.get('/sensors/latest');
      return response;
    } catch (error) {
      console.error('Error fetching latest sensor values:', error);
      throw error;
    }
  },

  /**
   * Lấy danh sách sensors với pagination và filters (Admin)
   * @param {Object} params - Query parameters
   * @returns {Promise} Danh sách sensors
   */
  getAll: async (params = {}) => {
    try {
      const response = await baseApi.get('/sensors', { params });
      return response;
    } catch (error) {
      console.error('Error fetching all sensors:', error);
      throw error;
    }
  },

  /**
   * Tạo sensor mới (Admin)
   * @param {Object} data - Sensor data
   * @returns {Promise} Sensor đã tạo
   */
  create: async (data) => {
    try {
      const response = await baseApi.post('/sensors', data);
      return response;
    } catch (error) {
      console.error('Error creating sensor:', error);
      throw error;
    }
  },

  /**
   * Cập nhật sensor (Admin)
   * @param {string} id - Sensor ID
   * @param {Object} data - Sensor data
   * @returns {Promise} Sensor đã cập nhật
   */
  update: async (id, data) => {
    try {
      const response = await baseApi.put(`/sensors/${id}`, data);
      return response;
    } catch (error) {
      console.error('Error updating sensor:', error);
      throw error;
    }
  },

  /**
   * Xóa sensor (Admin)
   * @param {string} id - Sensor ID
   * @returns {Promise} Kết quả xóa
   */
  delete: async (id) => {
    try {
      const response = await baseApi.delete(`/sensors/${id}`);
      return response;
    } catch (error) {
      console.error('Error deleting sensor:', error);
      throw error;
    }
  },
};

export default sensorService;
