<template>
    <div ref="contactItem" class="contact-item">
        <div v-if="showCategoryLabel && source.type === 'category'"
             class="label"
             :style="paddingStyle"
             v-bind:class="{sticky:enableCategoryLabelSticky}">
            <p>{{ source.category.toUpperCase() }}</p>
        </div>
        <div v-else>
            <tippy
                v-if="!clickUserItemFunc"
                :to="'#user-' + source.uid"
                interactive
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
                <div style="padding-left: 10px">
                    <p class="single-line"> {{ source._displayName }}</p>
                    <p v-if="source._userOnlineStatusDesc" class="single-line user-online-status"> {{ source._userOnlineStatusDesc }}</p>
                </div>
            </div>

        </div>
    </div>
</template>

<script>
import store from "../../../store";
import UserCardView from "./UserCardView.vue";
import Config from "../../../config";

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
