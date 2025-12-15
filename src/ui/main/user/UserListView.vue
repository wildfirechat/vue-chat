<template>
    <ul v-if="users.length < 100">
        <li v-for="(groupedUser) in groupedUsers" :key="groupedUser.category">
            <div ref="contactItem" class="contact-item">
                <div v-if="showCategoryLabel" class="label"
                     :style="paddingStyle"
                     v-bind:class="{sticky:enableCategoryLabelSticky}">
                    <p>{{ groupedUser.category.toUpperCase() }}</p>
                </div>
                <ul>
                    <li v-for="(user) in groupedUser.users" :key="user.uid">
                        <tippy
                            v-if="!clickUserItemFunc"
                            :to="'#user-' + user.uid.replace('@', '-').replace('.', '-')"
                            theme="light"
                            :animate-fill="false"
                            distant="7"
                            animation="fade"
                            interactive
                            trigger="click"
                            placement="left-start"
                            :style="tippyStyleFix"
                        >
                            <template #content>
                                <UserCardView :user-info="user" v-on:close="closeUserCard(user)"/>
                            </template>
                        </tippy>
                        <div class="content"
                             :ref="'userCardTippy-' + user.uid.replace('@', '#')"
                             :id="'user-' + user.uid.replace('@', '-').replace('.', '-')"
                             :style="paddingStyle"
                             v-bind:class="{active: (sharedContactState.currentFriend
                        && user._category === sharedContactState.currentFriend._category
                        && user.uid === sharedContactState.currentFriend.uid) || (currentUser && currentUser.uid === user.uid)}"
                             @click.stop="clickUserItem(user)"
                             @contextmenu.prevent="showContactContextMenu($event, user)">
                            <img class="avatar" :src="user.portrait" alt="" @error="imgUrlAlt">
                            <div style="padding-left: 10px">
                                <div style="display: flex; align-items: center; ">
                                    <p class="single-line">{{ user._displayName }}</p>
                                    <p v-if="isExternalDomainUser(user)" class="single-line" style="color: #F0A040; border-radius: 2px;  padding: 1px 2px; font-size: 9px">{{ domainName(user) }}</p>
                                </div>
                                <p v-if="user._userOnlineStatusDesc" class="single-line user-online-status"> {{ user._userOnlineStatusDesc }}</p>
                            </div>
                        </div>

                    </li>
                </ul>
            </div>
        </li>
    </ul>
    <virtual-list
        v-else
        :data-component="UserItemView" :data-sources="virtualListGroupedUsers" :data-key="'uid'"
        :estimate-size="30"
        :extra-props="{
                currentUser: currentUser,
                showCategoryLabel: showCategoryLabel,
                enableCategoryLabelSticky: enableCategoryLabelSticky,
                clickUserItemFunc:clickUserItemFunc,
                paddingLeft: paddingLeft,
                enableContactContextMenu:enableContactContextMenu
            }"
        style="max-height: 100%; height: 100%; overflow-y: auto"/>
</template>

<script>
import store from "../../../store";
import UserCardView from "./UserCardView.vue";
import Config from "../../../config";
import UserItemView from "./UserItemView.vue";
import WfcUtil from "../../../wfc/util/wfcUtil";
import wfc from "../../../wfc/client/wfc";

export default {
    name: "UserListView",
    props: {
        users: {
            type: Array,
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
            this.$refs["userCardTippy-" + user.uid.replace('@', '#')][0]._tippy.hide();
        },
        imgUrlAlt(e) {
            e.target.src = Config.DEFAULT_PORTRAIT_URL;
        },
        showContactContextMenu(event, user) {
            if (this.enableContactContextMenu) {
                this.$eventBus.$emit('showContactContextMenu', [event, user]);
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
        UserItemView() {
            return UserItemView
        },

        virtualListGroupedUsers() {
            let groupedUsers = [];
            let currentCategory = {};
            let lastCategory = null;
            let index = 0;
            this.users.forEach((user) => {
                index++;
                if (this.showCategoryLabel && (!lastCategory || lastCategory !== user._category)) {
                    lastCategory = user._category;
                    currentCategory = {
                        type: 'category',
                        category: user._category,
                        uid: user._category + index,
                    };
                    groupedUsers.push(currentCategory);
                    groupedUsers.push(user);
                } else {
                    groupedUsers.push(user);
                }
            });
            return groupedUsers;
        },

        groupedUsers() {
            let groupedUsers = [];
            if (!this.showCategoryLabel) {
                groupedUsers.push({
                    category: 'not-show-category',
                    users: this.users,
                })
            } else {
                let current = {};
                let lastCategory = null;
                this.users.forEach((user) => {
                    if (!lastCategory || lastCategory !== user._category) {
                        lastCategory = user._category;
                        current = {
                            category: user._category,
                            users: [user],
                        };
                        groupedUsers.push(current);
                    } else {
                        current.users.push(user);
                    }
                });
            }
            return groupedUsers;
        },
        paddingStyle() {
            return {
                paddingLeft: this.paddingLeft
            }
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
    width: 40px;
    height: 40px;
    border-radius: 3px;
}

.checkbox {
    margin-right: 10px;
}

.contact-item {
    display: flex;
    flex-direction: column;
    font-size: 13px;
    align-items: flex-start;
}

.contact-item .label {
    width: 100%;
    background-color: #fafafa;
}

.contact-item .label p {
    padding: 5px 5px 5px 0;
    border-bottom: 1px solid #e0e0e0;
}

.contact-item .label.sticky {
    position: sticky;
    top: 0;
}

.contact-item .content {
    padding: 5px 5px 5px 0;
    display: flex;
    width: 100%;
    align-items: center;
}

.contact-item .content span {
    margin-left: 10px;
}

.contact-item .content.active {
    background-color: #d6d6d6;
}

.contact-item .content:active {
    background-color: #d6d6d6;
}

.user-online-status {
    color: gray;
    font-size: 10px;
}

/*.contact-item .content:hover {*/
/*  background-color: red;*/
/*}*/

</style>

<!--<style>-->
<!--.tippy-tooltip {-->
<!--  right: 250px !important;-->
<!--  border: 1px solid #f5f5f5 !important;-->
<!--  background-color: #fcfcfc !important;-->
<!--}-->
<!--</style>-->
