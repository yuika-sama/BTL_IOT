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
};

export default sensorService;
