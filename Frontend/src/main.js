// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'
import router from './router'
import config from '@/config.js'
import store from '@/store'
import VueResource from 'vue-resource'
import VueMaterial from 'vue-material'

Vue.config.productionTip = false

Vue.use(VueResource)

Vue.http.options.root = config.base_url

Vue.router = router

Vue.use(VueMaterial)

Vue.use(require('@websanova/vue-auth'), {
  auth: require('@/auth/custom.js'),
  http: require('@websanova/vue-auth/drivers/http/vue-resource.1.x.js'),
  router: require('@websanova/vue-auth/drivers/router/vue-router.2.x.js'),
  loginData: { url: 'authenticate', method: 'POST', redirect: '/', fetchUser: true },
  registerData: { url: 'register', method: 'POST', redirect: '/' },
  fetchData: { url: 'fetch_user', method: 'GET', enabled: false },
  refreshData: {
    enabled: false
  },
});

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  store,
  template: '<App/>',
  components: { App }
})
