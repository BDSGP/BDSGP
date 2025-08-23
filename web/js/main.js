// =============================================================================
// BDSGP 服务器列表应用 - 统一管理所有功能
// 优化版本 - 逻辑清晰，代码分类布局
// =============================================================================

// =============================================================================
// 1. 常量配置
// =============================================================================

// 服务器数据配置将从API动态加载

// API配置
const API_CONFIG = {
    baseUrl: "http://160.30.231.88:50389/get",
    timeout: 5000  // 请求超时时间（毫秒）
};

// MOTD API配置
const MOTD_API_CONFIG = {
    baseUrl: "https://api.mcsrvstat.us/bedrock/3",
    timeout: 5000  // 请求超时时间（毫秒）
};

// 日志计数器
let logCounter = 0;

/**
 * 格式化日志输出，添加序号和步骤说明
 * @param {string} category - 日志类别
 * @param {string} message - 日志消息
 * @param {string} step - 步骤说明
 */
function log(category, message, step = '') {
    logCounter++;
    const stepText = step ? `- ${step}` : '';
    console.log(`[${logCounter}] [${category}] ${message} ${stepText}`);
}

// =============================================================================
// 2. 工具函数
// =============================================================================

/**
 * 解析Minecraft颜色代码
 * 将Minecraft中的§颜色代码转换为HTML样式
 * @param {string} text - 包含Minecraft颜色代码的文本
 * @returns {string} - 转换后的HTML文本
 */
function parseMinecraftColors(text) {
    log('工具函数', '开始解析Minecraft颜色代码', '颜色代码解析');
    if (!text) {
        log('工具函数', '输入文本为空，返回空字符串', '颜色代码解析');
        return '';
    }

    // Minecraft颜色代码映射表
    const colorMap = {
        '§0': '<span style="color: #000000">', // 黑色
        '§1': '<span style="color: #0000AA">', // 深蓝色
        '§2': '<span style="color: #00AA00">', // 深绿色
        '§3': '<span style="color: #00AAAA">', // 淡蓝色
        '§4': '<span style="color: #AA0000">', // 深红色
        '§5': '<span style="color: #AA00AA">', // 深紫色
        '§6': '<span style="color: #FFAA00">', // 金色
        '§7': '<span style="color: #AAAAAA">', // 灰色
        '§8': '<span style="color: #555555">', // 深灰色
        '§9': '<span style="color: #5555FF">', // 蓝色
        '§a': '<span style="color: #55FF55">', // 绿色
        '§b': '<span style="color: #55FFFF">', // 淡青色
        '§c': '<span style="color: #FF5555">', // 红色
        '§d': '<span style="color: #FF55FF">', // 紫色
        '§e': '<span style="color: #FFFF55">', // 黄色
        '§f': '<span style="color: #FFFFFF">', // 白色
        '§l': '<span style="font-weight: bold">', // 粗体
        '§m': '<span style="text-decoration: line-through">', // 删除线
        '§n': '<span style="text-decoration: underline">', // 下划线
        '§o': '<span style="font-style: italic">', // 斜体
        '§r': '</span>' // 重置所有格式
    };

    log('工具函数', '开始替换颜色代码', '颜色代码解析');
    let result = text;
    // 替换所有颜色代码
    for (const [code, replacement] of Object.entries(colorMap)) {
        result = result.replace(new RegExp(code, 'g'), replacement);
    }

    log('工具函数', '颜色代码解析完成', '颜色代码解析');
    return result;
}

/**
 * 创建提示信息
 * @param {string} message - 提示信息内容
 * @param {string} type - 提示类型（默认为info）
 * @returns {HTMLElement} - 提示信息元素
 */
function createToast(message, type = 'info') {
    log('提示信息', `创建${type}类型提示: ${message}`, '提示信息创建');

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;

    // 添加到页面
    document.body.appendChild(toast);

    // 显示动画
    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
    }, 10);

    // 自动隐藏
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';

        setTimeout(() => {
            if (document.body.contains(toast)) {
                document.body.removeChild(toast);
            }
        }, 300);
    }, 3000);

    return toast;
}

/**
 * 尝试连接到Minecraft服务器
 * @param {string} host - 服务器主机地址
 */
