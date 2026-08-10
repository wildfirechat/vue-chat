import {isElectron} from "../../platform";
import Config from "../../config";

let storage = !isElectron() ? (Config.CLIENT_ID_STRATEGY === 1 ? sessionStorage : Config.CLIENT_ID_STRATEGY === 2 ? localStorage : new Map()) : localStorage;

export function removeItem(key) {
    if (storage) {
        storage.removeItem ? storage.removeItem(key): storage.delete(key)
    }

}

export function getItem(key) {
    if (storage) {
        return storage.getItem ? storage.getItem(key) : storage.get(key);
    }
}

export function setItem(key, value) {
    if (storage) {
        storage.setItem ? storage.setItem(key, value) : storage.set(key, value);
    }
}

export function clear() {
    if (storage) {
        storage.clear();
    }
}
