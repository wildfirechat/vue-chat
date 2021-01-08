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

Vue.config.productionTip = false

// init
wfc.init()
store.init();
console.log('init wfc', wfc)
// init end

Vue.use(VueRouter)

Vue.use(VueTippy);
Vue.component("tippy", TippyComponent);

Vue.use(VueContext);
Vue.component("vue-context", VueContext)

Vue.use(VModal);

Vue.use(visibility);

const router = new VueRouter({
    mode: 'hash',
    routes: routers,
})

var vm = new Vue({
    el: '#app',
    router,
    render: h => h(App),
})
vm.store = store.state;

window.vm = vm;

