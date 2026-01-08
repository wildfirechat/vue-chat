<template>
    <div v-if="visible" class="slide-verify-overlay" @click="handleOverlayClick">
        <div class="slide-verify-container" @click.stop>
            <div class="slide-verify-header">
                <span class="title">安全验证</span>
            </div>

            <div class="slide-verify-content" v-loading="loading" element-loading-text="加载中..." element-loading-background="rgba(255, 255, 255, 0.9)">
                <!-- 背景图 -->
                <div class="image-container">
                    <img ref="backgroundImage" class="background-image" :src="backgroundImage" alt="">
                    <img ref="sliderImage" class="slider-image" :src="sliderImage" alt="" :style="{top: sliderImageTop + 'px'}">
                </div>

                <!-- 滑块轨道 -->
                <div class="slider-track-container">
                    <div class="slider-track" ref="sliderTrack">
                        <div class="slider-hint" :style="{opacity: hintOpacity}">向右滑动完成验证</div>
                        <div
                            class="slider-button"
                            ref="sliderButton"
                            @mousedown="handleMouseDown"
                            :class="{'verified': isVerified}"
                        >
                            <svg v-if="!isVerified" t="1704654172740" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="20" height="20">
                                <path d="M512 192C335.36 192 192 335.36 192 512s143.36 320 320 320 320-143.36 320-320S688.64 192 512 192z m0 704C299.84 896 128 724.16 128 512S299.84 128 512 128s384 171.84 384 384-171.84 384-384 384z" fill="#999999" p-id="2082"></path>
                                <path d="M665.6 456.96l-134.4-134.4-19.2 19.2 115.2 115.2-115.2 115.2 19.2 19.2 134.4-134.4z" fill="#999999" p-id="2083"></path>
                            </svg>
                            <svg v-else t="1704654243869" class="icon success" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="20" height="20">
                                <path d="M384 690.752L192 499.712l-45.248 45.248L384 781.248l512-512-45.248-45.248z" fill="#4CAF50"></path>
                            </svg>
                        </div>
                    </div>
                </div>

                <!-- 刷新按钮 -->
                <div class="refresh-button" @click="refreshVerify" title="刷新验证码">
                    <svg t="1704654321234" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="20" height="20">
                        <path d="M960 448H512v-128l-192 192 192 192v-128h352v-128z" fill="#666666" p-id="2590"></path>
                        <path d="M512 192c-212.064 0-384 171.936-384 384s171.936 384 384 384 384-171.936 384-384-171.936-384-384-384z m0 640c-141.376 0-256-114.624-256-256s114.624-256 256-256 256 114.624 256 256-114.624 256-256 256z" fill="#666666" p-id="2591"></path>
                    </svg>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import appServerApi from '../../api/appServerApi';

