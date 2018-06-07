import Vue from 'vue'
import Vuex from 'vuex'
import VueResource from 'vue-resource'
import config from '../config.js'

Vue.use(VueResource)
Vue.http.options.root = config.base_url
Vue.use(Vuex)

const state = {
    things: []
}

const mutations = {
    SAVE_THINGS_STATE: function(state, {things}){
        state.things = things
    },
    
    NEW_THING: function(state, {thing}){
        /* Avoid duplicate */
        for(let i = 0; i < state.things.length; i++){
            if(state.things[i].thingId == thing.thingId){
                return
            }
        }

        state.things.push(thing)
    }
}

const actions = {
    FETCH_THINGS: function(context){
        return Vue.http.get('fetch_things')
            .then(response => {
                console.log(response)

                context.commit('SAVE_THINGS_STATE', {things: response.body.data.things})

                Promise.resolve()
            })
            .catch(error => {
                Promise.reject(error)
            })
    }
}

const getters = {
    getThings: function(state){
        return state.things
    }
}

export default new Vuex.Store({
    state,
    getters,
    actions,
    mutations
})