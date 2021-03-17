let xrh;

function upload(file, uploadUrl, remoteUrl) {
    xhr = new XMLHttpRequest();
    xhr.upload.onload = (e) => {
        self.postMessage({type: 'done', name: file.name, remoteUrl: remoteUrl});
    }
    xhr.upload.onprogress = function (e) {
        self.postMessage({type: 'progress', name: file.name, progress: e.loaded, total: e.total});
    }
    xhr.open('PUT', uploadUrl, true);
    xhr.send(file);
}

function uploadQiniu(file, url, token, key, remoteUrl) {
    xhr = new XMLHttpRequest();
    xhr.upload.onload = (e) => {
        self.postMessage({type: 'done', name: file.name, remoteUrl: remoteUrl});
    }
    xhr.upload.onprogress = function (e) {
        self.postMessage({type: 'progress', name: file.name, progress: e.loaded, total: e.total});
    }
    let formData = new FormData();
    formData.append('key', key)
    formData.append('token', token)
    formData.append(file, file)
    xhr.open('POST', url, true);
    xhr.send(formData);

}

self.onmessage = function (e) {
    let data = e.data;
    let type = data.type;
    let file = data.file;
    let uploadUrl = data.uploadUrl;
    let remoteUrl = data.remoteUrl;
    let backUploadUrl = data.backUploadUrl;
    let serverType = data.serverType;
    switch (type) {
        case 'upload':
            if (serverType === 1) {
                let ss = uploadUrl.split('?');
                let url = ss[0];
                let token = ss[1];
                let key = ss[2];
                uploadQiniu(file, url, token, key)
            } else {
                upload(file, uploadUrl, remoteUrl, backUploadUrl, serverType)
            }
            break;
        case 'cancel':
            if (xrh) {
                xrh.cancel();
                xrh = null;
            }
            break;
        default:
            break;
    }
}