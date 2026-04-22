<template>
    <section v-if="sharedSearchState.query.length"
             ref="floatingPanel"
             class="search-result-floating"
             :style="floatingStyle">
        <div class="search-result">
            <ul>
                <li class="category-item" v-if="sharedSearchState.userSearchResult.length > 0">
                    <label>{{ sharedSearchState.searchDomainInfo ? `在 ${sharedSearchState.searchDomainInfo.name} 中的搜索结果` : $t('search.new_user') }}</label>
                    <ul>
                        <li v-for="(user, index) in toShowUserList" :key="index">
                            <div class="search-result-item contact" @click.stop="chatToContact(user)">
                                <img :src="user.portrait">
                                <span class="single-line">{{ user.displayName }}</span>
                                <button @click.stop="addFriend(user)">{{ $t('common.add') }}</button>
                            </div>
                        </li>
                    </ul>
                    <div v-if="!shouldShowAllUser&& this.sharedSearchState.userSearchResult.length > 5"
                         class="show-all"
                         @click.stop="showAllUser">
                        {{ $t('search.view_all') + this.sharedSearchState.userSearchResult.length }}
                    </div>
                </li>
                <li class="category-item" v-if="sharedSearchState.channelSearchResult.length > 0">
                    <label>{{ $t('common.channel') }}</label>
                    <ul>
                        <li v-for="(channel, index) in toShowChannelList" :key="index">
                            <div class="search-result-item contact" @click.stop="chatToChannel(channel)">
                                <img :src="channel.portrait">
                                <span class="single-line">{{ channel.name }}</span>
                            </div>
                        </li>
                    </ul>
                    <div v-if="!shouldShowAllChannel&& this.sharedSearchState.channelSearchResult.length > 5"
                         class="show-all"
                         @click.stop="showAllChannel">
                        {{ $t('search.view_all') + this.sharedSearchState.channelSearchResult.length }}
                    </div>
                </li>
                <li class="category-item" v-if="sharedSearchState.contactSearchResult.length > 0">
                    <label>{{ $t('common.contact') }}</label>
                    <ul>
                        <li v-for="(contact, index) in toShowContactList" :key="index">
                            <div class="search-result-item contact" @click.stop="chatToContact(contact)">
                                <img :src="contact.portrait">
                                <span class="single-line">{{ contact._displayName }}</span>
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
                                <span class="single-line">{{ group.remark ? group.remark : group.name }}</span>
                            </div>
                        </li>
                    </ul>
                    <div v-if="!shouldShowAllGroup && this.sharedSearchState.groupSearchResult.length > 5"
                         class="show-all"
                         @click.stop="showAllGroup">
                        {{ $t('search.view_all') + this.sharedSearchState.groupSearchResult.length }}
                    </div>
                </li>
                <li class="category-item" v-if="sharedSearchState.conversationSearchResult.length > 0">
                    <label>{{ '会话' }}</label>
                    <ul>
                        <li v-for="(conv, index) in toShowConversationList" :key="index">
                            <div class="search-result-item group" @click="chatToConversation(conv.conversation)">
                                <img :src="conv.conversation._target.portrait">
                                <span class="single-line">{{ conv.conversation._target._displayName }}</span>
                            </div>
                        </li>
                    </ul>
                    <div v-if="!shouldShowAllConversation && this.sharedSearchState.conversationSearchResult.length > 5"
                         class="show-all"
                         @click.stop="showAllConversation">
                        {{ $t('search.view_all') + this.sharedSearchState.conversationSearchResult.length }}
                    </div>
                </li>
                <li class="category-item" v-if="sharedMiscState.isElectron">
                    <label>{{ $t('search.message_history') }}</label>
                    <div class="search-result-item message" @click="showMessageHistoryPage">
                        <p>{{ $t('search.search_message_history') }} </p>
                    </div>
                </li>
                <li class="category-item" v-else-if="isSearchResultEmpty">
                    <label style="padding-bottom: 8px">{{ $t('search.result_empty') }}</label>
                </li>
            </ul>
        </div>
    </section>
</template>

<script>
import store from '../../../store';
import Conversation from '../../../wfc/model/conversation';
import ConversationType from '../../../wfc/model/conversationType';
import FriendRequestView from '../contact/FriendRequestView.vue';
import IpcEventType from '../../../ipcEventType';
import { ipcRenderer } from '../../../platform';
import wfc from '../../../wfc/client/wfc';

