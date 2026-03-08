const alertService = {
  getAll: async (params = {}) => {
    return { success: true, data: { alerts: [], pagination: { page: 1, limit: 10, totalPages: 0, totalItems: 0 } } };
  },
  getDailyCount: async (date = null) => {
    return { success: true, data: 0 };
  },
  getCountByDays: async (days = 7) => {
    return { success: true, data: [] };
  },
};

export default alertService;
