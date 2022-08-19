<template>
    <section class="articles-container">
        <div v-if="!message.messageContent.subArticles || !message.messageContent.subArticles.length" class="top-article" @click="openArticle(message.messageContent.topArticle)">
            <img :src="message.messageContent.topArticle.cover">
            <p>{{
                    message.messageContent.topArticle.title
                }}</p>
        </div>
        <div v-else class="top-article sub" @click="openArticle(message.messageContent.topArticle)">
            <img :src="message.messageContent.topArticle.cover">
            <p>{{
                    message.messageContent.topArticle.title
                }}</p>
        </div>
        <template v-if="message.messageContent.subArticles">
            <div v-for="(sa, si) in message.messageContent.subArticles" :key="si" class="sub-article" @click="openArticle(message.messageContent.topArticle)">
                <p>{{ sa.title }}</p>
                <img :src="sa.cover">
            </div>
        </template>
    </section>
</template>

<script>
import Message from "../../../../wfc/messages/message";

export default {
    name: "ArticlesMessageContentView",
    props: {
        message: {
            type: Message,
            required: true,
        }
    },
    methods: {
        openArticle(article) {
            open(article.url);
        }
    }
}
</script>

<style scoped>

.articles-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin: 10px 0;
    justify-content: center;
}

.top-article {
    position: relative;
    width: 400px;
    background: white;
    padding: 10px;
    border-radius: 5px;
    margin: 5px 0;
}

.top-article:hover {
    background: #e0e0e0e5;
}

.top-article img {
    width: 100%;
    height: 150px;
}

.top-article p {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    text-overflow: ellipsis;
    overflow: hidden;
}

.top-article.sub {
    margin: 0;
    border-bottom-right-radius: 0;
    border-bottom-left-radius: 0;
}

.top-article.sub p {
    position: absolute;
    bottom: 0;
    left: 0;
    color: white;
    padding: 0 20px;
    transform: translateY(-50%);
}

.sub-article {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    position: relative;
    width: 400px;
    height: 80px;
    background: white;
    padding: 0 10px;
}

.sub-article:hover {
    background: #e0e0e0e5;
}

.articles-container .sub-article:last-of-type {
    border-bottom-right-radius: 5px;
    border-bottom-left-radius: 5px;
    border-bottom: none;
}

.sub-article p {
    flex: 1;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    text-overflow: ellipsis;
    overflow: hidden;
}

.sub-article img {
    width: 60px;
    height: 60px;
    margin-left: 10px;
}

</style>
