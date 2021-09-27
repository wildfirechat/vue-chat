<template>
    <section>
        <div class="message-history-page">
            <div class="search-input-container">
                <input id="searchInput"
                       ref="input"
                       autocomplete="off"
                       v-model="query"
                       @keydown.esc="cancel"
                       type="text" :placeholder="$t('common.search')"/>
                <i class="icon-ion-ios-search"></i>
            </div>
            <div v-if="!query" class="portal">
                <p>^~^</p>
            </div>
            <div v-else-if="conversationSearchResults.length > 0" class="search-result-container">
                <div class="conversation-list">
                    <ul>
                        <li v-for="(cresult) in conversationSearchResults"
                            @click="setCurrentConversationSearchResult(cresult)"
                            :key="cresult.conversation.type + cresult.conversation.target + cresult.conversation.line">
                            <div class="conversation-item"
                                 v-bind:class="{active:isConversationItemActive(cresult)}">
                                <div class="header">
                                    <img class="avatar" draggable="false"
                                         :src="cresult._conversationInfo.conversation._target.portrait" alt=""/>
                                </div>
                                <div class="content-container">
                                    <p class="title single-line">
                                        {{ cresult._conversationInfo.conversation._target._displayName }} </p>
                                    <p class="desc single-line">
                                        {{
                                            cresult.matchMessage ? cresult.matchMessage.messageContent.digest(cresult.matchMessage) : `${cresult.matchCount}条相关聊天记录`
                                        }}
                                    </p>
                                </div>

                            </div>
                        </li>
                    </ul>
                </div>
                <div class="conversation-message-list" v-if="currentConversationSearchResult">
                    <div class="desc-action-container" v-if="!currentMessage">
                        <p class="single-line desc">
                            {{ `${currentConversationSearchResult.matchCount}条与${this.query}相关的搜索结果` }}</p>
                        <div class="action" @click="openConversation">
                            <i class="icon-ion-android-chat"></i>
                            <p>进入聊天</p>
                        </div>
                    </div>
                    <div v-else class="desc-action-container">
                        <i class="icon-ion-ios-arrow-back" @click="currentMessage = null">&nbsp;返回</i>
                    </div>
                    <div class="message-list-container" infinite-wrapper>
                        <infinite-loading v-if="currentMessage" identifier="oldMessageLoader"
                                          force-use-infinite-wrapper
                                          direction="top"
                                          @infinite="infiniteHandlerTop">
                            <!--            <template slot="spinner">加载中...</template>-->
                            <template slot="no-more">{{ $t('fav.no_more') }}</template>
                            <template slot="no-results">{{ $t('fav.all_fav_load') }}</template>
                        </infinite-loading>
                        <ul>
                            <li v-for="(message, index) in messages"
                                :key="message.uid">
                                <div class="message-container">
                                    <div class="portrait-container">
                                        <img
                                            alt="" :src="message._from.portrait">
                                    </div>
                                    <div class="name-time-content-container">
                                        <div class="name-time-container">
                                            <p class="name"> {{ message._from._displayName }}</p>
                                            <p class="time"> {{ message._timeStr }}</p>
                                            <!--                            <p class="time"> 1223</p>-->
                                        </div>
                                        <div class="content">
                                            <MessageContentContainerView :message="message"
                                                                         @contextmenu.prevent.native="openMessageContextMenu($event, message)"/>
                                            <a v-if="!currentMessage" class="single-line action"
                                               @click="showContextMessages(message)">查看上下文</a>
                                        </div>
                                    </div>

                                </div>
                            </li>
                        </ul>
                        <infinite-loading v-if="currentMessage" identifier="newMessageLoader"
                                          force-use-infinite-wrapper
                                          direction="bottom"
                                          @infinite="infiniteHandlerBottom">
                            <!--            <template slot="spinner">加载中...</template>-->
                            <template slot="no-more">{{ $t('fav.no_more') }}</template>
                            <template slot="no-results">{{ $t('fav.all_fav_load') }}</template>
                        </infinite-loading>
                    </div>
                </div>
            </div>
            <div v-else class="empty">
                <p>没有搜索结果</p>
            </div>
        </div>
    </section>

</template>

<script>
import MessageContentContainerView from "./conversation/message/MessageContentContainerView";
import store from "../../store";
import localStorageEmitter from "../../ipc/localStorageEmitter";
import IPCEventType from "../../ipc/ipcEventType";
import InfiniteLoading from "vue-infinite-loading";

