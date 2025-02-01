
import { Duration, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Effect, PolicyStatement, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { CnameRecord, HostedZone, MxRecord } from 'aws-cdk-lib/aws-route53';
import { BlockPublicAccess, Bucket, BucketEncryption, EventType } from 'aws-cdk-lib/aws-s3';
import { LambdaDestination } from 'aws-cdk-lib/aws-s3-notifications';
import { CfnEmailIdentity, ReceiptRule, ReceiptRuleSet } from 'aws-cdk-lib/aws-ses';
import * as actions from 'aws-cdk-lib/aws-ses-actions';
import { Construct } from 'constructs';

type MailStackProps = StackProps & {
    coreTableName: string;
    knowledgeBaseBucketName: string;
    websocketTableName: string;
    websocketConnectionsArn: string;
    apiGatewayDomainName: string;
    apiGatewayStage: string;
}

export class basemailStack extends Stack {
    constructor(scope: Construct, id: string, props: MailStackProps) {
        super(scope, id, props);

        const domainName = 'basemail.me';
        const hostedZoneId = 'Z0259774ZST50M79C1BU';

        // Load the Hosted Zone (root domain)
        const hostedZone = HostedZone.fromHostedZoneAttributes(this, 'HostedZone', {
            hostedZoneId: hostedZoneId,
            zoneName: domainName,
        });

        // Create S3 bucket to store incoming emails (ensure same region as SES)
        const mailBucket = new Bucket(this, 'MailBucket', {
            encryption: BucketEncryption.S3_MANAGED,
            blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
            removalPolicy: RemovalPolicy.DESTROY,
        });

        // Attach a bucket policy to allow SES to write to the S3 bucket
        mailBucket.addToResourcePolicy(
            new PolicyStatement({
                effect: Effect.ALLOW,
                principals: [new ServicePrincipal('ses.amazonaws.com')],
                actions: ['s3:PutObject'],
                resources: [mailBucket.arnForObjects('*')],
                conditions: {
                    StringEquals: {
                        'aws:SourceAccount': this.account,
                    }
                },
            })
        );

        const sesIdentity = new CfnEmailIdentity(this, 'SESSubdomainIdentity', {
            emailIdentity: domainName,
        });

        new MxRecord(this, 'MXRecordSet', {
            zone: hostedZone,
            recordName: domainName, // Subdomain
            values: [
                {
                    priority: 10,
                    hostName: `inbound-smtp.${this.region}.amazonaws.com`,  // Ensure correct region
                },
            ],
            ttl: Duration.minutes(5),
        });

        const dkimTokens = [
            sesIdentity.attrDkimDnsTokenName1,
            sesIdentity.attrDkimDnsTokenName2,
            sesIdentity.attrDkimDnsTokenName3,
        ];

        dkimTokens.forEach((token, index) => {
            token &&
                new CnameRecord(this, `DKIMCnameRecord${index}`, {
                    zone: hostedZone,
                    recordName: `${token}._domainkey.${domainName}`,
                    domainName: `${token}.dkim.amazonses.com`,
                    ttl: Duration.minutes(5),
                });
        });

        const receiptRuleSet = new ReceiptRuleSet(this, 'ReceiptRuleSet', {
            receiptRuleSetName: 'BasemailSubdomainRuleSet',
        });

        const receiptRule = new ReceiptRule(this, 'BasemailReceiptRule', {
            ruleSet: receiptRuleSet,
            recipients: [domainName], // Only listen for emails on the domain
            actions: [
                new actions.S3({
                    bucket: mailBucket,
                    objectKeyPrefix: 'inboxes/',
                }),
            ],
            enabled: true,
            scanEnabled: true,
        });

        // Handler for emails
        const mailHandler = new NodejsFunction(this, 'MailHandler', {
            runtime: Runtime.NODEJS_22_X,
            environment: {
                CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY as string,
                CORE_TABLE_NAME: props.coreTableName,
                KNOWLEDGE_BASE_BUCKET: props.knowledgeBaseBucketName,
                WEBSOCKET_TABLE_NAME: props.websocketTableName,
                API_GATEWAY_DOMAIN_NAME: props.apiGatewayDomainName,
                API_GATEWAY_STAGE: props.apiGatewayStage,
            },
            timeout: Duration.minutes(1),
            memorySize: 512,
            entry: 'src/lambda/email/handler.ts',
            handler: 'handler',
        });
        mailHandler.addToRolePolicy(
            new PolicyStatement({ actions: ['execute-api:ManageConnections'], resources: [props.websocketConnectionsArn] })
        )

        mailHandler.addToRolePolicy(new PolicyStatement({
            actions: ['ses:SendEmail'],
            resources: ['*'],
        }));
        mailHandler.addToRolePolicy(
            new PolicyStatement({
                actions: ['s3:PutObject'],
                resources: ['arn:aws:s3:::*/*'],
            })
        );
        mailHandler.addToRolePolicy(
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
        mailBucket.grantReadWrite(mailHandler);
        // allow dynamo read write access to any table
        mailHandler.addToRolePolicy(new PolicyStatement({
            actions: ['dynamodb:PutItem', 'dynamodb:GetItem', 'dynamodb:Query', 'dynamodb:UpdateItem', 'dynamodb:DeleteItem'],
            resources: ['*'],
        }));

        mailBucket.addEventNotification(EventType.OBJECT_CREATED_PUT, new LambdaDestination(mailHandler));
    }
}
