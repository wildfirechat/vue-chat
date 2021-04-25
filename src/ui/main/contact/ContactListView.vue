<template>
    <section class="contact-list">
        <ul>
            <li>
                <div @click="showNewFriends" class="category-item-container">
                    <i class="arrow right" v-bind:class="{down: sharedContactState.expandFriendRequestList}"></i>
                    <span class="title">{{ $t('contact.new_friend') }}</span>
                </div>
                <NewFriendListView v-if="sharedContactState.expandFriendRequestList"/>
            </li>
            <li>
                <div @click="showGroups" class="category-item-container">
                    <i class="arrow right" v-bind:class="{down: sharedContactState.expandGroup}"></i>
                    <div class="category-item">
                        <span class="title">{{ $t('contact.group') }}</span>
                        <span class="desc">{{ sharedContactState.favGroupList.length }}</span>
                    </div>
                </div>
                <GroupListVue v-if="sharedContactState.expandGroup"/>
            <li>
                <div @click="showContacts" class="category-item-container">
                    <i class="arrow right" v-bind:class="{down: sharedContactState.expandFriendList}"></i>
                    <div class="category-item">
                        <span class="title">{{ $t('contact.contact') }}</span>
                        <span class="desc">{{ sharedContactState.friendList.length }}</span>
                    </div>
                </div>
                <UserListVue :enable-pick="false"
                             :users="sharedContactState.favContactList.concat(sharedContactState.friendList)"
                             :click-user-item-func="setCurrentUser"
                             :padding-left="'30px'"
                             v-if="sharedContactState.expandFriendList"/>
            </li>
        </ul>
    </section>
</template>
<script>
import FriendRequestListView from "@/ui/main/contact/FriendRequestListView";
import GroupListVue from "@/ui/main/contact/GroupListView";
import store from "@/store";
import UserListVue from "@/ui/main/user/UserListVue";

export default {
    name: "ContactListView",
    components: {UserListVue, GroupListVue, NewFriendListView: FriendRequestListView},
    data() {
        return {
            sharedContactState: store.state.contact,
        }
    },
    methods: {
        setCurrentUser(userInfo) {
            store.setCurrentFriend(userInfo)
        },
        showNewFriends() {
            store.toggleFriendRequestList();
        },
        showGroups() {
            store.toggleGroupList();
        },
        showContacts() {
            store.toggleFriendList();
        },

    }
}
</script>

<style lang="css" scoped>

.contact-list {
    height: 100%;
    overflow: auto;
}

.category-item-container {
    height: 40px;
    display: flex;
    align-items: center;
    padding-left: 15px;
    color: #262626;
    font-size: 14px;
    position: sticky;
    background-color: #fafafa;
    top: 0;
}

.category-item {
    display: flex;
    width: 100%;
    justify-content: space-between;
}

.category-item span:last-of-type {
    margin-right: 15px;
}

.arrow {
    border: solid #b9b9b9;
    border-width: 0 1px 1px 0;
    display: inline-block;
    padding: 3px;
    margin-right: 10px;
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