function connectToServer(host) {
    log('服务器连接', `尝试连接到服务器: ${host}`, '开始连接');

    // 创建跳转链接
    const url = `mcping://${host}`;

    // 创建美化的连接提示
    const toast = createToast(`正在连接到 ${host}...`, 'info');

    // 添加加载动画
    const toastContent = toast.querySelector('.toast-content');
    toastContent.innerHTML = `
        <div class="connecting-indicator">
            <i class="fas fa-spinner fa-spin"></i>
            <span>正在连接到 ${host}...</span>
        </div>
        <div class="connecting-progress">
            <div class="progress-bar"></div>
        </div>
    `;

    // 获取进度条元素
    const progressBar = toast.querySelector('.progress-bar');

    // 开始进度条动画
    let progress = 0;
    const progressInterval = setInterval(() => {
        progress += 5;
        progressBar.style.width = `${progress}%`;

        if (progress >= 100) {
            clearInterval(progressInterval);
        }
    }, 100);

    // 先显示连接成功提示
    setTimeout(() => {
        try {
            // 连接成功后更新提示
            if (toastContent) {
                toastContent.innerHTML = `
                    <div class="connecting-success">
                        <i class="fas fa-check-circle"></i>
                        <span>连接成功，正在启动游戏...</span>
                    </div>
                `;

                // 等待1秒后更新提示信息
                setTimeout(() => {
                    if (toastContent) {
                        toastContent.innerHTML = `
                            <div class="connecting-success">
                                <i class="fas fa-gamepad"></i>
                                <span>游戏正在启动，请稍候...</span>
                            </div>
                        `;

                        // 再等待1秒后执行跳转
                        setTimeout(() => {
                            // 直接创建a标签并触发点击
                            log('服务器连接', '创建a标签并触发点击', '连接尝试');
                            const a = document.createElement('a');
                            a.href = url;
                            a.target = '_blank';
                            a.rel = 'noopener noreferrer';
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);

                            // 跳转后等待1秒再隐藏提示
                            setTimeout(() => {
                                if (toast) {
                                    toast.style.opacity = '0';
                                    toast.style.transform = 'translateY(20px)';

                                    setTimeout(() => {
                                        if (document.body.contains(toast)) {
                                            document.body.removeChild(toast);
                                        }
                                    }, 300);
                                }
                            }, 1000);
                        }, 1000);
                    }
                }, 1000);
            }
        } catch (error) {
            log('服务器连接', `连接失败: ${error.message}`, '错误处理');
            console.error('[服务器连接] 连接失败:', error);

            // 更新提示为错误状态
            if (toastContent && toast) {
                toastContent.innerHTML = `
                    <div class="connecting-error">
                        <i class="fas fa-exclamation-circle"></i>
                        <span>连接失败，请检查网络</span>
                    </div>
                `;
                toast.classList.remove('toast-info');
                toast.classList.add('toast-error');
            }

            // 等待1秒后隐藏提示
            setTimeout(() => {
                if (toast) {
                    toast.style.opacity = '0';
                    toast.style.transform = 'translateY(20px)';

                    setTimeout(() => {
                        if (document.body.contains(toast)) {
                            document.body.removeChild(toast);
                        }
                    }, 300);
                }
            }, 1000);
        }
    }, 2000); // 等待2秒，确保进度条走完
}

// =============================================================================
// 3. DOM元素获取
// =============================================================================

// 获取页面主要DOM元素
const DOM_ELEMENTS = {
    serverList: document.getElementById('serverList'),        // 服务器列表容器
    gridViewBtn: document.getElementById('cardViewBtn'),     // 卡片视图按钮
    listViewBtn: document.getElementById('listViewBtn'),     // 列表视图按钮
    main: document.querySelector('main'),                  // 主内容区域
    searchInput: document.getElementById('searchInput'),     // 搜索输入框
    themeToggle: document.getElementById('themeToggle'),     // 主题切换按钮
    clearSearch: document.getElementById('clearSearch'),    // 清除搜索按钮
    performSearch: document.getElementById('performSearch'), // 执行搜索按钮
    perRowSelect: document.getElementById('perRowSelect')     // 每行显示数量选择器
};

log('DOM元素', '获取页面主要DOM元素', '初始化');

// =============================================================================
// 4. 服务器卡片相关函数
// =============================================================================

/**
 * 更新服务器列表布局
 * @param {number} columns - 每行显示的服务器数量
 */
function updateServerLayout(columns) {
    log('服务器列表', `更新布局为每行显示${columns}个服务器`, '布局');

    // 保存用户偏好
    localStorage.setItem('perRow', columns);

    // 更新CSS网格列数
    const serverList = DOM_ELEMENTS.serverList;
    if (serverList) {
        serverList.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
    }
}

/**
 * 创建服务器卡片HTML
 * @param {Object} server - 服务器信息对象
 * @returns {string} - 服务器卡片的HTML字符串
 */
