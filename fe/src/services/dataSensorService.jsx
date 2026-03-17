import baseApi from './baseApi.jsx';
import { processTimestamp } from '../utils/formatter.js';
const normalizePagination = (pagination = {}) => {
  return {
    page: Number(pagination.page || 1),
    limit: Number(pagination.limit || 10),
    total: Number(pagination.total || 0),
    totalPages: Number(pagination.totalPages || 0),
  };
};

const buildHistoryParams = (params = {}) => {
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

const dataSensorService = {
  getSensorHistory: async (params = {}) => {
    // Xử lý giá trị params là thời gian gửi đi -7 giờ
    const processedParams = { ...params };
    if (processedParams.search) {
      processedParams.search = processTimestamp(processedParams.search, -7);
    }

    const response = await baseApi.get('/data-sensors', {
      params: buildHistoryParams(processedParams),
    });

    // Xử lý thời gian hiển thị +7 giờ
    const timestampStr = response?.data?.[0]?.timestamp;
    const date = new Date(timestampStr)
    date.setHours(date.getHours() + 7);

    const formattedData = (response?.data || []).map(item => ({
      ...item,
      timestamp: date.toISOString(),
    }));

    return {
      success: Boolean(response?.success),
      data: {
        data: formattedData || [],
        pagination: normalizePagination(response?.pagination),
      },
    };
  },

  getInitialChartData: async (limit = 20) => {
    const response = await baseApi.get('/dashboard/sensors/initial', {
      params: { limit },
    });

    return {
      success: Boolean(response?.success),
      data: {
        temperature: Array.isArray(response?.data?.temperature) ? response.data.temperature : [],
        humidity: Array.isArray(response?.data?.humidity) ? response.data.humidity : [],
        light: Array.isArray(response?.data?.light) ? response.data.light : [],
        gas: Array.isArray(response?.data?.gas) ? response.data.gas : [],
      },
    };
  },

  getLatestValues: async () => {
    const response = await baseApi.get('/dashboard/sensors/latest');

    return {
      success: Boolean(response?.success),
      data: {
        temperature: response?.data?.temperature ?? null,
        humidity: response?.data?.humidity ?? null,
        light: response?.data?.light ?? null,
        gas: response?.data?.gas ?? null,
        timestamp: response?.data?.timestamp ?? null,
      },
    };
  },
};

export default dataSensorService;
