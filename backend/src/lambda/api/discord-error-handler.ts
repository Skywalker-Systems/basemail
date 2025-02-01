
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

export const handler: any = async (event: any) => {
  for (const record of event.Records) {
    try {

      const messageBody = record.body;
      const discordMessage = formatMessage(messageBody);

      await sendToDiscord(discordMessage);

    } catch (error) {
      console.error('Error processing SQS record', error);
    }
  }
};

function formatMessage(message: string): any {
  const embed = {
    title: "New Error from basemail",
    description: message,
    color: 0x0099ff,
    timestamp: new Date().toISOString(),
    footer: {
      text: 'basemail SQS to Discord Hook',
    },
  };

  return { embeds: [embed] };
}

async function sendToDiscord(message: any) {
  if (!DISCORD_WEBHOOK_URL) {
    throw new Error('Discord webhook URL not configured');
  }

  await fetch(DISCORD_WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });
}
