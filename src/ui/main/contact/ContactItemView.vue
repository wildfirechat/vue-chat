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
            <p class="single-line"> {{ source._displayName }}</p>
            <p v-if="source._userOnlineStatusDesc" class="single-line user-online-status"> {{ source._userOnlineStatusDesc }}</p>
        </div>
    </div>
</template>

<script>
import store from "../../../store";
import Config from "../../../config";

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
