// =============================================================================
// UI交互功能 - 处理用户界面交互
// =============================================================================

import { log } from './utils.js';

/**
 * 切换视图模式（卡片视图/列表视图）
 * @param {string} viewMode - 视图模式 ('grid' 或 'list')
 */
export function toggleView(viewMode) {
    console.log(`[UI交互] 开始切换视图模式: ${viewMode}`);
    
    try {
        const serverList = document.getElementById('serverList');
        const gridViewBtn = document.getElementById('cardViewBtn');
        const listViewBtn = document.getElementById('listViewBtn');

        console.log('[UI交互] 查找DOM元素', {
            serverList: !!serverList,
            gridViewBtn: !!gridViewBtn,
            listViewBtn: !!listViewBtn
        });

        if (!serverList || !gridViewBtn || !listViewBtn) {
            console.error('[UI交互] 无法获取视图切换所需的DOM元素');
            return;
        }

        // 移除所有视图类
        console.log('[UI交互] 移除所有视图类');
        serverList.classList.remove('grid-view', 'list-view');

        // 添加新的视图类
        // 处理card和grid参数的兼容性
        const actualViewMode = viewMode === 'card' ? 'grid' : viewMode;
        console.log(`[UI交互] 添加视图类: ${actualViewMode}-view`);
        serverList.classList.add(`${actualViewMode}-view`);

        // 更新按钮状态
        console.log(`[UI交互] 更新按钮状态，当前视图模式: ${actualViewMode}`);
        if (actualViewMode === 'grid') {
            gridViewBtn.classList.add('active');
            listViewBtn.classList.remove('active');
            console.log('[UI交互] 已激活卡片视图按钮');
        } else {
            gridViewBtn.classList.remove('active');
            listViewBtn.classList.add('active');
            console.log('[UI交互] 已激活列表视图按钮');
        }

        // 保存用户偏好到本地存储
        // 保持与app.js中使用的键名一致
        localStorage.setItem('view', actualViewMode);
        console.log(`[UI交互] 已保存用户偏好: ${actualViewMode}`);

        console.log(`[UI交互] 视图模式已切换为: ${viewMode}`);
    } catch (error) {
        console.error('[UI交互] 切换视图时出错:', error);
    }
}

/**
 * 切换主题（亮色/暗色）
 */
export function toggleTheme() {
    log('UI交互', '切换主题', '主题切换');

    const body = document.body;
    const themeToggle = document.getElementById('themeToggle');

    if (!body || !themeToggle) {
        log('UI交互', '无法获取主题切换所需的DOM元素', '错误');
        return;
    }

    // 切换主题类
    body.classList.toggle('dark-mode');

    // 更新主题切换按钮状态
    const isDarkMode = body.classList.contains('dark-mode');
    themeToggle.classList.toggle('active', isDarkMode);

    // 保存用户偏好到本地存储
    localStorage.setItem('preferredTheme', isDarkMode ? 'dark' : 'light');

    log('UI交互', `主题已切换为: ${isDarkMode ? '暗色' : '亮色'}`, '主题切换完成');
}

/**
 * 过滤服务器列表
 * @param {string} searchTerm - 搜索关键词
 */
