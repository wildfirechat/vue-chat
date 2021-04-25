<template>
    <section>
        <div class="workspace-container">
            <div class="etabs-tabgroup">
                <div class="etabs-tabs"></div>
                <div class="etabs-buttons"></div>
            </div>
            <div class="etabs-views"></div>
        </div>
        <div v-if="shouldShowWorkspacePortal" class="workspace-portal">
            <div>
                <button @click="showWFCHome">点击打开野火IM官网</button>
            </div>
            <div>
                <button @click="showDevDocs">点击打开野火开发者文档</button>
            </div>
            <div>
                <button @click="openConversation">打开和机器人小火的会话界面</button>
            </div>
            <div>
                <button @click="sendMessage">给机器人小火发送消息：嘿，你好，小火。</button>
            </div>
        </div>
    </section>
</template>

<script>
// const TabGroup = require("electron-tabs");
import ElectronTabs from 'electron-tabs'
import '../../../node_modules/electron-tabs/electron-tabs.css'
import {ipcRenderer} from "../../platform";
import IPCEventType from "../../ipcEventType";
import Conversation from "../../wfc/model/conversation";

let tabGroup = null;

export default {
    name: "WorkspacePage",
    data() {
        return {
            shouldShowWorkspacePortal: true,
        }
    },
    methods: {
        tab() {
            // window.open('www.baidu.com')
            // let tabGroup = new ElectronTabs();
            let tab = tabGroup.addTab({
                title: "野火IM",
                src: "https://www.wildfirechat.cn",
                visible: true
            });
            let tab2 = tabGroup.addTab({
                title: "野火IM开发文档",
                src: "https://docs.wildfirechat.cn",
                visible: true,
                active: true
            });
        },
        showWFCHome() {
            tabGroup.addTab({
                title: "野火IM",
                src: "https://www.wildfirechat.cn",
                visible: true,
                active: true,
            });
            this.shouldShowWorkspacePortal = false;
        },
        showDevDocs() {
            tabGroup.addTab({
                title: "野火IM开发文档",
                src: "https://docs.wildfirechat.cn",
                visible: true,
                active: true
            });
            this.shouldShowWorkspacePortal = false;
        },
        addInitialTab() {
            tabGroup.addTab({
                title: "野火IM工作空间",
                // src: url,
                visible: true,
                closable: false,
            });
        },

        openConversation() {
            let conversation = new Conversation(0, 'FireRobot', 0)
            ipcRenderer.send('wf-ipc-to-main', {type: IPCEventType.openConversation, value: conversation})
        },

        sendMessage() {
            // TODO ipc时需要messagePayload，messageContent会丢失类型信息
            // let conversation = new Conversation(0, 'FireRobot', 0)
            // let textMessageContent = new TextMessageContent('hello world')
            // let message = new Message(conversation, textMessageContent)
            // let messagePayload = null;
            // ipcRenderer.send(IPCEventType.sendMessage, messagePayload);
        },

        onTabActive() {
            let tab = tabGroup.getActiveTab();
            console.log('onTabActive', tab)
            this.shouldShowWorkspacePortal = tab.id === 0;
        },

        onTabClose() {

        }
    },

    created() {
        document.title = '工作空间';
    },

    mounted() {
        tabGroup = new ElectronTabs();
        tabGroup.on('tab-active', this.onTabActive)

        this.addInitialTab();
    },

    computed: {}
}
</script>

<style scoped>
.workspace-container {
    width: 100%;
    height: 100%;
}

.workspace-portal {
    position: absolute;
    left: 0;
    top: 32px;
    width: 100%;
    height: calc(100% - 32px);
    display: flex;
    flex-direction: column;
}

.workspace-portal button {
    padding: 10px;
    margin: 20px;
    border-radius: 3px;
}

>>> .etabs-tab {
    height: 32px;
}

</style>
