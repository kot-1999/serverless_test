import { Context, APIGatewayProxyResult, APIGatewayEvent } from 'aws-lambda'
import * as AWS from 'aws-sdk'
const s3 = new AWS.S3()

const BUCKET_NAME = process.env.FILE_UPLOAD_BUCKET_NAME

export const handler = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
    console.log(event);

    const response: any = {
        isBase64Encoded: false,
        statusCode: 200,
    };
    if (!event.pathParameters?.fileKey) {
        throw new Error('Missing fileKey in path url')
    }
    try {
        const params: any  = {
            Bucket: BUCKET_NAME,
            Key: decodeURIComponent(event.pathParameters.fileKey),
        };
        const data = await s3.getObject(params).promise();
        console.log('DATA', data)
        response.body = JSON.stringify({ message: "Successfully retrieved file from S3.", data });
    } catch (e) {
        console.error(e);
        response.body = JSON.stringify({ message: "Failed to get file.", errorMessage: e });
        response.statusCode = 500;
    }

    return response;
};
