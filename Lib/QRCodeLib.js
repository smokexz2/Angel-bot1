const QRCode = require('qrcode')

class qrGenerator {
    constructor() {}

    async generate(data) {
        try {
            const buffer = await QRCode.toBuffer(data, {
                type: 'png',
                width: 512,
                errorCorrectionLevel: 'H',
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            })

            return {
                status: 'success',
                response: buffer.toString('base64')
            }

        } catch (e) {
            return {
                status: 'error',
                response: e
            }
        }
    }
}

module.exports.qrGenerator = qrGenerator