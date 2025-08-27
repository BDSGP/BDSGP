
// =============================================================================
// 服务器卡片相关功能
// =============================================================================

import { log } from './utils.js';
import { SERVER_CONFIG } from './config.js';

/**
 * 处理Minecraft颜色代码，将其转换为HTML
 * @param {string} text - 包含Minecraft颜色代码的文本
 * @returns {string} - 转换后的HTML
 */
function processMinecraftColorCodes(text) {
    if (!text) return '';

    // Minecraft颜色代码映射
    const colorMap = {
        '§0': '#000000', // 黑色
        '§1': '#0000AA', // 深蓝色
        '§2': '#00AA00', // 深绿色
        '§3': '#00AAAA', // 青色
        '§4': '#AA0000', // 深红色
        '§5': '#AA00AA', // 紫色
        '§6': '#FFAA00', // 金色
        '§7': '#AAAAAA', // 灰色
        '§8': '#555555', // 深灰色
        '§9': '#5555FF', // 蓝色
        '§a': '#55FF55', // 绿色
        '§b': '#55FFFF', // 浅蓝色
        '§c': '#FF5555', // 红色
        '§d': '#FF55FF', // 粉色
        '§e': '#FFFF55', // 黄色
        '§f': '#FFFFFF'  // 白色
    };

    // Minecraft格式代码
    const formatMap = {
        '§l': 'font-weight: bold', // 粗体
        '§o': 'font-style: italic', // 斜体
        '§n': 'text-decoration: underline', // 下划线
        '§m': 'text-decoration: line-through', // 删除线
        '§k': 'animation: magic 1s infinite; display: inline-block' // 乱码效果
    };

    // 重置代码
    const resetCode = '§r';

    let result = '';
    let currentStyle = '';
    let remainingText = text;

    while (remainingText.length > 0) {
        // 查找下一个颜色代码或格式代码
        const colorCodeMatch = remainingText.match(/§[0-9a-fk-or]/i);

        if (colorCodeMatch) {
            const code = colorCodeMatch[0];
            const codeIndex = colorCodeMatch.index;

            // 添加颜色代码之前的文本
            if (codeIndex > 0) {
                const textBeforeCode = remainingText.substring(0, codeIndex);
                if (currentStyle) {
                    result += `<span style="${currentStyle}">${textBeforeCode}</span>`;
                } else {
                    result += textBeforeCode;
                }
            }

            // 处理颜色代码或格式代码
            if (code === resetCode) {
                // 重置所有格式
                currentStyle = '';
            } else if (colorMap[code]) {
                // 颜色代码
                currentStyle = `color: ${colorMap[code]}`;
            } else if (formatMap[code]) {
                // 格式代码
                if (currentStyle) {
                    currentStyle += '; ' + formatMap[code];
                } else {
                    currentStyle = formatMap[code];
                }
            }

            // 移除已处理的部分
            remainingText = remainingText.substring(codeIndex + 2);
        } else {
            // 没有更多颜色代码，添加剩余文本
            if (currentStyle) {
                result += `<span style="${currentStyle}">${remainingText}</span>`;
            } else {
                result += remainingText;
            }
            remainingText = '';
        }
    }

    return result;
}
import { fetchServerInfo, fetchMOTDInfo } from './api.js';

/**
 * 创建服务器卡片HTML
 * @param {Object} server - 服务器信息对象
 * @returns {string} - 服务器卡片的HTML字符串
 */
