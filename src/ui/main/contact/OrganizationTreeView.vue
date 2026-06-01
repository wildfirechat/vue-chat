<template>
    <section class="organization-tree-container">
        <div class="title-bar">
            <h2 class="title">组织结构</h2>
        </div>
        <nav class="breadcrumb">
            <ul>
                <li v-for="org in currentOrganizationPathList" :key="org.id">
                    <a href="#" @click.prevent="loadAndShowOrganization(org)">{{ org.name }}</a>
                </li>
            </ul>
            <div class="search-action" :class="{ active: searchActive }">
                <input
                    ref="searchInput"
                    type="text"
                    placeholder="搜索成员"
                    v-model="searchQuery"
                    class="search-expand-input"
                    @blur="onSearchBlur"
                >
                <button class="search-icon-btn" @mousedown.prevent="toggleSearch">
                    <i :class="searchActive ? 'icon-ion-ios-close' : 'icon-ion-ios-search'"></i>
                </button>
            </div>
        </nav>
        <div class="member-list-container">
            <ul>
                <template v-if="!searchMode">
                    <li v-for="(org, index) in subOrganizations" :key="org.id">
                        <div class="organization-item">
                            <img :src="org.portrait ? org.portrait : defaultDepartmentPortraitUrl">
                            <p class="name">{{ org.name }}</p>
                            <p class="button" @click="loadAndShowOrganization(org)">下级</p>
                        </div>
                    </li>
                    <li v-for="(employee, index) in employees" :key="employee.employeeId">
                        <div class="organization-item"
                             @click="showUserCardView($event, employee)"
                        >
                            <tippy
                                :to="'#infoTrigger-' + employee.employeeId"
                                interactive
                                :animate-fill="false"
                                placement="right"
                                distant="20"
                                :id="employee.employeeId"
                                theme="light"
                                animation="fade"
                                trigger="manual"
                            >
                                <template #content>
                                    <UserCardView
                                        v-on:close="closeUserCard"
                                        :enable-update-portrait="false"
                                        :user-info="employeeToUserInfo(employee)"/>
                                </template>
                            </tippy>
                            <img :src="portraitUrl(employee)"
                                 :ref="'ref-employee-' + employee.employeeId"
                                 :id="'infoTrigger-' + employee.employeeId">
                            <p class="name">{{ employee.name }}</p>
                        </div>
                    </li>
                </template>
                <template v-else>
                    <li v-if="searchResults.length === 0">
                        <p class="no-result">无搜索结果</p>
                    </li>
                    <li v-for="(employee, index) in searchResults" :key="'search-' + employee.employeeId">
                        <div class="organization-item"
                             @click="showUserCardView($event, employee)"
                        >
                            <tippy
                                :to="'#infoTrigger-' + employee.employeeId"
                                interactive
                                :animate-fill="false"
                                placement="right"
                                distant="20"
                                :id="employee.employeeId"
                                theme="light"
                                animation="fade"
                                trigger="manual"
                            >
                                <template #content>
                                    <UserCardView
                                        v-on:close="closeUserCard"
                                        :enable-update-portrait="false"
                                        :user-info="employeeToUserInfo(employee)"/>
                                </template>
                            </tippy>
                            <img :src="portraitUrl(employee)"
                                 :ref="'ref-employee-' + employee.employeeId"
                                 :id="'infoTrigger-' + employee.employeeId">
                            <p class="name">{{ employee.name }}</p>
                        </div>
                    </li>
                </template>
            </ul>
        </div>
    </section>
</template>

<script>
import store from "../../../store";
import Config from "../../../config";
import organizationServerApi from "../../../api/organizationServerApi";
import UserCardView from "../user/UserCardView.vue";

