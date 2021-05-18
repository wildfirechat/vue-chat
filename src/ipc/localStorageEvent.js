export default class LocalStorageEvent {
    constructor(sender) {
        this.sender = sender;
    }

    sender;

    // returnValue;

    reply(channel, args) {
        this.sender.send(channel, args);
    }
}
