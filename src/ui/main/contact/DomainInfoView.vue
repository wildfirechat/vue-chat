<template>
    <section class="user-detail-container">
        <div class="user-header-content-container">
            <div class="header">
                <div>
                    <img class="avatar" :src="portrait">
                </div>
                <div class="name">
                    <h2>{{ domainInfo.name }}</h2>
                    <p>{{ '@' + domainInfo.domainId }}</p>
                </div>
            </div>
            <div class="content">
                <ul>
                    <li>
                        <label>邮箱</label>
                        <p>{{ domainInfo.email }}</p>
                    </li>
                    <li>
                        <label>电话</label>
                        <p>{{ domainInfo.tel }}</p>
                    </li>
                    <li>
                        <label>地址</label>
                        <p>{{ domainInfo.address }}</p>
                    </li>
                    <li>
                        <label> 描述</label>
                        <p>{{ domainInfo.desc }}</p>
                    </li>
                </ul>
            </div>
            <div class="footer">
                <div class="action" @click="searchDomainUser">
                    <i class="icon-ion-android-search"></i>
                    <a>{{ `在${domainInfo.name}查找用户` }}</a>
                </div>
            </div>
        </div>
    </section>
</template>

<script>
import store from "../../../store";
import ConversationType from "../../../wfc/model/conversationType";
import Conversation from "../../../wfc/model/conversation";
import wfc from "../../../wfc/client/wfc";
import Config from "../../../config";

export default {
    name: "DomainInfoView",
    props: {},
    data() {
        return {
            sharedStateContact: store.state.contact,
            domainInfo: store.state.contact.currentExternalDomain,
        }
    },

    methods: {
        searchDomainUser() {
            store.setSearchDomainInfo(this.domainInfo);
        }
    },
    computed: {
        portrait() {
            return Config.DEFAULT_MESH_PORTRAIT_URL;
        }
    }
}
</script>

<style lang="css" scoped>

.user-detail-container {
    border-top-right-radius: var(--main-border-radius);
    border-bottom-right-radius: var(--main-border-radius);
    display: flex;
    justify-content: center;
}

.user-header-content-container {
    width: 400px;
}

.header {
    margin-top: 60px;
    height: 75px;
    display: flex;
    align-items: center;
    padding-bottom: 15px;
    border-bottom: 1px solid #e6e6e6;
}

.header .avatar {
    width: 60px;
    height: 60px;
    border-radius: 5px;
    margin-right: 20px;
}

.header .name {
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-around;
}

.header .name h2 {
    font-size: 15px;
    font-style: normal;
    font-weight: normal;
    margin-bottom: 5px;
}

.header .name p {
    font-size: 13px;
    color: #7f7f7f;
}

.content {
    width: 100%;
    text-align: left;
    border-bottom: 1px solid #e6e6e6;
}

.content ul {
    list-style: none;
    margin: 20px 0 10px 0;
}

.content ul li {
    margin-left: 0;
    height: 40px;
    line-height: 40px;
    display: flex;
    font-size: 12px;
}

.content ul li label {
    margin-right: 20px;
    width: 40px;
    text-align: justify;
    text-align-last: justify;
    color: #7f7f7f;
}

.content ul li p {
    font-size: 12px;
}

.content ul li .alias > input {
    width: 100%;
    border: none;
    border-radius: 3px;
    outline: none;
    padding: 5px;
    color: #bfbfbf;
    font-size: 13px;
}

.content ul li .alias > input:active {
    border: 1px solid #4168e0;
}

.content ul li .alias input:focus {
    border: 1px solid #4168e0;
}

.content ul li > div {
    display: inline-block;
    flex: 1;
}

.footer {
    display: flex;
    justify-content: center;
    padding-top: 30px;
}

.footer .action {
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    align-items: center;
    color: #5d7ce8;
}

.footer .action a {
    font-size: 10px;
    padding-top: 1px;
}

.footer .action i {
    font-size: 20px;
}

</style>
