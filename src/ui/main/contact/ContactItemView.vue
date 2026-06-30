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
        <div class="contact-item-info">
            <div class="flex-row flex-align-center contact-item-name-row">
                <p class="single-line contact-item-name">{{ source._displayName }}</p>
                <p v-if="isExternalDomainUser" class="single-line" style="color: var(--text-warning); border-radius: 2px;  padding: 1px 2px; font-size: 9px">{{ domainName }}</p>
            </div>
            <p v-if="source._userOnlineStatusDesc" class="single-line user-online-status"> {{ source._userOnlineStatusDesc }}</p>
        </div>
    </div>
</template>

<script>
import store from "../../../store";
import Config from "../../../config";
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
    background-color: var(--background-secondary);
}

.label p {
    padding: 4px 4px 4px 0;
    border-bottom: 1px solid var(--border-tertiary);
    font-size: var(--font-size-xs);
    color: var(--text-secondary);
    letter-spacing: 0.5px;
    font-weight: 500;
}

.contact-item {
    padding: 8px 4px 8px 30px;
    display: flex;
    width: 100%;
    font-size: var(--font-size-sm);
    align-items: center;
}

.contact-item:hover{
    background-color: var(--background-item-hover);
}

.contact-item span {
    margin-left: 8px;
}

.contact-item.active {
    background-color: var(--background-item-active);
}

.contact-item:active {
    background-color: var(--background-item-active);
}

.contact-item.highlight {
    box-shadow: 0 0 0 1px var(--accent-color) inset;
    z-index: 100;
}

.contact-item-info {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    padding-left: 8px;
}

.contact-item-name-row {
    min-width: 0;
    overflow: hidden;
}

.contact-item-name {
    flex: 1;
    min-width: 0;
}

.user-online-status {
    color: var(--text-secondary);
    font-size: var(--font-size-xs);
}

.avatar {
    width: var(--size-avatar-contact);
    height: var(--size-avatar-contact);
    border-radius: var(--default-portrait-border-radius);
    object-fit: cover;
    flex-shrink: 0;
}
</style>
