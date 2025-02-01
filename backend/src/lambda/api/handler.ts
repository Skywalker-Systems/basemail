import { ApiGatewayManagementApiClient } from "@aws-sdk/client-apigatewaymanagementapi";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { createClerkClient } from "@clerk/backend";
import { APIGatewayProxyEventV2WithJWTAuthorizer, ClerkUserCreatedEvent, Connection, createApiGatewayResponse, deleteItem, Email, getBaseName, getItem, Inbox, putItem, query, sendMessageToClient, User } from "../../utils/api";
import { handleSendMail, SendMailParams } from "./handle-send-mail";

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const tableName = process.env.CORE_TABLE_NAME as string;
const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY as string });

type RouteHandler = (
    event: APIGatewayProxyEventV2WithJWTAuthorizer,
    docClient: DynamoDBDocumentClient
) => Promise<any>;

const apiGatewayDomainName = process.env.API_GATEWAY_DOMAIN_NAME;
const apiGatewayStage = process.env.API_GATEWAY_STAGE;

const createSendMailPropsFromEvent = (event: APIGatewayProxyEventV2WithJWTAuthorizer): SendMailParams => {
    const mailProps = JSON.parse(event.body as string);
    return mailProps;
}

const routes: Record<string, Record<string, RouteHandler>> = {
    "/v1/mail": {
        GET: async (event, docClient) => {
            const wallet = event.requestContext.authorizer.jwt.claims.wallet as string
            const baseName = await getBaseName(wallet);
            const nakedBaseName = baseName.replace('.base.eth', '');
            console.log("Base name found", baseName);
            console.log("Naked base name", nakedBaseName);
            if (!baseName) {
                console.log("No base name found");
                return createApiGatewayResponse(404, { message: "Inbox not found" });
            }
            const base64NakedInboxId = Buffer.from(nakedBaseName).toString('base64');
            console.log("Base64 inbox id", base64NakedInboxId);
            const sk = `MAPPING#${base64NakedInboxId}#`;
            console.log("Sk", sk);
            const inbox = await getItem<Inbox>("INBOX", sk, docClient, tableName);
            if (!inbox) {
                console.log("Inbox not found");
                return createApiGatewayResponse(404, { message: "Inbox not found" });
            }
            console.log("Inbox found", inbox);
            // Get all mail for this inbox
            const mail = await query<Email>(tableName, {
                condition: 'pk = :pk AND begins_with(sk, :sk)',
                values: {
                    ":pk": `USER#${base64NakedInboxId}`,
                    ":sk": "EMAIL#"
                }
            }, docClient);

            return mail;
        },
        POST: async (event, docClient) => {
            const apigwManagementApi = new ApiGatewayManagementApiClient({
                endpoint: `${apiGatewayDomainName}/${apiGatewayStage}`
            });

            const wallet = event.requestContext.authorizer.jwt.claims.wallet as string
            const baseName = await getBaseName(wallet);
            if (!baseName) {
                console.log("No base name found");
                return createApiGatewayResponse(404, { message: "Inbox not found" });
            }

            const mailProps = createSendMailPropsFromEvent(event);
            // const sendMail = await handleSendMail(mailProps);
            // if (!sendMail.success) {
            //     return createApiGatewayResponse(500, { message: "Mail failed to send" });
            // }

            // We need to get the inboxId for the user they are sending to so we can create the email
            const to = Array.isArray(mailProps.to) ? mailProps.to : [mailProps.to]
            for (const toEmail of to) {
                // Get the user for this toEmail
                const user = await query<User>(tableName, {
                    condition: 'email = :email',
                    values: {
                        ":email": toEmail
                    }
                }, docClient, 'byUserEmail');

                if (!user) {
                    console.log("User not found");
                    continue
                }

                const targetUser = user[0];
                const baseName = await getBaseName(targetUser.wallet);
                if (!baseName) {
                    console.log("No base name found");
                    continue
                }
                const base64BaseName = Buffer.from(baseName).toString('base64');

                // Lookup the inboxId for this 
                const inbox = await getItem<Inbox>("INBOX", `MAPPING#${base64BaseName}#`, docClient, tableName);
                if (!inbox) {
                    console.log("Inbox not found");
                    continue
                }

                // Create the email for the target user
                // We do this for all internal and external emails
                const sendMail = await handleSendMail(mailProps);
                if (!sendMail.success) {
                    console.log("Mail failed to send");
                    continue
                }

                // Find the 
                const connection = await getItem<Connection>("CONNECTION", targetUser.id, docClient, tableName);
                if (!connection) {
                    console.log("No connection found");
                    continue
                }

                // Send message to client
                await sendMessageToClient(apigwManagementApi, connection.connectionId, JSON.stringify(mailProps));

                // await putItem<Email>({
                //     pk: "EMAIL",
                //     sk: `${inbox.id}#${Date.now()}`,
                //     inboxId: inbox.id,
                //     from: mailProps.from,
                //     to: toEmail,
                //     subject: mailProps.subject,
                //     body: mailProps.text,
                //     // Other props
                // }, tableName, docClient);
            }

            return createApiGatewayResponse(200, { message: "Mail created" });
        },
        PUT: async (event, docClient) => {
            // Update document logic
            return createApiGatewayResponse(200, { message: "Mail updated" });
        },
        DELETE: async (event, docClient) => {
            const sub = event.requestContext.authorizer.jwt.claims.sub as string;
            const inbox = await getItem<Inbox>("INBOX", sub, docClient, tableName);
            if (!inbox) {
                return createApiGatewayResponse(404, { message: "Inbox not found" });
            }

            const mailId = event.pathParameters?.mailId as string;
            if (!mailId) {
                return createApiGatewayResponse(400, { message: "Mail ID is required" });
            }

            const mail = await getItem<Email>("EMAIL", `${inbox.id}#${mailId}`, docClient, tableName);
            if (!mail) {
                return createApiGatewayResponse(404, { message: "Mail not found" });
            }

            if (mail.inboxId !== inbox.id) {
                return createApiGatewayResponse(403, { message: "Mail not found in this inbox" });
            }

            await deleteItem<Email>("EMAIL", `${inbox.id}#${mailId}`, tableName, docClient);
            return createApiGatewayResponse(200, { message: "Mail deleted" });
        },
    },
    "/v1/clerk": {
        POST: async (event, docClient) => {
            const apigwManagementApi = new ApiGatewayManagementApiClient({
                endpoint: `${apiGatewayDomainName}/${apiGatewayStage}`
            });
            const body = JSON.parse(event.body as string) as ClerkUserCreatedEvent;

            if (body.type !== "user.created") {
                console.log("Not a user created event");
                return createApiGatewayResponse(200, { message: "Not a user created event" });
            }

            const wallet = body.data.web3_wallets[0].web3_wallet
            console.log(`Wallet found: ${wallet}`);
            if (!wallet) {
                console.log("No wallet found");
                return createApiGatewayResponse(200, { message: "No wallet found" });
            }

            const baseName = await getBaseName(wallet);
            console.log(`Base name found: ${baseName}`);
            const nakedBaseName = baseName.replace('.base.eth', '');
            console.log(`Naked base name: ${nakedBaseName}`);
            if (!baseName) {
                console.log("No base name found");
                // Delete the user
                await clerk.users.deleteUser(body.data.id);
                return createApiGatewayResponse(404, { message: "No base name found" });
            }

            const base64NakedInboxId = Buffer.from(nakedBaseName).toString('base64');
            const clerkUserId = body.data.id;
            const emailFromBaseName = `${nakedBaseName}@basemail.me`;

            await putItem<User>({
                pk: "USER",
                sk: clerkUserId,
                inboxId: base64NakedInboxId,
                wallet: wallet ?? undefined,
                id: clerkUserId,
                name: baseName,
                typename: "User",
                email: emailFromBaseName,
                context: "",
            }, tableName, docClient);

            // Create inbox
            const sk = `MAPPING#${base64NakedInboxId}#`;
            await putItem<Inbox>({
                pk: "INBOX",
                sk: sk,
                id: base64NakedInboxId,
                name: baseName,
                createdAt: new Date().toISOString(),
                createdBy: clerkUserId,
                blockedAddresses: [],
                companyId: "",
                email: emailFromBaseName,
                typename: "Inbox",
            }, tableName, docClient);

            // Send welcome email
            const emailId = crypto.randomUUID();
            const base64From = Buffer.from('no-reply@basemail.me').toString('base64');
            const base64To = Buffer.from(nakedBaseName).toString('base64');

            const email: Email = {
                pk: `USER#${base64To}`,
                sk: `EMAIL#${base64From}#${emailId}`,
                inboxId: base64NakedInboxId,
                agentSystemPrompt: "",
                firstMessageFromAgent: "",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                typename: "Email",
                date: new Date().toISOString(),
                from: 'welcome@basemail.me',
                to: nakedBaseName,
                subject: `Welcome to Base Mail ${baseName}`,
                body: `Welcome to Base Mail ${baseName} - ... Other information ...`,
                read: false,
                attachments: [],
                tags: [],
                links: [],
                summarizedEmail: "",
            }
            await putItem<Email>(email, tableName, docClient);

            // Get the connection for the user (they might not be online)
            const connection = await getItem<Connection>("CONNECTION", clerkUserId, docClient, tableName);
            if (!connection) {
                console.log("No connection found");
                return createApiGatewayResponse(200, { message: "No connection found" });
            }

            // Send message to client
            await sendMessageToClient(apigwManagementApi, connection.connectionId, JSON.stringify(email));
            return createApiGatewayResponse(200, { message: "Clerk created" });
        },
    },
};

export async function handler(event: APIGatewayProxyEventV2WithJWTAuthorizer) {
    try {
        console.log(JSON.stringify(event, null, 2));
        const path = event.rawPath;
        const method = event.requestContext.http.method;

        const routeHandlers = routes[path];
        if (!routeHandlers) {
            console.log(`Route not found: ${path}`);
            return createApiGatewayResponse(404, { message: "Route not found" });
        }

        const handler = routeHandlers[method];
        if (!handler) {
            console.log(`Method not allowed: ${method}`);
            return createApiGatewayResponse(405, { message: "Method not allowed" });
        }

        const result = await handler(event, docClient);
        console.log("Result", JSON.stringify(result, null, 2));
        return createApiGatewayResponse(200, result);
    } catch (error) {
        console.error(error);
        return createApiGatewayResponse(500, { message: "Internal server error" });
    }
}
