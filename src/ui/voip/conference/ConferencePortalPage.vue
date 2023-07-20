<template>
    <div class="conference-portal-container">
        <div class="left-slider">
            <h2 class="title">视频会议</h2>
            <div class="action-container">
                <div class="action" style="background: #e1e9ff" @click="joinConference">
                    <!--                    <img :src="require(`@/assets/images/av_join_conference.png`)" alt="">-->
                    <div class="icon">
                        <i class="icon-ion-android-add" style="color: #3570fe"></i>
                    </div>
                    <p class="title">加入会议</p>
                </div>
                <div class="action" style="background: #d9f3fe" @click="createConference">
                    <div class="icon">
                        <i class="icon-ion-ios-videocam" style="color: #3570fe"></i>
                    </div>
                    <!--                    <img :src="require(`@/assets/images/av_start_conference.png`)" alt="">-->
                    <p class="title">发起会议</p>
                </div>
                <div class="action" style="background: #fee9d3" @click="orderConference">
                    <div class="icon">
                        <i class="icon-ion-android-calendar" style="color: #ff8700"></i>
                    </div>
                    <!--                    <img :src="require(`@/assets/images/av_book_conference.png`)" alt="">-->
                    <p class="title">预定会议</p>
                </div>
            </div>
        </div>
        <div class="right-slider">
            <div class="fav-container">
                <p>即将开始</p>
                <div v-if="favConferenceInfos.length > 0" class="fav-list">
                    <div class="fav-conference" @click="showConferenceInfo(conferenceInfo)"
                         v-for="(conferenceInfo, index) in favConferenceInfos"
                         :key="index">
                        <div class="icon">
                            <i class="icon-ion-ios-videocam" style="color:#5d7ce8 "></i>
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
                <p>历史记录</p>
                <div v-if="historyConferenceInfos.length > 0" class="fav-list">
                    <div class="fav-conference" @click="showConferenceInfo(conferenceInfo)"
                         v-for="(conferenceInfo, index) in historyConferenceInfos"
                         :key="index">
                        <div class="icon">
                            <i class="icon-ion-ios-videocam" style="color:#5d7ce8 "></i>
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

</template>

<script>
import CreateConferenceView from "./CreateConferenceView";
import JoinConferenceView from "./JoinConferenceView";
import OrderConferenceView from "./OrderConferenceView";
import conferenceApi from "../../../api/conferenceApi";
import ConferenceInfoView from "./ConferenceInfoView";
import conferenceManager from "./conferenceManager";
import wfc from "../../../wfc/client/wfc";

export default {
    name: "ConferencePortalPage",
    data() {
        return {
            favConferenceInfos: [],
            historyConferenceInfos: [],
        }
    },
    mounted() {
        this.loadFavConferences();
        this.historyConferenceInfos = conferenceManager.getHistoryConference();
    },
    methods: {
        loadFavConferences() {
            conferenceApi.getFavConferences()
                .then(favConferenceInfos => {
                    this.favConferenceInfos = favConferenceInfos;
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
                {}, {
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
                this.loadFavConferences();
            };
            this.$modal.show(
                CreateConferenceView,
                {}, {
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
                this.loadFavConferences();
            };
            this.$modal.show(
                OrderConferenceView,
                {}, {
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
            let closed = (event) => {
                console.log('Close...', event)
            };
            this.$modal.show(
                ConferenceInfoView,
                {
                    conferenceInfo: info,
                }, {
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
    width: 30%;
    background: white;
    padding: 20px;
}


.left-slider > .title {
    font-size: 20px;
}

.action-container {
    width: 100%;
    display: flex;
    flex-direction: column;
}

.action {
    width: 150px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    border-radius: 10px;
    padding: 15px;
    margin: 10px 10px 10px 0;
}

.action:hover {
    filter: invert(25%);
}

.action .icon {
    width: 40px;
    height: 40px;
    background: white;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 10px;
}

.action .icon i {
    font-size: 20px;
}

.action .title {
    margin-top: 15px;
}

.right-slider {
    height: 100%;
    background: #f8f9fb;
    flex: 1 1 auto;
    overflow-y: auto;
    padding: 20px;
}

.fav-container {
}

.empty {
    display: flex;
    align-items: center;
    padding: 15px;
    background: white;
    border-radius: 10px;
    font-size: 12px;
}

.fav-container .fav-list {
    background: white;
    border-radius: 10px;
}

.fav-conference {
    display: flex;
    align-items: center;
    padding: 15px;
    box-sizing: content-box;
}

.fav-conference:active {
    background: #f1f1f1;
}

.fav-conference .icon {
    width: 30px;
    height: 30px;
    border-radius: 15px;
    background: #e0e9fb;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-right: 10px;
}

.fav-conference:not(:last-of-type) {
    border-bottom: 1px solid #f1f1f1;
}

.fav-conference .title {

}

.fav-conference .desc {
    color: gray;
    margin-top: 3px;
    font-size: 12px;
}

.history-container {
    margin-top: 20px;
}

</style>
