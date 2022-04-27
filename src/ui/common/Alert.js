import AlertView from "./AlertView.vue";

export default {
    install(Vue) {
        Vue.prototype.$alert = function (options) {
            let beforeOpen = () => {
                console.log('Opening...')
            };
            let beforeClose = (event) => {
                // What a gamble... 50% chance to cancel closing
                if (!event.params) {
                    return;
                }
                if (event.params.confirm) {
                    options.confirmCallback && options.confirmCallback();
                } else {
                    options.cancelCallback && options.cancelCallback();
                }
            };
            let closed = (event) => {
                console.log('Close...', event)
            };
            this.$modal.show(
                AlertView,
                {
                    title: options.title,
                    content: options.content,
                    cancelText: options.cancelText,
                    confirmText: options.confirmText,
                },
                {
                    name: 'alert-modal',
                    clickToClose: true,
                    adaptive: true,
                    width: 260,
                    height: 200,
                    borderRadius: 10,
                }, {
                    'before-open': beforeOpen,
                    'before-close': beforeClose,
                    'closed': closed,
                })
        };
    }
}
