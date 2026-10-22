<template>
    <v-menu v-model="showMenu" location-strategy="connected" :target="tokenMenuPos">
        <v-list>
            <v-list-item>
                <v-label>Size</v-label>
                <v-btn-group>
                    <v-btn @click="token.size=1">1</v-btn> 
                    <v-btn @click="token.size=2">2</v-btn> 
                    <v-btn @click="token.size=3">3</v-btn> 
                </v-btn-group>
            </v-list-item>
            <v-list-item>
                <v-btn-group>
                    <v-btn v-for="item in settings.palette" :key="item"
                        style="margin: 0px" 
                        size="x-small"
                        :color="item"
                        @click="token.color=item"
                    />
                </v-btn-group>
            </v-list-item>

        </v-list>
    </v-menu>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import * as Tokens from '@/tokens'
import { useSettings } from '@/settings';

const settings = useSettings();

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