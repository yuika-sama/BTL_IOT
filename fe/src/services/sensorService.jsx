const sensorService = {
  getLatestValues: async () => {
    return { success: true, data: { temperature: 0, humidity: 0, light: 0, dust: 0 } };
  },
  getAll: async (params = {}) => {
    return { success: true, data: { sensors: [], pagination: { page: 1, limit: 10, totalPages: 0, totalItems: 0 } } };
  },
  create: async (data) => {
    return { success: true, data: { ...data, id: Date.now().toString() } };
  },
  update: async (id, data) => {
    return { success: true, data: { id, ...data } };
  },
  delete: async (id) => {
    return { success: true, data: { id } };
  },
};

export default sensorService;
