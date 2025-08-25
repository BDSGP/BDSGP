// =============================================================================
// 配置文件 - 存储应用常量和配置
// =============================================================================

/**
 * 应用主API配置
 * 包含基础URL、超时设置等API请求相关配置
 */
const API_CONFIG = {
    baseUrl: "https://api.bdsgp.cn/get",
    timeout: 5000,  // 请求超时时间（毫秒）
    retryCount: 2,  // 请求失败时的重试次数
    retryDelay: 1000  // 重试间隔时间（毫秒）
};

/**
 * MOTD API配置
 * 用于获取服务器MOTD（Message Of The Day）信息的API配置
 */
const MOTD_API_CONFIG = {
    baseUrl: "https://motdbe.blackbe.work/api",
    timeout: 10000,  // 请求超时时间（毫秒）
    retryCount: 1,  // 请求失败时的重试次数
    retryDelay: 1500  // 重试间隔时间（毫秒）
};

/**
 * UI配置
 * 包含用户界面相关的配置选项
 */
const UI_CONFIG = {
    defaultView: "grid",  // 默认视图模式：grid（网格）或list（列表）
    itemsPerRow: 2,       // 默认每行显示的项目数
    animationDuration: 300, // UI动画持续时间（毫秒）
    theme: "light"         // 默认主题：light（浅色）或dark（深色）
};

/**
 * 服务器配置
 * 包含服务器相关的配置选项
 */
const SERVER_CONFIG = {
    maxRetryAttempts: 3,       // 最大重试尝试次数
    refreshInterval: 300000,   // 服务器信息刷新间隔（毫秒），默认5分钟
    defaultMaxPlayers: 0,     // 默认最大玩家数
    offlineTimeout: 15000      // 服务器离线超时时间（毫秒）
};

/**
 * 日志配置
 * 包含日志相关的配置选项
 */
const LOG_CONFIG = {
    enabled: true,      // 是否启用日志
    level: "debug",     // 日志级别：debug, info, warn, error
    maxCount: 1000      // 最大日志条数
};

// 日志计数器
let logCounter = 0;

// 导出所有配置
export {
    API_CONFIG,
    MOTD_API_CONFIG,
    UI_CONFIG,
    SERVER_CONFIG,
    LOG_CONFIG,
    logCounter
};
