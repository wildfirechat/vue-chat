let store = {
    debug: true,
    state: {
        name: '',
        currentConversation: null,
    },

    setName(newName) {
        if (this.debug) {
            console.log('setName', this.name, newName);
        }
        this.state.name = newName;
    },

    setCurrentConversation(conversation) {
        if (this.debug) {
            console.log('setCurrentConversation', this.state.currentConversation, conversation);
        }
        this.state.currentConversation = conversation;
    },
}
export default store

