import Vue from 'vue'
import App from './App.vue'
import wfc from './wfc/client/wfc'

Vue.config.productionTip = false
wfc.init()

new Vue({
  render: h => h(App),
}).$mount('#app')
