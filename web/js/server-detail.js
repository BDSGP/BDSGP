// =============================================================================
// 服务器详情页功能
// =============================================================================

import { log } from './utils.js';
import { fetchServerInfo, fetchMOTDInfo } from './api.js';
import { API_CONFIG } from './config.js';

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

// DOM元素
const DOM_ELEMENTS = {
    loadingState: document.getElementById('loadingState'),
    errorState: document.getElementById('errorState'),
    serverDetailContent: document.getElementById('serverDetailContent'),
    serverImage: document.getElementById('serverImage'),
    serverName: document.getElementById('serverName'),
    serverIp: document.getElementById('serverIp'),
    statusDot: document.getElementById('statusDot'),
    serverStatus: document.getElementById('serverStatus'),
    serverDescription: document.getElementById('serverDescription'),
    connectButton: document.getElementById('connectButton'),
    refreshButton: document.getElementById('refreshButton'),
    retryButton: document.getElementById('retryButton'),
    playerCount: document.getElementById('playerCount'),
    serverVersion: document.getElementById('serverVersion'),
    serverPing: document.getElementById('serverPing'),
    serverGamemode: document.getElementById('serverGamemode'),
    serverId: document.getElementById('serverId'),
    lastUpdateTime: document.getElementById('lastUpdateTime'),
    serverMotd: document.getElementById('serverMotd'),
    playerHistoryChart: document.getElementById('playerHistoryChart'),
    tabButtons: document.querySelectorAll('.tab-button'),
    tabContents: document.querySelectorAll('.tab-content')
};

/**
 * 显示加载状态
 */
function showLoading() {
    if (DOM_ELEMENTS.loadingState) DOM_ELEMENTS.loadingState.style.display = 'flex';
    if (DOM_ELEMENTS.errorState) DOM_ELEMENTS.errorState.style.display = 'none';
    if (DOM_ELEMENTS.serverDetailContent) DOM_ELEMENTS.serverDetailContent.style.display = 'none';
}

/**
 * 显示错误状态
 * @param {string} message - 错误消息
 */
function showError(message) {
    if (DOM_ELEMENTS.loadingState) DOM_ELEMENTS.loadingState.style.display = 'none';
    if (DOM_ELEMENTS.errorState) {
        DOM_ELEMENTS.errorState.style.display = 'block';
        const errorMessage = DOM_ELEMENTS.errorState.querySelector('p');
        if (errorMessage) errorMessage.textContent = message;
    }
    if (DOM_ELEMENTS.serverDetailContent) DOM_ELEMENTS.serverDetailContent.style.display = 'none';
}

/**
 * 显示服务器详情内容
 */
function showContent() {
    if (DOM_ELEMENTS.loadingState) DOM_ELEMENTS.loadingState.style.display = 'none';
    if (DOM_ELEMENTS.errorState) DOM_ELEMENTS.errorState.style.display = 'none';
    if (DOM_ELEMENTS.serverDetailContent) DOM_ELEMENTS.serverDetailContent.style.display = 'block';
}

// 服务器UUID
let serverUuid = null;

/**
 * 初始化服务器详情页
 */
async function initializeServerDetail() {
    log('服务器详情页', '初始化服务器详情页', '初始化');

    // 从URL参数中获取服务器UUID
    const urlParams = new URLSearchParams(window.location.search);
    serverUuid = urlParams.get('uuid');

    if (!serverUuid) {
        log('服务器详情页', '未找到服务器UUID参数', '错误');

        // 显示自定义错误信息，并提供返回首页的选项
        if (DOM_ELEMENTS.errorState) {
            DOM_ELEMENTS.errorState.style.display = 'block';
            DOM_ELEMENTS.errorState.innerHTML = `
                <i class="fas fa-exclamation-triangle" style="font-size: 48px; margin-bottom: 1rem;"></i>
                <h3>未指定服务器</h3>
                <p>请从服务器列表中选择一个服务器查看详情</p>
                <a href="/" class="btn btn-primary">
                    <i class="fas fa-home"></i> 返回首页
                </a>
            `;
        }

        if (DOM_ELEMENTS.loadingState) DOM_ELEMENTS.loadingState.style.display = 'none';
        if (DOM_ELEMENTS.serverDetailContent) DOM_ELEMENTS.serverDetailContent.style.display = 'none';
        return;
    }

    log('服务器详情页', `服务器UUID: ${serverUuid}`, '初始化');

    // 绑定事件监听器
    bindEventListeners();

    // 加载服务器详情
    await loadServerDetail();
}

