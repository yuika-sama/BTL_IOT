const axios = require('axios');
const chalk = require('chalk');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';

class ApiTester {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  async test(name, fn) {
    try {
      console.log(chalk.blue(`\n🧪 Testing: ${name}`));
      await fn();
      this.results.passed++;
      this.results.tests.push({ name, status: 'PASSED' });
      console.log(chalk.green(`✅ PASSED: ${name}`));
    } catch (error) {
      this.results.failed++;
      this.results.tests.push({ name, status: 'FAILED', error: error.message });
      console.log(chalk.red(`❌ FAILED: ${name}`));
      console.log(chalk.red(`   Error: ${error.message}`));
    }
  }

  printSummary() {
    console.log(chalk.cyan('\n' + '='.repeat(60)));
    console.log(chalk.cyan('📊 TEST SUMMARY'));
    console.log(chalk.cyan('='.repeat(60)));
    console.log(chalk.green(`✅ Passed: ${this.results.passed}`));
    console.log(chalk.red(`❌ Failed: ${this.results.failed}`));
    console.log(chalk.yellow(`📝 Total:  ${this.results.passed + this.results.failed}`));
    console.log(chalk.cyan('='.repeat(60) + '\n'));
  }

  async runAll() {
    console.log(chalk.magenta('🚀 Starting API Tests...\n'));

    // Test Devices
    await this.test('GET /devices/info - Get all devices info', async () => {
      const res = await axios.get(`${API_BASE_URL}/devices/info`);
      if (res.status !== 200) throw new Error('Expected status 200');
      if (!res.data.success) throw new Error('Expected success: true');
      console.log(`   Found ${res.data.data?.length || 0} devices`);
    });

    await this.test('PATCH /devices/:id/toggle - Toggle device status', async () => {
      const res = await axios.patch(`${API_BASE_URL}/devices/abcde1/toggle`);
      if (res.status !== 200) throw new Error('Expected status 200');
      console.log(`   Device status: ${res.data.data?.status || 'N/A'}`);
    });

    // Test Sensors
    await this.test('GET /sensors/latest - Get latest sensor values', async () => {
      const res = await axios.get(`${API_BASE_URL}/sensors/latest`);
      if (res.status !== 200) throw new Error('Expected status 200');
      if (!res.data.success) throw new Error('Expected success: true');
      const sensors = res.data.data;
      console.log(`   Temperature: ${sensors?.temperature?.value || 'N/A'}°C`);
      console.log(`   Humidity: ${sensors?.humidity?.value || 'N/A'}%`);
      console.log(`   Light: ${sensors?.light?.value || 'N/A'} (raw)`);
      console.log(`   Dust: ${sensors?.dust?.value || 'N/A'} μg/m³`);
    });

    // Test Data Sensors
    await this.test('GET /data-sensors/history - Get sensor history', async () => {
      const res = await axios.get(`${API_BASE_URL}/data-sensors/history?limit=10`);
      if (res.status !== 200) throw new Error('Expected status 200');
      if (!res.data.success) throw new Error('Expected success: true');
      console.log(`   Found ${res.data.data?.length || 0} history records`);
    });

    await this.test('GET /data-sensors/history - Filter by sensor type', async () => {
      const res = await axios.get(`${API_BASE_URL}/data-sensors/history?sensorType=temperature&limit=5`);
      if (res.status !== 200) throw new Error('Expected status 200');
      console.log(`   Found ${res.data.data?.length || 0} temperature records`);
    });

    await this.test('GET /data-sensors/aggregate/:sensorId - Get aggregate data', async () => {
      const sensorId = process.env.SENSOR_TEMPERATURE_ID;
      if (!sensorId) {
        console.log(chalk.yellow('   ⚠️  SENSOR_TEMPERATURE_ID not set, skipping'));
        return;
      }
      const res = await axios.get(`${API_BASE_URL}/data-sensors/aggregate/${sensorId}?interval=hour&limit=24`);
      if (res.status !== 200) throw new Error('Expected status 200');
      console.log(`   Found ${res.data.data?.length || 0} aggregated points`);
    });

    // Test Alerts
    await this.test('GET /alerts - Get all alerts', async () => {
      const res = await axios.get(`${API_BASE_URL}/alerts?limit=10`);
      if (res.status !== 200) throw new Error('Expected status 200');
      if (!res.data.success) throw new Error('Expected success: true');
      console.log(`   Found ${res.data.data?.length || 0} alerts`);
    });

    await this.test('GET /alerts - Filter by status', async () => {
      const res = await axios.get(`${API_BASE_URL}/alerts?status=active&limit=5`);
      if (res.status !== 200) throw new Error('Expected status 200');
      console.log(`   Found ${res.data.data?.length || 0} active alerts`);
    });

    await this.test('GET /alerts/statistics - Get alert statistics', async () => {
      const res = await axios.get(`${API_BASE_URL}/alerts/statistics`);
      if (res.status !== 200) throw new Error('Expected status 200');
      const stats = res.data.data;
      console.log(`   Total: ${stats?.total || 0}, Active: ${stats?.active || 0}, Resolved: ${stats?.resolved || 0}`);
    });

    // Test Action History
    await this.test('GET /action-history - Get all action history', async () => {
      const res = await axios.get(`${API_BASE_URL}/action-history?limit=10`);
      if (res.status !== 200) throw new Error('Expected status 200');
      if (!res.data.success) throw new Error('Expected success: true');
      console.log(`   Found ${res.data.data?.length || 0} actions`);
    });

    await this.test('GET /action-history - Filter by action type', async () => {
      const res = await axios.get(`${API_BASE_URL}/action-history?actionType=toggle_led&limit=5`);
      if (res.status !== 200) throw new Error('Expected status 200');
      console.log(`   Found ${res.data.data?.length || 0} toggle_led actions`);
    });

    await this.test('GET /action-history/statistics - Get action statistics', async () => {
      const res = await axios.get(`${API_BASE_URL}/action-history/statistics`);
      if (res.status !== 200) throw new Error('Expected status 200');
      const stats = res.data.data;
      console.log(`   Total actions: ${stats?.total || 0}`);
    });

    this.printSummary();
  }
}

// Run tests
const tester = new ApiTester();
tester.runAll().catch(err => {
  console.error(chalk.red('Fatal error:'), err.message);
  process.exit(1);
});