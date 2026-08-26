import xss from "xss";

/**
 * 搜索结果 digest 高亮渲染工具。
 *
 * 服务端返回的 digest 已做 HTML 转义并包裹 <mark> 高亮；
 * 客户端渲染前二次净化（白名单仅保留 mark 标签），防 XSS。
 */

const digestXssOptions = (() => {
    let whiteList = xss.getDefaultWhiteList();
    // 仅保留高亮标签 mark（不含属性）
    whiteList.mark = [];
    return {whiteList};
})();

/**
 * 净化服务端 digest 片段，返回可安全 v-html 的字符串
 * @param {string} digest
 * @returns {string}
 */
export function renderSearchDigest(digest) {
    if (!digest) {
        return '';
    }
    return xss(digest, digestXssOptions);
}

/**
 * 服务端 digest 中是否包含高亮命中
 * @param {string} digest
 * @returns {boolean}
 */
export function hasHighlight(digest) {
    return !!digest && digest.indexOf('<mark>') >= 0;
}