/**
 * 绑定事件监听器
 */
function bindEventListeners() {
    log('服务器详情页', '绑定事件监听器', '初始化');

    // 重试按钮
    if (DOM_ELEMENTS.retryButton) {
        DOM_ELEMENTS.retryButton.addEventListener('click', async () => {
            log('服务器详情页', '用户点击了重试按钮', '交互');
            await loadServerDetail();
        });
    }

    // 刷新按钮
    if (DOM_ELEMENTS.refreshButton) {
        DOM_ELEMENTS.refreshButton.addEventListener('click', async () => {
            log('服务器详情页', '用户点击了刷新按钮', '交互');
            await loadServerDetail();
        });
    }

    // 连接按钮
    if (DOM_ELEMENTS.connectButton) {
        DOM_ELEMENTS.connectButton.addEventListener('click', () => {
            log('服务器详情页', '用户点击了连接按钮', '交互');

            // 获取服务器名称和地址
            const serverName = DOM_ELEMENTS.serverName ? DOM_ELEMENTS.serverName.textContent : '服务器';
            const serverIp = DOM_ELEMENTS.serverIp ? DOM_ELEMENTS.serverIp.textContent : '';

            if (serverIp) {
                // 构建Minecraft添加服务器链接
                const minecraftLink = `minecraft:?addExternalServer=${encodeURIComponent(serverName)}|${serverIp}`;

                // 跳转到链接
                window.location.href = minecraftLink;

                log('服务器详情页', `跳转到Minecraft链接: ${minecraftLink}`, '交互');
            } else {
                log('服务器详情页', '无法获取服务器地址', '错误处理');
                console.error('[服务器详情页] 无法获取服务器地址');

                // 如果无法获取服务器地址，显示错误提示
                if (typeof showNotification === 'function') {
                    showNotification('无法获取服务器地址，请刷新页面重试', 'error');
                } else {
                    alert('无法获取服务器地址，请刷新页面重试');
                }
            }
        });
    }

    // 选项卡按钮
    DOM_ELEMENTS.tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            switchTab(tabId);
        });
    });

    // 主题切换
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            const isDarkMode = document.body.classList.contains('dark-mode');
            const icon = themeToggle.querySelector('i');

            if (icon) {
                if (isDarkMode) {
                    icon.classList.remove('fa-moon');
                    icon.classList.add('fa-sun');
                } else {
                    icon.classList.remove('fa-sun');
                    icon.classList.add('fa-moon');
                }
            }

            // 保存主题偏好
            localStorage.setItem('preferredTheme', isDarkMode ? 'dark' : 'light');
        });
    }

    // 手机端菜单按钮
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');

    if (mobileMenuBtn && navLinks) {
        mobileMenuBtn.addEventListener('click', () => {
            const isCurrentlyActive = navLinks.classList.contains('active');

            // 重置状态
            navLinks.classList.remove('active');
            mobileMenuBtn.classList.remove('active');
            document.body.style.overflow = '';

            // 如果之前是关闭状态，则打开菜单
            if (!isCurrentlyActive) {
                navLinks.classList.add('active');
                mobileMenuBtn.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        });

        // 点击导航链接后关闭菜单
        const navLinksItems = navLinks.querySelectorAll('a');
        navLinksItems.forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                mobileMenuBtn.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
    }
}

/**
 * 切换选项卡
 * @param {string} tabId - 选项卡ID
 */
