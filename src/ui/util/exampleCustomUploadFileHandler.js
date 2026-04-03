import { mimeMap } from '../../wfc/util/mime';
import wfc from '../../wfc/client/wfc';

// 这是演示如何在应用层处理文件上传逻辑，可用来对接自定义的存储
// 参数说明等，请参考 wfc.setCustomUploadFileHandler
export function exampleCustomUploadFileHandler(message, blobOrFile, fileName, mediaType, progressCB, successCB, failCB) {
    let originalFileName;
    _log('exampleCustomUploadFileHandler', message, blobOrFile, fileName, mediaType);
    let randomStr12 = (Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)).substring(0, 12);
    if (!fileName || fileName === '') {
        fileName = randomStr12;
        originalFileName = fileName;
    } else {
        originalFileName = fileName;
        fileName = randomStr12;
    }

    if (originalFileName.indexOf('.') !== -1) {
        let ext = originalFileName.substring(originalFileName.lastIndexOf('.'));
        fileName += ext;
    }
    if (fileName.indexOf('.') === -1) {
        switch (mediaType) {
            case 1:
            case 5:
                fileName += '.jpg';
                break;
            case 2:
                // 小程序平台，voice默认为mp3格式
                fileName += '.mp3';
                break;
            case 3:
                fileName += '.mp4';
                break;
            default:
                break;
        }
    }

    _log('upload fileName', originalFileName, fileName, mediaType);
    let contentType = _getContentMimeType(mediaType, originalFileName);
    wfc.getUploadMediaUrl(fileName, mediaType, contentType, (uploadUrl, remoteUrl, backUploadUrl, serverType) => {
        // uploadUrl = (wfc.backupAddressStrategy === 1 || !backUploadUrl) ? uploadUrl : backUploadUrl;
        _log('uploadUrl', uploadUrl)
        let xhr;
        if (serverType === 0) {
            // 内置存储，暂不支持此种方式上传
        } else if (serverType === 1) {
            // qiniu
            let ss = uploadUrl.split('?');
            let url = ss[0];
            let token = ss[1];
            let key = ss[2];
            xhr = _uploadXMLHttpRequest(message, fileName, remoteUrl, progressCB, successCB, failCB);

            let formData = new FormData();
            formData.append('key', key)
            formData.append('token', token)
            formData.append('file', blobOrFile)
            xhr.open('POST', url);
            xhr.setRequestHeader('content-disposition', `attachment; filename="${encodeURI(originalFileName)}"`);
            xhr.send(formData);
        } else {
            // 野火专业存储或阿里云
            xhr = _uploadXMLHttpRequest(message, fileName, remoteUrl, progressCB, successCB, failCB);
            xhr.open('PUT', uploadUrl);

            xhr.setRequestHeader('Content-Type', contentType);
            xhr.setRequestHeader('content-disposition', `attachment; filename="${encodeURI(originalFileName)}"`);
            xhr.send(blobOrFile);
        }

    }, (e) => {
        _log('getUploadMediaUrl e', e)
        failCB && failCB(-1);
    })

}

function _uploadXMLHttpRequest(message, fileName, remoteUrl, progressCB, successCB, failCB) {
    let xhr = new XMLHttpRequest();
    xhr.upload.onprogress = (e) => {
        // _log('upload.onprogress', Math.ceil(e.loaded / e.total * 100))
        let progress = e.loaded;
        let total = e.total;
        progressCB && progressCB(progress, total);
    }
    xhr.onreadystatechange = (e) => {
        _log('onr', xhr.readyState, xhr.status, e)
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                _log('upload file success', fileName, remoteUrl);
                successCB && successCB(remoteUrl);
            } else {
                _log('upload file error', xhr.status);
                failCB && failCB(-1);
            }
        }
    }
    xhr.onerror = e => {
        _log('upload file error', e);
        failCB && failCB(-1);
    }

    return xhr;
}

function _getContentMimeType(mediaType, fileName) {
    let contentType = 'application/octet-stream';
    if (fileName) {
        let suffix = fileName.substring(fileName.lastIndexOf('.') + 1)
        if (!suffix) {
            return contentType;
        } else {
            suffix = suffix.toLowerCase();
        }
        if (mimeMap[suffix]) {
            return mimeMap[suffix]
        }
        if (suffix === 'jpg' || suffix === 'jpeg') {
            contentType = 'image/jpeg';
        } else if (suffix === 'gif') {
            contentType = 'image/gif';
        } else if (suffix === 'png') {
            contentType = 'image/png';
        } else if (suffix === 'mp3') {
            contentType = 'audio/mpeg';
        } else if (suffix === 'mp4') {
            contentType = 'video/mp4';
        } else if (suffix === 'doc') {
            contentType = 'application/vnd.ms-word';
        } else if (suffix === 'docx') {
            contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        } else if (suffix === 'xls') {
            contentType = 'application/vnd.ms-xls';
        } else if (suffix === 'xlsx') {
            contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        } else if (suffix === 'ppt') {
            contentType = 'application/vnd.ms-powerpoint';
        } else if (suffix === 'pptx') {
            contentType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
        } else if (suffix === 'pps') {
            contentType = 'application/vnd.ms-powerpoint';
        } else if (suffix === 'pdf') {
            contentType = 'application/pdf';
        } else if (suffix === 'xml') {
            contentType = 'application/vnd.ms-xml';
        } else {
            // return "application/octet-stream";
        }
    } else {
        if (mediaType === 1) {
            contentType = 'image/jpeg';
        } else if (mediaType === 2) {
            contentType = 'audio/amr';
        } else if (mediaType === 3) {
            contentType = 'video/mp4';
        }
    }
    return contentType;
}

function _log(...msg) {
    console.log(...msg);
}
