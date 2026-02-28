/*
 * Copyright (c) 2020 WildFireChat. All rights reserved.
 */

export default class MessageContentMediaType {
    static General = 0;
    static Image = 1;
    static Voice = 2;
    static Video = 3;
    static File = 4;
    static Portrait = 5;
    static Favorite = 6;
    static Sticker = 7;
    static Moments = 8;
    //为客户扩展预留的类型
    static CUSTOM1 = 9;
    static CUSTOM2 = 10;
    static CUSTOM3 = 11;
    /**
     * 网盘
     */
    static PAN = 12;
}
