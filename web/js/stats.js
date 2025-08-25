// =============================================================================
// 统计数据模块 - 管理和更新页面顶部的统计数据
// =============================================================================

import { log } from './utils.js';
import { fetchServersList } from './api.js';

/**
 * 初始化统计数据动画
 * 当元素进入视口时，触发数字从0增长到目标值的动画
 */
export function initStatsAnimation() {
    log('统计数据', '初始化统计数据动画', '初始化');

    const statNumbers = document.querySelectorAll('.stat-number');

    // 创建观察器，当元素进入视口时触发动画
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = parseInt(entry.target.getAttribute('data-count'));
                console.log(`[统计数据] 元素进入视口，目标值: ${target}, 当前内容: ${entry.target.textContent}`);
                // 只在第一次加载时从0开始动画
                if (!entry.target.dataset.animated) {
                    animateNumber(entry.target, 0, target, 2000);
                    entry.target.dataset.animated = 'true';
                } else {
                    console.log(`[统计数据] 元素已经播放过动画，不重新播放`);
                }
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    // 观察所有统计数字元素
    statNumbers.forEach(stat => {
        observer.observe(stat);
    });
}

/**
 * 数字动画函数
 * @param {HTMLElement} element - 要动画的元素
 * @param {number} start - 起始值
 * @param {number} end - 结束值
 * @param {number} duration - 动画持续时间（毫秒）
 */
function animateNumber(element, start, end, duration) {
    log('统计数据', `开始数字动画: ${start} -> ${end}`, '动画');
    console.log(`[统计数据] 动画元素:`, element);
    console.log(`[统计数据] 元素data-count属性:`, element.getAttribute('data-count'));

    const startTime = performance.now();
    const lastValue = end; // 保存最终值

    function updateNumber(currentTime) {
        const elapsedTime = currentTime - startTime;
        let progress = Math.min(elapsedTime / duration, 1);

        // 当进度接近完成时，加速到最后一个数字
        if (progress > 0.85) {
            // 在最后15%的时间内，快速跳到最终值
            progress = 1;
        }

        // 使用缓动函数使动画更自然
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const currentValue = Math.floor(start + (end - start) * easeOutQuart);

        element.textContent = currentValue.toLocaleString();

        if (progress < 1) {
            requestAnimationFrame(updateNumber);
        } else {
            // 确保显示最终值
            element.textContent = lastValue.toLocaleString();
            log('统计数据', `数字动画完成: ${lastValue}`, '动画');
        }
    }

    requestAnimationFrame(updateNumber);
}

/**
 * 更新统计数据为实际的服务器数据
 */
