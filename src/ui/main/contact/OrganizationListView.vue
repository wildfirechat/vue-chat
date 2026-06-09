<template>
    <section>
        <ul>
            <li v-for="(organization, index) in rootOrganizations" :key="index" @click="showOrganization(organization)">
                <div class="organization-item"
                     v-bind:class="{active: sharedContactState.currentOrganization && sharedContactState.currentOrganization.id === organization.id}">
                    <img class="avatar" :src="organization.portrait ? organization.portrait : defaultPortraitUrl">
                    <div class="item-info">
                        <p class="single-line">{{ organization.name }}</p>
                    </div>
                </div>
            </li>
        </ul>
    </section>

</template>

<script>
import store from "../../../store";
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
            .catch(error => {
                this.$notify({
                    text: '组织结构服务异常',
                    type: 'error'
                })
                console.error(error);
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
    width: 32px;
    height: 32px;
}

.organization-item {
    padding: 8px 4px 8px 30px;
    display: flex;
    font-size: var(--font-size-sm);
    align-items: center;
}

.organization-item:hover {
    background-color: var(--background-item-hover);
}

.organization-item.active {
    background-color: var(--background-item-placeholder);
}

.item-info {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    padding-left: 8px;
}

.organization-item span {
    /*margin-left: 10px;*/
}

</style>
