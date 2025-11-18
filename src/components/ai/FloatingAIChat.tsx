import React, { useState } from 'react'
import { Bot, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AIChat } from './AIChat'
import { cn } from '@/lib/utils'

interface FloatingAIChatProps {
  className?: string
}

export const FloatingAIChat: React.FC<FloatingAIChatProps> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className={cn('fixed bottom-4 right-4 z-50', className)}>
      {/* Floating Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          size="icon"
          className="rounded-full shadow-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
        >
          <Bot className="h-5 w-5" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="relative">
          <div className="absolute bottom-0 right-0 w-[400px] h-[500px] bg-background rounded-lg shadow-2xl border animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between p-3 border-b bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-primary" />
                <span className="font-semibold text-sm">AI Assistant</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            <div className="h-[calc(100%-48px)] flex flex-col">
              <AIChat onClose={() => setIsOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}