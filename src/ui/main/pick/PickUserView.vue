<template>
    <div class="pick-contact-container">
        <section class="contact-list-container">
            <div class="input-container">
                <input type="text" :placeholder="$t('common.search')" v-model="filterQuery">
                <i class="icon-ion-ios-search"></i>
            </div>
            <div v-if="showOrganization" class="pick-source-container">
                <div v-if="pickSource" class="pick-source-nav">
                    <ul>
                        <li @click="pickSource = null">
                            <a href="#">联系人</a>
                        </li>
                        <li v-if="pickSource === 'friend'">
                            <a href="#">好友</a>
                        </li>
                        <li v-for="org in organizationPathList" :key="org.id">
                            <a href="#" @click="loadAndShowOrganization(org)">{{ org.name }}</a>
                        </li>
                    </ul>
                </div>
                <div class="pick-source-list">
                    <ul v-if="!pickSource">
                        <li @click="pickSource = 'friend'; organizationPathList = []">
                            <a href="#">
                                <i class="icon-ion-android-contacts"/>
                                选择好友
                            </a>
                        </li>
                        <li @click="pickSource = 'organization'">
                            <a href="#">
                                <i class="icon-ion-android-document"/>
                                选择组织联系人
                            </a>
                        </li>
                    </ul>
                </div>
            </div>
            <div v-if="!showOrganization || pickSource === 'friend'" class="friend-list-container">
                <CheckableUserListView :enable-pick="true"
                                       :users="filterUsers"
                                       :initial-checked-users="initialCheckedUsers"
                                       :uncheckable-users="uncheckableUsers"
                                       :show-category-label="showCategoryLabel && !filterQuery"
                                       :padding-left="'20px'"
                                       enable-category-label-sticky/>
            </div>
            <CheckableOrganizationTreeView
                ref="checkableOrganizationTreeView"
                v-if="pickSource === 'organization'"
                @organization-path-update="onOrganizationPathUpdate"/>
        </section>
        <section class="checked-contact-list-container">
            <header>
                <h2>{{ $t('pick.pick_contact') }}</h2>
                <div style="display: flex; justify-content: flex-end">
                    <span v-if="checkedUsers.length === 0">{{ $t('pick.picked_contact') }}</span>
                    <span v-else>{{ $t('pick.picked_contact') + ':' + this.checkedUsers.length }}</span>
                    <span v-if="sharedPickState.organizations.length">{{ '组织: ' + sharedPickState.organizations.length }}</span>
                </div>
            </header>
            <div class="content">
                <div class="picked-user-container" v-for="(user, index) in checkedUsers" :key="user.uid">
                    <div class="picked-user">
                        <img class="avatar" :src="user.portrait" alt="">
                        <button @click="unpickUser(user)" class="unpick-button">X</button>
                    </div>
                    <span class="name single-line">{{ user.displayName }}</span>
                </div>
                <div class="picked-user-container" v-for="(org, index) in sharedPickState.organizations" :key="org.id">
                    <div class="picked-user">
                        <img class="avatar" :src="org.portrait ? org.portrait : defaultOrganizationPortraitUrl" alt="">
                        <button @click="unpickOrganization(org)" class="unpick-button">X</button>
                    </div>
                    <span class="name single-line">{{ org.name }}</span>
                </div>
            </div>
            <footer>
                <button @click="cancel" class="cancel">{{ $t('common.cancel') }}</button>
                <button @click="confirm" class="confirm" v-bind:class="{disable:checkedUsers.length === 0  && sharedPickState.organizations.length === 0}">
                    {{ confirmTitle }}
                </button>
            </footer>
        </section>
    </div>
</template>

<script>
import store from "../../../store";
import CheckableUserListView from "../user/CheckableUserListView.vue";
import CheckableOrganizationTreeView from "./CheckableOrganizationTreeView.vue";
import Config from "../../../config";
import organizationServerApi from "../../../api/organizationServerApi";
import UserInfo from "../../../wfc/model/userInfo";

export default {
    name: "PickUserView",
    props: {
        users: {
            type: Array,
            required: true,
        },
        initialCheckedUsers: {
            type: Array,
            required: false,
            default: null,
        },
        uncheckableUsers: {
            type: Array,
            required: false,
            default: null,
        },
        title: {
            type: String,
            required: false,
            default: '',
        },
        confirmTitle: {
            type: String,
            required: false,
            default: 'confirm',
        },
        showCategoryLabel: {
            type: Boolean,
            required: false,
            default: true,
        },
        showOrganization: {
            type: Boolean,
            required: false,
            default: false,
        }

    },
    data() {
        return {
            sharedPickState: store.state.pick,
            filterQuery: '',
            pickSource: null,
            organizationPathList: [],
            defaultOrganizationPortraitUrl: Config.DEFAULT_DEPARTMENT_PORTRAIT_URL,
        }
    },
    methods: {
        unpickUser(user) {
            if (this.isUserUncheckable(user)) {
                return;
            }
            store.pickOrUnpickUser(user);
        },

        unpickOrganization(organization) {
            store.pickOrUnpickOrganization(organization);
        },

        isUserUncheckable(user) {
            return this.uncheckableUsers && this.uncheckableUsers.findIndex(u => u.uid === user.uid) >= 0;
        },

        onOrganizationPathUpdate(orgPathList) {
            this.organizationPathList = orgPathList;
        },

        loadAndShowOrganization(org) {
            this.$refs.checkableOrganizationTreeView.loadAndShowOrganization(org);
        },

        cancel() {
            this.sharedPickState.users.length = 0
            this.sharedPickState.organizations.length = 0;
            this.$modal.hide('pick-user-modal', {confirm: false})
        },

        /**
         * 不包含默认选中的用户
         */
        confirm() {
            let pickedUsers = this.sharedPickState.users;
            if (this.initialCheckedUsers) {
                pickedUsers = this.sharedPickState.users.filter(u => this.initialCheckedUsers.findIndex(iu => iu.uid === u.uid) === -1);
            } else {
                pickedUsers = this.sharedPickState.users;
            }
            let users = [...pickedUsers];
            this.sharedPickState.users.length = 0

            if (this.sharedPickState.organizations.length) {
                let orgIds = this.sharedPickState.organizations.map(o => o.id);
                organizationServerApi.getOrganizationEmployees(orgIds)
                    .then(employeeIds => {
                        this.sharedPickState.organizations.length = 0;
                        for (const employeeId of employeeIds) {
                            let userInfo = new UserInfo();
                            userInfo.uid = employeeId;
                            users.push(userInfo);
                        }
                        this.$modal.hide('pick-user-modal', {confirm: true, users: users})
                    })
            } else {
                this.$modal.hide('pick-user-modal', {confirm: true, users: users})
            }
        },
    },

    computed: {
        checkedUsers() {
            let users = this.sharedPickState.users;
            if (!this.initialCheckedUsers || this.initialCheckedUsers.length === 0) {
                return users;
            }
            return users.filter(u => {
                return this.initialCheckedUsers.findIndex(iu => iu.uid === u.uid) === -1
            })
        },
        filterUsers() {
            if (this.filterQuery) {
                return store.filterUsers(this.users, this.filterQuery);
            } else {
                return this.users;
            }
        }
    },

    components: {CheckableOrganizationTreeView, CheckableUserListView},
}
</script>