export async function updateRealStats() {
    log('统计数据', '开始更新实际统计数据', '更新');

    try {
        // 添加延迟，确保服务器卡片信息已经更新完成
        await new Promise(resolve => setTimeout(resolve, 2000));
        // 获取服务器列表
        console.log('[统计数据] 开始获取服务器列表');
        const servers = await fetchServersList();
        console.log('[统计数据] 获取到的服务器列表：', servers);

        if (!servers || servers.length === 0) {
            log('统计数据', '未获取到服务器数据', '警告');
            return;
        }

        console.log(`[统计数据] 成功获取到 ${servers.length} 个服务器`);

        // 计算统计数据
        const totalServers = servers.length;
        let onlineServers = 0;
        let totalPlayers = 0;

        // 添加调试日志
        log('统计数据', `获取到${totalServers}个服务器`, '调试');
        console.log('[统计数据] 服务器数据示例：', servers[0]);

        // 从服务器卡片中获取玩家数量
        const serverCards = document.querySelectorAll('.server-card');
        console.log(`[统计数据] 找到 ${serverCards.length} 个服务器卡片`);

        serverCards.forEach(card => {
            const uuid = card.getAttribute('data-uuid');
            const serverName = card.querySelector('.server-name')?.textContent || '未知服务器';
            const onlineCountElem = card.querySelector('.online-count');

            if (!onlineCountElem) {
                console.log(`[统计数据] 服务器 ${serverName} 没有找到在线人数元素`);
                return;
            }

            const onlineCountText = onlineCountElem.textContent;
            console.log(`[统计数据] 服务器 ${serverName} 在线人数文本: ${onlineCountText}`);

            // 解析在线人数，格式为 "在线人数/最大人数" 或 "在线人数"
            const match = onlineCountText.match(/^(\d+)\/?(\d*)$/);
            if (!match) {
                console.log(`[统计数据] 服务器 ${serverName} 在线人数格式不正确: ${onlineCountText}`);
                return;
            }

            const playerCount = parseInt(match[1]);
            console.log(`[统计数据] 服务器 ${serverName} 在线人数: ${playerCount}`);

            // 检查服务器是否在线（通过检查status-dot是否有offline-dot类）
            const statusDot = card.querySelector('.status-dot');
            const isOnline = statusDot && !statusDot.classList.contains('offline-dot');
            
            if (isOnline) {
                onlineServers++;
                console.log(`[统计数据] 服务器 ${serverName} 在线`);
            } else {
                console.log(`[统计数据] 服务器 ${serverName} 离线`);
            }
            
            // 统计所有服务器的玩家数量
            if (playerCount > 0) {
                console.log(`[统计数据] 添加服务器 ${serverName} 的玩家数量: ${playerCount}`);
                totalPlayers += playerCount;
            }
        }
        );

        // 添加调试日志
        log('统计数据', `统计结果: 在线服务器${onlineServers}个, 总玩家数${totalPlayers}人`, '调试');

        // 更新页面上的统计数据
        const serverCountElement = document.querySelector('.stat-item:nth-child(1) .stat-number');
        const playerCountElement = document.querySelector('.stat-item:nth-child(2) .stat-number');

        // 添加调试信息
        console.log('[统计数据] 找到的元素：', {
            serverCountElement: !!serverCountElement,
            playerCountElement: !!playerCountElement
        });

        // 添加更多调试信息
        if (serverCountElement) {
            console.log('[统计数据] 服务器数量元素当前内容：', serverCountElement.textContent);
            console.log('[统计数据] 服务器数量元素data-count属性：', serverCountElement.getAttribute('data-count'));
        }

        if (playerCountElement) {
            console.log('[统计数据] 玩家数量元素当前内容：', playerCountElement.textContent);
            console.log('[统计数据] 玩家数量元素data-count属性：', playerCountElement.getAttribute('data-count'));
        }

        if (serverCountElement) {
            // 检查是否已经播放过初始动画
            const hasAnimated = serverCountElement.dataset.animated === 'true';

            // 保存当前显示的值
            const currentServerValue = parseInt(serverCountElement.textContent.replace(/,/g, '')) || 0;

            // 添加调试信息
            console.log(`[统计数据] 服务器数量: 当前值=${currentServerValue}, 新值=${onlineServers}, 已动画=${hasAnimated}`);

            // 更新数据属性
            serverCountElement.setAttribute('data-count', onlineServers);

            // 添加调试信息
            console.log(`[统计数据] 设置data-count属性后: ${serverCountElement.getAttribute('data-count')}`);

            // 强制更新文本内容，无论是否已经播放过动画
            serverCountElement.textContent = onlineServers.toLocaleString();
            console.log(`[统计数据] 强制更新文本内容为: ${onlineServers.toLocaleString()}`);
            console.log(`[统计数据] 更新后服务器数量元素内容：`, serverCountElement.textContent);
        }

        if (playerCountElement) {
            // 检查是否已经播放过初始动画
            const hasAnimated = playerCountElement.dataset.animated === 'true';

            // 保存当前显示的值
            const currentPlayerValue = parseInt(playerCountElement.textContent.replace(/,/g, '')) || 0;

            // 添加调试信息
            console.log(`[统计数据] 玩家数量: 当前值=${currentPlayerValue}, 新值=${totalPlayers}, 已动画=${hasAnimated}`);

            // 更新数据属性
            playerCountElement.setAttribute('data-count', totalPlayers);

            // 添加调试信息
            console.log(`[统计数据] 设置data-count属性后: ${playerCountElement.getAttribute('data-count')}`);

            // 强制更新文本内容，无论是否已经播放过动画
            playerCountElement.textContent = totalPlayers.toLocaleString();
            console.log(`[统计数据] 强制更新文本内容为: ${totalPlayers.toLocaleString()}`);
            console.log(`[统计数据] 更新后玩家数量元素内容：`, playerCountElement.textContent);
        }

        // 强制重新触发动画
        console.log(`[统计数据] 强制重新触发动画`);

        // 重置动画状态并设置初始值为0
        if (serverCountElement) {
            serverCountElement.dataset.animated = 'false';
            serverCountElement.textContent = '0';
            console.log(`[统计数据] 重置服务器数量动画状态并设置初始值为0`);
            console.log(`[统计数据] 服务器数量元素当前data-count: ${serverCountElement.getAttribute('data-count')}`);
        }
        if (playerCountElement) {
            playerCountElement.dataset.animated = 'false';
            playerCountElement.textContent = '0';
            console.log(`[统计数据] 重置玩家数量动画状态并设置初始值为0`);
            console.log(`[统计数据] 玩家数量元素当前data-count: ${playerCountElement.getAttribute('data-count')}`);
        }

        // 重新触发动画
        console.log(`[统计数据] 调用initStatsAnimation()`);

        // 直接调用动画函数，而不是通过观察器
        setTimeout(() => {
            if (serverCountElement) {
                const target = parseInt(serverCountElement.getAttribute('data-count'));
                console.log(`[统计数据] 直接调用服务器数量动画: 0 -> ${target}`);
                animateNumber(serverCountElement, 0, target, 2000);
                serverCountElement.dataset.animated = 'true';
            }

            if (playerCountElement) {
                const target = parseInt(playerCountElement.getAttribute('data-count'));
                console.log(`[统计数据] 直接调用玩家数量动画: 0 -> ${target}`);
                animateNumber(playerCountElement, 0, target, 2000);
                playerCountElement.dataset.animated = 'true';
            }
        }, 100);

        log('统计数据', `统计数据更新完成: ${onlineServers} 台服务器在线, ${totalPlayers} 名玩家在线`, '更新');
    } catch (error) {
        log('统计数据', `更新统计数据时出错: ${error.message}`, '错误');
        console.error('[统计数据] 更新统计数据时出错:', error);
    }
}

/**
 * 初始化统计数据
 * 只在页面加载时更新一次统计数据
 */
export function initStats() {
    log('统计数据', '初始化统计数据', '初始化');

    // 更新统计数据
    updateRealStats();
}
