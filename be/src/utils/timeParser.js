/**
 * Time Parsing Utilities
 * Handles parsing and converting search keywords to time conditions
 */

/**
 * Pad number to 2 digits
 * @param {number|string} num - Number to pad
 * @returns {string} Padded string
 */
const pad2 = (num) => String(num).padStart(2, '0');

/**
 * Parse time search keyword into structured format
 * Supports formats:
 *   - DD/MM/YYYY
 *   - DD/MM/YYYY HH:MM
 *   - DD/MM/YYYY HH:MM:SS
 *   - MM/YYYY or DD/YYYY (ambiguous, resolved by value)
 *   - YYYY-MM-DD
 *   - YYYY-MM-DD HH:MM
 *   - YYYY-MM-DD HH:MM:SS
 *
 * @param {string} value - Search keyword
 * @returns {object|null} Parsed time object with type and value, or null
 */
const parseTimeSearchKeyword = (value) => {
  const keyword = String(value || '')
    .trim()
    .replace(/,/g, ' ')
    .replace(/\s+/g, ' ');

  if (!keyword) {
    return null;
  }

  // DMY Format with seconds: DD/MM/YYYY HH:MM:SS
  const secondDmyMatch = keyword.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})$/);
  if (secondDmyMatch) {
    const [, day, month, year, hour, minute, second] = secondDmyMatch;
    return { type: 'second', value: `${year}-${month}-${day} ${hour}:${minute}:${second}` };
  }

  // DMY Format with minutes: DD/MM/YYYY HH:MM
  const minuteDmyMatch = keyword.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})$/);
  if (minuteDmyMatch) {
    const [, day, month, year, hour, minute] = minuteDmyMatch;
    return { type: 'minute', value: `${year}-${month}-${day} ${hour}:${minute}` };
  }

  // DMY Format with hour: DD/MM/YYYY HH
  const hourDmyMatch = keyword.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2})$/);
  if (hourDmyMatch) {
    const [, day, month, year, hour] = hourDmyMatch;
    return { type: 'hour', value: `${year}-${month}-${day} ${hour}` };
  }

  // DMY Format: DD/MM/YYYY
  const dayDmyMatch = keyword.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (dayDmyMatch) {
    const [, day, month, year] = dayDmyMatch;
    return { type: 'day', value: `${year}-${month}-${day}` };
  }

  // Short Year Format with seconds: M/YYYY HH:MM:SS or DD/YYYY HH:MM:SS
  const secondShortYearMatch = keyword.match(/^(\d{1,2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})$/);
  if (secondShortYearMatch) {
    const [, firstPartRaw, year, hour, minute, second] = secondShortYearMatch;
    const firstPart = Number(firstPartRaw);
    const paddedFirstPart = pad2(firstPartRaw);

    if (firstPart >= 1 && firstPart <= 12) {
      return { type: 'monthYearSecond', value: `${paddedFirstPart}/${year} ${hour}:${minute}:${second}` };
    }

    if (firstPart >= 13 && firstPart <= 31) {
      return { type: 'dayYearSecond', value: `${paddedFirstPart}/${year} ${hour}:${minute}:${second}` };
    }
  }

  // Short Year Format with minutes: M/YYYY HH:MM or DD/YYYY HH:MM
  const minuteShortYearMatch = keyword.match(/^(\d{1,2})\/(\d{4})\s+(\d{2}):(\d{2})$/);
  if (minuteShortYearMatch) {
    const [, firstPartRaw, year, hour, minute] = minuteShortYearMatch;
    const firstPart = Number(firstPartRaw);
    const paddedFirstPart = pad2(firstPartRaw);

    if (firstPart >= 1 && firstPart <= 12) {
      return { type: 'monthYearMinute', value: `${paddedFirstPart}/${year} ${hour}:${minute}` };
    }

    if (firstPart >= 13 && firstPart <= 31) {
      return { type: 'dayYearMinute', value: `${paddedFirstPart}/${year} ${hour}:${minute}` };
    }
  }

  // Short Year Format with hour: M/YYYY HH or DD/YYYY HH
  const hourShortYearMatch = keyword.match(/^(\d{1,2})\/(\d{4})\s+(\d{2})$/);
  if (hourShortYearMatch) {
    const [, firstPartRaw, year, hour] = hourShortYearMatch;
    const firstPart = Number(firstPartRaw);
    const paddedFirstPart = pad2(firstPartRaw);

    if (firstPart >= 1 && firstPart <= 12) {
      return { type: 'monthYearHour', value: `${paddedFirstPart}/${year} ${hour}` };
    }

    if (firstPart >= 13 && firstPart <= 31) {
      return { type: 'dayYearHour', value: `${paddedFirstPart}/${year} ${hour}` };
    }
  }

  // Short Year Format: M/YYYY or DD/YYYY
  const shortYearMatch = keyword.match(/^(\d{1,2})\/(\d{4})$/);
  if (shortYearMatch) {
    const [, firstPartRaw, year] = shortYearMatch;
    const firstPart = Number(firstPartRaw);
    const paddedFirstPart = pad2(firstPartRaw);

    if (firstPart >= 1 && firstPart <= 12) {
      return { type: 'monthYear', value: `${paddedFirstPart}/${year}` };
    }

    if (firstPart >= 13 && firstPart <= 31) {
      return { type: 'dayYear', value: `${paddedFirstPart}/${year}` };
    }
  }

  // YMD Format with seconds: YYYY-MM-DD HH:MM:SS
  const secondYmdMatch = keyword.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/);
  if (secondYmdMatch) {
    const [, year, month, day, hour, minute, second] = secondYmdMatch;
    return { type: 'second', value: `${year}-${month}-${day} ${hour}:${minute}:${second}` };
  }

  // YMD Format with minutes: YYYY-MM-DD HH:MM
  const minuteYmdMatch = keyword.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})$/);
  if (minuteYmdMatch) {
    const [, year, month, day, hour, minute] = minuteYmdMatch;
    return { type: 'minute', value: `${year}-${month}-${day} ${hour}:${minute}` };
  }

  // YMD Format with hour: YYYY-MM-DD HH
  const hourYmdMatch = keyword.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2})$/);
  if (hourYmdMatch) {
    const [, year, month, day, hour] = hourYmdMatch;
    return { type: 'hour', value: `${year}-${month}-${day} ${hour}` };
  }

  // YMD Format: YYYY-MM-DD
  const dayYmdMatch = keyword.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dayYmdMatch) {
    const [, year, month, day] = dayYmdMatch;
    return { type: 'day', value: `${year}-${month}-${day}` };
  }

  return null;
};

