// =============================================================================
// 主应用文件 - 初始化和协调所有模块
// =============================================================================

import { log } from './utils.js';
import { fetchServersList } from './api.js';
import { createServerCard, updateAllServers, updateServerLayout } from './serverCards.js';
import { toggleView, toggleTheme, filterServers } from './ui.js';
import { addServerCardClickHandlers } from './serverConnect.js';
import { initStatsAnimation, initStats } from './stats.js';
import { initPlayerHistoryChart } from './playerHistoryChart.js';
import { initOverallPlayerHistoryChart } from './overallPlayerHistoryChart.js';
import { UI_CONFIG, SERVER_CONFIG } from './config.js';

// DOM元素
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

/**
 * 加载服务器列表
 * 根据API返回的数据创建服务器卡片并添加到页面中
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

    // 显示占位符卡片
    setTimeout(() => {
        // 获取占位符模板
        const placeholderTemplate = document.querySelector('.placeholder-card');
        if (placeholderTemplate) {
            // 克隆3个占位符卡片
            for (let i = 0; i < 3; i++) {
                const placeholder = placeholderTemplate.cloneNode(true);
                placeholder.style.display = 'flex';
                placeholder.classList.add('placeholder-card');
                DOM_ELEMENTS.serverList.appendChild(placeholder);
            }
        }
    }, 500);

    try {
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
                    <button class="btn btn-primary retry-btn" id="retryLoadServers">
                        <i class="fas fa-redo"></i> 重新加载
                    </button>
                </div>
            `;
            DOM_ELEMENTS.serverList.appendChild(noServersState);

            // 添加重试按钮事件监听器
            const retryBtn = noServersState.querySelector('.retry-btn');
            if (retryBtn) {
                retryBtn.addEventListener('click', () => {
                    log('服务器列表', '用户点击了重新加载按钮', '初始化');
                    loadServers();
                });
            }

            // 禁用搜索框
            if (DOM_ELEMENTS.searchInput) {
                DOM_ELEMENTS.searchInput.disabled = true;
                // 添加禁用样式
                DOM_ELEMENTS.searchInput.classList.add('disabled');
                log('搜索功能', '没有服务器，禁用搜索框', '搜索');
            }
        }
    } catch (error) {
        log('服务器列表', `加载服务器列表时出错: ${error.message}`, '错误处理');
        console.error('[服务器列表] 加载服务器列表时出错:', error);

        // 显示错误状态
        const errorState = document.createElement('div');
        errorState.className = 'error-state';
        errorState.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: var(--danger); margin-bottom: 1rem;"></i>
                <h3>加载失败</h3>
                <p>无法加载服务器列表，请检查您的网络连接</p>
                <button class="btn btn-primary retry-btn" id="retryLoadServers">
                    <i class="fas fa-redo"></i> 重试
                </button>
            </div>
        `;
        DOM_ELEMENTS.serverList.appendChild(errorState);

        // 添加重试按钮事件监听器
        const retryBtn = errorState.querySelector('.retry-btn');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => {
                log('服务器列表', '用户点击了重试按钮', '错误处理');
                loadServers();
            });
        }
    } finally {
        // 移除加载占位符
        const loadingElement = DOM_ELEMENTS.serverList.querySelector('.loading-placeholder');
        if (loadingElement) {
            loadingElement.remove();
        }

        // 移除所有占位符卡片
        const placeholderCards = DOM_ELEMENTS.serverList.querySelectorAll('.placeholder-card');
        placeholderCards.forEach(card => {
            card.remove();
        });

        // 触发服务器列表加载完成事件
        log('服务器列表', '服务器列表加载完成，触发事件', '初始化');
        console.log('[服务器列表] 服务器列表加载完成，触发事件');
        const event = new Event('serversLoaded');
        document.dispatchEvent(event);
    }
}

/**
 * 初始化应用
 * 设置事件监听器、加载默认数据和应用用户偏好
 */
