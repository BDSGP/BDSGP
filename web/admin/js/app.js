import { log } from '../../js/utils.js';

// 全局变量
let currentUser = null;
let isAdmin = false;
let apiBaseUrl = 'https://api.bdsgp.cn'; // API基础URL，根据实际情况修改

// DOM加载完成后执行
document.addEventListener('DOMContentLoaded', function () {
    const BDSGP_VERSION = '2.3.2';
    // 启动日志
    log('应用启动', 'BDSGP 服务器列表已加载', '启动');
    log('应用启动', `${BDSGP_VERSION}`, '启动');
    console.log(`%cBDSGP 服务器列表已加载！\n版本 ${BDSGP_VERSION}`, 'color: green; font-size: 30px; font-weight: bold;');
    console.log('%c作者：梦涵LOVE\n (https://heyuhan.huohuo.ink)', 'color: teal; font-size: 20px;');
    console.log('%c感谢使用 BDSGP 服务器列表！', 'color: blue; font-size: 28px;');
    console.log('%c如果您喜欢这个项目，请考虑在 GitHub 上给我们一个⭐！', 'color: orange; font-size: 24px;');
    console.log('%c项目地址: https://github.com/BDSGP/BDSGP', 'color: purple; font-size: 24px; text-decoration: underline;');

    // 初始化事件监听
    initEventListeners();

    // 检查本地存储中的登录状态
    checkLoginStatus();
});

// 初始化事件监听
function initEventListeners() {
    // 登录表单提交
    document.getElementById('loginForm').addEventListener('submit', handleLogin);

    // 注册表单提交
    document.getElementById('registerForm').addEventListener('submit', handleRegister);

    // 显示/隐藏登录/注册表单
    document.getElementById('showRegisterForm').addEventListener('click', showRegisterForm);
    document.getElementById('showLoginForm').addEventListener('click', showLoginForm);

    // 退出登录
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);

    // 修改密码
    document.getElementById('changePasswordBtn').addEventListener('click', showChangePasswordModal);

    // 导航链接点击
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const page = this.getAttribute('data-page');
            if (page) {
                showPage(page);
            }
        });
    });

    // 添加服务器按钮
    document.getElementById('addServerBtn').addEventListener('click', showServerModal);

    // 添加Token按钮（管理员功能）
    const addTokenBtn = document.getElementById('addTokenBtn');
    if (addTokenBtn) {
        addTokenBtn.addEventListener('click', showAddTokenModal);
    }
}

// 检查登录状态
function checkLoginStatus() {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    const adminKey = localStorage.getItem('adminKey');

    if (token && username) {
        currentUser = {
            token: token,
            username: username
        };

        // 检查是否是管理员
        if (adminKey) {
            isAdmin = true;
            document.getElementById('userRole').textContent = '管理员';
            document.getElementById('userRole').className = 'badge bg-danger ms-2';
            document.querySelectorAll('.admin-only').forEach(el => {
                el.style.display = '';
            });
            // 更新页面标题显示管理员模式
            document.querySelectorAll('.page-title').forEach(el => {
                if (el.textContent.includes('服务器管理')) {
                    el.textContent = '服务器管理 (管理员模式)';
                }
            });
        }

        // 更新用户信息显示
        document.getElementById('usernameDisplay').textContent = username;

        // 显示数据面板
        showPage('dashboard');
    } else {
        // 显示登录页面
        showLoginPage();
    }
}

// 处理登录
async function handleLogin(e) {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const adminKey = document.getElementById('adminKey').value;

    try {
        const response = await fetch(`${apiBaseUrl}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`
        });

        const data = await response.json();

        if (data.status === 'success') {
            // 保存登录信息
            localStorage.setItem('token', data.token);
            localStorage.setItem('username', data.username);

            if (adminKey) {
                // 验证管理员密钥
                try {
                    const adminResponse = await fetch(`${apiBaseUrl}/admin/list_users`, {
                        method: 'GET',
                        headers: {
                            'Admin-Key': adminKey
                        }
                    });

                    if (adminResponse.ok) {
                        localStorage.setItem('adminKey', adminKey);
                        isAdmin = true;
                        document.getElementById('userRole').textContent = '管理员';
                        document.getElementById('userRole').className = 'badge bg-danger ms-2';
                        document.querySelectorAll('.admin-only').forEach(el => {
                            el.style.display = 'block';
                        });
                    }
                } catch (error) {
                    console.error('管理员密钥验证失败:', error);
                }
            }

            // 更新当前用户信息
            currentUser = {
                token: data.token,
                username: data.username
            };

            // 更新用户信息显示
            document.getElementById('usernameDisplay').textContent = data.username;

            // 显示数据面板
            showPage('dashboard');

            // 显示成功消息
            showAlert('登录成功', 'success');
        } else {
            showAlert(data.message || '登录失败', 'danger');
        }
    } catch (error) {
        console.error('登录请求失败:', error);
        showAlert('登录请求失败，请检查网络连接', 'danger');
    }
}

// 处理注册
async function handleRegister(e) {
    e.preventDefault();

    const username = document.getElementById('regUsername').value;
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // 验证密码
    if (password !== confirmPassword) {
        showAlert('两次输入的密码不一致', 'danger');
        return;
    }

    try {
        const response = await fetch(`${apiBaseUrl}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`
        });

        const data = await response.json();

        if (data.status === 'success') {
            showAlert('注册成功，请登录', 'success');
            showLoginForm();

            // 清空注册表单
            document.getElementById('registerForm').reset();
        } else {
            showAlert(data.message || '注册失败', 'danger');
        }
    } catch (error) {
        console.error('注册请求失败:', error);
        showAlert('注册请求失败，请检查网络连接', 'danger');
    }
}

// 处理退出登录
function handleLogout() {
    // 清除本地存储
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('adminKey');

    // 重置全局变量
    currentUser = null;
    isAdmin = false;

    // 重置用户角色显示
    document.getElementById('userRole').textContent = '普通用户';
    document.getElementById('userRole').className = 'badge bg-info ms-2';
    document.querySelectorAll('.admin-only').forEach(el => {
        el.style.display = 'none';
    });

    // 显示登录页面
    showLoginPage();

    // 显示退出消息
    showAlert('已成功退出登录', 'info');
}

// 显示登录页面
function showLoginPage() {
    document.getElementById('loginPage').style.display = 'flex';
    document.getElementById('registerPage').style.display = 'none';
    document.getElementById('dashboardPage').style.display = 'none';
    document.getElementById('serversPage').style.display = 'none';
    document.getElementById('usersPage').style.display = 'none';

    // 更新导航栏
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
}

// 显示注册表单
function showRegisterForm(e) {
    e.preventDefault();
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('registerPage').style.display = 'flex';
}

// 显示登录表单
function showLoginForm(e) {
    e.preventDefault();
    document.getElementById('loginPage').style.display = 'flex';
    document.getElementById('registerPage').style.display = 'none';
}

// 显示指定页面
function showPage(pageName) {
    // 隐藏所有页面
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('registerPage').style.display = 'none';
    document.getElementById('dashboardPage').style.display = 'none';
    document.getElementById('serversPage').style.display = 'none';
    document.getElementById('usersPage').style.display = 'none';

    // 更新导航栏激活状态
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-page') === pageName) {
            link.classList.add('active');
        }
    });

    // 显示指定页面
    switch (pageName) {
        case 'dashboard':
            document.getElementById('dashboardPage').style.display = 'block';
            loadDashboardData();
            break;
        case 'servers':
            document.getElementById('serversPage').style.display = 'block';
            loadMyServers();
            break;
        case 'users':
            if (isAdmin) {
                document.getElementById('usersPage').style.display = 'block';
                loadUsersData();
            } else {
                showAlert('您没有权限访问此页面', 'danger');
                showPage('dashboard');
            }
            break;
    }
}

