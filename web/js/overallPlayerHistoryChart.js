
// =============================================================================
// 主页历史人数图表功能
// =============================================================================

import { log } from './utils.js';
import { fetchServersList } from './api.js';

// 全局变量，用于存储图表实例
let overallPlayerHistoryChart = null;
let serversData = [];
let selectedServers = []; // 存储选中的服务器数据
const MAX_SERVERS_IN_CHART = 5; // 图表中最多显示的服务器数量
const SERVER_COLORS = [
    '#6366f1', // 靛蓝色
    '#10b981', // 绿色
    '#f59e0b', // 琥珀色
    '#ef4444', // 红色
    '#8b5cf6'  // 紫色
]; // 为不同服务器分配的颜色

/**
 * 获取服务器历史人数数据
 * @param {string} uuid - 服务器UUID
 * @returns {Promise<Object>} - 包含历史人数数据的Promise对象
 */
export async function fetchPlayerHistory(uuid) {
    try {
        log('历史人数', `正在获取服务器历史人数数据，UUID：${uuid}`, 'API请求');

        const response = await fetch(`https://api.bdsgp.cn/get?uuid=${uuid}`);

        if (!response.ok) {
            throw new Error(`HTTP错误! 状态: ${response.status}`);
        }

        const data = await response.json();

        log('历史人数', '获取到历史人数数据', 'API响应');
        console.log('[历史人数] API响应数据：', data);

        if (data.status === 'success') {
            // 检查数据结构，处理不同的API响应格式
            if (data.data && data.data.status_history) {
                return data.data.status_history;
            } else if (data.status_history) {
                return data.status_history;
            } else {
                log('历史人数', 'API响应中未找到历史人数数据', 'API响应');
                return [];
            }
        } else {
            log('历史人数', 'API请求失败，无法获取历史人数数据', 'API响应');
            return [];
        }
    } catch (error) {
        log('历史人数', `获取历史人数数据时出错: ${error.message}`, '错误处理');
        console.error('[历史人数] 获取历史人数数据时出错:', error);
        return [];
    }
}

/**
 * 处理历史人数数据，转换为图表可用的格式
 * @param {Array} historyData - 原始历史人数数据
 * @returns {Object} - 处理后的图表数据
 */
export function processHistoryData(historyData, serverName, serverIndex) {
    console.log(`[历史人数] 开始处理服务器 ${serverName} 的历史数据:`, historyData);

    if (!historyData || !Array.isArray(historyData) || historyData.length === 0) {
        console.log(`[历史人数] 服务器 ${serverName} 的历史数据为空或格式不正确`);
        return null;
    }

    // 按时间排序
    const sortedData = [...historyData].sort((a, b) => {
        return new Date(a.query_time) - new Date(b.query_time);
    });

    console.log(`[历史人数] 服务器 ${serverName} 排序后的数据:`, sortedData);

    // 提取时间和人数数据
    const timeLabels = sortedData.map(item => {
        const date = new Date(item.query_time);
        return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
    });

    const playerCounts = sortedData.map(item => {
        const count = parseInt(item.player_count);
        return isNaN(count) ? 0 : count;
    });

    console.log(`[历史人数] 服务器 ${serverName} 处理后的标签数据:`, timeLabels);
    console.log(`[历史人数] 服务器 ${serverName} 处理后的人数数据:`, playerCounts);

    // 获取服务器颜色
    const colorIndex = serverIndex % SERVER_COLORS.length;
    const color = SERVER_COLORS[colorIndex];

    return {
        labels: timeLabels,
        data: playerCounts,
        serverName: serverName,
        dataset: {
            label: serverName,
            data: playerCounts,
            borderColor: color,
            backgroundColor: color + '20', // 添加透明度
            tension: 0.4,
            fill: false,
            pointBackgroundColor: '#fff',
            pointBorderColor: color,
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6
        }
    };
}

/**
 * 合并多个服务器的历史数据
 * @param {Array} serversHistoryData - 多个服务器的历史数据数组
 * @returns {Object} - 合并后的图表数据
 */
