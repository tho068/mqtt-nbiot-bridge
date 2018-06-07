<template>
  <div class="login">
    <md-progress v-if="loginStarted" md-indeterminate></md-progress>
    <md-card>
      <md-card-header>
        <div class="md-title">Log in</div>
      </md-card-header>
      <md-card-content>
        <form v-on:submit.prevent="login">
          <md-input-container>
            <label>Username</label>
            <md-input v-model="username"></md-input>
          </md-input-container>
          <md-input-container>
            <label>Password</label>
            <md-input type="password" v-model="password"></md-input>
          </md-input-container>
          <md-button @click="login" class="md-raised">Logg inn</md-button>
        </form>
      </md-card-content>
    </md-card>
  </div>
</template>

<script>
import { MessageBus } from '@/bus/index.js'
export default {
  name: 'login',
  data() {
    return {
      username: '',
      password: '',
      loginStarted: false
    }
  },
  methods: {
    login: function() {
      this.loginStarted = true
      this.$auth.login({
        body: { email: this.username, password: this.password },
        rememberMe: true,
        error: function(err) {
          this.loginStarted = false
          MessageBus.$emit('ErrorMessage', err.body.message)
        }
      });
    }
  }
}
</script>

<style scoped>
.login {
  background: #fff;
  width: 50%;
  margin: 0 auto;
}
</style>
