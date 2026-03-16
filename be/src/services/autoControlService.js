const { randomUUID } = require('crypto');
const { query } = require('../config/db');

const normalizeText = (value = '') => {
    return String(value)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toLowerCase();
};

const resolveDeviceCommandPrefix = (deviceName = '') => {
    const normalizedName = normalizeText(deviceName);

    const mappingRules = [
        { prefix: 'TEMP', keywords: ['dev_temp_led', 'temp', 'nhiet do', 'nhiet'] },
        { prefix: 'HUM', keywords: ['dev_hum_led', 'hum', 'do am', 'am'] },
        { prefix: 'LDR', keywords: ['dev_ldr_led', 'ldr', 'light', 'anh sang', 'anh'] },
        { prefix: 'GAS', keywords: ['dev_gas_led', 'gas', 'gas', 'khi gas', 'gas'] }
    ];

    const matchedRule = mappingRules.find((rule) =>
        rule.keywords.some((keyword) => normalizedName.includes(keyword))
    );

    return matchedRule ? matchedRule.prefix : 'DEVICE';
};

const getAutoDecisionByThreshold = async (deviceId) => {
    const rows = await query(
        `
            SELECT
                s.id,
                s.threshold_min,
                s.threshold_max,
                (
                    SELECT ds.value
                    FROM data_sensors ds
                    WHERE ds.sensor_id = s.id
                    ORDER BY ds.created_at DESC
                    LIMIT 1
                ) AS latest_value
            FROM sensors s
            WHERE s.device_id = ?
        `,
        [deviceId]
    );

    const sensors = rows.filter((item) => item.latest_value !== null && item.latest_value !== undefined);
    if (!sensors.length) {
        return {
            hasDecision: false,
            shouldTurnOn: false
        };
    }

    const isWithinThreshold = (item) => {
        const value = Number(item.latest_value);
        const min = item.threshold_min !== null && item.threshold_min !== undefined ? Number(item.threshold_min) : null;
        const max = item.threshold_max !== null && item.threshold_max !== undefined ? Number(item.threshold_max) : null;

        if (Number.isNaN(value)) {
            return false;
        }

        if (min !== null && !Number.isNaN(min) && value < min) {
            return false;
        }

        if (max !== null && !Number.isNaN(max) && value > max) {
            return false;
        }

        return true;
    };

    // Requirement: inside threshold => turn on, outside threshold => turn off.
    const shouldTurnOn = sensors.every((item) => isWithinThreshold(item));

    return {
        hasDecision: true,
        shouldTurnOn
    };
};

const getAutoToggleDevices = async (deviceId = null) => {
    if (deviceId) {
        return query(
            `
                SELECT id, name, value, status, auto_toggle
                FROM devices
                WHERE id = ?
                LIMIT 1
            `,
            [deviceId]
        );
    }

    return query(
        `
            SELECT id, name, value, status, auto_toggle
            FROM devices
            ORDER BY created_at ASC
        `
    );
};

const emitDeviceUpdate = (mqttService, payload) => {
    if (!mqttService?.io) {
        return;
    }

    mqttService.io.emit('device_status_update', payload);
};

const applyAutoControlForDevice = async (device, mqttService, trigger = 'auto-sync') => {
    const autoToggle = Number(device.auto_toggle || 0);
    if (autoToggle !== 1) {
        emitDeviceUpdate(mqttService, {
            device_id: device.id,
            value: Number(device.value || 0),
            status: device.status,
            auto_toggle: autoToggle
        });
        return;
    }

    const autoDecision = await getAutoDecisionByThreshold(device.id);
    if (!autoDecision.hasDecision) {
        return;
    }

    const currentValue = Number(device.value || 0);
    const targetValue = autoDecision.shouldTurnOn ? 1 : 0;

    if (currentValue === targetValue) {
        emitDeviceUpdate(mqttService, {
            device_id: device.id,
            value: currentValue,
            status: device.status,
            auto_toggle: autoToggle
        });
        return;
    }

    const commandPrefix = resolveDeviceCommandPrefix(device.name);
    const command = `${commandPrefix}_${targetValue === 1 ? 'ON' : 'OFF'}`;
    const actionHistoryId = randomUUID();

    await query(
        `
            UPDATE devices
            SET status = ?
            WHERE id = ?
        `,
        ['waiting', device.id]
    );

    await query(
        `
            INSERT INTO action_history (id, device_id, command, executor, status, created_at)
            VALUES (?, ?, ?, ?, ?, NOW())
        `,
        [actionHistoryId, device.id, command, `system-auto:${trigger}`, 'waiting']
    );

    emitDeviceUpdate(mqttService, {
        device_id: device.id,
        value: currentValue,
        status: 'waiting',
        auto_toggle: autoToggle
    });

    if (!mqttService || !mqttService.isConnected()) {
        await query(
            `
                UPDATE devices
                SET status = ?
                WHERE id = ?
            `,
            ['failed', device.id]
        );

        await query(
            `
                UPDATE action_history
                SET status = ?
                WHERE id = ?
            `,
            ['failed', actionHistoryId]
        );

        emitDeviceUpdate(mqttService, {
            device_id: device.id,
            value: currentValue,
            status: 'failed',
            auto_toggle: autoToggle
        });
        return;
    }

    try {
        await mqttService.sendCommandAndWait(device.name, command, targetValue, 6000);

        await query(
            `
                UPDATE devices
                SET value = ?, status = ?
                WHERE id = ?
            `,
            [targetValue, 'success', device.id]
        );

        await query(
            `
                UPDATE action_history
                SET status = ?
                WHERE id = ?
            `,
            ['success', actionHistoryId]
        );

        emitDeviceUpdate(mqttService, {
            device_id: device.id,
            value: targetValue,
            status: 'success',
            auto_toggle: autoToggle
        });
    } catch (error) {
        await query(
            `
                UPDATE devices
                SET status = ?
                WHERE id = ?
            `,
            ['failed', device.id]
        );

        await query(
            `
                UPDATE action_history
                SET status = ?
                WHERE id = ?
            `,
            ['failed', actionHistoryId]
        );

        emitDeviceUpdate(mqttService, {
            device_id: device.id,
            value: currentValue,
            status: 'failed',
            auto_toggle: autoToggle
        });
    }
};

const syncAutoDevicesAndApplyControl = async ({ mqttService, deviceId = null, trigger = 'manual-sync' }) => {
    const devices = await getAutoToggleDevices(deviceId);

    for (const device of devices) {
        await applyAutoControlForDevice(device, mqttService, trigger);
    }
};

module.exports = {
    getAutoDecisionByThreshold,
    syncAutoDevicesAndApplyControl
};
