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
 * 等待所有服务器MOTD API请求完成
 * @returns {Promise} 当所有服务器MOTD API请求完成时解析
 */
function waitForAllServersMotdComplete() {
    return new Promise((resolve) => {
        // 检查所有服务器卡片是否已完成MOTD API请求
        const checkAllServersComplete = () => {
            const serverCards = document.querySelectorAll('.server-card');
            let allComplete = true;

            serverCards.forEach(card => {
                const onlineCountElem = card.querySelector('.online-count');
                if (onlineCountElem) {
                    const text = onlineCountElem.textContent;
                    // 如果显示的是"加载中..."或类似状态，则认为未完成
                    if (text.includes('加载') || text.includes('...') || text === '-') {
                        allComplete = false;
                    }
                } else {
                    allComplete = false;
                }
            });

            if (allComplete) {
                console.log('[统计数据] 所有服务器MOTD API请求已完成');
                resolve();
            } else {
                // 100ms后再次检查
                setTimeout(checkAllServersComplete, 100);
            }
        };

        // 开始检查
        checkAllServersComplete();
    });
}

/**
 * 更新统计数据为实际的服务器数据
 * 该函数会获取服务器列表，统计在线服务器数量和总玩家数，
 * 并在页面上以动画形式更新这些统计数据
 */
export async function updateRealStats() {
    // 记录开始更新的日志
    log('统计数据', '开始更新实际统计数据', '更新');

    try {
        // 1. 预处理和获取数据
        // 获取服务器列表
        console.log('[统计数据] 开始获取服务器列表');
        const servers = await fetchServersList();
        console.log('[统计数据] 获取到的服务器列表：', servers);

        // 验证服务器数据
        if (!servers || servers.length === 0) {
            log('统计数据', '未获取到服务器数据', '警告');
            return;
        }

        console.log(`[统计数据] 成功获取到 ${servers.length} 个服务器`);

        // 等待所有服务器MOTD API请求完成
        console.log('[统计数据] 等待所有服务器MOTD API请求完成');
        await waitForAllServersMotdComplete();

        // 2. 初始化统计变量
        let onlineServers = 0;
        let totalPlayers = 0;

        // 3. 处理服务器卡片数据
        const serverCards = document.querySelectorAll('.server-card');
        console.log(`[统计数据] 找到 ${serverCards.length} 个服务器卡片`);

        // 遍历所有服务器卡片进行统计
        serverCards.forEach(card => {
            // 获取服务器基本信息
            const serverName = card.querySelector('.server-name')?.textContent || '未知服务器';
            const onlineCountElem = card.querySelector('.online-count');

            // 验证在线人数元素
            if (!onlineCountElem) {
                console.log(`[统计数据] 服务器 ${serverName} 没有找到在线人数元素`);
                return;
            }

            // 解析在线人数
            const onlineCountText = onlineCountElem.textContent;
            const match = onlineCountText.match(/^(\d+)\/?(\d*)$/);
            if (!match) {
                console.log(`[统计数据] 服务器 ${serverName} 在线人数格式不正确: ${onlineCountText}`);
                return;
            }

            const playerCount = parseInt(match[1]);
            const statusDot = card.querySelector('.status-dot');
            const isOnline = statusDot && !statusDot.classList.contains('offline-dot');

            // 更新统计
            if (isOnline) {
                onlineServers++;
                console.log(`[统计数据] 服务器 ${serverName} 在线`);
            } else {
                console.log(`[统计数据] 服务器 ${serverName} 离线`);
            }

            if (playerCount > 0) {
                totalPlayers += playerCount;
                console.log(`[统计数据] 添加服务器 ${serverName} 的玩家数量: ${playerCount}`);
            }
        });

        // 4. 更新页面显示
        // 获取统计显示元素
        const serverCountElement = document.querySelector('.stat-item:nth-child(1) .stat-number');
        const playerCountElement = document.querySelector('.stat-item:nth-child(2) .stat-number');

        // 更新服务器数量显示
        if (serverCountElement) {
            updateStatElement(serverCountElement, onlineServers, '服务器数量');
        }

        // 更新玩家数量显示
        if (playerCountElement) {
            updateStatElement(playerCountElement, totalPlayers, '玩家数量');
        }

        // 5. 触发动画效果
        triggerStatAnimation(serverCountElement, playerCountElement);

        // 记录完成日志
        log('统计数据', `统计数据更新完成: ${onlineServers} 台服务器在线, ${totalPlayers} 名玩家在线`, '更新');
    } catch (error) {
        // 错误处理
        log('统计数据', `更新统计数据时出错: ${error.message}`, '错误');
        console.error('[统计数据] 更新统计数据时出错:', error);
    }
}

/**
 * 更新统计元素的内容和属性
 * @param {HTMLElement} element - 统计显示元素
 * @param {number} value - 新的数值
 * @param {string} type - 统计类型（用于日志）
 */
function updateStatElement(element, value, type) {
    // 记录当前状态
    console.log(`[统计数据] ${type} - 当前值: ${element.textContent}, 新值: ${value}`);

    // 更新数据属性和显示文本
    element.setAttribute('data-count', value);
    element.textContent = value.toLocaleString();

    // 重置动画状态
    element.dataset.animated = 'false';
    element.textContent = '0';

    console.log(`[统计数据] ${type} - 更新后data-count: ${element.getAttribute('data-count')}`);
}

/**
 * 触发统计数字动画
 * @param {HTMLElement} serverElement - 服务器数量元素
 * @param {HTMLElement} playerElement - 玩家数量元素
 */
function triggerStatAnimation(serverElement, playerElement) {
    console.log('[统计数据] 开始触发动画');

    setTimeout(() => {
        if (serverElement) {
            const target = parseInt(serverElement.getAttribute('data-count'));
            console.log(`[统计数据] 服务器数量动画: 0 -> ${target}`);
            animateNumber(serverElement, 0, target, 2000);
            serverElement.dataset.animated = 'true';
        }

        if (playerElement) {
            const target = parseInt(playerElement.getAttribute('data-count'));
            console.log(`[统计数据] 玩家数量动画: 0 -> ${target}`);
            animateNumber(playerElement, 0, target, 2000);
            playerElement.dataset.animated = 'true';
        }
    }, 100);
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