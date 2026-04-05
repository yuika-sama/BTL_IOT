/**
 * SQL Mappings and Constants
 * Contains all database field mappings and order constants
 */

const ORDER_MAP = {
  asc: 'ASC',
  desc: 'DESC'
};

/**
 * Search filter mapping for action history queries
 * Maps search field names to SQL conditions
 */
const ACTION_HISTORY_SEARCH_MAP = {
  name: 'd.name LIKE ?',
  action: 'ah.command LIKE ?',
  status: 'ah.status LIKE ?',
  user: 'ah.executor LIKE ?',
  time: "DATE_FORMAT(ah.created_at, '%Y-%m-%d %H:%i:%s') LIKE ?"
};

/**
 * Search filter mapping for sensor data queries
 * Maps field names to SQL CAST conditions for numeric comparison
 */
const SENSOR_DATA_SEARCH_MAP = {
  temperature: 'CAST(g.temperature AS CHAR) LIKE ?',
  humidity: 'CAST(g.humidity AS CHAR) LIKE ?',
  light: 'CAST(g.light AS CHAR) LIKE ?',
  gas: 'CAST(g.gas AS CHAR) LIKE ?',
  time: "DATE_FORMAT(g.timestamp, '%Y-%m-%d %H:%i:%s') LIKE ?"
};

/**
 * Numeric filter column mapping for sensor data
 * Maps sensor types to the actual database column names in aggregated view
 */
const SENSOR_DATA_NUMERIC_FILTER_MAP = {
  temperature: 'g.temperature',
  humidity: 'g.humidity',
  light: 'g.light',
  gas: 'g.gas'
};

/**
 * Normalize sort order input
 * @param {string} orderInput - Sort order ('asc' or 'desc')
 * @returns {string} Normalized SQL order string
 */
const getNormalizedSortOrder = (orderInput = 'desc') => {
  const normalized = String(orderInput || 'desc').toLowerCase();
  return ORDER_MAP[normalized] || ORDER_MAP.desc;
};

/**
 * Get search filter SQL for action history
 * @param {string} filterKey - Filter field name
 * @returns {string|null} SQL condition or null if not found
 */
const getActionHistorySearchFilter = (filterKey) => {
  return ACTION_HISTORY_SEARCH_MAP[filterKey] || null;
};

/**
 * Get search filter SQL for sensor data
 * @param {string} filterKey - Filter field name
 * @returns {string|null} SQL condition or null if not found
 */
const getSensorDataSearchFilter = (filterKey) => {
  return SENSOR_DATA_SEARCH_MAP[filterKey] || null;
};

/**
 * Get numeric filter column for sensor data
 * @param {string} sensorType - Sensor type
 * @returns {string|null} Column name or null if not found
 */
const getSensorDataNumericColumn = (sensorType) => {
  return SENSOR_DATA_NUMERIC_FILTER_MAP[sensorType] || null;
};

module.exports = {
  ORDER_MAP,
  ACTION_HISTORY_SEARCH_MAP,
  SENSOR_DATA_SEARCH_MAP,
  SENSOR_DATA_NUMERIC_FILTER_MAP,
  getNormalizedSortOrder,
  getActionHistorySearchFilter,
  getSensorDataSearchFilter,
  getSensorDataNumericColumn
};
