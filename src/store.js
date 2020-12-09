let store = {
    debug: true,
    state: {
        currentConversation: null,
        currentFriendRequest: null,
        currentGroup: null,
        currentFriend: null,

    },

    setCurrentConversation(conversation) {
        if (this.debug) {
            console.log('setCurrentConversation', this.state.currentConversation, conversation);
        }
        this.state.currentConversation = conversation;
    },

    setCurrentFriendRequest(friendRequest) {
        this.state.currentFriendRequest = friendRequest;
        this.state.currentFriend = null;
        this.state.currentGroup = null;
    },

    setCurrentFriend(friend) {
        this.state.currentFriendRequest = null;
        this.state.currentFriend = friend;
        this.state.currentGroup = null;
    },

    setCurrentGroup(group) {
        this.state.currentFriendRequest = null;
        this.state.currentFriend = null;
        this.state.currentGroup = group;
    }
}
export default store

