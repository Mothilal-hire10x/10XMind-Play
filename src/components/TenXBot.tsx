import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { aiAPI, ChatMessage } from '@/lib/api-client'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { springs } from '@/lib/animations'

// Icons
const BotIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth="2">
    <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7v1a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2v1a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-1a2 2 0 0 1-2-2v-1a2 2 0 0 1 2-2v-1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/>
    <circle cx="9" cy="13" r="1.5" fill="currentColor"/>
    <circle cx="15" cy="13" r="1.5" fill="currentColor"/>
    <path d="M9 17h6" strokeLinecap="round"/>
  </svg>
)

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="2">
    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const SendIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="2">
    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const SparkleIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M12 0L14.59 8.41L23 11L14.59 13.59L12 22L9.41 13.59L1 11L9.41 8.41L12 0Z"/>
  </svg>
)

// Magnetic FAB wrapper
const MagneticFAB = ({ children, onClick }: { children: React.ReactNode, onClick: () => void }) => {
  const ref = useRef<HTMLButtonElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  
  const springX = useSpring(x, { stiffness: 400, damping: 25 })
  const springY = useSpring(y, { stiffness: 400, damping: 25 })

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    x.set((e.clientX - centerX) * 0.2)
    y.set((e.clientY - centerY) * 0.2)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.button
      ref={ref}
      style={{ x: springX, y: springY }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className={cn(
        "fixed bottom-6 right-6 z-50",
        "w-16 h-16 rounded-full",
        "bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-600",
        "text-white shadow-2xl shadow-purple-500/40",
        "flex items-center justify-center",
        "hover:shadow-[0_0_40px_rgba(168,85,247,0.5)]",
        "transition-shadow duration-300"
      )}
      aria-label="Open 10XBot"
    >
      {children}
    </motion.button>
  )
}

interface Message extends ChatMessage {
  id: string
  timestamp: Date
  isLoading?: boolean
}

const STORAGE_KEY = 'tenxbot_history'

// Configure marked for safe rendering
marked.setOptions({
  breaks: true,
  gfm: true,
})

