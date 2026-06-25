<template>
    <section class="contact-list">
        <!-- Categories live in the #header slot so the whole panel shares one
             scroll container while the contact list stays virtualized. -->
        <virtual-list
            ref="contactVl"
            @scroll="onContactScroll"
            class="contact-scroller"
            :class="{'is-restoring': restoringScroll}"
            :data-component="contactItemView" :data-sources="contactDataSources" :data-key="'uid'"
            :estimate-size="30">
            <template #header>
                <ul>
                    <li>
                        <div @click="showNewFriends" class="category-item-container">
                            <i class="arrow right" v-bind:class="{down: sharedContactState.expandFriendRequestList}"></i>
                            <div class="category-item">
                                <div>
                                    <span class="title">{{ $t('contact.new_friend') }}</span>
                                    <span class="tip">(上方搜索框，添加好友)</span>
                                </div>
                                <span class="desc" v-if="sharedContactState.unreadFriendRequestCount === 0">{{ sharedContactState.unreadFriendRequestCount }}</span>
                            </div>
                        </div>
                        <NewFriendListView v-if="sharedContactState.expandFriendRequestList"/>
                    </li>
                    <li>
                        <div @click="showGroups" class="category-item-container">
                            <i class="arrow right" v-bind:class="{down: sharedContactState.expandGroup}"></i>
                            <div class="category-item">
                                <div>
                                    <span class="title">{{ $t('contact.group') }}</span>
                                    <span class="tip">(保存在通讯录的群组)</span>
                                </div>
                                <span class="desc">{{ sharedContactState.favGroupList.length }}</span>
                            </div>
                        </div>
                        <GroupListVue v-if="sharedContactState.expandGroup"/>
                    </li>
                    <li>
                        <div @click="showChannels" class="category-item-container">
                            <i class="arrow right" v-bind:class="{down: sharedContactState.expandChanel}"></i>
                            <div class="category-item">
                                <span class="title">{{ $t('contact.channel') }}</span>
                                <span class="desc">{{ sharedContactState.channelList.length }}</span>
                            </div>
                        </div>
                        <ChannelListView v-if="sharedContactState.expandChanel"/>
                    </li>
                    <li>
                        <div @click="showOrganization" class="category-item-container">
                            <i class="arrow right" v-bind:class="{down: sharedContactState.expandOrganization}"></i>
                            <div class="category-item">
                                <span class="title">组织结构</span>
                                <span class="desc"></span>
                            </div>
                        </div>
                        <OrganizationListView v-if="sharedContactState.expandOrganization"/>
                    </li>
                    <li v-if="sharedContactState.isEnableMesh">
                        <div @click="showExternalDomains" class="category-item-container">
                            <i class="arrow right" v-bind:class="{down: sharedContactState.expandExternalDomain}"></i>
                            <div class="category-item">
                                <span class="title">外部单位</span>
                                <span class="desc"></span>
                            </div>
                        </div>
                        <ExternalDomainListView v-if="sharedContactState.expandExternalDomain"/>
                    </li>
                    <li>
                        <div @click="showChatroom" class="category-item-container">
                            <i class="arrow right" v-bind:class="{down: sharedContactState.expandChatroom}"></i>
                            <div class="category-item">
                                <div>
                                    <span class="title">聊天室</span>
                                    <span class="tip">(野火官方测试聊天室)</span>
                                </div>
                            </div>
                        </div>
                        <ChatroomListView v-if="sharedContactState.expandChatroom"/>
                    </li>
                    <li>
                        <div @click="showContacts" class="category-item-container">
                            <i class="arrow right" v-bind:class="{down: sharedContactState.expandFriendList}"></i>
                            <div class="category-item">
                                <span class="title">{{ $t('contact.contact') }}</span>
                                <span class="desc">{{ sharedContactState.friendList.length }}</span>
                            </div>
                        </div>
                    </li>
                </ul>
            </template>
        </virtual-list>

        <vue-context ref="menu" v-slot="{data:userInfo}" v-on:close="onContactContextMenuClose">
            <li>
                <a @click.prevent="sendMessage(userInfo)">{{
                        $t('message.send_message')
                    }}</a>
            </li>
            <li>
                <a @click.prevent="sendUserCard(userInfo)">{{
                        $t('misc.share_to_friend')
                    }}</a>
            </li>
        </vue-context>
    </section>
</template>
<script>
import FriendRequestListView from "../../main/contact/FriendRequestListView";
import GroupListVue from "../../main/contact/GroupListView";
import store from "../../../store";
import UserListView from "../user/UserListView.vue";
import ChannelListView from "./ChannelListView";
import ContactItemView from "./ContactItemView";
import OrganizationListView from "./OrganizationListView.vue";
import Conversation from "../../../wfc/model/conversation";
import ConversationType from "../../../wfc/model/conversationType";
import ForwardType from "../conversation/message/forward/ForwardType";
import CardMessageContent from "../../../wfc/messages/cardMessageContent";
import wfc from "../../../wfc/client/wfc";
import Message from "../../../wfc/messages/message";
import ChatroomListView from "./ChatroomListView.vue";
import {markRaw} from "vue";
import ExternalDomainListView from "./ExternalDomainListView.vue";

