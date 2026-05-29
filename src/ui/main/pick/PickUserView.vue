<template>
    <div class="pick-contact-container">
        <section class="contact-list-container">
            <div class="input-container">
                <input type="text" :placeholder="$t('common.search')" v-model="filterQuery">
                <i class="icon-ion-ios-search"></i>
                <span v-if="filterQuery" class="clear-btn" @click="filterQuery = ''">×</span>
            </div>
            <template v-if="showOrganization && orgServiceAvailable">
                <div class="pick-category-container">
                    <div @click="toggleOrganizationSection" class="category-item-container">
                        <i class="arrow right" v-bind:class="{down: expandOrganizationSection}"></i>
                        <div class="category-item">
                            <span class="title">组织结构</span>
                        </div>
                    </div>
                    <div v-show="expandOrganizationSection" class="organization-section">
                        <div v-if="organizationPathList.length" class="pick-source-nav">
                            <ul>
                                <li v-for="org in organizationPathList" :key="org.id">
                                    <a href="#" @click.prevent="loadAndShowOrganization(org)">{{ org.name }}</a>
                                </li>
                            </ul>
                        </div>
                        <CheckableOrganizationTreeView
                            ref="checkableOrganizationTreeView"
                            :search-query="filterQuery"
                            @organization-path-update="onOrganizationPathUpdate"/>
                    </div>

                    <div @click="toggleContactSection" class="category-item-container">
                        <i class="arrow right" v-bind:class="{down: expandContactSection}"></i>
                        <div class="category-item">
                            <span class="title">联系人</span>
                            <span class="desc">{{ filterUsers.length }}</span>
                        </div>
                    </div>
                    <div v-show="expandContactSection" class="friend-list-container">
                        <CheckableUserListView :enable-pick="true"
                                               :users="filterUsers"
                                               :initial-checked-users="initialCheckedUsers"
                                               :uncheckable-users="uncheckableUsers"
                                               :show-category-label="showCategoryLabel && !filterQuery"
                                               :padding-left="'20px'"
                                               :virtual-list-style="{ 'max-height': '600px', 'overflow-y': 'auto' }"
                                               enable-category-label-sticky/>
                    </div>
                </div>
            </template>
            <div v-else class="friend-list-container">
                <CheckableUserListView :enable-pick="true"
                                       :users="filterUsers"
                                       :initial-checked-users="initialCheckedUsers"
                                       :uncheckable-users="uncheckableUsers"
                                       :show-category-label="showCategoryLabel && !filterQuery"
                                       :padding-left="'20px'"
                                       enable-category-label-sticky/>
            </div>
        </section>
        <section class="checked-contact-list-container">
            <header>
                <h2>{{ this.title ? this.title : $t('pick.pick_contact') }}</h2>
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
                        <button @click="onPickUser(user)" class="unpick-button">X</button>
                    </div>
                    <div style="display: flex; align-items: center; ">
                        <p class="name single-line">{{ user._displayName }}</p>
                        <p v-if="isExternalDomainUser(user)" class="single-line" style="color: var(--text-warning); border-radius: 2px;  padding: 1px 2px; font-size: 9px">{{ domainName(user) }}</p>
                    </div>
                </div>
                <div class="picked-user-container" v-for="(org, index) in sharedPickState.organizations" :key="org.id">
                    <div class="picked-user">
                        <img class="avatar" :src="org.portrait ? org.portrait : defaultOrganizationPortraitUrl" alt="">
                        <button @click="onPickOrganization(org)" class="unpick-button">X</button>
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
import WfcUtil from "../../../wfc/util/wfcUtil";
import wfc from "../../../wfc/client/wfc";

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
            organizationPathList: [],
            expandOrganizationSection: false,
            expandContactSection: true,
            defaultOrganizationPortraitUrl: Config.DEFAULT_DEPARTMENT_PORTRAIT_URL,
            orgServiceAvailable: organizationServerApi.isServiceAvailable,
        }
    },
    methods: {
        toggleOrganizationSection() {
            this.expandOrganizationSection = !this.expandOrganizationSection;
        },

        toggleContactSection() {
            this.expandContactSection = !this.expandContactSection;
        },

        onPickUser(user) {
            if (this.isUserUncheckable(user)) {
                return;
            }
            store.pickOrUnpickUser(user);
        },

        onPickOrganization(organization) {
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
                    .then(employeeList => {
                        this.sharedPickState.organizations.length = 0;
                        for (const employee of employeeList) {
                            let userInfo = new UserInfo();
                            userInfo.uid = employee.employeeId;
                            userInfo.displayName = employee.name;
                            userInfo.updateDt = employee.updateDt;
                            users.push(userInfo);
                        }
                        this.$modal.hide('pick-user-modal', {confirm: true, users: users})
                    })
            } else {
                this.$modal.hide('pick-user-modal', {confirm: true, users: users})
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
    background-color: var(--background-item-normal);
    overflow: hidden;
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
    border: 1px solid var(--border-tertiary);
    background-color: var(--background-primary);
    padding-left: 20px;
    padding-right: 20px;
    text-align: left;
    outline: none;
}

.input-container input:active {
    border: 1px solid var(--border-active);
}

.input-container input:focus {
    border: 1px solid var(--border-active);
}

.input-container i {
    position: absolute;
    top: 20px;
    left: 20px;
}

.input-container .clear-btn {
    position: absolute;
    top: 15px;
    right: 28px;
    height: 25px;
    line-height: 25px;
    cursor: pointer;
    color: var(--text-secondary-strong);
    font-size: 16px;
}

.pick-category-container {
    flex: 1;
    min-height: 0;
    overflow: auto;
}

.category-item-container {
    height: 40px;
    display: flex;
    align-items: center;
    padding-left: 15px;
    color: var(--text-primary);
    font-size: 14px;
    border-top: 1px solid var(--border-tertiary);
    background-color: var(--background-secondary);
}

.category-item {
    display: flex;
    width: 100%;
    justify-content: space-between;
}

.category-item .desc {
    margin-right: 15px;
    color: var(--text-secondary-strong);
}

.arrow {
    border: solid var(--contact-arrow-border);
    border-width: 0 1px 1px 0;
    display: inline-block;
    padding: 3px;
    margin-right: 10px;
}

.right {
    transform: rotate(-45deg);
    -webkit-transform: rotate(-45deg);
}

.down {
    transform: rotate(45deg);
    -webkit-transform: rotate(45deg);
}

.organization-section {
    border-top: 1px solid var(--border-tertiary);
}

.organization-section :deep(.organization-tree-container) {
    height: auto;
    max-height: none;
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
}

.organization-section :deep(.member-list-container) {
    margin: 5px;
    max-height: none;
    overflow: visible;
    height: auto;
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
    color: var(--text-secondary-strong);
    content: ">";
}

.pick-source-nav li:not(:last-child) a {
    color: var(--accent-color);
}

.pick-source-nav li:last-child a {
    color: var(--text-secondary-strong);
    pointer-events: none;
}

.pick-category-container .friend-list-container {
    overflow: visible;
}

.contact-list-container > .friend-list-container {
    flex: 1;
    min-height: 0;
    overflow: auto;
}

.checked-contact-list-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    background-color: var(--background-primary);
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
    background-color: var(--background-tertiary);
    top: 0;
    right: 0;
}

.checked-contact-list-container .content .unpick-button:active {
    background-color: var(--border-primary);
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
    border: 1px solid var(--border-primary);
}

footer button.confirm {
    background-color: var(--accent-color);
    margin-left: 20px;
    margin-right: 20px;
    color: var(--text-on-accent);
}

footer button.confirm.disable {
    background-color: var(--background-tertiary);
    color: var(--text-tertiary);
}

</style>
