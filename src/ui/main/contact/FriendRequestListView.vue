<template>
    <section>
        <ul>
            <li v-for="(friendRequest,index) in sharedContactState.friendRequestList" :key="index"
                @click="showFriendRequest(friendRequest)">
                <div class="new-friend-item-container"
                     v-bind:class="{active :sharedContactState.currentFriendRequest && sharedContactState.currentFriendRequest.target === friendRequest.target}">
                    <div class="new-friend-item">
                        <img class="avatar" :src="friendRequest._target.portrait">
                        <div class="info">
                            <div class="name-action">
                                <div style="display: flex; align-items: center; ">
                                    <span class="name single-line">{{ friendRequest._target.displayName }}</span>
                                    <p v-if="isExternalDomainUser(friendRequest._target)" class="single-line" style="color: #F0A040; border-radius: 2px;  padding: 1px 2px; font-size: 9px">{{ domainName(friendRequest._target) }}</p>
                                </div>
                                <span v-if="friendRequest.status === 1" class="status">{{
                                        $t('friend_request.accepted')
                                    }}</span>
                                <button v-else-if="friendRequest.status === 0" class="accept"
                                        @click="accept(friendRequest)">{{
                                        $t('common.add')
                                    }}
                                </button>
                                <span
                                    v-else-if="friendRequest.status === 3" class="status">{{
                                        $t('friend_request.denied')
                                    }}</span>
                            </div>
                            <p class="reason single-line">{{
                                    friendRequest.reason ? friendRequest.reason : $t('friend_request.im') + friendRequest._target.displayName
                                }}</p>
                        </div>
                    </div>
                </div>
            </li>
        </ul>
    </section>

</template>

<script>
import store from "../../../store";
import wfc from "../../../wfc/client/wfc";
import EventType from "../../../wfc/client/wfcEvent";
import WfcUtil from "../../../wfc/util/wfcUtil";

export default {
    name: "NewFriendListView",
    props: {
        newFriends: null,
    },
    data() {
        return {
            sharedContactState: store.state.contact,
            isActive: false,
        };
    },
    methods: {
        showFriendRequest(friendRequest) {
            store.setCurrentFriendRequest(friendRequest);
        },
        accept(friendRequest) {
            wfc.handleFriendRequest(friendRequest.target, true, "", () => {
                friendRequest.status = 1;
            }, (err) => {
                console.log('accept friend request error', err)
            })
        },
        onFriendRequestUpdate() {
            if (this.isActive) {
                wfc.clearUnreadFriendRequestStatus();
            }
        },
        isExternalDomainUser(user) {
            return WfcUtil.isExternal(user.uid);

        },
        domainName(user) {
            if (WfcUtil.isExternal(user.uid)) {
                let domainId = WfcUtil.getExternalDomainId(user.uid);
                let domainInfo = wfc.getDomainInfo(domainId);
                return '@' + domainInfo.name;
            }
            return '';
        },
    },

    activated() {
        this.isActive = true;
        wfc.clearUnreadFriendRequestStatus();
    },

    deactivated() {
        this.isActive = false;
    },

    mounted() {
        this.isActive = true;
        wfc.clearUnreadFriendRequestStatus();
        wfc.eventEmitter.on(EventType.FriendRequestUpdate, this.onFriendRequestUpdate);
    },

    beforeUnmount() {
        this.isActive = false;
        wfc.eventEmitter.removeListener(EventType.FriendRequestUpdate, this.onFriendRequestUpdate);
    }
}
</script>

<style lang="css" scoped>
.new-friend-item-container {
    padding-left: 30px;
}

.avatar {
    width: 40px;
    height: 40px;
    border-radius: 3px;
}

.new-friend-item {
    display: flex;
    width: 100%;
    padding: 10px 15px 10px 0;
    align-items: center;
    font-size: 13px;
    border-bottom: 1px solid #e0e0e0;
}


.new-friend-item-container.active {
    background-color: #d6d6d6;
}

.new-friend-item-container:hover {
    background-color: #d6d6d6;
}

.new-friend-item .info {
    margin-left: 10px;
    flex: 1;
}

.new-friend-item .info .name-action {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.new-friend-item .info .name-action .name {
    flex: 1;
}

.new-friend-item .info .name-action .accept {
    padding: 0 10px;
    text-align: center;
    color: white;
    background: #4168e0;
    border-radius: 10px;
    border: solid 1px #4168e0;
}

.new-friend-item .info .name-action .status {
    color: #b2b2b2;
}

.new-friend-item .info .reason {
    font-size: 12px;
    color: #b2b2b2;
}


</style>