export default {
    name: 'SlideVerifyDialog',
    emits: ['verify-success', 'verify-failed', 'load-failed'],
    data() {
        return {
            visible: false,
            loading: false,
            token: null,
            sliderY: 0,
            backgroundImage: '',
            sliderImage: '',
            sliderImageTop: 0,

            isDragging: false,
            startX: 0,
            currentX: 0,
            isVerified: false,
            hintOpacity: 1,

            scaleX: 1,
            scaleY: 1,
            imageOffsetX: 0,  // 背景图在容器中的水平偏移
            imageRenderWidth: 0,  // 背景图实际渲染宽度
        }
    },
    methods: {
        show() {
            this.visible = true;
            this.loadVerifyCode();
        },

        hide() {
            this.visible = false;
            this.reset();
        },

        async loadVerifyCode() {
            this.loading = true;
            try {
                console.log('[SlideVerify] 开始加载验证码...');
                const response = await appServerApi.getSlideVerify();
                console.log('[SlideVerify] 服务器响应:', response);
                this.loading = false;

                if (response && response.token && response.backgroundImage && response.sliderImage) {
                    this.token = response.token;
                    this.sliderY = response.y;
                    console.log('[SlideVerify] Token:', this.token, 'Y:', this.sliderY);

                    // 设置图片（后端已返回带前缀的 data URI）
                    this.backgroundImage = response.backgroundImage;
                    this.sliderImage = response.sliderImage;
                    console.log('[SlideVerify] 验证码图片加载成功');

                    // 等待图片加载完成后计算位置
                    this.$nextTick(() => {
                        this.calculateScale();
                    });
                } else {
                    console.error('[SlideVerify] 响应数据不完整:', response);
                    this.$emit('load-failed');
                    this.hide();
                }
            } catch (error) {
                this.loading = false;
                console.error('[SlideVerify] 加载验证码失败:', error);
                console.error('[SlideVerify] 错误详情:', error.message, error.stack);
                this.$emit('load-failed');
                this.hide();
            }
        },

        calculateScale() {
            const backgroundImage = this.$refs.backgroundImage;
            const imageContainer = backgroundImage?.parentElement;

            if (backgroundImage && imageContainer) {
                // 获取原始图片尺寸（后端返回的是 300x150）
                const naturalWidth = backgroundImage.naturalWidth || 300;
                const naturalHeight = backgroundImage.naturalHeight || 150;

                // 获取容器尺寸
                const containerWidth = imageContainer.offsetWidth;
                const containerHeight = imageContainer.offsetHeight;

                // 计算容器的宽高比和图片的宽高比
                const containerRatio = containerWidth / containerHeight;
                const imageRatio = naturalWidth / naturalHeight;

                // 根据 object-fit: contain 的逻辑计算实际渲染尺寸
                let renderWidth, renderHeight;

                if (imageRatio > containerRatio) {
                    // 图片更宽，按宽度适配，上下留白
                    renderWidth = containerWidth;
                    renderHeight = containerWidth / imageRatio;
                } else {
                    // 图片更高，按高度适配，左右留白
                    renderHeight = containerHeight;
                    renderWidth = containerHeight * imageRatio;
                }

                // 计算缩放比例
                this.scaleX = renderWidth / naturalWidth;
                this.scaleY = renderHeight / naturalHeight;

                // 计算图片在容器中的偏移量（用于定位滑块）
                const offsetX = (containerWidth - renderWidth) / 2;
                const offsetY = (containerHeight - renderHeight) / 2;

                // 保存偏移量和渲染宽度，供验证时使用
                this.imageOffsetX = offsetX;
                this.imageRenderWidth = renderWidth;

                // 计算滑块的 Y 坐标（需要加上图片的垂直偏移）
                this.sliderImageTop = offsetY + (this.sliderY * this.scaleY);

                console.log('[SlideVerify] 图片计算:');
                console.log('  原始尺寸: ' + naturalWidth + 'x' + naturalHeight);
                console.log('  容器尺寸: ' + containerWidth + 'x' + containerHeight);
                console.log('  实际渲染: ' + renderWidth.toFixed(1) + 'x' + renderHeight.toFixed(1));
                console.log('  偏移量: offsetX=' + offsetX.toFixed(1) + ', offsetY=' + offsetY.toFixed(1));
                console.log('  缩放比例: scaleX=' + this.scaleX.toFixed(3) + ', scaleY=' + this.scaleY.toFixed(3));
                console.log('  滑块位置: 原始Y=' + this.sliderY + ', 显示Y=' + this.sliderImageTop.toFixed(1));
            }
        },

        refreshVerify() {
            this.loadVerifyCode();
        },

        reset() {
            this.currentX = 0;
            this.isVerified = false;
            this.hintOpacity = 1;
            this.updateSliderPosition();
        },

        handleOverlayClick() {
            // 点击外部区域，取消验证
            this.hide();
            this.$emit('verify-failed');
            this.$notify({
                text: '已取消',
                type: 'info'
            });
        },

        handleMouseDown(e) {
            if (this.isVerified || this.loading) return;

            this.isDragging = true;
            this.startX = e.clientX - this.currentX;

            document.addEventListener('mousemove', this.handleMouseMove);
            document.addEventListener('mouseup', this.handleMouseUp);
        },

        handleMouseMove(e) {
            if (!this.isDragging) return;

            const sliderTrack = this.$refs.sliderTrack;
            const sliderButton = this.$refs.sliderButton;
            const maxDistance = sliderTrack.offsetWidth - sliderButton.offsetWidth;

            let newX = e.clientX - this.startX;
            newX = Math.max(0, Math.min(newX, maxDistance));

            this.currentX = newX;
            this.hintOpacity = 1 - (newX / maxDistance);
            this.updateSliderPosition();
        },

        handleMouseUp(e) {
            if (!this.isDragging) return;

            this.isDragging = false;
            document.removeEventListener('mousemove', this.handleMouseMove);
            document.removeEventListener('mouseup', this.handleMouseUp);

            const sliderTrack = this.$refs.sliderTrack;
            const sliderButton = this.$refs.sliderButton;
            const maxDistance = sliderTrack.offsetWidth - sliderButton.offsetWidth;

            console.log('[SlideVerify] 松开滑块 - 当前位置: ' + this.currentX.toFixed(1) + 'px, 最大距离: ' + maxDistance + 'px, 比例: ' + (this.currentX / maxDistance * 100).toFixed(1) + '%');

            // 只要滑动超过 10px，就触发验证
            if (this.currentX >= 10) {
                console.log('[SlideVerify] 滑动距离足够，开始验证');
                this.verifySlidePosition(this.currentX);
            } else {
                // 回弹
                console.log('[SlideVerify] 滑动距离太近，回弹');
                this.currentX = 0;
                this.hintOpacity = 1;
                this.updateSliderPosition();
            }
        },

        async verifySlidePosition(x) {
            try {
                console.log('[SlideVerify] ========== 验证开始 ==========');
                console.log('[SlideVerify] 滑块按钮在轨道上的位置: ' + x + 'px');
                console.log('[SlideVerify] 背景图偏移 imageOffsetX: ' + this.imageOffsetX.toFixed(2) + 'px');
                console.log('[SlideVerify] 缩放比例 scaleX: ' + this.scaleX.toFixed(3));

                // 计算滑块图片相对于背景图左侧的位置
                const sliderImageX = this.imageOffsetX + x;
                console.log('[SlideVerify] 滑块图片在容器中的位置: ' + sliderImageX.toFixed(2) + 'px');

                // 转换为相对于背景图的位置
                const relativeToBg = x;  // 因为滑块图片和滑块按钮同步移动，相对距离相同
                console.log('[SlideVerify] 滑块图片相对于背景图左侧的位置: ' + relativeToBg.toFixed(2) + 'px');

                // 转换为原图坐标
                const originalX = Math.round(relativeToBg / this.scaleX);
                console.log('[SlideVerify] 转换到原图(300x150)的X坐标: ' + originalX);
                console.log('[SlideVerify] 原图有效X坐标范围: 50 ~ 200');
                console.log('[SlideVerify] ==================================');

                // 模仿 iOS，检查 code === 0 判断成功
                const responseStr = await appServerApi.verifySlide(this.token, originalX);
                const response = typeof responseStr === 'string' ? JSON.parse(responseStr) : responseStr;

                console.log('[SlideVerify] API 响应:', response);
                console.log('[SlideVerify] response.code:', response.code);
                console.log('[SlideVerify] response.code === 0:', response.code === 0);

                if (response.code === 0) {
                    console.log('[SlideVerify] 验证成功！');
                    this.isVerified = true;
                    const sliderButton = this.$refs.sliderButton;
                    sliderButton.classList.add('verified');

                    // 延迟关闭
                    setTimeout(() => {
                        this.$emit('verify-success', this.token);
                        this.hide();
                    }, 500);
                } else {
                    console.log('[SlideVerify] 验证失败！code =', response.code);
                    // 验证失败
                    this.currentX = 0;
                    this.hintOpacity = 1;
                    this.updateSliderPosition();

                    this.$notify({
                        text: '验证失败，请重试',
                        type: 'error'
                    });

                    // 1秒后自动刷新
                    setTimeout(() => {
                        this.refreshVerify();
                    }, 1000);

                    this.$emit('verify-failed');
                }
            } catch (error) {
                console.error('验证失败:', error);
                this.currentX = 0;
                this.hintOpacity = 1;
                this.updateSliderPosition();

                this.$notify({
                    text: '验证失败，请重试',
                    type: 'error'
                });

                // 1秒后自动刷新
                setTimeout(() => {
                    this.refreshVerify();
                }, 1000);

                this.$emit('verify-failed');
            }
        },

        updateSliderPosition() {
            const sliderButton = this.$refs.sliderButton;
            const sliderImage = this.$refs.sliderImage;

            if (sliderButton) {
                sliderButton.style.transform = `translateX(${this.currentX}px)`;
            }
            if (sliderImage) {
                // 滑块图片需要加上背景图的水平偏移，才能正确对齐背景图
                const sliderImageLeft = this.imageOffsetX + this.currentX;
                sliderImage.style.left = sliderImageLeft + 'px';
            }
        }
    },

    beforeUnmount() {
        document.removeEventListener('mousemove', this.handleMouseMove);
        document.removeEventListener('mouseup', this.handleMouseUp);
    }
}
</script>

