import UserInfo from "@/wfc/model/userInfo";

export default class PatchedUserInfo extends UserInfo {
    // 显示的名字，已经考虑是否是好友、群昵称等
    _displayName = '';
    // 分类
    _category = '';
    // 拼音
    _pinyin = '';
    // 首字母拼音
    _firstLetters = ''
}