export default {
    name: "MessageHistoryPage",
    data() {
        return {
            query: '',
            conversationSearchResults: [],
            currentConversationSearchResult: null,
            currentConversationMessages: [],
            currentMessage: null,
            contextMessages: [],
        }
    },
    mounted() {
        document.title = '查找聊天记录'
    },
    methods: {

        openMessageContextMenu(event, msg) {
            // TODO
        },
        setCurrentConversationSearchResult(result) {
            this.currentConversationSearchResult = result;
            this.currentMessage = null;
        },

        isConversationItemActive(result) {
            return this.currentConversationSearchResult && (this.currentConversationSearchResult.conversation.equal(result.conversation))
        },

        openConversation() {
            let conversation = this.currentConversationSearchResult.conversation;
            localStorageEmitter.send('wf-ipc-to-main', {type: IPCEventType.openConversation, value: conversation})
        },

        showContextMessages(message) {
            this.currentMessage = message;
            this.contextMessages = [message];
        },

        infiniteHandlerTop($state) {
            let firstMsg = this.contextMessages[0];
            let conversaiton = this.currentConversationSearchResult.conversation;
            store.getMessages(conversaiton, firstMsg.messageUid, true, '', msgs => {
                if (msgs.length > 0) {
                    this.contextMessages = msgs.concat(this.contextMessages);
                    $state.loaded();
                } else {
                    $state.complete();
                }
            });
        },

        infiniteHandlerBottom($state) {
            let lastMsg = this.contextMessages[this.contextMessages.length - 1];
            let conversation = this.currentConversationSearchResult.conversation;
            store.getMessages(conversation, lastMsg.messageUid, false, '', msgs => {
                if (msgs.length > 0) {
                    this.contextMessages = this.contextMessages.concat(msgs);
                    $state.loaded();
                } else {
                    $state.complete();
                }
            });
        },
    },
    watch: {
        query() {
            if (this.query) {
                this.conversationSearchResults = store.searchConversation(this.query)
                this.currentConversationMessages = null;
                this.currentConversationSearchResult = null;
            } else {
                this.conversationSearchResults = [];
            }
        },
        currentConversationSearchResult() {
            if (this.currentConversationSearchResult) {
                this.currentConversationMessages = store.searchMessage(this.currentConversationSearchResult.conversation, this.query);
            } else {
                this.currentConversationMessages = null;
            }
        },
    },
    computed: {
        messages() {
            return this.currentMessage ? this.contextMessages : this.currentConversationMessages;
        }
    },
    components: {
        MessageContentContainerView,
        InfiniteLoading,
    }
}
</script>

<style scoped>
.message-history-page {
    width: 100vw;
    height: 100vh;
    background: #f3f3f3;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.search-input-container {
    height: 100px;
    padding: 40px 60px 30px 60px;
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
    border-bottom: 1px solid #e4e4e4;
}

.search-input-container input {
    height: 25px;
    padding: 0 10px 0 20px;
    text-align: left;
    flex: 1;
    border: 1px solid #e5e5e5;
    border-radius: 3px;
    outline: none;
    background-color: #eeeeee;
}

.search-input-container input:active {
    border: 1px solid #4168e0;
}

.search-input-container input:focus {
    border: 1px solid #4168e0;
}

.search-input-container i {
    position: absolute;
    left: 65px;
}

.portal {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
}

.empty {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
}

.search-result-container {
    flex: 1;
    display: flex;
    overflow: hidden;
}

.conversation-list {
    width: 240px;
    height: 100%;
    overflow: scroll;
    border-right: 1px solid #e4e4e4;
}

.conversation-item {
    width: 100%;
    height: 70px;
    display: flex;
    /*border-bottom: 1px solid #eeeeee;*/
    align-items: center;
    justify-content: center;
}

.conversation-item.active {
    background: #dedede;
}

.header {
    height: 100%;
    padding: 10px;
    position: relative;
}

.header .avatar {
    position: relative;
    width: 45px;
    height: 45px;
    min-width: 45px;
    min-height: 45px;
    background: #d6d6d6;
    top: 50%;
    transform: translateY(-50%);
    border-radius: 3px;
}

.content-container {
    width: 100%;
    height: 50px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    padding-right: 12px;
}

.content-container .title {
    display: inline-block;
    font-size: 14px;
    color: #262626;
    font-style: normal;
    font-weight: normal;
    padding-right: 10px;
    flex: 1;
}

.content-container .desc {
    color: #b8b8b8;
    font-size: 13px;
}

.conversation-message-list {
    height: 100%;
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 0 40px 20px 40px;
}

.conversation-message-list .desc-action-container {
    width: 100%;
    padding: 20px 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.desc-action-container .desc {
    color: #b8b8b8;
    font-size: 13px;
}

.desc-action-container .action {
    display: flex;
    align-items: center;
    color: #262626;
    margin-left: auto;
    font-size: 14px;
}

.desc-action-container .action i {
    padding-right: 5px;
}

.message-list-container {
    flex: 1;
    padding-bottom: 20px;
    margin-left: -10px;
    overflow: scroll;
}

.message-list-container ul {
    width: 100%;
    height: 100%;
    list-style-position: inside;
}

.message-list-container ul li {
    position: relative;
    padding: 10px 0;
}

.message-list-container ul li:not(:last-child)::after {
    content: "";
    width: calc(100% - 55px);
    position: absolute;
    margin-left: 55px;
    padding: 5px 0;
    border-bottom: 1px solid #f1f1f1;
}

.message-container {
    width: 100%;
    display: flex;
}

.name-time-content-container {
    width: 100%;
}

.name-time-container {
    width: 100%;
    padding: 5px 0;
    display: flex;
    justify-content: space-between;
}

.name-time-container p {
    font-size: 12px;
    color: #c2c2c2;
}

.name-time-content-container .content {
    display: inline-block;
    margin-left: -10px;
    margin-right: 65px;
}

.name-time-content-container .content .action {
    display: none;
    position: absolute;
    right: 0;
    top: 40px;
    font-size: 14px;
    color: #637599;
}

.message-container:hover .action {
    display: inline-block;
}


.portrait-container {
    width: 40px;
    height: 40px;
    min-width: 40px;
    min-height: 40px;
    overflow: hidden;
    margin: 10px;
}

.portrait-container img {
    width: 100%;
    height: 100%;
    border-radius: 3px;
}

>>> .text-message-container.out {
    background-color: #f3f3f3;
    padding-top: 0 !important;
    padding-left: 0 !important;
}

>>> .text-message-container {
    background-color: #f3f3f3;
    padding-top: 0 !important;
    padding-left: 0 !important;
}

>>> .rightarrow::before {
    display: none;
}

>>> .leftarrow::before {
    display: none;
}

</style>
