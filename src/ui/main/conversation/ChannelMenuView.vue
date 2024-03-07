<template>
    <section class="channel-menu-container">
        <div v-for="(menu, index) in menus" :key="index">
            <tippy
                v-if="menu.subMenus && menu.subMenus.length > 0"
                :to="'#menu_' + index"
                :animate-fill="false"
                placement="top"
                distant="7"
                interactive
                theme="light"
                animation="fade"
                trigger="click"
                arrow
            >
                <template #content>
                    <div v-for="(sm, si) in menu.subMenus" :key="si" class="sub-menu-item" @click="openChannelMenu($event, sm)">
                        {{ sm.name }}
                    </div>
                </template>
            </tippy>
            <div :id="'menu_' + index"
                 class="menu-item"
                 @click="openChannelMenu($event, menu)">
                <p>
                    {{ menuTile(menu) }}
                </p>
            </div>
        </div>
        <div>
            <i @click="toggleMessageInput" class="icon-ion-chatboxes"></i>
        </div>
    </section>

</template>

<script>

import ChannelMenuEventMessageContent from "../../../wfc/messages/channelMenuEventMessageContent";
import wfc from "../../../wfc/client/wfc";
import Conversation from "../../../wfc/model/conversation";

export default {
    name: "ChannelMenuView",
    props: {
        menus: {
            type: Array,
            required: true,
        },
        conversation: {
            type: Conversation,
            required: true,
        }
    },

    methods: {
        toggleMessageInput() {
            this.$parent.toggleChannelMenu(false);
        },
        menuTile(menu) {
            if (menu.subMenus && menu.subMenus.length) {
                return '≡ ' + menu.name;
            }
            return menu.name;
        },

        openChannelMenu(event, menu) {
            console.log('open menu', menu)
            if (menu.subMenus && menu.subMenus.length) {
                return;
            }
            // TODO send channelMenuEventMessage
            // ChannelMenuEventMessageContent content = new ChannelMenuEventMessageContent();
            // content.setMenu(menu);
            // ChatManager.Instance().sendMessage(conversation, content, null, 0, null);
            //
            switch (menu.type) {
                case "view":
                    if (menu.url) {
                        //WfcWebViewActivity.loadUrl(getContext(), "", menu.url);
                        open(menu.url);
                    }
                    break;
                case "click":
                    let content = new ChannelMenuEventMessageContent(menu);
                    wfc.sendConversationMessage(this.conversation, content)
                    break;
                case "miniprogram":
                    break;
                default:
                    break;
            }

        }

    }
}
</script>

<style scoped>

.channel-menu-container {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    height: 50px;
    width: 100%;
    padding: 0 20px;
}

.channel-menu-container > div:not(:last-child) {
    flex: 1;
    height: 100%;
}

.menu-item {
    display: flex;
    height: 100%;
    justify-content: center;
    align-items: center;
    color: black;
}

.menu-item:not(:last-of-type) {
    border-right: 1px solid #e5e5e5;
}

.menu-item:hover {
    background: #e0e0e0e5;
}

.sub-menu-item {
    flex: 1;
    height: 30px;
    padding: 0 10px;
    display: flex;
    justify-content: center;
    align-items: center;
    color: black;
}

.sub-menu-item:not(:last-of-type) {
    border-bottom: 1px solid #e0e0e0e5;
}

.sub-menu-item:hover {
    background: #e0e0e0e5;
}

i {
    margin-left: 20px;
    font-size: 24px;
    color: #000;
    cursor: pointer;
}

>>> .tippy-arrow {
    border-top: 8px solid red !important;
    border-right: 8px solid transparent !important;
}

i:hover {
    color: #3f64e4;
}

</style>
