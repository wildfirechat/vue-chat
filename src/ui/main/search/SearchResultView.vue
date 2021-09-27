<template>
    <section class="search-result-container"
             v-if="sharedSearchState.show"
             v-bind:class="{active:sharedSearchState.show}"
             v-click-outside="hideSearchView"
             @click="hideSearchView"
    >
        <div class="search-result">
            <ul>
                <li class="category-item" v-if="sharedSearchState.userSearchResult.length > 0">
                    <label>{{ $t('search.new_user') }}</label>
                    <ul>
                        <li v-for="(user, index) in toShowUserList" :key="index">
                            <div class="search-result-item contact">
                                <img :src="user.portrait">
                                <span>{{ user.displayName }}</span>
                                <button @click.stop="addFriend(user)">{{ $t('common.add') }}</button>
                            </div>
                        </li>
                    </ul>
                    <div v-if="!shouldShowAllUser&& this.sharedSearchState.userSearchResult.length > 5"
                         class="show-all"
                         @click.stop="showAllUser">
                        {{ $t('search.view_all') + this.sharedSearchState.contactSearchResult.length }}
                    </div>
                </li>
                <li class="category-item" v-if="sharedSearchState.contactSearchResult.length > 0">
                    <label>{{ $t('common.contact') }}</label>
                    <ul>
                        <li v-for="(contact, index) in toShowContactList" :key="index">
                            <div class="search-result-item contact" @click.stop="chatToContact(contact)">
                                <img :src="contact.portrait">
                                <span>{{ contact._displayName }}</span>
                            </div>
                        </li>
                    </ul>
                    <div v-if="!shouldShowAllContact && this.sharedSearchState.contactSearchResult.length > 5"
                         class="show-all"
                         @click.stop="showAllContact">
                        {{ $t('search.view_all') + this.sharedSearchState.contactSearchResult.length }}
                    </div>
                </li>
                <li class="category-item" v-if="sharedSearchState.groupSearchResult.length > 0">
                    <label>{{ $t('contact.group') }}</label>
                    <ul>
                        <li v-for="(group, index) in toShowGroupList" :key="index">
                            <div class="search-result-item group" @click="chatToGroup(group)">
                                <img :src="group.portrait">
                                <span>{{ group.name }}</span>
                            </div>
                        </li>
                    </ul>
                    <div v-if="!shouldShowAllGroup && this.sharedSearchState.groupSearchResult.length > 5"
                         class="show-all"
                         @click.stop="showAllGroup">
                        {{ $t('search.view_all') + this.sharedSearchState.groupSearchResult.length }}
                    </div>
                </li>
                <li class="category-item" v-if="sharedMiscState.isElectron">
                    <label>{{ $t('search.message_history') }}</label>
                    <div class="search-result-item message" @click="showMessageHistoryPage">
                        <p>{{ $t('search.search_message_history') }} </p>
                    </div>
                </li>
            </ul>
        </div>
    </section>
</template>

<script>
import ClickOutside from "vue-click-outside";
import store from "@/store";
import Conversation from "@/wfc/model/conversation";
import ConversationType from "@/wfc/model/conversationType";
import FriendRequestView from "@/ui/main/contact/FriendRequestView";
import IPCRendererEventType from "../../../ipcRendererEventType";
import {ipcRenderer} from "../../../platform";

