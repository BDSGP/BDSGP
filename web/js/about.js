// 获取API数据并更新服务器数量 
import { API_CONFIG } from "./config.js";
import { log } from "./utils.js";

// 数字增长动画函数
function initStatNumbersAnimation() {
    const statNumbers = document.querySelectorAll('.stat-number');

    const animateValue = (element, start, end, duration) => {
        // 检查元素是否有效，避免NaN
        if (!element || isNaN(start) || isNaN(end) || isNaN(duration)) {
            console.error('无效的参数用于animateValue函数');
            return;
        }

        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const value = Math.floor(progress * (end - start) + start);

            // 格式化数字
            if (value >= 1000) {
                element.textContent = (value / 1000).toFixed(1) + 'k';
            } else if (value >= 1000000) {
                element.textContent = (value / 1000000).toFixed(1) + 'm';
            } else {
                element.textContent = value;
            }

            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    };

    // 使用 Intersection Observer 触发动画，同时确保数据始终更新
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = entry.target;
                const endValue = parseInt(target.getAttribute('data-count'));
                animateValue(target, 0, endValue, 2000); // 2秒内完成动画
                observer.unobserve(target); // 触发一次后停止观察
            }
        });
    });

    // 初始化时直接尝试获取并更新数据
    statNumbers.forEach(number => {
        const endValue = parseInt(number.getAttribute('data-count'));
        if (!isNaN(endValue)) {
            animateValue(number, 0, endValue, 2000);
        }
        observer.observe(number);
    });
}

// 平滑滚动脚本
function scrollToSection(sectionId) {
    const element = document.getElementById(sectionId);
    if (element) {
        // 计算元素位置，考虑导航栏高度
        const navbarHeight = document.querySelector('.navbar').offsetHeight;
        const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
        const offsetPosition = elementPosition - navbarHeight + 20; // 减去导航栏高度和额外间距

        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    }
}

// 获取API内容
async function getAPIContent() {
    try {
        const response = await fetch(API_CONFIG.baseUrl);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('获取API数据失败:', error);
    }
}

