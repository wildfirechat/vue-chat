<template>
    <div class="conversation-item-container"
         @click="onClickConversationItem"
         v-bind:class="{
             active: shareConversationState.currentConversationInfo && shareConversationState.currentConversationInfo.conversation.equal(source.conversation),
                              top:source.top,
                              highlight:shareConversationState.contextMenuConversationInfo && shareConversationState.contextMenuConversationInfo.conversation.equal(source.conversation)
         }">
        <div class="conversation-item" v-bind:class="{}">
            <div class="header">
                <img class="avatar" draggable="false" :src="portrait" alt=""
                     @error="imgUrlAlt"/>
            </div>
            <div class="content-container">
                <div class="title-time-container">
                    <i v-if="source.conversation.type === 5" class="icon-ion-android-lock" style="padding-right: 4px"></i>
                    <div v-if="isOrganizationGroupConversation" class="flex-row flex-align-center" style="max-width: calc(100% - 60px)">
                        <h2 class="title single-line">{{ conversationTitle }}</h2>
                        <p class="single-line" style="background: var(--accent-color); border-radius: 2px; color: var(--text-on-accent); padding: 1px 2px; font-size: 9px">官方</p>
                    </div>
                    <div v-else-if="isExternalDomainSingleConversation" class="flex-row flex-align-center" style="max-width: calc(100% - 60px)">
                        <h2 class="title single-line">{{ conversationTitle }}</h2>
                        <p class="single-line" style="color: var(--text-warning); border-radius: 2px;  padding: 1px 2px; font-size: 9px">{{ domainName }}</p>
                    </div>
                    <h2 v-else class="title single-line">{{ conversationTitle }}</h2>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import store from '../../../store';
import wfc from '../../../wfc/client/wfc';
import Config from '../../../config';
import ConversationType from '../../../wfc/model/conversationType';
import GroupType from '../../../wfc/model/groupType';
import WfcUtil from '../../../wfc/util/wfcUtil';

export default {
    name: 'ConversationItemLiteView',
    props: {
        source: {
            type: Object,
            required: true,
        },
        clickConversationItemFunc: {
            type: Function,
            required: false,
            default: null,
        },
    },
    data() {
        return {
            shareConversationState: store.state.conversation,
            groupPortrait: Config.DEFAULT_GROUP_PORTRAIT_URL,
        };
    },
    mounted() {
        // this.refreshGroupPortrait();
    },
    methods: {
        imgUrlAlt(e) {
            if (this.source.conversation.type === ConversationType.Group) {
                e.target.src = Config.DEFAULT_GROUP_PORTRAIT_URL;
            } else {
                e.target.src = Config.DEFAULT_PORTRAIT_URL;
            }
        },

        onClickConversationItem() {
            if (this.clickConversationItemFunc) {
                this.clickConversationItemFunc(this.source);
            }
        },

    },
    computed: {
        conversationTitle() {
            let info = this.source;
            if (info.conversation._target) {
                return info.conversation._target._displayName;
            }
            return '';
        },

        isOrganizationGroupConversation() {
            let info = this.source;
            if (info.conversation.type === ConversationType.Group && info.conversation._target && info.conversation._target.type === GroupType.Organization) {
                return true;
            }
            return false;
        },
        isExternalDomainSingleConversation() {
            let info = this.source;
            if (info.conversation.type === ConversationType.Single && WfcUtil.isExternal(info.conversation.target)) {
                return true;
            }
            return false;
        },
        domainName() {
            let info = this.source;
            if (info.conversation.type === ConversationType.Single && WfcUtil.isExternal(info.conversation.target)) {
                let domainId = WfcUtil.getExternalDomainId(info.conversation.target);
                let domainInfo = wfc.getDomainInfo(domainId);
                return '@' + domainInfo.name;
            }
            return '';
        },

        portrait() {
            let info = this.source;
            if (info.conversation.type === ConversationType.Group) {
                if (info.conversation._target.portrait) {
                    return info.conversation._target.portrait;
                } else {
                    let dp = wfc.defaultGroupPortrait(info.conversation._target);
                    info.conversation._target.portrait = dp;
                    return dp;
                }
            } else {
                return info.conversation._target.portrait;
            }
        }
    },
};
</script>

<style scoped>
.conversation-item-container {
    padding-left: 12px;
    background-color: var(--background-item-normal);
}

.conversation-item-container:hover {
    background-color: var(--background-item-hover);
}

.conversation-item-container.active {
    background-color: var(--background-item-active);
}

.conversation-item-container.top {
    background-color: var(--background-item-top);
}

.conversation-item-container.top:hover {
    background-color: var(--background-item-active);
}

.conversation-item-container.highlight {
    box-shadow: 0 0 0 1px var(--border-active) inset;
    z-index: 100;
}

.conversation-item-container.active.top {
    background-color: var(--background-item-active);
}

.conversation-item {
    width: 100%;
    height: 48px;
    display: flex;
    /*border-bottom: 1px solid var(--border-secondary);*/
    align-items: center;
    justify-content: center;
}

.header {
    height: 100%;
    padding: 8px 12px 8px 0;
    margin-right: 2px;
    position: relative;
}

.header .avatar {
    position: relative;
    min-width: var(--size-avatar);
    min-height: var(--size-avatar);
    background: var(--background-tertiary);
    top: 50%;
    transform: translateY(-50%);
}

.content-container {
    width: 100%;
    height: 45px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    padding-right: 12px;
}

.content-container .title-time-container {
    display: flex;
    width: 100%;
    max-width: 100%;
    align-content: center;
    justify-content: space-between;
}

.content-container .title-time-container .title {
    display: inline-block;
    font-size: var(--font-size-base);
    color: var(--text-primary);
    font-style: normal;
    font-weight: normal;
    flex: 1;
}

.content-container .title-time-container .time {
    display: inline-block;
    color: var(--text-secondary);
    font-size: 10px;
}
</style>
