import baseApi from './baseApi';

const alertService = {
  /**
   * Lấy tất cả cảnh báo với phân trang, tìm kiếm, lọc
   * @param {Object} params - Tham số query
   * @param {number} params.page - Trang hiện tại
   * @param {number} params.limit - Số lượng item mỗi trang
   * @param {string} params.search - Từ khóa tìm kiếm
   * @param {string} params.sensorType - Loại cảm biến
   * @param {string} params.severity - Mức độ nghiêm trọng (low, medium, high, critical)
   * @param {string} params.status - Trạng thái (active, resolved, dismissed)
   * @param {string} params.sortBy - Trường để sắp xếp
   * @param {string} params.sortOrder - Thứ tự sắp xếp (asc, desc)
   * @param {string} params.startDate - Ngày bắt đầu
   * @param {string} params.endDate - Ngày kết thúc
   * @returns {Promise} Danh sách cảnh báo
   */
  getAll: async (params = {}) => {
    try {
      const response = await baseApi.get('/alerts', { params });
      return response;
    } catch (error) {
      console.error('Error fetching alerts:', error);
      throw error;
    }
  },
};

export default alertService;