async function initializeApp() {
    log('应用初始化', '开始初始化应用', '初始化');

    try {
        // 首先加载主题配置
        log('应用初始化', '加载主题配置', '初始化');
        const savedTheme = localStorage.getItem('preferredTheme') || UI_CONFIG.theme;
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

        // 检查保存的视图偏好
        const savedView = localStorage.getItem('view') || UI_CONFIG.defaultView;
        log('应用初始化', `检查保存的视图偏好: ${savedView}`, '初始化');
        // 初始化视图模式
        toggleView(savedView === 'list' ? 'list' : 'card');

        // 搜索事件监听器
        if (DOM_ELEMENTS.searchInput) {
            log('应用初始化', '添加搜索事件监听器', '初始化');
            // 移除输入时自动搜索的行为，改为点击按钮或按Enter时搜索

            // 清除搜索按钮
            if (DOM_ELEMENTS.clearSearch) {
                DOM_ELEMENTS.clearSearch.addEventListener('click', (e) => {
                    e.preventDefault(); // 阻止默认行为
                    log('搜索', '用户点击了清除搜索按钮', '搜索');
                    DOM_ELEMENTS.searchInput.value = '';
                    // 传递空字符串作为搜索词
                    filterServers('');
                    DOM_ELEMENTS.searchInput.blur(); // 取消搜索框的聚焦状态
                });
            }

            // 执行搜索按钮
            if (DOM_ELEMENTS.performSearch) {
                DOM_ELEMENTS.performSearch.addEventListener('click', () => {
                    log('搜索', '用户点击了执行搜索按钮', '搜索');
                    // 传递搜索输入框的值作为搜索词
                    filterServers(DOM_ELEMENTS.searchInput.value);
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
                const savedPerRow = localStorage.getItem('perRow') || UI_CONFIG.itemsPerRow;
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
                    // 传递搜索输入框的值作为搜索词
                    filterServers(DOM_ELEMENTS.searchInput.value);
                }
            });
        }

        // 主题切换
        if (DOM_ELEMENTS.themeToggle) {
            log('应用初始化', '添加主题切换事件监听器', '初始化');
            DOM_ELEMENTS.themeToggle.addEventListener('click', toggleTheme);
        }

        // 视图切换按钮
        if (DOM_ELEMENTS.gridViewBtn && DOM_ELEMENTS.listViewBtn) {
            log('应用初始化', '添加视图切换按钮事件监听器', '初始化');

            // 移除可能已存在的事件监听器
            // 使用cloneNode方法来移除所有事件监听器
            const gridViewBtnClone = DOM_ELEMENTS.gridViewBtn.cloneNode(true);
            const listViewBtnClone = DOM_ELEMENTS.listViewBtn.cloneNode(true);
            DOM_ELEMENTS.gridViewBtn.parentNode.replaceChild(gridViewBtnClone, DOM_ELEMENTS.gridViewBtn);
            DOM_ELEMENTS.listViewBtn.parentNode.replaceChild(listViewBtnClone, DOM_ELEMENTS.listViewBtn);
            // 更新DOM元素引用
            DOM_ELEMENTS.gridViewBtn = gridViewBtnClone;
            DOM_ELEMENTS.listViewBtn = listViewBtnClone;

            // 添加新的事件监听器
            DOM_ELEMENTS.gridViewBtn.addEventListener('click', () => {
                console.log('[应用初始化] 卡片视图按钮被点击');

                toggleView('card');
            });

            DOM_ELEMENTS.listViewBtn.addEventListener('click', () => {
                console.log('[应用初始化] 列表视图按钮被点击');

                toggleView('list');
            });
        }
    } catch (error) {
        log('应用初始化', `初始化应用时出错: ${error.message}`, '错误处理');
        console.error('[应用初始化] 初始化应用时出错:', error);
    }
}

// 监听服务器列表加载完成事件
document.addEventListener('serversLoaded', () => {
    log('应用启动', '服务器列表加载完成，开始更新服务器信息', '启动');
    console.log('[服务器信息] 服务器列表加载完成，开始更新服务器信息');

    // 初始化统计数据
    log('应用启动', '初始化统计数据', '启动');
    initStats();

    // 应用当前视图设置
    const savedView = localStorage.getItem('view');
    log('应用启动', `应用当前视图设置: ${savedView || 'card'}`, '启动');
    // 应用视图模式
    toggleView(savedView === 'list' ? 'list' : 'card');

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

        // 初始化统计数据动画
        log('应用启动', '初始化统计数据动画', '启动');
        initStatsAnimation();

        // 初始化主页历史人数图表功能
        log('应用启动', '初始化主页历史人数图表功能', '启动');
        initOverallPlayerHistoryChart();

        // 注意：统计数据将在serversLoaded事件中更新，以确保服务器列表已加载完成

        // 添加手机端菜单按钮功能
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

                log('导航菜单', `手机端菜单${!isCurrentlyActive ? '打开' : '关闭'}`, '交互');
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
    })();
});

const BDSGP_VERSION = '2.1.0';
// 启动日志
log('应用启动', 'BDSGP 服务器列表已加载', '启动');
log('应用启动', `${BDSGP_VERSION}`, '启动');
console.log(`%cBDSGP 服务器列表已加载！\n版本 ${BDSGP_VERSION}`, 'color: green; font-size: 30px; font-weight: bold;');
console.log('%c作者：梦涵LOVE\n (https://heyuhan.huohuo.ink)', 'color: teal; font-size: 20px;');
console.log('%c感谢使用 BDSGP 服务器列表！', 'color: blue; font-size: 28px;');
console.log('%c如果您喜欢这个项目，请考虑在 GitHub 上给我们一个⭐！', 'color: orange; font-size: 24px;');
console.log('%c项目地址: https://github.com/BDSGP/BDSGP', 'color: purple; font-size: 24px; text-decoration: underline;');
