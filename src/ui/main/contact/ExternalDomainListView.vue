<template>
    <section>
        <ul>
            <li v-for="(domainInfo, index) in externalDomains" :key="index" @click="showExternalDomain(domainInfo)">
                <div class="organization-item"
                     v-bind:class="{active: sharedContactState.currentExternalDomain && sharedContactState.currentExternalDomain.domainId === domainInfo.domainId}">
                    <img class="avatar" :src="domainInfo.portrait ? domainInfo.portrait : defaultPortraitUrl">
                    <span class="single-line">{{ domainInfo.name }}</span>
                </div>
            </li>
        </ul>
    </section>

</template>

<script>
import store from "../../../store";
import Config from "../../../config";
import wfc from "../../../wfc/client/wfc";

export default {
    name: "ExternalDomainListView",
    props: {},
    data() {
        return {
            sharedContactState: store.state.contact,
            externalDomains: [],
            defaultPortraitUrl: Config.DEFAULT_MESH_PORTRAIT_URL,
        }
    },
    mounted() {
        wfc.loadRemoteDomains(domainInfos => {
            this.externalDomains = domainInfos;
        }, err => {
        })

    },
    methods: {
        showExternalDomain(domainInfo) {
            store.setCurrentExternalDomain(domainInfo)
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
