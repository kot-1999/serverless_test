const AWS = require('aws-sdk')

const s3= new AWS.S3()
const BUCKET_NAME = process.env.FILE_UPLOAD_BUCKET_NAME

module.exports.handler = async (event) => {
    console.log(event)

    try {
        const parseBody = JSON.parse(event.body)
        const base64File = parseBody.file
        const decodedFile = Buffer.from(base64File.replace(/^data:image\/\w+;base64,/, 'base64'))
        const params = {
            Bucket: BUCKET_NAME,
            Key: `images/${new Date().toISOString()}.jpeg`,
            Body: decodedFile,
            ContentType: 'image/jpeg'
        }
        const uploadResult = await s3.upload(params).promise()

        console.log(uploadResult)

        return  {
            statusCode: 200,
            isBase64Encoded: false,
            body: JSON.stringify({ message: 'Success upload to s3', uploadResult})
        }
    } catch (error) {
        console.error(error)
        return {
            statusCode: 400,
            isBase64Encoded: false,
            message: error.message
        }
    }
};
