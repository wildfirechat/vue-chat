<template>
    <section class="channel-menu-container">
        <template v-for="(menu, index) in menus">
            <tippy
                v-if="menu.subMenus && menu.subMenus.length > 0"
                :key="'_tippy_' + index"
                :to="'menu_' + index"
                interactive
                :animate-fill="false"
                placement="top"
                distant="7"
                theme="light"
                animation="fade"
                trigger="click"
                arrow
            >
                <div v-for="(sm, si) in menu.subMenus" :key="si" class="menu-item" @click="openChannelMenu($event, sm)">
                    {{ sm.name }}
                </div>
            </tippy>
            <div :key="index" :name="'menu_' + index" class="menu-item" @click="openChannelMenu($event, menu)">
                <p>
                    {{ menuTile(menu) }}
                </p>
            </div>
        </template>
        <div>
            <i @click="toggleMessageInput" class="icon-ion-ios-heart"></i>
        </div>
    </section>

</template>

<script>

export default {
    name: "ChannelMenuView",
    props: {
        menus: {
            type: Array,
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

.menu-item {
    flex: 1;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    color: black;

}

.menu-item:hover {
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
    color: #34b7f1;
}

</style>
