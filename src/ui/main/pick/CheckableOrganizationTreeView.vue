<template>
    <section class="organization-tree-container">
        <div class="member-list-container">
            <ul>
                <template v-if="!searchMode">
                    <li v-for="(org, index) in subOrganizations" :key="org.id">
                        <div class="organization-item"
                             @click.stop="clickOrganizationItem(org)">
                            <input type="checkbox" style="margin-right: 12px"
                                   v-bind:value="org"
                                   :checked="isOrganizationChecked(org)">
                            <img :src="org.portrait ? org.portrait : defaultDepartmentPortraitUrl">
                            <p class="name">{{ org.name }}</p>
                            <p class="button" v-bind:class="{disabled: isOrganizationChecked(org)}" @click.stop="onShowSubOrganizationButtonClick(org)">下级</p>
                        </div>
                    </li>
                    <li v-for="(employee, index) in employees" :key="employee.employeeId">
                        <div class="organization-item "
                             @click.stop="clickEmployeeItem(employee)">
                            <input type="checkbox" style="margin-right: 12px"
                                   v-bind:value="employee"
                                   :checked="isEmployeeChecked(employee)">
                            <img :src="employeePortraitUrl(employee)">
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
                             @click.stop="clickEmployeeItem(employee)">
                            <input type="checkbox" style="margin-right: 12px"
                                   v-bind:value="employee"
                                   :checked="isEmployeeChecked(employee)">
                            <img :src="employeePortraitUrl(employee)">
                            <p class="name">{{ employee.name }}</p>
                        </div>
                    </li>
                </template>
            </ul>
        </div>
    </section>
</template>

<script>
import Config from "../../../config";
import organizationServerApi from "../../../api/organizationServerApi";
import store from "../../../store";

export default {
    name: "CheckableOrganizationTreeView",
    props: {
        searchQuery: {
            type: String,
            default: '',
        }
    },
    components: {},
    data() {
        return {
            subOrganizations: [],
            employees: [],
            currentOrganizationPathList: [],
            defaultDepartmentPortraitUrl: Config.DEFAULT_DEPARTMENT_PORTRAIT_URL,
            activeTippy: null,
            searchResults: [],
            searchMode: false,
            currentOrgId: null,
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
        this.loadRootOrganizations().then(orgs => {
            if (orgs.length === 0) {
                if (organizationServerApi.isServiceAvailable) {
                    this.$notify({
                        text: '组织结构服务异常',
                        type: 'error',
                    });
                }
                return;
            }
            if (orgs.length > 0) {
                this.currentOrgId = orgs[0].id;
                this.loadAndShowOrganization(orgs[0])
            }
        })
    },
    methods: {
        /**
         * 加载根组织。组织结构服务的登录是登录成功后异步发起的，组件挂载时可能还没有 token，
         * 这里失败后补一次登录再重试；搜索时也会兜底调用，避免根组织为空导致搜不到人。
         */
        async loadRootOrganizations() {
            if (this.rootOrganizations.length) {
                return this.rootOrganizations;
            }
            try {
                this.rootOrganizations = (await organizationServerApi.getRootOrganization()) || [];
            } catch (e) {
                console.error('load root organizations failed', e);
                try {
                    await organizationServerApi.login();
                    this.rootOrganizations = (await organizationServerApi.getRootOrganization()) || [];
                } catch (e2) {
                    console.error('load root organizations failed after login', e2);
                }
            }
            return this.rootOrganizations;
        },
        loadAndShowOrganization(org) {
            this.loadAndShowOrganizationById(org.id);
        },
        loadAndShowOrganizationById(orgId) {
            this.currentOrgId = orgId;
            organizationServerApi.getOrganizationEx(orgId)
                .then(res => {
                    this.subOrganizations = res.subOrganizations;
                    this.employees = res.employees;
                });
            organizationServerApi.getOrganizationPath(orgId)
                .then(orgs => {
                    this.currentOrganizationPathList = orgs.reverse();
                    this.$emit('organization-path-update', this.currentOrganizationPathList);
                })
        },
        async search(keyword) {
            // 还没进入某个部门时，在根组织列表搜索所有根组织（原来必须点进部门才能搜到人）
            const rootOrganizations = await this.loadRootOrganizations();
            const orgIds = this.currentOrgId ? [this.currentOrgId] : rootOrganizations.map(o => o.id);
            if (orgIds.length === 0) return;
            try {
                const resultList = await Promise.all(orgIds.map(orgId => organizationServerApi.searchEmployee(orgId, keyword)));
                const employeeMap = new Map();
                resultList.flat().forEach(e => employeeMap.set(e.employeeId, e));
                this.searchResults = [...employeeMap.values()];
                this.searchMode = true;
            } catch (e) {
                console.error('search employee error', e);
            }
        },
        onShowSubOrganizationButtonClick(org) {
            if (this.isOrganizationChecked(org)) {
                return;
            }
            this.loadAndShowOrganization(org);
        },

        isOrganizationChecked(org) {
            return store.isOrganizationPicked(org);
        },

        clickOrganizationItem(org) {
            store.pickOrUnpickOrganization(org);
        },

        isEmployeeChecked(employee) {
            return store.isUserPicked(organizationServerApi.employeeToUserInfo(employee));
        },

        clickEmployeeItem(employee) {
            store.pickOrUnpickUser(organizationServerApi.employeeToUserInfo(employee));
        },

        employeePortraitUrl(employee) {
            return organizationServerApi.employeePortraitUrl(employee);
        }
    },

}
</script>

<style lang="css" scoped>

.organization-tree-container {
    display: flex;
    height: 100%;
    flex-direction: column;
}

.member-list-container {
    flex: 1;
    overflow-y: scroll;
}

.organization-item {
    display: flex;
    flex-direction: row;
    align-items: center;
    height: 56px;
    padding: 0 20px;
    font-size: var(--font-size-base);
}

.organization-item:hover {
    background: var(--background-item-hover);
}

.organization-item img {
    width: 36px;
    height: 36px;
    border-radius: var(--default-portrait-border-radius);
    margin-right: 8px;
}

.organization-item .button {
    justify-self: flex-end;
    margin-left: auto;
    padding: 4px;
    font-size: var(--font-size-base);
    color: var(--accent-color);
}

.organization-item .button:not(.disabled):hover {
    background: var(--background-selected-dim);
    border-radius: var(--radius-md);
}

.organization-item .button.disabled {
    color: var(--text-secondary);
}

.no-result {
    padding: 20px;
    color: var(--text-secondary);
    text-align: center;
    font-size: var(--font-size-base);
}

</style>
