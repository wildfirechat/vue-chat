export default class Mention {
    start;
    end;
    isMentionAll;
    uid;

    constructor(start, end, uid, isMentionAll) {
        this.start = start;
        this.end = end;
        this.uid = uid;
        this.isMentionAll = isMentionAll;
    }
}
