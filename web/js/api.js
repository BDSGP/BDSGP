// =============================================================================
// API服务 - 处理所有API请求
// =============================================================================

import { API_CONFIG, MOTD_API_CONFIG } from './config.js';
import { log } from './utils.js';

/**
 * 清理MOTD API返回的数据，去除多余的空字符
 * @param {Object} data - MOTD API返回的原始数据
 * @returns {Object} - 清理后的数据
 */
function cleanMOTDData(data) {
    if (!data) return null;

    // 创建数据的副本
    const cleanedData = { ...data };

    // 清理字符串字段中的空字符
    const stringFields = ['motd', 'gamemode', 'version', 'status'];
    stringFields.forEach(field => {
        if (typeof cleanedData[field] === 'string') {
            // 去除所有空字符（\u0000）
            cleanedData[field] = cleanedData[field].replace(/\u0000/g, '').trim();
        }
    });

    return cleanedData;
}

/**
 * 从MOTD API获取服务器信息
 * @param {string} host - 服务器主机地址和端口
 * @returns {Promise<Object>} - 包含服务器MOTD信息的Promise对象
 */
export async function fetchMOTDInfo(host) {
    try {
        log('MOTD信息', `正在请求MOTD信息，主机：${host}`, 'API请求');

        // 添加超时处理机制
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), MOTD_API_CONFIG.timeout);

        const response = await fetch(`${MOTD_API_CONFIG.baseUrl}?host=${host}`, {
            signal: controller.signal
        });

        // 清除超时计时器
        clearTimeout(timeoutId);

        // 检查HTTP响应状态
        if (!response.ok) {
            throw new Error(`HTTP错误! 状态: ${response.status}`);
        }

        const data = await response.json();

        // 添加API响应的调试信息
        log('MOTD信息', 'API响应数据', 'API响应');
        console.log('[MOTD信息] API响应数据：', data);

        // 处理API响应
        if (data && data.status) {
            // 清理数据中的空字符
            const cleanedData = cleanMOTDData(data);

            // 返回处理后的MOTD信息
            return {
                status: cleanedData.status,
                motd: cleanedData.motd || '',
                agreement: cleanedData.agreement || 0,
                version: cleanedData.version || '',
                online: cleanedData.online || 0,
                max: cleanedData.max || 0,
                gamemode: cleanedData.gamemode || '',
                delay: cleanedData.delay || 0
            };
        } else {
            log('MOTD信息', 'API请求失败，无法获取MOTD信息', 'API响应');
            return null;
        }
    } catch (error) {
        log('MOTD信息', `获取MOTD信息时出错: ${error.message}`, '错误处理');
        console.error('[MOTD信息] 获取MOTD信息时出错:', error);
        return null;
    }
}

/**
 * 从API获取服务器列表
 * @returns {Promise<Array>} - 包含所有服务器信息的Promise数组
 */
export async function fetchServersList() {
    try {
        log('服务器列表', '正在请求服务器列表', 'API请求');

        // 添加超时处理机制
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);

        const response = await fetch(API_CONFIG.baseUrl, {
            signal: controller.signal
        });

        // 清除超时计时器
        clearTimeout(timeoutId);

        // 检查HTTP响应状态
        if (!response.ok) {
            throw new Error(`HTTP错误! 状态: ${response.status}`);
        }

        const data = await response.json();

        // 添加API响应的调试信息
        log('服务器列表', 'API响应数据', 'API响应');
        console.log('[服务器列表] API响应数据：', data);

        // 处理API响应
        if (data.status === 'success' && data.data) {
            log('服务器列表', `成功获取到${data.data.length}个服务器信息`, 'API响应');

            // 返回处理后的服务器信息
            return data.data.map(server => ({
                uuid: server.uuid,
                name: server.name,
                introduce: server.introduce,
                host: server.host,
                port: server.port,
                is_online: server.online,
                player_count: server.player_count,
                motd: server.motd,
                last_status_time: server.last_status_time,
                created_at: server.created_at
            }));
        } else {
            log('服务器列表', 'API请求失败，无法获取服务器列表', 'API响应');
            console.log('[服务器列表] API请求失败，无法获取服务器列表');
            return [];
        }
    } catch (error) {
        log('服务器列表', `获取服务器列表时出错: ${error.message}`, '错误处理');
        console.error('[服务器列表] 获取服务器列表时出错:', error);
        return [];
    }
}

/**
 * 从API获取服务器信息
 * @param {string} uuid - 服务器UUID
 * @returns {Promise<Object>} - 包含服务器信息的Promise对象
 */
