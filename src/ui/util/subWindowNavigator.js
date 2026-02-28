import { isElectron } from '../../platform';

export function getSubWindowQuery(vm) {
    return vm.subWindowQuery || (vm.$route ? vm.$route.query : {}) || {};
}

export function isInAppSubWindow(vm) {
    const query = getSubWindowQuery(vm);
    return String(query._inAppSubWindow || '') === '1';
}

export function openInAppSubWindow(vm, route, query = {}) {
    if (isElectron()) {
        vm.$router.push({
            path: route,
            query,
        });
        return;
    }
    vm.$eventBus.$emit('sub-window-open', {
        route,
        query,
    });
}

export function pushInAppSubWindow(vm, route, query = {}) {
    if (isElectron()) {
        vm.$router.push({
            path: route,
            query,
        });
        return;
    }
    vm.$eventBus.$emit('sub-window-push', {
        route,
        query,
    });
}

export function backInAppSubWindowOrRouter(vm) {
    if (isElectron()) {
        vm.$router.back();
        return;
    }
    if (isInAppSubWindow(vm)) {
        vm.$eventBus.$emit('sub-window-back');
    } else {
        vm.$router.back();
    }
}

export function closeInAppSubWindowOrWindow(vm) {
    if (isElectron()) {
        window.close();
        return;
    }
    if (isInAppSubWindow(vm)) {
        vm.$eventBus.$emit('sub-window-close');
    } else {
        vm.$router.back();
    }
}
