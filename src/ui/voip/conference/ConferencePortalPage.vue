<template>
    <div class="conference-portal-container">
        <div class="left-slider">
            <div class="left-header">
                <h2 class="menu-title">视频会议</h2>
            </div>
            <div class="action-container">
                <div class="action" style="background: var(--background-accent-subtle)" @click="joinConference">
                    <!--                    <img :src="require(`@/assets/images/av_join_conference.png`)" alt="">-->
                    <div class="icon">
                        <i class="icon-ion-android-add" style="color: var(--status-info)"></i>
                    </div>
                    <p class="title">加入会议</p>
                </div>
                <div class="action" style="background: var(--background-accent-subtle)" @click="createConference">
                    <div class="icon">
                        <i class="icon-ion-ios-videocam" style="color: var(--status-info)"></i>
                    </div>
                    <!--                    <img :src="require(`@/assets/images/av_start_conference.png`)" alt="">-->
                    <p class="title">发起会议</p>
                </div>
                <div class="action" style="background: var(--background-warning-subtle)" @click="orderConference">
                    <div class="icon">
                        <i class="icon-ion-android-calendar" style="color: var(--status-warning-alt)"></i>
                    </div>
                    <!--                    <img :src="require(`@/assets/images/av_book_conference.png`)" alt="">-->
                    <p class="title">预定会议</p>
                </div>
            </div>
        </div>
        <ResizeBar/>
        <div class="right-slider">
            <div class="right-content">
            <div class="fav-container">
                <span class="group-label">即将开始</span>
                <div v-if="favConferenceInfos.length > 0" class="fav-list">
                    <div class="fav-conference" @click="showConferenceInfo(conferenceInfo)"
                         v-for="(conferenceInfo, index) in favConferenceInfos"
                         :key="index">
                        <div class="icon">
                            <i class="icon-ion-ios-videocam" style="color: var(--accent-color) "></i>
                        </div>
                        <div>
                            <p class="title single-line">{{ conferenceInfo.conferenceTitle }}</p>
                            <p class="desc">{{ favConferenceDesc(conferenceInfo) }}</p>
                        </div>
                    </div>
                </div>
                <div v-else class="empty">
                    没有即将开始的会议
                </div>
            </div>
            <div class="history-container">
                <span class="group-label">历史记录</span>
                <div v-if="historyConferenceInfos.length > 0" class="fav-list">
                    <div class="fav-conference" @click="showConferenceInfo(conferenceInfo)"
                         v-for="(conferenceInfo, index) in historyConferenceInfos"
                         :key="index">
                        <div class="icon">
                            <i class="icon-ion-ios-videocam" style="color: var(--accent-color) "></i>
                        </div>
                        <div>
                            <p class="title single-line">{{ conferenceInfo.conferenceTitle }}</p>
                            <p class="desc">{{ historyConferenceDesc(conferenceInfo) }}</p>
                        </div>
                    </div>
                </div>
                <div v-else class="empty">
                    没有即将开始的会议
                </div>
            </div>
            </div>
        </div>
    </div>

</template>

<script>
import CreateConferenceView from "./CreateConferenceView";
import JoinConferenceView from "./JoinConferenceView";
import OrderConferenceView from "./OrderConferenceView";
import conferenceApi from "../../../api/conferenceApi";
import ConferenceInfoView from "./ConferenceInfoView";
import conferenceManager from "./conferenceManager";
import wfc from "../../../wfc/client/wfc";
import ResizeBar from "../../common/ResizeBar.vue";

