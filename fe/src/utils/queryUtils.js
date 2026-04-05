export const normalizePagination = (pagination = {}) => {
    return {
        page: Number(pagination.page || 1),
        limit: Number(pagination.limit || 10),
        total: Number(pagination.total || 0),
        totalPages: Number(pagination.totalPages || 0)
    };
};

export const buildQueryParams = (params = {}, allowedKeys = []) => {
    const query = {};

    allowedKeys.forEach((key) => {
        const value = params[key];
        if (value !== undefined && value !== null && value !== '') {
            query[key] = value;
        }
    });

    return query;
};