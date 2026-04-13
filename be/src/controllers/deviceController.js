const { randomUUID } = require('crypto');
const { query } = require('../config/db');
const { resolveDeviceCommandPrefix } = require('../utils/deviceResolver');


// Flow: Người dùng gửi yêu cầu bật/tắt thiết bị 
// -> Cập nhật trạng thái thiết bị thành "waiting" 
// -> Ghi nhận lịch sử hành động với trạng thái "waiting" 
// -> Gửi lệnh qua MQTT 
// -> Nếu có phản hồi xác nhận từ hardware, cập nhật trạng thái thiết bị và lịch sử hành động thành "success", 
// ngược lại cập nhật thành "failed"
const toggleDevice = async (req, res) => {
    try {
        const { id } = req.params;
        const mqttService = req.app.locals.mqttService;

        const rows = await query(
            `
                SELECT id, name, value
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
                INSERT INTO action_history (id, device_id, command, executor, status, created_at)
                VALUES (?, ?, ?, ?, ?, NOW())
            `,
            [actionHistoryId, id, command, 'user', 'waiting']
        );
        
        await query(
            `
                UPDATE devices
                SET status = ?
                WHERE id = ?
            `,
            ['waiting', id]
        );


        if (!mqttService) {
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
                    command
                },
                message: 'Khong the dieu khien thiet bi vi dich vu MQTT chua san sang'
            });
        }

        // Send command and wait for hardware confirmation.
        // If MQTT drops during waiting, retry reconnect up to 10s then retry command once.
        try {
            await mqttService.sendCommandAndWaitWithReconnect(device.name, command, nextValue, {
                confirmationTimeoutMs: 6000,
                reconnectTimeoutMs: 10000
            });

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
                    command
                },
                message: error.code === 'MQTT_RECONNECT_TIMEOUT'
                    ? 'Mat ket noi toi thiet bi. Da thu ket noi lai MQTT trong 10 giay nhung khong thanh cong.'
                    : (error.message || 'Khong the xac nhan trang thai tu hardware')
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

module.exports = {
    toggleDevice
};
