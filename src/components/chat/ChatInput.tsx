import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Send, Smile, Paperclip, Mic, Image } from "lucide-react";
import { Button } from "@/components/ui/buttons/Button";
import { Input } from "@/components/ui/forms/Input";
import { cn } from "@/shared/lib/cn";
import { EmojiPicker } from "@/components/chat/EmojiPicker";
import { ChatFileUpload } from "@/components/chat/ChatFileUpload";
import { VoiceRecorder } from "@/components/chat/VoiceRecorder";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onSendFiles?: (files: File[]) => void;
  onSendAudio?: (blob: Blob, duration: number) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  enableAnimations?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onSendFiles,
  onSendAudio,
  placeholder = "Escribe tu mensaje...",
  disabled = false,
  className,
  enableAnimations = true,
}) => {
  const [message, setMessage] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage("");
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (message.trim() && !disabled) {
        onSendMessage(message.trim());
        setMessage("");
        inputRef.current?.focus();
      }
    }
  };

  return (
    <motion.div
      initial={enableAnimations ? { opacity: 0, y: 20 } : false}
      animate={enableAnimations ? { opacity: 1, y: 0 } : false}
      className={cn(
        "relative flex items-center gap-2 p-4",
        "bg-white/80 backdrop-blur-sm border-t border-white/20",
        "transition-all duration-300",
        isFocused && "bg-white/90",
        className,
      )}
    >
      {showEmojiPicker && (
        <div className="absolute bottom-full left-2 mb-2 z-20">
          <EmojiPicker
            onEmojiSelect={(emoji) => setMessage((prev) => prev + emoji)}
            onClose={() => setShowEmojiPicker(false)}
          />
        </div>
      )}
      {showFileUpload && (
        <div className="absolute bottom-full left-2 mb-2 z-20">
          <ChatFileUpload
            onFileSelect={(files) => {
              setShowFileUpload(false);
              onSendFiles?.(files);
            }}
            onCancel={() => setShowFileUpload(false)}
          />
        </div>
      )}
      {showVoiceRecorder && (
        <div className="absolute bottom-full left-2 mb-2 z-20">
          <VoiceRecorder
            onAudioReady={(blob, duration) => {
              setShowVoiceRecorder(false);
              onSendAudio?.(blob, duration);
            }}
            onCancel={() => setShowVoiceRecorder(false)}
          />
        </div>
      )}
      {/* Botones de herramientas */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 hover:bg-pink-100 transition-colors"
          disabled={disabled}
          onClick={() => {
            setShowFileUpload(false);
            setShowVoiceRecorder(false);
            setShowEmojiPicker((v) => !v);
          }}
        >
          <Smile className="h-4 w-4 text-gray-500" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 hover:bg-pink-100 transition-colors"
          disabled={disabled}
          onClick={() => {
            setShowEmojiPicker(false);
            setShowVoiceRecorder(false);
            setShowFileUpload(true);
          }}
        >
          <Paperclip className="h-4 w-4 text-gray-500" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 hover:bg-pink-100 transition-colors"
          disabled={disabled}
          onClick={() => {
            setShowEmojiPicker(false);
            setShowVoiceRecorder(false);
            setShowFileUpload(true);
          }}
        >
          <Image className="h-4 w-4 text-gray-500" />
        </Button>
      </div>

      {/* Input principal */}
      <form onSubmit={handleSubmit} className="flex-1 flex items-center gap-2">
        <div className="relative flex-1">
          <Input
            ref={inputRef}
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              "pr-12 rounded-full border-gray-200",
              "focus:border-pink-300 focus:ring-pink-200",
              "transition-all duration-200",
              "placeholder:text-gray-400",
              isFocused && "shadow-md",
            )}
          />

          {/* Indicador de escritura */}
          {message.length > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
            >
              <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse" />
            </motion.div>
          )}
        </div>

        {/* Botón de envío */}
        <motion.div
          {...(enableAnimations
            ? {
                whileHover: { scale: 1.05 },
                whileTap: { scale: 0.95 },
              }
            : {})}
        >
          <Button
            type="submit"
            size="sm"
            disabled={!message.trim() || disabled}
            className={cn(
              "h-10 w-10 p-0 rounded-full",
              "bg-linear-to-r from-pink-500 to-purple-600",
              "hover:from-pink-600 hover:to-purple-700",
              "disabled:from-gray-300 disabled:to-gray-400",
              "transition-all duration-200",
              "shadow-lg hover:shadow-xl",
            )}
          >
            <Send className="h-4 w-4 text-white" />
          </Button>
        </motion.div>
      </form>

      {/* Botón de micrófono (opcional) */}
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0 hover:bg-pink-100 transition-colors"
        disabled={disabled}
        onClick={() => {
          setShowEmojiPicker(false);
          setShowFileUpload(false);
          setShowVoiceRecorder((v) => !v);
        }}
      >
        <Mic className="h-4 w-4 text-gray-500" />
      </Button>
    </motion.div>
  );
};
