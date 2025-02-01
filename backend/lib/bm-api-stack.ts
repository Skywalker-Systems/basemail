import { aws_apigatewayv2 } from 'aws-cdk-lib';
import { CorsHttpMethod, HttpApi, HttpMethod, HttpNoneAuthorizer, WebSocketStage } from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpJwtAuthorizer } from 'aws-cdk-lib/aws-apigatewayv2-authorizers';
import { HttpLambdaIntegration, WebSocketLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { AttributeType, BillingMode, ProjectionType, Table, TableEncryption } from 'aws-cdk-lib/aws-dynamodb';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { SqsDestination } from 'aws-cdk-lib/aws-lambda-destinations';
import * as eventsources from 'aws-cdk-lib/aws-lambda-event-sources';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Duration, Stack, StackProps } from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import 'dotenv/config';

interface BasemailStackProps extends StackProps {
    datasourceId: string;
    knowledgeBaseId: string;
    issuer: string;
}

export class BasemailAPIStack extends Stack {
    coreTable: Table;
    connectionsArns: string;
    websocketTable: Table;
    websocketApi: aws_apigatewayv2.WebSocketApi;

    constructor(scope: Construct, id: string, props?: BasemailStackProps) {
        super(scope, id, props);

        if (!process.env.CLERK_SECRET_KEY) {
            throw new Error('CLERK_SECRET_KEY is not set');
        }

        const s3Access = new PolicyStatement({
            effect: Effect.ALLOW,
            actions: [
                's3:GetObject',
                's3:PutObject',
                's3:CopyObject',
                's3:ListBucket',
                's3:ListObjectsV2'
            ],
            resources: ['*'],
        })

        const coreTable = new Table(this, "BasemailDocumentsTable", {
            partitionKey: { name: "pk", type: AttributeType.STRING },
            sortKey: { name: "sk", type: AttributeType.STRING },
            encryption: TableEncryption.AWS_MANAGED,
            timeToLiveAttribute: "ttl",
            billingMode: BillingMode.PAY_PER_REQUEST,
        });
        coreTable.addGlobalSecondaryIndex({
            indexName: "byTypename",
            partitionKey: {
                name: "typename",
                type: AttributeType.STRING,
            },
            sortKey: {
                name: "sk",
                type: AttributeType.STRING,
            },
            projectionType: ProjectionType.ALL
        });
        coreTable.addGlobalSecondaryIndex({
            indexName: "byUserEmail",
            partitionKey: {
                name: "email",
                type: AttributeType.STRING,
            },
            sortKey: {
                name: "sk",
                type: AttributeType.STRING,
            },
        });
        this.coreTable = coreTable;

        const chatQueueDLQ = new sqs.Queue(this, 'BasemailChatQueueDLQ', {
            visibilityTimeout: Duration.seconds(300),
        });
        const chatQueue = new sqs.Queue(this, 'BasemailChatQueue', {
            visibilityTimeout: Duration.seconds(300),
            deadLetterQueue: {
                queue: chatQueueDLQ,
                maxReceiveCount: 1,
            }
        });

        const discordErrorHandler = new NodejsFunction(this, 'BasemailDiscordErrorHandler', {
            runtime: Runtime.NODEJS_22_X,
            memorySize: 256,
            timeout: Duration.seconds(30),
            onFailure: new SqsDestination(chatQueueDLQ),
            environment: {
                SQS_QUEUE_URL: chatQueueDLQ.queueUrl,
                DISCORD_WEBHOOK_URL: process.env.DISCORD_WEBHOOK_URL as string,
            },
            entry: 'src/lambda/api/discord-error-handler.ts',
            handler: 'handler',
        });
        chatQueueDLQ.grantConsumeMessages(discordErrorHandler)
        discordErrorHandler.addEventSource(new eventsources.SqsEventSource(chatQueueDLQ));

        // Handles connects/disconnects and sends messages to the chat queue
        const chatQueueHandler = new NodejsFunction(this, 'BasemailChatProcessor', {
            runtime: Runtime.NODEJS_22_X,
            memorySize: 256,
            timeout: Duration.seconds(30),
            environment: {
                SQS_QUEUE_URL: chatQueue.queueUrl,
            },
            onFailure: new SqsDestination(chatQueueDLQ),
            entry: 'src/lambda/wss/socket-handler.ts',
            handler: 'handler',
        });
        chatQueue.grantSendMessages(chatQueueHandler)

        const websocketTable = new Table(this, 'BasemailGangWebSocketConnections', {
            partitionKey: { name: 'connectionId', type: AttributeType.STRING },
            timeToLiveAttribute: 'ttl',
            billingMode: BillingMode.PAY_PER_REQUEST,
        });
        this.websocketTable = websocketTable;
        const websocketChatProcessorHandler = new NodejsFunction(this, 'BasemailWebsocketChatProcessorHandler', {
            runtime: Runtime.NODEJS_22_X,
            environment: {
                CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY as string,
                WEBSOCKET_TABLE_NAME: websocketTable.tableName,
            },
            timeout: Duration.minutes(5),
            memorySize: 512,
            onFailure: new SqsDestination(chatQueueDLQ),
            entry: 'src/lambda/wss/queue-handler.ts',
            handler: 'handler',
        });
        websocketChatProcessorHandler.addToRolePolicy(s3Access)
        chatQueue.grantConsumeMessages(websocketChatProcessorHandler)
        websocketChatProcessorHandler.addEventSource(new eventsources.SqsEventSource(chatQueue));

        const websocketIntegration = new WebSocketLambdaIntegration('BasemailChatIntegration', chatQueueHandler);
        const websocketApi = new aws_apigatewayv2.WebSocketApi(this, 'BasemailChatWebSocketApi', {
            apiName: 'ChatWebSocketApi',
            routeSelectionExpression: '$request.body.action',
            description: 'WebSocket API for real-time chat',
            disconnectRouteOptions: {
                integration: websocketIntegration,
            },
            connectRouteOptions: {
                integration: websocketIntegration,
            },
        });

        const websocketStage = new WebSocketStage(this, `BasemailStage`, {
            webSocketApi: websocketApi,
            stageName: "prod",
            autoDeploy: true,
        });

        const connectionsArns = this.formatArn({
            service: 'execute-api',
            resourceName: `${websocketStage.stageName}/POST/*`,
            resource: websocketApi.apiId,
        });
        this.connectionsArns = connectionsArns;

        websocketChatProcessorHandler.addToRolePolicy(
            new PolicyStatement({ actions: ['execute-api:ManageConnections'], resources: [connectionsArns] })
        )
        coreTable.grantReadWriteData(websocketChatProcessorHandler);
        websocketChatProcessorHandler.addToRolePolicy(
            new PolicyStatement({
                actions: [
                    "bedrock:RetrieveAndGenerate",
                    "bedrock:Retrieve",
                    "bedrock:Invoke*",
                    "bedrock:Rerank",
                    "bedrock:GetInferenceProfile",
                    "bedrock:ListInferenceProfiles"
                ],
                resources: ["*"],
            })
        );

        const httpApi = new HttpApi(this, "BasemailHttpApi", {
            apiName: "Basemail Web API",
            corsPreflight: {
                allowMethods: [
                    CorsHttpMethod.GET,
                    CorsHttpMethod.DELETE,
                    CorsHttpMethod.PUT,
                    CorsHttpMethod.PATCH,
                    CorsHttpMethod.POST,
                    CorsHttpMethod.OPTIONS,
                ],
                maxAge: Duration.seconds(300),
                allowOrigins: ["http://localhost:3000", "https://app.basemail.me", "https://staging.basemail.me"],
                allowHeaders: ["Authorization", "Content-Type", "Cache-Control", "ETag", "Access-Control-Allow-Origin", "Access-Control-Allow-Headers", "Access-Control-Allow-Methods"],
                allowCredentials: true,
            },
            disableExecuteApiEndpoint: false,
        })

        const issuer = props?.issuer as string;
        const audience = ["aws"]
        const httpApiAuthorizer = new HttpJwtAuthorizer('BasemailHttpApiAuthorizer', issuer, {
            jwtAudience: audience,
            identitySource: ['$request.header.Authorization'],
        })

        const apiHandler = new NodejsFunction(this, "BasemailApiHandler", {
            runtime: Runtime.NODEJS_22_X,
            handler: "handler",
            memorySize: 256,
            timeout: Duration.seconds(15),
            onFailure: new SqsDestination(chatQueueDLQ),
            environment: {
                CORE_TABLE_NAME: coreTable.tableName,
                CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY as string,
                CLERK_SIGNING_SECRET: process.env.CLERK_SIGNING_SECRET as string,
                WEBSOCKET_TABLE_NAME: websocketTable.tableName,
            },
            entry: 'src/lambda/api/handler.ts',
        });
        coreTable.grantReadWriteData(apiHandler)

        httpApi.addRoutes({
            path: "/v1/mail",
            authorizer: httpApiAuthorizer,
            integration: new HttpLambdaIntegration('MailRoute', apiHandler),
            methods: [HttpMethod.GET, HttpMethod.PUT, HttpMethod.POST, HttpMethod.DELETE],
        });

        httpApi.addRoutes({
            path: "/v1/settings",
            authorizer: httpApiAuthorizer,
            integration: new HttpLambdaIntegration('SettingsRoute', apiHandler),
            methods: [HttpMethod.POST, HttpMethod.GET, HttpMethod.DELETE, HttpMethod.PUT],
        });

        httpApi.addRoutes({
            path: "/v1/clerk",
            authorizer: new HttpNoneAuthorizer(),
            integration: new HttpLambdaIntegration('ClerkRoute', apiHandler),
            methods: [HttpMethod.POST],
        });

        websocketApi.addRoute('sendMessage', {
            integration: new WebSocketLambdaIntegration('SendMessageIntegration', chatQueueHandler),
        });
    }
}
