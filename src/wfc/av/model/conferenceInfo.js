export default class ConferenceInfo {
    conferenceId;
    conferenceTitle;
    password;
    pin;
    owner;
    managers = [];
    focus;
    // 秒
    startTime;
    endTime;
    audience;
    advance;
    //@SerializedName("allowSwitchMode")
    allowSwitchMode; // 其实更新allowTurnOnMic;
    noJoinBeforeStart = false;
    recording = false;


    isAllowTurnOnMic() {
        return this.allowSwitchMode;
    }
}
