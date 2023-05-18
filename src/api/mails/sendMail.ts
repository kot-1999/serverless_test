import {APIGatewayEvent, APIGatewayProxyResult} from "aws-lambda";
import * as AWS from 'aws-sdk'
const ses = new AWS.SES({ region: process.env.REGION, maxRetries: 0})
const sesV2 = new AWS.SESV2({ region: process.env.REGION, maxRetries: 0})
import mimetext from 'mimetext'

export const handler = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
    const response: any = {
        isBase64Encoded: false,
        statusCode: 200,
    };

    try {
        if (!event.body) {
            throw new Error('Missing event body')
        }

        const { to, name, favoriteAnimal, subscription } = JSON.parse(event.body)

        // RAW MAIL WITH SES V2
        const message = mimetext.createMimeMessage()
        message.setHeader('X-SES-CONFIGURATION-SET', process.env.CONFIGURATION_SET_NAME)
        // @ts-ignore
        message.setSender(process.env.EMAIL_IDENTITY)
        message.setRecipient(to)
        message.setSubject('Test MIMO')
        message.addMessage({
            encoding: 'base64',
            contentType: 'text/html',
            data: Buffer.from(`<html><head></head><body><h1>Hello ${name},</h1><p>Your favorite animal is ${favoriteAnimal}. </p><a href=\"https://www.youtube.com/watch?v=E_-YbGYz-qM/\"><button>Just do it</button></a> </body></html>`).toString('base64')
        })

        console.log('123', message.asRaw(), '123')
        const data = await sesV2.sendEmail({
            ConfigurationSetName: 'my-test-set',
            Content: {
                Raw: {
                    Data: message.asRaw()
                }
            },
            Destination: {
                ToAddresses: [to]
            },
            FromEmailAddress: process.env.EMAIL_IDENTITY,
        }).on('build', (request) => request.httpRequest.headers['X-SES-CONFIGURATION-SET'] = 'my-test-set').promise()


        // TEMPLATED MAIL WITH SES V1
        // const data = await ses.sendEmail({
        //     Message: {
        //         Body: {
        //             Text: { Data: "Test" },
        //         },
        //         Subject: { Data: "Test Email" },
        //     },
        //     ConfigurationSetName: process.env.CONFIGURATION_SET_NAME,
        //     // @ts-ignore
        //     Template: process.env.EMAIL_TEMPLATE_NAME,
        //     TemplateData: `{ \"name\":\"${name}\", \"favoriteAnimal\": \"${favoriteAnimal}\", \"subscription\": ${subscription} }`,
        //     Destination: {
        //         ToAddresses: [to]
        //     },
        //     // @ts-ignore
        //     Source: process.env.EMAIL_IDENTITY,
        // }).promise()

        response.body = JSON.stringify({ message: "Email was sent", data });
    } catch (e) {
        console.error(e);
        response.body = JSON.stringify({ message: "Failed to send mail.", errorMessage: e });
        response.statusCode = 500;
    }

    return response;
}