function createServerCard(server) {
    log('服务器卡片', `创建服务器卡片: ${server.name}`, '卡片生成');
    return `
        <div class="server-card" data-uuid="${server.uuid}">
            <div class="server-image-container">
                <img class="server-image" src="${server.image || './images/logo.png'}" alt="${server.name}服务器介绍">
            </div>
            <div class="server-content">
                <h3>
                    <span class="server-name">${server.name}</span>
                    <span class="server-ip">${server.host}:${server.port}</span>
                </h3>
                <div class="server-status">
                    <span class="status-dot"></span>
                    <span class="online-text">加载中...</span>
                </div>
                <div class="loading-progress-container" style="display: none;">
                    <div class="loading-progress-text">正在获取服务器信息...</div>
                    <div class="loading-progress-bar">
                        <div class="loading-progress-fill"></div>
                    </div>
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
                        <span class="created-time">${server.created_at ? new Date(server.created_at).toLocaleDateString() : '未知'}</span>
                    </div>
                </div>
                <div class="server-description">
                    <p class="motd-text">${server.introduce || '暂无介绍'}</p>
                    <div class="server-motd">
                        <span>MOTD: </span>
                        <span class="motd-content">${server.motd || '暂无MOTD'}</span>
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
async function updateServerCard(card) {
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
    const progressContainer = card.querySelector('.loading-progress-container');
    const progressFill = card.querySelector('.loading-progress-fill');

    // 检查所有必要的元素是否存在
    if (!statusElem || !countElem || !versionElem || !pingElem || !gamemodeElem) {
        log('服务器信息', '服务器卡片中缺少必要的元素', '卡片更新-错误');
        console.error('[服务器信息] 服务器卡片中缺少必要的元素：', {
            statusElem: !!statusElem,
            countElem: !!countElem,
            versionElem: !!versionElem,
            pingElem: !!pingElem,
            gamemodeElem: !!gamemodeElem,
            motdElem: !!motdElem,
            progressContainer: !!progressContainer
        });
        return;
    }

    // 显示加载状态和进度条
    log('服务器信息', '设置加载状态和进度条', '卡片更新');
    statusElem.textContent = '查询中...';

    // 显示进度条
    if (progressContainer) {
        progressContainer.style.display = 'block';
        progressFill.style.width = '0%';

        // 模拟进度条动画
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += 10;
            progressFill.style.width = `${progress}%`;

            if (progress >= 100) {
                clearInterval(progressInterval);
                // 延迟一点时间隐藏进度条，让用户看到100%状态
                setTimeout(() => {
                    if (progressContainer) {
                        progressContainer.style.display = 'none';
                    }
                }, 500);
            }
        }, 300);
    }

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

        // 如果服务器在线，更新服务器信息
        if (data && (data.status === 'online' || data.online)) {
            log('服务器信息', '服务器在线，更新卡片信息', '卡片更新');
            console.log('[服务器信息] 开始更新服务器信息：', data);
            statusElem.textContent = '在线';

            // 设置在线状态图标
            if (statusDot) {
                statusDot.className = 'status-dot online-dot';
            }

            countElem.textContent = `${data.online || 0}/${data.playerCount || 0}`;
            log('服务器信息', `在线人数：${data.online || 0}/${data.playerCount || 0}`, '卡片更新');
            versionElem.textContent = data.protocol || data.version || '未知';
            log('服务器信息', `版本：${data.protocol || data.version || '未知'}`, '卡片更新');
            pingElem.textContent = data.delay || '-';
            log('服务器信息', `延迟：${data.delay || '--'}ms`, '卡片更新');
            gamemodeElem.textContent = data.gamemode || '未知';
            log('服务器信息', `游戏模式：${data.gamemode || '未知'}`, '卡片更新');

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

            // 解析MOTD颜色代码
            if (motdElem) {
                log('MOTD显示', '正在显示服务器MOTD', 'MOTD处理');
                console.log('[MOTD显示] 正在显示服务器MOTD：', data.motd);

                // 更新服务器介绍
                const introduceText = data.name ? `${data.name} - ${data.introduce || '暂无介绍'}` : data.introduce || '暂无介绍';
                motdElem.textContent = introduceText;
                log('MOTD显示', `服务器介绍：${introduceText}`, 'MOTD处理');

                // 更新MOTD内容
                const motdContentElem = card.querySelector('.motd-content');
                if (motdContentElem) {
                    // 先显示加载状态
                    motdContentElem.textContent = '加载中...';

                    // 使用Promise确保MOTD数据已准备好
                    Promise.resolve().then(() => {
                        if (data.motd) {
                            motdContentElem.textContent = data.motd;
                            log('MOTD显示', '使用原始MOTD', 'MOTD处理');
                        } else {
                            motdContentElem.textContent = '暂无MOTD';
                            log('MOTD显示', '使用默认MOTD', 'MOTD处理');
                        }
                    });
                }
            }
        } else {
            // 服务器离线或错误状态
            log('服务器信息', `服务器离线或错误，状态：${data.status}`, '卡片更新');
            statusElem.textContent = data.status === 'offline' ? '离线' : '查询失败';

            // 设置离线状态图标
            if (statusDot) {
                statusDot.className = 'status-dot offline-dot';
            }

            countElem.textContent = '0/0';
            versionElem.textContent = '未知';
            pingElem.textContent = '--';
            gamemodeElem.textContent = '未知';

            if (motdElem) {
                log('MOTD显示', '服务器离线，显示默认MOTD', 'MOTD处理');
                console.log('[MOTD显示] 服务器离线，显示默认MOTD：服务器当前离线');
                motdElem.textContent = '服务器当前离线';
            }
        }
    } catch (error) {
        log('MOTD显示', `更新服务器卡片信息时出错: ${error.message}`, '错误处理');
        console.error('[MOTD显示] 更新服务器卡片信息时出错:', error);
        console.log('[MOTD显示] 无法显示服务器MOTD，请检查网络连接或服务器地址');
        statusElem.textContent = '查询失败';

        // 设置MOTD错误状态
        if (motdElem) {
            motdElem.textContent = '无法获取服务器信息';
        }

        const motdContentElem = card.querySelector('.motd-content');
        if (motdContentElem) {
            motdContentElem.textContent = '查询失败';
        }
    }
}

/**
 * 更新所有服务器卡片信息
 * 遍历所有服务器卡片并更新它们的信息
 */
function updateAllServers() {
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

// =============================================================================
// 5. 数据获取函数
// =============================================================================

/**
 * 从MOTD API获取服务器信息
 * @param {string} host - 服务器主机地址
 * @param {number} port - 服务器端口
 * @returns {Promise<Object>} - 包含服务器信息的Promise对象
 */
async function fetchMotdInfo(host, port, retryCount = 0) {
    const maxRetries = 2;

    try {
        log('MOTD请求', `正在请求MOTD API，主机: ${host}, 端口: ${port}`, 'API请求');

        // 添加超时处理机制
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), MOTD_API_CONFIG.timeout);

        const response = await fetch(`${MOTD_API_CONFIG.baseUrl}/${host}:${port}`, {
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
        log('MOTD请求', 'MOTD API响应数据', 'API响应');
        console.log('[MOTD请求] MOTD API响应数据：', data);

        // 返回处理后的服务器信息
        if (data.online !== undefined) {
            if (data.online) {
                log('MOTD请求', `成功从MOTD API获取服务器信息`, 'API响应');
                // 确保返回的数据包含必要字段
                return {
                    online: data.online,
                    motd: data.motd || { raw: ['未知'], clean: ['未知'], html: ['未知'] },
                    players: data.players || { online: 0, max: 0 },
                    gamemode: data.gamemode || '未知',
                    map: data.map || { raw: '未知', clean: '未知', html: '未知' },
                    protocol: data.protocol || { name: '未知', version: '未知' },
                    serverid: data.serverid || '未知',
                    hostname: data.hostname || '未知',
                    ip: data.ip || '未知',
                    port: data.port || '未知',
                    version: data.version || '未知'
                };
            } else {
                log('MOTD请求', `MOTD API返回服务器离线状态`, 'API响应');
                return null;
            }
        } else {
            log('MOTD请求', `MOTD API返回数据格式异常`, 'API响应');
            return null;
        }
    } catch (error) {
        log('MOTD请求', `获取MOTD API信息时出错: ${error.message}`, '错误处理');
        console.error('[MOTD请求] 获取MOTD API信息时出错:', error);

        // 如果还有重试次数，则进行重试
        if (retryCount < maxRetries) {
            log('MOTD请求', `准备进行第 ${retryCount + 2} 次重试`, '重试');
            // 延迟1秒后重试
            await new Promise(resolve => setTimeout(resolve, 1000));
            return fetchMotdInfo(host, port, retryCount + 1);
        }

        return null;
    }
}

/**
 * 从API获取服务器列表
 * @returns {Promise<Array>} - 包含所有服务器信息的Promise数组
 */
async function fetchServersList() {
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
                last_status_time: server.last_status_time
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
async function fetchServerInfo(uuid, retryCount = 0) {
    const maxRetries = 2;

    try {
        log('MOTD请求', `正在请求服务器MOTD，UUID：${uuid} (尝试 ${retryCount + 1}/${maxRetries + 1})`, 'API请求');

        // 使用新的API，通过UUID获取服务器信息
        log('MOTD请求', `请求地址：${API_CONFIG.baseUrl}?uuid=${uuid}`, 'API请求');

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
        log('MOTD请求', 'API响应数据', 'API响应');
        console.log('[MOTD请求] API响应数据：', data);
        console.log('[MOTD请求] API响应数据详情 - status:', data.status);
        console.log('[MOTD请求] API响应数据详情 - data存在:', !!data.data);
        console.log('[MOTD请求] API响应数据详情 - data类型:', typeof data.data);
        console.log('[MOTD请求] API响应数据详情 - data是数组:', Array.isArray(data.data));
        console.log('[MOTD请求] API响应数据详情 - data数组长度:', Array.isArray(data.data) ? data.data.length : 'N/A');

        // 添加更多调试信息
        if (data.data) {
            console.log('[MOTD请求] data.data内容:', data.data);
            console.log('[MOTD请求] data.data.host存在:', !!data.data.host);
            console.log('[MOTD请求] data.data.port存在:', !!data.data.port);
        }

        // 处理API响应
        if (data.status === 'success' && data.data) {
            // 检查data.data是否为数组且长度大于0
            const hasValidData = Array.isArray(data.data) ? data.data.length > 0 : true;
            if (hasValidData) {
                // 如果data.data是数组，取第一个元素；如果不是数组，直接使用
                const serverData = Array.isArray(data.data) ? data.data[0] : data.data;

                // 添加调试信息
                console.log('[MOTD请求] serverData内容:', serverData);
                console.log('[MOTD请求] serverData.host存在:', !!serverData.host);
                console.log('[MOTD请求] serverData.port存在:', !!serverData.port);

                // 使用MOTD API获取详细信息
                const motdData = await fetchMotdInfo(serverData.host, serverData.port, 0);

                // 使用API返回的MOTD或MOTD API返回的MOTD
                const motdText = motdData ?
                    (motdData.motd && motdData.motd.raw ? motdData.motd.raw.join('\n') :
                        (serverData.introduce || '无法获取MOTD')) :
                    serverData.introduce || '无法获取MOTD';
                log('MOTD请求', `成功获取到服务器MOTD：${motdText}`, 'API响应');

                // 添加服务器信息
                log('MOTD请求', `服务器信息 - 主机名: ${serverData.host}, 端口: ${serverData.port}`, 'API响应');

                // 返回处理后的服务器信息
                // 优先使用MOTD API返回的在线状态，如果不存在则使用API返回的online状态
                const isOnline = motdData ? (motdData.online !== undefined ? motdData.online : serverData.online) : serverData.online;
                return {
                    status: isOnline ? 'online' : 'offline',
                    online: isOnline,
                    playerCount: serverData.player_count || (motdData ? (motdData.players ? motdData.players.online : 0) : 0),
                    name: serverData.name,
                    host: serverData.host,
                    port: serverData.port,
                    motd: motdText,
                    delay: motdData ? null : null, // MOTD API不提供延迟信息
                    gamemode: motdData ? (motdData.gamemode || '未知') : '未知',
                    map: motdData ? (motdData.map ? motdData.map.raw : '未知') : '未知',
                    protocol: motdData ? (motdData.protocol ? motdData.protocol.name : '未知') : '未知',
                    serverId: serverData.uuid || (motdData ? motdData.serverid : '未知'),
                    lastQueryTime: serverData.last_status_time || (motdData ? new Date().toISOString() : '未知')
                };
            };

        } else {
            log('MOTD请求', 'API请求失败，无法获取服务器信息', 'API响应');
            console.log('[MOTD请求] API请求失败，无法获取服务器信息');
            return {
                status: 'offline',
                error: 'API请求失败或服务器不存在',
                uuid: uuid,
                timestamp: new Date().toISOString()
            };
        }
    } catch (error) {
        log('MOTD请求', `获取服务器信息时出错: ${error.message}`, '错误处理');
        console.error('[MOTD请求] 获取服务器信息时出错:', error);
        console.log('[MOTD请求] 无法获取服务器MOTD，可能是网络问题或服务器地址错误');
        console.log('[MOTD请求] 请求地址：', `${API_CONFIG.baseUrl}?uuid=${uuid}`);

        // 如果还有重试次数，则进行重试
        if (retryCount < maxRetries) {
            log('MOTD请求', `准备进行第 ${retryCount + 2} 次重试`, '重试');
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

// =============================================================================
// 6. UI更新函数
// =============================================================================

/**
 * 切换视图模式（卡片视图/列表视图）
 * @param {string} view - 视图类型，'card'或'list'
 */
function toggleView(view) {
    log('视图切换', `切换到${view === 'card' ? '卡片' : '列表'}视图`, '视图切换');

    // 在切换视图前，保存所有服务器卡片的当前状态
    const cards = document.querySelectorAll('.server-card');
    const serverStates = [];

    cards.forEach(card => {
        const uuid = card.getAttribute('data-uuid');
        const statusText = card.querySelector('.online-text');
        const statusDot = card.querySelector('.status-dot');
        const onlineCount = card.querySelector('.online-count');
        const serverVersion = card.querySelector('.server-version');
        const serverPing = card.querySelector('.server-ping');
        const serverGamemode = card.querySelector('.server-gamemode');
        const motdElement = card.querySelector('.motd-text');

        serverStates.push({
            uuid,
            status: statusText ? statusText.textContent : null,
            statusDotClass: statusDot ? statusDot.className : null,
            onlineCount: onlineCount ? onlineCount.textContent : null,
            version: serverVersion ? serverVersion.textContent : null,
            ping: serverPing ? serverPing.textContent : null,
            gamemode: serverGamemode ? serverGamemode.textContent : null,
            motd: motdElement ? motdElement.innerHTML : null
        });
    });

    if (view === 'card') {
        // 切换到卡片视图
        log('视图切换', '应用卡片视图样式', '视图切换');
        DOM_ELEMENTS.main.classList.remove('list-view');
        DOM_ELEMENTS.gridViewBtn.classList.add('active');
        DOM_ELEMENTS.listViewBtn.classList.remove('active');

        cards.forEach(card => {
            card.style.animation = 'fadeInUp 0.4s forwards';

            // 恢复服务器状态
            const uuid = card.getAttribute('data-uuid');
            const state = serverStates.find(s => s.uuid === uuid);

            if (state) {
                // 恢复状态文本
                const statusText = card.querySelector('.online-text');
                if (statusText && state.status && state.status !== '加载中...' && state.status !== '查询中...') {
                    statusText.textContent = state.status;
                }

                // 恢复状态点样式
                const statusDot = card.querySelector('.status-dot');
                if (statusDot && state.statusDotClass &&
                    (state.statusDotClass.includes('online-dot') || state.statusDotClass.includes('offline-dot'))) {
                    statusDot.className = state.statusDotClass;
                }

                // 恢复在线人数
                const onlineCount = card.querySelector('.online-count');
                if (onlineCount && state.onlineCount && state.onlineCount !== '加载中...') {
                    onlineCount.textContent = state.onlineCount;
                }

                // 恢复服务器版本
                const serverVersion = card.querySelector('.server-version');
                if (serverVersion && state.version && state.version !== '加载中...') {
                    serverVersion.textContent = state.version;
                }

                // 恢复服务器延迟
                const serverPing = card.querySelector('.server-ping');
                if (serverPing && state.ping && state.ping !== '--') {
                    serverPing.textContent = state.ping;
                }

                // 恢复游戏模式
                const serverGamemode = card.querySelector('.server-gamemode');
                if (serverGamemode && state.gamemode && state.gamemode !== '加载中...') {
                    serverGamemode.textContent = state.gamemode;
                }

                // 恢复MOTD
                const motdElement = card.querySelector('.server-description');
                if (motdElement && state.motd) {
                    motdElement.innerHTML = state.motd;
                    motdElement.style.display = 'block';
                }
            }
        });
    } else {
        // 切换到列表视图
        log('视图切换', '应用列表视图样式', '视图切换');
        DOM_ELEMENTS.main.classList.add('list-view');
        DOM_ELEMENTS.gridViewBtn.classList.remove('active');
        DOM_ELEMENTS.listViewBtn.classList.add('active');

        cards.forEach(card => {
            card.style.animation = 'fadeInLeft 0.4s forwards';

            // 恢复服务器状态
            const uuid = card.getAttribute('data-uuid');
            const state = serverStates.find(s => s.uuid === uuid);

            if (state) {
                // 恢复状态文本
                const statusText = card.querySelector('.online-text');
                if (statusText && state.status && state.status !== '加载中...' && state.status !== '查询中...') {
                    statusText.textContent = state.status;
                }

                // 恢复状态点样式
                const statusDot = card.querySelector('.status-dot');
                if (statusDot && state.statusDotClass &&
                    (state.statusDotClass.includes('online-dot') || state.statusDotClass.includes('offline-dot'))) {
                    statusDot.className = state.statusDotClass;
                }

                // 恢复在线人数
                const onlineCount = card.querySelector('.online-count');
                if (onlineCount && state.onlineCount && state.onlineCount !== '加载中...') {
                    onlineCount.textContent = state.onlineCount;
                }

                // 恢复服务器版本
                const serverVersion = card.querySelector('.server-version');
                if (serverVersion && state.version && state.version !== '加载中...') {
                    serverVersion.textContent = state.version;
                }

                // 恢复服务器延迟
                const serverPing = card.querySelector('.server-ping');
                if (serverPing && state.ping && state.ping !== '--') {
                    serverPing.textContent = state.ping;
                }

                // 恢复游戏模式
                const serverGamemode = card.querySelector('.server-gamemode');
                if (serverGamemode && state.gamemode && state.gamemode !== '加载中...') {
                    serverGamemode.textContent = state.gamemode;
                }

                // 恢复MOTD
                const motdElement = card.querySelector('.server-description');
                if (motdElement && state.motd) {
                    motdElement.innerHTML = state.motd;
                    motdElement.style.display = 'block';
                    motdElement.style.marginTop = '0.5rem';
                    motdElement.style.overflow = 'hidden';
                    motdElement.style.textOverflow = 'ellipsis';
                    motdElement.style.whiteSpace = 'nowrap';
                    motdElement.style.maxWidth = '100%';
                }
            }
        });
    }

    // 保存视图偏好到本地存储
    log('视图切换', `保存视图偏好: ${view}到本地存储`, '视图切换');
    localStorage.setItem('view', view);
}

// =============================================================================
// 7. 搜索功能
// =============================================================================

/**
 * 根据搜索词过滤服务器列表
 * 在服务器名称、描述和IP地址中搜索匹配项
 */
function filterServers() {
    if (!DOM_ELEMENTS.searchInput) {
        log('搜索功能', '未找到搜索输入框', '搜索-错误');
        return;
    }

    // 检查是否有服务器卡片
    const cards = document.querySelectorAll('.server-card');
    const serverList = document.querySelector('.server-list');

    // 如果没有服务器卡片，直接返回并禁用搜索
    if (cards.length === 0) {
        log('搜索功能', '没有服务器，禁用搜索功能', '搜索');
        return;
    }

    const searchTerm = DOM_ELEMENTS.searchInput.value.toLowerCase();
    log('搜索', `开始搜索，关键词：${searchTerm}`, '搜索');

    // 记录可见的卡片数量
    let visibleCards = 0;

    // 移除可能存在的空状态提示
    const existingEmptyState = document.querySelector('.empty-search-state');
    if (existingEmptyState) {
        existingEmptyState.remove();
    }

    // 遍历所有服务器卡片，根据搜索词过滤
    cards.forEach(card => {
        const titleElem = card.querySelector('.server-name');
        const descriptionElem = card.querySelector('.server-description');
        const ipElem = card.querySelector('.server-ip');

        // 检查必要的元素是否存在
        if (!titleElem || !descriptionElem || !ipElem) {
            log('搜索', '服务器卡片中缺少必要的元素', '搜索-错误');
            console.error('服务器卡片中缺少必要的元素');
            return;
        }

        // 获取文本内容并转换为小写以便搜索
        const title = titleElem.textContent.toLowerCase();
        const description = descriptionElem.textContent.toLowerCase();
        const ip = ipElem.textContent.toLowerCase();

        // 检查是否匹配搜索词
        if (title.includes(searchTerm) || description.includes(searchTerm) || ip.includes(searchTerm)) {
            card.style.display = 'flex';
            visibleCards++;
            log('搜索', `找到匹配的服务器：${title}`, '搜索');
        } else {
            card.style.display = 'none';
        }
    });

    // 如果没有可见的卡片且搜索词不为空，显示空状态提示
    if (visibleCards === 0 && searchTerm) {
        log('搜索', '未找到匹配的服务器，显示空状态提示', '搜索');
        console.log('[搜索] 未找到匹配的服务器，显示空状态提示');
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-search-state';
        emptyState.style.opacity = '0';
        emptyState.style.transform = 'translateY(20px)';
        emptyState.style.transition = 'opacity 0.5s ease, transform 0.5s ease';

        emptyState.innerHTML = `
            <div class="mdui-col-sm-12 mdui-col-md-12">
                <div class="empty-state">
                    <i class="fas fa-search" style="font-size: 48px; color: var(--gray); margin-bottom: 1rem; animation: pulse 2s infinite;"></i>
                    <h3>没有找到匹配的服务器</h3>
                    <p>尝试使用不同的关键词搜索</p>
                    <button class="btn btn-primary" id="clearSearchBtn">
                        <i class="fas fa-times"></i> 清除搜索
                    </button>
                </div>
            </div>
        `;

        serverList.appendChild(emptyState);

        // 添加动画效果
        setTimeout(() => {
            emptyState.style.opacity = '1';
            emptyState.style.transform = 'translateY(0)';
        }, 10);

        // 为清除搜索按钮添加事件监听器
        document.getElementById('clearSearchBtn').addEventListener('click', (e) => {
            e.preventDefault(); // 阻止默认行为
            log('搜索', '用户点击了清除搜索按钮', '搜索');
            // 添加淡出动画
            emptyState.style.opacity = '0';
            emptyState.style.transform = 'translateY(20px)';

            // 等待动画完成后移除元素
            setTimeout(() => {
                log('搜索', '清除搜索内容并重置显示', '搜索');
                console.log('[搜索] 清除搜索内容并重置显示');
                DOM_ELEMENTS.searchInput.value = '';
                filterServers();
                DOM_ELEMENTS.searchInput.blur(); // 取消搜索框的聚焦状态
                // 确保没有其他代码会重新聚焦到搜索框
                setTimeout(() => {
                    DOM_ELEMENTS.searchInput.blur();
                }, 100);
            }, 500);
        });
    }
}

// =============================================================================
// 8. 主题功能
// =============================================================================

/**
 * 切换主题（亮色/暗色模式）
 */
function toggleTheme() {
    log('主题切换', '开始切换主题', '主题切换');
    const themeIcon = DOM_ELEMENTS.themeToggle.querySelector('i');

    // 切换暗色模式类
    document.body.classList.toggle('dark-mode');
    if (document.body.classList.contains('dark-mode')) {
        themeIcon.classList.remove('fa-moon');
        themeIcon.classList.add('fa-sun');
        log('主题切换', '切换到暗色模式', '主题切换');
    } else {
        themeIcon.classList.remove('fa-sun');
        themeIcon.classList.add('fa-moon');
        log('主题切换', '切换到亮色模式', '主题切换');
    }

    // 保存主题偏好到本地存储
    log('主题切换', `保存主题偏好: ${document.body.classList.contains('dark-mode') ? 'dark' : 'light'}到本地存储`, '主题切换');
    localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
}

// =============================================================================
// 9. 应用初始化
// =============================================================================

/**
 * 加载服务器列表
 * 根据SERVERS_CONFIG数组创建服务器卡片并添加到页面中
 */
async function loadServers() {
    log('服务器列表', '开始加载服务器列表', '初始化');

    // 确保服务器列表容器存在
    if (!DOM_ELEMENTS.serverList) {
        log('服务器列表', '未找到服务器列表容器', '初始化-错误');
        console.error('[服务器列表] 未找到服务器列表容器');
        return;
    }

    // 清空现有内容，包括加载占位符
    DOM_ELEMENTS.serverList.innerHTML = '';

    // 显示加载状态
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'loading-placeholder';
    loadingIndicator.innerHTML = `
            <div class="spinner"></div>
            <h3 style="margin-top: 1rem; font-weight: 500;">正在加载服务器列表</h3>
            <p style="margin-top: 0.5rem; color: var(--text-light);">请稍候，正在获取服务器信息...</p>
        `;
    DOM_ELEMENTS.serverList.appendChild(loadingIndicator);

    // 从API获取服务器列表
    const servers = await fetchServersList();

    // 创建服务器卡片
    if (servers.length > 0) {
        // 如果有服务器，启用搜索框
        if (DOM_ELEMENTS.searchInput) {
            DOM_ELEMENTS.searchInput.disabled = false;
            // 移除禁用样式
            DOM_ELEMENTS.searchInput.classList.remove('disabled');
            log('搜索功能', '有服务器，启用搜索框', '搜索');
        }

        servers.forEach(server => {
            const cardHtml = createServerCard(server);
            DOM_ELEMENTS.serverList.insertAdjacentHTML('beforeend', cardHtml);
            log('服务器列表', `已添加服务器卡片: ${server.name} (${server.host}:${server.port})`, '初始化');
        });
    } else {
        // 如果没有获取到服务器列表，显示空状态提示
        const noServersState = document.createElement('div');
        noServersState.className = 'no-servers-state';
        noServersState.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-server" style="font-size: 48px; color: var(--gray); margin-bottom: 1rem; animation: pulse 2s infinite;"></i>
                <h3>暂无服务器</h3>
                <p>当前没有可用的服务器，请稍后再试</p>
            </div>
        `;
        DOM_ELEMENTS.serverList.appendChild(noServersState);

        // 禁用搜索框
        if (DOM_ELEMENTS.searchInput) {
            DOM_ELEMENTS.searchInput.disabled = true;
            // 添加禁用样式
            DOM_ELEMENTS.searchInput.classList.add('disabled');
            log('搜索功能', '没有服务器，禁用搜索框', '搜索');
        }
    }

    // 移除加载占位符
    const loadingElement = DOM_ELEMENTS.serverList.querySelector('.loading-placeholder');
    if (loadingElement) {
        loadingElement.remove();
    }

    // 触发服务器列表加载完成事件
    log('服务器列表', '服务器列表加载完成，触发事件', '初始化');
    console.log('[服务器列表] 服务器列表加载完成，触发事件');
    const event = new Event('serversLoaded');
    document.dispatchEvent(event);
}