export default {
    name: "OrganizationTreeView",
    props: {},
    components: {
        UserCardView,
    },
    data() {
        return {
            sharedContactState: store.state.contact,
            subOrganizations: [],
            employees: [],
            currentOrganizationPathList: [],
            defaultDepartmentPortraitUrl: Config.DEFAULT_DEPARTMENT_PORTRAIT_URL,
            activeTippy: null,
            searchQuery: '',
            searchResults: [],
            searchMode: false,
            currentOrgId: null,
            searchActive: false,
        }
    },
    watch: {
        searchQuery(newVal) {
            if (this._searchTimer) {
                clearTimeout(this._searchTimer);
            }
            const keyword = newVal.trim();
            if (keyword) {
                this._searchTimer = setTimeout(() => {
                    this.search(keyword);
                }, 300);
            } else {
                this.searchMode = false;
                this.searchResults = [];
            }
        }
    },
    mounted() {
        let org = this.sharedContactState.currentOrganization;
        this.currentOrgId = org.id;
        this.loadAndShowOrganization(org);
    },
    methods: {
        loadAndShowOrganization(org) {
            this.searchQuery = '';
            this.searchMode = false;
            this.searchResults = [];
            this.searchActive = false;
            this.currentOrgId = org.id;
            organizationServerApi.getOrganizationEx(org.id)
                .then(res => {
                    this.subOrganizations = res.subOrganizations;
                    this.employees = res.employees;
                });
            organizationServerApi.getOrganizationPath(org.id)
                .then(orgs => {
                    this.currentOrganizationPathList = orgs.reverse();
                })
        },
        toggleSearch() {
            if (this.searchActive) {
                this.searchQuery = '';
                this.searchActive = false;
            } else {
                this.searchActive = true;
                this.$nextTick(() => {
                    this.$refs.searchInput.focus();
                });
            }
        },
        onSearchBlur() {
            if (!this.searchQuery) {
                this.searchActive = false;
            }
        },
        async search(keyword) {
            if (!this.currentOrgId) return;
            try {
                this.searchResults = await organizationServerApi.searchEmployee(this.currentOrgId, keyword);
                this.searchMode = true;
            } catch (e) {
                console.error('search employee error', e);
            }
        },
        employeeToUserInfo(employee) {
            return organizationServerApi.employeeToUserInfo(employee);
        },
        portraitUrl(employee) {
            return organizationServerApi.employeePortraitUrl(employee)
        },
        showUserCardView(evt, employee) {
            if (this.activeTippy) {
                this.activeTippy.hide();
                if (employee.employeeId === this.activeTippy.id) {
                    return;
                }
                this.activeTippy = null;
            }
            let employeeItem = this.$refs['ref-employee-' + employee.employeeId][0];
            this.activeTippy = employeeItem._tippy;
            this.activeTippy.show();
        },
        closeUserCard() {
            if (this.activeTippy) {
                this.activeTippy.hide();
            }
        }
    },

}
</script>

<style lang="css" scoped>

.organization-tree-container {
    display: flex;
    height: 100%;
    flex-direction: column;
    border-top-right-radius: var(--main-border-radius);
    border-bottom-right-radius: var(--main-border-radius);
}

.title-bar {
    display: flex;
    align-items: center;
    padding: 0 20px;
    height: 63px;
    flex-shrink: 0;
    border-bottom: 1px solid var(--border-tertiary);
}

.title {
    flex: 1;
    font-size: 20px;
    font-weight: normal;
    margin: 0;
}

.search-action {
    display: flex;
    align-items: center;
    flex-direction: row;
    padding: 0 10px;
}

.search-expand-input {
    width: 0;
    height: 28px;
    border: none;
    border-bottom: 2px solid transparent;
    background: transparent;
    outline: none;
    font-size: 13px;
    padding: 0;
    color: var(--text-primary);
    transition: width 0.25s ease, border-color 0.25s ease, padding 0.25s ease;
    overflow: hidden;
}

.search-action.active .search-expand-input {
    width: 150px;
    border-bottom-color: var(--accent-color);
    padding: 0 8px;
}

.search-icon-btn {
    width: 32px;
    height: 32px;
    flex-shrink: 0;
    border: none;
    background: transparent;
    cursor: pointer;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-secondary-strong);
    font-size: 20px;
    transition: background 0.15s ease;
}

.search-icon-btn:hover {
    background: var(--background-item-hover);
}

.no-result {
    padding: 20px;
    color: var(--text-secondary);
    text-align: center;
    font-size: 14px;
}

.breadcrumb {
    display: flex;
    align-items: center;
    padding: 20px;
    height: 50px;
    flex-shrink: 0;
    //border-bottom: 1px solid var(--border-tertiary);
}

.breadcrumb ul {
    flex: 1;
    display: flex;
    flex-wrap: wrap;
    list-style: none;
    margin: 0;
    padding: 0;
}

.breadcrumb a {
    text-decoration: none;
}

.breadcrumb li:not(:last-child)::after {
    display: inline-block;
    margin: 0 10px;
    color: var(--text-secondary-strong);
    content: ">";
}

.breadcrumb li:not(:last-child) a {
    color: var(--accent-color);
}

.breadcrumb li:last-child a {
    color: var(--text-secondary-strong);
    pointer-events: none;
}

.member-list-container {
    margin: 5px 5px 20px 5px;
    flex: 1;
    overflow-y: scroll;
}

.organization-item {
    display: flex;
    flex-direction: row;
    align-items: center;
    height: 56px;
    padding: 0 20px;
    border-radius: 5px;
    font-size: 14px;
}

.organization-item:hover {
    background: var(--background-item-hover);
}

.organization-item img {
    width: 40px;
    height: 40px;
    border-radius: 5px;
    margin-right: 10px;
}

.organization-item .button {
    justify-self: flex-end;
    margin-left: auto;
    padding: 5px;
    font-size: 14px;
    color: var(--accent-color);
}

.organization-item .button:hover {
    background: var(--background-selected-dim);
    border-radius: 5px;
}

</style>
