import { useState, useCallback, useRef, useEffect } from 'react'
import { BoundedContext } from '@/services/api/types/prototype/domain'
import { getApiUrl } from '@/lib/api-config'

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
    
    // Get API URL using centralized config
    const fullURL = getApiUrl('/ddd/bounded-context/stream');
    
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
      } catch (error: unknown) {
        // Ignore abort errors
        if (error instanceof Error && error.name === 'AbortError') {
          return
        }
        
        console.error('SSE fetch error:', error)
        setErrorMessage(error instanceof Error ? error.message : 'Failed to connect')
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

// ==================== Domain Model Stream ====================

export type DomainModelStreamStatus = 'idle' | 'thinking' | 'done' | 'error'

export interface DomainModel {
  id: string
  name: string
  contextId: string
  type: 'aggregate_root' | 'entity' | 'value_object'
  properties: Array<{
    name: string
    type: string
    required: boolean
    description: string
  }>
  methods: string[]
}

export interface UseDomainModelStreamReturn {
  // State
  thinkingMessages: ThinkingStep[]
  domainModels: DomainModel[]
  status: DomainModelStreamStatus
  errorMessage: string | null
  
  // Actions
  generateDomainModels: (requirementText: string, boundedContexts?: BoundedContext[]) => void
  abort: () => void
  reset: () => void
}

/**
 * useDomainModelStream - React Hook for SSE streaming domain model generation
 */
export function useDomainModelStream(): UseDomainModelStreamReturn {
  // State
  const [thinkingMessages, setThinkingMessages] = useState<ThinkingStep[]>([])
  const [domainModels, setDomainModels] = useState<DomainModel[]>([])
  const [status, setStatus] = useState<DomainModelStreamStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  
  // Refs
  const abortControllerRef = useRef<AbortController | null>(null)
  
  // Cleanup function
  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
  }, [])
  
  // Reset state
  const reset = useCallback(() => {
    cleanup()
    setThinkingMessages([])
    setDomainModels([])
    setStatus('idle')
    setErrorMessage(null)
  }, [cleanup])
  
  // Abort current request
  const abort = useCallback(() => {
    cleanup()
    setStatus('idle')
    setThinkingMessages([])
    setDomainModels([])
  }, [cleanup])
  
  // Main function to generate domain models via SSE
  const generateDomainModels = useCallback((requirementText: string, boundedContexts?: BoundedContext[]) => {
    // Reset state
    setThinkingMessages([])
    setDomainModels([])
    setErrorMessage(null)
    setStatus('thinking')
    
    // Create AbortController for fetch
    abortControllerRef.current = new AbortController()
    
    // Get API URL using centralized config
    const fullURL = getApiUrl('/ddd/domain-model/stream');
    
    // Use fetch with ReadableStream for SSE
    const fetchSSE = async () => {
      try {
        const response = await fetch(fullURL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            requirementText,
            boundedContexts 
          }),
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
          buffer = lines.pop() || ''
          
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
                      
                    case 'done':
                      setDomainModels(parsedData.domainModels || [])
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
      } catch (error: unknown) {
        // Ignore abort errors
        if (error instanceof Error && error.name === 'AbortError') {
          return
        }
        
        console.error('SSE fetch error:', error)
        setErrorMessage(error instanceof Error ? error.message : 'Failed to connect')
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
    domainModels,
    status,
    errorMessage,
    
    // Actions
    generateDomainModels,
    abort,
    reset,
  }
}

// ==================== Business Flow Stream ====================

export type BusinessFlowStreamStatus = 'idle' | 'thinking' | 'done' | 'error'

export interface BusinessFlow {
  id: string
  name: string
  states: Array<{
    id: string
    name: string
    type: 'initial' | 'intermediate' | 'final'
    description: string
  }>
  transitions: Array<{
    id: string
    fromStateId: string
    toStateId: string
    event: string
    condition?: string
  }>
}

export interface UseBusinessFlowStreamReturn {
  thinkingMessages: ThinkingStep[]
  businessFlow: BusinessFlow | null
  mermaidCode: string
  status: BusinessFlowStreamStatus
  errorMessage: string | null
  generateBusinessFlow: (domainModels: any[], requirementText?: string) => void
  abort: () => void
  reset: () => void
}

export function useBusinessFlowStream(): UseBusinessFlowStreamReturn {
  const [thinkingMessages, setThinkingMessages] = useState<ThinkingStep[]>([])
  const [businessFlow, setBusinessFlow] = useState<BusinessFlow | null>(null)
  const [mermaidCode, setMermaidCode] = useState('')
  const [status, setStatus] = useState<BusinessFlowStreamStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  
  const abortControllerRef = useRef<AbortController | null>(null)
  
  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
  }, [])
  
  const reset = useCallback(() => {
    cleanup()
    setThinkingMessages([])
    setBusinessFlow(null)
    setMermaidCode('')
    setStatus('idle')
    setErrorMessage(null)
  }, [cleanup])
  
  const abort = useCallback(() => {
    cleanup()
    setStatus('idle')
    setThinkingMessages([])
    setBusinessFlow(null)
  }, [cleanup])
  
  const generateBusinessFlow = useCallback((domainModels: any[], requirementText?: string) => {
    setThinkingMessages([])
    setBusinessFlow(null)
    setMermaidCode('')
    setErrorMessage(null)
    setStatus('thinking')
    
    abortControllerRef.current = new AbortController()
    
    const fullURL = getApiUrl('/ddd/business-flow/stream');
    
    const fetchSSE = async () => {
      try {
        const response = await fetch(fullURL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ domainModels, requirementText }),
          signal: abortControllerRef.current?.signal,
        })
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        if (!response.body) throw new Error('Response body is null')
        
        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''
          
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i]
            if (line.startsWith('event: ')) {
              const eventType = line.slice(7)
              // Check next line for data
              const nextLine = lines[i + 1]
              if (nextLine && nextLine.startsWith('data: ')) {
                const data = nextLine.slice(6)
                try {
                  const parsedData = JSON.parse(data)
                  switch (eventType) {
                    case 'thinking':
                      setThinkingMessages(prev => [...prev, parsedData])
                      break
                    case 'done':
                      setBusinessFlow(parsedData.businessFlow || null)
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
                // Skip the data line in next iteration
                i++
              }
            }
          }
        }
      } catch (error: unknown) {
        if (!(error instanceof Error && error.name !== 'AbortError')) {
          console.error('SSE fetch error:', error)
          setErrorMessage(error instanceof Error ? error.message : 'Failed to connect')
          setStatus('error')
        }
      }
    }
    
    fetchSSE()
  }, [])
  
  useEffect(() => {
    return () => { cleanup() }
  }, [cleanup])
  
  return {
    thinkingMessages,
    businessFlow,
    mermaidCode,
    status,
    errorMessage,
    generateBusinessFlow,
    abort,
    reset,
  }
}

export default useDDDStream
