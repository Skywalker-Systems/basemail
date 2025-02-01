import { ApiGatewayManagementApiClient } from "@aws-sdk/client-apigatewaymanagementapi";
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { SendEmailCommand, SESClient } from "@aws-sdk/client-ses";
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import { Attachment, ParsedMail, simpleParser } from 'mailparser';
import { Readable } from 'stream';
import { v4 as uuidv4 } from 'uuid';
import { Email, putItem, query, sendMessageToClient, User } from '../../utils/api';

// const clerkSecretKey = process.env.CLERK_SECRET_KEY as string;
const s3Client = new S3Client({ region: process.env.AWS_REGION });
const s3ClientUsEast1 = new S3Client({ region: 'us-east-1' });
const webSocketTableName = process.env.WEBSOCKET_TABLE_NAME as string;
const dynamoClient = new DynamoDBClient({ region: 'eu-west-1' }); // This table is in eu-west-1
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const tableName = process.env.CORE_TABLE_NAME as string;
// const clerkClient = createClerkClient({ secretKey: clerkSecretKey });
const sesClient = new SESClient({ region: process.env.AWS_REGION });
const bedrockClient = new BedrockRuntimeClient({ region: 'us-east-1' });
const apiGatewayDomainName = process.env.API_GATEWAY_DOMAIN_NAME;
const apiGatewayStage = process.env.API_GATEWAY_STAGE;

export const getModelId = (modelId: string) => {
    switch (modelId) {
        case "am-1":
            return "us.anthropic.claude-3-5-sonnet-20241022-v2:0"
        case "am-2":
            return "us.anthropic.claude-3-5-haiku-20241022-v1:0"
        default:
            return "us.anthropic.claude-3-5-haiku-20241022-v1:0"
    }
}

export async function handler(event: any) {
    console.log('Starting email processing handler');
    console.log('Event:', JSON.stringify(event));
    const apigwManagementApi = new ApiGatewayManagementApiClient({
        endpoint: `${apiGatewayDomainName}/${apiGatewayStage}`, logger: console
    });

    for (const record of event.Records) {
        console.log('Processing record:', JSON.stringify(record));
        // Get bucket and object key from the event
        const bucketName = record.s3.bucket.name;
        const objectKey = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
        console.log(`Processing email from bucket: ${bucketName}, key: ${objectKey}`);

        try {
            const getObjectParams = {
                Bucket: bucketName,
                Key: objectKey,
            };

            console.log(`Getting email object from S3: ${getObjectParams.Key}`);
            const getObjectCommand = new GetObjectCommand(getObjectParams);
            const emailObject = await s3Client.send(getObjectCommand);

            // Read the email content
            const emailContent = await streamToString(emailObject.Body as Readable);

            // Parse the email
            console.log('Parsing email content...');
            const parsedEmail = await simpleParser(emailContent);
            console.log('Email parsed successfully. Subject:', parsedEmail.subject);
            console.log(`Full Email: ${JSON.stringify(parsedEmail)}`);

            // Extract the 'To' address
            const toAddress = Array.isArray(parsedEmail.to)
                ? parsedEmail.to[0]?.text
                : parsedEmail.to?.value[0]?.address || '';
            console.log(`To address: ${toAddress}`);
            const fromAddress = Array.isArray(parsedEmail.from)
                ? parsedEmail.from[0]?.text
                : parsedEmail.from?.value[0]?.address || '';
            console.log(`From address: ${fromAddress}`);

            const baseName = toAddress.split('@')[0];
            const base64From = Buffer.from(fromAddress).toString('base64');
            const base64To = Buffer.from(baseName).toString('base64');
            console.log(`Email details - From: ${fromAddress}, To: ${toAddress}`);

            // console.log(`User's primary email: ${usersPrimaryEmail}`);
            let user: User | null = null;
            const userLookup = await query<User>(tableName, {
                condition: 'email = :email',
                values: {
                    ':email': `${base64From}@basemail.me`,
                    ':typename': 'User',
                },
                filter: 'typename = :typename',
            }, docClient, 'byUserEmail');

            if (userLookup.length === 0) {
                console.log(`No user found for email: ${base64From}`);
                user = null
            } else {
                user = userLookup[0];
                console.log(`Found user in DynamoDB: ${user.id}`);
            }

            // Process the email content and attachments
            console.log('Starting email and attachment processing...');
            const { processedAttachments, rejectedAttachments } = await processEmail(parsedEmail, base64To, user, apigwManagementApi);
            console.log(`Processed ${processedAttachments.length} attachments, rejected ${rejectedAttachments.length} attachments`);

            console.log('Email processing completed successfully.');
        } catch (error) {
            console.error('Error processing email:', error);
            console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace available');
            throw error;
        }
    }
}