function switchTab(tabId) {
    log('服务器详情页', `切换到选项卡: ${tabId}`, '交互');

    // 更新选项卡按钮状态
    DOM_ELEMENTS.tabButtons.forEach(button => {
        if (button.getAttribute('data-tab') === tabId) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });

    // 更新选项卡内容显示
    DOM_ELEMENTS.tabContents.forEach(content => {
        if (content.id === `${tabId}-tab`) {
            content.classList.add('active');

            // 根据不同的选项卡加载相应的数据
            if (tabId === 'history') {
                loadPlayerHistory();
            } else if (tabId === 'stats') {
                loadServerIntroduction();
            }
        } else {
            content.classList.remove('active');
        }
    });
}

/**
 * 加载服务器详情
 */
async function loadServerDetail() {
    log('服务器详情页', '开始加载服务器详情', '数据加载');

    // 显示加载状态
    showLoading();

    try {
        // 获取服务器信息
        const serverInfo = await fetchServerInfo(serverUuid);

        if (!serverInfo || serverInfo.error) {
            log('服务器详情页', '获取服务器信息失败', '错误');
            showError('无法获取服务器信息');
            return;
        }

        console.warn('[服务器详情页] 服务器信息:', serverInfo);
        console.warn(serverInfo.players.online);
        console.warn(serverInfo.players.max);

        // 更新服务器详情
        updateServerDetail(serverInfo);

        // 显示服务器详情内容
        showContent();

        log('服务器详情页', '服务器详情加载完成', '数据加载');
    } catch (error) {
        log('服务器详情页', `加载服务器详情时出错: ${error.message}`, '错误处理');
        console.error('[服务器详情页] 加载服务器详情时出错:', error);
        showError('加载服务器详情时出错');
    }
}

/**
 * 更新服务器详情
 * @param {Object} serverInfo - 服务器信息
 */
function updateServerDetail(serverInfo) {
    log('服务器详情页', '更新服务器详情', '数据更新');

    // 更新服务器图片
    if (DOM_ELEMENTS.serverImage && serverInfo.icon) {
        DOM_ELEMENTS.serverImage.src = serverInfo.icon;
    } else if (DOM_ELEMENTS.serverImage) {
        DOM_ELEMENTS.serverImage.src = '/images/屏幕截图 2025-08-16 220301.png';
    }

    // 更新服务器名称
    if (DOM_ELEMENTS.serverName && serverInfo.name) {
        DOM_ELEMENTS.serverName.textContent = serverInfo.name;
    }

    // 更新服务器IP
    if (DOM_ELEMENTS.serverIp && serverInfo.host && serverInfo.port) {
        DOM_ELEMENTS.serverIp.textContent = `${serverInfo.host}:${serverInfo.port}`;
    }

    // 更新服务器状态
    if (DOM_ELEMENTS.serverStatus && DOM_ELEMENTS.statusDot) {
        if (serverInfo.online) {
            DOM_ELEMENTS.serverStatus.textContent = '在线';
            DOM_ELEMENTS.statusDot.className = 'status-dot online-dot';
        } else {
            DOM_ELEMENTS.serverStatus.textContent = '离线';
            DOM_ELEMENTS.statusDot.className = 'status-dot offline-dot';
        }
    }

    // 更新服务器描述
    if (DOM_ELEMENTS.serverDescription && serverInfo.introduce) {
        DOM_ELEMENTS.serverDescription.textContent = serverInfo.introduce;
    }

    // 更新玩家数量
    if (DOM_ELEMENTS.playerCount && serverInfo.players) {
        DOM_ELEMENTS.playerCount.textContent = `${serverInfo.players.online}/${serverInfo.players.max}`;
    }

    // 更新服务器版本
    if (DOM_ELEMENTS.serverVersion && serverInfo.version) {
        DOM_ELEMENTS.serverVersion.textContent = serverInfo.version;
    }

    // 更新服务器延迟
    if (DOM_ELEMENTS.serverPing && serverInfo.delay) {
        DOM_ELEMENTS.serverPing.textContent = serverInfo.delay;
    }

    // 更新游戏模式
    if (DOM_ELEMENTS.serverGamemode && serverInfo.gamemode) {
        DOM_ELEMENTS.serverGamemode.textContent = serverInfo.gamemode;
    }

    // 更新服务器ID
    if (DOM_ELEMENTS.serverId && serverInfo.serverId) {
        DOM_ELEMENTS.serverId.textContent = serverInfo.serverId;
    }

    // 更新最后更新时间
    if (DOM_ELEMENTS.lastUpdateTime && serverInfo.lastQueryTime) {
        const date = new Date(serverInfo.lastQueryTime);
        DOM_ELEMENTS.lastUpdateTime.textContent = date.toLocaleString();
    }

    // 更新服务器MOTD
    if (DOM_ELEMENTS.serverMotd && serverInfo.motd) {
        DOM_ELEMENTS.serverMotd.innerHTML = processMinecraftColorCodes(serverInfo.motd) || '暂无MOTD';
    }
}

