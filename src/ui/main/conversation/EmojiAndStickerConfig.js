import {Category, Emoji, emojisDefault} from "@imndx/v-emoji-picker";

export function config() {
    // 动态表情的category约定以Sticker-开头
    let customStickers = [
        new Emoji('https://static.wildfirechat.net/sticker/b/B%E6%95%B0%EF%BC%8C%E6%B2%A1%E6%9C%89%EF%BC%8C%E6%88%91%E5%BE%88%E8%86%A8%E8%83%80.png', 'Sticker-b', ['sticker']),
        new Emoji('https://static.wildfirechat.net/sticker/b/%E6%9C%89%E6%B2%A1%E6%9C%89B%E6%95%B0%EF%BC%8C%E4%BD%A0%E5%BF%83%E9%87%8C%E6%B2%A1%E6%9C%89%E7%82%B9B%E6%95%B0%E5%90%97.png', 'Sticker-b', ['sticker']),
        new Emoji('https://static.wildfirechat.net/sticker/b/%E5%BF%83%E9%87%8C%E6%B2%A1%E6%9C%89%E4%B8%80%E7%82%B9B%E6%95%B0%E5%90%97.jpg', 'Sticker-b', ['sticker']),
        new Emoji('https://static.wildfirechat.net/sticker/b/%E5%A7%94%E5%B1%88%E5%9C%B0%E5%93%AD%E4%BA%86%E8%B5%B7%E6%9D%A5.jpg', 'Sticker-b', ['sticker']),
        new Emoji('https://static.wildfirechat.net/sticker/b/%E5%BF%83%E9%87%8C%E9%9A%BE%E9%81%93%E6%B2%A1%E6%9C%89%E4%B8%80%E7%82%B9B%E6%95%B0%E5%90%97.jpg', 'Sticker-b', ['sticker']),
        new Emoji('https://static.wildfirechat.net/sticker/b/%E8%87%AA%E5%B7%B1%E5%BF%83%E9%87%8C%E6%B2%A1%E6%9C%89%E4%B8%80%E7%82%B9B%E6%95%B0%E5%90%97.jpg', 'Sticker-b', ['sticker']),
        new Emoji('https://static.wildfirechat.net/sticker/b/%E4%BD%A0%E4%BB%A5%E5%89%8D%E4%B8%8D%E6%98%AF%E8%BF%99%E6%A0%B7%E5%AD%90%E7%9A%84.jpg', 'Sticker-b', ['sticker']),
        new Emoji('https://static.wildfirechat.net/sticker/b/%E5%AE%9D%E5%AE%9D%E5%A7%94%E5%B1%88%EF%BC%8C%E4%BD%86%E5%AE%9D%E5%AE%9D%E4%B8%8D%E8%AF%B4.jpg', 'Sticker-b', ['sticker']),
        new Emoji('https://static.wildfirechat.net/sticker/b/%E5%AE%9D%E5%AE%9D%E5%BF%83%E9%87%8C%E8%8B%A6%EF%BC%8C%E4%BD%86%E5%AE%9D%E5%AE%9D%E8%AF%B4%E4%BA%86.png', 'Sticker-b', ['sticker']),
        new Emoji('https://static.wildfirechat.net/sticker/b/%E5%AE%9D%E5%AE%9D%E5%A7%94%E5%B1%88%EF%BC%8C%E5%AE%9D%E5%AE%9D%E5%BF%83%E9%87%8C%E8%8B%A6%EF%BC%8C%E5%AE%9D%E5%AE%9D%E4%B8%8D%E8%AF%B4.jpg', 'Sticker-b', ['sticker']),
        new Emoji('https://static.wildfirechat.net/sticker/b/%E6%9C%AC%E5%AE%9D%E5%AE%9D%E4%B8%8D%E5%BC%80%E5%BF%83%E4%BA%86%EF%BC%8C%E6%9C%AC%E5%AE%9D%E5%AE%9D%E6%9C%89%E5%B0%8F%E6%83%85%E7%BB%AA%E4%BA%86.jpeg', 'Sticker-b', ['sticker']),
        new Emoji('https://static.wildfirechat.net/sticker/p/666.jpg', 'Sticker-p', ['sticker']),
        new Emoji('https://static.wildfirechat.net/sticker/p/Android%E5%9F%B9%E8%AE%AD.png', 'Sticker-p', ['sticker']),
        new Emoji('https://static.wildfirechat.net/sticker/p/Android%E5%BC%80%E5%8F%91%E6%B2%A1%E4%BA%BA%E8%A6%81%E4%BA%86.jpg', 'Sticker-p', ['sticker']),
        new Emoji('https://static.wildfirechat.net/sticker/p/MySQL%E4%BB%8E%E5%88%A0%E5%BA%93%E5%88%B0%E8%B7%91%E8%B7%AF.gif', 'Sticker-p', ['sticker']),
        new Emoji('https://static.wildfirechat.net/sticker/p/java%E5%9F%B9%E8%AE%AD.jpg', 'Sticker-p', ['sticker']),
        new Emoji('https://static.wildfirechat.net/sticker/p/%E8%B0%81TM%E6%94%B9%E4%BA%86%E6%88%91%E4%BB%A3%E7%A0%81.jpg', 'Sticker-p', ['sticker']),
        new Emoji('https://static.wildfirechat.net/sticker/p/%E5%8A%A0%E7%8F%AD.gif', 'Sticker-p', ['sticker']),
        new Emoji('https://static.wildfirechat.net/sticker/p/%E4%B8%87%E8%83%BD.jpg', 'Sticker-p', ['sticker']),
        new Emoji('https://static.wildfirechat.net/sticker/p/%E5%85%A8%E8%83%BD.jpg', 'Sticker-p', ['sticker']),
        new Emoji('https://static.wildfirechat.net/sticker/p/%E6%89%93%E6%9D%82.jpg', 'Sticker-p', ['sticker']),
        new Emoji('https://static.wildfirechat.net/sticker/p/%E7%BC%96%E7%A8%8B5%E5%88%86%E9%92%9F%EF%BC%8C%E6%89%AF%E6%B7%A12%E5%B0%8F%E6%97%B6.png', 'Sticker-p', ['sticker']),
        new Emoji('https://static.wildfirechat.net/sticker/p/%E5%86%99%E4%B8%AAJ8%E4%BB%A3%E7%A0%81%EF%BC%8C%E8%80%81%E5%AD%90%E4%B8%8D%E5%B9%B2%E4%BA%86.gif', 'Sticker-p', ['sticker']),
        new Emoji('https://static.wildfirechat.net/sticker/p/%E5%9E%83%E5%9C%BEQQ%EF%BC%8C%E6%AF%81%E6%88%91%E9%9D%92%E6%98%A5%EF%BC%8C%E9%A2%93%E6%88%91%E7%B2%BE%E7%A5%9E%EF%BC%8C%E8%80%97%E6%88%91%E9%92%B1%E8%B4%A2.gif', 'Sticker-p', ['sticker']),
        new Emoji('https://static.wildfirechat.net/sticker/p/%E6%95%B2%E4%BB%A3%E7%A0%81.gif', 'Sticker-p', ['sticker']),
        new Emoji('https://static.wildfirechat.net/sticker/p/%E4%BB%A3%E7%A0%81%E7%8B%97.jpg', 'Sticker-p', ['sticker']),
        new Emoji('https://static.wildfirechat.net/sticker/p/%E5%86%BB%E6%88%90%E7%8B%97.jpg', 'Sticker-p', ['sticker']),
        new Emoji('https://static.wildfirechat.net/sticker/p/%E7%94%B5%E8%84%91%E7%8B%97.jpg', 'Sticker-p', ['sticker']),
        new Emoji('https://static.wildfirechat.net/sticker/p/%E5%92%B1%E5%96%9D%E6%9D%AFJava%E5%86%B7%E9%9D%99%E4%B8%8B.jpg', 'Sticker-p', ['sticker']),
        new Emoji('https://static.wildfirechat.net/sticker/p/%E5%91%A6%EF%BC%8C%E5%86%99bug%E5%91%A2.jpg', 'Sticker-p', ['sticker']),
        new Emoji('https://static.wildfirechat.net/sticker/p/%E5%90%83%E6%88%91%E4%B8%80%E6%8B%9B.jpg', 'Sticker-p', ['sticker']),
        new Emoji('https://static.wildfirechat.net/sticker/p/%E5%9C%9F%E8%B1%AA%E8%80%81%E6%9D%BF.jpg', 'Sticker-p', ['sticker']),
        new Emoji('https://static.wildfirechat.net/sticker/p/%E5%A4%A7%E4%BD%AC%E4%B8%89%E8%BF%9E.png', 'Sticker-p', ['sticker']),
        new Emoji('https://static.wildfirechat.net/sticker/p/%E8%87%AA%E5%B7%B1%E4%B8%8A%E7%BD%91%E6%9F%A5.gif', 'Sticker-p', ['sticker']),
        new Emoji('https://static.wildfirechat.net/sticker/p/%E6%88%91%E5%9C%A8%E6%95%B2%E4%BB%A3%E7%A0%81.jpg', 'Sticker-p', ['sticker']),
        new Emoji('https://static.wildfirechat.net/sticker/p/%E6%89%AB%E7%A0%81%E6%94%B9%E9%9C%80%E6%B1%82.jpg', 'Sticker-p', ['sticker']),
        new Emoji('https://static.wildfirechat.net/sticker/p/%E7%A8%8B%E5%BA%8F%E5%91%98%E6%80%9D%E7%BB%B4.jpg', 'Sticker-p', ['sticker']),
        new Emoji('https://static.wildfirechat.net/sticker/p/%E7%A9%BA%E6%8C%87%E9%92%88%E5%BC%82%E5%B8%B8.jpg', 'Sticker-p', ['sticker']),
        new Emoji('https://static.wildfirechat.net/sticker/p/%E5%86%99%E4%B8%AA%E5%B1%81%E7%9A%84%E4%BB%A3%E7%A0%81.jpg', 'Sticker-p', ['sticker']),
        new Emoji('https://static.wildfirechat.net/sticker/p/%E6%88%91%E6%9D%A5%E5%86%99%E4%BB%A3%E7%A0%81%E4%BA%86.jpg', 'Sticker-p', ['sticker']),
        new Emoji('https://static.wildfirechat.net/sticker/p/%E7%A8%8B%E5%BA%8F%E5%86%99%E5%AE%8C%E4%BA%86%E5%90%97.jpg', 'Sticker-p', ['sticker']),
        new Emoji('https://static.wildfirechat.net/sticker/p/%E7%A8%8B%E5%BA%8F%E7%8C%BF%E7%9A%84%E6%97%A5%E5%B8%B8.jpg', 'Sticker-p', ['sticker']),
        new Emoji('https://static.wildfirechat.net/sticker/p/%E7%A8%8B%E5%BA%8F%E7%8C%BF%E7%9A%84%E6%A0%87%E9%85%8D.jpg', 'Sticker-p', ['sticker']),
        new Emoji('https://static.wildfirechat.net/sticker/p/%E6%88%91%E8%BF%98%E8%83%BD%E5%86%99%E4%BB%A3%E7%A0%81.png', 'Sticker-p', ['sticker']),
        new Emoji('https://static.wildfirechat.net/sticker/p/%E4%BD%A0%E4%BB%96%E5%A6%88%E8%84%91%E8%A2%8B%E6%9C%89bug.jpg', 'Sticker-p', ['sticker']),
        new Emoji('https://static.wildfirechat.net/sticker/p/%E4%BD%A0%E5%8F%88%E5%9C%A8%E5%81%B7%E5%81%B7%E5%86%99bug.jpg', 'Sticker-p', ['sticker']),
        new Emoji('https://static.wildfirechat.net/sticker/p/%E6%88%91%E5%8F%AA%E6%98%AF%E4%B8%AA%E5%B0%8F%E5%AE%89%E5%8D%93.jpg', 'Sticker-p', ['sticker']),
        new Emoji('https://static.wildfirechat.net/sticker/p/%E9%9B%B6%E9%94%99%E8%AF%AF%EF%BC%8C%E9%9B%B6%E7%AD%89%E5%BE%85.jpg', 'Sticker-p', ['sticker']),
        new Emoji('https://static.wildfirechat.net/sticker/p/%E4%BD%9B%E7%A5%96%E4%BF%9D%E4%BD%91%EF%BC%8C%E6%B0%B8%E6%97%A0BUG.png', 'Sticker-p', ['sticker']),
        new Emoji('https://static.wildfirechat.net/sticker/p/%E5%8A%B3%E8%B5%84%E5%86%8D%E4%B9%9F%E4%B8%8D%E5%86%99%E4%BB%A3%E7%A0%81%E4%BA%86.gif', 'Sticker-p', ['sticker']),
        new Emoji('https://static.wildfirechat.net/sticker/p/%E5%9E%83%E5%9C%BE%E8%AF%AD%E8%A8%80%EF%BC%8C%E6%AF%81%E6%88%91%E9%9D%92%E6%98%A5.gif', 'Sticker-p', ['sticker']),
        new Emoji('https://static.wildfirechat.net/sticker/p/%E5%9E%83%E5%9C%BE%E8%BD%AF%E4%BB%B6%EF%BC%8C%E6%AF%81%E6%88%91%E9%9D%92%E6%98%A5.gif', 'Sticker-p', ['sticker']),
        new Emoji('https://static.wildfirechat.net/sticker/p/%E6%88%91%E5%8F%AF%E8%83%BD%E6%98%AF%E4%B8%AA%E5%81%87%E7%A8%8B%E5%BA%8F%E5%91%98.jpg', 'Sticker-p', ['sticker']),
        new Emoji('https://static.wildfirechat.net/sticker/p/%E6%B5%81%E4%B8%8B%E4%BA%86%E6%B2%A1%E6%8A%80%E6%9C%AF%E7%9A%84%E6%B3%AA%E6%B0%B4.jpg', 'Sticker-p', ['sticker']),
        new Emoji('https://static.wildfirechat.net/sticker/p/%E5%88%AB%E8%B7%91%EF%BC%8C%E5%9B%9E%E6%9D%A5%E6%8A%8A%E4%BB%A3%E7%A0%81%E5%86%99%E5%AE%8C.gif', 'Sticker-p', ['sticker']),
        new Emoji('https://static.wildfirechat.net/sticker/p/%E7%9C%9F%E6%AD%A3%E9%9A%90%E4%B8%96%E7%9A%84%E9%AB%98%E6%89%8B%E7%A8%8B%E5%BA%8F%E5%91%98.jpg', 'Sticker-p', ['sticker']),
        new Emoji('https://static.wildfirechat.net/sticker/p/%E7%A0%81%E5%86%9C%E5%92%8C%E4%BA%A7%E5%93%81%E7%BB%8F%E7%90%86%E7%9A%84%E5%8C%BA%E5%88%AB.jpg', 'Sticker-p', ['sticker']),
        new Emoji('https://static.wildfirechat.net/sticker/p/%E5%A6%82%E6%9E%9C%E6%8A%8A%E9%9D%A2%E8%AF%95%E5%AE%98%E5%94%AC%E4%BD%8F%E4%BA%86%E5%B0%B1%E8%A6%8150k%EF%BC%8C%E6%B2%A1%E5%94%AC%E4%BD%8F%E5%B0%B1%E8%A6%815k.png', 'Sticker-p', ['sticker']),
        new Emoji('https://static.wildfirechat.net/sticker/p/%E5%B0%B1%E6%98%AF%E4%BB%96%EF%BC%8C%E4%B8%80%E8%A1%8C%E4%BB%A3%E7%A0%81%EF%BC%8C%E6%8A%A5%E4%B8%89%E4%B8%AA%E9%94%99.jpg', 'Sticker-p', ['sticker']),
        new Emoji('https://static.wildfirechat.net/sticker/p/%E9%AA%9A%E5%B9%B4%E5%87%BA%E6%8B%9B%E5%90%A7%EF%BC%8C%E5%93%A5%E8%AE%A9%E4%BD%A0%E4%B8%89%E8%A1%8C%E4%BB%A3%E7%A0%81.jpg', 'Sticker-p', ['sticker']),
        new Emoji('https://static.wildfirechat.net/sticker/p/%E9%82%A3%E4%B9%88%E5%A5%BD%E7%94%A8%E7%9A%84%E6%A1%86%E6%9E%B6%EF%BC%8C%E8%BF%98%E4%B8%8D%E8%B5%B6%E7%B4%A7%E6%9D%A5Star.jpg', 'Sticker-p', ['sticker']),
        new Emoji('https://static.wildfirechat.net/sticker/p/%E4%BD%A0%E5%B0%B1%E6%98%AF%E6%89%93%E6%AD%BB%E6%88%91%EF%BC%8C%E6%88%91%E4%B9%9F%E4%B8%8D%E6%94%B9%E8%BF%99%E4%B8%AAbug.png', 'Sticker-p', ['sticker']),
        new Emoji('https://static.wildfirechat.net/sticker/p/%E4%BD%A0%E4%BB%AC%E5%A6%82%E6%9E%9C%E8%BF%98%E4%B8%8D%E5%8E%BB%E5%86%99%E4%BB%A3%E7%A0%81%E6%88%91%E5%B0%B1%E5%BC%80%E6%9E%AA%E4%BA%86.jpg', 'Sticker-p', ['sticker']),
        new Emoji('https://static.wildfirechat.net/sticker/p/%E7%AE%97%E6%88%91%E6%B1%82%E4%BD%A0%E7%9A%84%EF%BC%8C%E4%BD%A0%E7%89%B9%E4%B9%88%E5%8E%BB%E5%86%99%E4%BB%A3%E7%A0%81%E5%A5%BD%E4%B8%8D%E5%A5%BD.jpg', 'Sticker-p', ['sticker']),
        new Emoji('https://static.wildfirechat.net/sticker/p/%E5%AF%B9%E6%96%B9%E4%B8%8D%E7%90%86%E4%BD%A0%E7%9A%84%E5%BC%82%E5%B8%B8%EF%BC%8C%E5%BD%93%E4%BD%A0%E9%9D%A2%E5%85%B3%E9%97%AD%E4%BA%86%E7%A8%8B%E5%BA%8F.png', 'Sticker-p', ['sticker']),
        new Emoji('https://static.wildfirechat.net/sticker/p/%E5%AF%B9%E6%96%B9%E4%B8%8D%E6%83%B3%E5%92%8C%E4%BD%A0%E8%AF%B4%E8%AF%9D%EF%BC%8C%E5%B9%B6%E5%90%91%E4%BD%A0%E6%8A%9B%E5%87%BA%E4%BA%86%E4%B8%80%E4%B8%AA%E5%BC%82%E5%B8%B8.jpg', 'Sticker-p', ['sticker']),
        new Emoji('https://static.wildfirechat.net/sticker/p/%E5%AF%B9%E6%96%B9%E4%B8%8D%E6%83%B3%E8%B7%9F%E4%BD%A0%E8%AF%B4%E8%AF%9D%EF%BC%8C%E5%B9%B6%E5%90%91%E4%BD%A0%E6%89%94%E4%BA%86%E4%B8%80%E4%BB%BD%E9%B8%9F%E5%93%A5%E8%AF%AD%E5%BD%95.jpg', 'Sticker-p', ['sticker']),
        new Emoji('https://static.wildfirechat.net/sticker/p/%E5%9C%A8%E4%BD%A0%E4%BB%AC%E8%81%8A%E5%A4%A9%E7%9A%84%E6%97%B6%E5%80%99%EF%BC%8C%E6%88%91%E5%B7%B2%E7%BB%8F%E5%86%99%E4%BA%86%E5%A5%BD%E5%87%A0%E4%B8%87%E8%A1%8C%E4%BB%A3%E7%A0%81%E4%BA%86.gif', 'Sticker-p', ['sticker']),
        new Emoji('https://static.wildfirechat.net/sticker/p/%E5%AF%B9%E6%96%B9%E5%90%91%E4%BD%A0%E4%B8%A2%E4%BA%86%E4%B8%80%E5%A0%86%E7%A5%9E%E7%A7%98%E4%BB%A3%E7%A0%81%EF%BC%8C%E5%8F%AF%E6%98%AF%E4%BD%A0%E5%8D%B4%E4%B8%8D%E8%83%BD%E5%A4%8D%E5%88%B6.jpg', 'Sticker-p', ['sticker']),
        new Emoji('https://static.wildfirechat.net/sticker/p/%E5%90%8C%E5%BF%97%E5%BF%AB%E9%86%92%E9%86%92%EF%BC%8C%E4%BD%A0%E8%BF%98%E6%9C%89%E4%B8%80%E4%B8%B2%E4%BB%A3%E7%A0%81%E6%8F%90%E7%A4%BA%E9%94%99%E8%AF%AF%EF%BC%8C%E8%B5%B7%E6%9D%A5%E6%94%B9%E6%94%B9.jpg', 'Sticker-p', ['sticker']),
        new Emoji('https://static.wildfirechat.net/sticker/p/%E5%9B%9E%E5%8E%BB%E5%86%99%E4%BB%A3%E7%A0%81%EF%BC%8C%E8%B0%81%E8%AE%A9%E4%BD%A0%E8%B7%91%E5%87%BA%E6%9D%A5%E8%A3%85%E9%80%BC%E7%9A%84%EF%BC%8C%E7%9C%8B%E6%88%91%E4%B8%8D%E6%89%93%E6%AD%BB%E4%BD%A0.jpg', 'Sticker-p', ['sticker']),
    ];
    const icons = {
        peoples: `
          <svg style="max-height:18px"
            xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 106.059 106.059" fill="gray">
            <path d="M90.544 90.542c20.687-20.684 20.685-54.341.002-75.024-20.688-20.689-54.347-20.689-75.031-.006-20.688 20.687-20.686 54.346.002 75.034 20.682 20.684 54.341 20.684 75.027-.004zM21.302 21.3c17.494-17.493 45.959-17.495 63.457.002 17.494 17.494 17.492 45.963-.002 63.455-17.494 17.494-45.96 17.496-63.455.003-17.498-17.498-17.496-45.966 0-63.46zM27 69.865s-2.958-11.438 6.705-8.874c0 0 17.144 9.295 38.651 0 9.662-2.563 6.705 8.874 6.705 8.874C73.539 86.824 53.03 85.444 53.03 85.444S32.521 86.824 27 69.865zm6.24-31.194a6.202 6.202 0 1 1 12.399.001 6.202 6.202 0 0 1-12.399-.001zm28.117 0a6.202 6.202 0 1 1 12.403.001 6.202 6.202 0 0 1-12.403-.001z"/>
          </svg>
          `,
        sticker_b: `
            <svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="24px" height="24px" viewBox="0 0 24 24" enable-background="new 0 0 24 24" xml:space="preserve">  <image id="image0" width="24" height="24" x="0" y="0"
                href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAIAAABvFaqvAAAABGdBTUEAALGPC/xhBQAAACBjSFJN
            AAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QA/wD/AP+gvaeTAAAA
            B3RJTUUH5QECDhwjU7rAjwAAA/RJREFUOMutVDtvHFUUPuc+dmZfnp3EXu/aBBZbDgYZhYYCBA0F
            AqcgAiGIhGho+Q+0lKRBQkICWeJRWnR5oDSWEQqKLeIE4hjsPJz1I1nv7M7Mzty59x6KXQdixaLx
            KW5xdc53vvOdB/5xsw1HYexIUI4SSBAAEgEgAAAQIQIAwv43ECACEO47HAqE1A/ue+Agug+HBIBA
            BICEhABAeDgjHAQfZEQwgOkzIqQB9H7OxxkKIEQgSy6SZag0MEJk2CPIIxJRalEiEQISWSJ6FHug
            SMHAZugKEVrkqck5xhBkiuUZphCty/wkATHgBNZxnJx0iPCJnASBEJTd+vnz0cZJ74Wz1CsApHm3
            2F6Z12q1+uJnSreFkUzC7Y3bWzubjNMTFRcoSHe27127HKwtN+LYf+ZV0JZvbWYbP0qvak0EzBgE
            LuTFS/NTU2N+xdc6Q8Q+o4GWACJlGXdccqu/Lf+l6Lvp5nlZkt0gPOYNjYzWVO+X1H1NC8W0U6sN
            v//emXLZIyLEg+0T3HDJdHUEsmf9iekTJBUUJnzPabX+TMI0vHO+8bIfyxnkZIzNtAYAYwwiWmsf
            m2zk+XTvjgrW3nqjMVopdiP6/qervy6tj3hj4W5wbeX3Sn7PYZEGicwIJgCAc84YE0JIKfuvlFIg
            Aqq7E5PTcbnBZWm4RKUbC1HcAvHU1GSDl6qtvQf5ka1Mlf4rMREtLS11u13GBkvGmEqz8LpTHAK3
            zkujOW/8o48/ePud08Xq05dW4g8//erLHy5z1s6ZEED0m42IURTNzc2FYdjpdIIg6HQ6guJ76uF6
            mESF4p5KNJM8ZTKKI2NDbXBk6HjSbqa9B/9uEQAASCkbjUa9Xvc8z1qrlGI6vt4Lt0FHwrYdTlna
            S6LNzoPm1cXl1RtXnpsqv/7KtGB5CxKQ+gJrrV3XnZ2dnZ+fr1Qqvu+vrq4KHaz14hgiG8m/iyMF
            UfQx5ZVy4dSp518C9LzKMb9sE85kQamUcQYAfV3K5XK9XhseHgaA+lhd5NziUP1k2GwarbUO05hJ
            0lbFLkK+4OR4mIUhc8axgIDim6+/LZV9YzR35P37zZzg/UrjKBHE3VJ1wh8+0YtbGXKkTKk4U0GW
            BFkky37NGR13pO7p4PS7Z5O9EIBba4R0xsbvrt28sj9EQmzsKGSewDLysSRRxlohpJFRqlsKWJL6
            QXA8lxhLtzLBOXeQqFgqqiyLe22ibCA+WvHmmU8IyFIOERD6JwUYIgNGSEQWyBrQaAWSBSTG2cUL
            F6r1Wt5JW63d3d1tY6jb7SLRodfzgBERETHGvjh3bndnZ2ZmZnFxsd9HIcTBlflfQ8QsyxYWFgCg
            UCg8yvEPaokfRXAR71gAAAAldEVYdGRhdGU6Y3JlYXRlADIwMjEtMDEtMDJUMTQ6Mjg6MzQrMDA6
            MDAnO/YsAAAAJXRFWHRkYXRlOm1vZGlmeQAyMDIxLTAxLTAyVDE0OjI4OjM0KzAwOjAwVmZOkAAA
            AABJRU5ErkJggg==" />
            </svg>
          `,
        sticker_p: `
            <svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="24px" height="24px" viewBox="0 0 24 24" enable-background="new 0 0 24 24" xml:space="preserve">  <image id="image0" width="24" height="24" x="0" y="0"
                href="data:image/png;base64,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" />
            </svg>

          `,
    };
    let customCategories = [
        new Category("Peoples", icons["peoples"]),
        new Category("Sticker-b", icons["sticker_b"]),
        new Category("Sticker-p", icons["sticker_p"])
    ];

    let emojis = [...emojisDefault, ...customStickers];

    return {
        emojiCategories: customCategories,
        emojis: emojis,
    }
}
