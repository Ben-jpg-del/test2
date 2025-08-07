"use client";

import React, { useState } from "react";
import { CanvasRevealEffect } from "@/components/ui/canvas-effect";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Send } from 'lucide-react';

export function Chatbot() {
  const [hovered, setHovered] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState("");

  /* ——— endpoint URLs ——— */
  const SUBMIT_URL = 'https://benzh88.app.n8n.cloud/webhook/6b09d0aa-a903-4239-a2bb-9cbff340c34a';
  const RESULT_URL = 'https://benzh88.app.n8n.cloud/webhook/a6e524b5-b6f5-452a-a7bd-82771d08c8af/result/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const idea = message.trim();
    if (!idea) {
      alert('Please type an idea first!');
      return;
    }
    if (isProcessing) return;

    setIsProcessing(true);
    setMessages(prev => [...prev, { role: "user", content: idea }]);
    setMessage("");

    try {
      /* 1)  submit the idea  */
      setStatus('Submitting…');
      setMessages(prev => [...prev, { role: "assistant", content: "Submitting…" }]);
      
      const r1 = await fetch(SUBMIT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea })
      });
      
      const { jobId } = await r1.json();
      if (!jobId) { 
        alert('Submission failed ☹︎'); 
        setIsProcessing(false);
        setStatus('');
        return; 
      }

      /* small grace period to let n8n create the "working" stub */
      await new Promise(res => setTimeout(res, 1500));

      /* 2)  poll /result/:jobId  */
      let done = false, tries = 0;
      
      // Update the last message to show working status
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = { role: "assistant", content: "Working… ( 10 s )" };
        return newMessages;
      });

      while (!done && tries < 60) {  // ~10 min max (60×10 s)
        const r2 = await fetch(RESULT_URL + jobId);
        const json = await r2.json();
        
        if (json.status === 'done') {
          done = true;
          setStatus('Completed ✔︎');
          setMessages(prev => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1] = { 
              role: "assistant", 
              content: json.brief || JSON.stringify(json, null, 2)
            };
            return newMessages;
          });
          break;
        }
        
        /* treat both "working" and initial "unknown" the same */
        const workingTime = (++tries * 10);
        setStatus('Working… ( ' + workingTime + ' s )');
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = { 
            role: "assistant", 
            content: 'Working… ( ' + workingTime + ' s )'
          };
          return newMessages;
        });
        
        await new Promise(res => setTimeout(res, 10000));   // wait 10 s
      }
      
      if (!done) {
        setStatus('Timed out after 10 min ⏱');
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = { 
            role: "assistant", 
            content: 'Timed out after 10 min ⏱'
          };
          return newMessages;
        });
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = { 
          role: "assistant", 
          content: 'An error occurred while processing your request.'
        };
        return newMessages;
      });
    } finally {
      setIsProcessing(false);
      setStatus('');
    }
  };

  const handleNewChat = () => {
    if (isProcessing) return;
    setMessages([]);
    setStatus('');
  };

  return (
    <div className="">
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="relative mx-auto w-full items-center justify-center overflow-hidden"
      >
        <div className="relative flex w-full items-center justify-center p-4">
          <AnimatePresence>
            <div className="tracking-tightest flex select-none flex-col py-2 text-center text-3xl font-extrabold leading-none md:flex-col md:text-8xl lg:flex-row"></div>
            {hovered && (
              <motion.div
                initial={{ opacity: 1 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 1 }}
                className="absolute inset-0 h-full w-full object-cover"
              >
                <CanvasRevealEffect
                  animationSpeed={5}
                  containerClassName="bg-transparent opacity-30 dark:opacity-50"
                  colors={[
                    [245, 5, 55],
                    [245, 5, 55],
                  ]}
                  opacities={[1, 0.8, 1, 0.8, 0.5, 0.8, 1, 0.5, 1, 3]}
                  dotSize={2}
                />
              </motion.div>
            )}
          </AnimatePresence>
          <div className="z-20 w-full">
            <ScrollArea className="h-[360px] w-full overflow-auto p-1">
              <div className="px-6">
                <div className="relative flex h-full w-full justify-center text-center">
                  <h1 className="flex select-none py-2 text-center text-2xl font-extrabold leading-none tracking-tight md:text-2xl lg:text-4xl">
                    <span
                      data-content="AI."
                      className="before:animate-gradient-background-1 relative before:absolute before:bottom-4 before:left-0 before:top-0 before:z-0 before:w-full before:px-2 before:content-[attr(data-content)] sm:before:top-0"
                    >
                      <span className="from-gradient-1-start to-gradient-1-end animate-gradient-foreground-1 bg-gradient-to-r bg-clip-text px-2 text-transparent">
                        AI.
                      </span>
                    </span>
                    <span
                      data-content="Chat."
                      className="before:animate-gradient-background-2 relative before:absolute before:bottom-0 before:left-0 before:top-0 before:z-0 before:w-full before:px-2 before:content-[attr(data-content)] sm:before:top-0"
                    >
                      <span className="from-gradient-2-start to-gradient-2-end animate-gradient-foreground-2 bg-gradient-to-r bg-clip-text px-2 text-transparent">
                        Chat.
                      </span>
                    </span>
                    <span
                      data-content="Experience."
                      className="before:animate-gradient-background-3 relative before:absolute before:bottom-1 before:left-0 before:top-0 before:z-0 before:w-full before:px-2 before:content-[attr(data-content)] sm:before:top-0"
                    >
                      <span className="from-gradient-3-start to-gradient-3-end animate-gradient-foreground-3 bg-gradient-to-r bg-clip-text px-2 text-transparent">
                        Experience.
                      </span>
                    </span>
                  </h1>
                </div>
                <p className="md:text-md lg:text-md mx-auto mt-1 text-center text-xs text-primary/60 md:max-w-2xl">
                  How can I help you today?
                </p>
              </div>
              <div id="chat" className="h-38 w-full">
                <div className="">
                  <div className={cn("pt-4")}>
                    <div className="space-y-2 overflow-hidden p-2">
                      {messages.map((msg, index) => (
                        <div key={index} className={cn("p-2 rounded-lg", msg.role === "user" ? "bg-primary text-primary-foreground ml-auto max-w-[80%]" : "bg-muted max-w-[80%]")}>
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
            <div className="relative mt-2 w-full">
              <form onSubmit={handleSubmit}>
                <div className="">
                  <Input
                    className="pl-12"
                    placeholder="Describe your startup idea…"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={isProcessing}
                  />
                </div>
              </form>
              <Button
                variant="default"
                size="icon"
                className="absolute left-1.5 top-1.5 h-7 rounded-sm"
                onClick={handleNewChat}
                disabled={isProcessing}
              >
                <Plus className="h-5 w-5" />
                <span className="sr-only">New Chat</span>
              </Button>
              <Button
                type="submit"
                variant="default"
                size="icon"
                className="absolute right-1.5 top-1.5 h-7 rounded-sm"
                onClick={handleSubmit}
                disabled={isProcessing || !message.trim()}
              >
                <Send className="mx-1 h-4 w-4" />
              </Button>
            </div>
            {status && (
              <div className="mt-2 text-center text-sm text-muted-foreground">
                {status}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
