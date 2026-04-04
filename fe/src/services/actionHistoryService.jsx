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
    sensorFilter: params.sensorFilter,
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

    let formattedParams = {...params};
    if (formattedParams.filter === 'time' && isValidDateTime(formattedParams.search)) {
      // === Xử lý format search theo thời gian ===
      formattedParams.search = formatDateTime(formattedParams.search);
    } else if (!isValidDateTime(formattedParams.search)) {
      if (typeof formattedParams.search === 'string') {
        // 1. Định nghĩa từ điển thay thế
        const replacementMap = {
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
};

export default actionHistoryService;