export function mergeServersHistoryData(serversHistoryData) {
    console.log('[历史人数] 开始合并多个服务器的历史数据:', serversHistoryData);

    if (!serversHistoryData || serversHistoryData.length === 0) {
        console.log('[历史人数] 没有服务器历史数据需要合并');
        return {
            labels: [],
            datasets: []
        };
    }

    // 收集所有时间点并去重
    const allTimeLabels = new Set();
    serversHistoryData.forEach(serverData => {
        if (serverData && serverData.labels) {
            serverData.labels.forEach(label => allTimeLabels.add(label));
        }
    });

    // 将时间点排序
    const sortedTimeLabels = Array.from(allTimeLabels).sort((a, b) => {
        const [aHour, aMinute] = a.split(':').map(Number);
        const [bHour, bMinute] = b.split(':').map(Number);
        return aHour * 60 + aMinute - (bHour * 60 + bMinute);
    });

    console.log('[历史人数] 合并后的时间标签:', sortedTimeLabels);

    // 为每个服务器创建数据集
    const datasets = [];
    serversHistoryData.forEach((serverData, index) => {
        if (!serverData) return;

        // 创建时间点到人数的映射
        const timeToCountMap = {};
        serverData.labels.forEach((label, i) => {
            timeToCountMap[label] = serverData.data[i];
        });

        // 根据合并后的时间标签创建新数据
        const mergedData = sortedTimeLabels.map(label => timeToCountMap[label] || 0);

        // 获取服务器颜色
        const colorIndex = index % SERVER_COLORS.length;
        const color = SERVER_COLORS[colorIndex];

        datasets.push({
            label: serverData.serverName,
            data: mergedData,
            borderColor: color,
            backgroundColor: color + '20', // 添加透明度
            tension: 0.4,
            fill: false,
            pointBackgroundColor: '#fff',
            pointBorderColor: color,
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6
        });
    });

    console.log('[历史人数] 合并后的数据集:', datasets);

    return {
        labels: sortedTimeLabels,
        datasets: datasets
    };
}

/**
 * 更新多服务器图表
 */
export function updateMultiServerChart() {
    try {
        log('历史人数图表', '更新多服务器图表', '图表更新');

        // 获取图表容器
        const ctx = document.getElementById('overallPlayerHistoryChart');
        if (!ctx) {
            log('历史人数图表', '未找到图表容器', '图表更新-错误');
            console.error('[历史人数图表] 未找到图表容器');
            return;
        }

        // 销毁现有图表（如果存在）
        if (overallPlayerHistoryChart) {
            overallPlayerHistoryChart.destroy();
        }

        // 检查Chart对象是否可用
        if (typeof Chart === 'undefined') {
            log('历史人数图表', 'Chart.js库未加载，无法创建图表', '图表更新-错误');
            console.error('[历史人数图表] Chart.js库未加载，无法创建图表');
            return;
        }

        // 如果没有选中的服务器，创建空图表
        if (selectedServers.length === 0) {
            overallPlayerHistoryChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: []
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: '服务器在线人数历史对比',
                            font: {
                                size: 18,
                                weight: 'bold'
                            },
                            padding: {
                                top: 10,
                                bottom: 20
                            }
                        },
                        legend: {
                            display: true,
                            position: 'top'
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: '在线人数',
                                font: {
                                    size: 14,
                                    weight: 'bold'
                                }
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: '时间',
                                font: {
                                    size: 14,
                                    weight: 'bold'
                                }
                            }
                        }
                    }
                }
            });
            // 更新服务器选择标签
            createServerSelectionTags();
            return;
        }

        // 合并所有服务器的历史数据
        const serversHistoryData = selectedServers.map(server => server.data);
        const chartData = mergeServersHistoryData(serversHistoryData);

        // 创建新图表
        overallPlayerHistoryChart = new Chart(ctx, {
            type: 'line',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                plugins: {
                    title: {
                        display: true,
                        text: '服务器在线人数历史对比',
                        font: {
                            size: 18,
                            weight: 'bold'
                        },
                        padding: {
                            top: 10,
                            bottom: 20
                        }
                    },
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 15,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        titleFont: {
                            size: 14,
                            weight: 'bold'
                        },
                        bodyFont: {
                            size: 13
                        },
                        padding: 10,
                        cornerRadius: 6,
                        displayColors: true,
                        callbacks: {
                            title: function(tooltipItems) {
                                // 获取原始数据中的完整时间
                                const index = tooltipItems[0].dataIndex;
                                // 使用第一个数据集的时间作为标题
                                if (chartData.labels && chartData.labels[index]) {
                                    return `时间: ${chartData.labels[index]}`;
                                }
                                return '';
                            },
                            label: function(context) {
                                return `${context.dataset.label}: ${context.parsed.y} 人`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: '在线人数',
                            font: {
                                size: 14,
                                weight: 'bold'
                            }
                        },
                        ticks: {
                            precision: 0,
                            font: {
                                size: 12
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: '时间',
                            font: {
                                size: 14,
                                weight: 'bold'
                            }
                        },
                        ticks: {
                            font: {
                                size: 12
                            },
                            maxRotation: 45,
                            minRotation: 45
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    }
                },
                elements: {
                    line: {
                        borderWidth: 3,
                        tension: 0.4
                    },
                    point: {
                        radius: 4,
                        hoverRadius: 6,
                        hitRadius: 10,
                        borderWidth: 2,
                        backgroundColor: '#fff'
                    }
                }
            }
        });

        // 更新服务器选择标签
        createServerSelectionTags();

        log('历史人数图表', '多服务器图表更新成功', '图表更新');
    } catch (error) {
        log('历史人数图表', `更新多服务器图表时出错: ${error.message}`, '错误处理');
        console.error('[历史人数图表] 更新多服务器图表时出错:', error);
    }
}

