<template>
  <div>
    <md-card class="hello" v-if="loaded">
      <md-card-header>
        <div class="md-title">My Things</div>
      </md-card-header>
      <md-card-content>
        <md-table>
          <md-table-header>
            <md-table-row>
              <md-table-head>Thing</md-table-head>
              <md-table-head>Endpoint</md-table-head>
              <md-table-head md-numeric>Number of messages</md-table-head>
            </md-table-row>
          </md-table-header>

          <md-table-body>
            <md-table-row v-for="(thing, index) in $store.getters.getThings" :key="index">
              <md-table-cell>{{thing.thingId}}</md-table-cell>
              <md-table-cell>{{getEndpoint(thing.thingId)}}</md-table-cell>
              <md-table-cell>{{thing.numMessages}}</md-table-cell>
            </md-table-row>
          </md-table-body>
        </md-table>
      </md-card-content>
    </md-card>

    <md-progress v-if="fetchStarted" md-indeterminate></md-progress>
    <md-card class="hello">
      <md-card-header>
        <div class="md-title">Get certificate</div>
      </md-card-header>

      <md-card-content>
        <p>Use your MIC internal Thing ID to download the authentication certificates needed.</p>

        <form v-on:submit.prevent="awslogin">
          <md-input-container>
            <label>Thing ID</label>
            <md-input v-model="thingId"></md-input>
          </md-input-container>
          <md-button @click="awslogin" class="md-raised">Download</md-button>
        </form>
      </md-card-content>
    </md-card>
  </div>
</template>

<script>
import config from '@/config.js'
import { MessageBus } from '@/bus/index.js'

export default {
  name: 'fetch',
  data() {
    return {
      thingId: "",
      loaded: false,
      fetchStarted: false,
      endpoint: config.coap_endpoint
    }
  },
  mounted() {
    this.$store.dispatch('FETCH_THINGS').then(() => {
      this.loaded = true
            console.log(this.$store.state)
      console.log(this.$store.state.things)
    })
  },
  methods: {
    awslogin: function() {
      this.fetchStarted = true
      this.$http.post('getcertificates', {
        thingId: this.thingId
      })
        .then(response => {
          this.fetchStarted = false
          this.$store.commit('NEW_THING', { thing: response.body.data.thing })
        })
        .catch(err => {
          MessageBus.$emit('ErrorMessage', err.toString());
          this.fetchStarted = false
        })
    },
    getEndpoint: function(id) {
      return `${this.endpoint}/${id}`
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.hello {
  margin-bottom: 25px;
}

.hello input:-webkit-autofill {
  -webkit-box-shadow: 0 0 0 30px white inset;
}

.hello input {
  width: 100%;
}

.hello form {
  margin: 25px auto;
}
</style>

