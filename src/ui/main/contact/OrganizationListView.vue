<template>
    <section>
        <ul>
            <li v-for="(organization, index) in rootOrganizations" :key="index" @click="showOrganization(organization)">
                <div class="organization-item"
                     v-bind:class="{active: sharedContactState.currentOrganization && sharedContactState.currentOrganization.id === organization.id}">
                    <img class="avatar" :src="organization.portrait ? organization.portrait : defaultPortraitUrl">
                    <span class="single-line">{{ organization.name }}</span>
                </div>
            </li>
        </ul>
    </section>

</template>

<script>
import store from "@/store";
import organizationServerApi from "../../../api/organizationServerApi";
import Config from "../../../config";

export default {
    name: "OrganizationListView",
    props: {},
    data() {
        return {
            sharedContactState: store.state.contact,
            rootOrganizations: [],
            defaultPortraitUrl: Config.DEFAULT_ORGANIZATION_PORTRAIT_URL,
        }
    },
    mounted() {
        organizationServerApi.getRootOrganization()
            .then(orgs => {
                this.rootOrganizations = orgs;
            })

    },
    methods: {
        showOrganization(organization) {
            store.setCurrentOrganization(organization)
        },
    },
}
</script>

<style scoped>
.avatar {
    width: 40px;
    height: 40px;
    border-radius: 3px;
}

.organization-item {
    height: 50px;
    padding: 5px 10px 5px 30px;
    display: flex;
    font-size: 13px;
    align-items: center;
}

.organization-item.active {
    background-color: #d6d6d6;
}

.organization-item span {
    margin-left: 10px;
}

</style>
