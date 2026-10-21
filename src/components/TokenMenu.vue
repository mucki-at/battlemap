<template>
    <v-menu v-model="showMenu" location-strategy="connected" :target="tokenMenuPos">
        <v-list>
            <v-list-item>
                <v-text-field v-model="token.name" label="Name"/>
            </v-list-item>
            <v-list-item>
                <v-btn-group label="Size">
                    <v-btn @click="token.size=1">1</v-btn> 
                    <v-btn @click="token.size=2">2</v-btn> 
                    <v-btn @click="token.size=3">3</v-btn> 
                </v-btn-group>
            </v-list-item>
        </v-list>
    </v-menu>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import * as Tokens from '@/tokens'

const showMenu = ref(false);
const token = defineModel<Tokens.Token>({ required: true});
const tokenMenuPos = ref([0,0]);

function showAt(x:number, y:number)
{
    tokenMenuPos.value= [x,y];
    showMenu.value=true;
}

defineExpose({
  showAt
})

</script>