export default {
    name: "ConferencePortalPage",
    components: {
        ResizeBar,
    },
    data() {
        return {
            favConferenceInfos: [],
            historyConferenceInfos: [],
        }
    },
    mounted() {
        this.$eventBus.on('conferenceListUpdated', () => {
            this.reload();
        });
    },
    activated() {
        this.reload();
    },
    methods: {
        reload() {
        	this.loadFavConferences();
        	this.historyConferenceInfos = conferenceManager.getHistoryConference();
    	},
        loadFavConferences() {
            conferenceApi.getFavConferences()
                .then(favConferenceInfos => {
                    this.favConferenceInfos = favConferenceInfos.filter(c => c.startTime > 0);
                })
                .catch(err => {
                    console.log('getFavConferences error', err)
                });
        },
        joinConference() {
            let beforeOpen = () => {
                console.log('Opening...')
            };
            let beforeClose = (event) => {
                console.log('Closing...', event, event.params)
            };
            let closed = (event) => {
                console.log('Close...', event)
            };
            this.$modal.show(
                JoinConferenceView,
                {}, null, {
                    name: 'join-conference-modal',
                    width: 320,
                    height: 300,
                    clickToClose: true,
                }, {
                    'before-open': beforeOpen,
                    'before-close': beforeClose,
                    'closed': closed,
                })
        },
        createConference() {
            let beforeOpen = () => {
                console.log('Opening...')
            };
            let beforeClose = (event) => {
                console.log('Closing...', event, event.params)
            };
            let closed = (event) => {
                console.log('Close...', event)
                this.reload();
            };
            this.$modal.show(
                CreateConferenceView,
                {}, null,{
                    name: 'create-conference-modal',
                    width: 320,
                    height: 500,
                    clickToClose: true,
                }, {
                    'before-open': beforeOpen,
                    'before-close': beforeClose,
                    'closed': closed,
                })
        },
        orderConference() {
            let beforeOpen = () => {
                console.log('Opening...')
            };
            let beforeClose = (event) => {
                console.log('Closing...', event, event.params)
            };
            let closed = (event) => {
                console.log('Close...', event)
                this.reload();
            };
            this.$modal.show(
                OrderConferenceView,
                {},null, {
                    name: 'order-conference-modal',
                    width: 320,
                    height: 500,
                    clickToClose: true,
                }, {
                    'before-open': beforeOpen,
                    'before-close': beforeClose,
                    'closed': closed,
                })

        },
        showConferenceInfo(info) {
            let beforeOpen = () => {
                console.log('Opening...')
            };
            let beforeClose = (event) => {
                console.log('Closing...', event, event.params)
            };
            let closed = (ev) => {
                if (ev.params && ev.params.destroy) {
                    if (ev.params && ev.params.destroy) {
                        console.log("destroy, reload");
                        this.reload();
                    }
                }
                console.log("Close...", event);
            };
            this.$modal.show(
                ConferenceInfoView,
                {
                    conferenceInfo: info,
                }, null,{
                    name: 'conference-info-modal',
                    width: 320,
                    height: 580,
                    clickToClose: true,
                }, {
                    'before-open': beforeOpen,
                    'before-close': beforeClose,
                    'closed': closed,
                })
        },
        favConferenceDesc(conferenceInfo) {
            let start = new Date(conferenceInfo.startTime * 1000).getTime();
            let end = new Date(conferenceInfo.endTime * 1000).getTime();
            let now = new Date().getTime();
            if (now < start) {
                return '会议尚未开始';
            } else if (start < end) {
                return '会议已开始，请尽快加入';
            } else {
                return '会议已结束';
            }
        },

        historyConferenceDesc(conferenceInfo) {
            console.log('xxxx', conferenceInfo)
            let duration = this.formatDuration(conferenceInfo.endTime - conferenceInfo.startTime);
            let ownerDisplayName = wfc.getUserDisplayName(conferenceInfo.owner);
            let date = new Date(conferenceInfo.startTime * 1000).toLocaleDateString();
            return `时间：${date} 发起人：${ownerDisplayName} 时长：${duration}`
        },

        formatDuration(second) {
            let desc = '';
            if (second > 60 * 60) {
                desc = Math.floor(second / 60 / 60) + 'H';
            }
            if (second > 60) {
                desc += Math.floor(second % (60 * 60) / 60) + 'M';
            }
            desc += second % 60 + 'S'
            return desc;
        }
    }
}
</script>

<style scoped>

.conference-portal-container {
    display: flex;
    flex: 1;
    height: 100%;
    align-items: center;
}

.left-slider {
    height: 100%;
    width: var(--list-panel-width);
    flex: 0 0 var(--list-panel-width);
    background: var(--background-secondary);
    border-right: 1px solid var(--border-primary);
    display: flex;
    flex-direction: column;
}

.left-header {
    padding: 24px 20px 12px;
    border-bottom: 1px solid var(--border-separator);
    box-sizing: border-box;
}

.menu-title {
    font-size: var(--font-size-2xl);
    font-weight: 600;
    color: var(--text-primary);
    margin: 0;
}

.action-container {
    width: 100%;
    display: flex;
    flex-direction: column;
    padding: 16px 20px;
    box-sizing: border-box;
}

.action {
    width: 150px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    border-radius: var(--radius-lg);
    padding: 16px;
    margin: 8px 8px 8px 0;
    cursor: pointer;
    user-select: none;
    transition: filter var(--duration-fast), box-shadow var(--duration-fast), transform var(--duration-fast);
}

.action:hover {
    filter: brightness(0.9);
    box-shadow: var(--shadow-main);
}

.action:active {
    transform: scale(0.97);
    filter: brightness(0.82);
    box-shadow: none;
}

.action .icon {
    width: 40px;
    height: 40px;
    background: var(--background-primary);
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: var(--radius-md);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
}

.action .icon i {
    font-size: var(--font-size-2xl);
}

.action .title {
    margin-top: 12px;
    font-size: var(--font-size-base);
    font-weight: 500;
    color: var(--text-primary);
}

.right-slider {
    height: 100%;
    background: var(--background-primary);
    flex: 1 1 auto;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 0;
}

.right-content {
    width: 100%;
    max-width: 760px;
    padding: 32px clamp(20px, 4vw, 48px);
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.fav-container,
.history-container {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.group-label {
    padding-left: 4px;
    font-size: var(--font-size-xs);
    font-weight: 600;
    letter-spacing: 0.4px;
    color: var(--text-secondary);
}

.empty {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    background: var(--background-secondary);
    border: 1px solid var(--border-secondary);
    border-radius: var(--radius-md);
    font-size: var(--font-size-xs);
    color: var(--text-secondary);
    min-height: 48px;
}

.fav-list {
    background: var(--background-secondary);
    border: 1px solid var(--border-secondary);
    border-radius: var(--radius-md);
    overflow: hidden;
}

.fav-conference {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    cursor: pointer;
    transition: background var(--duration-fast);
}

.fav-conference:hover {
    background: var(--background-item-hover);
}

.fav-conference:active {
    background: var(--background-item-active);
}

.fav-conference .icon {
    width: 32px;
    height: 32px;
    border-radius: var(--radius-circle);
    background: var(--background-accent-subtle);
    display: flex;
    justify-content: center;
    align-items: center;
    margin-right: 10px;
    flex-shrink: 0;
}

.fav-conference:not(:last-of-type) {
    border-bottom: 1px solid var(--border-tertiary);
}

.fav-conference .title {
    font-size: var(--font-size-sm);
    font-weight: 500;
    color: var(--text-primary);
}

.fav-conference .desc {
    color: var(--text-secondary);
    margin-top: 3px;
    font-size: var(--font-size-xs);
}

</style>
