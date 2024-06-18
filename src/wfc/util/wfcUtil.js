export default class WfcUtil {
    static isExternal(target = '') {
        if (target.indexOf('@') >= 0) {
            return target.split('@').length === 2;
        }
        return false;
    }

    static getExternalDomainId(target) {
        if (target.indexOf('@') >= 0) {
            let cs = target.split('@');
            if (cs.length === 2) {
                return cs[1];
            }
        }
        return ''
    }

    buildExternalDisplayNameP(name) {

    }
}