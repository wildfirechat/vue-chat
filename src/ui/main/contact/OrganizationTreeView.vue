<template>
    <section class="organization-tree-container">
        <div>
            <h2 class="title">
                组织结构
            </h2>
        </div>
        <nav class="breadcrumb">
            <ul>
                <li v-for="org in currentOrganizationPathList" :key="org.id">
                    <a href="#" @click.prevent="loadAndShowOrganization(org)">{{ org.name }}</a>
                </li>
            </ul>
        </nav>
        <div class="member-list-container">
            <ul>
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
                        <img :src="employee.portrait ? employee.portrait : defaultEmployeePortraitUrl"
                             :ref="'ref-employee-' + employee.employeeId"
                             :id="'infoTrigger-' + employee.employeeId">
                        <p class="name">{{ employee.name }}</p>
                    </div>
                </li>
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
            defaultEmployeePortraitUrl: Config.DEFAULT_PORTRAIT_URL,
            activeTippy: null,
        }
    },
    mounted() {
        this.loadAndShowOrganization(this.sharedContactState.currentOrganization);
    },
    methods: {
        loadAndShowOrganization(org) {
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
        employeeToUserInfo(employee) {
            return organizationServerApi.employeeToUserInfo(employee);
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

.title {
    padding: 20px;
    font-size: 20px;
    border-bottom: 1px solid lightgray;
}

.breadcrumb {
    padding: 20px 0 0 20px;
}

.breadcrumb ul {
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
    color: #8f959f;
    content: ">";
}

.breadcrumb li:not(:last-child) a {
    color: #4168e0;
}

.breadcrumb li:last-child a {
    color: #8f959f;
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
    background: #d6d6d6;
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
    color: #4168e0;
}

.organization-item .button:hover {
    background: #dbe1f0;
    border-radius: 5px;
}

</style>
