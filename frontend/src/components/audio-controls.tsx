"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function AudioControls() {
  // State for controlling the open/closed voice chat window
  const [isOpen, setIsOpen] = useState(false);
  // States to simulate speaking indicators
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  // State to pause/resume the agent's activity
  const [isPaused, setIsPaused] = useState(false);

  // Handlers for voice input simulation
  const handleStartVoiceInput = () => {
    // Start voice input (simulate user speaking)
    setIsUserSpeaking(true);
  };

  const handleStopVoiceInput = () => {
    // Stop voice input and simulate agent processing
    setIsUserSpeaking(false);
    setIsAgentSpeaking(true);
    setTimeout(() => setIsAgentSpeaking(false), 2000);
  };

  const togglePause = () => setIsPaused((prev) => !prev);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            key="voiceChatWindow"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className="bg-white shadow-lg rounded-lg p-4 w-80"
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Inbox Voice Agent</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                &#x2715;
              </button>
            </div>

            {/* Speaking indicators */}
            <div className="space-y-2 mb-4">
              {/* Agent Speaking Indicator */}
              <motion.div
                animate={{
                  scale: isAgentSpeaking ? [1, 1.2, 1] : 1,
                  opacity: isAgentSpeaking ? [0.8, 1, 0.8] : 1,
                }}
                transition={{ duration: 0.8, repeat: isAgentSpeaking ? Infinity : 0 }}
                className="flex items-center space-x-2"
              >
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                <span className="text-sm">
                  Agent {isPaused ? "is paused" : "is speaking..."}
                </span>
              </motion.div>

              {/* User Speaking Indicator */}
              <motion.div
                animate={{
                  scale: isUserSpeaking ? [1, 1.2, 1] : 1,
                  opacity: isUserSpeaking ? [0.8, 1, 0.8] : 1,
                }}
                transition={{ duration: 0.8, repeat: isUserSpeaking ? Infinity : 0 }}
                className="flex items-center space-x-2"
              >
                <div className="w-3 h-3 bg-blue-500 rounded-full" />
                <span className="text-sm">User is speaking...</span>
              </motion.div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between">
              {/* Voice Input Control */}
              <button
                onMouseDown={handleStartVoiceInput}
                onMouseUp={handleStopVoiceInput}
                className="px-3 py-1 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition"
              >
                Hold to Speak
              </button>

              {/* Pause/Resume Agent */}
              <button
                onClick={togglePause}
                className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 transition"
              >
                {isPaused ? "Resume Agent" : "Pause Agent"}
              </button>
            </div>
          </motion.div>
        ) : (
          // Floating "Voice Chat" button when closed
          <motion.button
            key="voiceChatButton"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => setIsOpen(true)}
            className="bg-blue-500 text-white p-3 rounded-full shadow-lg hover:bg-blue-600 focus:outline-none"
          >
            Voice Chat
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}


