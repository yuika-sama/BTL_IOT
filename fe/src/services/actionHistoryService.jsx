import baseApi from './baseApi';

const actionHistoryService = {
  /**
   * Lấy tất cả lịch sử hành động với phân trang, tìm kiếm, lọc
   * @param {Object} params - Tham số query
   * @param {number} params.page - Trang hiện tại
   * @param {number} params.limit - Số lượng item mỗi trang
   * @param {string} params.search - Từ khóa tìm kiếm
   * @param {string} params.deviceId - Lọc theo ID thiết bị
   * @param {string} params.action - Loại hành động (ON, OFF)
   * @param {string} params.status - Trạng thái (success, failed)
   * @param {string} params.sortBy - Trường để sắp xếp
   * @param {string} params.sortOrder - Thứ tự sắp xếp (asc, desc)
   * @param {string} params.startDate - Ngày bắt đầu
   * @param {string} params.endDate - Ngày kết thúc
   * @returns {Promise} Lịch sử hành động
   */
  getAll: async (params = {}) => {
    try {
      const response = await baseApi.get('/action-history', { params });
      return response;
    } catch (error) {
      console.error('Error fetching action history:', error);
      throw error;
    }
  },
};

export default actionHistoryService;
