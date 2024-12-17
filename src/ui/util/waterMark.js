import wfc from "../../wfc/client/wfc";

let updateWaterMarkInterval;

function updateWaterMark(watermarkStr, re) {
    if (!watermarkStr) {
        return;
    }
    const id = 'wf-watermark'
    const dom = document.getElementById(id)
    let waterMarkDataURL = genWaterMarkDataURL(watermarkStr)
    if (dom !== null) {
        if (!re) {
            dom.style.background = 'url(' + waterMarkDataURL + ') left top repeat'
            return
        } else {
            document.body.removeChild(dom)
        }
    }
    let div = document.createElement('div')
    div.id = id
    div.style.pointerEvents = 'none'
    div.style.top = '65px'
    div.style.left = '0px'
    div.style.position = 'fixed'
    div.style.zIndex = '999'
    div.style.opacity = '0.3'
    div.style.width = document.documentElement.clientWidth + 'px'
    div.style.height = document.documentElement.clientHeight - 65 + 'px'
    div.style.background =
        'url(' + waterMarkDataURL + ') left top repeat'
    document.body.appendChild(div)
}

function genWaterMarkDataURL(waterMarkStr) {
    const canvas = document.createElement('canvas')
    canvas.width = 250
    canvas.height = 200

    let ctx = canvas.getContext('2d')
    if (ctx) {
        ctx.rotate((-20 * Math.PI) / 180)
        ctx.font = '18px Vedana'
        ctx.fillStyle = '#ccc'
        ctx.textAlign = 'left'
        ctx.textBaseline = 'middle'
        ctx.fillText(waterMarkStr, canvas.width / 20, canvas.height)
        return canvas.toDataURL('image/png')
    }
    return ''
}

class watermark {
    // 该方法只允许调用一次
    init(str) {
        console.log('init watermark')
        let watermarkStr = str
        updateWaterMark(watermarkStr)
        if (!str) {
            setTimeout(() => {
                updateWaterMark(this.defaultWaterMark())
                updateWaterMarkInterval = setInterval(() => {
                    updateWaterMark(this.defaultWaterMark())
                }, 60 * 1000)
            }, 1000)
        }

        window.addEventListener('resize', () => {
            if (location.hash !== '#/') {
                updateWaterMark(watermarkStr ? watermarkStr : this.defaultWaterMark(), true)
            }
        })
    }

    remove() {
        window.removeEventListener('resize', () => {
        })
        const id = 'watermark'
        const dom = document.getElementById(id)
        if (dom !== null) {
            document.body.removeChild(dom)
        }
        clearInterval(updateWaterMarkInterval)
    }

    defaultWaterMark() {
        let now = new Date()
        let dateStr = now.getMonth() + 1 + '-' + now.getDate() + ' ' + now.getHours() + ':' + now.getMinutes()
        let userId = wfc.getUserId()
        return userId ? userId + ' ' + dateStr : ''
    }
}

export default new watermark()
