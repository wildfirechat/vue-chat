<template>
    <div class="screen-share-action-container">
        <video v-if="session"
               class="video"
               ref="screenShareVideo"
               style="width: 100%; height: 100%; position: absolute; left: 0; top: 0; z-index: 0; display:none"
               :srcObject.prop="session.screenShareStream"
               playsInline
               muted
               autoPlay/>
        <div class="screen-share-panel">
            <div class="screen-share-meta">
                <div class="screen-share-status" :class="{paused: isScreenSharePaused}">
                    <span class="screen-share-status-dot"></span>
                    {{ isScreenSharePaused ? '共享已暂停' : '正在共享屏幕' }}
                </div>
                <div class="screen-share-subtitle">
                    {{ session && session.audioMuted ? '麦克风已静音' : '麦克风正常，可继续讲话' }}
                </div>
            </div>

            <div class="screen-share-actions">
                <button class="action-button"
                        :class="{muted: session && session.audioMuted}"
                        :disabled="!session || isStopping"
                        @click="audioMute">
                    <span class="action-icon-shell">
                        <img v-if="session && !session.audioMuted" class="action-img"
                             src='@/assets/images/av_mute.png'/>
                        <img v-else class="action-img" src='@/assets/images/av_mute_hover.png'/>
                    </span>
                    <span class="action-label">{{ session && session.audioMuted ? '取消静音' : '静音' }}</span>
                </button>

                <button class="action-button"
                        :disabled="!session || isStopping"
                        @click="stopScreenShare">
                    <span class="action-icon-shell danger">
                        <img class="action-img" src='@/assets/images/av_hang_up.png'/>
                    </span>
                    <span class="action-label">{{ isStopping ? '处理中...' : stopScreenShareTitle }}</span>
                </button>
            </div>
        </div>
    </div>

</template>

<script>
import avenginekit from "../../wfc/av/internal/engine.min";
import AvEngineKitProxy from "../../wfc/av/engine/avenginekitproxy";

export default {
    name: "ScreenShareControlView",
    props: {
        type: {
            required: false,
            type: String,
            default: null,
        },
        stopScreenShareTitle: {
            type: String,
            required: false,
            default: '结束共享',
        },
        stopScreenShareFunc: {
            type: Function,
            required: false,
        }
    },
    data() {
        return {
            session: null,
            screenShareCheckIntervalId: 0,
            screenShareActiveTime: -1,
            isScreenSharePaused: false,
            isStopping: false,
        }
    },

    mounted() {
        this.session = avenginekit.getCurrentSession();
        const watermarkEl = document.getElementById('wf-watermark');
        if (watermarkEl) {
            watermarkEl.style.display = 'none';
        }

        this.screenShareCheckIntervalId = setInterval(() => {
            if (!this.session || !this.session.screenSharing) {
                return;
            }
            const video = this.$refs.screenShareVideo;
            if (!video) {
                return;
            }
            if (this.screenShareActiveTime !== -1) {
                if (this.screenShareActiveTime === video.currentTime) {
                    if (!this.isScreenSharePaused) {
                        this.isScreenSharePaused = true;
                        console.log('屏幕共享暂停');
                    }
                } else {
                    if (this.isScreenSharePaused) {
                        this.isScreenSharePaused = false;
                        console.log('屏幕共享恢复');
                    }
                }
            }
            this.screenShareActiveTime = video.currentTime;
        }, 1000)
    },
    beforeUnmount() {
        clearInterval(this.screenShareCheckIntervalId);
        const watermarkEl = document.getElementById('wf-watermark');
        if (watermarkEl) {
            watermarkEl.style.display = 'block';
        }
    },

    methods: {
        audioMute() {
            if (!this.session) {
                return;
            }
            this.session.muteAudio(!this.session.audioMuted);
        },

        stopScreenShare() {
            if (!this.session || this.isStopping) {
                return;
            }
            this.isStopping = true;
            if (this.stopScreenShareFunc) {
                this.stopScreenShareFunc();
                this.isStopping = false;
                return
            }
            console.log('stopScreenShare', this.session);
            this.session.stopScreenShare();
            console.log('stopScreenShare', this.session.videoMuted, this.session.audioMuted);
            if (this.session.videoMuted && this.session.audioMuted) {
                this.session.switchAudience(true);
            }
            AvEngineKitProxy.emitToMain('stop-screen-share', {type: this.type})
            // 不太明白session明显变动了，但父组件没有去刷新，所以强制刷新下
            // 奇怪：直接用音视频SDK源码调试的时候，会正常刷新，但有编译出的SDK时，就不会刷新
            this.$parent && this.$parent.$forceUpdate && this.$parent.$forceUpdate();
            this.isStopping = false;
        }
    }
}
</script>

