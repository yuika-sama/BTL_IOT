const dataSensorService = {
  getSensorHistory: async (params = {}) => {
    return { success: true, data: { dataSensors: [], pagination: { page: 1, limit: 10, totalPages: 0, totalItems: 0 } } };
  },
  getInitialChartData: async (params = {}) => {
    return { success: true, data: { temperature: [], humidity: [], light: [], dust: [] } };
  },
};

export default dataSensorService;
