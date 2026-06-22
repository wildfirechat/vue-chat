<template>
    <!-- 占位元素本身不占布局宽度，依靠各分栏自带的 border-right 作为分割线，
         内部 hit 区域绝对定位横跨边界，提供拖拽热区 -->
    <div class="resize-bar">
        <div class="resize-bar-hit"
             @mousedown="onMouseDown"
             @dblclick="onDoubleClick"></div>
    </div>
</template>

<script>
const STORAGE_KEY = 'listPanelWidth';
const MIN_WIDTH = 200;
const MAX_WIDTH = 400;
const DEFAULT_WIDTH = 261;
const CSS_VAR = '--list-panel-width';

function clamp(w) {
    return Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, w));
}

// 当前已应用的列表分栏宽度（优先读 localStorage）
export function getListPanelWidth() {
    let w = parseInt(localStorage.getItem(STORAGE_KEY), 10);
    if (!w || isNaN(w)) {
        w = DEFAULT_WIDTH;
    }
    return clamp(w);
}

// 应用宽度到全局 CSS 变量（不持久化），各分栏页面统一使用该变量
export function applyListPanelWidth(w) {
    document.documentElement.style.setProperty(CSS_VAR, clamp(w) + 'px');
}

// 在应用启动时调用，恢复用户上次拖拽的分栏宽度
export function restoreListPanelWidth() {
    applyListPanelWidth(getListPanelWidth());
}

export default {
    name: "ResizeBar",
    data() {
        return {
            startX: 0,
            startWidth: 0,
        };
    },
    methods: {
        onMouseDown(e) {
            this.startX = e.clientX;
            this.startWidth = getListPanelWidth();
            document.addEventListener('mousemove', this.onMouseMove);
            document.addEventListener('mouseup', this.onMouseUp);
            // 拖拽过程中禁止选中文字，并全局显示拖拽光标
            document.body.style.userSelect = 'none';
            document.body.style.cursor = 'col-resize';
            e.preventDefault();
        },
        onMouseMove(e) {
            const w = clamp(this.startWidth + (e.clientX - this.startX));
            applyListPanelWidth(w);
        },
        onMouseUp() {
            document.removeEventListener('mousemove', this.onMouseMove);
            document.removeEventListener('mouseup', this.onMouseUp);
            document.body.style.userSelect = '';
            document.body.style.cursor = '';
            const w = clamp(this.startWidth || DEFAULT_WIDTH);
            const cur = parseInt(getComputedStyle(document.documentElement).getPropertyValue(CSS_VAR), 10);
            localStorage.setItem(STORAGE_KEY, isNaN(cur) ? w : cur);
        },
        // 双击恢复默认宽度
        onDoubleClick() {
            applyListPanelWidth(DEFAULT_WIDTH);
            localStorage.setItem(STORAGE_KEY, DEFAULT_WIDTH);
        },
    },
};
</script>

<style lang="css" scoped>
/* 零宽度占位，不挤占布局，避免分割线右侧出现细缝 */
.resize-bar {
    position: relative;
    flex: 0 0 0;
    width: 0;
    align-self: stretch;
    z-index: 10;
}

/* 横跨分栏边界的拖拽热区（不可见，仅提供光标与命中范围） */
.resize-bar-hit {
    position: absolute;
    top: 0;
    bottom: 0;
    left: -3px;
    width: 6px;
    cursor: col-resize;
    /* 防止 Electron 下被识别为窗口拖拽区域 */
    -webkit-app-region: no-drag;
}
</style>
