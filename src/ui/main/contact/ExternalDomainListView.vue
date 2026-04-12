<template>
    <section>
        <ul>
            <li v-for="(domainInfo, index) in externalDomains" :key="index" @click="showExternalDomain(domainInfo)">
                <div class="external-domain-item"
                     v-bind:class="{active: sharedContactState.currentExternalDomain && sharedContactState.currentExternalDomain.domainId === domainInfo.domainId}">
                    <img class="avatar" :src="domainInfo.portrait ? domainInfo.portrait : defaultPortraitUrl">
                    <div style="padding-left: 10px">
                        <p class="single-line">{{ domainInfo.name }}</p>
                    </div>
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
    width: 32px;
    height: 32px;
    border-radius: 3px;
    object-fit: cover;
}

.external-domain-item {
    padding: 10px 5px 10px 30px;
    display: flex;
    font-size: 13px;
    align-items: center;
}

.external-domain-item:hover {
    background-color: var(--background-item-hover);
}

.external-domain-item.active {
    background-color: var(--background-item-placeholder);
}

.external-domain-item span {
    /*margin-left: 10px;*/
}

</style>
