export default class WfcScheme {
    static QR_CODE_PREFIX_PC_SESSION = "wildfirechat://pcsession/";
    static QR_CODE_PREFIX_USER = "wildfirechat://user/";
    static QR_CODE_PREFIX_GROUP = "wildfirechat://group/";
    static QR_CODE_PREFIX_CHANNEL = "wildfirechat://channel/";
    static QR_CODE_PREFIX_CONFERENCE = "wildfirechat://conference/";

    static buildConferenceLink(conferenceId, password) {
        let link = WfcScheme.QR_CODE_PREFIX_CONFERENCE + conferenceId;
        if (password) {
            link += '/?pwd=' + password
        }
        return link;
    }
}
