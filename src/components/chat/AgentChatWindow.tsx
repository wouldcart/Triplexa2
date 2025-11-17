import React, { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare } from 'lucide-react';

interface AgentChatWindowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  managerName?: string;
}

const AgentChatWindow: React.FC<AgentChatWindowProps> = ({ open, onOpenChange, managerName = 'Support Team' }) => {
  const [messages, setMessages] = useState<{ from: 'me' | 'manager'; text: string; ts: number }[]>([]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([
        { from: 'manager', text: `Hi! This is ${managerName}. How can I help you today?`, ts: Date.now() }
      ]);
    }
  }, [open, managerName]);

  useEffect(() => {
    // Auto-scroll to bottom on new message
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = () => {
    const text = input.trim();
    if (!text) return;
    const ts = Date.now();
    setMessages(prev => [...prev, { from: 'me', text, ts }]);
    setInput('');
    // Simulated reply
    setTimeout(() => {
      setMessages(prev => [...prev, { from: 'manager', text: 'Got it! I will look into this right away.', ts: Date.now() }]);
    }, 600);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" /> Chat with {managerName}
          </DialogTitle>
          <DialogDescription>
            Start a quick conversation with your assigned manager. Messages here are not persisted.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col h-[60vh] max-h-[80vh]">
          <ScrollArea className="flex-1 rounded border p-3" ref={scrollRef as any}>
            <div className="space-y-2">
              {messages.map((m, idx) => (
                <div key={idx} className={`flex ${m.from === 'me' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] px-3 py-2 rounded-lg text-sm ${m.from === 'me' ? 'bg-blue-600 text-white' : 'bg-muted text-foreground'}`}>
                    {m.text}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          <div className="mt-3 flex items-center gap-2">
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Type your message..."
              onKeyDown={e => { if (e.key === 'Enter') sendMessage(); }}
            />
            <Button onClick={sendMessage}>
              Send
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AgentChatWindow;