// 加载数据面板数据
async function loadDashboardData() {
    if (!currentUser) {
        showAlert('请先登录', 'danger');
        showLoginPage();
        return;
    }

    try {
        let servers = [];

        // 如果是管理员，获取所有服务器数据
        if (isAdmin) {
            const response = await fetch(`${apiBaseUrl}/admin/all_servers`, {
                method: 'GET',
                headers: {
                    'Admin-Key': localStorage.getItem('adminKey')
                }
            });

            const data = await response.json();

            if (data.status === 'success') {
                servers = data.data || [];
            } else {
                showAlert(data.message || '获取服务器数据失败', 'danger');
                return;
            }
        } else {
            // 普通用户只获取自己的服务器
            const response = await fetch(`${apiBaseUrl}/my_servers`, {
                method: 'GET',
                headers: {
                    'token': currentUser.token
                }
            });

            const data = await response.json();

            if (data.status === 'success') {
                servers = data.data || [];
            } else {
                showAlert(data.message || '获取服务器数据失败', 'danger');
                return;
            }
        }

        // 计算统计数据
        const totalServers = servers.length;
        const onlineServers = servers.filter(server => server.online === 1 || server.online === true || server.is_online === 1 || server.is_online === true).length;
        const offlineServers = totalServers - onlineServers;
        const totalPlayers = servers.reduce((sum, server) => sum + (server.player_count || 0), 0);

        // 更新统计卡片
        document.getElementById('totalServers').textContent = totalServers;
        document.getElementById('onlineServers').textContent = onlineServers;
        document.getElementById('offlineServers').textContent = offlineServers;
        document.getElementById('totalPlayers').textContent = totalPlayers;

        // 更新服务器表格
        const tableBody = document.getElementById('serversTableBody');
        tableBody.innerHTML = '';

        servers.forEach(server => {
            const row = document.createElement('tr');

            // 服务器图标
            const iconCell = document.createElement('td');
            if (server.icon_url) {
                const iconImg = document.createElement('img');
                iconImg.src = server.icon_url;
                iconImg.className = 'server-icon';
                iconImg.alt = '服务器图标';
                iconCell.appendChild(iconImg);
            } else {
                iconCell.textContent = '-';
            }

            // 服务器名称
            const nameCell = document.createElement('td');
            nameCell.textContent = server.name;

            // 服务器地址
            const hostCell = document.createElement('td');
            hostCell.textContent = server.host;

            // 服务器端口
            const portCell = document.createElement('td');
            portCell.textContent = server.port;

            // 服务器状态
            const statusCell = document.createElement('td');
            const statusBadge = document.createElement('span');
            const isOnline = server.online === 1 || server.online === true || server.is_online === 1 || server.is_online === true;
            statusBadge.className = `status-badge ${isOnline ? 'status-online' : 'status-offline'}`;
            statusBadge.textContent = isOnline ? '在线' : '离线';
            statusCell.appendChild(statusBadge);

            // 玩家数量
            const playersCell = document.createElement('td');
            playersCell.textContent = server.player_count || 0;

            // 最后查询时间
            const timeCell = document.createElement('td');
            timeCell.textContent = server.last_status_time || server.last_query_time || '-';

            // 如果是管理员，显示服务器所属用户
            if (isAdmin && server.username) {
                const userCell = document.createElement('td');
                userCell.textContent = server.username;
                row.appendChild(userCell);
            }

            // 添加所有单元格到行
            row.appendChild(iconCell);
            row.appendChild(nameCell);
            row.appendChild(hostCell);
            row.appendChild(portCell);
            row.appendChild(statusCell);
            row.appendChild(playersCell);
            row.appendChild(timeCell);

            // 添加行到表格
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('加载数据面板失败:', error);
        showAlert('加载数据面板失败，请检查网络连接', 'danger');
    }
}

// 加载我的服务器
async function loadMyServers() {
    if (!currentUser) {
        showAlert('请先登录', 'danger');
        showLoginPage();
        return;
    }

    // 显示加载提示
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'position-fixed top-0 start-50 translate-middle-x p-3';
    loadingIndicator.style.zIndex = '9999';
    loadingIndicator.innerHTML = `
        <div class="alert alert-info d-flex align-items-center" role="alert">
            <div class="spinner-border spinner-border-sm text-primary me-2" role="status">
                <span class="visually-hidden">加载中...</span>
            </div>
            <div>
                <strong>加载中</strong><br>
                <small>正在加载服务器数据，请稍候...</small>
            </div>
        </div>
    `;
    document.body.appendChild(loadingIndicator);

    // 在表格区域也添加一个加载覆盖层
    let tableOverlay = null;
    const serversTable = document.querySelector('#myServersTable');
    if (serversTable) {
        const tableContainer = serversTable.parentElement;
        tableOverlay = document.createElement('div');
        tableOverlay.className = 'position-absolute top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center bg-white bg-opacity-75';
        tableOverlay.style.zIndex = '10';
        tableOverlay.innerHTML = `
            <div class="text-center">
                <div class="spinner-border text-primary mb-3" role="status">
                    <span class="visually-hidden">加载中...</span>
                </div>
                <p class="mb-0">正在加载服务器列表...</p>
            </div>
        `;
        tableContainer.style.position = 'relative';
        tableContainer.appendChild(tableOverlay);
    }

    try {
        let servers = [];
        let isAdminMode = false;

        // 如果是管理员，获取所有服务器数据
        if (isAdmin) {
            isAdminMode = true;
            const response = await fetch(`${apiBaseUrl}/admin/all_servers`, {
                method: 'GET',
                headers: {
                    'Admin-Key': localStorage.getItem('adminKey')
                }
            });

            const data = await response.json();

            // 移除加载提示
            loadingIndicator.remove();
            if (tableOverlay) {
                tableOverlay.remove();
            }

            if (data.status === 'success') {
                servers = data.data || [];
            } else {
                showAlert(data.message || '获取服务器数据失败', 'danger');
                return;
            }
        } else {
            // 普通用户只获取自己的服务器
            const response = await fetch(`${apiBaseUrl}/my_servers`, {
                method: 'GET',
                headers: {
                    'token': currentUser.token
                }
            });

            const data = await response.json();

            // 移除加载提示
            loadingIndicator.remove();
            if (tableOverlay) {
                tableOverlay.remove();
            }

            if (data.status === 'success') {
                servers = data.data || [];
            } else {
                showAlert(data.message || '获取服务器数据失败', 'danger');
                return;
            }
        }

        // 更新服务器表格
        const tableBody = document.getElementById('myServersTableBody');
        tableBody.innerHTML = '';

        if (servers.length === 0) {
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.colSpan = isAdminMode ? 7 : 6;
            cell.className = 'text-center';
            cell.textContent = isAdminMode ? '暂无服务器数据' : '您还没有添加任何服务器';
            row.appendChild(cell);
            tableBody.appendChild(row);
        } else {
            servers.forEach(server => {
                const row = document.createElement('tr');

                // 服务器图标
                const iconCell = document.createElement('td');
                if (server.icon_url) {
                    const iconImg = document.createElement('img');
                    iconImg.src = server.icon_url;
                    iconImg.className = 'server-icon';
                    iconImg.alt = '服务器图标';
                    iconCell.appendChild(iconImg);
                } else {
                    iconCell.textContent = '-';
                }

                // 服务器名称
                const nameCell = document.createElement('td');
                nameCell.textContent = server.name;

                // 服务器地址
                const hostCell = document.createElement('td');
                hostCell.textContent = server.host;

                // 服务器端口
                const portCell = document.createElement('td');
                portCell.textContent = server.port;

                // 服务器状态
                const statusCell = document.createElement('td');
                const statusBadge = document.createElement('span');
                // API返回的是online或is_online字段
                const isOnline = server.online === 1 || server.online === true || server.is_online === 1 || server.is_online === true;
                statusBadge.className = `status-badge ${isOnline ? 'status-online' : 'status-offline'}`;
                statusBadge.textContent = isOnline ? '在线' : '离线';
                statusCell.appendChild(statusBadge);

                // 操作按钮
                const actionCell = document.createElement('td');
                actionCell.className = 'action-buttons';

                const editBtn = document.createElement('button');
                editBtn.className = 'btn btn-sm btn-primary';
                editBtn.innerHTML = '<i class="fas fa-edit"></i>';
                editBtn.title = '编辑';
                if (isAdminMode) {
                    editBtn.addEventListener('click', () => showAdminEditServerModal(server));
                } else {
                    editBtn.addEventListener('click', () => showEditServerModal(server));
                }

                if (isAdminMode) {
                    const deleteBtn = document.createElement('button');
                    deleteBtn.className = 'btn btn-sm btn-danger';
                    deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
                    deleteBtn.title = '删除';
                    deleteBtn.addEventListener('click', () => confirmDeleteServer(server));
                    actionCell.appendChild(deleteBtn);
                }

                // 添加文章按钮（所有用户都有权限）
                const articleBtn = document.createElement('button');
                articleBtn.className = 'btn btn-sm btn-info me-1';
                articleBtn.innerHTML = '<i class="fas fa-file-alt"></i>';
                articleBtn.title = '文章';
                articleBtn.addEventListener('click', () => viewServerArticle(server.uuid, server.name));
                actionCell.appendChild(articleBtn);

                actionCell.appendChild(editBtn);

                // 添加所有单元格到行
                row.appendChild(iconCell);
                row.appendChild(nameCell);
                row.appendChild(hostCell);
                row.appendChild(portCell);
                row.appendChild(statusCell);

                // 如果是管理员，显示服务器所属用户
                if (isAdminMode && server.username) {
                    const userCell = document.createElement('td');
                    userCell.textContent = server.username;
                    row.appendChild(userCell);
                }

                row.appendChild(actionCell);

                // 添加行到表格
                tableBody.appendChild(row);
            });
        }
    } catch (error) {
        // 移除加载提示
        loadingIndicator.remove();
        if (tableOverlay) {
            tableOverlay.remove();
        }

        console.error('加载我的服务器失败:', error);
        showAlert('加载服务器数据失败，请检查网络连接', 'danger');
    }
}

// 加载用户数据（管理员功能）
async function loadUsersData() {
    if (!isAdmin || !currentUser) {
        showAlert('您没有权限执行此操作', 'danger');
        return;
    }

    try {
        const response = await fetch(`${apiBaseUrl}/admin/list_users`, {
            method: 'GET',
            headers: {
                'Admin-Key': localStorage.getItem('adminKey')
            }
        });

        const data = await response.json();

        if (data.status === 'success') {
            const users = data.users;

            // 更新用户表格
            const tableBody = document.getElementById('usersTableBody');
            if (tableBody) {
                tableBody.innerHTML = '';

                users.forEach(user => {
                    const row = document.createElement('tr');

                    // 用户ID
                    const idCell = document.createElement('td');
                    idCell.textContent = user.id;

                    // 用户名
                    const usernameCell = document.createElement('td');
                    usernameCell.textContent = user.username;

                    // Token
                    const tokenCell = document.createElement('td');
                    tokenCell.textContent = user.token;
                    tokenCell.className = 'text-truncate';
                    tokenCell.style.maxWidth = '200px';

                    // 创建时间
                    const createdCell = document.createElement('td');
                    createdCell.textContent = user.created_at;

                    // 最后登录
                    const loginCell = document.createElement('td');
                    loginCell.textContent = user.last_login || '从未登录';

                    // 服务器数量
                    const serversCell = document.createElement('td');
                    serversCell.textContent = '加载中...';

                    // 异步获取用户服务器数量
                    (async function () {
                        try {
                            const serversResponse = await fetch(`${apiBaseUrl}/admin/get_user_servers?token=${user.token}`, {
                                method: 'GET',
                                headers: {
                                    'Admin-Key': localStorage.getItem('adminKey')
                                }
                            });

                            const serversData = await serversResponse.json();

                            if (serversData.status === 'success') {
                                const servers = serversData.servers || [];
                                serversCell.textContent = servers.length;
                            } else {
                                serversCell.textContent = '获取失败';
                            }
                        } catch (error) {
                            console.error('获取用户服务器数量失败:', error);
                            serversCell.textContent = '获取失败';
                        }
                    })();

                    // 操作按钮
                    const actionCell = document.createElement('td');
                    actionCell.className = 'action-buttons';

                    const viewServersBtn = document.createElement('button');
                    viewServersBtn.className = 'btn btn-sm btn-info';
                    viewServersBtn.innerHTML = '<i class="fas fa-server"></i>';
                    viewServersBtn.title = '查看服务器';
                    viewServersBtn.addEventListener('click', () => showUserServers(user.token, user.username));

                    const changePasswordBtn = document.createElement('button');
                    changePasswordBtn.className = 'btn btn-sm btn-warning';
                    changePasswordBtn.innerHTML = '<i class="fas fa-key"></i>';
                    changePasswordBtn.title = '修改密码';
                    changePasswordBtn.addEventListener('click', () => showAdminChangePasswordModal(user.username));

                    const deleteUserBtn = document.createElement('button');
                    deleteUserBtn.className = 'btn btn-sm btn-danger';
                    deleteUserBtn.innerHTML = '<i class="fas fa-trash"></i>';
                    deleteUserBtn.title = '删除用户';
                    deleteUserBtn.addEventListener('click', () => confirmDeleteUser(user.id, user.username));

                    actionCell.appendChild(viewServersBtn);
                    actionCell.appendChild(changePasswordBtn);
                    actionCell.appendChild(deleteUserBtn);

                    // 添加所有单元格到行
                    row.appendChild(idCell);
                    row.appendChild(usernameCell);
                    row.appendChild(tokenCell);
                    row.appendChild(createdCell);
                    row.appendChild(loginCell);
                    row.appendChild(serversCell);
                    row.appendChild(actionCell);

                    // 添加行到表格
                    tableBody.appendChild(row);
                });
            }
        } else {
            showAlert(data.message || '获取用户数据失败', 'danger');
        }
    } catch (error) {
        console.error('加载用户数据失败:', error);
        showAlert('加载用户数据失败，请检查网络连接', 'danger');
    }
}

// 显示添加服务器模态框
function showServerModal() {
    // 创建模态框HTML
    const modalHtml = `
        <div class="modal fade" id="serverModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">添加服务器</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <form id="addServerForm">
                            <div class="mb-3">
                                <label for="serverName" class="form-label">服务器名称</label>
                                <input type="text" class="form-control" id="serverName" required>
                            </div>
                            <div class="mb-3">
                                <label for="serverIntroduce" class="form-label">服务器介绍</label>
                                <textarea class="form-control" id="serverIntroduce" rows="3" required></textarea>
                            </div>
                            <div class="mb-3">
                                <label for="serverHost" class="form-label">服务器地址</label>
                                <input type="text" class="form-control" id="serverHost" required>
                            </div>
                            <div class="mb-3">
                                <label for="serverPort" class="form-label">服务器端口</label>
                                <input type="number" class="form-control" id="serverPort" value="19132" required>
                            </div>
                            <div class="mb-3">
                                <label for="serverIconUrl" class="form-label">服务器图标URL (可选)</label>
                                <input type="text" class="form-control" id="serverIconUrl">
                                <div class="form-text">或者上传图片作为图标</div>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">上传图标</label>
                                <div class="image-preview" id="iconPreview">
                                    <span>点击或拖拽图片到此处上传</span>
                                </div>
                                <input type="file" class="form-control d-none" id="serverIconFile" accept="image/*">
                                <button type="button" class="btn btn-sm btn-outline-secondary" id="selectIconBtn">选择图片</button>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
                        <button type="button" class="btn btn-primary" id="saveServerBtn">保存</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // 添加模态框到页面
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHtml;
    document.body.appendChild(modalContainer);

    // 初始化模态框
    const modal = new bootstrap.Modal(document.getElementById('serverModal'));
    modal.show();

    // 设置事件监听
    document.getElementById('selectIconBtn').addEventListener('click', function () {
        document.getElementById('serverIconFile').click();
    });

    document.getElementById('serverIconFile').addEventListener('change', function (e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                const preview = document.getElementById('iconPreview');
                preview.innerHTML = `<img src="${e.target.result}" alt="图标预览">`;
            };
            reader.readAsDataURL(file);
        }
    });

    document.getElementById('iconPreview').addEventListener('click', function () {
        document.getElementById('serverIconFile').click();
    });

    document.getElementById('saveServerBtn').addEventListener('click', handleAddServer);

    // 模态框关闭时移除DOM元素
    document.getElementById('serverModal').addEventListener('hidden.bs.modal', function () {
        modalContainer.remove();
    });
}

// 处理添加服务器
async function handleAddServer() {
    if (!currentUser) {
        showAlert('请先登录', 'danger');
        return;
    }

    const name = document.getElementById('serverName').value;
    const introduce = document.getElementById('serverIntroduce').value;
    const host = document.getElementById('serverHost').value;
    const port = document.getElementById('serverPort').value;
    const iconUrl = document.getElementById('serverIconUrl').value;
    const iconFile = document.getElementById('serverIconFile').files[0];
    console.log('获取到的图标文件:', iconFile);

    // 验证必填字段
    if (!name || !introduce || !host || !port) {
        showAlert('请填写所有必填字段', 'warning');
        return;
    }

    // 禁用保存按钮并添加加载动画
    const saveBtn = document.getElementById('saveServerBtn');
    const originalBtnContent = saveBtn.innerHTML;
    saveBtn.disabled = true;
    saveBtn.innerHTML = `
        <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
        保存中...
    `;

    try {
        // 首先添加服务器
        // 手动构建表单数据字符串，确保空格不被转换为+号
        let formData = `name=${encodeURIComponent(name)}&introduce=${encodeURIComponent(introduce).replace(/\+/g, '%20')}&host=${encodeURIComponent(host)}&port=${encodeURIComponent(port)}`;
        if (iconUrl) {
            formData += `&icon_url=${encodeURIComponent(iconUrl)}`;
        }

        const response = await fetch(`${apiBaseUrl}/post`, {
            method: 'POST',
            headers: {
                'token': currentUser.token,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formData
        });

        const data = await response.json();

        if (data.status === 'success') {
            // 如果有图标文件，上传图标
            if (iconFile) {
                console.log('开始上传图标，文件对象:', iconFile);
                const iconFormData = new FormData();
                // 确保文件被正确添加到FormData
                iconFormData.append('file', iconFile, iconFile.name);
                iconFormData.append('uuid', data.uuid);
                // 检查FormData内容
                for (let pair of iconFormData.entries()) {
                    console.log(pair[0] + ': ', pair[1]);
                }

                // 更新按钮状态显示上传进度
                saveBtn.innerHTML = `
                    <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    上传图标中...
                `;

                try {
                    // 使用XMLHttpRequest代替fetch，因为fetch在处理文件上传时可能有问题
                    const response = await new Promise((resolve, reject) => {
                        const xhr = new XMLHttpRequest();
                        xhr.open('POST', `${apiBaseUrl}/upload_icon`, true);
                        // 只设置token，不设置Content-Type，让浏览器自动设置
                        xhr.setRequestHeader('token', currentUser.token);

                        xhr.onload = function () {
                            if (xhr.status === 200) {
                                try {
                                    const response = JSON.parse(xhr.responseText);
                                    resolve(response);
                                } catch (e) {
                                    reject(e);
                                }
                            } else {
                                reject(new Error(`请求失败，状态码: ${xhr.status}`));
                            }
                        };

                        xhr.onerror = function () {
                            reject(new Error('网络错误'));
                        };

                        xhr.send(iconFormData);
                    });

                    if (response.status === 'success') {
                        showAlert('服务器添加成功，图标上传成功', 'success');
                    } else {
                        showAlert('服务器添加成功，但图标上传失败: ' + response.message, 'warning');
                    }
                } catch (error) {
                    console.error('图标上传失败:', error);
                    showAlert('服务器添加成功，但图标上传失败', 'warning');
                }
            } else {
                showAlert('服务器添加成功', 'success');
            }

            // 关闭模态框
            const modal = bootstrap.Modal.getInstance(document.getElementById('serverModal'));
            modal.hide();

            // 刷新服务器列表
            loadMyServers();
        } else {
            showAlert(data.message || '添加服务器失败', 'danger');
        }
    } catch (error) {
        console.error('添加服务器失败:', error);
        showAlert('添加服务器失败，请检查网络连接', 'danger');
    } finally {
        // 恢复按钮状态
        saveBtn.disabled = false;
        saveBtn.innerHTML = originalBtnContent;
    }
}

// 显示编辑服务器模态框
async function showEditServerModal(server) {
    // 显示加载提示
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'position-fixed top-0 start-50 translate-middle-x p-3';
    loadingIndicator.style.zIndex = '9999';
    loadingIndicator.innerHTML = `
        <div class="alert alert-info d-flex align-items-center" role="alert">
            <div class="spinner-border spinner-border-sm text-primary me-2" role="status">
                <span class="visually-hidden">加载中...</span>
            </div>
            <div>
                <strong>加载中</strong><br>
                <small>正在获取服务器详细信息，请稍候...</small>
            </div>
        </div>
    `;
    document.body.appendChild(loadingIndicator);

    try {
        // 先获取完整的服务器信息
        const response = await fetch(`${apiBaseUrl}/get?uuid=${server.uuid}`, {
            method: 'GET',
            headers: {
                'token': currentUser.token
            }
        });

        const data = await response.json();

        // 移除加载提示
        loadingIndicator.remove();

        if (data.status === 'success' && data.data) {
            // 获取完整的服务器数据
            const fullServerData = Array.isArray(data.data) ? data.data[0] : data.data;

            // 使用完整的服务器数据创建模态框
            const modalHtml = `
                <div class="modal fade" id="editServerModal" tabindex="-1" aria-hidden="true">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">编辑服务器</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <form id="editServerForm">
                                    <input type="hidden" id="editServerUuid" value="${fullServerData.uuid}">
                                    <div class="mb-3">
                                        <label for="editServerName" class="form-label">服务器名称</label>
                                        <input type="text" class="form-control" id="editServerName" value="${fullServerData.name}" required>
                                    </div>
                                    <div class="mb-3">
                                        <label for="editServerIntroduce" class="form-label">服务器介绍</label>
                                        <textarea class="form-control" id="editServerIntroduce" rows="3" required>${fullServerData.introduce || ''}</textarea>
                                    </div>
                                    <div class="mb-3">
                                        <label for="editServerHost" class="form-label">服务器地址</label>
                                        <input type="text" class="form-control" id="editServerHost" value="${fullServerData.host}" required>
                                    </div>
                                    <div class="mb-3">
                                        <label for="editServerPort" class="form-label">服务器端口</label>
                                        <input type="number" class="form-control" id="editServerPort" value="${fullServerData.port}" required>
                                    </div>
                                    <div class="mb-3">
                                        <label for="editServerIconUrl" class="form-label">服务器图标URL</label>
                                        <input type="text" class="form-control" id="editServerIconUrl" value="${fullServerData.icon_url || ''}">
                                        <div class="form-text">或者上传新图片作为图标</div>
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label">当前图标</label>
                                        <div class="d-flex align-items-center">
                                            ${fullServerData.icon_url ? `<img src="${fullServerData.icon_url}" class="server-icon me-3" alt="当前图标">` : '<span class="me-3">无图标</span>'}
                                            <button type="button" class="btn btn-sm btn-outline-danger" id="deleteIconBtn">删除图标</button>
                                        </div>
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label">上传新图标</label>
                                        <div class="image-preview" id="editIconPreview">
                                            <span>点击或拖拽图片到此处上传</span>
                                        </div>
                                        <input type="file" class="form-control d-none" id="editIconFile" accept="image/*">
                                        <button type="button" class="btn btn-sm btn-outline-secondary" id="editSelectIconBtn">选择图片</button>
                                    </div>
                                </form>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
                                <button type="button" class="btn btn-primary" id="updateServerBtn">更新</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // 添加模态框到页面
            const modalContainer = document.createElement('div');
            modalContainer.innerHTML = modalHtml;
            document.body.appendChild(modalContainer);

            // 初始化模态框
            const modal = new bootstrap.Modal(document.getElementById('editServerModal'));
            modal.show();

            // 设置事件监听
            document.getElementById('editSelectIconBtn').addEventListener('click', function () {
                document.getElementById('editIconFile').click();
            });

            document.getElementById('editIconFile').addEventListener('change', function (e) {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function (e) {
                        const preview = document.getElementById('editIconPreview');
                        preview.innerHTML = `<img src="${e.target.result}" alt="图标预览">`;
                    };
                    reader.readAsDataURL(file);
                }
            });

            document.getElementById('editIconPreview').addEventListener('click', function () {
                document.getElementById('editIconFile').click();
            });

            document.getElementById('deleteIconBtn').addEventListener('click', function () {
                if (confirm('确定要删除服务器图标吗？')) {
                    document.getElementById('editServerIconUrl').value = '';
                    document.querySelector('#editServerModal .server-icon')?.remove();
                    document.querySelector('#editServerModal span.me-3')?.remove();
                    document.querySelector('#editServerModal .d-flex').prepend(document.createElement('span'));
                    document.querySelector('#editServerModal .d-flex span').className = 'me-3';
                    document.querySelector('#editServerModal .d-flex span').textContent = '无图标';
                }
            });

            document.getElementById('updateServerBtn').addEventListener('click', handleUpdateServer);

            // 模态框关闭时移除DOM元素
            document.getElementById('editServerModal').addEventListener('hidden.bs.modal', function () {
                modalContainer.remove();
            });
        } else {
            showAlert('获取服务器详细信息失败', 'danger');
            console.error('获取服务器详细信息失败:', data);
        }
    } catch (error) {
        showAlert('获取服务器详细信息时出错', 'danger');
        console.error('获取服务器详细信息时出错:', error);
    }
}

