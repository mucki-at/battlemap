<template>
    <v-dialog v-model="isOpen" max-width="500" :persistent="!closable">
        <v-card>
            <v-form validate-on="input" ref="form">
                <v-card-title>Settings</v-card-title>

                <v-card-text>
                    <v-text-field
                        v-model="settings.username"
                        :rules="usernameRules"
                        label="Your name and color"
                    >
                        <template v-slot:prepend-inner>
                            <v-icon-btn
                                id="menu-activator"
                                :color="settings.usercolor"
                                variant="text"
                                icon="mdi-account"
                            />
                            <v-menu activator="#menu-activator">
                                <v-color-picker
                                    v-model="settings.usercolor"
                                    hide-inputs
                                    mode="rgb"
                                    landscape
                                    title="User Color"
                                >
                                </v-color-picker>
                            </v-menu>
                        </template>
                    </v-text-field>

                    <v-text-field
                        v-model="settings.roomname"
                        :rules="roomnameRules"
                        label="Room name"
                    />
                </v-card-text>

                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn
                        :disabled="!closable"
                        color="primary"
                        text="Close"
                        @click="closeDialog"
                    />
                </v-card-actions>
            </v-form>
        </v-card>
    </v-dialog>
</template>

<script lang="ts" setup>
import { useSettings } from '@/settings.ts';
import { ref, computed, defineModel } from 'vue';
import { VForm } from 'vuetify/components';

const settings = useSettings();
const isOpen = defineModel<boolean>({ required: true });

const form = ref<VForm>();
const closable = computed<boolean>(
    () => form.value?.isValid === true && settings.isValid()
);

const usernameRules = [
    (value: string) => {
        if (value?.length >= 3) return true;
        return 'Username must be at least 3 characters.';
    },
];

const roomnameRules = [
    (value: string) => {
        if (value?.length >= 6) return true;
        return 'Room name must be at least 6 characters.';
    },
];

function closeDialog() {
    isOpen.value = false;
}
</script>