async function handleAutomatedResponse(fromAddress: string, usersPrimaryEmail: string, rejectedAttachments: Attachment[], user: User) {
    const emailParams = {
        Source: `${user.name} <${user.name}@basemail.me>`,
        Destination: {
            ToAddresses: [fromAddress],
        },
        Message: {
            Subject: {
                Data: `Automated response`,
            },
            Body: {
                Text: {
                    Data: `Automated response`,
                },
            },
        },
    };

    try {
        await sesClient.send(new SendEmailCommand(emailParams));
        console.log(`Rejection email sent to ${usersPrimaryEmail}`);
    } catch (error) {
        console.error('Error sending rejection email:', error);
    }
}

// Function to convert stream to string
async function streamToString(stream: Readable): Promise<string> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
        stream.on('error', reject);
    });
}

// Function to process email content and attachments
async function processEmail(email: ParsedMail, inboxId: string, user: User | null, apigwManagementApi: ApiGatewayManagementApiClient) {
    console.log('Starting email processing...');
    console.log(`Processing email for inbox: ${inboxId}, user: ${user?.id}`);

    // Save email metadata and body to DynamoDB
    const emailId = uuidv4();
    console.log(`Generated email ID: ${emailId}`);

    let emailTo = '';
    if (Array.isArray(email.to)) {
        emailTo = email.to[0].text;
    } else if (email.to) {
        emailTo = email.to.text;
    }
    console.log(`Normalized 'to' address: ${emailTo}`);

    // duplicates from above
    const base64From = Buffer.from(email.from?.text || '').toString('base64');
    const rawBaseName = emailTo.split('@')[0];
    console.log(`Raw base name: ${rawBaseName}`);
    const base64To = Buffer.from(rawBaseName).toString('base64');
    console.log('Creating email item in DynamoDB...');

    const emailItem: Email = {
        updatedAt: new Date().toISOString(),
        pk: `USER#${base64To}`,
        summarizedEmail: '',
        read: false,
        sk: `EMAIL#${base64From}#${emailId}`,
        from: email.from?.text || '',
        rawAddress: email.from?.value[0]?.address || '',
        inboxId,
        typename: 'Email',
        to: emailTo || '',
        agentSystemPrompt: '',
        firstMessageFromAgent: '',
        links: [],
        tags: [],
        attachments: [],
        subject: email.subject || '',
        date: email.date?.toISOString() || new Date().toISOString(),
        body: email.text || '',
        createdAt: new Date().toISOString(),
    };

    console.log('Optimizing email content...');
    const optimizedContent = optimizeEmailContent(email);
    const sanitizedSubject = sanitizeFileName(email.subject || '');
    const sanitizedFrom = sanitizeFileName(Array.isArray(email.from) ? email.from[0]?.text : email.from?.text || '');
    console.log(`Sanitized filename components - Subject: ${sanitizedSubject}, From: ${sanitizedFrom}`);

    // Create the filename using sanitized strings
    const optimizedContentFileName = `email-${sanitizedSubject}-${sanitizedFrom}`;
    console.log(`Generated optimized content filename: ${optimizedContentFileName}`);

    // Construct the S3 key
    const optimizedContentKey = `emails/${base64To}/${emailId}/${optimizedContentFileName}`;
    emailItem.optimizedContentKey = optimizedContentKey;
    console.log(`S3 key for optimized content: ${optimizedContentKey}`);

    console.log('Uploading email text and metadata...');
    await uploadFileEmailText(base64To, optimizedContent, optimizedContentFileName, 'txt');
    await createMetadata(base64To, optimizedContentFileName, 'txt');
    console.log('Email text and metadata uploaded successfully');

    // Process attachments
    let rejectedAttachments: Attachment[] = [];
    let processedAttachments: Attachment[] = [];
    if (email.attachments && email.attachments.length > 0) {
        console.log(`Processing ${email.attachments.length} attachments...`);
        for (const attachment of email.attachments) {
            console.log(`Processing attachment: ${attachment.filename}, type: ${attachment.contentType}, size: ${attachment.size}`);

            if (!['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(attachment.contentType)) {
                console.log(`Rejecting attachment ${attachment.filename} - unsupported content type: ${attachment.contentType}`);
                rejectedAttachments.push(attachment);
                continue;
            }

            const attachmentKey = `documents/${base64To}/${emailId}/${attachment.filename}`;
            console.log(`Generated S3 key for attachment: ${attachmentKey}`);

            emailItem.attachments.push({
                filename: attachment.filename || '',
                contentType: attachment.contentType || '',
                size: attachment.size,
                s3Key: attachmentKey,
            });

            console.log('Creating document record in DynamoDB...');
            const document = await putItem({
                pk: `USER#${base64To}`,
                sk: `DOCUMENT#${base64From}#${emailId}`,
                id: emailId,
                email: base64From,
                name: attachment.filename || '',
                createdAt: new Date().toISOString(),
                s3Key: `documents/${base64To}/${emailId}/${attachment.filename}`,
                createdBy: base64To,
                typename: 'Document',
                read: false
            }, tableName, docClient);

            const uploadKey = document?.s3Key;
            if (!uploadKey) {
                console.error(`Failed to get upload URL for attachment ${attachment.filename}`);
                throw new Error(`Failed to create document for attachment ${attachment.filename}`);
            }

            console.log(`Uploading attachment to S3: ${attachment.filename}`);
            await uploadAttachmentToS3(attachment, uploadKey);
            console.log(`Successfully uploaded attachment: ${attachment.filename}`);
            processedAttachments.push(attachment);
        }

        console.log('All attachments processed.');
    }

    console.log('Saving email item to DynamoDB...');
    console.log('Email item saved successfully');

    console.log('Starting knowledge base ingestion...');
    const userMessage = await createSummarizedEmail(emailItem.body, emailItem.from, user);
    console.log(`User message: ${JSON.stringify(userMessage)}`);

    // Inject the user message into the email item
    emailItem.tags = userMessage.tags;
    emailItem.links = userMessage.links;
    emailItem.firstMessageFromAgent = userMessage.firstMessageFromAgent;
    emailItem.agentSystemPrompt = userMessage.systemPrompt;
    emailItem.summarizedEmail = userMessage.summarizedEmail;

    console.log('Saving email item to DynamoDB...');
    await putItem(emailItem, tableName, docClient);
    console.log('Email item saved successfully');

    // Get the connection for the user
    const connectionCommand = new GetCommand({
        TableName: webSocketTableName,
        Key: {
            connectionId: `USER#${base64To}`
        }
    });
    const { Item: connection } = await docClient.send(connectionCommand);
    if (!connection) {
        console.log(`No connection found for user ${user?.id}`);
        return {
            processedAttachments: processedAttachments,
            rejectedAttachments: rejectedAttachments
        }
    }

    console.log(`Sending email item to client: ${JSON.stringify(emailItem)}`);
    await sendMessageToClient(apigwManagementApi, connection.connectionId, JSON.stringify(userMessage));

    console.log(`Email processing completed. Processed ${processedAttachments.length} attachments, rejected ${rejectedAttachments.length} attachments`);
    return {
        processedAttachments: processedAttachments,
        rejectedAttachments: rejectedAttachments
    }
}

async function invokeModel<T>(payload: {
    anthropic_version: string;
    max_tokens: number;
    temperature: number;
    top_p: number;
    system: string;
    messages: {
        role: string;
        content: {
            type: string;
            text: string;
        }[];
    }[];
}): Promise<T> {
    try {
        const invokeCommand = new InvokeModelCommand({
            modelId: getModelId('quick'),
            body: JSON.stringify(payload),
            contentType: "application/json",
        });

        const response = await bedrockClient.send(invokeCommand);
        const decodedResponseBody = new TextDecoder().decode(response.body);
        const responseBody = JSON.parse(decodedResponseBody);
        console.log(`Response body: ${JSON.stringify(responseBody)}`);

        // Extract the text content
        const rawText = responseBody.content[0].text;

        // Additional sanitization steps
        const sanitizedText = rawText
            .replace(/[\n\r\t\b\f\v]/g, ' ') // Replace control characters with spaces
            .replace(/\s+/g, ' ') // Collapse multiple spaces
            .replace(/"\s*([^"]*?)\s*([^"]*?)\s*"(\s*<[^>]*>)/g, (match: string, p1: string, p2: string, p3: string) => {
                // Handle cases like "Flynn Bundy" <email> by escaping properly
                return `"${p1} ${p2}"${p3}`;
            })
            .replace(/\\"/g, '"') // Remove escaped quotes
            .replace(/"{2,}/g, '"') // Replace multiple quotes with single quotes
            .trim();

        try {
            return JSON.parse(sanitizedText) as T;
        } catch (parseError) {
            console.error('Failed to parse sanitized text:', sanitizedText);
            console.error('Parse error:', parseError);

            // Last resort: try to fix common JSON structural issues
            const structurallyFixedText = sanitizedText
                .replace(/([{,]\s*)"([^"]+)"(\s*<[^>]*>)"/g, '$1"$2$3"') // Fix email format issues
                .replace(/([{,]\s*)([^"{\s][^:]*?):/g, '$1"$2":') // Ensure property names are quoted
                .replace(/:\s*"([^"]*?)\s*<([^>]*?)>"/g, ':"$1 <$2>"'); // Fix email format

            return JSON.parse(structurallyFixedText) as T;
        }
    } catch (error) {
        console.error(`Failed to summarize conversation: ${error}`);
        throw error;
    }
}

interface UserMessageResponse {
    from: string;
    tags: string[];
    agentSystemPrompt: string;
    summarizedEmail: string;
    firstMessageFromAgent: string;
    systemPrompt: string;
    links: string[];
    type: string;
}

async function createSummarizedEmail(emailContent: string, sentFromEmail: string, user: User | null) {
    console.log(`Invoking model for user message... with sentFromEmail: ${sentFromEmail} and emailContent: ${emailContent} and user: ${user?.name}`)
    const payload = generateUserMessagePayload(
        emailContent,
        sentFromEmail,
        user
    );

    console.log(`Invoking model with payload: ${JSON.stringify(payload)}`);
    const response = await invokeModel<UserMessageResponse>(payload);
    return response;
}

function generateUserMessagePayload(
    emailContent: string,
    sentFromEmail: string,
    user: User | null
) {
    const systemPrompt = `You are an expert email summarizer. Your task is to summarize and extract key information from the email, consider names, places, amounts and other important details. Always include tags relevent to the email content. Your output MUST be in the following JSON format without any text or comments before or after the JSON:

  {
    "from": "The person who sent the email",
    "firstMessageFromAgent": "Your first message to the user, considering the user context.",
    "systemPrompt": "The system prompt that will be passed to the voice agent, it should include your specific take on the content of the email, considering your experience and the user context along with all the information about the host and the user.",
    "summarizedEmail": "A detailed summarization of the email content, highlighting the most important parts and key points.",
    "type": "email",
    "tags": ["List of tags to categorize the email"],
    "links": ["List of links to relevant information in the email"]
  }
  `;
    const userContext = user?.context || '';
    const firstName = user?.name || '';

    const payload = {
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 4096,
        temperature: 0.5,
        top_p: 0.9,
        system: systemPrompt,
        messages: [
            {
                role: "user",
                content: [
                    {
                        type: "text",
                        text: `
<instructions>
- An email was sent from ${sentFromEmail} to you (${user?.name})
- Think step by step and fully understand the email content as you will be discussing it with the user.
- Create a detailed summarization and highlight the most important parts of the email, ensuring all names and key points are extracted. 
- Add your own thoughts and reasoning to the summarization, ensuring it is tailored to the user context.
- The end consumer of your summarization is the user defined in the <user_context> so ensure its tailored to that user context.
- If the email contains any links, extract them and add them to the links array.
</instructions>

<email_content>
${emailContent}
</email_content>

<sent_from_email>
The email was sent from: ${sentFromEmail} (Attempt to extract the name of the sender from the email address - if you can't, just use the email address). Format this as "First Name Last Name" or just "First Name" without the email address.
</sent_from_email>

<user_context>
First name: ${firstName}
Context: ${userContext}
</user_context>


You will be creating a JSON response that will be used by a voice agent to discuss the email content with the user (${user?.name}). You will start the conversation with the user so you should generate a first message to the user mention that you just got an email from <sent_from_email>, you would then ask if they want to discuss the email. The system prompt will be what the voice agent uses as its system prompt so ensure it contains all important information about the email.

Your response MUST be in the following JSON format without any text or comments before or after the JSON:

{
  "from": "Who the email is from, as a simple name string",
  "type": "email",
  "firstMessageFromAgent": "Your first message to the user, considering the user context.",
  "systemPrompt": "You (${user?.name}) just recevied this email from ${sentFromEmail}. You are now talking with the user (${user?.name}) and giving them an overview of the email that you received, its key to remember that ${user?.name} did not receive the email, you did. You are a voice agent that will be talking to the user and giving them a summary of the email that you received. This system prompt is the system prompt that will be passed to the voice agent, it should include your specific take and insights on the content of the email, considering your experience and the user context.",
  "links": ["List of links to relevant information in the email"]
}
`
                    }
                ]
            }
        ]
    };

    return payload;
}

function startKnowledgeBaseIngestion(inboxId: string, createdBy: string) {
    console.log(`Starting knowledge base ingestion for inbox ${inboxId} and createdBy ${createdBy}`);
}

// Helper function to strip HTML tags from a string
function stripHtmlTags(str: string): string {
    // Remove HTML tags and convert HTML entities
    return str.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ');
}

// Function to optimize email content
function optimizeEmailContent(email: ParsedMail): string {
    // Initialize an array to hold different parts of the email
    const emailParts: string[] = [];

    // Include headers like Subject, From, To, Date
    if (email.subject) {
        emailParts.push(`Subject: ${email.subject}`);
    }
    if (email.from?.text) {
        emailParts.push(`From: ${email.from.text}`);
    }
    if (email.to) {
        const toText = Array.isArray(email.to)
            ? email.to.map(addr => addr.text).join(', ')
            : email.to.text;
        emailParts.push(`To: ${toText}`);
    }
    if (email.date) {
        emailParts.push(`Date: ${email.date.toISOString()}`);
    }

    // Add information about attachments if they exist
    if (email.attachments && email.attachments.length > 0) {
        const attachmentNames = email.attachments
            .map(attachment => attachment.filename)
            .filter(Boolean);
        emailParts.push(`Attachments: ${attachmentNames.join(', ')}`);
    }

    // Separate headers from body with a new line
    emailParts.push('');

    // Get the email body
    let body = email.text || '';

    // If email.text is empty, try to extract text from email.html
    if (!body && email.html) {
        body = stripHtmlTags(email.html);
    } else {
        body = stripHtmlTags(body);
    }

    // Optimize spacing: replace multiple whitespace characters with a single space
    body = body.replace(/\s+/g, ' ').trim();

    // Add the optimized body to the email parts
    emailParts.push(body);

    // Join all parts with a newline character
    const optimizedContent = emailParts.join('\n');

    return optimizedContent;
}

// Helper function to sanitize strings for use in filenames
function sanitizeFileName(input: string): string {
    // Remove any characters that are not alphanumeric, space, hyphen, or underscore
    let sanitized = input.replace(/[^a-zA-Z0-9 \-_\.]/g, '');
    // Replace spaces and underscores with hyphens
    sanitized = sanitized.replace(/[\s_]+/g, '-');
    // Trim hyphens from the start and end
    sanitized = sanitized.replace(/^-+|-+$/g, '');
    // Limit the length to avoid overly long filenames
    sanitized = sanitized.substring(0, 50); // Adjust length as needed
    return sanitized;
}

const createMetadata = async (createdBy: string, name: string, extension: string) => {
    const metadata = {
        metadataAttributes: {
            "documentType": "email",
            "createdBy": createdBy,
            "uploadedAt": new Date().toISOString(),
        }
    }
    const metadataKey = `attachments/${name}_${createdBy}.${extension}.metadata.json`

    console.log(`Uploading metadata file to ${metadataKey}`)
    const uploadMetadata = new PutObjectCommand({
        Bucket: process.env.KNOWLEDGE_BASE_BUCKET,
        Key: metadataKey,
        Body: JSON.stringify(metadata),
        ContentType: "application/json",
    })
    await s3ClientUsEast1.send(uploadMetadata);
}

const uploadFileEmailText = async (createdBy: string, optimizedContent: string, name: string, extension: string) => {
    const key = `attachments/${name}_${createdBy}.${extension}`

    const uploadFile = new PutObjectCommand({
        Bucket: process.env.KNOWLEDGE_BASE_BUCKET,
        Key: key,
        Body: optimizedContent,
        ContentType: "text/plain",
    })
    await s3ClientUsEast1.send(uploadFile);
}

async function uploadAttachmentToS3(attachment: Attachment, uploadKey: string): Promise<void> {
    console.log(`Starting S3 upload for attachment: ${attachment.filename}`);
    try {
        // Ensure the attachment content is a Buffer
        const content = attachment.content;

        if (!Buffer.isBuffer(content)) {
            console.error('Attachment content is not a Buffer');
            throw new Error('Attachment content is not a Buffer.');
        }

        console.log(`Uploading to S3. Content length: ${content.length}, Content type: ${attachment.contentType}`);
        const uploadFile = new PutObjectCommand({
            Bucket: process.env.KNOWLEDGE_BASE_BUCKET,
            Key: uploadKey,
            Body: content,
            ContentType: attachment.contentType || 'application/octet-stream',
        })
        await s3ClientUsEast1.send(uploadFile);
    } catch (error) {
        console.error(`Error uploading attachment ${attachment.filename}:`, error);
        console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace available');
        throw error;
    }
}
