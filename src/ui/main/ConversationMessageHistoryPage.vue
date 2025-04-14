<template>
    <section>
        <div v-if="conversationInfo" class="conversation-message-history-page">
            <div class="title-container">
                <div class="portrait-container">
                    <img :src="conversationInfo.conversation._target.portrait" draggable="false" alt="">
                </div>
                <p class="single-line">{{ conversationInfo.conversation._target._displayName }}</p>
            </div>
            <div class="search-input-container">
                <input id="searchInput"
                       ref="input"
                       autocomplete="off"
                       v-model.trim="query"
                       @keydown.esc="cancel"
                       type="text" :placeholder="$t('common.search')"/>
                <i class="icon-ion-ios-search"></i>
            </div>
            <div class="category-container">
                <div class="category-item" v-bind:class="{active: category === 'all'}"
                     @click="setCurrentCategory('all')">全部
                </div>
                <div class="category-item" v-bind:class="{active: category === 'file'}"
                     @click="setCurrentCategory('file')">文件
                </div>
                <div class="category-item" v-bind:class="{active: category === 'media'}"
                     @click="setCurrentCategory('media')">图片与视频
                </div>
                <div class="category-item" v-bind:class="{active: category === 'link'}"
                     @click="setCurrentCategory('link')">链接
                </div>
            </div>
            <div v-if="currentMessage" class="desc-action-container">
                <i class="icon-ion-ios-arrow-back" @click="currentMessage = null">&nbsp;返回</i>
            </div>
            <div ref="conversationMessageList" class="message-list-container" infinite-wrapper>
                <infinite-loading ref="infiniteLoader" :identifier="'historyMessageLoader-' + category"
                                  force-use-infinite-wrapper
                                  direction="top"
                                  @infinite="infiniteHandler">
                    <!--            <template slot="spinner">加载中...</template>-->
                    <template #no-more>{{ $t('conversation.no_more_message') }}</template>
                    <template #no-results>{{ $t('conversation.no_more_message') }}</template>
                </infinite-loading>
                <ul>
                    <li v-for="(message, index) in filteredMessages"
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
                    <template #no-more>{{ $t('fav.no_more') }}</template>
                    <template #no-results>{{ $t('fav.all_fav_load') }}</template>
                </infinite-loading>
            </div>
        </div>
        <div class="drag-area"/>
    </section>
</template>

<script>
import MessageContentContainerView from "./conversation/message/MessageContentContainerView";
import Conversation from "../../wfc/model/conversation";
import store from "../../store";
import InfiniteLoading from "@imndx/vue-infinite-loading";
import MessageContentType from "../../wfc/messages/messageContentType";

