import { Context, APIGatewayProxyResult, APIGatewayEvent } from 'aws-lambda'
import * as AWS from 'aws-sdk'

const s3 = new AWS.S3()

// bucket name env var will be set in serverless.yml file
const BUCKET_NAME = process.env.FILE_UPLOAD_BUCKET_NAME

export const handler = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
    console.log(event);

    // The output from a Lambda proxy integration must be
    // in the following JSON object. The 'headers' property
    // is for custom response headers in addition to standard
    // ones. The 'body' property  must be a JSON string. For
    // base64-encoded payload, you must also set the 'isBase64Encoded'
    // property to 'true'.
    const response: any = {
        isBase64Encoded: false,
        statusCode: 200,
    };
    if (event.body === null) {
        throw new Error('Missing body in event')
    }
    try {
        const parsedBody = JSON.parse(event.body);
        const base64File = parsedBody.file;
        const decodedFile = Buffer.from(base64File.replace(/^data:image\/\w+;base64,/, ""), "base64");
        const params: any  = {
            Bucket: BUCKET_NAME,
            Key: parsedBody.fileKey,
            Body: decodedFile,
            ContentType: "image/jpeg",
        };
        const uploadResult = await s3.upload(params).promise();

        response.body = JSON.stringify({ message: "Successfully uploaded file to S3", uploadResult });
    } catch (e) {
        console.error("Failed to upload file: ", e);
        response.body = JSON.stringify({ message: "File failed to upload.", errorMessage: e });
        response.statusCode = 500;
    }

    return response;
};