export default {
    name: "ContactListView",
    components: {
        ExternalDomainListView,
        ChatroomListView,
        OrganizationListView,
        ChannelListView,
        UserListView,
        GroupListVue,
        NewFriendListView: FriendRequestListView
    },
    data() {
        return {
            sharedContactState: store.state.contact,
            contactItemView: markRaw(ContactItemView),
            rootOrganizations: [],
            restoringScroll: false,
        }
    },
    created() {
        this.$eventBus.$on('showContactContextMenu', ([event, userInfo]) => {
            this.showContactContextMenu(event, userInfo);
        });
    },
    activated() {
        // <keep-alive> resets scrollTop on reactivation, so restore the saved
        // position. Hide the list while the virtual list re-measures (a couple
        // of frames) to avoid a visible jump, then reveal it.
        if (!this.hasActivated) {
            this.hasActivated = true;
            return;
        }
        const top = this.savedScrollOffset;
        if (!top) {
            return;
        }
        this.restoringScroll = true;
        this.$nextTick(() => {
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    const vl = this.$refs.contactVl;
                    if (vl && vl.$el) {
                        vl.$el.scrollTop = top;
                    }
                    requestAnimationFrame(() => {
                        this.restoringScroll = false;
                    });
                });
            });
        });
    },
    unmounted() {
        this.$eventBus.$off('showContactContextMenu');
    },
    methods: {
        onContactScroll(event) {
            // Kept off `data` (non-reactive) so scrolling doesn't trigger re-renders.
            this.savedScrollOffset = event && event.target ? event.target.scrollTop : 0;
        },
        setCurrentUser(userInfo) {
            store.setCurrentFriend(userInfo)
        },
        showNewFriends() {
            store.toggleFriendRequestList();
        },
        showGroups() {
            store.toggleGroupList();
        },
        showChannels() {
            store.toggleChannelList();
        },
        showContacts() {
            store.toggleFriendList();
        },
        showOrganization() {
            store.toggleOrganizationList();
        },
        showExternalDomains() {
            store.toggleExternalDomainList();
        },
        showChatroom() {
            store.toggleChatroom();
        },
        sendMessage(userInfo) {
            let conversation = new Conversation(ConversationType.Single, userInfo.uid, 0);
            store.setCurrentConversation(conversation);
            this.$router.replace('/home');
        },
        sendUserCard(userInfo) {
            let userCardMessageContent = new CardMessageContent(0, userInfo.uid, userInfo.displayName, userInfo.portrait, wfc.getUserId());
            userCardMessageContent.name = userInfo.name;
            let message = new Message(null, userCardMessageContent);

            return this.$forwardMessage({
                forwardType: ForwardType.NORMAL,
                messages: [message],
            });
        },

        showContactContextMenu(event, userInfo) {
            if (!this.$refs.menu) {
                return;
            }
            console.log('showContactContextMenu')
            this.sharedContactState.contextMenuUserInfo = userInfo;
            this.$refs.menu.open(event, userInfo)
        },
        onContactContextMenuClose() {
            this.sharedContactState.contextMenuUserInfo = null;
        }
    },
    computed: {
        contactDataSources() {
            return this.sharedContactState.expandFriendList ? this.groupedContacts : [];
        },

        groupedContacts() {
            let groupedUsers = [];
            let currentCategory = {};
            let lastCategory = null;
            this.users.forEach((user) => {
                if (!lastCategory || lastCategory !== user._category) {
                    lastCategory = user._category;
                    currentCategory = {
                        type: 'category',
                        category: user._category,
                        uid: user._category,
                    };
                    groupedUsers.push(currentCategory);
                    groupedUsers.push(user);
                } else {
                    groupedUsers.push(user);
                }
            });
            return groupedUsers;
        },

        users() {
            return store.state.contact.aiRobotList.concat(store.state.contact.favContactList).concat(store.state.contact.friendList);
        },
    }
}
</script>

<style lang="css" scoped>

.contact-list {
    height: 100%;
    overflow: hidden;
}

/* overlay = draw-over scrollbar (matches the rest of the app), so the contact
   rows fill full width and their hover extends under the scrollbar. The auto
   fallback keeps scrolling working where overlay is unsupported. */
.contact-scroller {
    height: 100%;
    overflow-y: auto;
    overflow-y: overlay;
}

.contact-scroller.is-restoring {
    visibility: hidden;
}

/* Inset the sticky headers (not the rows) so they don't paint over the overlay
   scrollbar; the gap matches the panel background, so it's invisible. This lets
   the contact rows fill full width and hover up to the right divider. */
.category-item-container {
    height: calc(40px * var(--layout-scale-row));
    display: flex;
    align-items: center;
    padding-left: 16px;
    margin-right: 8px;
    color: var(--text-primary);
    font-size: var(--font-size-base);
    position: sticky;
    background-color: var(--background-secondary);
    top: 0;
    user-select: none;
    transition: background var(--duration-fast);
}

.category-item {
    display: flex;
    width: 100%;
    justify-content: space-between;
    align-items: center;
}

.category-item span:last-of-type {
    margin-right: 16px;
}

.category-item .title {
    font-size: var(--font-size-base);
    font-weight: normal;
    font-style: normal;
    color: var(--text-primary);
}

.category-item .desc {
    font-size: var(--font-size-xs);
    color: var(--text-secondary);
    min-width: 20px;
    text-align: right;
}

.category-item .tip {
    font-size: 10px;
    padding-left: 4px;
    color: var(--text-secondary);
}

.arrow {
    border: solid var(--contact-arrow-border);
    border-width: 0 1px 1px 0;
    display: inline-block;
    padding: 3px;
    margin-right: 8px;
    flex-shrink: 0;
    transition: transform var(--duration-fast);
}

.right {
    transform: rotate(-45deg);
    -webkit-transform: rotate(-45deg);
}

.left {
    transform: rotate(135deg);
    -webkit-transform: rotate(135deg);
}

.up {
    transform: rotate(-135deg);
    -webkit-transform: rotate(-135deg);
}

.down {
    transform: rotate(45deg);
    -webkit-transform: rotate(45deg);
}

</style>
