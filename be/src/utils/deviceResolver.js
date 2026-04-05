/**
 * Device Resolver
 * Handles device name to command prefix resolution
 */

const { normalizeText } = require('./textUtils');
const { getCommandPrefix, getSensorTypeByDeviceName } = require('./sensorConfig');

/**
 * Resolve device command prefix from device name
 * Uses sensor configuration to determine the appropriate prefix
 *
 * Examples:
 *   'Máy bơm' -> 'HUM'
 *   'Nhiệt độ' -> 'TEMP'
 *   'Khóa gas' -> 'GAS'
 *   'Quang cảm' -> 'LDR'
 *   'Unknown Device' -> 'DEVICE'
 *
 * @param {string} deviceName - Name of device
 * @returns {string} Command prefix (e.g., 'TEMP', 'HUM', 'LDR', 'GAS', 'DEVICE')
 */
const resolveDeviceCommandPrefix = (deviceName = '') => {
  const sensorType = getSensorTypeByDeviceName(deviceName);

  if (sensorType) {
    return getCommandPrefix(sensorType);
  }

  // Fallback: try keyword matching
  const normalizedName = normalizeText(deviceName);

  const mappingRules = [
    { prefix: 'TEMP', keywords: ['temp', 'nhiet'] },
    { prefix: 'HUM', keywords: ['hum', 'may bom', 'bom'] },
    { prefix: 'LDR', keywords: ['ldr', 'light', 'quang', 'cam'] },
    { prefix: 'GAS', keywords: ['gas', 'khi'] }
  ];

  const matchedRule = mappingRules.find((rule) =>
    rule.keywords.some((keyword) => normalizedName.includes(keyword))
  );

  return matchedRule ? matchedRule.prefix : 'DEVICE';
};

/**
 * Build device command
 * @param {string} deviceName - Device name
 * @param {string} state - Device state ('ON' or 'OFF')
 * @returns {string} Command string (e.g., 'TEMP_ON', 'HUM_OFF')
 */
const buildDeviceCommand = (deviceName = '', state = 'OFF') => {
  const prefix = resolveDeviceCommandPrefix(deviceName);
  const normalizedState = String(state || 'OFF').toUpperCase();
  return `${prefix}_${normalizedState}`;
};

module.exports = {
  resolveDeviceCommandPrefix,
  buildDeviceCommand
};
