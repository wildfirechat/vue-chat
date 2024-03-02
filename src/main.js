import Vue, {createApp} from 'vue'
import App from './App.vue'
import {createRouter, createWebHashHistory} from 'vue-router'
import {createPinia} from 'pinia'
import routers from './routers'

import wfc from './wfc/client/wfc'
import VueTippy from 'vue-tippy'
import 'tippy.js/dist/tippy.css'
import 'tippy.js/themes/light.css'

import VueContext from '@madogai/vue-context';

import VModal from './vendor/vue-js-modal'
import './global.css'
import './wfc.css'
import './assets/fonts/icomoon/style.css'
import store from "./store";
import visibility from 'vue-visibility-change';
import {isElectron} from "./platform";
import {getItem} from "./ui/util/storageHelper";
import {createI18n} from 'vue-i18n'
import Notifications from '@kyvg/vue3-notification'
import Alert from "./ui/common/Alert.js";
import Picker from "./ui/common/Picker";
import Forward from "./ui/common/Forward";
import Voip from "./ui/common/Voip";
import VirtualList from "vue3-virtual-scroll-list";
import xss from "xss";
import mitt from 'mitt'
import {plugin as CoolLightBox} from "./vendor/vue-cool-lightbox";

// Vue.config.productionTip = false

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(CoolLightBox)

// init
{
    // pc
    if (isElectron()) {
        let href = window.location.href;
        let path = href.substring(href.indexOf('#') + 1)
        console.log('init', href, path)
        if (path === '/'/*login*/ || path.startsWith('/home') || href.indexOf('#') === -1) {
            wfc.init()
            // 双网环境配置
            //     // 设置网络策略
            //     wfc.setBackupAddressStrategy(0)
            //     // 设置备选网络
            //     wfc.setBackupAddress('192.168.10.11', 80)
            store.init(true);
        } else {
            wfc.attach()

            let subWindowLoadDataOptions = {
                loadFavGroupList: true,
                loadChannelList: true,
                loadFriendList: true,
                loadFavContactList: true,
                loadFriendRequestList: true,
                loadDefaultConversationList: true
            }
            // TODO 优化，有的窗口并不需要store，或者不需要加载所有默认数据
            store.init(false, subWindowLoadDataOptions);
        }
        // web
    } else {
        wfc.init();
        // 双网环境配置
        // 可以根据访问网页的地址，配置是否切换备选网络策略
        // 比如公网，通过域名访问，采用默认的主网络；内网，通过ip访问，使用备选网络
        // 需要在wfc.connect之前调用
        // if (new URL(window.origin).host.startsWith('192.168.2.169')) {
        //     // 设置备选网络不走WSS
        //     Config.USE_WSS = false;
        //     // 设置网络策略
        //     wfc.setBackupAddressStrategy(2)
        //     // 设置备选网络
        //     wfc.setBackupAddress('192.168.10.11', 80)
        // }
        store.init(true);
    }
}
// init end

// app.use(router)
// app.use(i18n)
// app.use(VueRouter)

// app.use(VueTippy);
// app.component("tippy", TippyComponent);
app.use(
    VueTippy,
    // optional
    {
        directive: 'tippy', // => v-tippy
        component: 'tippy', // => <tippy/>
        componentSingleton: 'tippy-singleton', // => <tippy-singleton/>,
        defaultProps: {
            theme: 'light',
            placement: 'auto-end',
            allowHTML: true,
        }, // => Global default options * see all props
    }
)

app.use(VueContext);
app.component("vue-context", VueContext)
app.component('virtual-list', VirtualList);

app.use(VModal);

app.use(visibility);

// app.use(VueI18n)
app.use(Alert)
app.use(Picker)
app.use(Forward)
app.use(Voip)

const i18n = createI18n({
    // 使用localStorage存储语言状态是为了保证页面刷新之后还是保持原来选择的语言状态
    locale: getItem('lang') ? getItem('lang') : 'zh-CN', // 定义默认语言为中文
    allowComposition: true,
    messages: {
        'zh-CN': require('@/assets/lang/zh-CN.json'),
        'zh-TW': require('@/assets/lang/zh-TW.json'),
        'en': require('@/assets/lang/en.json')
    }
})
app.use(i18n)

app.use(Notifications)
const router = createRouter({
    // mode: 'hash',
    history: createWebHashHistory(),
    routes: routers,
})
app.use(router)
app.config.globalProperties.$router = router

// app.prototype.$eventBus = mitt();
const eventBus = mitt()
eventBus.$on = eventBus.on
eventBus.$off = eventBus.off
eventBus.$emit = eventBus.emit
app.config.globalProperties.$eventBus = eventBus
// app.prototype.xss = xss;
// app.prototype.xssOptions = () => {
//     let whiteList = xss.getDefaultWhiteList();
//     window.__whiteList = whiteList;
//     //xss 处理的时候，默认会将 img 便签的class属性去除，导致 emoji 表情显示太大
//     //这儿配置保留 img 标签的style、class、src、alt、id 属性
//     whiteList.img = ["style", "class", "src", "alt", "id"];
//     return {
//         whiteList
//     };
// };

app.mount('#app')

// var vm = new Vue({
//     el: '#app',
//     router,
//     i18n,
//     render: h => h(App),
// })
// vm.store = store.state;
//
// window.vm = vm;
