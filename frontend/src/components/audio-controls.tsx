"use client";

import { useCallback, useState } from "react";

import { useConversation } from '@11labs/react';
import { Email } from "@/utils/schema";
import { Button } from "./ui/button";
import { Play, Pause } from "lucide-react";

export function AudioControls({email}: {email: Email}) {
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



  return (
    <Button
      variant="ghost"
      size="icon"
      className="ml-2 flex-shrink-0 h-full"
      onClick={startConversation}
    >
      
        <Play className="h-4 w-4" />
      
    </Button>
  );
}

