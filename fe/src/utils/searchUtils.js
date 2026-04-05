const ACTION_HISTORY_REPLACEMENT_MAP = {
    'thành công': 'success',
    'thất bại': 'failed',
    'đang chờ': 'waiting',
    'chờ': 'waiting',
    'hệ thống': 'system',
    'người dùng': 'user',
    'bật': 'on',
    'tắt': 'off'
};

export const normalizeActionHistorySearch = (searchValue = '') => {
    if (typeof searchValue !== 'string') {
        return searchValue;
    }

    const normalized = searchValue.trim();
    if (!normalized) {
        return normalized;
    }

    const searchRegex = new RegExp(Object.keys(ACTION_HISTORY_REPLACEMENT_MAP).join('|'), 'gi');
    return normalized.replace(searchRegex, (matched) => ACTION_HISTORY_REPLACEMENT_MAP[matched.toLowerCase()] || matched);
};