// 处理更新服务器
async function handleUpdateServer() {
    if (!currentUser) {
        showAlert('请先登录', 'danger');
        return;
    }

    const uuid = document.getElementById('editServerUuid').value;
    const name = document.getElementById('editServerName').value;
    const introduce = document.getElementById('editServerIntroduce').value;
    const host = document.getElementById('editServerHost').value;
    const port = document.getElementById('editServerPort').value;
    const iconUrl = document.getElementById('editServerIconUrl').value;
    const iconFile = document.getElementById('editIconFile').files[0];
    console.log('编辑服务器获取到的图标文件:', iconFile);

    // 验证必填字段
    if (!name || !introduce || !host || !port) {
        showAlert('请填写所有必填字段', 'warning');
        return;
    }

    // 禁用更新按钮并添加加载动画
    const updateBtn = document.getElementById('updateServerBtn');
    const originalBtnContent = updateBtn.innerHTML;
    updateBtn.disabled = true;
    updateBtn.innerHTML = `
        <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
        更新中...
    `;

    try {
        // 首先更新服务器信息
        // 手动构建表单数据字符串，确保空格不被转换为+号
        let formData = `uuid=${encodeURIComponent(uuid)}&name=${encodeURIComponent(name)}&introduce=${encodeURIComponent(introduce).replace(/\+/g, '%20')}&host=${encodeURIComponent(host)}&port=${encodeURIComponent(port)}`;
        if (iconUrl) {
            formData += `&icon_url=${encodeURIComponent(iconUrl)}`;
        }

        const response = await fetch(`${apiBaseUrl}/update`, {
            method: 'POST',
            headers: {
                'token': currentUser.token,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formData
        });

        const data = await response.json();

        if (data.status === 'success') {
            // 如果有图标文件，上传图标
            if (iconFile) {
                console.log('编辑服务器开始上传图标，文件对象:', iconFile);
                const iconFormData = new FormData();
                // 确保文件被正确添加到FormData
                iconFormData.append('file', iconFile, iconFile.name);
                iconFormData.append('uuid', uuid);
                // 检查FormData内容
                for (let pair of iconFormData.entries()) {
                    console.log(pair[0] + ': ', pair[1]);
                }

                // 更新按钮状态显示上传进度
                updateBtn.innerHTML = `
                    <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    上传图标中...
                `;

                try {
                    // 使用XMLHttpRequest代替fetch，因为fetch在处理文件上传时可能有问题
                    const response = await new Promise((resolve, reject) => {
                        const xhr = new XMLHttpRequest();
                        xhr.open('POST', `${apiBaseUrl}/upload_icon`, true);
                        // 只设置token，不设置Content-Type，让浏览器自动设置
                        xhr.setRequestHeader('token', currentUser.token);

                        xhr.onload = function () {
                            if (xhr.status === 200) {
                                try {
                                    const response = JSON.parse(xhr.responseText);
                                    resolve(response);
                                } catch (e) {
                                    reject(e);
                                }
                            } else {
                                reject(new Error(`请求失败，状态码: ${xhr.status}`));
                            }
                        };

                        xhr.onerror = function () {
                            reject(new Error('网络错误'));
                        };

                        xhr.send(iconFormData);
                    }).then(response => {
                        if (response.status === 'success') {
                            showAlert('服务器更新成功，图标上传成功', 'success');
                        } else {
                            showAlert('服务器更新成功，但图标上传失败: ' + response.message, 'warning');
                        }
                    }).catch(error => {
                        console.error('图标上传失败:', error);
                        showAlert('服务器更新成功，但图标上传失败', 'warning');
                    });
                } catch (error) {
                    console.error('图标上传失败:', error);
                    showAlert('服务器更新成功，但图标上传失败', 'warning');
                }
            } else {
                showAlert('服务器更新成功', 'success');
            }

            // 关闭模态框
            const modal = bootstrap.Modal.getInstance(document.getElementById('editServerModal'));
            modal.hide();

            // 刷新服务器列表
            loadMyServers();
        } else {
            showAlert(data.message || '更新服务器失败', 'danger');
        }
    } catch (error) {
        console.error('更新服务器失败:', error);
        showAlert('更新服务器失败，请检查网络连接', 'danger');
    } finally {
        // 恢复按钮状态
        updateBtn.disabled = false;
        updateBtn.innerHTML = originalBtnContent;
    }
}

// 确认删除服务器
function confirmDeleteServer(server) {
    if (confirm(`确定要删除服务器 "${server.name}" 吗？此操作不可撤销。`)) {
        deleteServer(server.uuid);
    }
}

// 删除服务器
async function deleteServer(uuid) {
    if (!currentUser) {
        showAlert('请先登录', 'danger');
        return;
    }

    // 显示加载提示
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'position-fixed top-0 start-50 translate-middle-x p-3';
    loadingIndicator.style.zIndex = '9999';
    loadingIndicator.innerHTML = `
        <div class="alert alert-warning d-flex align-items-center" role="alert">
            <div class="spinner-border spinner-border-sm text-danger me-2" role="status">
                <span class="visually-hidden">删除中...</span>
            </div>
            <div>
                <strong>删除中</strong><br>
                <small>正在删除服务器，请稍候...</small>
            </div>
        </div>
    `;
    document.body.appendChild(loadingIndicator);

    try {
        const response = await fetch(`${apiBaseUrl}/delete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'token': currentUser.token
            },
            body: `uuid=${uuid}`
        });

        const data = await response.json();

        // 移除加载提示
        loadingIndicator.remove();

        if (data.status === 'success') {
            showAlert('服务器已删除', 'success');

            // 刷新服务器列表
            loadMyServers();
        } else {
            showAlert(data.message || '删除服务器失败', 'danger');
        }
    } catch (error) {
        // 移除加载提示
        loadingIndicator.remove();

        console.error('删除服务器失败:', error);
        showAlert('删除服务器失败，请检查网络连接', 'danger');
    }
}

// 显示添加Token模态框（管理员功能）
function showAddTokenModal() {
    // 创建模态框HTML
    const modalHtml = `
        <div class="modal fade" id="addTokenModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">添加Token</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <form id="addTokenForm">
                            <div class="mb-3">
                                <label for="tokenOperation" class="form-label">操作类型</label>
                                <select class="form-select" id="tokenOperation">
                                    <option value="add">添加Token</option>
                                    <option value="delete">删除Token</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label for="tokenValue" class="form-label">Token值</label>
                                <input type="text" class="form-control" id="tokenValue" required>
                                <div class="form-text">对于添加操作，可以留空自动生成</div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
                        <button type="button" class="btn btn-primary" id="saveTokenBtn">保存</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // 添加模态框到页面
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHtml;
    document.body.appendChild(modalContainer);

    // 初始化模态框
    const modal = new bootstrap.Modal(document.getElementById('addTokenModal'));
    modal.show();

    // 设置事件监听
    document.getElementById('saveTokenBtn').addEventListener('click', handleAddToken);

    // 模态框关闭时移除DOM元素
    document.getElementById('addTokenModal').addEventListener('hidden.bs.modal', function () {
        modalContainer.remove();
    });
}

// 处理添加/删除Token（管理员功能）
async function handleAddToken() {
    if (!isAdmin || !currentUser) {
        showAlert('您没有权限执行此操作', 'danger');
        return;
    }

    const operation = document.getElementById('tokenOperation').value;
    const token = document.getElementById('tokenValue').value;

    try {
        const response = await fetch(`${apiBaseUrl}/admin/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Admin-Key': localStorage.getItem('adminKey')
            },
            body: `operation=${operation}&token=${token}`
        });

        const data = await response.json();

        if (data.status === 'success') {
            showAlert(data.message || 'Token操作成功', 'success');

            // 关闭模态框
            const modal = bootstrap.Modal.getInstance(document.getElementById('addTokenModal'));
            modal.hide();

            // 如果是添加操作且有返回的Token，显示Token值
            if (operation === 'add' && data.token) {
                alert(`新Token: ${data.token}
请妥善保存此Token，它只会显示这一次！`);
            }
        } else {
            showAlert(data.message || 'Token操作失败', 'danger');
        }
    } catch (error) {
        console.error('Token操作失败:', error);
        showAlert('Token操作失败，请检查网络连接', 'danger');
    }
}

// 显示用户服务器（管理员功能）
async function showUserServers(userToken, username) {
    try {
        const response = await fetch(`${apiBaseUrl}/admin/get_user_servers?token=${userToken}`, {
            method: 'GET',
            headers: {
                'Admin-Key': localStorage.getItem('adminKey')
            }
        });

        const data = await response.json();

        if (data.status === 'success') {
            const servers = data.servers;

            // 创建模态框HTML
            let serversHtml = '';

            if (servers.length === 0) {
                serversHtml = '<p>该用户没有添加任何服务器</p>';
            } else {
                serversHtml = `
                    <div class="table-responsive">
                        <table class="table table-striped">
                            <thead>
                                <tr>
                                    <th>图标</th>
                                    <th>名称</th>
                                    <th>地址</th>
                                    <th>端口</th>
                                    <th>状态</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                `;

                servers.forEach(server => {
                    // 判断服务器状态，兼容不同的字段名
                    const isOnline = server.online === 1 || server.online === true || server.is_online === 1 || server.is_online === true;

                    serversHtml += `
                        <tr>
                            <td>
                                ${server.icon_url ? `<img src="${server.icon_url}" class="server-icon" alt="服务器图标">` : '-'}
                            </td>
                            <td>${server.name}</td>
                            <td>${server.host}</td>
                            <td>${server.port}</td>
                            <td>
                                <span class="status-badge ${isOnline ? 'status-online' : 'status-offline'}">
                                    ${isOnline ? '在线' : '离线'}
                                </span>
                            </td>
                            <td>
                                <button class="btn btn-sm btn-primary me-1 edit-server-btn" data-server='${JSON.stringify(server)}'>
                                    <i class="fas fa-edit"></i> 编辑
                                </button>
                                <button class="btn btn-sm btn-info me-1 view-article-btn" data-uuid="${server.uuid}" data-name="${server.name}">
                                    <i class="fas fa-file-alt"></i> 文章
                                </button>
                                <button class="btn btn-sm btn-danger delete-server-btn" data-uuid="${server.uuid}" data-name="${server.name}">
                                    <i class="fas fa-trash"></i> 删除
                                </button>
                            </td>
                        </tr>
                    `;
                });

                serversHtml += `
                            </tbody>
                        </table>
                    </div>
                `;
            }

            const modalHtml = `
                <div class="modal fade" id="userServersModal" tabindex="-1" aria-hidden="true">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">用户 "${username}" 的服务器</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                ${serversHtml}
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">关闭</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // 添加模态框到页面
            const modalContainer = document.createElement('div');
            modalContainer.innerHTML = modalHtml;
            document.body.appendChild(modalContainer);

            // 初始化模态框
            const modal = new bootstrap.Modal(document.getElementById('userServersModal'));
            modal.show();

            // 添加事件监听器
            document.querySelectorAll('.edit-server-btn').forEach(btn => {
                btn.addEventListener('click', function () {
                    try {
                        const server = JSON.parse(this.getAttribute('data-server'));

                        // 关闭当前模态框
                        modal.hide();

                        // 显示管理员编辑服务器模态框
                        showAdminEditServerModal(server);
                    } catch (error) {
                        console.error('解析服务器数据失败:', error);
                        showAlert('编辑服务器失败，数据解析错误', 'danger');
                    }
                });
            });

            document.querySelectorAll('.delete-server-btn').forEach(btn => {
                btn.addEventListener('click', function () {
                    const uuid = this.getAttribute('data-uuid');
                    const name = this.getAttribute('data-name');
                    adminDeleteServer(uuid, name);
                });
            });

            document.querySelectorAll('.view-article-btn').forEach(btn => {
                btn.addEventListener('click', function () {
                    const uuid = this.getAttribute('data-uuid');
                    const name = this.getAttribute('data-name');
                    viewServerArticle(uuid, name);
                });
            });

            // 模态框关闭时移除DOM元素
            document.getElementById('userServersModal').addEventListener('hidden.bs.modal', function () {
                modalContainer.remove();
            });
        } else {
            showAlert(data.message || '获取用户服务器失败', 'danger');
        }
    } catch (error) {
        console.error('获取用户服务器失败:', error);
        showAlert('获取用户服务器失败，请检查网络连接', 'danger');
    }
}

// 从用户服务器模态框中编辑服务器（管理员功能）
function adminEditServerFromModal(serverJson) {
    try {
        const server = JSON.parse(serverJson.replace(/&quot;/g, '"'));

        // 关闭当前模态框
        const currentModal = bootstrap.Modal.getInstance(document.getElementById('userServersModal'));
        if (currentModal) {
            currentModal.hide();
        }

        // 显示管理员编辑服务器模态框
        showAdminEditServerModal(server);
    } catch (error) {
        console.error('解析服务器数据失败:', error);
        showAlert('编辑服务器失败，数据解析错误', 'danger');
    }
}

// 确认删除用户（管理员功能）
function confirmDeleteUser(userId, username) {
    if (confirm(`确定要删除用户 "${username}" 吗？此操作将同时删除该用户的所有服务器数据，且不可撤销。`)) {
        deleteUser(userId);
    }
}

// 删除用户（管理员功能）
async function deleteUser(userId) {
    if (!isAdmin || !currentUser) {
        showAlert('您没有权限执行此操作', 'danger');
        return;
    }

    try {
        const response = await fetch(`${apiBaseUrl}/admin/delete_user`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Admin-Key': localStorage.getItem('adminKey')
            },
            body: `user_id=${userId}`
        });

        const data = await response.json();

        if (data.status === 'success') {
            showAlert('用户已删除', 'success');

            // 刷新用户列表
            loadUsersData();
        } else {
            showAlert(data.message || '删除用户失败', 'danger');
        }
    } catch (error) {
        console.error('删除用户失败:', error);
        showAlert('删除用户失败，请检查网络连接', 'danger');
    }
}

// 管理员删除服务器（管理员功能）
async function adminDeleteServer(uuid, name) {
    if (!isAdmin || !currentUser) {
        showAlert('您没有权限执行此操作', 'danger');
        return;
    }

    if (confirm(`确定要删除服务器 "${name}" 吗？此操作不可撤销。`)) {
        try {
            const response = await fetch(`${apiBaseUrl}/admin/delete_data`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Admin-Key': localStorage.getItem('adminKey')
                },
                body: `uuid=${uuid}`
            });

            const data = await response.json();

            if (data.status === 'success') {
                showAlert('服务器已删除', 'success');

                // 关闭模态框
                const modal = bootstrap.Modal.getInstance(document.getElementById('userServersModal'));
                if (modal) {
                    modal.hide();
                }

                // 刷新用户列表
                loadUsersData();
            } else {
                showAlert(data.message || '删除服务器失败', 'danger');
            }
        } catch (error) {
            console.error('删除服务器失败:', error);
            showAlert('删除服务器失败，请检查网络连接', 'danger');
        }
    }
}

