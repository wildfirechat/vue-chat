<template>
    <section>
        <ul>
            <li v-for="(friendRequest,index) in sharedContactState.friendRequestList" :key="index"
                @click="showFriendRequest(friendRequest)">
                <div class="new-friend-item"
                     v-bind:class="{active :sharedContactState.currentFriendRequest && sharedContactState.currentFriendRequest.target === friendRequest.target}">
                    <img class="avatar" :src="friendRequest._target.portrait">
                    <div class="info">
                        <div class="name-action">
                            <div class="flex-row flex-align-center name-row">
                                <p class="name single-line">{{ friendRequest._target.displayName }}</p>
                                <p v-if="isExternalDomainUser(friendRequest._target)" class="single-line" style="color: var(--text-warning); border-radius: 2px;  padding: 1px 2px; font-size: 9px">{{ domainName(friendRequest._target) }}</p>
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

.avatar {
    width: var(--size-avatar-contact);
    height:  var(--size-avatar-contact);
    border-radius: var(--default-portrait-border-radius);
    object-fit: cover;
    flex-shrink: 0;
}

.new-friend-item {
    padding: 8px 4px 8px 30px;
    display: flex;
    width: 100%;
    font-size: var(--font-size-sm);
    align-items: center;
    transition: background var(--duration-fast);
}

.new-friend-item.active {
    background-color: var(--background-item-placeholder);
}

.new-friend-item:hover {
    background-color: var(--background-item-hover);
}

.new-friend-item .info {
    margin-left: 8px;
    margin-right: 8px;
    flex: 1;
    overflow: hidden;
}

.new-friend-item .info .name-action {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.new-friend-item .info .name-action .name-row {
    flex: 1;
    min-width: 0;
    overflow: hidden;
}

.new-friend-item .info .name-action .name {
    flex: 1;
    min-width: 0;
}

.new-friend-item .info .name-action .accept {
    padding: 2px 10px;
    text-align: center;
    color: var(--text-on-accent);
    background: var(--accent-color);
    border-radius: var(--radius-md);
    border: solid 1px var(--accent-color);
    font-size: var(--font-size-xs);
    transition: background var(--duration-fast), border-color var(--duration-fast);
}

.new-friend-item .info .name-action .accept:hover {
    background: var(--accent-color-active);
    border-color: var(--accent-color-active);
}

.new-friend-item .info .name-action .status {
    color: var(--text-hint);
}

.new-friend-item .info .reason {
    font-size: var(--font-size-xs);
    color: var(--text-hint);
}


</style>