/**
 * 加载服务器介绍
 */
async function loadServerIntroduction() {
    log('服务器详情页', '加载服务器介绍', '数据加载');

    const introContainer = document.getElementById('server-intro-container');
    if (!introContainer) return;

    // 显示加载中
    introContainer.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';

    try {
        // 从API获取服务器信息
        const response = await fetch(`${API_CONFIG.baseUrl}?uuid=${serverUuid}`);
        const data = await response.json();

        if (data.status === 'success' && data.data) {
            // 获取服务器介绍
            const introduceText = data.data.introduce || '暂无介绍';

            // 简单的markdown解析（这里使用简单的正则表达式替换，实际项目中可以使用更完整的markdown解析库）
            let htmlContent = introduceText
                // 标题
                .replace(/^### (.*$)/gim, '<h3>$1</h3>')
                .replace(/^## (.*$)/gim, '<h2>$1</h2>')
                .replace(/^# (.*$)/gim, '<h1>$1</h1>')
                // 粗体和斜体
                .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
                .replace(/\*(.*)\*/gim, '<em>$1</em>')
                // 链接
                .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" target="_blank">$1</a>')
                // 代码
                .replace(/`([^`]+)`/gim, '<code>$1</code>')
            // // 换行
            // .replace(// gim, '<br>');

            // 显示服务器介绍
            introContainer.innerHTML = htmlContent;

            log('服务器详情页', '服务器介绍加载完成', '数据加载');
        } else {
            throw new Error('无法获取服务器信息');
        }
    } catch (error) {
        log('服务器详情页', `加载服务器介绍时出错: ${error.message}`, '错误处理');
        console.error('[服务器详情页] 加载服务器介绍时出错:', error);

        // 显示错误信息
        introContainer.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>无法加载服务器介绍</p>
            </div>
        `;
    }
}

/**
 * 加载玩家历史数据
 */
async function loadPlayerHistory() {
    log('服务器详情页', '加载玩家历史数据', '数据加载');

    // 显示加载中
    const historyTab = document.getElementById('history-tab');
    if (historyTab) {
        const loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'loading-spinner';
        loadingIndicator.innerHTML = '<div class="spinner"></div>';

        // 清空历史选项卡内容
        const existingContent = historyTab.querySelector('.player-history-chart-container');
        if (existingContent) {
            existingContent.innerHTML = '';
            existingContent.appendChild(loadingIndicator);
        }
    }

    try {
        // 从API获取历史数据
        try {
            // 直接从API获取服务器历史数据
            const apiUrl = `${API_CONFIG.baseUrl}?uuid=${serverUuid}`;
            console.log('[服务器详情页] 请求历史数据URL:', apiUrl);

            const response = await fetch(apiUrl);
            const data = await response.json();

            console.log('[服务器详情页] API响应数据:', data);

            if (data.status === 'success') {
                console.log('[服务器详情页] API响应状态为success');

                // 检查是否有status_history字段
                if (data.status_history && Array.isArray(data.status_history)) {
                    console.log('[服务器详情页] 找到status_history数组，长度:', data.status_history.length);

                    // 处理历史数据
                    const historyData = {
                        labels: [],
                        data: []
                    };

                    // 限制显示最近20条记录，避免图表过于拥挤
                    const statusHistory = data.status_history.slice(-20).reverse();

                    // 提取时间和玩家数量
                    statusHistory.forEach(record => {
                        // 格式化时间
                        const date = new Date(record.query_time);
                        const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
                        historyData.labels.push(timeStr);
                        historyData.data.push(record.player_count);
                    });

                    console.log('[服务器详情页] 处理后的历史数据:', historyData);

                    // 创建图表
                    createPlayerHistoryChart(historyData);

                    log('服务器详情页', '玩家历史数据加载完成', '数据加载');
                } else {
                    console.error('[服务器详情页] API响应中不包含status_history数组');
                    console.log('[服务器详情页] API响应的键:', Object.keys(data));
                    throw new Error('API响应中不包含status_history数组');
                }
            } else {
                console.error('[服务器详情页] API响应状态不是success');
                throw new Error(`API响应状态: ${data.status}`);
            }
        } catch (apiError) {
            console.error('[服务器详情页] API请求错误:', apiError);
            throw new Error(`无法获取历史数据: ${apiError.message}`);
        }
    } catch (error) {
        log('服务器详情页', `加载玩家历史数据时出错: ${error.message}`, '错误处理');
        console.error('[服务器详情页] 加载玩家历史数据时出错:', error);

        // 显示错误信息
        const historyTab = document.getElementById('history-tab');
        if (historyTab) {
            const chartContainer = historyTab.querySelector('.player-history-chart-container');
            if (chartContainer) {
                chartContainer.innerHTML = `
                    <div class="error-message">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>无法加载历史数据</p>
                    </div>
                `;
            }
        }
    }
}

/**
 * 创建玩家历史图表
 * @param {Array} historyData - 历史数据
 */
function createPlayerHistoryChart(historyData) {
    log('服务器详情页', '创建玩家历史图表', '图表渲染');

    const historyTab = document.getElementById('history-tab');
    if (!historyTab) return;

    const chartContainer = historyTab.querySelector('.player-history-chart-container');
    if (!chartContainer) return;

    // 清空容器
    chartContainer.innerHTML = '';

    // 创建canvas元素
    const canvas = document.createElement('canvas');
    canvas.id = 'playerHistoryChart';
    chartContainer.appendChild(canvas);

    // 获取canvas上下文
    const ctx = canvas.getContext('2d');

    // 如果没有提供历史数据，使用模拟数据
    if (!historyData) {
        // 生成模拟数据
        const labels = [];
        const data = [];
        const now = new Date();

        // 生成过去7天的数据
        for (let i = 6; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);

            // 格式化日期为 MM/DD
            const formattedDate = `${date.getMonth() + 1}/${date.getDate()}`;
            labels.push(formattedDate);

            // 生成随机玩家数量 (0-100)
            const playerCount = Math.floor(Math.random() * 100);
            data.push(playerCount);
        }

        // 创建图表
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: '在线玩家数量',
                    data: data,
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: '过去7天在线玩家数量',
                        font: {
                            size: 16
                        }
                    },
                    legend: {
                        display: false
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: '玩家数量'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: '日期'
                        }
                    }
                }
            }
        });

        log('服务器详情页', '使用模拟数据创建图表', '图表渲染');
    } else {
        // 使用真实数据创建图表
        // 这里可以根据实际API返回的数据结构进行调整

        // 创建图表
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: historyData.labels,
                datasets: [{
                    label: '在线玩家数量',
                    data: historyData.data,
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: '历史在线玩家数量',
                        font: {
                            size: 16
                        }
                    },
                    legend: {
                        display: false
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: '玩家数量'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: '时间'
                        }
                    }
                }
            }
        });

        log('服务器详情页', '使用真实数据创建图表', '图表渲染');
    }
}

// 初始化服务器详情页
document.addEventListener('DOMContentLoaded', initializeServerDetail);
