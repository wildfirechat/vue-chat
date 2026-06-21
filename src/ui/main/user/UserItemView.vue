<template>
    <template ref="contactItem" class="contact-item">
        <div v-if="showCategoryLabel && source.type === 'category'"
             class="label"
             :style="paddingStyle"
             v-bind:class="{sticky:enableCategoryLabelSticky}">
            <p>{{ source.category.toUpperCase() }}</p>
        </div>
        <template v-else style="width: 100%">
            <tippy
                v-if="!clickUserItemFunc"
                :to="'#user-' + source.uid"
                theme="light"
                :animate-fill="false"
                placement="left"
                distant="7"
                animation="fade"
                trigger="click"
                :style="tippyStyleFix"
            >
                <template #content>
                    <UserCardView :user-info="source" v-on:close="closeUserCard(source)"/>
                </template>
            </tippy>
            <div class="content"
                 :ref="'userCardTippy-'+source.uid"
                 :id="'user-'+source.uid"
                 :style="paddingStyle"
                 v-bind:class="{active: (sharedContactState.currentFriend
                        && source._category === sharedContactState.currentFriend._category
                        && source.uid === sharedContactState.currentFriend.uid) || (currentUser && currentUser.uid === source.uid)}"
                 @click.stop="clickUserItem(source)"
                 @contextmenu.prevent="showContactContextMenu($event, ussourceer)">
                <img class="avatar" :src="source.portrait" alt="" @error="imgUrlAlt">
                <div class="user-item-info">
                    <div class="flex-row flex-align-center user-item-name-row">
                        <p class="single-line user-item-name">{{ source._displayName }}</p>
                        <p v-if="isExternalDomainUser" class="single-line" style="color: var(--text-warning); border-radius: 2px;  padding: 1px 2px; font-size: 9px">{{ domainName }}</p>
                    </div>
                    <p v-if="source._userOnlineStatusDesc" class="single-line user-online-status"> {{ source._userOnlineStatusDesc }}</p>
                </div>
            </div>

        </template>
    </template>
</template>

<script>
import store from "../../../store";
import UserCardView from "./UserCardView.vue";
import Config from "../../../config";
import WfcUtil from "../../../wfc/util/wfcUtil";
import wfc from "../../../wfc/client/wfc";

export default {
    name: "UserListVue",
    props: {
        source: {
            type: Object,
            required: true,
        },
        currentUser: {
            type: Object,
            default: null,
        },
        showCategoryLabel: {
            type: Boolean,
            required: false,
            default: true,
        },
        enableCategoryLabelSticky: {
            type: Boolean,
            required: false,
            default: false,
        },
        clickUserItemFunc: {
            type: Function,
            required: false,
        },
        paddingLeft: {
            type: String,
            required: false,
            default: '5px'
        },
        enableContactContextMenu: {
            type: Boolean,
            required: false,
            default: false,
        }
    },
    data() {
        return {
            sharedContactState: store.state.contact,
        }
    },
    methods: {
        clickUserItem(user) {
            console.log('click...', user, this.clickUserItemFunc);
            this.clickUserItemFunc && this.clickUserItemFunc(user);
        },

        scrollActiveElementCenter() {
            let el = this.$el.getElementsByClassName("active")[0];
            el && el.scrollIntoView({behavior: "instant", block: "center"});
        },

        tippyStyleFix() {
            let root = document.documentElement;
            root.style.setProperty('--tippy-right', '261px');
        },

        tippyStyleReset() {
            let root = document.documentElement;
            root.style.setProperty('--tippy-right', '0');
        },
        closeUserCard(user) {
            this.$refs["userCardTippy-" + user.uid]._tippy.hide();
        },
        imgUrlAlt(e) {
            e.target.src = Config.DEFAULT_PORTRAIT_URL;
        },
        showContactContextMenu(event, user) {
            if (this.enableContactContextMenu) {
                this.$eventBus.$emit('showContactContextMenu', [event, user]);
            }
        }
    },

    mounted() {
        if (!this.clickUserItemFunc) {
            this.tippyStyleFix()
        }
    },

    activated() {
        this.scrollActiveElementCenter();
    },

    unmounted() {
        if (!this.clickUserItemFunc) {
            this.tippyStyleReset()
        }
    },

    computed: {
        paddingStyle() {
            return {
                paddingLeft: this.paddingLeft
            }
        },
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
    },
    components: {
        UserCardView,
    },
}
</script>

<style lang="css" scoped>

.contact-item {
    --user-item-padding-left: 30px;
}

ul {
    list-style: none;
    width: 100%;
}

.avatar {
    width: var(--size-avatar-contact);
    height: var(--size-avatar-contact);
}

.checkbox {
    margin-right: 8px;
}

.contact-item {
    display: flex;
    flex-direction: column;
    font-size: var(--font-size-sm);
    align-items: flex-start;
}

.contact-item .label {
    width: 100%;
    background-color: var(--background-secondary);
}

.contact-item .label p {
    padding: 4px 4px 4px 0;
    border-bottom: 1px solid var(--border-primary);
}

.contact-item .label.sticky {
    position: sticky;
    top: 0;
}

.contact-item .content {
    padding: 8px 8px;
    display: flex;
    width: 100%;
    align-items: center;
}

.contact-item .content span {
    margin-left: 8px;
}

.contact-item .content:hover {
    background-color: var(--background-item-hover);
}

.contact-item .content.active {
    background-color: var(--background-item-active);
}

.user-item-info {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    padding-left: 8px;
}

.user-item-name-row {
    min-width: 0;
    overflow: hidden;
}

.user-item-name {
    flex: 1;
    min-width: 0;
}

.user-online-status {
    color: var(--text-secondary);
    font-size: 10px;
}

/*.contact-item .content:hover {*/
/*  background-color: var(--text-danger);*/
/*}*/

</style>

<!--<style>-->
<!--.tippy-tooltip {-->
<!--  right: 250px !important;-->
<!--  border: 1px solid var(--border-subtle) !important;-->
<!--  background-color: var(--background-tooltip) !important;-->
<!--}-->
<!--</style>-->