<style lang="css" scoped>
.pick-contact-container {
    display: flex;
    height: 100%;
    width: 100%;
}

.contact-list-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    background-color: #f7f7f7;
}

.contact-list-container .input-container {
    position: relative;
    display: flex;
    width: 100%;
}

.input-container input {
    height: 25px;
    margin: 15px 20px 0 15px;
    flex: 1;
    border-radius: 3px;
    border: 1px solid #ededed;
    background-color: white;
    padding-left: 20px;
    text-align: left;
    outline: none;
}

.input-container input:active {
    border: 1px solid #4168e0;
}

.input-container input:focus {
    border: 1px solid #4168e0;
}

.input-container i {
    position: absolute;
    top: 20px;
    left: 20px;
}

.pick-source-container {
    width: 100%;
}

.pick-source-nav {
    padding: 10px 0 0 20px;
    width: 100%;
    display: flex;
    align-items: center;
}

.pick-source-nav ul {
    display: flex;
    flex-wrap: wrap;
    list-style: none;
    margin: 0;
    padding: 0;
}

.pick-source-nav a {
    text-decoration: none;
    font-size: 14px;
}

.pick-source-nav li:not(:last-child)::after {
    display: inline-block;
    margin: 0 10px;
    color: #8f959f;
    content: ">";
}

.pick-source-nav li:not(:last-child) a {
    color: #4168e0;
}

.pick-source-nav li:last-child a {
    color: #8f959f;
    pointer-events: none;
}

.pick-source-list {
    padding: 5px 10px;
}

.pick-source-list ul li {
    padding: 0 10px;
    height: 40px;
    width: 100%;
    display: flex;
    align-items: center;
}

.pick-source-list ul li:hover {
    background: #d6d6d6;
    border-radius: 5px;
}

.pick-source-list ul li a {
    width: 100%;
}

.pick-source-list ul li::after {
    display: inline-block;
    color: #8f959f;
    content: ">";
}

.pick-source-list a {
    text-decoration: none;
    color: black;
    font-size: 14px;
}

.contact-list-container .friend-list-container {
    height: 100%;
    overflow: auto;
}

.checked-contact-list-container {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.checked-contact-list-container header {
    height: 55px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.checked-contact-list-container header h2 {
    font-size: 16px;
    font-weight: normal;
    margin-left: 30px;
}

.checked-contact-list-container header span {
    font-size: 12px;
    margin-right: 20px;
}


.checked-contact-list-container .content {
    height: 100%;
    flex: 1;
    display: flex;
    padding: 0 30px;
    flex-wrap: wrap;
    justify-content: flex-start;
    align-items: flex-start;
    align-content: flex-start;
    overflow: auto;
}

.checked-contact-list-container .content .picked-user-container {
    width: 33%;
    display: flex;
    flex-direction: column;
    column-count: 1;
    justify-content: center;
    align-items: center;
    padding: 5px 10px;
}

.checked-contact-list-container .content .picked-user-container .name {
    text-align: center;
    max-width: 80px;
    font-size: 12px;
}

.checked-contact-list-container .content .picked-user-container .picked-user {
    position: relative;
    height: 65px;
    width: 65px;
}

.checked-contact-list-container .content .avatar {
    width: 45px;
    height: 45px;
    margin: 10px 10px;
    border-radius: 3px;
}

.checked-contact-list-container .content .unpick-button {
    position: absolute;
    width: 20px;
    height: 20px;
    border: 1px solid white;
    border-radius: 10px;
    background-color: #f2f2f2;
    top: 0;
    right: 0;
}

.checked-contact-list-container .content .unpick-button:active {
    background-color: #e5e5e5;
}

.checked-contact-list-container footer {
    height: 55px;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    margin-bottom: 10px;
}

footer button {
    padding: 5px 30px;
    border-radius: 4px;
    border: 1px solid #cccccc;
}

footer button.confirm {
    background-color: #4168e0;
    margin-left: 20px;
    margin-right: 20px;
    color: white;
}

footer button.confirm.disable {
    background-color: #f2f2f2;
    color: #c2c2c2;
}

</style>
