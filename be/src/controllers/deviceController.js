const { randomUUID } = require('crypto');
const { query } = require('../config/db');
const { getAutoDecisionByThreshold, syncAutoDevicesAndApplyControl } = require('../services/autoControlService');

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
        { prefix: 'GAS', keywords: ['dev_gas_led', 'dev_dust_led', 'gas', 'dust', 'bui'] }
    ];

    const matchedRule = mappingRules.find((rule) =>
        rule.keywords.some((keyword) => normalizedName.includes(keyword))
    );

    return matchedRule ? matchedRule.prefix : 'DEVICE';
};

const toggleDevice = async (req, res) => {
    try {
        const { id } = req.params;
        const mqttService = req.app.locals.mqttService;

        const rows = await query(
            `
                SELECT id, name, value, status, auto_toggle
                FROM devices
                WHERE id = ?
                LIMIT 1
            `,
            [id]
        );

        const device = rows?.[0];
        if (!device) {
            return res.status(404).json({
                success: false,
                message: 'Khong tim thay thiet bi'
            });
        }

        const currentValue = Number(device.value || 0);
        const nextValue = currentValue === 1 ? 0 : 1;
        const commandPrefix = resolveDeviceCommandPrefix(device.name);
        const command = `${commandPrefix}_${nextValue === 1 ? 'ON' : 'OFF'}`;

        const actionHistoryId = randomUUID();

        await query(
            `
                UPDATE devices
                SET status = ?, auto_toggle = ?
                WHERE id = ?
            `,
            ['waiting', 0, id]
        );

        await query(
            `
                INSERT INTO action_history (id, device_id, command, executor, status, created_at)
                VALUES (?, ?, ?, ?, ?, NOW())
            `,
            [actionHistoryId, id, command, 'user', 'waiting']
        );

        // Not connected to MQTT or hardware, mark as failed immediately
        if (!mqttService || !mqttService.isConnected()) {
            await query(
                `
                    UPDATE devices
                    SET status = ?
                    WHERE id = ?
                `,
                ['failed', id]
            );

            await query(
                `
                    UPDATE action_history
                    SET status = ?
                    WHERE id = ?
                `,
                ['failed', actionHistoryId]
            );

            return res.status(200).json({
                success: true,
                data: {
                    id,
                    name: device.name,
                    value: currentValue,
                    status: 'failed',
                    auto_toggle: 0,
                    command
                },
                message: 'Khong the dieu khien thiet bi vi khong ket noi MQTT/hardware'
            });
        }

        // Send command and wait for hardware confirmation
        try {
            await mqttService.sendCommandAndWait(device.name, command, nextValue, 6000);

            await query(
                `
                    UPDATE devices
                    SET value = ?, status = ?
                    WHERE id = ?
                `,
                [nextValue, 'success', id]
            );

            await query(
                `
                    UPDATE action_history
                    SET status = ?
                    WHERE id = ?
                `,
                ['success', actionHistoryId]
            );

            return res.status(200).json({
                success: true,
                data: {
                    id,
                    name: device.name,
                    value: nextValue,
                    status: 'success',
                    auto_toggle: 0,
                    command
                }
            });
        } catch (error) {
            await query(
                `
                    UPDATE devices
                    SET status = ?
                    WHERE id = ?
                `,
                ['failed', id]
            );

            await query(
                `
                    UPDATE action_history
                    SET status = ?
                    WHERE id = ?
                `,
                ['failed', actionHistoryId]
            );

            return res.status(200).json({
                success: true,
                data: {
                    id,
                    name: device.name,
                    value: currentValue,
                    status: 'failed',
                    auto_toggle: 0,
                    command
                },
                message: error.message || 'Khong the xac nhan trang thai tu hardware'
            });
        }
    } catch (error) {
        console.error('Error while toggling device:', error);
        return res.status(500).json({
            success: false,
            message: 'Khong the bat/tat thiet bi',
            error: error.message
        });
    }
};

const toggleAutoMode = async (req, res) => {
    try {
        const { id } = req.params;
        const mqttService = req.app.locals.mqttService;

        const rows = await query(
            `
                SELECT id, name, value, status, auto_toggle
                FROM devices
                WHERE id = ?
                LIMIT 1
            `,
            [id]
        );

        const device = rows?.[0];
        if (!device) {
            return res.status(404).json({
                success: false,
                message: 'Khong tim thay thiet bi'
            });
        }

        const nextAutoToggle = Number(device.auto_toggle || 0) === 1 ? 0 : 1;
        let nextValue = Number(device.value || 0);

        if (nextAutoToggle === 1) {
            const autoDecision = await getAutoDecisionByThreshold(id);
            if (autoDecision.hasDecision) {
                nextValue = autoDecision.shouldTurnOn ? 1 : 0;
            }
        }

        await query(
            `
                UPDATE devices
                SET auto_toggle = ?, value = ?, status = ?
                WHERE id = ?
            `,
            [nextAutoToggle, nextValue, 'success', id]
        );

        const command = nextAutoToggle === 1 ? 'ENABLE_AUTO' : 'DISABLE_AUTO';
        await query(
            `
                INSERT INTO action_history (id, device_id, command, executor, status, created_at)
                VALUES (?, ?, ?, ?, ?, NOW())
            `,
            [randomUUID(), id, command, 'user', 'success']
        );

        await syncAutoDevicesAndApplyControl({
            mqttService,
            deviceId: id,
            trigger: 'toggle-auto'
        });

        const latestRows = await query(
            `
                SELECT id, name, value, status, auto_toggle
                FROM devices
                WHERE id = ?
                LIMIT 1
            `,
            [id]
        );

        const latestDevice = latestRows?.[0] || {
            id,
            name: device.name,
            value: nextValue,
            status: 'success',
            auto_toggle: nextAutoToggle
        };

        return res.status(200).json({
            success: true,
            data: {
                id: latestDevice.id,
                name: latestDevice.name,
                value: Number(latestDevice.value || 0),
                status: latestDevice.status,
                auto_toggle: Number(latestDevice.auto_toggle || 0),
                command
            }
        });
    } catch (error) {
        console.error('Error while toggling auto mode:', error);
        return res.status(500).json({
            success: false,
            message: 'Khong the bat/tat che do tu dong',
            error: error.message
        });
    }
};

module.exports = {
    toggleDevice,
    toggleAutoMode
};
