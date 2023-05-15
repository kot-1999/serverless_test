import {APIGatewayEvent, APIGatewayProxyResult} from "aws-lambda";
import * as AWS from 'aws-sdk'
const sesV2 = new AWS.SESV2({ region: process.env.REGION, maxRetries: 0})

export const handler = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult>=> {
    const response: any = {
        isBase64Encoded: false,
        statusCode: 200,
    };

    try {
        if (!event.body) {
            throw new Error('Missing event body')
        }

        const { to, name, favoriteAnimal } = JSON.parse(event.body)
        const data = await sesV2.sendEmail({
            Content: {
                Template: {
                    TemplateName: process.env.EMAIL_TEMPLATE_NAME,
                    TemplateData: `{ \"name\":\"${name}\", \"favoriteAnimal\": \"${favoriteAnimal}\" }`
                }
            },
            Destination: {
                ToAddresses: [to]
            },
            FromEmailAddress: process.env.EMAIL_IDENTITY
        }).promise()
        response.body = JSON.stringify({ message: "Email was sent", data });
    } catch (e) {
        console.error(e);
        response.body = JSON.stringify({ message: "Failed to send mail.", errorMessage: e });
        response.statusCode = 500;
    }

    return response;
}