export async function fetchServerInfo(uuid, retryCount = 0) {
    const maxRetries = 2;

    try {
        log('服务器信息', `正在请求服务器信息，UUID：${uuid} (尝试 ${retryCount + 1}/${maxRetries + 1})`, 'API请求');

        // 使用新的API，通过UUID获取服务器信息
        log('服务器信息', `请求地址：${API_CONFIG.baseUrl}?uuid=${uuid}`, 'API请求');

        // 添加超时处理机制
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);

        const response = await fetch(`${API_CONFIG.baseUrl}?uuid=${uuid}`, {
            signal: controller.signal
        });

        // 清除超时计时器
        clearTimeout(timeoutId);

        // 检查HTTP响应状态
        if (!response.ok) {
            throw new Error(`HTTP错误! 状态: ${response.status}`);
        }

        const data = await response.json();

        // 添加API响应的调试信息
        log('服务器信息', 'API响应数据', 'API响应');
        console.log('[服务器信息] API响应数据：', data);

        // 处理API响应
        if (data.status === 'success' && data.data) {
            // 检查data.data是否为数组且长度大于0
            const hasValidData = Array.isArray(data.data) ? data.data.length > 0 : true;
            if (hasValidData) {
                // 如果data.data是数组，取第一个元素；如果不是数组，直接使用
                const serverData = Array.isArray(data.data) ? data.data[0] : data.data;

                // 添加调试信息
                console.log('[服务器信息] serverData内容:', serverData);
                console.log('[服务器信息] serverData.host存在:', !!serverData.host);
                console.log('[服务器信息] serverData.port存在:', !!serverData.port);

                // 使用服务器介绍
                const introduceText = serverData.introduce || '暂无介绍';

                // 添加服务器信息
                log('服务器信息', `服务器信息 - 主机名: ${serverData.host}, 端口: ${serverData.port}`, 'API响应');

                // 获取MOTD信息
                let motdInfo = null;
                if (serverData.host && serverData.port) {
                    const hostWithPort = `${serverData.host}:${serverData.port}`;
                    motdInfo = await fetchMOTDInfo(hostWithPort);
                    log('服务器信息', `获取到MOTD信息: ${motdInfo ? '成功' : '失败'}`, 'MOTD信息');
                }

                // 返回处理后的服务器信息
                const isOnline = serverData.online;
                // 确保玩家数量是数字而不是布尔值
                const playersOnline = motdInfo && typeof motdInfo.online === 'number' ? motdInfo.online :
                    (serverData && typeof serverData.player_count === 'number' ? serverData.player_count : 0);
                // 获取最大人数，优先使用MOTD信息，其次使用服务器数据，如果都无效则使用默认值
                let playersMax = motdInfo && typeof motdInfo.max === 'number' && motdInfo.max > 0 ? motdInfo.max :
                    (serverData && typeof serverData.max_players === 'number' && serverData.max_players > 0 ? serverData.max_players : 20); // 默认值为20

                return {
                    status: motdInfo ? motdInfo.status : (isOnline ? 'online' : 'offline'),
                    online: motdInfo ? motdInfo.status === 'online' : isOnline,
                    players: {
                        online: playersOnline,
                        max: playersMax
                    },
                    playerCount: playersMax, // 保持兼容性
                    name: serverData.name,
                    host: serverData.host,
                    port: serverData.port,
                    introduce: introduceText,
                    motd: motdInfo ? motdInfo.motd : serverData.motd || '',
                    delay: motdInfo ? motdInfo.delay : null, // 使用MOTD API提供的延迟信息
                    gamemode: motdInfo ? motdInfo.gamemode : '未知',
                    map: '未知',
                    protocol: motdInfo ? motdInfo.version : '未知',
                    agreement: motdInfo ? motdInfo.agreement : 0,
                    serverId: serverData.uuid || '未知',
                    lastQueryTime: serverData.last_status_time || new Date().toISOString(),
                    created_at: serverData.created_at || null
                };
            };
        } else {
            log('服务器信息', 'API请求失败，无法获取服务器信息', 'API响应');
            console.log('[服务器信息] API请求失败，无法获取服务器信息');
            return {
                status: 'offline',
                error: 'API请求失败或服务器不存在',
                uuid: uuid,
                timestamp: new Date().toISOString()
            };
        }
    } catch (error) {
        log('服务器信息', `获取服务器信息时出错: ${error.message}`, '错误处理');
        console.error('[服务器信息] 获取服务器信息时出错:', error);
        console.log('[服务器信息] 请求地址：', `${API_CONFIG.baseUrl}?uuid=${uuid}`);

        // 如果还有重试次数，则进行重试
        if (retryCount < maxRetries) {
            log('服务器信息', `准备进行第 ${retryCount + 2} 次重试`, '重试');
            // 延迟1秒后重试
            await new Promise(resolve => setTimeout(resolve, 1000));
            return fetchServerInfo(uuid, retryCount + 1);
        }

        return {
            status: 'error',
            error: error.message || '未知错误',
            timestamp: new Date().toISOString(),
            uuid: uuid,
            retryAttempts: retryCount + 1
        };
    }
}