// 数字动画函数
function animateValue(element, start, end, duration) {
    // 检查元素是否有效，避免NaN
    if (!element || isNaN(start) || isNaN(end) || isNaN(duration)) {
        console.error('无效的参数用于animateValue函数');
        return;
    }

    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const value = Math.floor(progress * (end - start) + start);

        // 格式化数字
        if (value >= 1000) {
            element.textContent = (value / 1000).toFixed(1) + 'k';
        } else if (value >= 1000000) {
            element.textContent = (value / 1000000).toFixed(1) + 'm';
        } else {
            element.textContent = value;
        }

        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

// 获取服务器数量
async function updateServerCount(data) {
    try {
        if (data && data.status === 'success' && Array.isArray(data.data)) {
            const serverCount = data.data.length;
            const serverCountElement = document.getElementById('serverCount');

            // 检查元素是否存在
            if (!serverCountElement) {
                console.error('找不到服务器数量显示元素');
                return;
            }

            // 检查数值是否有效
            if (isNaN(serverCount)) {
                console.error('服务器数量数据无效');
                serverCountElement.textContent = '0';
                return;
            }

            console.log(`获取的服务器数量: ${serverCount}`);
            // 动画效果更新数字
            animateValue(serverCountElement, 0, serverCount, 2000);
        } else {
            console.error('API返回数据格式不正确');
            // 确保显示有效值
            const serverCountElement = document.getElementById('serverCount');
            if (serverCountElement) {
                serverCountElement.textContent = '0';
            }
        }
    } catch (error) {
        console.error('获取服务器数量失败:', error);
        // 确保显示有效值
        const serverCountElement = document.getElementById('serverCount');
        if (serverCountElement) {
            serverCountElement.textContent = '0';
        }
    }
}

// 获取玩家数量
async function updatePlayerCount(data) {
    try {
        if (data && data.status === 'success' && Array.isArray(data.data)) {
            let playerCount = 0;

            // 安全地计算玩家总数
            try {
                playerCount = data.data.reduce((acc, server) => {
                    // 检查player_count是否存在且是有效数字
                    if (server && typeof server.player_count === 'number' && !isNaN(server.player_count)) {
                        return acc + server.player_count;
                    }
                    return acc;
                }, 0);
            } catch (reduceError) {
                console.error('计算玩家总数时出错:', reduceError);
            }

            const playerCountElement = document.getElementById('playerCount');

            // 检查元素是否存在
            if (!playerCountElement) {
                console.error('找不到玩家数量显示元素');
                return;
            }

            // 检查数值是否有效
            if (isNaN(playerCount)) {
                console.error('玩家数量数据无效');
                playerCountElement.textContent = '0';
                return;
            }

            console.log(`获取的玩家数量: ${playerCount}`);

            // 动画效果更新数字
            animateValue(playerCountElement, 0, playerCount, 2000);
        } else {
            console.error('API返回数据格式不正确');
            // 确保显示有效值
            const playerCountElement = document.getElementById('playerCount');
            if (playerCountElement) {
                playerCountElement.textContent = '0';
            }
        }
    } catch (error) {
        console.error('获取玩家数量失败:', error);
        // 确保显示有效值
        const playerCountElement = document.getElementById('playerCount');
        if (playerCountElement) {
            playerCountElement.textContent = '0';
        }
    }
}

// 切换主题（亮色/暗色）
function toggleTheme() {
    const body = document.body;
    const themeToggle = document.getElementById('themeToggle');

    if (!body || !themeToggle) {
        console.error('无法获取主题切换所需的DOM元素');
        return;
    }

    // 切换主题类
    body.classList.toggle('dark-mode');

    // 更新主题切换按钮状态
    const isDarkMode = body.classList.contains('dark-mode');
    themeToggle.classList.toggle('active', isDarkMode);
    themeToggle.innerHTML = isDarkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';

    // 保存用户偏好到本地存储
    localStorage.setItem('preferredTheme', isDarkMode ? 'dark' : 'light');

    console.log(`主题已切换为: ${isDarkMode ? '暗色' : '亮色'}`);
}

// 初始化主题切换功能
function initializeThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');

    if (themeToggle) {
        // 移除可能已存在的事件监听器
        themeToggle.removeEventListener('click', toggleTheme);

        // 添加新的事件监听器
        themeToggle.addEventListener('click', toggleTheme);

        console.log('已为主题切换按钮绑定点击事件');

        // 恢复用户偏好的主题
        const preferredTheme = localStorage.getItem('preferredTheme');
        if (preferredTheme === 'dark') {
            document.body.classList.add('dark-mode');
            themeToggle.classList.add('active');
            themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
            console.log('恢复用户偏好的主题: dark');
        }
    } else {
        console.error('未找到主题切换按钮');
    }
}

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', async function () {
    try {
        // 初始化主题切换
        initializeThemeToggle();

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

        // 初始化数字增长动画
        initStatNumbersAnimation();

        const API_DATA = await getAPIContent();
        console.log("获取的API数据:", API_DATA);
        console.log("API返回的玩家数据:", JSON.stringify(API_DATA, null, 2));

        if (API_DATA) {
            updateServerCount(API_DATA);
            updatePlayerCount(API_DATA);
        } else {
            // 如果API数据获取失败，确保显示默认值
            console.warn("API数据获取失败，使用默认值");
            const serverCountElement = document.getElementById('serverCount');
            const playerCountElement = document.getElementById('playerCount');

            if (serverCountElement) serverCountElement.textContent = '0';
            if (playerCountElement) playerCountElement.textContent = '0';
        }
    } catch (error) {
        console.error("初始化数据获取失败:", error);
        // 确保在错误情况下显示有效值
        const serverCountElement = document.getElementById('serverCount');
        const playerCountElement = document.getElementById('playerCount');

        if (serverCountElement) serverCountElement.textContent = '0';
        if (playerCountElement) playerCountElement.textContent = '0';
    }
});