export default {
    name: "SearchResultView",
    props: [
        "query"
    ],
    data() {
        return {
            sharedSearchState: store.state.search,
            sharedMiscState: store.state.misc,
            shouldShowAllUser: false,
            shouldShowAllContact: false,
            shouldShowAllGroup: false,
        }
    },

    mounted() {
        // do nothing
    },

    beforeDestroy() {
        store.setSearchQuery('')
    },

    watch: {
        // "query":function (val, oldVal){
        //   console.log('searchView query changed:', val, oldVal)
        // }
        // or
        query() {
            console.log('searchView query changed:', this.query)
            store.setSearchQuery(this.query)
        }
    },

    methods: {
        addFriend(user) {
            this.$modal.show(
                FriendRequestView,
                {
                    userInfo: user,
                },
                {
                    name: 'friend-request-modal',
                    width: 600,
                    height: 250,
                    clickToClose: false,
                }, {})
        },
        showAllUser() {
            this.shouldShowAllUser = true;
        },
        showAllContact() {
            this.shouldShowAllContact = true;
        },

        showAllGroup() {
            this.shouldShowAllGroup = true;
        },

        hideSearchView(e) {
            if (e.target.id !== 'searchInput') {
                store.toggleSearchView(false)
            }
        },

        chatToContact(contact) {
            if (this.$router.currentRoute.path !== '/home') {
                this.$router.replace("/home");
            }
            let conversation = new Conversation(ConversationType.Single, contact.uid, 0);
            store.setCurrentConversation(conversation);
            store.toggleSearchView(false);
        },

        chatToGroup(group) {
            if (this.$router.currentRoute.path !== '/home') {
                this.$router.replace("/home");
            }
            let conversation = new Conversation(ConversationType.Group, group.target, 0);
            store.setCurrentConversation(conversation);
            store.toggleSearchView(false);
        },

        showMessageHistoryPage() {
            let hash = window.location.hash;
            let url = window.location.origin;
            if (hash) {
                url = window.location.href.replace(hash, '#/message-history');
            } else {
                url += "/message-history"
            }
            ipcRenderer.send(IPCRendererEventType.showMessageHistoryPage, {
                url: url,
            });
            console.log(IPCRendererEventType.showMessageHistoryPage, url)
        }

    },

    computed: {
        toShowUserList: function () {
            return !this.shouldShowAllUser && this.sharedSearchState.userSearchResult.length > 5 ? this.sharedSearchState.userSearchResult.slice(0, 4) : this.sharedSearchState.userSearchResult;
        },
        toShowContactList: function () {
            return !this.shouldShowAllContact && this.sharedSearchState.contactSearchResult.length > 5 ? this.sharedSearchState.contactSearchResult.slice(0, 4) : this.sharedSearchState.contactSearchResult;
        },
        toShowGroupList: function () {
            return !this.shouldShowAllGroup && this.sharedSearchState.groupSearchResult.length > 5 ? this.sharedSearchState.groupSearchResult.slice(0, 4) : this.sharedSearchState.groupSearchResult;
        }
    },

    directives: {
        ClickOutside
    },

}
</script>

<style lang="css" scoped>

.search-result-container {
    display: none;
}

.search-result-container.active {
    display: block;
    z-index: 100;
    overflow: auto;
    /*background-color: red;*/
    background-color: #f3f3f3e5;
}

.search-result-container ul {
    list-style: none;
    background-color: white;
}


.category-item label {
    color: #b2b2b2;
    display: block;
    padding-top: 10px;
    padding-bottom: 2px;
    margin-left: 12px;
    border-bottom: 1px solid #eeeeee;
}

.search-result-item {
    background-color: white;
    padding: 10px 12px;
}

.search-result-item:active {
    background-color: #d9d9d9;
}

.search-result-item.contact {
    width: 100%;
    display: flex;
    align-items: center;
}

.search-result-item.contact img {
    width: 34px;
    height: 34px;
    border-radius: 2px;
}

.search-result-item.contact span {
    font-size: 14px;
    padding-left: 10px;
}

.search-result-item.contact button {
    margin-left: auto;
    padding: 3px 10px;
    border-radius: 3px;
    border: 1px solid #cccccc;
    outline: none;
}

.search-result-item.contact button:active {
    background: #cccccc;
}

.search-result-item.group {
    width: 100%;
    display: flex;
    align-items: center;
}

.search-result-item.group img {
    width: 34px;
    height: 34px;
    border-radius: 2px;
}

.search-result-item.group span {
    font-size: 14px;
    padding-left: 10px;
}

.search-result-item.message {
    height: 54px;
    display: flex;
    align-items: center;
}

.show-all {
    padding-left: 12px;
    color: #66789d;
    font-size: 12px;
}

</style>
