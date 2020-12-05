import Vue from 'vue'
import App from './App.vue'
import VueRouter from 'vue-router'
import routers from './routers'

import wfc from './wfc/client/wfc'
import VueTippy, { TippyComponent } from "vue-tippy";
import VueContext from 'vue-context';

import VModal from 'vue-js-modal'

Vue.config.productionTip = false
wfc.init()
console.log('init wfc', wfc)

Vue.use(VueRouter)

Vue.use(VueTippy);
Vue.component("tippy", TippyComponent);

Vue.use(VueContext);
Vue.component("vue-context", VueContext)

Vue.use(VModal);

const router = new VueRouter({
    mode: 'hash',
    routes: routers,
})

new Vue({
    el:'#app',
    router,
    render: h => h(App),
})

import './global.css'
import './assets/fonts/icomoon/style.css'