/**
 * Build SQL time condition from parsed time object
 * @param {string} column - Database column name (e.g., 'ah.created_at')
 * @param {object} parsedTime - Parsed time object from parseTimeSearchKeyword
 * @returns {object|null} SQL condition object with sql and param, or null
 */
const buildTimeCondition = (column, parsedTime) => {
  if (!parsedTime) {
    return null;
  }

  if (parsedTime.type === 'day') {
    return {
      sql: `DATE(${column}) = ?`,
      param: parsedTime.value
    };
  }

  const dateFormatByType = {
    hour: '%Y-%m-%d %H',
    minute: '%Y-%m-%d %H:%i',
    second: '%Y-%m-%d %H:%i:%s',
    monthYear: '%m/%Y',
    monthYearHour: '%m/%Y %H',
    monthYearMinute: '%m/%Y %H:%i',
    monthYearSecond: '%m/%Y %H:%i:%s',
    dayYear: '%d/%Y',
    dayYearHour: '%d/%Y %H',
    dayYearMinute: '%d/%Y %H:%i',
    dayYearSecond: '%d/%Y %H:%i:%s'
  };

  const mysqlDateFormat = dateFormatByType[parsedTime.type];
  if (mysqlDateFormat) {
    return {
      sql: `DATE_FORMAT(${column}, '${mysqlDateFormat}') = ?`,
      param: parsedTime.value
    };
  }

  return null;
};

module.exports = {
  pad2,
  parseTimeSearchKeyword,
  buildTimeCondition
};
