import { useState, useCallback, useRef, useEffect } from 'react'
import { BoundedContext } from '@/services/api/types/prototype/domain'

// ==================== Types ====================

export type DDDStreamStatus = 'idle' | 'thinking' | 'done' | 'error'

export interface ThinkingStep {
  step: string
  message: string
}

export interface UseDDDStreamReturn {
  // State
  thinkingMessages: ThinkingStep[]
  contexts: BoundedContext[]
  mermaidCode: string
  status: DDDStreamStatus
  errorMessage: string | null
  
  // Actions
  generateContexts: (requirementText: string) => void
  abort: () => void
  reset: () => void
}

// ==================== Hook ====================

/**
 * useDDDStream - React Hook for SSE streaming DDD analysis
 * 
 * @returns {UseDDDStreamReturn}
 * 
 * Features:
 * - SSE connection management
 * - Real-time thinking messages
 * - Incremental context updates
 * - Request cancellation
 * - Error handling
 * - Auto-cleanup on unmount
 */
export function useDDDStream(): UseDDDStreamReturn {
  // State
  const [thinkingMessages, setThinkingMessages] = useState<ThinkingStep[]>([])
  const [contexts, setContexts] = useState<BoundedContext[]>([])
  const [mermaidCode, setMermaidCode] = useState('')
  const [status, setStatus] = useState<DDDStreamStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  
  // Refs
  const abortControllerRef = useRef<AbortController | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  
  // Cleanup function
  const cleanup = useCallback(() => {
    // Close EventSource if exists
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    
    // Abort fetch if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
  }, [])
  
  // Reset state
  const reset = useCallback(() => {
    cleanup()
    setThinkingMessages([])
    setContexts([])
    setMermaidCode('')
    setStatus('idle')
    setErrorMessage(null)
  }, [cleanup])
  
  // Abort current request
  const abort = useCallback(() => {
    cleanup()
    setStatus('idle')
    setThinkingMessages([])
    setContexts([])
  }, [cleanup])
  
  // Main function to generate contexts via SSE
  const generateContexts = useCallback((requirementText: string) => {
    // Reset state
    setThinkingMessages([])
    setContexts([])
    setMermaidCode('')
    setErrorMessage(null)
    setStatus('thinking')
    
    // Create AbortController for fetch
    abortControllerRef.current = new AbortController()
    
    // Get API base URL from environment variable with fallback
    const apiBaseURL = typeof window !== 'undefined' 
      ? (process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.vibex.top/api/v1')
      : '';
    const fullURL = apiBaseURL ? `${apiBaseURL}/ddd/bounded-context/stream` : '/api/ddd/bounded-context/stream';
    
    // Use fetch with ReadableStream for SSE
    const fetchSSE = async () => {
      try {
        const response = await fetch(fullURL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ requirementText }),
          signal: abortControllerRef.current?.signal,
        })
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        if (!response.body) {
          throw new Error('Response body is null')
        }
        
        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        
        while (true) {
          const { done, value } = await reader.read()
          
          if (done) {
            break
          }
          
          buffer += decoder.decode(value, { stream: true })
          
          // Parse SSE events
          const lines = buffer.split('\n')
          buffer = lines.pop() || '' // Keep incomplete line in buffer
          
          for (const line of lines) {
            if (line.startsWith('event: ')) {
              const eventType = line.slice(7)
              // Find data line
              const dataLineIdx = lines.indexOf(line) + 1
              if (dataLineIdx < lines.length && lines[dataLineIdx].startsWith('data: ')) {
                const data = lines[dataLineIdx].slice(6)
                try {
                  const parsedData = JSON.parse(data)
                  
                  switch (eventType) {
                    case 'thinking':
                      setThinkingMessages(prev => [...prev, parsedData])
                      break
                      
                    case 'context':
                      setContexts(prev => [...prev, parsedData])
                      break
                      
                    case 'done':
                      setContexts(parsedData.boundedContexts || [])
                      setMermaidCode(parsedData.mermaidCode || '')
                      setStatus('done')
                      break
                      
                    case 'error':
                      setErrorMessage(parsedData.message || 'Unknown error')
                      setStatus('error')
                      break
                  }
                } catch (e) {
                  console.error('Failed to parse SSE data:', e)
                }
              }
            }
          }
        }
      } catch (error: any) {
        // Ignore abort errors
        if (error.name === 'AbortError') {
          return
        }
        
        console.error('SSE fetch error:', error)
        setErrorMessage(error.message || 'Failed to connect')
        setStatus('error')
      }
    }
    
    fetchSSE()
  }, [])
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [cleanup])
  
  return {
    // State
    thinkingMessages,
    contexts,
    mermaidCode,
    status,
    errorMessage,
    
    // Actions
    generateContexts,
    abort,
    reset,
  }
}

export default useDDDStream
