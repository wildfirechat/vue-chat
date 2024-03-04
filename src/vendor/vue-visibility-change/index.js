const _id = Symbol('visibility-change-id');

let hidden, visibilityChange, lastId = -1;
/* istanbul ignore else */
if (typeof document.hidden !== "undefined") { // Opera 12.10 and Firefox 18 and later support
    hidden = "hidden";
    visibilityChange = "visibilitychange";
} else if (typeof document.msHidden !== "undefined") {
    hidden = "msHidden";
    visibilityChange = "msvisibilitychange";
} else if (typeof document.webkitHidden !== "undefined") {
    hidden = "webkitHidden";
    visibilityChange = "webkitvisibilitychange";
} else if (typeof document.mozHidden !== "undefined") {
    hidden = "mozHidden";
    visibilityChange = "mozvisibilitychange";
}

// 缓存 visibility change 触发时的回调函数
const _callbacks = {};
const _doc = document;
let _init;

/**
 * Listener for `visibilitychange` event.
 * @param {Event} event event object
 */
function _change(event) {
    for ( var i in _callbacks ) {
        _callbacks[i].call(_doc, event, _doc[hidden]);
    }
}

/**
 * Set listener for `visibilitychange` event.
 */
function _listen() {
    /* istanbul ignore if */
    if (_init) {
        return;
    }

    var listener = function () {
        _change.apply(visibility, arguments);
    };
    document.addEventListener(visibilityChange, listener);

    _init = true;
}

const visibility = {

    /**
     * 当可见性发生变化时调用回调。
     * 事件监听会在第一个回调绑定时才注册，这是一个延时行为
     *
     * @param {Function (event, hidden)} callback 回调函数
     *  - {Event} event 原始事件对象
     *  - {Boolean} hidden 表示当前页面可见性，true 表示可见
     */
    change(callback) {
        if (!visibility.isSupported()) {
            return false;
        }
        lastId += 1;
        var number = lastId;
        _callbacks[number] = callback;
        _listen();
        return number;
    },

    /**
     * Remove `change` listener by it ID.
     *
     * @param {Number} id 回调标识
     *
     * @example
     * var id = visibility.change(function(e, state) {
     *     firstChangeCallback();
     *     visibility.unbind(id);
     * });
     */
    unbind(id) {
        delete _callbacks[id];
    },

    /**
     * Return true if browser support Page Visibility API.
     */
    isSupported() {
        return hidden !== undefined;
    },

    /**
     * Return true if page now isn’t visible to user.
     */
    hidden() {
        return _doc[hidden];
    }
};

visibility.install = function(app) {

    app.directive('visibility-change', {
        beforeMount(el, { value }) {
            if (typeof value === 'function') {
                el[_id] = visibility.change((evt, hidden) => {
                    value(evt, hidden);
                });
            } else {
                console.error('You need bind a callback function for v-visibility-change');
            }
        },
        unmounted(el) {
            visibility.unbind(el[_id]);
        }
    });
}

export default visibility;