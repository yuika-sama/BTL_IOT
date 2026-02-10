const io = require('socket.io-client');
const chalk = require('chalk');

const SOCKET_URL = process.env.SOCKET_URL || 'http://localhost:3000';

console.log(chalk.magenta('🔌 Socket.IO Test Client'));
console.log(chalk.cyan('='.repeat(60)));
console.log(chalk.blue(`Connecting to: ${SOCKET_URL}\n`));

const socket = io(SOCKET_URL, {
  transports: ['websocket'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5
});

let messageCount = 0;
let startTime = Date.now();

// Connection events
socket.on('connect', () => {
  console.log(chalk.green('✅ Connected to Socket.IO server'));
  console.log(chalk.gray(`   Socket ID: ${socket.id}`));
  console.log(chalk.cyan('\n🔍 Listening for events...\n'));
});

socket.on('disconnect', (reason) => {
  console.log(chalk.yellow(`\n⚠️  Disconnected: ${reason}`));
});

socket.on('connect_error', (error) => {
  console.log(chalk.red(`❌ Connection Error: ${error.message}`));
});

socket.on('reconnect', (attemptNumber) => {
  console.log(chalk.green(`🔄 Reconnected after ${attemptNumber} attempts`));
});

// Sensor data event
socket.on('sensor_data', (data) => {
  messageCount++;
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  
  console.log(chalk.cyan('─'.repeat(60)));
  console.log(chalk.green(`📊 SENSOR DATA #${messageCount}`) + chalk.gray(` (${elapsed}s)`));
  console.log(chalk.cyan('─'.repeat(60)));
  
  console.log(chalk.blue('🔧 Device:'), data.device_id || 'N/A');
  
  if (data.sensors) {
    console.log(chalk.yellow('\n📈 Sensors:'));
    if (data.sensors.temperature !== undefined) {
      console.log(chalk.white(`  🌡️  Temperature: ${data.sensors.temperature}°C`));
    }
    if (data.sensors.humidity !== undefined) {
      console.log(chalk.white(`  💧 Humidity:    ${data.sensors.humidity}%`));
    }
    if (data.sensors.light_raw !== undefined) {
      console.log(chalk.white(`  💡 Light:       ${data.sensors.light_raw} (raw)`));
    }
    if (data.sensors.dust_ugm3 !== undefined) {
      console.log(chalk.white(`  🌫️  Dust:        ${data.sensors.dust_ugm3} μg/m³`));
    }
  }
  
  if (data.leds) {
    console.log(chalk.magenta('\n💡 LEDs Status:'));
    Object.entries(data.leds).forEach(([led, state]) => {
      const icon = state === 'ON' ? '●' : '○';
      const color = state === 'ON' ? chalk.green : chalk.gray;
      console.log(color(`  ${icon} ${led.padEnd(12)}: ${state}`));
    });
  }
  
  console.log(chalk.gray(`\n⏰ Timestamp: ${data.timestamp || new Date().toISOString()}`));
  console.log('');
});

// Alert event
socket.on('alert', (alert) => {
  console.log(chalk.red('🚨 ALERT RECEIVED!'));
  console.log(chalk.red('─'.repeat(60)));
  console.log(chalk.white('  Type:    '), alert.type || 'N/A');
  console.log(chalk.white('  Message: '), alert.message || 'N/A');
  console.log(chalk.white('  Sensor:  '), alert.sensor_id || 'N/A');
  console.log(chalk.white('  Value:   '), alert.value || 'N/A');
  console.log(chalk.red('─'.repeat(60) + '\n'));
});

// Device status event
socket.on('device_status', (status) => {
  console.log(chalk.blue('📡 DEVICE STATUS UPDATE'));
  console.log(chalk.blue('─'.repeat(60)));
  console.log(chalk.white('  Device:  '), status.device_id || 'N/A');
  console.log(chalk.white('  Status:  '), status.status || 'N/A');
  console.log(chalk.blue('─'.repeat(60) + '\n'));
});

// Statistics
setInterval(() => {
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
  const rate = (messageCount / (elapsed || 1)).toFixed(2);
  console.log(chalk.gray(`📊 Stats: ${messageCount} messages in ${elapsed}s (${rate} msg/s)`));
}, 30000); // Every 30 seconds

// Graceful shutdown
process.on('SIGINT', () => {
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(chalk.yellow('\n\n👋 Shutting down...'));
  console.log(chalk.cyan('─'.repeat(60)));
  console.log(chalk.white('Total messages received:'), messageCount);
  console.log(chalk.white('Total time:             '), `${elapsed}s`);
  console.log(chalk.white('Average rate:           '), `${(messageCount / (elapsed || 1)).toFixed(2)} msg/s`);
  console.log(chalk.cyan('─'.repeat(60)));
  socket.close();
  process.exit(0);
});

console.log(chalk.gray('Press Ctrl+C to stop\n'));