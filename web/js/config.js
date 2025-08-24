// =============================================================================
// 配置文件 - 存储应用常量和配置
// =============================================================================

// API配置
const API_CONFIG = {
    baseUrl: "http://192.168.3.11:20001/get",
    timeout: 5000  // 请求超时时间（毫秒）
};

// MOTD API配置
const MOTD_API_CONFIG = {
    baseUrl: "https://motdbe.blackbe.work/api",
    timeout: 10000  // 请求超时时间（毫秒）
}

// 日志计数器
let logCounter = 0;

// 导出配置
export { API_CONFIG, MOTD_API_CONFIG, logCounter };
