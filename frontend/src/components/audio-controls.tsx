"use client";

import { useCallback, useState } from "react";

import { Email } from "@/utils/schema";
import { useConversation } from '@11labs/react';
import { Pause, Play } from "lucide-react";
import { Button } from "./ui/button";

export function AudioControls({ email }: { email: Email }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const { startSession, endSession, status } = useConversation({});
  console.log('status', status);

  const startConversation = useCallback(async () => {
    console.log('startConversation');
    try {

      setIsPlaying(true);

      await startSession({
        agentId: 'Db33847ZGx21LmP9qfrT',
        overrides: {
          agent: {
            firstMessage: email.firstMessageFromAgent,
            prompt: {
              prompt: email.agentSystemPrompt,
            },
          },
        },
      });

    } catch (error) {
      console.error('Error starting conversation:', error);
      setIsPlaying(false);
    }
  }, [startSession, email.firstMessageFromAgent, email.agentSystemPrompt]);

  const endConversation = useCallback(async () => {
    console.log('endConversation');
    await endSession();
    setIsPlaying(false);
  }, [endSession]);

  return (
    <Button
      variant="ghost"
      size="icon"
      className="ml-2 flex-shrink-0 h-full"
      onClick={isPlaying ? endConversation : startConversation}
    >
      {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
    </Button>
  );
}

