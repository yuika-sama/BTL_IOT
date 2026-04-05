import baseApi from './baseApi.js';
import { formatDateTime, isValidDateTime } from '../utils/formatter.js';
import { buildQueryParams, normalizePagination } from '../utils/queryUtils.js';

const dataSensorService = {
  getSensorHistory: async (params = {}) => {
    const processedParams = { ...params };
    const searchValue = typeof processedParams.search === 'string' ? processedParams.search.trim() : '';

    // Only normalize date-time search when filter is time.
    if (processedParams.filter === 'time' && searchValue) {
      if (isValidDateTime(searchValue)) {
        processedParams.search = formatDateTime(searchValue);
      } else {
        processedParams.search = searchValue;
      }
    }

    const response = await baseApi.get('/data-sensors', {
      params: buildQueryParams(processedParams, ['page', 'limit', 'search', 'filter', 'order']),
    });

    return {
      success: Boolean(response?.success),
      data: {
        data: Array.isArray(response?.data) ? response.data : [],
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
