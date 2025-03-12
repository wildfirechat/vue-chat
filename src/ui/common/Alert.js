import AlertView from "./AlertView.vue";

export default {
    install(app) {
        app.config.globalProperties.$alert = function (options) {
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
            let showIcon = options.showIcon !== undefined;
            this.$modal.show(
                AlertView,
                {
                    name: options.name ? options.name : 'alert-modal',
                    showIcon: showIcon,
                    title: options.title,
                    content: options.content,
                    cancelText: options.cancelText,
                    confirmText: options.confirmText,
                },
                null,
                {
                    name: options.name ? options.name : 'alert-modal',
                    clickToClose: true,
                    adaptive: true,
                    width: 260,
                    height: showIcon ? 200 : 150,
                    borderRadius: 10,
                }, {
                    'before-open': beforeOpen,
                    'before-close': beforeClose,
                    'closed': closed,
                })
        };
    }
}
