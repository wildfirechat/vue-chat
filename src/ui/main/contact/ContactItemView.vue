<template>
    <div v-if="source.type === 'category'" class="label">
        <p>{{ source.category.toUpperCase() }}</p>
    </div>
    <div v-else class="contact-item"
         v-bind:class="{active: (sharedContactState.currentFriend
                        && source._category === sharedContactState.currentFriend._category
                        && source.uid === sharedContactState.currentFriend.uid) || (sharedContactState.currentUser && sharedContactState.currentUser.uid === source.uid),
         highlight:sharedContactState.contextMenuUserInfo&& sharedContactState.contextMenuUserInfo.uid === source.uid}"
         @click="clickUserItem()"
         @contextmenu.prevent="showContactContextMenu">
        <img class="avatar" :src="source.portrait" alt="" @error="imgUrlAlt">
        <div style="padding-left: 10px">
            <div style="display: flex; align-items: center; ">
                <p class="single-line">{{ source._displayName }}</p>
                <p v-if="isExternalDomainUser" class="single-line" style="color: #F0A040; border-radius: 2px;  padding: 1px 2px; font-size: 9px">{{ domainName }}</p>
            </div>
            <p v-if="source._userOnlineStatusDesc" class="single-line user-online-status"> {{ source._userOnlineStatusDesc }}</p>
        </div>
    </div>
</template>

<script>
import store from "../../../store";
import Config from "../../../config";
import ConversationType from "../../../wfc/model/conversationType";
import WfcUtil from "../../../wfc/util/wfcUtil";
import wfc from "../../../wfc/client/wfc";

export default {
    name: "ContactItemView",
    props: {
        source: {
            type: Object,
            required: true,
        },
    },
    data() {
        return {
            sharedContactState: store.state.contact,
        }
    },

    methods: {
        clickUserItem() {
            store.setCurrentFriend(this.source)
        },

        imgUrlAlt(e) {
            e.target.src = Config.DEFAULT_PORTRAIT_URL;
        },
        showContactContextMenu(event) {
            this.$eventBus.$emit('showContactContextMenu', [event, this.source]);
        }
    },
    computed: {
        isExternalDomainUser() {
            let user = this.source;
            return WfcUtil.isExternal(user.uid);

        },
        domainName() {
            let user = this.source;
            if (WfcUtil.isExternal(user.uid)) {
                let domainId = WfcUtil.getExternalDomainId(user.uid);
                let domainInfo = wfc.getDomainInfo(domainId);
                return '@' + domainInfo.name;
            }
            return '';
        },
    }
}
</script>

<style scoped>
.label {
    width: 100%;
    padding-left: 30px;
    background-color: #fafafa;
}

.label p {
    padding: 5px 5px 5px 0;
    border-bottom: 1px solid #e0e0e0;
    font-size: 13px;
}

.contact-item {
    padding: 5px 5px 5px 30px;
    display: flex;
    width: 100%;
    font-size: 13px;
    align-items: center;
}

.contact-item span {
    margin-left: 10px;
}

.contact-item.active {
    background-color: #d6d6d6;
}

.contact-item:active {
    background-color: #d6d6d6;
}

.contact-item.highlight {
    box-shadow: 0 0 0 1px #4168e0 inset;
    z-index: 100;
}

.user-online-status {
    color: gray;
    font-size: 10px;
}

.avatar {
    width: 40px;
    height: 40px;
    border-radius: 3px;
}
</style>
