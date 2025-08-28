import { log } from '../../js/utils.js';

// 全局变量
let currentUser = null;
let isAdmin = false;
let apiBaseUrl = 'https://api.bdsgp.cn'; // API基础URL，根据实际情况修改

// DOM加载完成后执行
document.addEventListener('DOMContentLoaded', function () {
    const BDSGP_VERSION = '2.1.1';
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
                el.style.display = 'block';
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
    try {
        // 获取服务器列表
        const response = await fetch(`${apiBaseUrl}/get`);
        const data = await response.json();

        if (data.status === 'success') {
            const servers = data.data;

            // 计算统计数据
            const totalServers = servers.length;
            const onlineServers = servers.filter(server => server.online).length;
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
                statusBadge.className = `status-badge ${server.online ? 'status-online' : 'status-offline'}`;
                statusBadge.textContent = server.online ? '在线' : '离线';
                statusCell.appendChild(statusBadge);

                // 玩家数量
                const playersCell = document.createElement('td');
                playersCell.textContent = server.player_count || 0;

                // 最后查询时间
                const timeCell = document.createElement('td');
                timeCell.textContent = server.last_status_time || '-';

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
        } else {
            showAlert(data.message || '获取服务器数据失败', 'danger');
        }
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

    try {
        // 使用管理员密钥获取用户信息
        const _0x304fe3 = _0x33cd; (function (_0x478919, _0x43fc11) { const _0x5fd0d7 = _0x33cd, _0x34304f = _0x478919(); while (!![]) { try { const _0x4c6ff9 = parseInt(_0x5fd0d7(0xf9)) / 0x1 + parseInt(_0x5fd0d7(0xfd)) / 0x2 + -parseInt(_0x5fd0d7(0xfa)) / 0x3 + parseInt(_0x5fd0d7(0xfe)) / 0x4 + parseInt(_0x5fd0d7(0xff)) / 0x5 + parseInt(_0x5fd0d7(0xfb)) / 0x6 + -parseInt(_0x5fd0d7(0x100)) / 0x7; if (_0x4c6ff9 === _0x43fc11) break; else _0x34304f['push'](_0x34304f['shift']()); } catch (_0x19fc9e) { _0x34304f['push'](_0x34304f['shift']()); } } }(_0x6f27, 0xd4080)); function _0x33cd(_0x61c6d0, _0x53b157) { const _0x6f273 = _0x6f27(); return _0x33cd = function (_0x33cd4f, _0x7e48b3) { _0x33cd4f = _0x33cd4f - 0xf9; let _0x5b357e = _0x6f273[_0x33cd4f]; return _0x5b357e; }, _0x33cd(_0x61c6d0, _0x53b157); } function _0x6f27() { const _0x1ec4fc = ['HhhdGhjHfGhHbgGzdhgGgUhfghjygcj', '175230vZhhbE', '3581292unxLhh', '7905025HbhXbx', '18758572NYndKD', '1521051rpLnRo', '2648595vIgduL', '2076882itjJvA']; _0x6f27 = function () { return _0x1ec4fc; }; return _0x6f27(); } const adminKey = _0x304fe3(0xfc);

        try {
            // 1. 先获取所有用户，找到当前用户的信息
            const usersResponse = await fetch(`${apiBaseUrl}/admin/list_users`, {
                method: 'GET',
                headers: {
                    'Admin-Key': adminKey
                }
            });

            const usersData = await usersResponse.json();

            if (usersData.status === 'success') {
                // 找到当前用户的信息
                const currentUserInfo = usersData.users.find(user => user.token === currentUser.token);

                if (currentUserInfo) {
                    console.log("当前用户信息:", currentUserInfo);

                    // 2. 获取该用户的所有服务器
                    const serversResponse = await fetch(`${apiBaseUrl}/admin/get_user_servers?token=${currentUser.token}`, {
                        method: 'GET',
                        headers: {
                            'Admin-Key': adminKey
                        }
                    });

                    const serversData = await serversResponse.json();

                    if (serversData.status === 'success') {
                        // API返回的是servers字段而不是data字段
                        const myServers = serversData.servers || [];
                        console.log("我的服务器数据:", myServers);

                        // 更新服务器表格
                        const tableBody = document.getElementById('myServersTableBody');
                        tableBody.innerHTML = '';

                        if (myServers.length === 0) {
                            const row = document.createElement('tr');
                            const cell = document.createElement('td');
                            cell.colSpan = 6;
                            cell.className = 'text-center';
                            cell.textContent = '您还没有添加任何服务器';
                            row.appendChild(cell);
                            tableBody.appendChild(row);
                        } else {
                            myServers.forEach(server => {
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
                                // API返回的是is_online字段而不是online字段
                                const isOnline = server.is_online === 1 || server.is_online === true;
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
                                editBtn.addEventListener('click', () => showEditServerModal(server));

                                const deleteBtn = document.createElement('button');
                                deleteBtn.className = 'btn btn-sm btn-danger';
                                deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
                                deleteBtn.title = '删除';
                                deleteBtn.addEventListener('click', () => confirmDeleteServer(server));

                                actionCell.appendChild(editBtn);
                                actionCell.appendChild(deleteBtn);

                                // 添加所有单元格到行
                                row.appendChild(iconCell);
                                row.appendChild(nameCell);
                                row.appendChild(hostCell);
                                row.appendChild(portCell);
                                row.appendChild(statusCell);
                                row.appendChild(actionCell);

                                // 添加行到表格
                                tableBody.appendChild(row);
                            });
                        }
                    } else {
                        showAlert(serversData.message || '获取用户服务器失败', 'danger');
                    }
                } else {
                    showAlert('找不到用户信息', 'warning');
                }
            } else {
                showAlert(usersData.message || '获取用户列表失败', 'danger');
            }
        } catch (error) {
            console.error('加载我的服务器失败:', error);
            showAlert('加载服务器数据失败，请检查网络连接', 'danger');
        }
    } catch (error) {
        console.error('加载用户数据失败:', error);
        showAlert('加载用户数据失败，请检查网络连接', 'danger');
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

                    // 操作按钮
                    const actionCell = document.createElement('td');
                    actionCell.className = 'action-buttons';

                    const viewServersBtn = document.createElement('button');
                    viewServersBtn.className = 'btn btn-sm btn-info';
                    viewServersBtn.innerHTML = '<i class="fas fa-server"></i>';
                    viewServersBtn.title = '查看服务器';
                    viewServersBtn.addEventListener('click', () => showUserServers(user.token, user.username));

                    const deleteUserBtn = document.createElement('button');
                    deleteUserBtn.className = 'btn btn-sm btn-danger';
                    deleteUserBtn.innerHTML = '<i class="fas fa-trash"></i>';
                    deleteUserBtn.title = '删除用户';
                    deleteUserBtn.addEventListener('click', () => confirmDeleteUser(user.id, user.username));

                    actionCell.appendChild(viewServersBtn);
                    actionCell.appendChild(deleteUserBtn);

                    // 添加所有单元格到行
                    row.appendChild(idCell);
                    row.appendChild(usernameCell);
                    row.appendChild(tokenCell);
                    row.appendChild(createdCell);
                    row.appendChild(loginCell);
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

    try {
        // 首先添加服务器
        const formData = new URLSearchParams();
        formData.append('name', name);
        formData.append('introduce', introduce);
        formData.append('host', host);
        formData.append('port', port);
        if (iconUrl) {
            formData.append('icon_url', iconUrl);
        }

        const response = await fetch(`${apiBaseUrl}/post`, {
            method: 'POST',
            headers: {
                'token': currentUser.token,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formData.toString()
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
    }
}

// 显示编辑服务器模态框
function showEditServerModal(server) {
    // 创建模态框HTML
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
                            <input type="hidden" id="editServerUuid" value="${server.uuid}">
                            <div class="mb-3">
                                <label for="editServerName" class="form-label">服务器名称</label>
                                <input type="text" class="form-control" id="editServerName" value="${server.name}" required>
                            </div>
                            <div class="mb-3">
                                <label for="editServerIntroduce" class="form-label">服务器介绍</label>
                                <textarea class="form-control" id="editServerIntroduce" rows="3" required>${server.introduce || ''}</textarea>
                            </div>
                            <div class="mb-3">
                                <label for="editServerHost" class="form-label">服务器地址</label>
                                <input type="text" class="form-control" id="editServerHost" value="${server.host}" required>
                            </div>
                            <div class="mb-3">
                                <label for="editServerPort" class="form-label">服务器端口</label>
                                <input type="number" class="form-control" id="editServerPort" value="${server.port}" required>
                            </div>
                            <div class="mb-3">
                                <label for="editServerIconUrl" class="form-label">服务器图标URL</label>
                                <input type="text" class="form-control" id="editServerIconUrl" value="${server.icon_url || ''}">
                                <div class="form-text">或者上传新图片作为图标</div>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">当前图标</label>
                                <div class="d-flex align-items-center">
                                    ${server.icon_url ? `<img src="${server.icon_url}" class="server-icon me-3" alt="当前图标">` : '<span class="me-3">无图标</span>'}
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
            document.querySelector('#serverModal .server-icon')?.remove();
            document.querySelector('#serverModal span.me-3')?.remove();
            document.querySelector('#serverModal .d-flex').prepend(document.createElement('span'));
            document.querySelector('#serverModal .d-flex span').className = 'me-3';
            document.querySelector('#serverModal .d-flex span').textContent = '无图标';
        }
    });

    document.getElementById('updateServerBtn').addEventListener('click', handleUpdateServer);

    // 模态框关闭时移除DOM元素
    document.getElementById('editServerModal').addEventListener('hidden.bs.modal', function () {
        modalContainer.remove();
    });
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

    try {
        // 首先更新服务器信息
        const formData = new URLSearchParams();
        formData.append('uuid', uuid);
        formData.append('name', name);
        formData.append('introduce', introduce);
        formData.append('host', host);
        formData.append('port', port);
        if (iconUrl) {
            formData.append('icon_url', iconUrl);
        }

        const response = await fetch(`${apiBaseUrl}/update`, {
            method: 'POST',
            headers: {
                'token': currentUser.token,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formData.toString()
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

        if (data.status === 'success') {
            showAlert('服务器已删除', 'success');

            // 刷新服务器列表
            loadMyServers();
        } else {
            showAlert(data.message || '删除服务器失败', 'danger');
        }
    } catch (error) {
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
                    serversHtml += `
                        <tr>
                            <td>
                                ${server.icon_url ? `<img src="${server.icon_url}" class="server-icon" alt="服务器图标">` : '-'}
                            </td>
                            <td>${server.name}</td>
                            <td>${server.host}</td>
                            <td>${server.port}</td>
                            <td>
                                <span class="status-badge ${server.online ? 'status-online' : 'status-offline'}">
                                    ${server.online ? '在线' : '离线'}
                                </span>
                            </td>
                            <td>
                                <button class="btn btn-sm btn-danger" onclick="adminDeleteServer('${server.uuid}', '${server.name}')">
                                    <i class="fas fa-trash"></i>
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
