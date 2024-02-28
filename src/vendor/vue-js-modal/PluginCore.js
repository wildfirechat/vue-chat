import { UNSUPPORTED_ARGUMENT_ERROR } from './utils/errors'
import { createDivInBody } from './utils'
import ModalsContainer from './components/ModalsContainer.vue'
import emitter from 'tiny-emitter/instance'
import {createVNode, render} from 'vue'

const PluginCore = (app, options = {}) => {
  const subscription = {
    $on: (...args) => emitter.on(...args),
    $once: (...args) => emitter.once(...args),
    $off: (...args) => emitter.off(...args),
    $emit: (...args) => emitter.emit(...args),
  }

  const context = {
    root: null,
    componentName: options.componentName || 'Modal'
  }

  subscription.$on('set-modal-container', container => {
    context.root.__modalContainer = container
  })

  const showStaticModal = (name, params) => {
    subscription.$emit('toggle', name, true, params)
  }

  const showDynamicModal = (
    component,
    componentProps,
    componentSlots,
    modalProps = {},
    modalEvents
  ) => {
    const container = context.root?.__modalContainer
    const defaults = options.dynamicDefaults || {}

    container?.add(
      component,
      componentProps,
      componentSlots,
      { ...defaults, ...modalProps },
      modalEvents
    )
  }

  /**
   * Creates a container for modals in the root Vue component.
   *
   * @param {Vue} parent
   * @param {Vue} app
   */
  const setDynamicModalContainer = ((parent, app) => {
    context.root = parent

    const element = createDivInBody()

    const vnode = createVNode(ModalsContainer)
    vnode.appContext = app._context
    render(vnode, element)

    // createApp({
    //   parent,
    //   render: h => h(ModalsContainer)
    // }).mount(element)
  })

  const show = (...args) => {
    const [modal] = args

    console.log('xxxxxx show', args)
    switch (typeof modal) {
      case 'string':
        showStaticModal(...args)
        break

      case 'object':
      case 'function':
        showDynamicModal(...args)
        break

      default:
        console.warn(UNSUPPORTED_ARGUMENT_ERROR, modal)
    }
  }

  const hide = (name, params) => {
    console.log('xxxxxxx hide', name, params)
    subscription.$emit('toggle', name, false, params)
  }

  const hideAll = () => {
    subscription.$emit('hide-all')
  }

  const toggle = (name, params) => {
    subscription.$emit('toggle', name, undefined, params)
  }

  return {
    context,
    subscription,
    show,
    hide,
    hideAll,
    toggle,
    setDynamicModalContainer
  }
}

export default PluginCore
