<template>
    <section>
        <div class="file-record-page">
            <h2 class="title">文件记录</h2>
            <div class="file-record-container">

                <div class="category-container">
                    <div class="search-input-container">
                        <input id="searchInput"
                               ref="input"
                               autocomplete="off"
                               v-model="fileQuery"
                               @keydown.esc="cancelSearch"
                               type="text" :placeholder="$t('common.search')"/>
                        <i class="icon-ion-ios-search"></i>
                    </div>
                    <ul>
                        <li>
                            <div class="category-item" v-bind:class="{active:category === CATEGORY_ALL}"
                                 @click="showAllFiles">
                                <i class="icon-ion-folder"></i>
                                <p>{{ $t('common.all') }}</p>
                            </div>
                        </li>
                        <li>
                            <div class="category-item" v-bind:class="{active:category === CATEGORY_ME}"
                                 @click="showMyFiles">
                                <i class="icon-ion-android-send"></i>
                                <p>{{ $t('common.mine') }}</p>
                            </div>
                        </li>
                        <li>
                            <div class="category-item" v-bind:class="{active: category === CATEGORY_CONVERSATION}"
                                 @click="showConversations">
                                <i class="icon-ion-ios-chatboxes"></i>
                                <p>{{ $t('common.conversation') }}</p>
                            </div>
                        </li>
                        <li>
                            <div class="category-item" v-bind:class="{active: category === CATEGORY_SENDER}"
                                 @click="showSenders">
                                <i class="icon-ion-person"></i>
                                <p>{{ $t('common.sender') }}</p>
                            </div>
                        </li>
                    </ul>

                </div>
                <div v-if="category === CATEGORY_CONVERSATION && !fileQuery"
                     class="conversation-list-container">
                    <!--      聊天列表-->
                    <ul>
                        <li v-for="conversationInfo in sharedConversationState.conversationInfoList"
                            @click="showConversationFiles(conversationInfo.conversation)"
                            :key="conversationInfoKey(conversationInfo)">
                            <div class="conversation-item"
                                 v-bind:class="{active:currentConversation && currentConversation.equal(conversationInfo.conversation)}">
                                <img :src="conversationInfo.conversation._target.portrait" alt="">
                                <p class="single-line">{{ conversationInfo.conversation._target._displayName }}</p>
                            </div>
                        </li>
                    </ul>
                </div>
                <div v-if="category === CATEGORY_SENDER && !fileQuery"
                     class="conversation-list-container">
                    <!--      发送者列表-->
                    <UserListVue :users="sharedContactState.friendList"
                                 :show-category-label="false"
                                 :current-user="currentUser"
                                 :click-user-item-func="showUserFiles"
                    />
                </div>
                <div class="file-record-list-container" infinite-wrapper>
                    <!--      文件记录-->
                    <div v-if="computedFileRecords.length > 0">
                        <ul>
                            <li v-for="fr in computedFileRecords"
                                :key="fr.messageUid.toString()">
                                <div class="file-record-item" @click="clickFile(fr)">
                                    <img :src="require(`@/assets/images/filetypes/${fr._fileIconName}`)" alt="">
                                    <div class="file-name-sender-container">
                                        <p class="name single-line"> {{ fr.name }}</p>
                                        <p class="sender single-line">
                                            {{ fr._userDisplayName + ' | ' + fr._conversationDisplayName }}</p>
                                    </div>
                                    <div class="file-date-size-container">
                                        <p class="date single-line">{{ fr._timeStr }}</p>
                                        <p class="size single-line">{{ fr._sizeStr }}</p>
                                    </div>
                                </div>
                            </li>
                        </ul>
                        <infinite-loading v-if="!fileQuery" :identifier="loadingIdentifier" force-use-infinite-wrapper
                                          direction="bottom"
                                          @infinite="infiniteHandler">
                            <!--            <template slot="spinner">加载中...</template>-->
                            <template slot="no-more">{{ $t('file_record.no_more') }}</template>
                            <template slot="no-results">{{ $t('file_record.all_file_load') }}</template>
                        </infinite-loading>
                    </div>
                    <div v-else class="file-record-empty-container">{{ emptyDesc }}</div>
                </div>
            </div>
        </div>
    </section>
</template>

<script>
import store from "@/store";
import InfiniteLoading from "vue-infinite-loading";
import {ipcRenderer, isElectron} from "@/platform";
import UserListVue from "@/ui/main/user/UserListVue";

