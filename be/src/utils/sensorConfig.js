/**
 * Central Configuration for Sensors and Devices
 * Modify this file to add new sensors or devices
 */

const SENSOR_TYPES = {
  TEMPERATURE: 'temperature',
  HUMIDITY: 'humidity',
  LIGHT: 'light',
  GAS: 'gas'
};

/**
 * Sensor configuration: Define sensor names, keywords, and conditions
 * Easy to extend when adding new sensors
 */
const SENSORS = {
  [SENSOR_TYPES.TEMPERATURE]: {
    name: 'Temperature',
    keywords: ['dev_temp_led', 'temp', 'nhiet do', 'nhiet', 'temperature'],
    sqlConditions: "(LOWER(s.name) LIKE '%temp%' OR LOWER(s.name) LIKE '%nhiet%')",
    commandPrefix: 'TEMP'
  },
  [SENSOR_TYPES.HUMIDITY]: {
    name: 'Humidity',
    keywords: ['dev_hum_led', 'hum', 'may bom', 'bom', 'humidity'],
    sqlConditions: "(LOWER(s.name) LIKE '%hum%' OR LOWER(s.name) LIKE '%am%')",
    commandPrefix: 'HUM'
  },
  [SENSOR_TYPES.LIGHT]: {
    name: 'Light',
    keywords: ['dev_ldr_led', 'ldr', 'light', 'quang cam', 'quang', 'cam', 'anh', 'anh sang', 'sáng'],
    sqlConditions: "(LOWER(s.name) LIKE '%light%' OR LOWER(s.name) LIKE '%anh%' OR LOWER(s.name) LIKE '%anh sang%' OR LOWER(s.name) LIKE '%ánh%' OR LOWER(s.name) LIKE '%sáng%' OR LOWER(s.name) LIKE '%ldr%')",
    commandPrefix: 'LDR'
  },
  [SENSOR_TYPES.GAS]: {
    name: 'Gas',
    keywords: ['dev_gas_led', 'gas', 'khi gas', 'khí gas'],
    sqlConditions: "(LOWER(s.name) LIKE '%gas%' OR LOWER(s.name) LIKE '%khi%')",
    commandPrefix: 'GAS'
  }
};

/**
 * Device name to sensor type mapping
 * Maps specific device names to the sensor type they control
 */
const DEVICE_SENSOR_MAPPING = {
  'may bom': SENSOR_TYPES.HUMIDITY,       // Pump -> Humidity
  'máy bơm': SENSOR_TYPES.HUMIDITY,
  'khoa gas': SENSOR_TYPES.GAS,           // Gas Lock
  'khóa gas': SENSOR_TYPES.GAS,
  'quang cam': SENSOR_TYPES.LIGHT,        // Light Sensor
  'quang cảm': SENSOR_TYPES.LIGHT,
  'nhiet ke': SENSOR_TYPES.TEMPERATURE,   // Thermometer
  'nhiệt kế': SENSOR_TYPES.TEMPERATURE
};

/**
 * Get sensor configuration by type
 * @param {string} sensorType - Type of sensor (temperature, humidity, light, gas)
 * @returns {object|null} Sensor config or null if not found
 */
const getSensorConfig = (sensorType) => {
  return SENSORS[sensorType] || null;
};

/**
 * Get all sensor types
 * @returns {string[]} Array of sensor types
 */
const getAllSensorTypes = () => {
  return Object.keys(SENSORS);
};

/**
 * Get SQL condition for a sensor type
 * @param {string} sensorType - Type of sensor
 * @returns {string} SQL condition string
 */
const getSensorSqlCondition = (sensorType) => {
  const config = getSensorConfig(sensorType);
  return config ? config.sqlConditions : '';
};

/**
 * Get command prefix for a sensor type
 * @param {string} sensorType - Type of sensor
 * @returns {string} Command prefix (e.g., 'TEMP', 'HUM')
 */
const getCommandPrefix = (sensorType) => {
  const config = getSensorConfig(sensorType);
  return config ? config.commandPrefix : 'DEVICE';
};

/**
 * Get sensor type for a device name
 * @param {string} deviceName - Name of device
 * @returns {string|null} Sensor type or null
 */
const getSensorTypeByDeviceName = (deviceName) => {
  const normalizedName = String(deviceName || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

  return DEVICE_SENSOR_MAPPING[normalizedName] || null;
};

module.exports = {
  SENSOR_TYPES,
  SENSORS,
  DEVICE_SENSOR_MAPPING,
  getSensorConfig,
  getAllSensorTypes,
  getSensorSqlCondition,
  getCommandPrefix,
  getSensorTypeByDeviceName
};
