import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { Context } from "vm";
import { APIGatewayProxyEvent, APIGatewayProxyResult, putItem } from "../../utils/api";

const TABLE_NAME = process.env.WEBSOCKET_TABLE_NAME as string
const dynamoClient = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const sqsClient = new SQSClient()

interface Connection {
    pk: string;
    sk: string;
    connectionId: string;
    userId: string;
    ttl: number;
    typename: string;
}

const handleConnectSetup = async (connectionId: string, userId: string) => {
    console.log(`Connection established: ${connectionId}`);
    try {
        await putItem<Connection>({
            connectionId: `USER#${userId}`,
            userId,
            ttl: 60 * 60 * 24 * 30, // 30 days
            typename: 'Connection'
        }, TABLE_NAME, docClient)
        console.log('Connection setup complete');
    } catch (error) {
        console.error('Error connecting to WebSocket', error);
    }

    return { statusCode: 200, body: 'Connected' };
}

export interface InvokeModelPayload {
    connectionId: string;
    domainName: string;
    stage: string;
    filters: string[];
    template: string;
    max_tokens: string;
    temperature: string;
    top_p: string;
    data: string,
    caseId: string,
    createdBy: string,
    model: string,
    maxLength: string,
    topP: string
}

interface IncomingMessage {
    action: "sendMessage",
    data: string,
    template: string,
    filters: string[],
    country: string,
    caseId: string,
    createdBy: string,
    model: string,
    temperature: string,
    maxLength: string,
    topP: string
}

export const handler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
    console.log('Received event:', JSON.stringify(event, null, 2));
    const connectionId = event.requestContext.connectionId as string;

    try {
        if (event.requestContext.routeKey === '$connect') {
            const userId = event.queryStringParameters?.userId as string
            if (!userId) {
                return { statusCode: 400, body: 'User ID is required' };
            }
            await handleConnectSetup(connectionId, userId);
            return { statusCode: 200, body: 'Connected' };
        }

        if (event.requestContext.routeKey === '$disconnect') {
            // Handle disconnection
            console.log(`Disconnected: ${connectionId}`);
            return { statusCode: 200, body: 'Disconnected' };
        }

        if (event.requestContext.routeKey === 'sendMessage') {
            const body = JSON.parse(event.body || '{}') as IncomingMessage;

            const payload: InvokeModelPayload = {
                caseId: body.caseId,
                createdBy: body.createdBy,
                model: body.model,
                temperature: body.temperature,
                maxLength: body.maxLength,
                topP: body.topP,
                filters: body.filters,
                template: body.template,
                connectionId: event.requestContext.connectionId as string,
                data: body.data,
                domainName: event.requestContext.domainName as string,
                stage: event.requestContext.stage as string,
                max_tokens: body.maxLength,
                top_p: body.topP,
            }

            console.log('Sending message to SQS', payload);

            const send = await sqsClient.send(new SendMessageCommand({
                QueueUrl: process.env.SQS_QUEUE_URL,
                MessageBody: JSON.stringify(payload)
            }));
            console.log(`Sent message to SQS: ${send.MessageId}`);
            return { statusCode: 200, body: JSON.stringify({ messageId: send.MessageId }) };
        }

        return { statusCode: 400, body: 'Unknown route' };
    } catch (error) {
        return { statusCode: 500, body: 'Failed to process WebSocket event' };
    }
};

