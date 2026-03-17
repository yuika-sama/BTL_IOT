import baseApi from './baseApi.jsx';
import { formatDateTime, isValidDateTime } from '../utils/formatter.js';

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

const actionHistoryService = {
  getAll: async (params = {}) => {

    // === Xử lý thay thế các cụm từ trong params.search ===
    let formattedParams = {...params};
    if (!isValidDateTime(formattedParams.search)) {
      if (typeof formattedParams.search === 'string') {
        // 1. Định nghĩa từ điển thay thế
        const replacementMap = {
          // auto bật/tắt
          "auto_enable": "enable_auto",
          "auto_disable": "disable_auto",
          "auto enable": "enable_auto",
          "auto disable": "disable_auto",
          "enable auto": "enable_auto",
          "disable auto": "disable_auto",
          "bật tự động": "enable_auto",
          "tắt tự động": "disable_auto",
          "tự động bật": "enable_auto",
          "tự động tắt": "disable_auto",
          // trạng thái thiết bị
          "thành công": "success",
          "thất bại": "failed",
          "đang chờ": "waiting",
          "chờ": "waiting",
          // người thực thi
          "hệ thống": "system",
          "người dùng": "user",
          // trạng thái bật/tắt
          "bật": "on",
          "tắt": "off",
        };

        // 2. Tạo một Regex tổng hợp từ các Key của Object
        // Sử dụng | để tìm tất cả các cụm từ trong 1 lần quét duy nhất
        const searchRegex = new RegExp(Object.keys(replacementMap).join('|'), 'gi');

        // 3. Thực hiện thay thế một lần duy nhất
        formattedParams.search = formattedParams.search.replace(searchRegex, (matched) => {
          return replacementMap[matched.toLowerCase()];
        });
      }
    } else {
      // === Xử lý format search theo thời gian ===
      formattedParams.search = formatDateTime(formattedParams.search);
    }


    const response = await baseApi.get('/action-history', {
      params: buildListParams(formattedParams),
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
    const response = await baseApi.get('/action-history/daily-count', {
      params: date ? { date } : undefined,
    });

    return {
      success: Boolean(response?.success),
      data: {
        date: response?.data?.date || null,
        on_count: Number(response?.data?.on_count || 0),
        off_count: Number(response?.data?.off_count || 0),
      },
    };
  },

  getCountByDays: async (days = 7) => {
    const response = await baseApi.get('/action-history/count-by-days', {
      params: { days },
    });

    return {
      success: Boolean(response?.success),
      data: Array.isArray(response?.data) ? response.data : [],
    };
  },
};

export default actionHistoryService;
