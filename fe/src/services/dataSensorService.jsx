import baseApi from './baseApi';

const dataSensorService = {
  /**
   * Lấy lịch sử dữ liệu cảm biến với phân trang, tìm kiếm, lọc
   * @param {Object} params - Tham số query
   * @param {number} params.page - Trang hiện tại
   * @param {number} params.limit - Số lượng item mỗi trang
   * @param {string} params.search - Từ khóa tìm kiếm
   * @param {string} params.sensorType - Loại cảm biến (temperature, humidity, light, dust)
   * @param {string} params.sortBy - Trường để sắp xếp
   * @param {string} params.sortOrder - Thứ tự sắp xếp (asc, desc)
   * @param {string} params.startDate - Ngày bắt đầu
   * @param {string} params.endDate - Ngày kết thúc
   * @returns {Promise} Lịch sử dữ liệu cảm biến
   */
  getSensorHistory: async (params = {}) => {
    try {
      const response = await baseApi.get('/data-sensors/history', { params });
      return response;
    } catch (error) {
      console.error('Error fetching sensor history:', error);
      throw error;
    }
  },

  /**
   * Lấy dữ liệu tổng hợp cho biểu đồ của một cảm biến
   * @param {string} sensorId - ID của cảm biến
   * @param {Object} params - Tham số query
   * @param {string} params.period - Khoảng thời gian (hour, day, week, month)
   * @param {string} params.startDate - Ngày bắt đầu
   * @param {string} params.endDate - Ngày kết thúc
   * @returns {Promise} Dữ liệu tổng hợp
   */
  getAggregateData: async (sensorId, params = {}) => {
    try {
      const response = await baseApi.get(`/data-sensors/aggregate/${sensorId}`, { params });
      return response;
    } catch (error) {
      console.error(`Error fetching aggregate data for sensor ${sensorId}:`, error);
      throw error;
    }
  },

  /**
   * Lấy dữ liệu ban đầu cho biểu đồ của tất cả 4 cảm biến
   * @param {Object} params - Tham số query
   * @param {number} params.limit - Số lượng điểm dữ liệu ban đầu (mặc định 20)
   * @returns {Promise} Dữ liệu ban đầu cho 4 sensors
   */
  getInitialChartData: async (params = {}) => {
    try {
      const response = await baseApi.get('/data-sensors/initial-chart-data', { params });
      return response;
    } catch (error) {
      console.error('Error fetching initial chart data:', error);
      throw error;
    }
  },
};

export default dataSensorService;
