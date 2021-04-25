<template>
    <div class="contact-page">
        <ContactListPanel class="contact-list-panel"/>
        <GroupDetailView
            v-if="sharedContactState.currentGroup"
            :group="sharedContactState.currentGroup"
            class="contact-detail-container"/>
        <UserDetailView
            v-else-if="sharedContactState.currentFriend"
            :user="sharedContactState.currentFriend"
            class="contact-detail-container"/>
        <FriendRequestDetailView
            v-else-if="sharedContactState.currentFriendRequest"
            class="contact-detail-container"/>
        <div v-else class="contact-empty-container">
            <h1>^~^</h1>
        </div>
    </div>
</template>

<script>
import ContactListPanel from "@/ui/main/ContactListPanel";
import GroupDetailView from "@/ui/main/contact/GroupDetailView";
import store from "@/store";
import UserDetailView from "@/ui/main/contact/UserDetailView";
import FriendRequestDetailView from "@/ui/main/contact/FrienRequestDetailView";

export default {
    name: 'ContactPage',
    data() {
        return {
            sharedContactState: store.state.contact,
        }
    },
    components: {
        FriendRequestDetailView,
        UserDetailView,
        GroupDetailView,
        ContactListPanel,
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
    background-color: #fafafa;
    width: 250px;
    height: 100%;
}

ul {
    list-style: none;
}

.contact-detail-container {
    flex: 1;
    background-color: white;
}

.contact-empty-container {
    flex: 1;
    background-color: white;
    display: flex;
    justify-content: center;
    align-items: center;
    border-top-right-radius: var(--main-border-radius);
    border-bottom-right-radius: var(--main-border-radius);
}

.contact-empty-container h1 {
    font-size: 17px;
    font-weight: normal;
}
</style>