/**
 * 创建或更新历史人数图表
 * @param {string} uuid - 服务器UUID
 * @param {string} serverName - 服务器名称
 */
async function createOrUpdateOverallPlayerHistoryChartOriginal(uuid, serverName) {
    try {
        log('历史人数图表', `开始创建或更新历史人数图表，服务器：${serverName}`, '图表初始化');

        // 获取历史数据
        const historyData = await fetchPlayerHistory(uuid);

        // 处理数据
        const chartData = processHistoryData(historyData);

        // 获取图表容器
        const ctx = document.getElementById('overallPlayerHistoryChart');
        if (!ctx) {
            log('历史人数图表', '未找到图表容器', '图表初始化-错误');
            console.error('[历史人数图表] 未找到图表容器');
            return;
        }

        // 销毁现有图表（如果存在）
        if (overallPlayerHistoryChart) {
            overallPlayerHistoryChart.destroy();
        }

        // 检查Chart对象是否可用
        if (typeof Chart === 'undefined') {
            log('历史人数图表', 'Chart.js库未加载，无法创建图表', '图表初始化-错误');
            console.error('[历史人数图表] Chart.js库未加载，无法创建图表');
            return;
        }

        // 创建新图表
        overallPlayerHistoryChart = new Chart(ctx, {
            type: 'line',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                plugins: {
                    title: {
                        display: true,
                        text: '服务器在线人数历史对比',
                        font: {
                            size: 18,
                            weight: 'bold'
                        },
                        padding: {
                            top: 10,
                            bottom: 20
                        }
                    },
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 15,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        titleFont: {
                            size: 14,
                            weight: 'bold'
                        },
                        bodyFont: {
                            size: 13
                        },
                        padding: 10,
                        cornerRadius: 6,
                        displayColors: true,
                        callbacks: {
                            title: function(tooltipItems) {
                                // 获取原始数据中的完整时间
                                const index = tooltipItems[0].dataIndex;
                                // 使用第一个数据集的时间作为标题
                                if (chartData.labels && chartData.labels[index]) {
                                    return `时间: ${chartData.labels[index]}`;
                                }
                                return '';
                            },
                            label: function(context) {
                                return `${context.dataset.label}: ${context.parsed.y} 人`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: '在线人数',
                            font: {
                                size: 14,
                                weight: 'bold'
                            }
                        },
                        ticks: {
                            precision: 0,
                            font: {
                                size: 12
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: '时间',
                            font: {
                                size: 14,
                                weight: 'bold'
                            }
                        },
                        ticks: {
                            font: {
                                size: 12
                            },
                            maxRotation: 45,
                            minRotation: 45
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    }
                },
                elements: {
                    line: {
                        borderWidth: 3,
                        tension: 0.4
                    },
                    point: {
                        radius: 4,
                        hoverRadius: 6,
                        hitRadius: 10,
                        borderWidth: 2,
                        backgroundColor: '#fff'
                    }
                }
            }
        });

        log('历史人数图表', '多服务器图表更新成功', '图表更新');
    } catch (error) {
        log('历史人数图表', `更新多服务器图表时出错: ${error.message}`, '错误处理');
        console.error('[历史人数图表] 更新多服务器图表时出错:', error);
    }
}

/**
 * 添加服务器到图表
 * @param {string} uuid - 服务器UUID
 * @param {string} serverName - 服务器名称
 */
export async function addServerToChart(uuid, serverName) {
    try {
        log('历史人数图表', `添加服务器到图表：${serverName}`, '图表更新');

        // 检查是否已经添加了该服务器
        const existingServerIndex = selectedServers.findIndex(server => server.uuid === uuid);
        if (existingServerIndex !== -1) {
            log('历史人数图表', `服务器 ${serverName} 已在图表中`, '图表更新');
            return;
        }

        // 检查是否已达到最大服务器数量
        if (selectedServers.length >= MAX_SERVERS_IN_CHART) {
            log('历史人数图表', `已达到最大服务器数量 ${MAX_SERVERS_IN_CHART}`, '图表更新-限制');
            // 可以添加提示信息
            const chartContainer = document.querySelector('.chart-section');
            if (chartContainer) {
                let notification = chartContainer.querySelector('.chart-notification');
                if (!notification) {
                    notification = document.createElement('div');
                    notification.className = 'chart-notification';
                    chartContainer.appendChild(notification);
                }
                notification.textContent = `最多只能同时显示 ${MAX_SERVERS_IN_CHART} 个服务器的数据`;
                notification.style.display = 'block';

                // 3秒后隐藏通知
                setTimeout(() => {
                    notification.style.display = 'none';
                }, 3000);
            }
            return;
        }

        // 获取历史数据
        const historyData = await fetchPlayerHistory(uuid);

        // 处理数据
        const processedData = processHistoryData(historyData, serverName, selectedServers.length);

        if (!processedData) {
            log('历史人数图表', `服务器 ${serverName} 的历史数据处理失败`, '图表更新-错误');
            return;
        }

        // 添加到选中服务器列表
        selectedServers.push({
            uuid: uuid,
            name: serverName,
            data: processedData
        });

        // 更新图表
        updateMultiServerChart();

        // 更新服务器选择标签
        createServerSelectionTags();

        log('历史人数图表', `成功添加服务器 ${serverName} 到图表`, '图表更新');
    } catch (error) {
        log('历史人数图表', `添加服务器到图表时出错: ${error.message}`, '错误处理');
        console.error('[历史人数图表] 添加服务器到图表时出错:', error);
    }
}

/**
 * 从图表中移除服务器
 * @param {string} uuid - 服务器UUID
 */
export function removeServerFromChart(uuid) {
    try {
        log('历史人数图表', `从图表中移除服务器，UUID：${uuid}`, '图表更新');

        // 从选中服务器列表中移除
        const index = selectedServers.findIndex(server => server.uuid === uuid);
        if (index === -1) {
            log('历史人数图表', `服务器不在图表中，无需移除`, '图表更新');
            return;
        }

        const removedServer = selectedServers.splice(index, 1)[0];
        log('历史人数图表', `已移除服务器 ${removedServer.name}`, '图表更新');

        // 更新图表
        updateMultiServerChart();

        // 更新服务器选择标签
        createServerSelectionTags();
    } catch (error) {
        log('历史人数图表', `从图表中移除服务器时出错: ${error.message}`, '错误处理');
        console.error('[历史人数图表] 从图表中移除服务器时出错:', error);
    }
}

/**
 * 创建或更新历史人数图表（保留原函数以兼容旧代码）
 * @param {string} uuid - 服务器UUID
 * @param {string} serverName - 服务器名称
 */
export async function createOrUpdateOverallPlayerHistoryChartLegacy(uuid, serverName) {
    // 清空已选择的服务器
    selectedServers = [];

    // 添加新服务器
    await addServerToChart(uuid, serverName);
}

// 为了兼容旧代码，创建一个别名
export const createOrUpdateOverallPlayerHistoryChart = createOrUpdateOverallPlayerHistoryChartLegacy;

/**
 * 初始化服务器选择下拉菜单
 */
export async function initServerSelect() {
    try {
        // 获取服务器列表
        serversData = await fetchServersList();

        // 获取选择下拉菜单
        const serverSelect = document.getElementById('serverSelectForChart');
        if (!serverSelect) {
            log('服务器选择', '未找到服务器选择下拉菜单', '初始化-错误');
            console.error('[服务器选择] 未找到服务器选择下拉菜单');
            return;
        }

        // 清空现有选项（保留第一个默认选项）
        while (serverSelect.options.length > 1) {
            serverSelect.remove(1);
        }

        // 添加服务器选项
        serversData.forEach(server => {
            const option = document.createElement('option');
            option.value = server.uuid;
            option.textContent = server.name;
            serverSelect.appendChild(option);
        });

        // 添加选择变化事件监听器
        serverSelect.addEventListener('change', function() {
            const selectedUuid = this.value;
            if (selectedUuid) {
                const selectedServer = serversData.find(server => server.uuid === selectedUuid);
                if (selectedServer) {
                    // 添加服务器到图表，而不是替换
                    addServerToChart(selectedUuid, selectedServer.name);
                }
            }
            // 不再清空图表，允许用户添加多个服务器
        });

        log('服务器选择', '服务器选择下拉菜单初始化成功', '初始化');
    } catch (error) {
        log('服务器选择', `初始化服务器选择下拉菜单时出错: ${error.message}`, '错误处理');
        console.error('[服务器选择] 初始化服务器选择下拉菜单时出错:', error);
    }
}

/**
 * 创建服务器选择标签
 */
function createServerSelectionTags() {
    // 获取图表控制区域
    const chartControls = document.querySelector('.chart-controls');
    if (!chartControls) {
        return;
    }

    // 检查是否已存在标签容器
    let tagsContainer = chartControls.querySelector('.server-tags-container');
    if (!tagsContainer) {
        tagsContainer = document.createElement('div');
        tagsContainer.className = 'server-tags-container';
        chartControls.insertBefore(tagsContainer, chartControls.firstChild);
    } else {
        // 清空现有标签
        tagsContainer.innerHTML = '';
    }

    // 添加提示文本
    const promptText = document.createElement('span');
    promptText.className = 'tags-prompt';
    promptText.textContent = '已选择服务器：';
    tagsContainer.appendChild(promptText);

    // 为每个选中的服务器创建标签
    selectedServers.forEach(server => {
        const tag = document.createElement('div');
        tag.className = 'server-tag';
        tag.style.backgroundColor = SERVER_COLORS[selectedServers.indexOf(server) % SERVER_COLORS.length] + '20';
        tag.style.borderColor = SERVER_COLORS[selectedServers.indexOf(server) % SERVER_COLORS.length];

        const serverName = document.createElement('span');
        serverName.className = 'server-name';
        serverName.textContent = server.name;
        tag.appendChild(serverName);

        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-server';
        removeBtn.innerHTML = '&times;';
        removeBtn.title = '从图表中移除';
        removeBtn.addEventListener('click', () => {
            removeServerFromChart(server.uuid);
        });

        tag.appendChild(removeBtn);
        tagsContainer.appendChild(tag);
    });

    // 添加清空按钮（如果有选中的服务器）
    if (selectedServers.length > 0) {
        const clearBtn = document.createElement('button');
        clearBtn.className = 'clear-servers-btn';
        clearBtn.textContent = '清空选择';
        clearBtn.addEventListener('click', () => {
            selectedServers = [];
            updateMultiServerChart();
            createServerSelectionTags();
        });
        tagsContainer.appendChild(clearBtn);
    }
}

/**
 * 添加所有服务器到图表
 */
export async function addAllServersToChart() {
    try {
        log('历史人数图表', '添加所有服务器到图表', '图表更新');

        // 清空已选择的服务器
        selectedServers = [];

        // 检查是否有服务器数据
        if (!serversData || serversData.length === 0) {
            log('历史人数图表', '没有可用的服务器数据', '图表更新-错误');
            return;
        }

        // 限制最多添加的服务器数量
        const serversToAdd = serversData.slice(0, MAX_SERVERS_IN_CHART);

        // 为每个服务器获取历史数据并添加到图表
        for (const server of serversToAdd) {
            try {
                // 获取历史数据
                const historyData = await fetchPlayerHistory(server.uuid);

                // 处理数据
                const processedData = processHistoryData(historyData, server.name, selectedServers.length);

                if (processedData) {
                    // 添加到选中服务器列表
                    selectedServers.push({
                        uuid: server.uuid,
                        name: server.name,
                        data: processedData
                    });
                }
            } catch (error) {
                console.error(`[历史人数图表] 获取服务器 ${server.name} 的历史数据时出错:`, error);
            }
        }

        // 更新图表
        updateMultiServerChart();

        // 更新服务器选择标签
        createServerSelectionTags();

        // 如果服务器数量超过限制，显示通知
        if (serversData.length > MAX_SERVERS_IN_CHART) {
            const chartContainer = document.querySelector('.chart-section');
            if (chartContainer) {
                let notification = chartContainer.querySelector('.chart-notification');
                if (!notification) {
                    notification = document.createElement('div');
                    notification.className = 'chart-notification';
                    chartContainer.appendChild(notification);
                }
                notification.textContent = `由于数量限制，仅显示了前 ${MAX_SERVERS_IN_CHART} 个服务器（共 ${serversData.length} 个）`;
                notification.style.display = 'block';

                // 5秒后隐藏通知
                setTimeout(() => {
                    notification.style.display = 'none';
                }, 5000);
            }
        }

        log('历史人数图表', `成功添加 ${selectedServers.length} 个服务器到图表`, '图表更新');
    } catch (error) {
        log('历史人数图表', `添加所有服务器到图表时出错: ${error.message}`, '错误处理');
        console.error('[历史人数图表] 添加所有服务器到图表时出错:', error);
    }
}

/**
 * 初始化主页历史人数图表功能
 */
export function initOverallPlayerHistoryChart() {
    log('历史人数图表', '初始化主页历史人数图表功能', '初始化');

    // 初始化服务器选择下拉菜单
    initServerSelect();

    // 添加显示全部服务器按钮事件监听器
    const showAllBtn = document.getElementById('showAllServersBtn');
    if (showAllBtn) {
        showAllBtn.addEventListener('click', function() {
            // 添加旋转动画
            this.classList.add('spinning');

            // 添加所有服务器到图表
            addAllServersToChart().finally(() => {
                // 移除旋转动画
                setTimeout(() => {
                    this.classList.remove('spinning');
                }, 1000);
            });
        });
    }

    // 添加刷新按钮事件监听器
    const refreshBtn = document.getElementById('refreshChartBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            const serverSelect = document.getElementById('serverSelectForChart');
            if (serverSelect && serverSelect.value) {
                const selectedUuid = serverSelect.value;
                const selectedServer = serversData.find(server => server.uuid === selectedUuid);
                if (selectedServer) {
                    // 添加旋转动画
                    this.classList.add('spinning');

                    // 刷新图表
                    createOrUpdateOverallPlayerHistoryChart(selectedUuid, selectedServer.name);

                    // 移除旋转动画
                    setTimeout(() => {
                        this.classList.remove('spinning');
                    }, 1000);
                }
            }
        });
    }

    // 默认选择第一个服务器
    document.addEventListener('serversLoaded', function() {
        setTimeout(() => {
            const serverSelect = document.getElementById('serverSelectForChart');
            if (serverSelect && serverSelect.options.length > 1) {
                serverSelect.selectedIndex = 1;
                const event = new Event('change');
                serverSelect.dispatchEvent(event);
            }
        }, 1000);
    });
}