/**
 * 初始化应用
 * 设置事件监听器、加载默认数据和应用用户偏好
 */
async function initializeApp() {
    log('应用初始化', '开始初始化应用', '初始化');

    // 首先加载主题配置
    log('应用初始化', '加载主题配置', '初始化');
    const savedTheme = localStorage.getItem('theme');
    log('应用初始化', `检查保存的主题偏好: ${savedTheme}`, '初始化');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        const themeIcon = DOM_ELEMENTS.themeToggle?.querySelector('i');
        if (themeIcon) {
            themeIcon.classList.remove('fa-moon');
            themeIcon.classList.add('fa-sun');
        }
    }

    // 加载服务器列表
    log('应用初始化', '加载服务器列表', '初始化');
    await loadServers();

    // 服务器状态更新将在serversLoaded事件中处理

    // 添加视图切换事件监听器
    if (DOM_ELEMENTS.gridViewBtn && DOM_ELEMENTS.listViewBtn) {
        log('应用初始化', '添加视图切换事件监听器', '初始化');
        DOM_ELEMENTS.gridViewBtn.addEventListener('click', () => toggleView('card'));
        DOM_ELEMENTS.listViewBtn.addEventListener('click', () => toggleView('list'));

        // 检查保存的视图偏好
        const savedView = localStorage.getItem('view');
        log('应用初始化', `检查保存的视图偏好: ${savedView}`, '初始化');
        if (savedView === 'list') {
            toggleView('list');
        }
    }

    // 搜索事件监听器
    if (DOM_ELEMENTS.searchInput) {
        log('应用初始化', '添加搜索事件监听器', '初始化');
        // 输入时自动搜索
        DOM_ELEMENTS.searchInput.addEventListener('input', filterServers);

        // 清除搜索按钮
        if (DOM_ELEMENTS.clearSearch) {
            DOM_ELEMENTS.clearSearch.addEventListener('click', (e) => {
                e.preventDefault(); // 阻止默认行为
                log('搜索', '用户点击了清除搜索按钮', '搜索');
                DOM_ELEMENTS.searchInput.value = '';
                filterServers();
                DOM_ELEMENTS.searchInput.blur(); // 取消搜索框的聚焦状态
            });
        }

        // 执行搜索按钮
        if (DOM_ELEMENTS.performSearch) {
            DOM_ELEMENTS.performSearch.addEventListener('click', () => {
                log('搜索', '用户点击了执行搜索按钮', '搜索');
                filterServers();
            });
        }

        // 刷新服务器列表按钮
        const refreshBtn = document.getElementById('refreshServers');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', async () => {
                log('服务器列表', '用户点击了刷新服务器列表按钮', '刷新');
                console.log('[服务器列表] 用户点击了刷新服务器列表按钮');

                // 添加旋转动画
                refreshBtn.classList.add('spinning');

                // 清空当前搜索
                DOM_ELEMENTS.searchInput.value = '';

                // 重新加载服务器列表
                await loadServers();

                // 移除旋转动画
                setTimeout(() => {
                    refreshBtn.classList.remove('spinning');
                }, 1000);
            });
        }

        // 每行显示数量选择器
        if (DOM_ELEMENTS.perRowSelect) {
            log('应用初始化', '添加每行显示数量选择器事件监听器', '初始化');

            // 检查保存的每行显示数量偏好
            const savedPerRow = localStorage.getItem('perRow');
            if (savedPerRow) {
                DOM_ELEMENTS.perRowSelect.value = savedPerRow;
                updateServerLayout(parseInt(savedPerRow));
            }

            // 添加选择变化事件监听器
            DOM_ELEMENTS.perRowSelect.addEventListener('change', (e) => {
                const selectedValue = parseInt(e.target.value);
                log('服务器列表', `用户选择了每行显示${selectedValue}个服务器`, '布局');
                updateServerLayout(selectedValue);
            });
        }

        // 按回车键搜索
        DOM_ELEMENTS.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                log('搜索', '用户按下了回车键执行搜索', '搜索');
                filterServers();
            }
        });
    }

    // 主题切换
    if (DOM_ELEMENTS.themeToggle) {
        log('应用初始化', '添加主题切换事件监听器', '初始化');
        DOM_ELEMENTS.themeToggle.addEventListener('click', toggleTheme);
    }
}