// 显示提示消息
function showAlert(message, type) {
    // 创建提示框HTML
    const alertHtml = `
        <div class="alert alert-${type} alert-dismissible fade show position-fixed top-0 end-0 m-3" style="z-index: 9999;" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;

    // 添加提示框到页面
    const alertContainer = document.createElement('div');
    alertContainer.innerHTML = alertHtml;
    document.body.appendChild(alertContainer);

    // 3秒后自动关闭
    setTimeout(() => {
        const alertElement = alertContainer.querySelector('.alert');
        if (alertElement) {
            const bsAlert = new bootstrap.Alert(alertElement);
            bsAlert.close();
        }
    }, 3000);

    // 提示框关闭时移除DOM元素
    alertContainer.querySelector('.alert').addEventListener('closed.bs.alert', function () {
        alertContainer.remove();
    });
}

// 显示修改密码模态框
function showChangePasswordModal() {
    if (!currentUser) {
        showAlert('请先登录', 'danger');
        showLoginPage();
        return;
    }

    // 创建模态框HTML
    const modalHtml = `
        <div class="modal fade" id="changePasswordModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">修改密码</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <form id="changePasswordForm">
                            <div class="mb-3">
                                <label for="oldPassword" class="form-label">当前密码</label>
                                <input type="password" class="form-control" id="oldPassword" required>
                            </div>
                            <div class="mb-3">
                                <label for="newPassword" class="form-label">新密码</label>
                                <input type="password" class="form-control" id="newPassword" required>
                                <div class="form-text">密码至少6个字符</div>
                            </div>
                            <div class="mb-3">
                                <label for="confirmNewPassword" class="form-label">确认新密码</label>
                                <input type="password" class="form-control" id="confirmNewPassword" required>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
                        <button type="button" class="btn btn-primary" id="updatePasswordBtn">确认修改</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // 添加模态框到页面
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHtml;
    document.body.appendChild(modalContainer);

    // 初始化模态框
    const modal = new bootstrap.Modal(document.getElementById('changePasswordModal'));
    modal.show();

    // 设置事件监听
    document.getElementById('updatePasswordBtn').addEventListener('click', handleChangePassword);

    // 模态框关闭时移除DOM元素
    document.getElementById('changePasswordModal').addEventListener('hidden.bs.modal', function () {
        modalContainer.remove();
    });
}

