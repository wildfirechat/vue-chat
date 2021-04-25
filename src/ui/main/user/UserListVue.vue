<template>
    <section>
        <ul>
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
                                :to="'user-' + user.uid"
                                interactive
                                theme="light"
                                :animate-fill="false"
                                placement="left"
                                distant="7"
                                animation="fade"
                                trigger="click"
                                :style="tippyStyleFix"
                            >
                                <UserCardView :user-info="user" v-on:close="closeUserCard(user)"/>
                            </tippy>
                            <div class="content"
                                 :ref="'userCardTippy-'+user.uid"
                                 :name="'user-'+user.uid"
                                 :style="paddingStyle"
                                 v-bind:class="{active: (sharedContactState.currentFriend
                        && user._category === sharedContactState.currentFriend._category
                        && user.uid === sharedContactState.currentFriend.uid) || (currentUser && currentUser.uid === user.uid)}"
                                 @click.stop="clickUserItem(user)">
                                <img class="avatar" :src="user.portrait" alt="">
                                <span
                                    class="single-line"> {{ user._displayName }}</span>
                            </div>

                        </li>
                    </ul>
                </div>
            </li>
        </ul>
    </section>
</template>

<script>
import store from "@/store";
import UserCardView from "@/ui/main/user/UserCardView";

export default {
    name: "UserListVue",
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
            root.style.setProperty('--tippy-right', '250px');
        },

        tippyStyleReset() {
            let root = document.documentElement;
            root.style.setProperty('--tippy-right', '0');
        },
        closeUserCard(user) {
            this.$refs["userCardTippy-" + user.uid][0]._tippy.hide();
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

    destroyed() {
        if (!this.clickUserItemFunc) {
            this.tippyStyleReset()
        }
    },

    computed: {
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