const FLOATING_PANEL_MIN_WIDTH = 320;
const FLOATING_PANEL_MIN_HEIGHT = 180;
const FLOATING_PANEL_VIEWPORT_PADDING = 8;
const FLOATING_PANEL_OFFSET_Y = 6;
const FLOATING_PANEL_FALLBACK_TOP = 66;
export default {
    name: 'SearchResultView',
    props: [
        'query'
    ],
    data() {
        return {
            sharedSearchState: store.state.search,
            sharedMiscState: store.state.misc,
            shouldShowAllUser: false,
            shouldShowAllChannel: false,
            shouldShowAllContact: false,
            shouldShowAllGroup: false,
            shouldShowAllConversation: false,
            floatingStyle: {
                left: '0px',
                top: '0px',
                width: '320px',
                maxHeight: '320px',
                visibility: 'visible',
            },
        }
    },

    mounted() {
        store.setSearchQuery(this.query)
        this.bindFloatingEvents()
        this.$nextTick(() => {
            this.updateFloatingPosition()
        })
    },

    beforeUnmount() {
        this.unbindFloatingEvents()
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
            this.$nextTick(() => {
                this.updateFloatingPosition()
            })
        },
        'sharedSearchState.query'() {
            this.$nextTick(() => {
                this.updateFloatingPosition()
            })
        }
    },

    methods: {
        bindFloatingEvents() {
            document.addEventListener('pointerdown', this.onGlobalPointerDown, true)
            window.addEventListener('resize', this.updateFloatingPosition)
            window.addEventListener('scroll', this.updateFloatingPosition, true)
        },
        unbindFloatingEvents() {
            document.removeEventListener('pointerdown', this.onGlobalPointerDown, true)
            window.removeEventListener('resize', this.updateFloatingPosition)
            window.removeEventListener('scroll', this.updateFloatingPosition, true)
        },
        onGlobalPointerDown(e) {
            const panel = this.$refs.floatingPanel
            if (panel && panel.contains(e.target)) {
                return
            }
            const anchorEl = this.getAnchorElement()
            if (anchorEl && anchorEl.contains(e.target)) {
                return
            }
            store.hideSearchView()
        },
        getAnchorElement() {
            if (document.activeElement && document.activeElement.id === 'searchInput') {
                return document.activeElement
            }
            const inputs = Array.from(document.querySelectorAll('#searchInput'))
            if (inputs.length === 0) {
                return null
            }
            const visibleInput = inputs.find((input) => {
                const rect = input.getBoundingClientRect()
                return rect.width > 0 && rect.height > 0
            })
            return visibleInput || inputs[0]
        },
        getMainContentContainerRect() {
            return document.getElementById('main-content-container').getBoundingClientRect()
        },
        buildFloatingStyle({ left, top, width, maxHeight }) {
            return {
                left: `${Math.round(left)}px`,
                top: `${Math.round(top)}px`,
                width: `${Math.round(width)}px`,
                maxHeight: `${Math.round(maxHeight)}px`,
                visibility: 'visible',
            }
        },
        clamp(value, min, max) {
            return Math.min(Math.max(value, min), max)
        },
        getFloatingBounds(anchorRect, contentRect) {
            const top = anchorRect.bottom + FLOATING_PANEL_OFFSET_Y
            const viewportBottom = window.innerHeight - FLOATING_PANEL_VIEWPORT_PADDING
            const containerBottom = contentRect.bottom - FLOATING_PANEL_VIEWPORT_PADDING
            const maxBottom = Math.min(viewportBottom, containerBottom)

            let left = Math.max(anchorRect.left, FLOATING_PANEL_VIEWPORT_PADDING)
            let width = Math.max(FLOATING_PANEL_MIN_WIDTH, anchorRect.width + 40)
            const maxWidth = window.innerWidth - FLOATING_PANEL_VIEWPORT_PADDING * 2

            width = this.clamp(width, FLOATING_PANEL_MIN_WIDTH, maxWidth)
            if (left + width > window.innerWidth - FLOATING_PANEL_VIEWPORT_PADDING) {
                left = window.innerWidth - FLOATING_PANEL_VIEWPORT_PADDING - width
            }

            return {
                left,
                top,
                width,
                maxHeight: Math.max(FLOATING_PANEL_MIN_HEIGHT, maxBottom - top),
            }
        },
        updateFloatingPosition() {
            if (!this.sharedSearchState.query || !this.sharedSearchState.query.length) {
                return
            }
            const anchorEl = this.getAnchorElement()
            const contentRect = this.getMainContentContainerRect()
            if (!anchorEl) {
                const top = Math.max(contentRect.top + FLOATING_PANEL_FALLBACK_TOP, FLOATING_PANEL_FALLBACK_TOP)
                const maxHeight = Math.max(FLOATING_PANEL_MIN_HEIGHT, contentRect.bottom - FLOATING_PANEL_VIEWPORT_PADDING - top)
                this.floatingStyle = this.buildFloatingStyle({
                    left: 12,
                    top,
                    width: FLOATING_PANEL_MIN_WIDTH,
                    maxHeight,
                })
                return
            }

            this.floatingStyle = this.buildFloatingStyle(this.getFloatingBounds(anchorEl.getBoundingClientRect(), contentRect))
        },
        isFriend(userId) {
            return wfc.isMyFriend(userId);
        },
        addFriend(user) {
            this.$modal.show(
                FriendRequestView,
                {
                    userInfo: user,
                },
                null,
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
        showAllChannel() {
            this.shouldShowAllChannel = true;
        },
        showAllContact() {
            this.shouldShowAllContact = true;
        },

        showAllGroup() {
            this.shouldShowAllGroup = true;
        },

        showAllConversation() {
            this.shouldShowAllConversation = true;
        },

        chatToContact(contact) {
            if (this.$router.currentRoute.path !== '/home') {
                this.$router.replace("/home");
            }
            let conversation = new Conversation(ConversationType.Single, contact.uid, 0);
            store.setCurrentConversation(conversation);
            store.hideSearchView();
        },

        chatToChannel(channel) {
            if (this.$router.currentRoute.path !== '/home') {
                this.$router.replace("/home");
            }
            let conversation = new Conversation(ConversationType.Channel, channel.channelId, 0);
            store.setCurrentConversation(conversation);
            store.hideSearchView();
        },

        chatToGroup(group) {
            if (this.$router.currentRoute.path !== '/home') {
                this.$router.replace("/home");
            }
            let conversation = new Conversation(ConversationType.Group, group.target, 0);
            store.setCurrentConversation(conversation);
            store.hideSearchView();
        },

        chatToConversation(conversation) {
            if (this.$router.currentRoute.path !== '/home') {
                this.$router.replace("/home");
            }
            store.setCurrentConversation(conversation);
            store.hideSearchView();
        },

        showMessageHistoryPage() {
            let hash = window.location.hash;
            let url = window.location.origin;
            if (hash) {
                url = window.location.href.replace(hash, '#/message-history');
            } else {
                url += "/message-history"
            }
            ipcRenderer.send(IpcEventType.showMessageHistoryPage, {
                url: url,
            });
            console.log(IpcEventType.showMessageHistoryPage, url)
        }

    },

    computed: {
        toShowUserList() {
            return !this.shouldShowAllUser && this.sharedSearchState.userSearchResult.length > 5 ? this.sharedSearchState.userSearchResult.slice(0, 4) : this.sharedSearchState.userSearchResult;
        },
        toShowChannelList() {
            return !this.shouldShowAllChannel&& this.sharedSearchState.channelSearchResult.length > 5 ? this.sharedSearchState.channelSearchResult.slice(0, 4) : this.sharedSearchState.channelSearchResult;
        },
        toShowContactList() {
            return !this.shouldShowAllContact && this.sharedSearchState.contactSearchResult.length > 5 ? this.sharedSearchState.contactSearchResult.slice(0, 4) : this.sharedSearchState.contactSearchResult;
        },
        toShowGroupList() {
            return !this.shouldShowAllGroup && this.sharedSearchState.groupSearchResult.length > 5 ? this.sharedSearchState.groupSearchResult.slice(0, 4) : this.sharedSearchState.groupSearchResult;
        },
        toShowConversationList() {
            return !this.shouldShowAllConversation && this.sharedSearchState.conversationSearchResult.length > 5 ? this.sharedSearchState.conversationSearchResult.slice(0, 4) : this.sharedSearchState.conversationSearchResult;
        },
        isSearchResultEmpty() {
            return this.sharedSearchState.userSearchResult.length ===0
                && this.sharedSearchState.channelSearchResult.length === 0
                && this.sharedSearchState.contactSearchResult.length === 0
                && this.sharedSearchState.groupSearchResult.length === 0
                && this.sharedSearchState.conversationSearchResult.length === 0;
        }
    },

}
</script>

<style lang="css" scoped>

.search-result-floating {
    position: fixed;
    z-index: 9999;
    overflow: auto;
    border-radius: 8px;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.18), 0 2px 10px rgba(0, 0, 0, 0.08);
    border: 1px solid var(--border-primary);
    background-color: var(--background-primary);
}

.search-result-floating ul {
    list-style: none;
    background-color: var(--background-primary);
}


.category-item label {
    color: var(--text-hint);
    display: block;
    padding-top: 10px;
    padding-bottom: 2px;
    margin-left: 12px;
    font-size: 13px;
    border-bottom: 1px solid var(--border-secondary);
}

.search-result-item {
    background-color: var(--background-primary);
    padding: 10px 12px;
}

.search-result-item:hover {
    background-color: var(--background-item-hover);
}

.search-result-item:active {
    background-color: var(--border-strong);
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
    border: 1px solid var(--border-primary);
    outline: none;
}

.search-result-item.contact button:active {
    background: var(--background-item-placeholder);
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
    font-size: 13px;
}

.show-all {
    padding: 10px 12px;
    color: var(--text-link);
    font-size: 12px;
}
.show-all:hover {
    background-color: var(--background-item-hover);
}

</style>
