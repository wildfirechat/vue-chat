/*
 * Copyright (c) 2020 WildFireChat. All rights reserved.
 */

export default class UserClientState {
    /**
     Platform_UNSET = 0;
     Platform_iOS = 1;
     Platform_Android = 2;
     Platform_Windows = 3;
     Platform_OSX = 4;
     Platform_WEB = 5;
     Platform_WX = 6;
     Platform_LINUX = 7;
     Platform_iPad = 8;
     Platform_APad = 9;
     */
    platform;

    //设备的在线状态，0是在线，1是有session但不在线，其它不在线。
    state;

    //最后可见
    lastSeen;

}
