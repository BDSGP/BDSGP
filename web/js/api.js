// =============================================================================
// API服务 - 处理所有API请求
// =============================================================================

import { API_CONFIG, MOTD_API_CONFIG, SERVER_CONFIG } from './config.js';
import { log } from './utils.js';

/**
 * 通用API请求函数
 * @param {string} url - 请求的URL
 * @param {Object} options - 请求选项
 * @param {number} timeout - 超时时间（毫秒）
 * @returns {Promise<Object>} - API响应数据
 */
async function fetchWithTimeout(url, options = {}, timeout = 5000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`HTTP错误! 状态: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
}

/**
 * 带重试机制的API请求函数
 * @param {string} url - 请求的URL
 * @param {Object} options - 请求选项
 * @param {number} maxRetries - 最大重试次数
 * @param {number} retryDelay - 重试间隔时间（毫秒）
 * @param {number} timeout - 超时时间（毫秒）
 * @returns {Promise<Object>} - API响应数据
 */
async function fetchWithRetry(url, options = {}, maxRetries = 2, retryDelay = 1000, timeout = 5000) {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
        try {
            return await fetchWithTimeout(url, options, timeout);
        } catch (error) {
            lastError = error;

            // 如果是最后一次尝试，直接抛出错误
            if (attempt > maxRetries) {
                break;
            }

            // 等待一段时间后重试
            await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
    }

    throw lastError;
}

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
export async function fetchMOTDInfo(ip, port) {
    try {
        log('MOTD信息', `正在请求MOTD信息，主机：${ip}:${port}`, 'API请求');

        // 使用带重试机制的请求函数
        const data = await fetchWithRetry(
            `${MOTD_API_CONFIG.baseUrl}?ip=${ip}&port=${port}`,
            {},
            MOTD_API_CONFIG.retryCount,
            MOTD_API_CONFIG.retryDelay,
            MOTD_API_CONFIG.timeout
        );

        // 添加API响应的调试信息
        log('MOTD信息', 'API响应数据', 'API响应');
        console.log('[MOTD信息] API响应数据：', data);

        // 处理API响应
        if (data && data.status) {
            // 清理数据中的空字符
            const cleanedData = cleanMOTDData(data);

            console.error('[MOTD信息] 清理后的MOTD数据：', cleanedData);

            console.warn('[MOTD信息] cleanedData.players:', cleanedData.players);
            console.warn('[MOTD信息] cleanedData.players.online:', cleanedData.players ? cleanedData.players.online : 'N/A');
            console.warn('[MOTD信息] cleanedData.players.max:', cleanedData.players ? cleanedData.players.max : 'N/A');

            // 返回处理后的MOTD信息
            return {
                status: cleanedData.status,
                motd: cleanedData.motd || '',
                protocol: cleanedData.protocol || 0,
                version: cleanedData.version || '',
                online: cleanedData.players.online || 0,
                max: cleanedData.players.max || 0,
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

        // 使用带重试机制的请求函数
        const data = await fetchWithRetry(
            API_CONFIG.baseUrl,
            {},
            API_CONFIG.retryCount,
            API_CONFIG.retryDelay,
            API_CONFIG.timeout
        );

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
                online: server.online,
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
export async function fetchServerInfo(uuid) {
    try {
        log('服务器信息', `正在请求服务器信息，UUID：${uuid}`, 'API请求');

        // 使用新的API，通过UUID获取服务器信息
        const requestUrl = `${API_CONFIG.baseUrl}?uuid=${uuid}`;
        log('服务器信息', `请求地址：${requestUrl}`, 'API请求');

        // 使用带重试机制的请求函数
        const data = await fetchWithRetry(
            requestUrl,
            {},
            SERVER_CONFIG.maxRetryAttempts,
            API_CONFIG.retryDelay,
            API_CONFIG.timeout
        );

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
                    motdInfo = await fetchMOTDInfo(serverData.host, serverData.port);
                    log('服务器信息', `获取到MOTD信息: ${motdInfo ? '成功' : '失败'}`, 'MOTD信息');
                }

                console.warn('[服务器信息] MOTD信息:', motdInfo);

                // 返回处理后的服务器信息
                const isOnline = motdInfo.status;
                // 确保玩家数量是数字而不是布尔值
                const playersOnline = motdInfo && typeof motdInfo.online === 'number' ? motdInfo.online :
                    (serverData && typeof serverData.player_count === 'number' ? serverData.player_count : 0);
                // 获取最大人数，优先使用MOTD信息，其次使用服务器数据，如果都无效则使用默认值
                let playersMax = motdInfo && typeof motdInfo.max === 'number' && motdInfo.max > 0 ? motdInfo.max :
                    (serverData && typeof serverData.max_players === 'number' && serverData.max_players > 0 ? serverData.max_players : SERVER_CONFIG.defaultMaxPlayers);

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
                    version: motdInfo ? motdInfo.version : '未知',
                    protocol: motdInfo ? motdInfo.protocol : 0,
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

        return {
            status: 'error',
            error: error.message || '未知错误',
            timestamp: new Date().toISOString(),
            uuid: uuid,
            retryAttempts: SERVER_CONFIG.maxRetryAttempts
        };
    }
}
