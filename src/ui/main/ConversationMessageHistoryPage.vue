<template>
    <section>
        <div v-if="conversationInfo" class="conversation-message-history-page">
            <div class="title-container">
                <div class="portrait-container">
                    <img :src="conversationInfo.conversation._target.portrait" alt="">
                </div>
                <p class="single-line">{{ conversationInfo.conversation._target._displayName }}</p>
            </div>
            <div class="search-input-container">
                <input id="searchInput"
                       ref="input"
                       autocomplete="off"
                       v-model="query"
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
            <div ref="conversationMessageList" class="message-list-container" infinite-wrapper>
                <infinite-loading v-if="category==='all' && !this.query" identifier="historyMessageLoader"
                                  force-use-infinite-wrapper
                                  direction="top"
                                  @infinite="infiniteHandler">
                    <!--            <template slot="spinner">加载中...</template>-->
                    <template slot="no-more">{{ $t('fav.no_more') }}</template>
                    <template slot="no-results">{{ $t('fav.all_fav_load') }}</template>
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
                                </div>
                            </div>

                        </div>
                    </li>
                </ul>
            </div>
        </div>
    </section>
</template>

<script>
import MessageContentContainerView from "./conversation/message/MessageContentContainerView";
import Conversation from "../../wfc/model/conversation";
import store from "../../store";
import InfiniteLoading from "vue-infinite-loading";
import {stringValue} from "../../wfc/util/longUtil";
import MessageContentType from "../../wfc/messages/messageContentType";

export default {
    name: "ConversationMessageHistoryPage",

    data() {
        return {
            query: '',
            messages: [],
            searchResults: [],
            conversationInfo: null,
            autoScrollToBottom: true,
            category: 'all',
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
            let firstMessageUid = this.messages.length > 0 ? this.messages[0].messageUid : 0;
            console.log('to load', stringValue(firstMessageUid))
            store.getMessages(this.conversationInfo.conversation, firstMessageUid, true, '', (msgs) => {
                if (msgs && msgs.length > 0) {
                    this.messages = msgs.concat(this.messages);
                    $state.loaded();
                } else {
                    $state.complete();
                }
            })
        },
        setCurrentCategory(category) {
            this.category = category;
            this.autoScrollToBottom = true;
        },
        cancel() {
            this.query = '';
        },
        openMessageContextMenu(event, msg) {
            // TODO
        }
    },

    computed: {
        filteredMessages() {
            let msgs = this.query ? this.searchResults : this.messages;
            switch (this.category) {
                case 'file':
                    msgs = msgs.filter(m => m.messageContent.type === MessageContentType.File);
                    break;
                case 'media':
                    msgs = msgs.filter(m => [MessageContentType.Image, MessageContentType.Video].indexOf(m.messageContent.type) >= 0);
                    break;
                case 'link':
                    msgs = msgs.filter(m => m.messageContent.type === MessageContentType.Link);
                    break;
                default:
                    // do nothing
                    break

            }
            return msgs;
        }
    },

    watch: {
        query() {
            if (this.query) {
                this.searchResults = store.searchMessage(this.conversationInfo.conversation, this.query);
            } else {
                this.searchResults = [];
            }
        },
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
    flex: 1;
    padding: 0 40px 20px 40px;
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
    margin-left: -20px;
    margin-right: 60px;
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
