<template>
  <div id="app">
    <md-toolbar class="header">
      <md-button class="md-icon-button" @click="toggleLeftSidenav">
        <md-icon>menu</md-icon>
      </md-button>

      <h2 class="md-title">
        <router-link :to="{name: 'Fetch'}"><img src="static/StartIoTLogo.png"></router-link>
      </h2>
    </md-toolbar>

    <md-sidenav class="md-left" ref="leftSidenav" @open="open('Left')" @close="close('Left')">
      <md-toolbar class="md-large">
        <div class="md-toolbar-container">
          <h3 class="md-title">Menu</h3>
        </div>
      </md-toolbar>

      <md-list>
        <md-list-item v-if="$auth.check()">
          <router-link :to="{name: 'Fetch'}">Sertifikater</router-link>
        </md-list-item>
        <md-list-item v-if="!$auth.check()">
          <router-link :to="{name: 'Login'}">Logg inn</router-link>
        </md-list-item>
        <md-list-item v-if="$auth.check()">
          <a v-on:click="logOut">Logg ut</a>
        </md-list-item>
      </md-list>
    </md-sidenav>

    <div class="wrapper">
      <router-view></router-view>
    </div>

    <md-snackbar md-position="bottom center" ref="snackbar" :md-duration="3000">
      <span>{{message}}</span>
    </md-snackbar>
  </div>
</template>

<script>

import { MessageBus } from '@/bus';

export default {
  name: 'app',
  data() {
    return {
      message: "",
    }
  },
  mounted() {
    MessageBus.$on("ErrorMessage", message => {
      this.message = message
      this.$refs.snackbar.open();
    })
  },
  methods: {
    logOut() {
      this.$auth.logout({
        makeRequest: false,
        params: {},
        success: function() { },
        error: function() { },
        redirect: '/login',
      });
    },
    toggleLeftSidenav() {
      this.$refs.leftSidenav.toggle();
    },
    toggleRightSidenav() {
      this.$refs.rightSidenav.toggle();
    },
    closeRightSidenav() {
      this.$refs.rightSidenav.close();
    },
    open(ref) {
      console.log('Opened: ' + ref);
    },
    close(ref) {
      console.log('Closed: ' + ref);
    }
  }
}
</script>

<style>
body {
  margin: 0;
  padding: 0;
  background: #f5f5f5 !important;
}

.wrapper {
  margin-left: 25px;
  margin-right: 25px;
  margin-top: 25px;
}

#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.header {
  background: #fff !important;
}

.header img {
  height: 50px;
}

.header .md-icon {
  color: #000 !important;
}
</style>
