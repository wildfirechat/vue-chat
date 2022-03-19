/*
 * Copyright (c) 2020 WildFireChat. All rights reserved.
 */

export default class UserOnlineState {
    userId;
    customState;
    clientStates;

    // 手机在线、web在线、pc在线
    desc() {
        if (this.customState.state > 0) {
            //0，未设置，1 忙碌，2 离开（主动设置），3 离开（长时间不操作），4 隐身，其它可以自主扩展。
            let cs = ['未设置', '忙碌', '离开(主动离开)', '离开(长时间未操作)', '隐身'];
            return this.customState.text + cs[this.customState.state];
        }

        let onlineClientDesc = '';
        let lastSeenDesc = '';
        this.clientStates.forEach(s => {
            //
            // /**
            //  Platform_UNSET = 0;
            //  Platform_iOS = 1;
            //  Platform_Android = 2;
            //  Platform_Windows = 3;
            //  Platform_OSX = 4;
            //  Platform_WEB = 5;
            //  Platform_WX = 6;
            //  Platform_LINUX = 7;
            //  Platform_iPad = 8;
            //  Platform_APad = 9;
            //  */
            // platform;
            //
            // //设备的在线状态，0是在线，1是有session但不在线，其它不在线。
            // state;
            //
            // //最后可见
            // lastSeen;

            let ps = ['未知', 'iOS', 'Android', 'Windows', 'mac', 'Web', '小程序', 'Linux', 'iPad', 'Android-Pad'];
            if (s.state === 0) {
                onlineClientDesc += ps[s.platform] + ' '
            } else if ([1, 2, 8, 9].indexOf(s.platform) >= 0) {
                // TODO
                lastSeenDesc += ps[s.platform] + ' ';
            }
        });

        if (onlineClientDesc) {
            return onlineClientDesc + '在线';
        } else if (lastSeenDesc) {
            return lastSeenDesc + '不久前在线';
        }
        //return '不在线';
        return '';
    }
}
