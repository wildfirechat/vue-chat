/*
视频属性 (Profile) 定义
视频属性	枚举值	分辨率（宽x高）	帧率（fps）	码率（kpbs）
120P	0	160x120	15	120
120P_3	2	120x120	15	100
180P	10	320x180	15	280
180P_3	12	180x180	15	200
180P_4	13	240x180	15	240
240P	20	320x240	15	360
240P_3	22	240x240	15	280
240P_4	24	424x240	15	400
360P	30	640x360	15	800
360P_3	32	360x360	15	520
360P_4	33	640x360	30	1200
360P_6	35	360x360	30	780
360P_7	36	480x360	15	1000
360P_8	37	480x360	30	1500
480P	40	640x480	15	1000
480P_3	42	480x480	15	800
480P_4	43	640x480	30	1500
480P_6	45	480x480	30	1200
480P_8	47	848x480	15	1200
480P_9	48	848x480	30	1800
720P	50	1280x720 15	2400
720P_3	52	1280x720 30	3699
720P_5	54	960x720  15 1920
720P_6	55	960x720  30	2880
1080P 60	1920×1080  15	4200
1080P_3 60	1920×1080  30	6300
1080P_5 60	1920×1080  60	9560
 */
export default class VideoProfile {
    static VP120P = 0
    static VP120P_3 = 2
    static VP180P = 10
    static VP180P_3 = 12
    static VP180P_4 = 13
    static VP240P = 20
    static VP240P_3 = 22
    static VP240P_4 = 23
    static VP360P = 30
    static VP360P_3 = 32
    static VP360P_4 = 33
    static VP360P_6 = 35
    static VP360P_7 = 36
    static VP360P_8 = 37
    static VP480P = 40
    static VP480P_3 = 42
    static VP480P_4 = 43
    static VP480P_6 = 45
    static VP480P_8 = 47
    static VP480P_9 = 48

    static VP720P = 50
    static VP720P_3 = 52
    static VP720P_5 = 54
    static VP720P_6 = 55

    static VP1080P = 60
    static VP1080P_3 = 62
    static VP1080P_5 = 64

    static VPDEFAULT = VideoProfile.VP360P

    width
    height
    fps
    bitrate

    constructor (width, height, fps, bitrate) {
        this.width = width
        this.height = height
        this.fps = fps
        this.bitrate = bitrate
    }

    static getVideoProfile (videoProfile) {
        switch (videoProfile) {
//            120P	0	160x120	15	65
//            120P_3	2	120x120	15	50
            case VideoProfile.VP120P:
                return new VideoProfile(160, 120, 15, 120)
            case VideoProfile.VP120P_3:
                return new VideoProfile(120, 120, 15, 100)
//            180P	10	320x180	15	140
//            180P_3	12	180x180	15	100
//            180P_4	13	240x180	15	120
            case VideoProfile.VP180P:
                return new VideoProfile(320, 180, 15, 280)
            case VideoProfile.VP180P_3:
                return new VideoProfile(180, 180, 15, 200)
            case VideoProfile.VP180P_4:
                return new VideoProfile(240, 180, 15, 240)
//            240P	20	320x240	15	200
//            240P_3	22	240x240	15	140
//            240P_4	24	424x240	15	220
            case VideoProfile.VP240P:
                return new VideoProfile(320, 240, 15, 360)
            case VideoProfile.VP240P_3:
                return new VideoProfile(240, 240, 15, 240)
            case VideoProfile.VP240P_4:
                return new VideoProfile(424, 240, 15, 400)
//            360P	30	640x360	15	400
//            360P_3	32	360x360	15	260
//            360P_4	33	640x360	30	600
//            360P_6	35	360x360	30	400
//            360P_7	36	480x360	15	320
//            360P_8	37	480x360	30	490
            case VideoProfile.VP360P:
                return new VideoProfile(640, 360, 15, 800)
            case VideoProfile.VP360P_3:
                return new VideoProfile(360, 360, 15, 520)
            case VideoProfile.VP360P_4:
                return new VideoProfile(640, 360, 30, 1200)
            case VideoProfile.VP360P_6:
                return new VideoProfile(360, 360, 30, 780)
            case VideoProfile.VP360P_7:
                return new VideoProfile(480, 360, 15, 1000)
            case VideoProfile.VP360P_8:
                return new VideoProfile(480, 360, 30, 1500)
//            480P	40	640x480	15	500
//            480P_3	42	480x480	15	400
//            480P_4	43	640x480	30	750
//            480P_6	45	480x480	30	600
//            480P_8	47	848x480	15	610
//            480P_9	48	848x480	30	930
            case VideoProfile.VP480P:
                return new VideoProfile(640, 480, 15, 1000)
            case VideoProfile.VP480P_3:
                return new VideoProfile(480, 480, 15, 800)
            case VideoProfile.VP480P_4:
                return new VideoProfile(640, 480, 30, 1500)
            case VideoProfile.VP480P_6:
                return new VideoProfile(480, 480, 30, 1200)
            case VideoProfile.VP480P_8:
                return new VideoProfile(848, 480, 15, 1200)
            case VideoProfile.VP480P_9:
                return new VideoProfile(848, 480, 30, 1800)
//            720P	50	1280x720 15	1130
//            720P_3	52	1280x720 30	1710
//            720P_5	54	960x720  15 910
//            720P_6	55	960x720  30	1380
            case VideoProfile.VP720P:
                return new VideoProfile(1280, 720, 15, 2400)
            case VideoProfile.VP720P_3:
                return new VideoProfile(1280, 720, 30, 3600)
            case VideoProfile.VP720P_5:
                return new VideoProfile(960, 720, 15, 1920)
            case VideoProfile.VP720P_6:
                return new VideoProfile(960, 720, 30, 2880)
            case VideoProfile.VP1080P:
                return new VideoProfile(1920, 1080, 15, 4200)
            case VideoProfile.VP1080P_3:
                return new VideoProfile(1920, 1080, 30, 6300)
            case VideoProfile.VP1080P_5:
                return new VideoProfile(1920, 1080, 60, 9560)
            default:
                return VideoProfile.getVideoProfile(VideoProfile.VPDEFAULT)
        }

    }

}