import MessageContentType from "./messageContentType";
import MessageContent from './messageContent'
import wfc from "../client/wfc";
import CollectionEntry from "../model/collectionEntry";

export default class CollectionMessageContent extends MessageContent {
    collectionId;
    groupId;
    creatorId;
    title;
    desc;
    template;
    expireType;
    expireAt;
    maxParticipants;
    status;
    entries;
    createdAt;
    updatedAt;

    constructor() {
        super(MessageContentType.Collection);
        this.entries = [];
    }

    digest() {
        if (this.title && this.title.length > 0) {
            return "[接龙] " + this.title;
        }
        return "[接龙]";
    }

    encode() {
        let payload = super.encode();
        payload.searchableContent = this.title;

        let obj = {
            collectionId: this.collectionId,
            groupId: this.groupId,
            creatorId: this.creatorId,
            desc: this.desc,
            template: this.template,
            expireType: this.expireType,
            expireAt: this.expireAt,
            maxParticipants: this.maxParticipants,
            status: this.status,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            entries: this.entries
        };
        payload.binaryContent = wfc.utf8_to_b64(JSON.stringify(obj));
        return payload;
    }

    decode(payload) {
        super.decode(payload);
        this.title = payload.searchableContent;
        if (payload.binaryContent) {
            try {
                let str = wfc.b64_to_utf8(payload.binaryContent);
                let obj = JSON.parse(str);
                this.collectionId = obj.collectionId;
                this.groupId = obj.groupId;
                this.creatorId = obj.creatorId;
                this.desc = obj.desc;
                this.template = obj.template;
                this.expireType = obj.expireType;
                this.expireAt = obj.expireAt;
                this.maxParticipants = obj.maxParticipants;
                this.status = obj.status;
                this.createdAt = obj.createdAt;
                this.updatedAt = obj.updatedAt;

                this.entries = [];
                if (obj.entries && Array.isArray(obj.entries)) {
                    obj.entries.forEach(e => {
                        let entry = new CollectionEntry();
                        Object.assign(entry, e);
                        this.entries.push(entry);
                    });
                }
            } catch (e) {
                console.error("Decode collection message error", e);
            }
        }
    }
}
