import Vue from 'vue'
import App from './App.vue'
import VueRouter from 'vue-router'
import routers from './routers'

import wfc from './wfc/client/wfc'
import VueTippy, { TippyComponent } from "vue-tippy";

Vue.config.productionTip = false
wfc.init()
console.log('init wfc', wfc)

Vue.use(VueRouter)

Vue.use(VueTippy);
Vue.component("tippy", TippyComponent);

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
