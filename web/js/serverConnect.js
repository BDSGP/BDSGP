// =============================================================================
// 服务器连接相关功能
// =============================================================================

import { log, createToast } from './utils.js';

/**
 * 尝试连接到Minecraft服务器
 * @param {string} uuid - 服务器UUID
 */
export function connectToServer(uuid) {
    log('服务器连接', `尝试连接到服务器: ${uuid}`, '开始连接');

    // 获取服务器信息
    const serverCard = document.querySelector(`.server-card[data-uuid="${uuid}"]`);
    if (!serverCard) {
        log('服务器连接', `未找到UUID为${uuid}的服务器卡片`, '错误');
        return;
    }

    // 获取服务器IP和端口
    const serverIp = serverCard.querySelector('.server-ip');
    if (!serverIp) {
        log('服务器连接', `未找到服务器IP信息`, '错误');
        return;
    }

    // 创建跳转链接
    const host = serverIp.textContent;
    // 确保host格式正确
    if (!host || host === '未知') {
        log('服务器连接', `服务器主机地址无效: ${host}`, '错误');
        return;
    }
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

/**
 * 添加服务器卡片点击跳转功能
 */
export function addServerCardClickHandlers() {
    log('服务器点击', '开始绑定服务器卡片点击事件', '事件绑定');

    // 使用事件委托，在父元素上监听点击事件
    const serverList = document.getElementById('serverList');
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

// 定义点击事件处理函数
function handleServerCardClick(event) {
    // 检查点击的元素是否是服务器卡片或者是服务器卡片内的元素
    let card = event.target.closest('.server-card');
    if (!card) return;

    // 阻止事件冒泡，避免干扰其他事件
    event.stopPropagation();

    // 检查是否点击了服务器状态或其他不应触发连接的元素
    const clickedStatus = event.target.closest('.server-status');
    const clickedButton = event.target.closest('button');
    const clickedLink = event.target.closest('a');
    
    // 如果点击了状态、按钮或链接，不触发服务器连接
    if (clickedStatus || clickedButton || clickedLink) {
        return;
    }

    // 获取服务器主机地址
    const uuid = card.getAttribute('data-uuid');
    if (uuid) {
        log('服务器点击', `用户点击了服务器: ${uuid}`, '点击处理');
        connectToServer(uuid);
    }
}
