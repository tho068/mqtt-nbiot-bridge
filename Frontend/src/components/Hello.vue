<template>
    <div class="hello">
        <div v-if="!$auth.check()">
            <h3>Velkommen til nbiot proxy</h3>
            <p>Logg inn for å administrere proxy</p>
        </div>

        <div v-if="$auth.check()">
            <h3>Velkommen til nbiot proxy</h3>
            <p>Klikk på sertifikater for å importere dem fra MIC.</p>
        </div>
    </div>
</template>

<script>
export default {
    name: 'hello',
    data() {
        return {

        }
    }
}
</script>

<style scoped>
.hello {
    background: #fff;
    padding: 25px;
    border-top: 2px solid #00ace7;
    box-shadow: 1px 3px 3px #ccc;
}

.hello h3 {
    margin-top: 0;
}
</style>
