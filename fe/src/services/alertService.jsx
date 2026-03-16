import baseApi from './baseApi.jsx';

const normalizePagination = (pagination = {}) => {
  return {
    page: Number(pagination.page || 1),
    limit: Number(pagination.limit || 10),
    total: Number(pagination.total || 0),
    totalPages: Number(pagination.totalPages || 0),
  };
};

const buildListParams = (params = {}) => {
  const query = {
    page: params.page,
    limit: params.limit,
    search: params.search,
    filter: params.filter,
    order: params.order,
  };

  Object.keys(query).forEach((key) => {
    const value = query[key];
    if (value === undefined || value === null || value === '') {
      delete query[key];
    }
  });

  return query;
};

const alertService = {
  getAll: async (params = {}) => {
    const response = await baseApi.get('/alerts', {
      params: buildListParams(params),
    });

    return {
      success: Boolean(response?.success),
      data: {
        data: response?.data || [],
        pagination: normalizePagination(response?.pagination),
      },
    };
  },

  getDailyCount: async (date = null) => {
    const response = await baseApi.get('/alerts/daily-count', {
      params: date ? { date } : undefined,
    });

    return {
      success: Boolean(response?.success),
      data: {
        date: response?.data?.date || null,
        total_count: Number(response?.data?.total_count || 0),
        high_count: Number(response?.data?.high_count || 0),
        medium_count: Number(response?.data?.medium_count || 0),
        low_count: Number(response?.data?.low_count || 0),
        normal_count: Number(response?.data?.normal_count || 0),
      },
    };
  },

  getCountByDays: async (days = 7) => {
    const response = await baseApi.get('/alerts/count-by-days', {
      params: { days },
    });

    return {
      success: Boolean(response?.success),
      data: Array.isArray(response?.data) ? response.data : [],
    };
  },
};

export default alertService;
