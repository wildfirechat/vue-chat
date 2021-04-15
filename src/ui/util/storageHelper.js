import {isElectron} from "../../platform";
import Config from "@/config";

let storage = !isElectron() ? (Config.CLIENT_ID_STRATEGY === 1 ? sessionStorage : Config.CLIENT_ID_STRATEGY === 2 ? localStorage : null) : localStorage;

export function removeItem(key) {
    if (storage) {
        storage.removeItem(key)
    }

}

export function getItem(key) {
    if (storage) {
        return storage.getItem(key);
    }
}

export function setItem(key, value) {
    if (storage) {
        storage.setItem(key, value);
    }
}

export function clear() {
    if (storage) {
        storage.clear();
    }
}
