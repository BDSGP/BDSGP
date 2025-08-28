// =============================================================================
// 服务器连接相关功能
// =============================================================================

import { log, createToast } from './utils.js';

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

    // 检查是否点击了服务器状态或其他不应触发跳转的元素
    const clickedStatus = event.target.closest('.server-status');
    const clickedButton = event.target.closest('button');
    const clickedLink = event.target.closest('a');

    // 如果点击了状态、按钮或链接，不触发服务器跳转
    if (clickedStatus || clickedButton || clickedLink) {
        return;
    }

    // 获取服务器UUID
    const uuid = card.getAttribute('data-uuid');
    if (uuid) {
        log('服务器点击', `用户点击了服务器: ${uuid}`, '点击处理');
        // 跳转到服务器详情页
        window.location.href = `./server-detail.html?uuid=${uuid}`;
    }
}
