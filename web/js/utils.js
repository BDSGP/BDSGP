// =============================================================================
// 工具函数
// =============================================================================

/**
 * 日志记录函数
 * @param {string} module - 模块名称
 * @param {string} message - 日志消息
 * @param {string} type - 日志类型
 */
export function log(module, message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] [${module}] ${type.toUpperCase()}: ${message}`;

    // 根据类型设置不同的样式
    let style = '';
    switch (type) {
        case 'error':
            style = 'color: #ff4757; font-weight: bold;';
            break;
        case 'warning':
            style = 'color: #ffa502; font-weight: bold;';
            break;
        case 'success':
            style = 'color: #2ed573; font-weight: bold;';
            break;
        default:
            style = 'color: #3498db;';
    }

    // 在控制台输出带样式的日志
    console.log(`%c${logMessage}`, style);

    // 如果是在开发环境，也可以将日志存储到本地，方便调试
    if (window.localStorage && window.location.hostname === 'localhost') {
        const logs = JSON.parse(localStorage.getItem('appLogs') || '[]');
        logs.push({
            timestamp: new Date().toISOString(),
            module,
            message,
            type
        });

        // 限制日志数量，避免占用过多存储空间
        if (logs.length > 100) {
            logs.shift();
        }

        localStorage.setItem('appLogs', JSON.stringify(logs));
    }
}

/**
 * 防抖函数
 * @param {Function} func - 要执行的函数
 * @param {number} wait - 等待时间（毫秒）
 * @returns {Function} - 防抖处理后的函数
 */
export function debounce(func, wait) {
    let timeout;
    return function (...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

/**
 * 节流函数
 * @param {Function} func - 要执行的函数
 * @param {number} limit - 时间限制（毫秒）
 * @returns {Function} - 节流处理后的函数
 */
export function throttle(func, limit) {
    let inThrottle;
    return function (...args) {
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * 格式化文件大小
 * @param {number} bytes - 字节数
 * @returns {string} - 格式化后的文件大小
 */
export function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 深拷贝函数
 * @param {*} obj - 要拷贝的对象
 * @returns {*} - 拷贝后的对象
 */
export function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;

    // 处理日期对象
    if (obj instanceof Date) {
        const copy = new Date();
        copy.setTime(obj.getTime());
        return copy;
    }

    // 处理数组
    if (obj instanceof Array) {
        const copy = [];
        for (let i = 0; i < obj.length; i++) {
            copy[i] = deepClone(obj[i]);
        }
        return copy;
    }

    // 处理对象
    if (obj instanceof Object) {
        const copy = {};
        for (const attr in obj) {
            if (obj.hasOwnProperty(attr)) {
                copy[attr] = deepClone(obj[attr]);
            }
        }
        return copy;
    }

}

/**
 * 创建提示信息
 * @param {string} message - 提示信息内容
 * @param {string} type - 提示类型（默认为info）
 * @returns {HTMLElement} - 提示信息元素
 */
export function createToast(message, type = 'info') {
    log('提示信息', `创建${type}类型提示: ${message}`, '提示信息创建');

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;

    // 添加到页面
    document.body.appendChild(toast);

    // 显示动画
    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
    }, 10);

    // 自动隐藏
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-20px)';

        // 从DOM中移除
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);

    return toast;
}