// 处理修改密码
async function handleChangePassword() {
    if (!currentUser) {
        showAlert('请先登录', 'danger');
        return;
    }

    const oldPassword = document.getElementById('oldPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmNewPassword = document.getElementById('confirmNewPassword').value;

    // 验证密码
    if (newPassword !== confirmNewPassword) {
        showAlert('两次输入的新密码不一致', 'danger');
        return;
    }

    if (newPassword.length < 6) {
        showAlert('新密码至少需要6个字符', 'danger');
        return;
    }

    // 禁用按钮并添加加载动画
    const updateBtn = document.getElementById('updatePasswordBtn');
    const originalBtnContent = updateBtn.innerHTML;
    updateBtn.disabled = true;
    updateBtn.innerHTML = `
        <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
        修改中...
    `;

    try {
        const response = await fetch(`${apiBaseUrl}/change_password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'token': currentUser.token
            },
            body: `old_password=${encodeURIComponent(oldPassword)}&new_password=${encodeURIComponent(newPassword)}`
        });

        const data = await response.json();

        if (data.status === 'success') {
            showAlert(`密码修改成功，用户名：${data.username}`, 'success');

            // 关闭模态框
            const modal = bootstrap.Modal.getInstance(document.getElementById('changePasswordModal'));
            modal.hide();
        } else {
            showAlert(data.message || '密码修改失败', 'danger');
        }
    } catch (error) {
        console.error('修改密码失败:', error);
        showAlert('修改密码失败，请检查网络连接', 'danger');
    } finally {
        // 恢复按钮状态
        updateBtn.disabled = false;
        updateBtn.innerHTML = originalBtnContent;
    }
}

// 显示管理员修改密码模态框
function showAdminChangePasswordModal(username) {
    if (!isAdmin || !currentUser) {
        showAlert('您没有权限执行此操作', 'danger');
        return;
    }

    // 创建模态框HTML
    const modalHtml = `
        <div class="modal fade" id="adminChangePasswordModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">修改用户密码</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <form id="adminChangePasswordForm">
                            <div class="mb-3">
                                <label for="adminUsername" class="form-label">用户名</label>
                                <input type="text" class="form-control" id="adminUsername" value="${username}" readonly>
                            </div>
                            <div class="mb-3">
                                <label for="adminNewPassword" class="form-label">新密码</label>
                                <input type="password" class="form-control" id="adminNewPassword" required>
                                <div class="form-text">密码至少6个字符</div>
                            </div>
                            <div class="mb-3">
                                <label for="adminConfirmNewPassword" class="form-label">确认新密码</label>
                                <input type="password" class="form-control" id="adminConfirmNewPassword" required>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
                        <button type="button" class="btn btn-primary" id="adminUpdatePasswordBtn">确认修改</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // 添加模态框到页面
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHtml;
    document.body.appendChild(modalContainer);

    // 初始化模态框
    const modal = new bootstrap.Modal(document.getElementById('adminChangePasswordModal'));
    modal.show();

    // 设置事件监听
    document.getElementById('adminUpdatePasswordBtn').addEventListener('click', handleAdminChangePassword);

    // 模态框关闭时移除DOM元素
    document.getElementById('adminChangePasswordModal').addEventListener('hidden.bs.modal', function () {
        modalContainer.remove();
    });
}

// 处理管理员修改密码
async function handleAdminChangePassword() {
    if (!isAdmin || !currentUser) {
        showAlert('您没有权限执行此操作', 'danger');
        return;
    }

    const username = document.getElementById('adminUsername').value;
    const newPassword = document.getElementById('adminNewPassword').value;
    const confirmNewPassword = document.getElementById('adminConfirmNewPassword').value;

    // 验证密码
    if (newPassword !== confirmNewPassword) {
        showAlert('两次输入的新密码不一致', 'danger');
        return;
    }

    if (newPassword.length < 6) {
        showAlert('新密码至少需要6个字符', 'danger');
        return;
    }

    // 禁用按钮并添加加载动画
    const updateBtn = document.getElementById('adminUpdatePasswordBtn');
    const originalBtnContent = updateBtn.innerHTML;
    updateBtn.disabled = true;
    updateBtn.innerHTML = `
        <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
        修改中...
    `;

    try {
        const response = await fetch(`${apiBaseUrl}/admin/change_user_password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Admin-Key': localStorage.getItem('adminKey')
            },
            body: `username=${encodeURIComponent(username)}&new_password=${encodeURIComponent(newPassword)}`
        });

        const data = await response.json();

        if (data.status === 'success') {
            showAlert(`用户密码修改成功，用户名：${data.username}`, 'success');

            // 关闭模态框
            const modal = bootstrap.Modal.getInstance(document.getElementById('adminChangePasswordModal'));
            modal.hide();
        } else {
            showAlert(data.message || '密码修改失败', 'danger');
        }
    } catch (error) {
        console.error('修改用户密码失败:', error);
        showAlert('修改用户密码失败，请检查网络连接', 'danger');
    } finally {
        // 恢复按钮状态
        updateBtn.disabled = false;
        updateBtn.innerHTML = originalBtnContent;
    }
}

// 查看和编辑服务器文章
async function viewServerArticle(uuid, serverName) {
    try {
        // 显示加载提示
        const loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'position-fixed top-0 start-50 translate-middle-x p-3';
        loadingIndicator.style.zIndex = '9999';
        loadingIndicator.innerHTML = `
            <div class="alert alert-info d-flex align-items-center" role="alert">
                <div class="spinner-border spinner-border-sm text-primary me-2" role="status">
                    <span class="visually-hidden">加载中...</span>
                </div>
                <div>
                    <strong>加载中</strong><br>
                    <small>正在获取服务器文章，请稍候...</small>
                </div>
            </div>
        `;
        document.body.appendChild(loadingIndicator);

        // 获取服务器文章
        const headers = {
            'Content-Type': 'application/x-www-form-urlencoded'
        };
        if (isAdmin) {
            headers['Admin-Key'] = localStorage.getItem('adminKey');
        } else {
            headers['token'] = currentUser.token;
        }

        console.log('发送请求:', `GET ${apiBaseUrl}/article`);
        console.log('请求头:', JSON.stringify(headers, null, 4));
        console.log('查询参数:', { "uuid": uuid });

        const response = await fetch(`${apiBaseUrl}/article?uuid=${uuid}`, {
            method: 'GET',
            headers: headers
        });

        console.log('响应状态码:', response.status);

        // 移除加载提示
        loadingIndicator.remove();

        let articleContent = '';

        // 检查响应状态
        if (response.ok) {
            try {
                const data = await response.json();
                console.log('响应结果:', JSON.stringify(data, null, 4));
                if (data.status === 'success' && data.data) {
                    articleContent = data.data;
                }
            } catch (e) {
                console.log('解析文章数据失败，将创建新文章', e);
            }
        }

        // 无论是否获取到文章，都显示编辑界面
        // 创建模态框HTML
        const modalHtml = `
            <div class="modal fade" id="serverArticleModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">服务器 "${serverName}" 的文章</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <form id="serverArticleForm">
                                <input type="hidden" id="serverUuid" value="${uuid}">
                                <div class="mb-3">
                                    <label for="serverArticleContent" class="form-label">文章内容</label>
                                    <textarea class="form-control" id="serverArticleContent" rows="10" placeholder="请输入服务器文章内容...">${articleContent}</textarea>
                                    <div class="form-text">支持MarkDown格式</div>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">关闭</button>
                            <button type="button" class="btn btn-primary" id="updateArticleBtn">保存修改</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // 添加模态框到页面
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHtml;
        document.body.appendChild(modalContainer);

        // 初始化模态框
        const modal = new bootstrap.Modal(document.getElementById('serverArticleModal'));

        // 模态框显示后确保UUID值正确设置
        document.getElementById('serverArticleModal').addEventListener('shown.bs.modal', function () {
            const uuidInput = document.getElementById('serverUuid');
            if (uuidInput && !uuidInput.value) {
                uuidInput.value = uuid;
                console.log('模态框显示后已设置UUID值:', uuidInput.value);
            }
        });

        modal.show();

        // 设置事件监听
        document.getElementById('updateArticleBtn').addEventListener('click', handleUpdateArticle);

        // 模态框关闭时移除DOM元素
        document.getElementById('serverArticleModal').addEventListener('hidden.bs.modal', function () {
            modalContainer.remove();
        });
    } catch (error) {
        console.error('获取服务器文章失败:', error);
        showAlert('获取服务器文章失败，请检查网络连接', 'danger');
    }
}

// 处理更新服务器文章
async function handleUpdateArticle() {
    if (!currentUser) {
        showAlert('请先登录', 'danger');
        return;
    }

    const uuid = document.getElementById('serverUuid').value;
    const content = document.getElementById('serverArticleContent').value;

    // 添加调试信息
    console.log('获取到的参数:', {
        uuidElement: document.getElementById('serverUuid'),
        contentElement: document.getElementById('serverArticleContent'),
        uuid: uuid || '未设置',
        content: content ? `已设置 (${content.length}字符)` : '未设置'
    });

    // 验证参数
    if (!uuid || !content) {
        console.log('参数验证失败:', { uuid: uuid || '未设置', content: content ? `已设置 (${content.length}字符)` : '未设置' });
        showAlert('服务器UUID和文章内容不能为空', 'danger');
        return;
    }

    console.log('准备更新服务器文章:', { uuid, contentLength: content.length });

    // 禁用按钮并添加加载动画
    const updateBtn = document.getElementById('updateArticleBtn');
    const originalBtnContent = updateBtn.innerHTML;
    updateBtn.disabled = true;
    updateBtn.innerHTML = `
        <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
        更新中...
    `;

    try {
        // 使用统一的API端点
        const url = `${apiBaseUrl}/article`;
        const headers = {
            'Content-Type': 'application/x-www-form-urlencoded'
        };

        // 管理员需要添加Admin-Key，普通用户需要添加token
        if (isAdmin) {
            headers['Admin-Key'] = localStorage.getItem('adminKey');
        } else {
            headers['token'] = currentUser.token;
        }

        // 为所有用户添加操作参数，区分获取和更新操作
        const params = {
            uuid: uuid,
            content: content
        };

        // 普通用户需要添加operation参数
        if (!isAdmin) {
            params.operation = 'update';
        }

        console.log('发送请求:', `POST ${url}`);
        console.log('请求头:', JSON.stringify(headers, null, 4));
        console.log('请求数据:', JSON.stringify(params, null, 4));

        // 所有用户都使用POST方法
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: new URLSearchParams(params).toString()
        });

        console.log('响应状态码:', response.status);

        const data = await response.json();
        console.log('响应结果:', JSON.stringify(data, null, 4));

        if (data.status === 'success') {
            showAlert(data.message || '服务器文章更新成功', 'success');

            // 关闭模态框
            const modal = bootstrap.Modal.getInstance(document.getElementById('serverArticleModal'));
            modal.hide();
        } else {
            showAlert(data.message || '更新服务器文章失败', 'danger');
        }
    } catch (error) {
        console.error('更新服务器文章失败:', error);
        showAlert('更新服务器文章失败，请检查网络连接', 'danger');
    } finally {
        // 恢复按钮状态
        updateBtn.disabled = false;
        updateBtn.innerHTML = originalBtnContent;
    }
}

// 显示管理员编辑服务器模态框
async function showAdminEditServerModal(server) {
    // 显示加载提示
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'position-fixed top-0 start-50 translate-middle-x p-3';
    loadingIndicator.style.zIndex = '9999';
    loadingIndicator.innerHTML = `
        <div class="alert alert-info d-flex align-items-center" role="alert">
            <div class="spinner-border spinner-border-sm text-primary me-2" role="status">
                <span class="visually-hidden">加载中...</span>
            </div>
            <div>
                <strong>加载中</strong><br>
                <small>正在获取服务器详细信息，请稍候...</small>
            </div>
        </div>
    `;
    document.body.appendChild(loadingIndicator);

    try {
        // 先获取完整的服务器信息
        const response = await fetch(`${apiBaseUrl}/admin/all_servers`, {
            method: 'GET',
            headers: {
                'Admin-Key': localStorage.getItem('adminKey')
            }
        });

        const data = await response.json();

        // 移除加载提示
        loadingIndicator.remove();

        if (data.status === 'success' && data.data) {
            // 查找匹配的服务器
            const fullServerData = data.data.find(s => s.uuid === server.uuid);

            if (!fullServerData) {
                showAlert('未找到服务器详细信息', 'danger');
                return;
            }

            // 使用完整的服务器数据创建模态框
            const modalHtml = `
                <div class="modal fade" id="adminEditServerModal" tabindex="-1" aria-hidden="true">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">编辑服务器 (管理员模式)</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <form id="adminEditServerForm">
                                    <input type="hidden" id="adminEditServerUuid" value="${fullServerData.uuid || ''}">
                                    <div class="mb-3">
                                        <label for="adminEditServerName" class="form-label">服务器名称</label>
                                        <input type="text" class="form-control" id="adminEditServerName" value="${fullServerData.name || ''}" required>
                                    </div>
                                    <div class="mb-3">
                                        <label for="adminEditServerHost" class="form-label">服务器地址</label>
                                        <input type="text" class="form-control" id="adminEditServerHost" value="${fullServerData.host || ''}" required>
                                    </div>
                                    <div class="mb-3">
                                        <label for="adminEditServerPort" class="form-label">服务器端口</label>
                                        <input type="number" class="form-control" id="adminEditServerPort" value="${fullServerData.port || 19132}" required>
                                    </div>
                                    <div class="mb-3">
                                        <label for="adminEditServerIntroduce" class="form-label">服务器介绍</label>
                                        <textarea class="form-control" id="adminEditServerIntroduce" rows="3">${fullServerData.introduce || ''}</textarea>
                                    </div>
                                    <div class="mb-3">
                                        <label for="adminEditServerIcon" class="form-label">服务器图标URL</label>
                                        <input type="url" class="form-control" id="adminEditServerIcon" value="${fullServerData.icon_url || ''}">
                                        <div class="form-text">或者上传新图片作为图标</div>
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label">当前图标</label>
                                        <div class="d-flex align-items-center">
                                            ${fullServerData.icon_url ? `<img src="${fullServerData.icon_url}" class="server-icon me-3" alt="当前图标">` : '<span class="me-3">无图标</span>'}
                                            <button type="button" class="btn btn-sm btn-outline-danger" id="adminDeleteIconBtn">删除图标</button>
                                        </div>
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label">上传新图标</label>
                                        <div class="image-preview" id="adminEditIconPreview">
                                            <span>点击或拖拽图片到此处上传</span>
                                        </div>
                                        <input type="file" class="form-control d-none" id="adminEditIconFile" accept="image/*">
                                        <button type="button" class="btn btn-sm btn-outline-secondary" id="adminSelectIconBtn">选择图片</button>
                                    </div>
                                    <div class="mb-3">
                                        <label for="adminEditServerToken" class="form-label">服务器Token</label>
                                        <input type="text" class="form-control" id="adminEditServerToken" value="${fullServerData.token || ''}">
                                        <div class="form-text">如需修改服务器Token，请输入新值</div>
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label">所属用户</label>
                                        <input type="text" class="form-control" value="${fullServerData.username || ''}" readonly>
                                        <div class="form-text">服务器所属用户，不可修改</div>
                                    </div>
                                </form>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
                                <button type="button" class="btn btn-primary" id="adminUpdateServerBtn">保存修改</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // 添加模态框到页面
            const modalContainer = document.createElement('div');
            modalContainer.innerHTML = modalHtml;
            document.body.appendChild(modalContainer);

            // 初始化模态框
            const modal = new bootstrap.Modal(document.getElementById('adminEditServerModal'));
            modal.show();

            // 设置事件监听
            document.getElementById('adminUpdateServerBtn').addEventListener('click', handleAdminUpdateServer);

            // 图片上传相关事件监听
            document.getElementById('adminSelectIconBtn').addEventListener('click', function () {
                document.getElementById('adminEditIconFile').click();
            });

            document.getElementById('adminEditIconFile').addEventListener('change', function (e) {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function (e) {
                        const preview = document.getElementById('adminEditIconPreview');
                        preview.innerHTML = `<img src="${e.target.result}" alt="图标预览">`;
                    };
                    reader.readAsDataURL(file);
                }
            });

            document.getElementById('adminEditIconPreview').addEventListener('click', function () {
                document.getElementById('adminEditIconFile').click();
            });

            document.getElementById('adminDeleteIconBtn').addEventListener('click', function () {
                if (confirm('确定要删除服务器图标吗？')) {
                    document.getElementById('adminEditServerIcon').value = '';
                    document.querySelector('#adminEditServerModal .server-icon')?.remove();
                    document.querySelector('#adminEditServerModal span.me-3')?.remove();
                    document.querySelector('#adminEditServerModal .d-flex').prepend(document.createElement('span'));
                    document.querySelector('#adminEditServerModal .d-flex span').className = 'me-3';
                    document.querySelector('#adminEditServerModal .d-flex span').textContent = '无图标';
                    document.getElementById('adminEditIconPreview').innerHTML = '<span>点击或拖拽图片到此处上传</span>';
                }
            });

            // 模态框关闭时移除DOM元素
            document.getElementById('adminEditServerModal').addEventListener('hidden.bs.modal', function () {
                modalContainer.remove();
            });
        } else {
            showAlert('获取服务器详细信息失败', 'danger');
            console.error('获取服务器详细信息失败:', data);
        }
    } catch (error) {
        // 移除加载提示
        loadingIndicator.remove();

        showAlert('获取服务器详细信息时出错', 'danger');
        console.error('获取服务器详细信息时出错:', error);
    }
}

// 处理管理员更新服务器
async function handleAdminUpdateServer() {
    if (!isAdmin || !currentUser) {
        showAlert('您没有权限执行此操作', 'danger');
        return;
    }

    const uuid = document.getElementById('adminEditServerUuid').value;
    const name = document.getElementById('adminEditServerName').value;
    const host = document.getElementById('adminEditServerHost').value;
    const port = document.getElementById('adminEditServerPort').value;
    const introduce = document.getElementById('adminEditServerIntroduce').value;
    const icon_url = document.getElementById('adminEditServerIcon').value;
    const token = document.getElementById('adminEditServerToken').value;
    const iconFile = document.getElementById('adminEditIconFile').files[0];

    // 禁用按钮并添加加载动画
    const updateBtn = document.getElementById('adminUpdateServerBtn');
    const originalBtnContent = updateBtn.innerHTML;
    updateBtn.disabled = true;
    updateBtn.innerHTML = `
        <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
        更新中...
    `;

    try {
        // 如果有上传的图片，先上传图片
        let finalIconUrl = icon_url;

        if (iconFile) {
            const formData = new FormData();
            formData.append('file', iconFile);

            const uploadResponse = await fetch(`${apiBaseUrl}/upload_image`, {
                method: 'POST',
                headers: {
                    'Admin-Key': localStorage.getItem('adminKey')
                },
                body: formData
            });

            const uploadData = await uploadResponse.json();

            if (uploadData.status === 'success') {
                finalIconUrl = uploadData.url;
            } else {
                showAlert(uploadData.message || '图片上传失败', 'danger');
                updateBtn.disabled = false;
                updateBtn.innerHTML = originalBtnContent;
                return;
            }
        }

        // 构建更新参数
        const updateParams = {
            uuid: uuid,
            name: name,
            host: host,
            port: port,
            introduce: introduce,
            icon_url: finalIconUrl
        };

        // 如果提供了token，则添加到更新参数中
        if (token) {
            updateParams.token = token;
        }

        const response = await fetch(`${apiBaseUrl}/admin/update_data`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Admin-Key': localStorage.getItem('adminKey')
            },
            body: new URLSearchParams(updateParams).toString()
        });

        const data = await response.json();

        if (data.status === 'success') {
            showAlert(data.message || '服务器信息更新成功', 'success');

            // 关闭模态框
            const modal = bootstrap.Modal.getInstance(document.getElementById('adminEditServerModal'));
            modal.hide();

            // 刷新服务器列表
            loadMyServers();
        } else {
            showAlert(data.message || '更新服务器信息失败', 'danger');
        }
    } catch (error) {
        console.error('更新服务器信息失败:', error);
        showAlert('更新服务器信息失败，请检查网络连接', 'danger');
    } finally {
        // 恢复按钮状态
        updateBtn.disabled = false;
        updateBtn.innerHTML = originalBtnContent;
    }
}