export default {
    name: "FileRecordPage",
    data() {
        return {
            category: 'all',
            currentConversation: null,
            currentUser: null,
            sharedConversationState: store.state.conversation,
            sharedContactState: store.state.contact,
            sharedSearchState: store.state.search,
            fileRecords: [],
            fileQuery: '',
            searchFileRecordResult: [],

            CATEGORY_ME: 'me',
            CATEGORY_ALL: 'all',
            CATEGORY_CONVERSATION: 'conversation',
            CATEGORY_SENDER: 'sender',
        }
    },
    methods: {
        conversationInfoKey(conversationInfo) {
            let conv = conversationInfo.conversation;
            return conv.target + '-' + conv.type + '-' + conv.line;
        },

        showAllFiles() {
            this.cancelSearch();
            if (this.category === this.CATEGORY_ALL) {
                return;
            }
            this.category = this.CATEGORY_ALL;
            this.fileRecords = [];
            this.getConversationFileRecords('', '')
        },

        showMyFiles() {
            this.cancelSearch();
            if (this.category === this.CATEGORY_ME) {
                return;
            }
            this.category = this.CATEGORY_ME;
            this.fileRecords = [];
            this.getMyFileRecords();
        },

        showConversations() {
            this.cancelSearch();
            if (this.category === this.CATEGORY_CONVERSATION) {
                return;
            }
            this.category = this.CATEGORY_CONVERSATION;
            this.fileRecords = [];
            if (this.currentConversation) {
                this.showConversationFiles(this.currentConversation, true);
            }
        },

        showSenders() {
            this.cancelSearch();
            if (this.category === this.CATEGORY_SENDER) {
                return;
            }
            this.category = this.CATEGORY_SENDER;
            this.fileRecords = [];
            if (this.currentUser) {
                this.showUserFiles(this.currentUser)
            }
        },

        showConversationFiles(conversation, force = false) {
            if (!force && this.currentConversation && this.currentConversation.equal(conversation)) {
                return;
            }
            this.currentConversation = conversation;
            this.fileRecords = [];
            this.getConversationFileRecords(conversation, '')
        },

        showUserFiles(user, force = false) {
            if (!force && this.currentUser && this.currentUser.uid === user.uid) {
                return;
            }
            this.currentUser = user;
            this.fileRecords = [];
            this.getConversationFileRecords('', user.uid)
        },


        getMyFileRecords() {
            store.getMyFileRecords(0, 20, fileRecords => {
                this.fileRecords = this.fileRecords.concat(fileRecords);
            }, err => {
                // TODO

            })
        },

        getUserFiles(userInfo) {
            // TODO
        },

        getConversationFileRecords(conversation, fromUser) {
            this.fileRecords = [];
            store.getConversationFileRecords(conversation, fromUser, 0, 20, fileRecords => {
                this.fileRecords = this.fileRecords.concat(fileRecords);
            }, err => {
                // TODO
            })
        },

        infiniteHandler($state) {
            let lastMessageUid = this.fileRecords.length > 0 ? this.fileRecords[this.fileRecords.length - 1].messageUid : 0;
            let successCB = (fileRecords) => {
                if (fileRecords.length === 0) {
                    console.log('load file records complete')
                    $state.complete();
                    return;
                }
                this.fileRecords = this.fileRecords.concat(fileRecords);
                $state.loaded();
            };
            let failCB = (err) => {
                $state.complete()
                console.log('getMyFileRecords error', err)
            };

            switch (this.category) {
                case this.CATEGORY_ALL:
                    store.getConversationFileRecords('', '', lastMessageUid, 20, successCB, failCB)
                    break;
                case this.CATEGORY_ME:
                    store.getMyFileRecords(lastMessageUid, 20, successCB, failCB);
                    break;
                case this.CATEGORY_CONVERSATION:
                    store.getConversationFileRecords(this.currentConversation, '', lastMessageUid, 20, successCB, failCB)
                    break;
                case this.CATEGORY_SENDER:
                    store.getConversationFileRecords('', this.currentUser.uid, lastMessageUid, 20, successCB, failCB)
                    break;
                default:
                    break;
            }
        },

        clickFile(fileRecord) {
            if (isElectron()) {
                ipcRenderer.send('file-download', {
                    // TODO -1时，不通知进度
                    messageId: -1,
                    remotePath: fileRecord.url,
                    fileName: fileRecord.name,
                    source: 'file',
                });
            }
        },
        cancelSearch() {
            this.$refs['input'].innerHTML = '';
            this.fileQuery = '';
            this.searchFileRecordResult = [];
        }
    },

    watch: {
        fileQuery(query) {
            this.fileQuery = query
            store.searchFiles(query, 0,
                (frs) => {
                    if (query === this.fileQuery) {
                        this.searchFileRecordResult = frs;
                    }
                },
                (errorCode) => {
                    console.log('search file error', errorCode)
                }
            )
        }
    },

    computed: {
        loadingIdentifier() {
            let identifier = ''
            switch (this.category) {
                case this.CATEGORY_ALL:
                    identifier = 'all'
                    break;
                case this.CATEGORY_ME:
                    identifier = 'me'
                    break;
                case this.CATEGORY_CONVERSATION:
                    identifier = 'conversation-' + this.currentConversation.type + '-' + this.currentConversation.target + '-' + this.currentConversation.line;
                    break;
                case this.CATEGORY_SENDER:
                    identifier = 'user-' + this.currentUser.uid;
                    break;
                default:
                    break;
            }
            return identifier;
        },
        emptyDesc() {
            let desc = '没有文件记录';
            if (this.fileQuery) {
                return desc;
            }
            if (this.category === this.CATEGORY_CONVERSATION && this.currentConversation === null) {
                desc = '没有选择会话'
            } else if (this.category === this.CATEGORY_SENDER && this.currentUser === null) {
                desc = '没有选择发送者';
            }

            return desc;
        },
        computedFileRecords() {
            return this.fileQuery ? this.searchFileRecordResult : this.fileRecords;
        }
    },

    mounted() {
        // all
        this.getConversationFileRecords('', '')
    },

    created() {
        document.title = '文件记录';
    },

    components: {
        UserListVue,
        InfiniteLoading,
    }
}
</script>