<style scoped>
.slide-verify-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
}

.slide-verify-container {
    background: white;
    border-radius: 12px;
    padding: 20px;
    width: 360px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.slide-verify-header {
    text-align: center;
    margin-bottom: 15px;
}

.slide-verify-header .title {
    font-size: 18px;
    font-weight: bold;
    color: #333;
}

.slide-verify-content {
    position: relative;
}

.image-container {
    position: relative;
    width: 100%;
    height: 180px;
    margin-bottom: 15px;
    background-color: #f5f5f5;
    border-radius: 4px;
    overflow: hidden;
}

.background-image {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
}

.slider-image {
    position: absolute;
    left: 0;
    width: 50px;
    height: 50px;
    object-fit: contain;
}

.slider-track-container {
    margin-bottom: 10px;
}

.slider-track {
    position: relative;
    width: 100%;
    height: 40px;
    background-color: #f0f0f0;
    border-radius: 20px;
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
}

.slider-hint {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    color: #999;
    pointer-events: none;
}

.slider-button {
    position: absolute;
    top: 0;
    left: 0;
    width: 40px;
    height: 40px;
    background: white;
    border-radius: 50%;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: box-shadow 0.3s;
    user-select: none;
}

.slider-button:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.slider-button.verified {
    background: #4CAF50;
}

.slider-button .icon {
    display: block;
}

.slider-button .icon.success {
    display: none;
}

.slider-button.verified .icon.success {
    display: block;
}

.slider-button.verified .icon:not(.success) {
    display: none;
}

.refresh-button {
    position: absolute;
    top: 10px;
    right: 10px;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    border-radius: 4px;
    background-color: rgba(255, 255, 255, 0.9);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    transition: all 0.3s;
    z-index: 10;
}

.refresh-button:hover {
    background-color: rgba(240, 240, 240, 0.95);
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
}

.refresh-button .icon {
    display: block;
}

/* Loading 样式 */
:deep(.el-loading-mask) {
    background-color: rgba(255, 255, 255, 0.9);
    border-radius: 4px;
}
</style>
