<template>
    <v-layer :config="{ listening: false, x: -2500, y: -2500 }">
        <v-line v-for="i in 100" :key="i" :config="{
            points: [0, i * 50, 5000, i * 50],
            stroke: '#ddd',
            strokeWidth: 1
        }" />
        <v-line v-for="i in 100" :key="i" :config="{
            points: [i * 50, 0, i * 50, 5000],
            stroke: '#ddd',
            strokeWidth: 1
        }" />
    </v-layer>
</template>