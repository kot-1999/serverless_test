import {APIGatewayEvent, APIGatewayProxyResult} from "aws-lambda";
import * as AWS from 'aws-sdk'
const ses = new AWS.SES({ region: process.env.REGION, maxRetries: 0})

export const handler = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult>=> {
    const response: any = {
        isBase64Encoded: false,
        statusCode: 200,
    };

    try {
        if (!event.body) {
            throw new Error('Missing event body')
        }

        const { to, from, subject, text } = JSON.parse(event.body)
        const data = await ses.sendEmail({
            Message: {
                Body: {
                    Text: {
                        Data: text
                    }
                },
                Subject: {
                    Data: subject
                }
            },
            Destination: {
                ToAddresses: [to]
            },
            Source: from
        }).promise()
        response.body = JSON.stringify({ message: "Email was sent", data });
    } catch (e) {
        console.error(e);
        response.body = JSON.stringify({ message: "Failed to send mail.", errorMessage: e });
        response.statusCode = 500;
    }

    return response;
}
