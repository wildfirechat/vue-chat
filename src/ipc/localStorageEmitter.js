import LocalStorageEvent from "./localStorageEvent";

class LocalStorageEmitter {

    namespace = 'wfc-'

    /**
     *
     * @type {Map<string, any>}
     */
    subscriptions;

    /**
     *
     * @type {Map<string, any>}
     */
    handles;

    /**
     *
     * @type {Map<string, any>}
     */
    invokes;

    constructor() {
        window.addEventListener('storage', ev => {
            let key = ev.key;
            if (!key.startsWith(this.namespace + '$') || !key.endsWith('$')) {
                return;
            }
            let value;
            try {
                value = JSON.parse(ev.newValue);
            } catch (e) {
                value = null;
            }
            if (value === null) {
                console.log('localStorageEmitter ignore null', key)
                return;
            }
            this.subscriptions.forEach((subscription, k) => {
                if (k === key) {
                    subscription.listener(new LocalStorageEvent(this), value.args);
                    if (subscription.once) {
                        this.subscriptions.delete(k);
                    }
                    localStorage.removeItem(k)
                }
            });

            this.handles.forEach((handle, k) => {
                if (key.indexOf('$$') === -1 || key.indexOf('$r$') > -1) {
                    return;
                }
                let index = key.indexOf('$$');
                let invokeKey = key.substr(0, index + 1)
                if (k === invokeKey) {
                    let invokeId = value.invokeId;
                    let returnValue = handle.listener(new LocalStorageEvent(this), value.args);
                    let invokeReturnValueKey = k + '$' + invokeId + '$' + 'r' + '$';
                    if (returnValue instanceof Promise) {
                        returnValue.then(v => {
                            let r = {r: v}
                            localStorage.setItem(invokeReturnValueKey, JSON.stringify(r));
                        }).catch(reason => {
                            console.log('handle failed', reason)
                        });
                        if (handle.once) {
                            this.handles.delete(k)
                        }

                    } else {
                        let r = {r: returnValue}
                        console.log('handle res', returnValue)
                        localStorage.setItem(invokeReturnValueKey, JSON.stringify(r));
                        if (handle.once) {
                            this.handles.delete(k)
                        }
                    }
                    localStorage.removeItem(invokeKey)
                }
            });

            this.invokes.forEach((invoke, k) => {
                let invokeReturnValueKey = k + 'r' + '$';
                if (invokeReturnValueKey === key) {
                    invoke.callback(value.r);
                    this.invokes.delete(key)

                    localStorage.removeItem(invokeReturnValueKey)
                    localStorage.removeItem(k)
                }
            })

        })
        this.subscriptions = new Map();
        this.handles = new Map();
        this.invokes = new Map();
    }

    /**
     * 订阅通知
     * @param {string} channel
     * @param {function(LocalStorageEvent, args)} listener
     */
    on(channel, listener) {
        this.subscriptions.set(this.namespace + '$' + channel + '$', {once: false, listener: listener});
    }

    /**
     * 一次性订阅
     * @param {string} channel
     * @param {function(LocalStorageEvent, args)} listener
     */
    once(channel, listener) {
        this.subscriptions.set(this.namespace + '$' + channel + '$', {once: true, listener: listener});
    }

    /**
     * 发布通知
     * @param {string} channel
     * @param {any} args
     */
    send(channel, args) {
        let tmp = {args: args}
        localStorage.setItem(this.namespace + '$' + channel + '$', JSON.stringify(tmp))
    }

    //
    // sendSync(channel, args) {
    //     this.send(channel, args);
    // }

    /**
     * 处理远程调用
     * @param {string} channel
     * @param {function (any)} listener
     */
    handle(channel, listener) {
        this.handles.set(this.namespace + '$' + channel + '$', {once: false, listener: listener});
    }

    /**
     * 一次性处理远程调用
     * @param {string} channel
     * @param {function (any)} listener
     */
    handleOnce(channel, listener) {
        this.handles.set(this.namespace + '$' + channel + '$', {once: true, listener: listener});
    }

    /**
     * 执行远程调用，调用结果通过callback回调
     * @param {string} channel
     * @param {any} args
     * @param {function (any)} callback
     */
    invoke(channel, args, callback) {
        let invokeId = new Date().getTime() + '-' + Math.ceil(Math.random() * 10000);
        this.invokes.set(this.namespace + '$' + channel + '$$' + invokeId + '$', {
            invokeId: invokeId,
            callback: callback
        });
        let tmp = {
            invokeId: invokeId,
            args: args
        }
        localStorage.setItem(this.namespace + '$' + channel + '$$' + invokeId + '$', JSON.stringify(tmp))
    }

    /**
     * 执行远程调用，调用结果通过promise返回
     * @param channel
     * @param args
     * @return {Promise<any>}
     */
    promiseInvoke(channel, args) {
        return new Promise(((resolve, reject) => {
            this.invoke(channel, args, v => {
                resolve(v);
            });
        }))
    }

    _dump() {
        console.log('dump localStorageEmitter')
        this.subscriptions.forEach((value, key) => {
            console.log(key, value)
        })
        this.handles.forEach((value, key) => {
            console.log(key, value)
        })
        this.invokes.forEach((value, key) => {
            console.log(key, value)
        })
    }
}

let self = new LocalStorageEmitter();
export default self;
