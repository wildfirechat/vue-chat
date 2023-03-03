import Vue from 'vue'
import App from './App.vue'
import VueRouter from 'vue-router'
import routers from './routers'

import wfc from './wfc/client/wfc'
import VueTippy, {TippyComponent} from "vue-tippy";
import VueContext from 'vue-context';

import VModal from 'vue-js-modal'
import './global.css'
import './wfc.css'
import './assets/fonts/icomoon/style.css'
import store from "@/store";
import visibility from 'vue-visibility-change';
import {isElectron, remote} from "@/platform";
import {getItem} from "./ui/util/storageHelper";
import VueI18n from 'vue-i18n'
import Notifications from 'vue-notification'
import Alert from "./ui/common/Alert.js";
import Picker from "./ui/common/Picker";
import Forward from "./ui/common/Forward";
import VirtualList from "vue-virtual-scroll-list/src";
import xss from "xss";

Vue.config.productionTip = false

// init
{
    let href = window.location.href;
    let path = href.substring(href.indexOf('#') + 1)
    console.log('init', href, path)
    // 判断是否是主窗口，请根据实际情况进行调整
    if (path === '/'/*login*/ || path.startsWith('/home') || href.indexOf('#') === -1) {
        console.log('init wfc')
        if (isElectron()) {
            wfc.init()
            // 双网环境配置
            //     // 设置网络策略
            //     wfc.setBackupAddressStrategy(0)
            //     // 设置备选网络
            //     wfc.setBackupAddress('192.168.10.11', 80)
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
        }
        store.init(true, false);
    } else {
        console.error('not home window, not init wfc, 如果此窗口就是主窗口或者应用只有一个窗口，可能会导致功能不正常，请更新上面的主窗口判断逻辑')
        if (isElectron()) {
            wfc.attach()
        }
        store.init(false, false);
    }
}
// init end

Vue.use(VueRouter)

Vue.use(VueTippy);
Vue.component("tippy", TippyComponent);

Vue.use(VueContext);
Vue.component("vue-context", VueContext)
Vue.component('virtual-list', VirtualList);

Vue.use(VModal);

Vue.use(visibility);

Vue.use(VueI18n)
Vue.use(Alert)
Vue.use(Picker)
Vue.use(Forward)

const i18n = new VueI18n({
    // 使用localStorage存储语言状态是为了保证页面刷新之后还是保持原来选择的语言状态
    locale: getItem('lang') ? getItem('lang') : 'zh-CN', // 定义默认语言为中文
    messages: {
        'zh-CN': require('@/assets/lang/zh-CN.json'),
        'zh-TW': require('@/assets/lang/zh-TW.json'),
        'en': require('@/assets/lang/en.json')
    }
})

Vue.use(Notifications)
const router = new VueRouter({
    mode: 'hash',
    routes: routers,
})
Vue.prototype.$eventBus = new Vue();
Vue.prototype.xss = xss;

var vm = new Vue({
    el: '#app',
    router,
    i18n,
    render: h => h(App),
})
vm.store = store.state;

window.vm = vm;