export function TenXBot() {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [isAvailable, setIsAvailable] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load history from localStorage
  useEffect(() => {
    if (user) {
      const saved = localStorage.getItem(`${STORAGE_KEY}_${user.id}`)
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          setMessages(parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })))
        } catch (e) {
          console.error('Failed to parse chat history:', e)
        }
      }
    }
  }, [user])

  // Save history to localStorage
  useEffect(() => {
    if (user && messages.length > 0) {
      const toSave = messages.filter(m => !m.isLoading).slice(-50) // Keep last 50 messages
      localStorage.setItem(`${STORAGE_KEY}_${user.id}`, JSON.stringify(toSave))
    }
  }, [messages, user])

  // Check AI availability and get suggestions
  useEffect(() => {
    async function checkAvailability() {
      try {
        const health = await aiAPI.checkHealth()
        setIsAvailable(health.status === 'ok')
        
        if (health.status === 'ok') {
          const sug = await aiAPI.getSuggestions()
          setSuggestions(sug)
        }
      } catch {
        setIsAvailable(false)
      }
    }
    
    if (user) {
      checkAvailability()
    }
  }, [user])

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading || !user) return

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date()
    }

    const botMessageId = `bot-${Date.now()}`
    const streamingMessage: Message = {
      id: botMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true
    }

    setMessages(prev => [...prev, userMessage, streamingMessage])
    setInput('')
    setIsLoading(true)

    try {
      // Build history for context (exclude loading messages)
      const history: ChatMessage[] = messages
        .filter(m => !m.isLoading)
        .slice(-10) // Last 10 messages for context
        .map(m => ({ role: m.role, content: m.content }))

      let accumulatedContent = ''

      await aiAPI.chatStream(
        content.trim(),
        history,
        // onChunk
        (chunk: string) => {
          accumulatedContent += chunk
          setMessages(prev => prev.map(m => 
            m.id === botMessageId 
              ? { ...m, content: accumulatedContent, isLoading: true }
              : m
          ))
        },
        // onDone
        (newSuggestions: string[]) => {
          setMessages(prev => prev.map(m => 
            m.id === botMessageId 
              ? { ...m, isLoading: false }
              : m
          ))
          if (newSuggestions.length > 0) {
            setSuggestions(newSuggestions)
          }
          setIsLoading(false)
        },
        // onError
        (error: string) => {
          const errorContent = error.includes('Rate limit')
            ? "⏳ You've reached the message limit. Please try again in a bit!"
            : "😔 Sorry, I encountered an error. Please try again."
          
          setMessages(prev => prev.map(m => 
            m.id === botMessageId 
              ? { ...m, content: errorContent, isLoading: false }
              : m
          ))
          setIsLoading(false)
        }
      )
    } catch (error: any) {
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: error.message?.includes('Rate limit') 
          ? "⏳ You've reached the message limit. Please try again in a bit!"
          : "😔 Sorry, I encountered an error. Please try again.",
        timestamp: new Date()
      }
      setMessages(prev => prev.filter(m => m.id !== botMessageId).concat(errorMessage))
      setIsLoading(false)
    }
  }, [messages, isLoading, user])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion)
  }

  const clearHistory = () => {
    setMessages([])
    if (user) {
      localStorage.removeItem(`${STORAGE_KEY}_${user.id}`)
    }
  }

  // Don't render for non-authenticated users
  if (!user) return null

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <MagneticFAB onClick={() => setIsOpen(true)}>
            <motion.div
              animate={{ 
                rotate: [0, 10, -10, 0],
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                repeatDelay: 3
              }}
            >
              <BotIcon />
            </motion.div>
            
            {/* Multiple pulse rings */}
            <motion.div
              className="absolute inset-0 rounded-full bg-purple-400"
              initial={{ scale: 1, opacity: 0.4 }}
              animate={{ scale: 1.8, opacity: 0 }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.div
              className="absolute inset-0 rounded-full bg-purple-500"
              initial={{ scale: 1, opacity: 0.3 }}
              animate={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
            />
            
            {/* Glow effect */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-500 blur-xl opacity-50 -z-10" />
          </MagneticFAB>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={cn(
              "fixed bottom-6 right-6 z-50",
              "w-[400px] h-[600px] max-h-[85vh]",
              "bg-background/95 backdrop-blur-xl",
              "border border-border/50 rounded-3xl",
              "shadow-2xl shadow-black/20",
              "flex flex-col overflow-hidden"
            )}
          >
            {/* Gradient border effect */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-violet-500/20 via-transparent to-fuchsia-500/20 pointer-events-none" />
            
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/50 bg-gradient-to-r from-violet-500/10 via-purple-500/5 to-fuchsia-500/10 relative">
              <div className="flex items-center gap-3">
                <motion.div 
                  className="w-11 h-11 rounded-full bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/30 relative"
                  whileHover={{ scale: 1.05 }}
                  transition={springs.snappy}
                >
                  <motion.div
                    className="absolute inset-0 rounded-full bg-purple-400/50"
                    animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <BotIcon />
                </motion.div>
                <div>
                  <h3 className="font-bold text-foreground flex items-center gap-1.5 text-lg">
                    10XBot
                    <motion.span
                      animate={{ rotate: [0, 20, -20, 0], scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 2 }}
                      className="text-yellow-500"
                    >
                      <SparkleIcon />
                    </motion.span>
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "w-2 h-2 rounded-full",
                      isAvailable ? "bg-green-500 animate-pulse" : "bg-gray-400"
                    )} />
                    <p className="text-xs text-muted-foreground">
                      {isAvailable ? 'AI Assistant • Online' : 'Offline'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearHistory}
                      className="text-xs text-muted-foreground hover:text-foreground rounded-full"
                    >
                      Clear
                    </Button>
                  </motion.div>
                )}
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsOpen(false)}
                    className="h-9 w-9 rounded-full hover:bg-muted"
                  >
                    <CloseIcon />
                  </Button>
                </motion.div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-4" ref={scrollRef}>
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-4">
                  <motion.div 
                    className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center mb-4"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <BotIcon />
                  </motion.div>
                  <h4 className="font-medium text-foreground mb-2">Hi! I'm 10XBot 👋</h4>
                  <p className="text-sm text-muted-foreground mb-6">
                    Ask me anything about the cognitive games, your results, or get personalized recommendations!
                  </p>
                  
                  {/* Quick Suggestions */}
                  <div className="flex flex-wrap gap-2 justify-center">
                    {suggestions.slice(0, 4).map((suggestion, i) => (
                      <motion.button
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-xs",
                          "bg-muted hover:bg-muted/80",
                          "text-muted-foreground hover:text-foreground",
                          "border border-border/50",
                          "transition-colors duration-200"
                        )}
                      >
                        {suggestion}
                      </motion.button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "flex gap-3",
                        message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                      )}
                    >
                      {/* Avatar */}
                      <div className={cn(
                        "w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-medium",
                        message.role === 'user' 
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-gradient-to-br from-violet-500 to-purple-600 text-white'
                      )}>
                        {message.role === 'user' ? (user.name?.[0]?.toUpperCase() || 'U') : <BotIcon />}
                      </div>

                      {/* Message bubble */}
                      <div className={cn(
                        "max-w-[75%] rounded-2xl px-4 py-2.5 break-words overflow-wrap-anywhere",
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground rounded-tr-sm'
                          : 'bg-muted text-foreground rounded-tl-sm'
                      )}>
                        {message.isLoading ? (
                          <div className="flex items-center gap-1 py-1">
                            <motion.span
                              className="w-2 h-2 rounded-full bg-current opacity-60"
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                            />
                            <motion.span
                              className="w-2 h-2 rounded-full bg-current opacity-60"
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                            />
                            <motion.span
                              className="w-2 h-2 rounded-full bg-current opacity-60"
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                            />
                          </div>
                        ) : (
                          /* eslint-disable-next-line react/no-danger */
                          <div 
                            className="text-sm leading-relaxed break-words prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1"
                            dangerouslySetInnerHTML={{ 
                              __html: message.role === 'assistant' 
                                ? DOMPurify.sanitize(marked.parse(message.content) as string)
                                : DOMPurify.sanitize(message.content.replace(/\n/g, '<br>'))
                            }}
                          />
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Suggestions (when there are messages) */}
            {messages.length > 0 && suggestions.length > 0 && !isLoading && (
              <div className="px-4 py-2 border-t border-border/30">
                <div className="flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  {suggestions.slice(0, 3).map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className={cn(
                        "flex-shrink-0 px-3 py-1 rounded-full text-xs",
                        "bg-muted/50 hover:bg-muted",
                        "text-muted-foreground hover:text-foreground",
                        "border border-border/30",
                        "transition-colors duration-200"
                      )}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <form 
              onSubmit={handleSubmit} 
              className="flex items-center gap-3 p-4 border-t border-border/50 bg-gradient-to-r from-muted/30 via-muted/20 to-muted/30"
            >
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isAvailable ? "Ask me anything..." : "AI service unavailable"}
                disabled={!isAvailable || isLoading}
                className="flex-1 bg-background border-border/50 focus-visible:ring-purple-500/50 rounded-xl h-11"
              />
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  type="submit" 
                  size="icon"
                  disabled={!input.trim() || isLoading || !isAvailable}
                  className="bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-600 hover:from-violet-600 hover:to-fuchsia-700 text-white rounded-xl h-11 w-11 shadow-lg shadow-purple-500/25 disabled:opacity-50"
                >
                  <SendIcon />
                </Button>
              </motion.div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
