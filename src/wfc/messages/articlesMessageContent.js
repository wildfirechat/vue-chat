import MessageContent from "./messageContent";
import MessageContentType from "./messageContentType";
import wfc from "../client/wfc";
import LinkMessageContent from "./linkMessageContent";

export default class ArticlesMessageContent extends MessageContent {
    topArticle;
    subArticles;

    constructor() {
        super(MessageContentType.Articles);
    }

    digest(message) {
        return this.topArticle.title;
    }

    encode() {
        let payload = super.encode();
        let obj = {
            top: this.topArticle.toJson(),
        }
        if (this.subArticles) {
            obj['subArticles'] = this.subArticles.map(article => article.toJson());
        }
        payload.binaryContent = wfc.utf8_to_b64(JSON.stringify(obj));

        return payload;
    }

    decode(payload) {
        super.decode(payload);
        let obj = JSON.parse(wfc.b64_to_utf8(payload.binaryContent));
        this.topArticle = new Article();
        this.topArticle.fromJson(obj.top);
        if (obj.subArticles) {
            this.subArticles = [];
            obj.subArticles.forEach(article => {
                let tmp = new Article();
                tmp.fromJson(article);
                this.subArticles.push(tmp);
            })
        }
    }

    toLinkMessageContent() {
        let contents = [];
        contents.push(this.topArticle.toLinkMessageContent())
        if (this.subArticles) {
            this.subArticles.forEach(article => {
                contents.push(article.toLinkMessageContent())
            })
        }
        return contents;
    }
}

class Article {
    articleId;
    cover;
    title;
    digest;
    url;
    readReport;

    toJson() {
        let obj = {
            id: this.articleId,
            cover: this.cover,
            title: this.title,
            url: this.url,
            digest: this.digest,
            rr: this.readReport
        }
        return obj;
    }

    fromJson(obj) {
        this.articleId = obj.id;
        this.cover = obj.cover;
        this.title = obj.title;
        this.digest = obj.digest;
        this.url = obj.url;
        this.readReport = obj.rr;
    }

    toLinkMessageContent() {
        let content = new LinkMessageContent();
        content.url = this.url;
        content.title = this.title;
        content.contentDigest = this.digest;
        content.thumbnail = this.cover;

        return content;
    }

}
