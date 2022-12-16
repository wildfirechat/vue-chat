<template>
    <div class="participant-list-container" ref="rootContainer">
        <div v-if="true" @click="invite"
             class="action-item">
            <div class="icon">+</div>
            <p>邀请新参与者</p>
        </div>
        <div v-if="false" @click="invite"
             class="action-item">
            <div class="icon">-</div>
            <p>移除参与者</p>
        </div>
        <ul>
            <li v-for="participant in participants" :key="participant.uid">
                <tippy
                    :to="'user-' + participant.uid"
                    interactive
                    theme="light"
                    :animate-fill="false"
                    placement="left"
                    distant="7"
                    animation="fade"
                    trigger="manual"
                >
                    <UserCardView :user-info="participant"/>
                </tippy>
                <div class="participant-user"
                     @click.stop.prevent="showContextMenu($event, participant)"
                     :ref="'userCardTippy-'+participant.uid"
                     v-bind:class="{active: participant.uid === currentParticipant.uid}"
                     :name="'user-'+participant.uid">
                    <div class="avatar-container">
                        <img class="avatar" :src="participant.portrait" alt="">
                        <div v-if=" selfUserId === session.host && !participant._isHost" @click.stop="kickoff(participant)"
                             class="icon">
                            -
                        </div>
                    </div>
                    <div class="name-desc">
                        <p class="single-line name"> {{ participantName(participant) }}</p>
                        <p class="single-line desc">{{ participantDesc(participant) }}</p>
                    </div>
                    <div class="audio-video">
                        <i v-if="participant._isAudience || participant._isAudioMuted" class="icon-ion-ios-mic-outline" style="color: gray"></i>
                        <i v-else class="icon-ion-ios-mic"></i>
                        <i v-if="participant._isAudience || participant._isVideoMuted" class="icon-ion-ios-videocam-outline" style="color: gray"></i>
                        <i v-else class="icon-ion-ios-videocam"></i>
                    </div>
                </div>
            </li>
        </ul>

        <vue-context ref="menu" v-slot="{data:participant}" :close-on-scroll="true">
            <li v-for="(item,i) in buildParticipantContextMenu(participant)" :key="i">
                <a @click.prevent="item.handler" v-bind:style="item.styleObject">{{ item.title }}</a>
            </li>
        </vue-context>

    </div>
</template>

<script>
import ConferenceInviteMessageContent from "../../../wfc/av/messages/conferenceInviteMessageContent";
import Message from "../../../wfc/messages/message";
import {isElectron} from "../../../platform";
import ForwardType from "../../main/conversation/message/forward/ForwardType";
import localStorageEmitter from "../../../ipc/localStorageEmitter";
import wfc from "../../../wfc/client/wfc";
import UserCardView from "../../main/user/UserCardView";
import conferenceManager from "./conferenceManager";
import conversationFloatPage from "../../main/ConversationFloatPage";
import IpcSub from "../../../ipc/ipcSub";

