import MessageContent from "./messageContent";
import MessageContentType from "./messageContentType";
import wfc from "../client/wfc";

export default class ArticlesMessageContent extends MessageContent {
    topArticle;
    subArticles;

    constructor() {
        super(MessageContentType.Articles);
    }

    digest(message) {
        return super.digest(message);
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
            this.topArticle.forEach(article => {
                let tmp = new Article();
                tmp.fromJson(article);
                this.subArticles.push(tmp);
            })
        }
    }
}

class Article {
    articleId;
    cover;
    title;
    url;
    readReport;

    toJson() {
        let obj = {
            id: this.articleId,
            cover: this.cover,
            title: this.title,
            url: this.url,
            rr: this.readReport
        }
        return obj;
    }

    fromJson(obj) {
        this.articleId = obj.id;
        this.cover = obj.cover;
        this.title = obj.title;
        this.url = obj.url;
        this.readReport = obj.rr;
    }

}
