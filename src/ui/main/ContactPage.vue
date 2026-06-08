<template>
    <div class="contact-page">
        <ContactListPanel class="contact-list-panel"/>
        <GroupDetailView
            v-if="sharedContactState.currentGroup"
            :group="sharedContactState.currentGroup"
            class="contact-detail-container"/>
        <ChannelDetailView
            v-else-if="sharedContactState.currentChannel"
            :channel="sharedContactState.currentChannel"
            class="contact-detail-container"/>
        <OrganizationDetailView
            v-else-if="sharedContactState.currentOrganization"
            class="contact-detail-container"/>
        <DomainInfoView
            v-else-if="sharedContactState.currentExternalDomain"
            class="contact-detail-container"/>
        <ChatroomDetailView
            v-else-if="sharedContactState.currentChatroom"
            class="contact-detail-container"/>
        <UserDetailView
            v-else-if="sharedContactState.currentFriend"
            :user="sharedContactState.currentFriend"
            class="contact-detail-container"/>
        <FriendRequestDetailView
            v-else-if="sharedContactState.currentFriendRequest"
            :user="sharedContactState.currentFriendRequest._target"
            :friend-request="sharedContactState.currentFriendRequest"
            class="contact-detail-container"/>
        <div v-else class="contact-empty-container">
            <div class="empty-state">
                <div class="empty-icon-wrap">
                    <div class="empty-icon-glow"></div>
                    <i class="icon-ion-ios-people empty-icon"></i>
                </div>
                <p class="empty-title">{{ $t('contact.empty_title') }}</p>
                <p class="empty-hint">{{ $t('contact.empty_hint') }}</p>
            </div>
        </div>
    </div>
</template>

<script>
import ContactListPanel from "./ContactListPanel.vue";
import GroupDetailView from "./contact/GroupDetailView.vue";
import store from "../../store";
import UserDetailView from "./contact/UserDetailView.vue";
import FriendRequestDetailView from "./contact/FrienRequestDetailView.vue";
import ChannelListView from "./contact/ChannelListView";
import ChannelDetailView from "./contact/ChannelDetailView";
import OrganizationDetailView from "./contact/OrganizationTreeView.vue";
import ChatroomListView from "./contact/ChatroomListView.vue";
import ChatroomDetailView from "./contact/ChatroomDetailView.vue";
import DomainInfoView from "./contact/DomainInfoView.vue";

export default {
    name: 'ContactPage',
    data() {
        return {
            sharedContactState: store.state.contact,
        }
    },
    components: {
        DomainInfoView,
        ChatroomDetailView,
        ChatroomListView,
        ChannelDetailView,
        ChannelListView,
        FriendRequestDetailView,
        UserDetailView,
        GroupDetailView,
        ContactListPanel,
        OrganizationDetailView,
    },
};
</script>


<style lang="css" scoped>
.contact-page {
    display: flex;
    flex: 1;
    height: 100%;
}

.contact-list-panel {
    background-color: var(--background-secondary);
    width: 261px;
    height: 100%;
}

ul {
    list-style: none;
}

.contact-detail-container {
    flex: 1;
    background-color: var(--background-primary);
}

.contact-empty-container {
    flex: 1;
    background-color: var(--background-primary);
    background-image: var(--hero-bg-pattern);
    background-size: 20px 20px;
    display: flex;
    justify-content: center;
    align-items: center;
    border-top-right-radius: var(--main-border-radius);
    border-bottom-right-radius: var(--main-border-radius);
}

.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    animation: empty-fade-in 0.4s ease both;
}

.empty-icon-wrap {
    position: relative;
    width: 80px;
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: empty-float 4s ease-in-out infinite;
}

.empty-icon-glow {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: radial-gradient(circle, var(--accent-color-subtle) 0%, transparent 70%);
    opacity: 0.8;
}

.empty-icon {
    position: relative;
    font-size: 40px;
    background: linear-gradient(135deg, var(--accent-color) 0%, #5b8ef0 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    filter: drop-shadow(0 2px 8px rgba(31, 100, 228, 0.25));
}

.empty-title {
    margin: 0;
    font-size: 15px;
    font-weight: 500;
    color: var(--text-primary);
    letter-spacing: 0.2px;
}

.empty-hint {
    margin: 0;
    font-size: 13px;
    color: var(--text-tertiary);
    text-align: center;
    line-height: 1.5;
    max-width: 200px;
}

@keyframes empty-float {
    0%, 100% { transform: translateY(0); }
    50%       { transform: translateY(-6px); }
}

@keyframes empty-fade-in {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
}

</style>
