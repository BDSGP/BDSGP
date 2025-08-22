// =============================================================================
// BDSGP 服务器列表应用 - 统一管理所有功能
// 面向 AI 编程（最直白）
// =============================================================================

document.addEventListener('DOMContentLoaded', function () {
    // =============================================================================
    // 配置和常量
    // =============================================================================

    // 服务器数据配置
    // 修改此数组来添加、删除或修改服务器信息
    const servers = [
        {
            host: "play.easecation.net:19132", // 服务器主机地址:端口
            name: "EaseCation",                // 服务器名称
            image: "./images/logo.png",        // 服务器图标路径
            motd: "§l§aEase§6Cation§r§3 §r§7§kEC§r §l§6BUILD BATTLES§r §7§kEC§r", // 服务器MOTD（带颜色代码）
            status: "online"                   // 服务器状态（online/offline）
        },
        {
            host: "yixiu.huohuo.ink:11451",
            name: "亦朽服务器",
            image: "./images/亦朽-YX.png",
            motd: "欢迎来到亦朽服务器！",
            status: "online"
        },
        {
            host: "menghan.love:19132",
            name: "梦涵服务器",
            image: "./images/梦涵LOVE.jpg",
            motd: "和谐友爱，等你来！",
            status: "online"
        }
    ];

    // API配置
    const API_CONFIG = {
        baseUrl: "https://motdbe.blackbe.work/api",
        timeout: 5000  // 请求超时时间（毫秒）
    };

    // =============================================================================
    // DOM元素获取
    // =============================================================================

    // 获取页面主要DOM元素
    const serverList = document.getElementById('serverList');        // 服务器列表容器
    const gridViewBtn = document.getElementById('cardViewBtn');     // 卡片视图按钮
    const listViewBtn = document.getElementById('listViewBtn');     // 列表视图按钮
    const main = document.querySelector('main');                  // 主内容区域
    const searchInput = document.getElementById('searchInput');     // 搜索输入框
    const themeToggle = document.getElementById('themeToggle');     // 主题切换按钮

    // =============================================================================
    // 工具函数
    // =============================================================================

    /**
     * 解析Minecraft颜色代码
     * 将Minecraft中的§颜色代码转换为HTML样式
     * @param {string} text - 包含Minecraft颜色代码的文本
     * @returns {string} - 转换后的HTML文本
     */
    function parseMinecraftColors(text) {
        if (!text) return '';

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

        let result = text;
        // 替换所有颜色代码
        for (const [code, replacement] of Object.entries(colorMap)) {
            result = result.replace(new RegExp(code, 'g'), replacement);
        }

        return result;
    }

    // =============================================================================
    // UI生成函数
    // =============================================================================

    /**
     * 创建服务器卡片HTML
     * @param {Object} server - 服务器信息对象
     * @returns {string} - 服务器卡片的HTML字符串
     */
    function createServerCard(server) {
        return `
            <div class="server-card" data-host="${server.host}">
                <div class="server-image-container">
                    <img class="server-image" src="${server.image}" alt="${server.name}服务器MOTD">
                    <div class="server-status">
                        <span class="status-dot"></span>
                        <span class="online-text">加载中...</span>
                    </div>
                </div>
                <div class="server-content">
                    <h3>
                        <span class="server-name">${server.name}</span>
                        <span class="server-ip">${server.host}</span>
                    </h3>
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
                    </div>
                    <p class="server-description motd-text">${server.motd}</p>
                </div>
            </div>
        `;
    }

    // =============================================================================
    // 数据获取和处理函数
    // =============================================================================

    /**
     * 从API获取服务器信息
     * @param {string} host - 服务器主机地址:端口
     * @returns {Promise<Object>} - 包含服务器信息的Promise对象
     */
    async function fetchServerInfo(host) {
        try {
            console.log('[MOTD请求] 正在请求服务器MOTD，地址：', host);

            // 使用新的MOTD API，确保包含端口号
            console.log('[MOTD请求] 请求地址：', host);
            const response = await fetch(`${API_CONFIG.baseUrl}?host=${host}`, {
                timeout: API_CONFIG.timeout
            });

            // 检查HTTP响应状态
            if (!response.ok) {
                throw new Error(`HTTP错误! 状态: ${response.status}`);
            }

            const data = await response.json();

            // 添加API响应的调试信息
            console.log('[MOTD请求] API响应数据：', data);

            // 处理API响应
            if (data.status === 'online') {
                // 新API返回的是原始MOTD文本，需要解析颜色代码
                const motdText = data.motd || '无法获取MOTD';
                console.log('[MOTD请求] 成功获取到服务器MOTD：', motdText);

                // 添加服务器信息
                console.log('[MOTD请求] 服务器信息 - 主机名:', data.host, ', 协议版本:', data.agreement, ', 客户端版本:', data.version);

                // 返回处理后的服务器信息
                return {
                    status: 'online',
                    online: data.online,
                    max: data.max,
                    version: data.version,
                    // 解析原始MOTD文本
                    motd: motdText,
                    // 使用API返回的延迟值
                    delay: data.delay || null,
                    gamemode: data.gamemode || '未知',
                    // 添加地图信息（level_name）
                    map: data.level_name || '未知',
                    // 添加协议版本信息（agreement）
                    protocol: data.agreement ? `协议版本 ${data.agreement}` : '未知',
                    // 添加服务器唯一ID
                    serverId: data.server_unique_id || '未知'
                };

            } else {
                console.log('[MOTD请求] 服务器离线，无法获取MOTD');
                return {
                    status: 'offline',
                    error: '服务器离线'
                };
            }
        } catch (error) {
            console.error('[MOTD请求] 获取服务器信息时出错:', error);
            console.log('[MOTD请求] 无法获取服务器MOTD，可能是网络问题或服务器地址错误');
            console.log('[MOTD请求] 请求地址：', `${API_CONFIG.baseUrl}?host=${host}`);
            return {
                status: 'error',
                error: error.message || '未知错误',
                timestamp: new Date().toISOString()
            };
        }
    }

    // =============================================================================
    // UI更新函数
    // =============================================================================

    /**
     * 更新单个服务器卡片信息
     * @param {HTMLElement} card - 服务器卡片DOM元素
     */
    async function updateServerCard(card) {
        console.log('[服务器信息] updateServerCard函数被调用');
        const host = card.getAttribute('data-host');
        console.log('[服务器信息] 卡片主机名：', host);

        // 检查主机名是否存在
        if (!host) {
            console.warn('[服务器信息] 卡片缺少data-host属性');
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

        // 检查所有必要的元素是否存在
        if (!statusElem || !countElem || !versionElem || !pingElem || !gamemodeElem) {
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
        statusElem.textContent = '查询中...';

        try {
            // 获取服务器信息
            const data = await fetchServerInfo(host);

            // 如果服务器在线，更新服务器信息
            if (data && data.status === 'online') {
                console.log('[服务器信息] 开始更新服务器信息：', data);
                statusElem.textContent = '在线';
                
                // 设置在线状态图标
                if (statusDot) {
                    statusDot.className = 'online-dot';
                }
                
                countElem.textContent = `${data.online || 0}/${data.max || 0}`;
                console.log('[服务器信息] 在线人数：', data.online, '/', data.max);
                versionElem.textContent = data.version || '未知';
                console.log('[服务器信息] 版本：', data.version);
                pingElem.textContent = data.delay || '--';
                console.log('[服务器信息] 延迟：', data.delay, 'ms');
                gamemodeElem.textContent = data.gamemode || '未知';
                console.log('[服务器信息] 游戏模式：', data.gamemode);

                // 显示服务器唯一ID
                const serverIdElem = card.querySelector('.server-id');
                if (serverIdElem) {
                    serverIdElem.textContent = data.serverId || '未知';
                    console.log('[服务器信息] 服务器唯一ID：', data.serverId || '未知');
                }

                // 解析MOTD颜色代码
                if (motdElem) {
                    console.log('[MOTD显示] 正在显示服务器MOTD：', data.motd);

                    // 新API返回的是原始MOTD文本，需要解析颜色代码
                    let motdHtml = '';
                    if (data.motd) {
                        motdHtml = parseMinecraftColors(data.motd) || '欢迎来到服务器！';
                        console.log('[MOTD显示] 使用原始MOTD并解析颜色代码');
                    } else {
                        motdHtml = '欢迎来到服务器！';
                        console.log('[MOTD显示] 使用默认MOTD');
                    }

                    motdElem.innerHTML = motdHtml;
                }
            } else {
                // 服务器离线或错误状态
                statusElem.textContent = data.status === 'offline' ? '离线' : '查询失败';
                
                // 设置离线状态图标
                if (statusDot) {
                    statusDot.className = 'offline-dot';
                }
                
                countElem.textContent = '0/0';
                versionElem.textContent = '未知';
                pingElem.textContent = '--';
                gamemodeElem.textContent = '未知';

                if (motdElem) {
                    console.log('[MOTD显示] 服务器离线，显示默认MOTD：服务器当前离线');
                    motdElem.textContent = '服务器当前离线';
                }
            }
        } catch (error) {
            console.error('[MOTD显示] 更新服务器卡片信息时出错:', error);
            console.log('[MOTD显示] 无法显示服务器MOTD，请检查网络连接或服务器地址');
            statusElem.textContent = '查询失败';
        }
    }

    /**
     * 更新所有服务器卡片信息
     * 遍历所有服务器卡片并更新它们的信息
     */
    function updateAllServers() {
        console.log('[服务器信息] updateAllServers函数被调用');
        const cards = document.querySelectorAll('.server-card');
        console.log('[服务器信息] 找到服务器卡片数量：', cards.length);

        // 如果没有找到任何服务器卡片，输出警告并返回
        if (cards.length === 0) {
            console.warn('[服务器信息] 未找到任何服务器卡片，请检查DOM是否已加载');
            return;
        }

        // 更新每个服务器卡片
        cards.forEach((card, index) => {
            console.log(`[服务器信息] 开始更新第${index + 1}个服务器卡片，主机名：`, card.getAttribute('data-host'));
            updateServerCard(card);
        });
    }

    // =============================================================================
    // 视图和交互功能
    // =============================================================================

    /**
     * 切换视图模式（卡片视图/列表视图）
     * @param {string} view - 视图类型，'card'或'list'
     */
    function toggleView(view) {
        if (view === 'card') {
            // 切换到卡片视图
            main.classList.remove('list-view');
            gridViewBtn.classList.add('active');
            listViewBtn.classList.remove('active');

            const cards = document.querySelectorAll('.server-card');
            cards.forEach(card => {
                card.style.animation = 'fadeInUp 0.4s forwards';
                // 确保MOTD在卡片视图中可见并正确渲染颜色
                const motdElement = card.querySelector('.server-description');
                if (motdElement) {
                    motdElement.style.display = 'block';
                    // 获取原始MOTD文本并解析颜色代码
                    const host = card.getAttribute('data-host');
                    const server = servers.find(s => s.host === host);
                    if (server) {
                        // 新API返回的是原始MOTD文本，需要解析颜色代码
                        let motdHtml = '';
                        if (server.motd) {
                            motdHtml = parseMinecraftColors(server.motd) || '欢迎来到服务器！';
                            console.log('[MOTD显示] 使用原始MOTD并解析颜色代码');
                        } else {
                            motdHtml = '欢迎来到服务器！';
                            console.log('[MOTD显示] 使用默认MOTD');
                        }

                        motdElement.innerHTML = motdHtml;
                    }
                }
            });
        } else {
            // 切换到列表视图
            main.classList.add('list-view');
            gridViewBtn.classList.remove('active');
            listViewBtn.classList.add('active');

            const cards = document.querySelectorAll('.server-card');
            cards.forEach(card => {
                card.style.animation = 'fadeInLeft 0.4s forwards';
                // 确保MOTD在列表视图中可见并正确渲染颜色
                const motdElement = card.querySelector('.server-description');
                if (motdElement) {
                    motdElement.style.display = 'block';
                    motdElement.style.marginTop = '0.5rem';
                    motdElement.style.overflow = 'hidden';
                    motdElement.style.textOverflow = 'ellipsis';
                    motdElement.style.whiteSpace = 'nowrap';
                    motdElement.style.maxWidth = '100%';

                    // 获取原始MOTD文本并解析颜色代码
                    const host = card.getAttribute('data-host');
                    const server = servers.find(s => s.host === host);
                    if (server) {
                        // 新API返回的是原始MOTD文本，需要解析颜色代码
                        let motdHtml = '';
                        if (server.motd) {
                            motdHtml = parseMinecraftColors(server.motd) || '欢迎来到服务器！';
                            console.log('[MOTD显示] 使用原始MOTD并解析颜色代码');
                        } else {
                            motdHtml = '欢迎来到服务器！';
                            console.log('[MOTD显示] 使用默认MOTD');
                        }

                        motdElement.innerHTML = motdHtml;
                    }
                }
            });
        }

        // 保存视图偏好到本地存储
        localStorage.setItem('view', view);
    }

    // =============================================================================
    // 搜索功能
    // =============================================================================

    /**
     * 根据搜索词过滤服务器列表
     * 在服务器名称、描述和IP地址中搜索匹配项
     */
    function filterServers() {
        if (!searchInput) return;

        const searchTerm = searchInput.value.toLowerCase();
        console.log('[搜索] 开始搜索，关键词：', searchTerm);
        const cards = document.querySelectorAll('.server-card');
        const serverList = document.querySelector('.server-list');

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
                console.log('[搜索] 找到匹配的服务器：', title);
            } else {
                card.style.display = 'none';
            }
        });

        // 如果没有可见的卡片且搜索词不为空，显示空状态提示
        if (visibleCards === 0 && searchTerm) {
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
            document.getElementById('clearSearchBtn').addEventListener('click', () => {
                console.log('[搜索] 用户点击了清除搜索按钮');
                // 添加淡出动画
                emptyState.style.opacity = '0';
                emptyState.style.transform = 'translateY(20px)';

                // 等待动画完成后移除元素
                setTimeout(() => {
                    console.log('[搜索] 清除搜索内容并重置显示');
                    searchInput.value = '';
                    filterServers();
                    searchInput.focus();
                }, 500);
            });
        }
    }

    // =============================================================================
    // 主题功能
    // =============================================================================

    /**
     * 切换主题（亮色/暗色模式）
     */
    function toggleTheme() {
        const themeIcon = themeToggle.querySelector('i');

        // 切换暗色模式类
        document.body.classList.toggle('dark-mode');
        if (document.body.classList.contains('dark-mode')) {
            themeIcon.classList.remove('fa-moon');
            themeIcon.classList.add('fa-sun');
        } else {
            themeIcon.classList.remove('fa-sun');
            themeIcon.classList.add('fa-moon');
        }

        // 保存主题偏好到本地存储
        localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
    }

    // =============================================================================
    // 应用初始化
    // =============================================================================

    /**
     * 加载服务器列表
     * 根据servers数组创建服务器卡片并添加到页面中
     */
    function loadServers() {
        console.log('[服务器列表] 开始加载服务器列表');
        
        // 确保服务器列表容器存在
        if (!serverList) {
            console.error('[服务器列表] 未找到服务器列表容器');
            return;
        }
        
        // 清空现有内容
        serverList.innerHTML = '';
        
        // 创建服务器卡片
        servers.forEach(server => {
            const cardHtml = createServerCard(server);
            serverList.insertAdjacentHTML('beforeend', cardHtml);
            console.log(`[服务器列表] 已添加服务器卡片: ${server.name} (${server.host})`);
        });
        
        // 触发服务器列表加载完成事件
        console.log('[服务器列表] 服务器列表加载完成，触发事件');
        const event = new Event('serversLoaded');
        document.dispatchEvent(event);
    }

    /**
     * 初始化应用
     * 设置事件监听器、加载默认数据和应用用户偏好
     */
    function initializeApp() {
        // 加载服务器列表
        loadServers();

        // 初始化服务器状态
        updateAllServers();

        // 添加视图切换事件监听器
        if (gridViewBtn && listViewBtn) {
            gridViewBtn.addEventListener('click', () => toggleView('card'));
            listViewBtn.addEventListener('click', () => toggleView('list'));

            // 检查保存的视图偏好
            if (localStorage.getItem('view') === 'list') {
                toggleView('list');
            }
        }

        // 搜索事件监听器
        if (searchInput) {
            // 输入时自动搜索
            searchInput.addEventListener('input', filterServers);

            // 清除搜索按钮
            const clearSearch = document.getElementById('clearSearch');
            if (clearSearch) {
                clearSearch.addEventListener('click', () => {
                    searchInput.value = '';
                    filterServers();
                    searchInput.focus();
                });
            }

            // 执行搜索按钮
            const performSearch = document.getElementById('performSearch');
            if (performSearch) {
                performSearch.addEventListener('click', () => {
                    console.log('[搜索] 用户点击了执行搜索按钮');
                    filterServers();
                });
            }

            // 按回车键搜索
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    console.log('[搜索] 用户按下了回车键执行搜索');
                    filterServers();
                }
            });
        }

        // 主题切换
        if (themeToggle) {
            themeToggle.addEventListener('click', toggleTheme);

            // 检查保存的主题偏好
            if (localStorage.getItem('theme') === 'dark') {
                document.body.classList.add('dark-mode');
                const themeIcon = themeToggle.querySelector('i');
                if (themeIcon) {
                    themeIcon.classList.remove('fa-moon');
                    themeIcon.classList.add('fa-sun');
                }
            }
        }

        // 监听服务器列表加载完成事件
        document.addEventListener('serversLoaded', () => {
            console.log('[服务器信息] 服务器列表加载完成，开始更新服务器信息');
            // 应用当前视图设置
            if (localStorage.getItem('view') === 'list') {
                toggleView('list');
            } else {
                toggleView('card');
            }

            // 更新所有服务器卡片信息
            setTimeout(() => {
                console.log('[服务器信息] 开始批量更新服务器卡片信息');
                updateAllServers();
            }, 1000); // 延迟1秒确保DOM已渲染完成
        });
    }

    // =============================================================================
    // 启动应用
    // =============================================================================

    // 调用初始化函数启动应用
    initializeApp();
    console.log('BDSGP 服务器列表已加载');
});