export function createServerCard(server) {
    // 验证输入参数
    if (!server || typeof server !== 'object') {
        log('服务器卡片', '无效的服务器对象', '卡片生成-错误');
        console.error('[服务器卡片] 无效的服务器对象:', server);
        return '';
    }

    // 确保必要的属性存在
    const serverName = server.name || '未知服务器';
    const serverHost = server.host || '未知';
    const serverPort = server.port || '未知';
    const serverUuid = server.uuid || '未知';
    const serverIntroduce = server.introduce || '暂无介绍';
    const serverMotd = server.motd || '';
    const serverImage = server.image || './images/loading.gif'; // 默认加载图片

    log('服务器卡片', `创建服务器卡片: ${serverName}`, '卡片生成');

    return `
        <div class="server-card" data-uuid="${serverUuid}">
            <div class="server-image-container">
                <img class="server-image" src="${serverImage}" alt="${serverName}服务器介绍">
            </div>
            <div class="server-content">
                <h3>
                    <span class="server-name">${serverName}</span>
                    <span class="server-ip">${serverHost}:${serverPort}</span>
                </h3>
                <div class="server-status">
                    <span class="status-dot"></span>
                    <span class="online-text">加载中...</span>
                </div>
                <div class="server-info">
                    <div class="info-item" title="在线人数">
                        <i class="fas fa-users"></i>
                        <span class="online-count">加载中...</span>
                    </div>
                    <div class="info-item" title="服务器版本">
                        <i class="fas fa-plug"></i>
                        <span class="server-version">加载中...</span>
                    </div>
                    <div class="info-item" title="延迟">
                        <i class="fas fa-signal"></i>
                        <span class="server-ping">--</span>ms
                    </div>
                    <div class="info-item" title="游戏模式">
                        <i class="fas fa-gamepad"></i>
                        <span class="server-gamemode">加载中...</span>
                    </div>
                    <div class="info-item" title="服务器ID" style="display: none;">
                        <i class="fas fa-fingerprint"></i>
                        <span class="server-id">加载中...</span>
                    </div>
                    <div class="info-item" title="最后更新时间">
                        <i class="fas fa-clock"></i>
                        <span class="last-query-time">加载中...</span>
                    </div>
                    <div class="info-item" title="创建时间">
                        <i class="fas fa-calendar-plus"></i>
                        <span class="created-time">加载中...</span>
                    </div>
                </div>
                <div class="server-description">
                    <p class="motd-text">${serverIntroduce}</p>
                </div>
                <div class="server-motd-container">
                    <div class="motd-header">
                        <i class="fas fa-comment-alt"></i>
                        <span>服务器MOTD</span>
                    </div>
                    <div class="motd-content-box">
                        <div class="motd-content">${processMinecraftColorCodes(serverMotd) || '暂无MOTD'}</div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * 更新单个服务器卡片信息
 * @param {HTMLElement} card - 服务器卡片DOM元素
 */
export async function updateServerCard(card) {
    log('服务器信息', '开始更新服务器卡片信息', '卡片更新');
    const uuid = card.getAttribute('data-uuid');
    log('服务器信息', `卡片UUID：${uuid}`, '卡片更新');

    // 检查UUID是否存在
    if (!uuid) {
        log('服务器信息', '卡片缺少data-uuid属性', '卡片更新-错误');
        console.warn('[服务器信息] 卡片缺少data-uuid属性');
        return;
    }

    // 获取卡片中的DOM元素
    const statusElem = card.querySelector('.online-text');
    const statusDot = card.querySelector('.status-dot');
    const countElem = card.querySelector('.online-count');
    const versionElem = card.querySelector('.server-version');
    const pingElem = card.querySelector('.server-ping');
    const gamemodeElem = card.querySelector('.server-gamemode');
    const motdElem = card.querySelector('.motd-text');
    const serverImageElem = card.querySelector('.server-image');

    // 检查所有必要的元素是否存在
    if (!statusElem || !countElem || !versionElem || !pingElem || !gamemodeElem) {
        log('服务器信息', '服务器卡片中缺少必要的元素', '卡片更新-错误');
        console.error('[服务器信息] 服务器卡片中缺少必要的元素：', {
            statusElem: !!statusElem,
            countElem: !!countElem,
            versionElem: !!versionElem,
            pingElem: !!pingElem,
            gamemodeElem: !!gamemodeElem,
            motdElem: !!motdElem
        });
        return;
    }

    // 显示加载状态
    log('服务器信息', '设置加载状态', '卡片更新');
    statusElem.textContent = '查询中...';

    // 同时设置MOTD为加载状态
    if (motdElem) {
        motdElem.textContent = '加载服务器信息...';
    }

    const motdContentElem = card.querySelector('.motd-content');
    if (motdContentElem) {
        motdContentElem.textContent = '加载中...';
    }

    try {
        // 获取服务器信息
        log('服务器信息', '开始获取服务器信息', 'API请求');
        const data = await fetchServerInfo(uuid);

        // 获取MOTD信息，用于获取服务器人数、版本、延迟和游戏模式
        let motdInfo = null;
        if (data.host && data.port) {
            log('服务器信息', `开始获取MOTD信息，主机：${data.host}:${data.port}`, 'API请求');
            motdInfo = await fetchMOTDInfo(data.host, data.port);
            log('服务器信息', `MOTD信息获取结果：${motdInfo ? '成功' : '失败'}`, 'API响应');
            console.log('[服务器信息] MOTD信息：', motdInfo);
        }

        // 替换服务器图标（无论服务器是否在线都执行）
        if (serverImageElem) {
            console.warn(data);
            console.log('[服务器信息] 服务器图标URL：', data.icon);
            serverImageElem.src = data.icon;
            // 添加错误处理，如果图片加载失败则使用默认图标
            serverImageElem.onerror = function () {
                this.src = './images/屏幕截图 2025-08-16 220301.png';
            };
        }

        // 如果服务器在线，更新服务器信息
        if (motdInfo && data && ((motdInfo.status && motdInfo.status === 'online') || motdInfo.online)) {
            log('服务器信息', '服务器在线，更新卡片信息', '卡片更新');
            console.log('[服务器信息] 开始更新服务器信息：', motdInfo);
            statusElem.textContent = '在线';

            // 设置在线状态图标
            if (statusDot) {
                console.error('在线！！！！！！！！！！！！！！！')
                statusDot.className = 'status-dot online-dot';
            }

            // 使用MOTD API的数据
            const onlinePlayers = motdInfo?.online || 0;
            const maxPlayers = motdInfo?.max || 0;
            countElem.textContent = `${onlinePlayers}/${maxPlayers}`;
            log('服务器信息', `在线人数：${onlinePlayers}/${maxPlayers}`, '卡片更新');
            // 版本信息：使用MOTD API的version
            versionElem.textContent = motdInfo?.version || motdInfo?.protocol || '未知';
            log('服务器信息', `版本：${motdInfo?.version || motdInfo?.protocol || '未知'}`, '卡片更新');
            // 延迟信息：使用MOTD API的delay
            pingElem.textContent = motdInfo?.delay || '-';
            log('服务器信息', `延迟：${motdInfo?.delay || '--'}ms`, '卡片更新');
            // 游戏模式信息：使用MOTD API的gamemode
            gamemodeElem.textContent = motdInfo?.gamemode || '未知';
            log('服务器信息', `游戏模式：${motdInfo?.gamemode || '未知'}`, '卡片更新');

            // 更新MOTD信息
            if (motdContentElem) {
                motdContentElem.innerHTML = processMinecraftColorCodes(motdInfo.motd) || '暂无MOTD';
                log('服务器信息', `MOTD：${motdInfo.motd || '暂无MOTD'}`, '卡片更新');
            }

            // 显示服务器唯一ID
            const serverIdElem = card.querySelector('.server-id');
            if (serverIdElem) {
                serverIdElem.textContent = data.serverId || '未知';
                log('服务器信息', `服务器唯一ID：${data.serverId || '未知'}`, '卡片更新');
            }

            // 显示最后查询时间
            const lastQueryTimeElem = card.querySelector('.last-query-time');
            if (lastQueryTimeElem) {
                if (data.lastQueryTime) {
                    const date = new Date(data.lastQueryTime);
                    lastQueryTimeElem.textContent = date.toLocaleString();
                    log('服务器信息', `最后查询时间：${date.toLocaleString()}`, '卡片更新');
                } else {
                    lastQueryTimeElem.textContent = '未知';
                    log('服务器信息', '最后查询时间：未知', '卡片更新');
                }
            }

            // 显示服务器创建时间
            const createdTimeElem = card.querySelector('.created-time');
            if (createdTimeElem) {
                if (data.created_at) {
                    const date = new Date(data.created_at);
                    createdTimeElem.textContent = date.toLocaleString();
                    log('服务器信息', `服务器创建时间：${date.toLocaleString()}`, '卡片更新');
                } else {
                    createdTimeElem.textContent = '未知';
                    log('服务器信息', '服务器创建时间：未知', '卡片更新');
                }
            }

            // 更新服务器介绍
            if (motdElem) {
                const introduceText = data.name ? `${data.introduce || '暂无介绍'}` : data.introduce || '暂无介绍';
                motdElem.textContent = introduceText;
                log('服务器信息', `服务器介绍：${introduceText}`, '卡片更新');
            }
        } else {
            // 服务器离线或错误状态
            const serverStatus = (motdInfo && motdInfo.status) ? motdInfo.status : 'unknown';
            log('服务器信息', `服务器离线或错误，状态：${serverStatus}`, '卡片更新');
            statusElem.textContent = serverStatus === 'offline' ? '离线' : '查询失败';

            // 设置离线状态图标
            if (statusDot) {
                console.error('离线！！！！！！！！！！！！！！！')
                statusDot.className = 'status-dot offline-dot';
            }

            // 尝试从服务器卡片中获取保存的最大人数信息
            const serverIdElem = card.querySelector('.server-id');
            const createdTimeElem = card.querySelector('.created-time');
            let savedMaxPlayers = SERVER_CONFIG.defaultMaxPlayers; // 使用配置中的默认值

            // 如果有其他地方存储了最大人数信息，可以在这里获取
            countElem.textContent = `0/${savedMaxPlayers}`;
            versionElem.textContent = '未知';
            pingElem.textContent = '--';
            gamemodeElem.textContent = '未知';

            // 更新服务器介绍为离线状态
            if (motdElem) {
                motdElem.textContent = '服务器当前离线';
            }
        }
    } catch (error) {
        log('服务器信息', `更新服务器卡片信息时出错: ${error.message}`, '错误处理');
        console.error('[服务器信息] 更新服务器卡片信息时出错:', error);
        statusElem.textContent = '查询失败';

        // 设置错误状态
        if (motdElem) {
            motdElem.textContent = '无法获取服务器信息';
        }
    }
}

/**
 * 更新所有服务器卡片信息
 * 遍历所有服务器卡片并更新它们的信息
 */
export function updateAllServers() {
    log('服务器信息', '开始更新所有服务器卡片信息', '批量更新');
    const cards = document.querySelectorAll('.server-card');
    log('服务器信息', `找到服务器卡片数量：${cards.length}`, '批量更新');

    // 如果没有找到任何服务器卡片，输出警告并返回
    if (cards.length === 0) {
        log('服务器信息', '未找到任何服务器卡片，请检查DOM是否已加载', '批量更新-错误');
        console.warn('[服务器信息] 未找到任何服务器卡片，请检查DOM是否已加载');
        return;
    }

    // 更新每个服务器卡片
    cards.forEach((card, index) => {
        log('服务器信息', `开始更新第${index + 1}个服务器卡片`, '批量更新');
        const uuid = card.getAttribute('data-uuid');
        log('服务器信息', `卡片UUID：${uuid}`, '批量更新');
        updateServerCard(card);
    });
}

/**
 * 更新服务器列表布局
 * @param {number} columns - 每行显示的服务器数量
 */
export function updateServerLayout(columns) {
    // 验证输入参数
    if (typeof columns !== 'number' || columns < 1 || columns > 6) {
        log('服务器列表', `无效的列数: ${columns}，使用默认值`, '布局-错误');
        columns = 2; // 使用默认值
    }

    log('服务器列表', `更新布局为每行显示${columns}个服务器`, '布局');

    // 保存用户偏好
    localStorage.setItem('perRow', columns);

    // 更新CSS网格列数
    const serverList = document.getElementById('serverList');
    if (serverList) {
        try {
            serverList.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
            log('服务器列表', `成功更新布局为每行${columns}列`, '布局');
        } catch (error) {
            log('服务器列表', `更新布局时出错: ${error.message}`, '布局-错误');
            console.error('[服务器列表] 更新布局时出错:', error);
        }
    } else {
        log('服务器列表', '未找到服务器列表元素', '布局-错误');
        console.warn('[服务器列表] 未找到服务器列表元素');
    }
}
