
// 修复页面滚动条自动向下滑动的问题
document.addEventListener('DOMContentLoaded', function () {
    // 保存初始滚动位置
    const initialScrollPosition = window.scrollY || window.pageYOffset;

    // 在所有内容加载完成后恢复滚动位置
    window.addEventListener('load', function () {
        setTimeout(function () {
            window.scrollTo(0, initialScrollPosition);
        }, 100);
    });

    // 监听服务器列表加载完成事件
    document.addEventListener('serversLoaded', function () {
        // 服务器列表加载后可能会触发视图切换，延迟恢复滚动位置
        setTimeout(function () {
            window.scrollTo(0, initialScrollPosition);
        }, 300);
    });
});