export function filterServers(searchTerm) {
    // 检查是否是事件对象，如果是则获取输入框的值
    if (searchTerm && typeof searchTerm === 'object' && searchTerm.target) {
        searchTerm = searchTerm.target.value;
    }
    
    log('UI交互', `过滤服务器列表: ${searchTerm}`, '服务器过滤');

    const serverCards = document.querySelectorAll('.server-card');

    if (!serverCards || serverCards.length === 0) {
        log('UI交互', '未找到服务器卡片', '警告');
        return;
    }

    // 转换为小写以进行不区分大小写的搜索
    const term = searchTerm ? searchTerm.toLowerCase() : '';

    let visibleCount = 0;
    
    serverCards.forEach(card => {
        // 获取服务器名称和IP
        const serverName = card.querySelector('.server-name').textContent.toLowerCase();
        const serverIP = card.querySelector('.server-ip').textContent.toLowerCase();

        // 检查是否匹配搜索词
        const matchesSearch = serverName.includes(term) || serverIP.includes(term);

        // 显示或隐藏卡片
        card.style.display = matchesSearch ? '' : 'none';
        
        if (matchesSearch) visibleCount++;
    });
    
    // 获取服务器列表容器
    const serverList = document.getElementById('serverList');
    
    // 查找或创建"无结果"提示元素
    let noResultsElement = serverList.querySelector('.empty-search-state');
    
    if (visibleCount === 0) {
        // 如果没有可见的服务器，显示"无结果"提示
        if (!noResultsElement) {
            noResultsElement = document.createElement('div');
            noResultsElement.className = 'empty-search-state';
            noResultsElement.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <h3>查无此人</h3>
                    <p>请尝试其他搜索词</p>
                </div>
            `;
            serverList.appendChild(noResultsElement);
        }
    } else if (noResultsElement) {
        // 如果有可见的服务器，移除"无结果"提示
        noResultsElement.remove();
    }

    log('UI交互', `服务器过滤完成，显示 ${visibleCount} 个服务器`, '过滤完成');
}

/**
 * 初始化UI交互功能
 */
export function initializeUI() {
    log('UI交互', '初始化UI交互功能', '初始化');

    // 确保DOM完全加载后再初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeAllUIComponents);
    } else {
        initializeAllUIComponents();
    }
}

// 简化的视图切换函数，直接操作DOM
function switchView(viewMode) {
    console.log(`[UI交互] 切换到${viewMode}视图`);
    
    const serverList = document.getElementById('serverList');
    const gridViewBtn = document.getElementById('cardViewBtn');
    const listViewBtn = document.getElementById('listViewBtn');
    
    if (!serverList || !gridViewBtn || !listViewBtn) {
        console.error('[UI交互] 无法获取视图切换所需的DOM元素');
        return;
    }
    
    // 移除所有视图类
    serverList.classList.remove('grid-view', 'list-view');
    
    // 添加新的视图类
    serverList.classList.add(`${viewMode}-view`);
    
    // 更新按钮状态
    if (viewMode === 'grid') {
        gridViewBtn.classList.add('active');
        listViewBtn.classList.remove('active');
    } else {
        gridViewBtn.classList.remove('active');
        listViewBtn.classList.add('active');
    }
    
    // 保存用户偏好
    localStorage.setItem('view', viewMode);
    
    console.log(`[UI交互] 已切换到${viewMode}视图`);
}

function initializeUIComponents() {
    console.log('[UI交互] 开始初始化UI组件');
    
    // 视图切换按钮的事件绑定已在app.js中实现
    
    // 初始化主题切换功能
    initializeThemeToggle();
}

// 事件处理函数已移至app.js中直接实现

// 主题切换按钮初始化
function initializeThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');

    if (themeToggle) {
        // 移除可能已存在的事件监听器
        themeToggle.removeEventListener('click', toggleTheme);
        
        // 添加新的事件监听器
        themeToggle.addEventListener('click', toggleTheme);
        
        console.log('[UI交互] 已为主题切换按钮绑定点击事件');
        
        // 恢复用户偏好的主题
        const preferredTheme = localStorage.getItem('preferredTheme');
        if (preferredTheme === 'dark') {
            document.body.classList.add('dark-mode');
            themeToggle.classList.add('active');
            console.log('[UI交互] 恢复用户偏好的主题: dark');
        }
    } else {
        console.error('[UI交互] 未找到主题切换按钮');
    }
}

// 搜索功能初始化
function initializeSearchFunctionality() {
    const searchInput = document.getElementById('searchInput');
    const clearSearchBtn = document.getElementById('clearSearch');
    const performSearchBtn = document.getElementById('performSearch');

    if (searchInput) {
        // 实时搜索
        searchInput.addEventListener('input', (e) => {
            filterServers(e.target.value);
        });

        // 清除搜索
        if (clearSearchBtn) {
            clearSearchBtn.addEventListener('click', () => {
                searchInput.value = '';
                filterServers('');
            });
        }

        // 执行搜索
        if (performSearchBtn) {
            performSearchBtn.addEventListener('click', () => {
                filterServers(searchInput.value);
            });
        }
    }
    
    // 每行显示数量选择器
    const perRowSelect = document.getElementById('perRowSelect');

    if (perRowSelect) {
        perRowSelect.addEventListener('change', (e) => {
            const perRow = parseInt(e.target.value);
            const serverList = document.getElementById('serverList');

            if (serverList) {
                serverList.style.setProperty('--per-row', perRow);
                localStorage.setItem('serversPerRow', perRow);

                log('UI交互', `每行显示服务器数量设置为: ${perRow}`, '设置更新');
            }
        });

        // 恢复用户偏好的每行显示数量
        const savedPerRow = localStorage.getItem('serversPerRow');
        if (savedPerRow) {
            perRowSelect.value = savedPerRow;
            serverList.style.setProperty('--per-row', savedPerRow);
        }
    }
}

// 在initializeUIComponents函数中调用搜索功能初始化
function initializeAllUIComponents() {
    initializeUIComponents();
    initializeSearchFunctionality();
    
    log('UI交互', 'UI交互功能初始化完成', '初始化完成');
}


