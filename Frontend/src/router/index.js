import Vue from 'vue'
import Router from 'vue-router'
import Fetch from '@/components/Fetch'
import Login from '@/components/Login'
import Hello from '@/components/Hello'

Vue.use(Router)

export default new Router({
  mode: 'history',
  base: '/coap',
  routes: [
    {
      path: '/',
      name: 'Fetch',
      component: Fetch,
      meta: {auth: true}
    },
    {
      path: '/login',
      name: 'Login',
      component: Login
    },
  ]
})