<style scoped>

.screen-share-action-container {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    position: absolute;
    left: 0;
    z-index: 100;
}

.screen-share-panel {
    width: 100%;
    min-height: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    padding: 14px 18px;
    background: linear-gradient(135deg, rgba(17, 23, 32, 0.92), rgba(31, 38, 52, 0.88));
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 18px 45px rgba(0, 0, 0, 0.32), 0 6px 14px rgba(0, 0, 0, 0.18);
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
}

.screen-share-meta {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 1;
}

.screen-share-status {
    display: flex;
    align-items: center;
    align-self: flex-start;
    gap: 8px;
    padding: 7px 12px;
    border-radius: 999px;
    background: rgba(53, 198, 106, 0.14);
    color: #8ff0b1;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.02em;
}

.screen-share-status.paused {
    background: rgba(255, 184, 77, 0.16);
    color: #ffd18d;
}

.screen-share-status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: currentColor;
    box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.08);
}

.screen-share-status:not(.paused) .screen-share-status-dot {
    animation: pulse-dot 1.8s ease-in-out infinite;
}

.screen-share-subtitle {
    color: rgba(255, 255, 255, 0.72);
    font-size: 13px;
    line-height: 1.4;
}

.screen-share-actions {
    display: flex;
    align-items: center;
    gap: 12px;
}

.action-button {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    min-width: 92px;
    padding: 0;
    border: none;
    background: transparent;
    color: var(--text-on-accent);
    cursor: pointer;
    transition: transform 0.18s ease, opacity 0.18s ease;
}

.action-button:hover {
    transform: translateY(-1px);
}

.action-button:disabled {
    opacity: 0.55;
    cursor: not-allowed;
    transform: none;
}

.action-icon-shell {
    width: 58px;
    height: 58px;
    border-radius: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.06));
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 10px 20px rgba(0, 0, 0, 0.16);
}

.action-button.muted .action-icon-shell {
    background: linear-gradient(180deg, rgba(255, 184, 77, 0.2), rgba(255, 184, 77, 0.12));
}

.action-icon-shell.danger {
    background: linear-gradient(180deg, rgba(255, 99, 99, 0.22), rgba(255, 99, 99, 0.14));
}

.action-label {
    font-size: 12px;
    font-weight: 500;
    white-space: nowrap;
}

.action-img {
    width: 34px;
    height: 34px;
    display: block;
}

@keyframes pulse-dot {
    0% {
        transform: scale(0.9);
        opacity: 0.8;
    }
    50% {
        transform: scale(1.15);
        opacity: 1;
    }
    100% {
        transform: scale(0.9);
        opacity: 0.8;
    }
}

@media (max-width: 640px) {
    .screen-share-panel {
        gap: 14px;
        padding: 12px 14px;
    }

    .screen-share-actions {
        gap: 8px;
    }

    .action-button {
        min-width: 78px;
    }

    .action-icon-shell {
        width: 52px;
        height: 52px;
        border-radius: 16px;
    }

    .action-img {
        width: 30px;
        height: 30px;
    }
}
</style>
