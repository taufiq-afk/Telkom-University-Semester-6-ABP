import type { ChatMessage } from "@/models/chat"
import { BookOpen, User } from "lucide-react"

interface ChatMessageProps {
  message: ChatMessage
}

export default function ChatMessageComponent({ message }: ChatMessageProps) {
  const isUser = message.role === "user"

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div
        className={`flex max-w-[80%] ${
          isUser ? "bg-gold-400 text-white" : "bg-white border border-gray-200"
        } rounded-lg px-4 py-2 shadow-sm`}
      >
        <div className={`flex-shrink-0 mr-3 ${isUser ? "order-last ml-3 mr-0" : ""}`}>
          {isUser ? <User className="h-6 w-6 text-white" /> : <BookOpen className="h-6 w-6 text-gold-400" />}
        </div>
        <div>
          <p className={`text-sm ${isUser ? "text-white" : "text-gray-800"}`}>{message.content}</p>
          <p className={`text-xs mt-1 ${isUser ? "text-white/70" : "text-gray-500"}`}>
            {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      </div>
    </div>
  )
}
