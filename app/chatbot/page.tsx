"use client"
import { useState, useEffect, useRef } from "react"
import type React from "react"

import { v4 as uuidv4 } from "uuid"
import { Send, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import Navbar from "@/components/navbar"
import ChatMessageComponent from "@/components/chat-message"
import { getChatbotResponse } from "@/lib/chatbot-service"
import type { ChatMessage } from "@/models/chat"
import { isDemoMode } from "@/lib/firebase"

export default function ChatbotScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [demoMode, setDemoMode] = useState(isDemoMode)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Add welcome message when component mounts
  useEffect(() => {
    const welcomeMessage: ChatMessage = {
      id: uuidv4(),
      content:
        "Hello! I'm your library assistant. How can I help you today? You can ask me about book availability, library hours, or borrowing policies.",
      role: "assistant",
      timestamp: new Date(),
    }
    setMessages([welcomeMessage])
  }, [])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return

    // Add user message
    const userMessage: ChatMessage = {
      id: uuidv4(),
      content: inputMessage,
      role: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputMessage("")
    setIsLoading(true)

    try {
      // Get response from chatbot service
      const responseText = await getChatbotResponse(inputMessage)

      // Add assistant message
      const assistantMessage: ChatMessage = {
        id: uuidv4(),
        content: responseText,
        role: "assistant",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Error getting chatbot response:", error)

      // Add error message
      const errorMessage: ChatMessage = {
        id: uuidv4(),
        content: "I'm sorry, I encountered an error. Please try again later.",
        role: "assistant",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <div className="flex-grow flex flex-col max-w-3xl mx-auto w-full px-4 py-6">
        {/* Header */}
        <div className="flex items-center mb-4">
          <button
            onClick={() => router.back()}
            aria-label="Back"
            className="p-2 rounded-full hover:bg-gray-100 transition-colors mr-2"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Library Assistant</h1>
        </div>

        {demoMode && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-700">
            <p className="font-medium">Demo Mode Active</p>
            <p className="text-sm mt-1">Firebase is not configured. The chatbot is using sample book data.</p>
          </div>
        )}

        {/* Chat Messages */}
        <div className="flex-grow overflow-y-auto mb-4 bg-gray-100 rounded-lg p-4">
          {messages.map((message) => (
            <ChatMessageComponent key={message.id} message={message} />
          ))}
          {isLoading && (
            <div className="flex justify-start mb-4">
              <div className="bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-sm">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-gold-400 rounded-full animate-pulse mr-1"></div>
                  <div className="w-2 h-2 bg-gold-400 rounded-full animate-pulse delay-150 mr-1"></div>
                  <div className="w-2 h-2 bg-gold-400 rounded-full animate-pulse delay-300"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="flex items-center bg-white rounded-lg border border-gray-200 overflow-hidden">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="flex-grow px-4 py-3 focus:outline-none resize-none h-12 max-h-32"
            rows={1}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !inputMessage.trim()}
            className="p-3 bg-gold-400 text-white rounded-r-lg hover:bg-gold-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed h-full"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
