require('dotenv').config();
const mqtt = require('mqtt');
const chalk = require('chalk');

// MQTT Configuration
const brokerUrl = `mqtts://${process.env.MQTT_BROKER}:${process.env.MQTT_PORT}`;
const clientId = `monitor-${Date.now()}`;

const mqttOptions = {
  clientId,
  username: process.env.MQTT_USERNAME,
  password: process.env.MQTT_PASSWORD,
  rejectUnauthorized: process.env.MQTT_TLS_REJECT_UNAUTHORIZED === 'true',
  clean: true,
  reconnectPeriod: 1000,
};

console.log(chalk.cyan('='.repeat(60)));
console.log(chalk.cyan.bold('📡 IoT Sensor Data Monitor'));
console.log(chalk.cyan('='.repeat(60)));
console.log(chalk.gray(`Broker: ${brokerUrl}`));
console.log(chalk.gray(`Client ID: ${clientId}`));
console.log(chalk.gray(`Topic: ${process.env.MQTT_TOPIC_DEVICE_DATA}`));
console.log(chalk.cyan('='.repeat(60)));
console.log('');

// Create MQTT client
const client = mqtt.connect(brokerUrl, mqttOptions);

let messageCount = 0;
let startTime = Date.now();

// Connection handlers
client.on('connect', () => {
  console.log(chalk.green('✅ Connected to MQTT broker'));
  
  const topic = process.env.MQTT_TOPIC_DEVICE_DATA;
  
  client.subscribe(topic, { qos: 1 }, (err) => {
    if (err) {
      console.error(chalk.red('❌ Subscription error:'), err.message);
      process.exit(1);
    } else {
      console.log(chalk.green(`✅ Subscribed to: ${topic}`));
      console.log(chalk.yellow('\n🔍 Waiting for messages from ESP32...\n'));
    }
  });
});

client.on('error', (error) => {
  console.error(chalk.red('\n❌ MQTT Connection Error:'));
  console.error(chalk.red('  Message:'), error.message);
  console.error(chalk.red('  Code:'), error.code || 'N/A');
  console.error(chalk.red('  Stack:'), error.stack);
});

client.on('reconnect', () => {
  console.log(chalk.yellow('🔄 Reconnecting to MQTT broker...'));
});

client.on('disconnect', () => {
  console.log(chalk.yellow('⚠️  Disconnected from MQTT broker'));
});

client.on('offline', () => {
  console.log(chalk.yellow('📴 Client is offline'));
});

// Message handler
client.on('message', (topic, message) => {
  try {
    messageCount++;
    const payload = JSON.parse(message.toString());
    const timestamp = new Date().toLocaleString('vi-VN');
    
    console.log(chalk.cyan('─'.repeat(60)));
    console.log(chalk.white.bold(`📥 Message #${messageCount} - ${timestamp}`));
    console.log(chalk.gray(`Topic: ${topic}`));
    console.log('');
    
    // Device info
    if (payload.device_id) {
      console.log(chalk.blue('🔧 Device:'), chalk.white(payload.device_id));
    }
    
    // Sensor data
    if (payload.sensors) {
      console.log(chalk.magenta('\n📊 Sensor Readings:'));
      
      const sensors = payload.sensors;
      
      if (sensors.temperature !== undefined) {
        const temp = sensors.temperature;
        const color = temp < 20 ? chalk.cyan : temp > 30 ? chalk.red : chalk.green;
        console.log(`  🌡️  Temperature: ${color(temp + '°C')}`);
      }
      
      if (sensors.humidity !== undefined) {
        const hum = sensors.humidity;
        const color = hum < 40 ? chalk.yellow : hum > 70 ? chalk.blue : chalk.green;
        console.log(`  💧 Humidity:    ${color(hum + '%')}`);
      }
      
      if (sensors.light_raw !== undefined) {
        const light = sensors.light_raw;
        const color = light < 500 ? chalk.gray : light > 2000 ? chalk.yellow : chalk.white;
        console.log(`  💡 Light:       ${color(light + ' (raw)')}`);
      }
      
      if (sensors.dust_ugm3 !== undefined) {
        const dust = sensors.dust_ugm3;
        const color = dust > 50 ? chalk.red : dust > 30 ? chalk.yellow : chalk.green;
        console.log(`  🌫️  Dust:        ${color(dust + ' μg/m³')}`);
      }
    }
    
    // LED status
    if (payload.leds) {
      console.log(chalk.magenta('\n💡 LED Status:'));
      const leds = payload.leds;
      
      Object.entries(leds).forEach(([name, status]) => {
        const indicator = status === 'ON' ? chalk.green('●') : chalk.gray('○');
        const statusColor = status === 'ON' ? chalk.green : chalk.gray;
        console.log(`  ${indicator} ${name.padEnd(12)}: ${statusColor(status)}`);
      });
    }
    
    // Raw JSON
    console.log(chalk.gray('\n📋 Raw JSON:'));
    console.log(chalk.gray(JSON.stringify(payload, null, 2)));
    
    console.log('');
    
    // Statistics
    const uptime = Math.floor((Date.now() - startTime) / 1000);
    const rate = (messageCount / uptime).toFixed(2);
    console.log(chalk.gray(`📈 Stats: ${messageCount} messages | ${uptime}s uptime | ${rate} msg/s`));
    
  } catch (error) {
    console.error(chalk.red('\n❌ Error parsing message:'));
    console.error(chalk.red('  Error:'), error.message);
    console.error(chalk.red('  Raw message:'), message.toString());
    console.error(chalk.red('  Stack:'), error.stack);
  }
});

// Handle process termination
process.on('SIGINT', () => {
  console.log(chalk.yellow('\n\n👋 Shutting down monitor...'));
  
  const uptime = Math.floor((Date.now() - startTime) / 1000);
  console.log(chalk.cyan('\n📊 Session Summary:'));
  console.log(chalk.gray(`  Total messages: ${messageCount}`));
  console.log(chalk.gray(`  Uptime: ${uptime}s`));
  console.log(chalk.gray(`  Average rate: ${(messageCount / uptime).toFixed(2)} msg/s`));
  
  client.end(() => {
    console.log(chalk.green('✅ Disconnected from MQTT broker'));
    process.exit(0);
  });
});

process.on('uncaughtException', (error) => {
  console.error(chalk.red('\n❌ Uncaught Exception:'));
  console.error(chalk.red('  Message:'), error.message);
  console.error(chalk.red('  Stack:'), error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('\n❌ Unhandled Promise Rejection:'));
  console.error(chalk.red('  Reason:'), reason);
  console.error(chalk.red('  Promise:'), promise);
});