export default {
    name: "ConversationMessageHistoryPage",

    data() {
        return {
            query: '',
            messages: [],
            filesMessages: [],
            mediaMessages: [],
            linkMessages: [],
            searchResults: [],
            conversationInfo: null,
            autoScrollToBottom: true,
            category: 'all',
            currentMessage: null,
            contextMessages: [],
        }
    },

    mounted() {
        let params = new URLSearchParams(window.location.hash.split('?')[1]);
        let type = Number(params.get('type'));
        let target = params.get('target');
        let line = Number(params.get('line'));
        this.conversationInfo = store.getConversationInfo(new Conversation(type, target, line));
    },

    updated() {
        if (this.autoScrollToBottom) {
            this.autoScrollToBottom = false;
            let messageListElement = this.$refs['conversationMessageList'];
            messageListElement.scroll({top: messageListElement.scrollHeight, left: 0, behavior: 'auto'})
        }
    },

    methods: {
        infiniteHandler($state) {
            if (this.currentMessage) {
                let firstMsg = this.contextMessages[0];
                let conversation = this.conversationInfo.conversation;
                store.getMessages(conversation, firstMsg.messageId, true, '', msgs => {
                    if (msgs.length > 0) {
                        this.contextMessages = msgs.concat(this.contextMessages);
                        $state.loaded();
                    } else {
                        $state.complete();
                    }
                });
                return;
            }
            if (this.query) {
                let contentTypes = this.categoryContentTypes();
                let tmp = store.searchMessageInTypes(this.conversationInfo.conversation, contentTypes, this.query, this.searchResults.length);
                console.log('to search', this.category, this.query, this.searchResults.length, tmp.length);
                if (tmp.length === 0) {
                    $state.complete();
                } else {
                    this.searchResults.push(...tmp);
                    $state.loaded();
                }
            } else {
                console.log('to load conversation message', this.category)
                let timestamp;
                let targetMsgs;
                let contentTypes = [];
                switch (this.category) {
                    case 'all':
                        targetMsgs = this.messages;
                        break;
                    case 'file':
                        targetMsgs = this.filesMessages;
                        contentTypes = [MessageContentType.File];
                        break;
                    case 'media':
                        targetMsgs = this.mediaMessages;
                        contentTypes = [MessageContentType.Image, MessageContentType.Video];
                        break;
                    case 'link':
                        targetMsgs = this.linkMessages;
                        contentTypes = [MessageContentType.Link];
                        break;
                    default:
                        break
                }
                timestamp = targetMsgs.length > 0 ? targetMsgs[0].timestamp : 0;
                store.getMessageInTypes(this.conversationInfo.conversation, contentTypes, timestamp, true, '', (msgs) => {
                    if (msgs && msgs.length > 0) {
                        targetMsgs.unshift(...msgs)
                        $state.loaded();
                    } else {
                        $state.complete();
                    }
                })
            }
        },

        infiniteHandlerBottom($state) {
            let lastMsg = this.contextMessages[this.contextMessages.length - 1];
            let conversation = this.conversationInfo.conversation;
            store.getMessages(conversation, lastMsg.messageId, false, '', msgs => {
                if (msgs.length > 0) {
                    this.contextMessages = this.contextMessages.concat(msgs);
                    $state.loaded();
                } else {
                    $state.complete();
                }
            });
        },
        setCurrentCategory(category) {
            this.category = category;
            this.autoScrollToBottom = true;
            this.currentMessage = null;
            this.contextMessages = [];
        },
        cancel() {
            this.query = '';
        },
        openMessageContextMenu(event, msg) {
            // TODO
        },

        categoryContentTypes() {
            let contentTypes = [];
            switch (this.category) {
                case 'file':
                    contentTypes = [MessageContentType.File];
                    break;
                case 'media':
                    contentTypes = [MessageContentType.Video, MessageContentType.Image];
                    break;
                case 'link':
                    contentTypes = [MessageContentType.Link];
                    break;
                default:
                    break;
            }
            return contentTypes;
        },

        showContextMessages(message) {
            this.currentMessage = message;
            this.contextMessages = [message];
            this.autoScrollToBottom = false;
        },
    },

    computed: {
        filteredMessages() {
            if (this.currentMessage) {
                return this.contextMessages;
            }

            if (this.query && this.searchResults) {
                return this.searchResults;
            }
            let msgs;
            switch (this.category) {
                case 'file':
                    msgs = this.filesMessages;
                    break;
                case 'media':
                    msgs = this.mediaMessages;
                    break;
                case 'link':
                    msgs = this.linkMessages;
                    break;
                default:
                    msgs = this.messages;
                    break

            }
            return msgs;
        }
    },

    watch: {
        query() {
            if (this.query) {
                this.$refs.infiniteLoader.stateChanger.reset();
                let contentTypes = this.categoryContentTypes();
                this.searchResults = store.searchMessageInTypes(this.conversationInfo.conversation, contentTypes, this.query, 0);
            } else {
                this.searchResults = [];
            }
        },
        category() {
            if (this.query) {
                let contentTypes = this.categoryContentTypes();
                this.searchResults = store.searchMessageInTypes(this.conversationInfo.conversation, contentTypes, this.query, 0);
            }
        }
    },

    components: {
        MessageContentContainerView,
        InfiniteLoading,
    }
}
</script>

<style scoped lang="css">
.conversation-message-history-page {
    width: 100vw;
    height: 100vh;
    background: #f3f3f3;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.title-container {
    width: 100%;
    padding: 40px 40px 0 40px;
    display: flex;
    flex-direction: row;
    align-items: center;
}

.drag-area {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 120px;
    z-index: -1;
    -webkit-app-region: drag;
}

.title-container .portrait-container {
    width: 60px;
    height: 60px;
    margin-right: 20px;
    border-radius: 3px;
    background: #e0e0e0;
}

.search-input-container {
    height: 60px;
    margin: 0 40px 0 40px;
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
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
    left: 5px;
}

.category-container {
    display: flex;
    padding: 15px 0;
    border-top: 1px solid #e0e0e0;
    flex-direction: row;
    justify-content: space-around;
}

.category-item {

}

.category-item.active {
    color: #4168e0;
}

.message-list-container {
    display: flex;
    flex-direction: column;
    flex: 1;
    padding: 0 40px 20px 40px;
    overflow: scroll;
}

.message-list-container ul {
    width: 100%;
    flex: 1;
    list-style-position: inside;
}

.message-list-container ul li {
    position: relative;
    padding: 10px 0;
}

.desc-action-container {
    width: 100%;
    padding: 10px 40px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
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
    margin-left: -20px;
    margin-right: 60px;
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
}

>>> .text-message-container {
    background-color: #f3f3f3;
    padding-top: 0 !important;
}

>>> .rightarrow::before {
    display: none;
}

>>> .leftarrow::before {
    display: none;
}

</style>