// =============================================================================
// 10. 服务器卡片点击处理
// =============================================================================

// 定义点击事件处理函数
function handleServerCardClick(event) {
    // 检查点击的元素是否是服务器卡片或者是服务器卡片内的元素
    let card = event.target.closest('.server-card');
    if (!card) return;

    // 阻止事件冒泡，避免干扰其他事件
    event.stopPropagation();

    // 获取服务器主机地址
    const uuid = card.getAttribute('data-uuid');
    if (uuid) {
        log('服务器点击', `用户点击了服务器: ${uuid}`, '点击处理');
        connectToServer(uuid);
    }
}

/**
 * 添加服务器卡片点击跳转功能
 */
function addServerCardClickHandlers() {
    log('服务器点击', '开始绑定服务器卡片点击事件', '事件绑定');

    // 使用事件委托，在父元素上监听点击事件
    const serverList = DOM_ELEMENTS.serverList;
    if (!serverList) {
        log('服务器点击', '未找到服务器列表容器', '事件绑定-错误');
        console.warn('[服务器点击] 未找到服务器列表容器');
        return;
    }

    // 移除可能已存在的事件监听器，避免重复绑定
    serverList.removeEventListener('click', handleServerCardClick);

    // 添加事件监听器，使用事件捕获模式
    serverList.addEventListener('click', handleServerCardClick, true);

    // 添加指针样式到所有服务器卡片
    const serverCards = document.querySelectorAll('.server-card');
    serverCards.forEach(card => {
        card.style.cursor = 'pointer';
        // 确保卡片有正确的z-index，以便悬浮效果正常工作
        card.style.position = 'relative';
    });

    log('服务器点击', `已绑定 ${serverCards.length} 个服务器卡片的点击事件`, '事件绑定');
}

