<!--
 * 锁定界面组件
 * 当客户端被锁定时，显示此界面覆盖主窗口
-->
<template>
    <div class="lock-screen-container" @contextmenu.prevent="">
        <div class="lock-screen-content">
            <div class="lock-icon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 17C12.5523 17 13 16.5523 13 16C13 15.4477 12.5523 15 12 15C11.4477 15 11 15.4477 11 16C11 16.5523 11.4477 17 12 17Z" fill="currentColor"/>
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M7 8C7 5.23858 9.23858 3 12 3C14.7614 3 17 5.23858 17 8V9H18C19.1046 9 20 9.89543 20 11V19C20 20.1046 19.1046 21 18 21H6C4.89543 21 4 20.1046 4 19V11C4 9.89543 4.89543 9 6 9H7V8ZM9 9H15V8C15 6.34315 13.6569 5 12 5C10.3431 5 9 6.34315 9 8V9ZM6 11V19H18V11H6Z" fill="currentColor"/>
                </svg>
            </div>
            <div class="lock-title">客户端已锁定</div>
            <div class="lock-description">请在手机端解锁后继续使用</div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'LockScreenView',
}
</script>

<style scoped>
.lock-screen-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
    user-select: none;
}

.lock-screen-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    color: #ffffff;
    animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(-20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.lock-icon {
    width: 80px;
    height: 80px;
    margin-bottom: 24px;
    color: #e94560;
}

.lock-icon svg {
    width: 100%;
    height: 100%;
}

.lock-title {
    font-size: 24px;
    font-weight: 600;
    margin-bottom: 12px;
    letter-spacing: 1px;
}

.lock-description {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.7);
}
</style>