export default {
    name: "ConferenceParticipantListView",
    props: {
        participants: {
            type: Array,
            required: true,
        },
        session: {
            type: Object,
            required: true,
        }
    },
    data() {
        return {
            conferenceManager: conferenceManager,
            selfUserId: conferenceManager.selfUserId,
            isContextMenuShow: false,
            currentParticipant: {},
        }
    },
    components: {
        UserCardView
    },
    methods: {
        invite() {
            let callSession = this.session;
            let inviteMessageContent = new ConferenceInviteMessageContent(callSession.callId, conferenceManager.conferenceInfo.owner, callSession.title, callSession.desc, callSession.startTime, callSession.audioOnly, callSession.defaultAudience, callSession.advance, callSession.pin)
            console.log('invite', inviteMessageContent);
            if (isElectron()) {
                let message = new Message(null, inviteMessageContent);
                this.$forwardMessage({
                    forwardType: ForwardType.NORMAL,
                    messages: [message]
                });
            } else {
                localStorageEmitter.send('inviteConferenceParticipant', {messagePayload: inviteMessageContent.encode()})
            }
            this.showParticipantList = false;
        },

        requestChangeMode(user) {
            if (user.uid === this.selfUserInfo.uid) {
                // TODO 需要根据实际产品定义处理，这儿直接禁止
                //this.session.switchAudience(!user._isAudience);
                return;
            }
            this.$alert({
                content: user._isAudience ? `邀请${this.participantName(user)}参与互动?` : `取消${this.participantName(user)}参与互动?`,
                cancelCallback: () => {
                    // do nothing
                },
                confirmCallback: () => {
                    this.session.requestChangeMode(user.uid, !user._isAudience);
                }
            })
        },

        kickoff(user) {
            this.$alert({
                showIcon: true,
                content: `确认将${this.participantName(user)}移除会议?`,
                cancelCallback: () => {
                    // do nothing
                },
                confirmCallback: () => {
                    this.session.kickoffParticipant(user.uid)
                }
            })
        },

        participantName(user) {
            let name = '';
            if (user.groupAlias) {
                name = user.groupAlias;
            } else if (user.friendAlias) {
                name = user.friendAlias;
            } else if (user.displayName) {
                name = user.displayName;
            } else {
                name = user.name;
            }
            return name;
        },
        participantDesc(user) {
            let desc = '';
            if (user.uid === conferenceManager.selfUserId) {
                desc = "我"
                if (user.uid === conferenceManager.conferenceInfo.owner) {
                    desc += "、主持人"
                }
            } else if (user.uid === conferenceManager.conferenceInfo.owner) {
                desc = "主持人"
            }
            return desc;
        },

        buildParticipantContextMenu(participant) {
            let selfUid = conferenceManager.selfUserId;
            let items = [];
            if (!participant) {
                return items;
            }

            items.push({
                title: '查看用户信息',
                handler: () => {
                    this.showUserCard(participant);
                }
            })

            if (selfUid === participant.uid) {
                // TODO 临时屏蔽，现在不支持同时开视频和音频
                // if (participant._isAudience) {
                //     items.push({
                //         title: '开启音视频',
                //         handler: () => {
                //             this.$eventBus.$emit('muteAudio', false)
                //             this.$eventBus.$emit('muteVideo', false)
                //         }
                //     })
                // }

                if (participant._isAudience) {
                    if (participant._isAudioMuted) {
                        items.push({
                            title: '开启音频',
                            handler: () => {
                                this.$eventBus.$emit('muteAudio', false)
                            }
                        })
                    }

                    if (participant._isVideoMuted) {
                        items.push({
                            title: '开启视频',
                            handler: () => {
                                this.$eventBus.$emit('muteVideo', false)
                            }
                        })
                    }

                } else {
                    if (!participant._isAudioMuted) {
                        items.push({
                            title: '关闭音频',
                            handler: () => {
                                this.$eventBus.$emit('muteAudio', true)
                            },
                            styleObject: {
                                color: 'red',
                            }
                        })
                    }
                    if (!participant._isVideoMuted) {
                        items.push({
                            title: '关闭视频',
                            handler: () => {
                                this.$eventBus.$emit('muteVideo', true)
                            },
                            styleObject: {
                                color: 'red',
                            }
                        })
                    }
                    if (!participant._isVideoMuted && !participant._isAudioMuted) {
                        items.push({
                            title: '关闭音视频',
                            handler: () => {
                                this.$eventBus.$emit('muteAudio', true)
                                this.$eventBus.$emit('muteVideo', true)
                            },
                            styleObject: {
                                color: 'red',
                            }
                        })
                    }
                }
            }
            if (selfUid === conferenceManager.conferenceInfo.owner) {
                if (participant.uid !== selfUid) {
                    if (participant._isAudience) {
                        items.push({
                            title: '邀请发言',
                            handler: () => {
                                conferenceManager.requestMemberMute(participant.uid, false)
                            },
                        })
                    } else {
                        items.push({
                            title: '取消发言',
                            handler: () => {
                                conferenceManager.requestMemberMute(participant.uid, true)
                            },
                        })
                    }
                }
                if (participant.uid !== selfUid) {
                    items.push({
                        title: ' 移除成员',
                        handler: () => {
                            this.kickoff(participant);
                        },
                    })
                }
                if (conferenceManager.conferenceInfo.focus === participant.uid) {
                    items.push({
                        title: '取消焦点用户',
                        handler: () => {
                            conferenceManager.requestCancelFocus();
                        },
                    })
                } else {
                    items.push({
                        title: '设置为焦点用户',
                        handler: () => {
                            conferenceManager.requestFocus(participant.uid)
                        },
                    })
                }
            }
            return items;
        },

        showContextMenu(event, participant) {
            if (this.isContextMenuShow) {
                this.$refs.menu.close();
                this.isContextMenuShow = false;
                this.currentParticipant = {};
                return;
            }
            let ne = {
                type: 'contextmenu'
            }

            ne.clientX = event.clientX - this.$refs.rootContainer.parentElement.offsetLeft;
            // 160 menu width
            // 360 slider width
            if (ne.clientX + 160 > 350) {
                ne.clientX = ne.clientX - 160;
            }
            ne.clientY = event.clientY - this.$refs.rootContainer.offsetTop;
            this.$refs.menu.open(ne, participant);
            this.$refs.menu.$once('close', () => {
                this.isContextMenuShow = false;
                this.currentParticipant = {};
            })
            this.isContextMenuShow = true;
            this.currentParticipant = participant;
        }
        ,
        showUserCard(p) {
            this.$refs['userCardTippy-' + p.uid][0]._tippy.show();
        }
    }
}
</script>

<style scoped>
.participant-list-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: auto;
    background-color: #ffffffe5;
    backdrop-filter: blur(6px);
    border-left: 1px solid #e6e6e6;
}

.participant-list-container .action-item {
    height: 50px;
    display: flex;
    padding: 5px 0 0 10px;
    align-items: center;
}

.participant-list-container .action-item .icon {
    width: 40px;
    height: 40px;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 3px;
    border: 1px dashed #d6d6d6;
    margin-right: 10px;
}

.participant-user {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 5px 0 5px 10px;
}

.participant-user.active {
    background: #d6d6d6;
}

.participant-user .name-desc {
    flex: 1;
}

.participant-user .name-desc .desc {
    font-size: 13px;
}

.audio-video {
    color: black;
    padding: 0 10px;
}

.audio-video i {
    padding: 5px;
}

.participant-user .avatar {
    width: 40px;
    height: 40px;
    border-radius: 3px;
    margin-right: 10px;
}

.avatar-container {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
}

.avatar-container .icon {
    width: 40px;
    height: 40px;
    display: none;
    justify-content: center;
    align-items: center;
    border-radius: 3px;
    border: 1px dashed #d6d6d6;
    margin-right: 10px;
}

.avatar-container:hover .icon {
    display: flex;
    position: absolute;
    left: 0;
    top: 0;
    color: white;
    background: #e0d6d6d6;
}

</style>