// =============================================================================
// 11. 应用启动
// =============================================================================

// 监听服务器列表加载完成事件
document.addEventListener('serversLoaded', () => {
    log('应用启动', '服务器列表加载完成，开始更新服务器信息', '启动');
    console.log('[服务器信息] 服务器列表加载完成，开始更新服务器信息');

    // 应用当前视图设置
    const savedView = localStorage.getItem('view');
    log('应用启动', `应用当前视图设置: ${savedView || 'card'}`, '启动');
    if (savedView === 'list') {
        toggleView('list');
    } else {
        toggleView('card');
    }

    // 更新所有服务器卡片信息
    setTimeout(() => {
        log('应用启动', '开始批量更新服务器卡片信息', '启动');
        console.log('[服务器信息] 开始批量更新服务器卡片信息');
        updateAllServers();

        // 添加服务器卡片点击处理程序
        setTimeout(() => {
            log('应用启动', '添加服务器卡片点击处理程序', '启动');
            addServerCardClickHandlers();

            // 视图切换不需要重新绑定点击事件
        }, 1500);
    }, 1000); // 延迟1秒确保DOM已渲染完成
});

// 在DOM加载完成后添加点击事件监听
document.addEventListener('DOMContentLoaded', function () {
    log('应用启动', 'DOM加载完成，准备添加服务器卡片点击事件', '启动');
    console.log('[初始化] DOM加载完成，准备添加服务器卡片点击事件');

    // 点击事件处理将在serversLoaded事件中处理

    // 初始化应用
    log('应用启动', '调用初始化函数', '启动');
    (async () => {
        await initializeApp();
        
        // 添加手机端菜单按钮功能
        const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
        const navLinks = document.querySelector('.nav-links');
        
        if (mobileMenuBtn && navLinks) {
            mobileMenuBtn.addEventListener('click', () => {
                navLinks.classList.toggle('active');
                mobileMenuBtn.classList.toggle('active');
                const isActive = navLinks.classList.contains('active');
                log('导航菜单', `手机端菜单${isActive ? '打开' : '关闭'}`, '交互');
                
                // 防止菜单打开时页面滚动
                if (isActive) {
                    document.body.style.overflow = 'hidden';
                } else {
                    document.body.style.overflow = '';
                }
            });
            
            // 点击导航链接后关闭菜单
            const navLinksItems = navLinks.querySelectorAll('a');
            navLinksItems.forEach(link => {
                link.addEventListener('click', () => {
                    navLinks.classList.remove('active');
                    document.body.style.overflow = '';
                });
            });
        }
    })();
});

log('应用启动', 'BDSGP 服务器列表已加载', '启动');
console.log('BDSGP 服务器列表已加载');