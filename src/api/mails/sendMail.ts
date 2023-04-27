import {APIGatewayEvent, APIGatewayProxyResult} from "aws-lambda";
import * as AWS from 'aws-sdk'
const ses = new AWS.SES()
export const handler = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {

    try {

        const resp = await ses.sendEmail({
            Message: {
                Body: {
                    Text: {
                        Data: 'Hello mazafaka'
                    }
                },
                Subject: {
                    Data:'Test'
                }
            },
            Destination: {
                ToAddresses: ['oleksandr.kashytskyi@goodrequest.com']
            },
            Source: 'oleksandr.kashytskyi@goodrequest.com'
        }, () => {})


        return {
            statusCode: 200,
            body: JSON.stringify({
                message: resp,
            }),
        }
    } catch (e: any) {
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: e.message,
            }),
        }
    }
}
