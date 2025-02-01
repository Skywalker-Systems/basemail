import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { Context } from "vm";
import { SQSEvent } from "../../utils/api";

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });

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

export const handler = async (event: SQSEvent, context: Context): Promise<void> => {
    console.log('Received event:', JSON.stringify(event, null, 2));
};
