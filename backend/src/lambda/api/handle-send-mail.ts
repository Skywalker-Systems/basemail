import { SESClient, SendEmailCommand, SendEmailCommandInput } from "@aws-sdk/client-ses";

const sesClient = new SESClient({ region: process.env.AWS_REGION });

export interface SendMailParams {
    to: string[];
    from: string;
    subject: string;
    html?: string;
    text?: string;
    replyTo?: string[];
    cc?: string[];
    bcc?: string[];
}

export async function handleSendMail(params: SendMailParams) {
    if (!params.html && !params.text) {
        throw new Error("Either HTML or text content must be provided");
    }

    const input: SendEmailCommandInput = {
        Source: params.from,
        Destination: {
            ToAddresses: params.to,
            CcAddresses: params.cc,
            BccAddresses: params.bcc
        },
        Message: {
            Subject: {
                Data: params.subject,
                Charset: "UTF-8"
            },
            Body: {
                ...(params.html && {
                    Html: {
                        Data: params.html,
                        Charset: "UTF-8"
                    }
                }),
                ...(params.text && {
                    Text: {
                        Data: params.text,
                        Charset: "UTF-8"
                    }
                })
            }
        },
        ...(params.replyTo && { ReplyToAddresses: params.replyTo })
    };

    try {
        const command = new SendEmailCommand(input);
        const response = await sesClient.send(command);
        return {
            success: true,
            messageId: response.MessageId
        };
    } catch (error) {
        console.error("Failed to send email:", error);
        throw error;
    }
}
