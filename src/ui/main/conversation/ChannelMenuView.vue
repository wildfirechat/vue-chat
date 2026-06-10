<template>
    <section class="channel-menu-container">
        <div v-for="(menu, index) in menus" :key="index">
            <tippy
                v-if="menu.subMenus && menu.subMenus.length > 0"
                :to="'#menu_' + index"
                placement="top"
                distant="7"
                interactive
                theme="light"
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
    height: 50px;
    width: 100%;
    padding: 0 8px;
    border-top: 1px solid var(--border-subtle);
}

.channel-menu-container > div:not(:last-child) {
    flex: 1;
    height: 100%;
    display: flex;
    align-items: center;
    border-right: 1px solid var(--border-subtle);
}

.menu-item {
    flex: 1;
    display: flex;
    height: calc(100% - 12px);
    margin: 0 4px;
    justify-content: center;
    align-items: center;
    color: var(--text-primary);
    font-size: var(--font-size-sm);
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: background-color var(--duration-fast), color var(--duration-fast);
}

.menu-item:hover {
    background-color: var(--background-item-hover);
}

.sub-menu-item {
    height: 32px;
    padding: 0 14px;
    display: flex;
    justify-content: center;
    align-items: center;
    color: var(--text-primary);
    font-size: var(--font-size-sm);
    border-radius: var(--radius-sm);
    white-space: nowrap;
    cursor: pointer;
    transition: background-color var(--duration-fast), color var(--duration-fast);
}

.sub-menu-item:not(:last-of-type) {
    margin-bottom: 2px;
}

.sub-menu-item:hover {
    background-color: var(--accent-color);
    color: var(--text-on-accent);
}

>>> .tippy-content {
    padding: 4px !important;
}

i {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    margin-left: 6px;
    font-size: 20px;
    color: var(--text-secondary);
    border-radius: var(--radius-circle);
    cursor: pointer;
    flex-shrink: 0;
    transition: background-color var(--duration-fast), color var(--duration-fast);
}

i:hover {
    background-color: var(--background-item-hover);
    color: var(--accent-color);
}

</style>
