import baseApi from './baseApi.js';
import { formatDateTime, isValidDateTime } from '../utils/formatter.js';
import { buildQueryParams, normalizePagination } from '../utils/queryUtils.js';
import { normalizeActionHistorySearch } from '../utils/searchUtils.js';

const actionHistoryService = {
  getAll: async (params = {}) => {

    const formattedParams = { ...params };
    if (formattedParams.filter === 'time' && isValidDateTime(formattedParams.search)) {
      formattedParams.search = formatDateTime(formattedParams.search);
    } else if (!isValidDateTime(formattedParams.search)) {
      formattedParams.search = normalizeActionHistorySearch(formattedParams.search);
    }

    const queryParams = buildQueryParams(formattedParams, [
      'page',
      'limit',
      'search',
      'filter',
      'sensorFilter',
      'actionFilter',
      'statusFilter',
      'executorFilter',
      'order'
    ]);


    const response = await baseApi.get('/action-history', {
      params: queryParams,
    });

    return {
      success: Boolean(response?.success),
      data: {
        data: response?.data || [],
        pagination: normalizePagination(response?.pagination),
      },
    };
  },

  getStats: async (date) => {
    const params = date ? { date } : {};
    const response = await baseApi.get('/action-history/stats', { params });
    return response;
  }
};

export default actionHistoryService;
