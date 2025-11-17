import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';

interface EnhancedTextareaProps {
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  className?: string;
  rows?: number;
  onSelectionChange?: (selection: TextSelection) => void;
  onTypingStart?: () => void;
  onTypingEnd?: () => void;
  typingDelay?: number;
}

interface TextSelection {
  start: number;
  end: number;
  text: string;
  fieldName: string;
}

export const EnhancedTextarea: React.FC<EnhancedTextareaProps> = ({
  name,
  value,
  onChange,
  placeholder,
  className,
  rows = 3,
  onSelectionChange,
  onTypingStart,
  onTypingEnd,
  typingDelay = 1000,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);

  // Track text selection
  const handleSelectionChange = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea && onSelectionChange) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = value.substring(start, end);
      
      onSelectionChange({
        start,
        end,
        text: selectedText,
        fieldName: name,
      });
    }
  }, [value, name, onSelectionChange]);

  // Handle typing detection
  const handleInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set typing state
    if (!isTyping) {
      setIsTyping(true);
      onTypingStart?.();
    }

    // Call the original onChange
    onChange(e);

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      onTypingEnd?.();
    }, typingDelay);
  }, [isTyping, onChange, onTypingStart, onTypingEnd, typingDelay]);

  // Update word and character counts
  useEffect(() => {
    const words = value.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
    setCharCount(value.length);
  }, [value]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        name={name}
        value={value}
        onChange={handleInput}
        onSelect={handleSelectionChange}
        onKeyUp={handleSelectionChange}
        onMouseUp={handleSelectionChange}
        placeholder={placeholder}
        className={className}
        rows={rows}
      />
      
      {/* Typing indicator */}
      {isTyping && (
        <div className="absolute top-2 right-2 flex items-center gap-1 text-xs text-blue-500">
          <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse" />
          <span>typing...</span>
        </div>
      )}
      
      {/* Character/Word count */}
      <div className="absolute bottom-2 right-2 text-xs text-gray-500 flex gap-2">
        <span>{wordCount} words</span>
        <span>{charCount} chars</span>
      </div>
    </div>
  );
};

export default EnhancedTextarea;