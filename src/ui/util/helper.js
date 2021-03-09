// ie11 not support browser-md5-file
// import MD5 from 'browser-md5-file';
import {numberValue} from '@/wfc/util/longUtil'


const helper = {

    parseXml: (text, tagName) => {
        var parser = new window.DOMParser();
        var xml = parser.parseFromString(text.replace(/&lt;/g, '<').replace(/&gt;/g, '>'), 'text/xml');
        var value = {};

        tagName = Array.isArray(tagName) ? tagName : [tagName];

        tagName.map(e => {
            value[e] = xml.getElementsByTagName(e)[0].childNodes[0].nodeValue;
        });

        return {xml, value};
    },

    humanSize: (size) => {
        var value = (size / 1024).toFixed(1);

        if (size > (1024 << 10)) {
            value = (value / 1024).toFixed(1);
            return `${value} M`;
        } else {
            return `${value} KB`;
        }
    },

    getFiletypeIcon: (extension) => {
        var filename = 'unknow';

        extension = (extension || '').toLowerCase().replace(/^\./, '');

        switch (true) {
            case ['mp3', 'flac', 'aac', 'm4a', 'wma'].includes(extension):
                filename = 'audio';
                break;

            case ['mp4', 'mkv', 'avi', 'flv'].includes(extension):
                filename = 'audio';
                break;

            case ['zip', 'rar', 'tar', 'tar.gz'].includes(extension):
                filename = 'archive';
                break;

            case ['doc', 'docx'].includes(extension):
                filename = 'word';
                break;

            case ['xls', 'xlsx'].includes(extension):
                filename = 'excel';
                break;

            case ['ai', 'apk', 'exe', 'ipa', 'pdf', 'ppt', 'psd'].includes(extension):
                filename = extension;
                break;
            default:
                break;
        }

        return `${filename}.png`;
    },

    getPallet: (image) => {
        return new Promise((resolve, reject) => {
            new window.AlbumColors(image).getColors((colors, err) => {
                if (err) {
                    resolve([
                        [0, 0, 0],
                        [0, 0, 0],
                        [0, 0, 0],
                    ]);
                } else {
                    resolve(colors);
                }
            });
        });
    },

    decodeHTML: (text = '') => {
        return text.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
    },

    isImage: (ext) => {
        return ['bmp', 'gif', 'jpeg', 'jpg', 'png'].includes(ext);
    },

    // 3 types supported: pic, video, doc
    getMediaType: (ext = '') => {
        ext = ext.toLowerCase();

        switch (true) {
            case helper.isImage(ext):
                return 'pic';

            case ['mp4'].includes(ext):
                return 'video';

            default:
                return 'doc';
        }
    },

    getDataURL: (src) => {
        var image = new window.Image();

        return new Promise((resolve, reject) => {
            image.src = src;
            image.onload = () => {
                var canvas = document.createElement('canvas');
                var context = canvas.getContext('2d');

                canvas.width = image.width;
                canvas.height = image.height;

                context.drawImage(image, 0, 0, image.width, image.height);
                resolve(canvas.toDataURL('image/png'));
            };

            image.onerror = () => {
                resolve('');
            };
        });
    },

    isOsx: window.process && window.process.platform === 'darwin',

    isSuspend: () => {
        return ipcRenderer.sendSync('is-suspend');
    },

    // md5: (file) => {
    //     return new Promise((resolve, reject) => {
    //         new MD5().md5(file, (err, md5) => {
    //             resolve(err ? false : md5);
    //         });
    //     });
    // },

    weekFormat: (num) => {
        let str
        switch (num) {
            case 1:
                str = '星期一'
                break
            case 2:
                str = '星期二'
                break
            case 3:
                str = '星期三'
                break
            case 4:
                str = '星期四'
                break
            case 5:
                str = '星期五'
                break
            case 6:
                str = '星期六'
                break
            default:
                str = '星期天'
        }
        return str
    },

    /**
     * 会话时间显示
     */

    dateFormat(date) {
        if (!date) return ''
        if ((typeof date) === 'object') {
            date = numberValue(date);
        }
        let today = new Date().setHours(0, 0, 0, 0);
        let that = new Date(date).setHours(0, 0, 0, 0);
        if (today === that) {
            return this.timeFormat(date);
        } else {
            let thatDate = new Date(date);
            return thatDate.getFullYear() + '/' + (thatDate.getMonth() + 1) + '/' + thatDate.getDate();
        }
    },

    /**
     * 消息会话时间显示
     */
    timeFormat: (date) => {
        if (!date) return ''
        if ((typeof date) === 'object') {
            date = numberValue(date);
        }
        let newtime;
        let nowtime = new Date()
        // if (date.constructor !== Date) {
        //     date = new Date(date.replace(/\-/g, '/')) // 解决ios日期显示NAN问题
        //  }
        date = new Date(date)
        // 获取消息发送时间
        let Y = date.getFullYear()
        let M = date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1
        let D = date.getDate() < 10 ? '0' + date.getDate() : date.getDate()
        let W = date.getDay()
        let H = date.getHours() < 10 ? '0' + date.getHours() : date.getHours()
        let Min = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()
        // 获取当前时间
        let nowY = nowtime.getFullYear()
        let nowM = nowtime.getMonth() + 1 < 10 ? '0' + (nowtime.getMonth() + 1) : nowtime.getMonth() + 1
        let nowD = nowtime.getDate() < 10 ? '0' + nowtime.getDate() : nowtime.getDate()
        let isWeek = Math.abs(date - nowtime) < 7 * 24 * 3600 * 1000
        if (Y < nowY) {
            // 去年
            newtime = Y + '-' + M + '-' + D + ' ' + H + ':' + Min
        } else {
            if (Y === nowY && M === nowM && (nowD - D <= 7)) {
                // 昨天
                if ((nowD - D) === 1) {
                    newtime = '昨天' + ' ' + H + ':' + Min
                } else if (nowD === D) {
                    // 当天
                    newtime = H + ':' + Min
                } else {
                    // 一周内
                    newtime = helper.weekFormat(W) + ' ' + H + ':' + Min
                }
            } else {
                // 一年内
                newtime = M + '-' + D + ' ' + H + ':' + Min
            }
        }
        return newtime
    },

};


export default helper;
