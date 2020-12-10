let store = {
    debug: true,
    state: {
        conversation: {
            currentConversation: null,
        },

        contact: {
            currentFriendRequest: null,
            currentGroup: null,
            currentFriend: null,

            expandFriendRequestList: false,
            expandFriendList: false,
            expandGroup: false,
        },

        search: {
            show: false,
        },

        misc: {
            test: false
        },
    },

    // conversation actions
    setCurrentConversation(conversation) {
        if (this.debug) {
            console.log('setCurrentConversation', this.state.currentConversation, conversation);
        }
        this.state.conversation.currentConversation = conversation;
    },

    // contact actions
    setCurrentFriendRequest(friendRequest) {
        this.state.contact.currentFriendRequest = friendRequest;
        this.state.contact.currentFriend = null;
        this.state.contact.currentGroup = null;
    },

    setCurrentFriend(friend) {
        this.state.contact.currentFriendRequest = null;
        this.state.contact.currentFriend = friend;
        this.state.contact.currentGroup = null;
    },

    setCurrentGroup(group) {
        this.state.contact.currentFriendRequest = null;
        this.state.contact.currentFriend = null;
        this.state.contact.currentGroup = group;
    },

    toggleGroupList() {
        this.state.contact.expandGroup = !this.state.contact.expandGroup;
    },

    toggleFriendRequestList() {
        this.state.contact.expandFriendRequestList = !this.state.contact.expandFriendRequestList;
    },

    toggleFriendList() {
        this.state.contact.expandFriendList = !this.state.contact.expandFriendList;
    },

    toggleSearchView(show) {
        console.log('ts', show, this.state.search.show);
        this.state.search.show = show
    }

    // misc actions
}
export default store

