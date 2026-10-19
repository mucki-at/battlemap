import { type VueKonvaRef } from "vue-konva";
import type Konva from 'konva'
import { type ref } from 'vue';

export interface KonvaEvent<T> {
    evt: T;
    target: Konva.Node | null;
}

export function deref<T extends Konva.Node>(thing : ReturnType<typeof ref<VueKonvaRef<T>>>) : T | undefined
{
    return thing.value?.getNode();
}

export function keyContainer(thing : Konva.Node) : HTMLElement
{
    let cont : HTMLElement = thing.getStage()!.container();
    while (cont && (!cont.classList.contains("konvajs-content")))
    {
        cont = cont.children[0] as HTMLElement;
    }
    return cont;
}

export function uid() : string
{
    return Math.random().toString(36).substring(2, 9);
}