<style lang="css" scoped>

.file-record-page {
    width: 100vw;
    height: 100vh;
    display: flex;
    flex-direction: column;
    background-color: #f7f7f7;
}

.file-record-page .title {
    padding-left: 20px;
    height: 40px;
    display: none;
    font-weight: normal;
    font-style: normal;
}

.file-record-page .file-record-container {
    flex: 1;
    height: 100%;
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
}

.file-record-container .category-container {
    width: 120px;
    height: 100%;
}

.search-input-container {
    height: 50px;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #fafafa;
    position: relative;
}

.search-input-container input {
    height: 25px;
    width: 110px;
    margin: 0 10px;
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
    left: 10px;
}

.category-item {
    display: flex;
    flex-direction: row;
    padding: 5px 0 5px 20px;
    height: 50px;
    align-items: center;
}

.category-item:active {
    background-color: #dedede;
}

.category-item.active {
    background-color: #dedede;
}

.category-item p {
    margin-left: 10px;
    font-size: 14px;
    flex: 1;
}

.conversation-list-container {
    border-left: 1px solid #e4e4e4;
    border-right: 1px solid #e4e4e4;
    width: 185px;
    height: 100%;
    overflow: auto;
}

.conversation-item {
    height: 50px;
    width: 100%;
    display: flex;
    align-items: center;
}

.conversation-item img {
    width: 36px;
    height: 36px;
    margin: 8px 16px;
    min-width: 36px;
    min-height: 36px;
}

.conversation-item p {
    flex: 1;
    font-size: 14px;
    margin-right: 16px;
}

.conversation-item:active {
    background-color: #dedede;
}

.conversation-item.active {
    background-color: #dedede;
}

.file-record-container .file-record-list-container {
    flex: 1;
    height: 100%;
    background-color: white;
    overflow: auto;
}

.file-record-empty-container {
    height: 100%;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    color: #b6b6b6;
}


.file-record-item {
    position: relative;
    height: 70px;
    width: 100%;
    display: flex;
    padding: 0 35px 0 35px;
    align-items: center;
    justify-content: space-between;
}

.file-record-item:after {
    display: block;
    position: absolute;
    content: " ";
    height: 0;
    top: 70px;
    left: 40px;
    right: 35px;
    border-bottom: 1px solid #f2f2f2;
}

.file-record-item:active {
    background-color: #dedede;
}

.file-record-item img {
    width: 40px;
    height: 40px;
    margin: 0 15px 0 0;
}

.file-name-sender-container {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    max-width: calc(100% - 40px - 100px);
    flex: 1;
}

.file-name-sender-container .name {
    font-size: 13px;
    color: #252525;
    padding-bottom: 3px;
}

.file-name-sender-container .sender {
    padding-top: 3px;
    font-size: 12px;
    color: #b6b6b6;
}

.file-date-size-container {
    display: flex;
    align-items: flex-end;
    flex-direction: column;
    width: 100px;
    justify-content: center;
}

.file-date-size-container .date {
    font-size: 12px;
    padding-left: 15px;
    color: #b6b6b6;
    padding-bottom: 3px;
}

.file-date-size-container .size {
    font-size: 12px;
    color: #b2b2b2;
    padding-top: 3px;
}

</style>
