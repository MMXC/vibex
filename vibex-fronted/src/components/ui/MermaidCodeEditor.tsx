'use client'

import { useState, useCallback } from 'react'
import Editor, { OnMount } from '@monaco-editor/react'

export interface MermaidCodeEditorProps {
  value: string
  onChange?: (value: string) => void
  onValidate?: (errors: string[]) => void
  readOnly?: boolean
  height?: string
}

export default function MermaidCodeEditor({
  value,
  onChange,
  onValidate,
  readOnly = false,
  height = '400px',
}: MermaidCodeEditorProps) {
  const [errors, setErrors] = useState<string[]>([])

  const handleEditorMount: OnMount = useCallback((editor, monaco) => {
    // Register Mermaid language
    monaco.languages.register({ id: 'mermaid' })
    
    // Define tokenizer for Mermaid syntax highlighting
    monaco.languages.setMonarchTokensProvider('mermaid', {
      tokenizer: {
        root: [
          // Comments
          [/\/\/.*$/, 'comment'],
          [/\/\*/, 'comment', '@comment'],
          
          // Keywords
          [/graph|flowchart|stateDiagram|classDiagram|sequenceDiagram|pie|gitGraph/, 'keyword'],
          [/subgraph|end|class|state|note|participant|actor|loop|alt|else|par|and|then|bar|queue/, 'keyword'],
          
          // Node definitions
          [/[A-Za-z_]\w*(?=\[)/, 'type'],
          [/[A-Za-z_]\w*(?=\()/, 'function'],
          
          // Strings
          [/"[^"]*"/, 'string'],
          [/'[^']*'/, 'string'],
          
          // Operators
          [/[=!<>]=?|-->|-.->|===|---|\|/, 'operator'],
          
          // Numbers
          [/\d+/, 'number'],
          
          // Arrow directions
          [/TB|BT|RL|LR/, 'direction'],
        ],
        comment: [
          [/\*\//, 'comment', '@pop'],
          [/./, 'comment'],
        ],
      },
    })

    // Define theme
    monaco.editor.defineTheme('mermaid-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: 'c586c0', fontStyle: 'bold' },
        { token: 'type', foreground: '4ec9b0' },
        { token: 'function', foreground: 'dcdcaa' },
        { token: 'string', foreground: 'ce9178' },
        { token: 'number', foreground: 'b5cea8' },
        { token: 'operator', foreground: 'd4d4d4' },
        { token: 'direction', foreground: '569cd6' },
        { token: 'comment', foreground: '6a9955' },
      ],
      colors: {
        'editor.background': '#1e1e2e',
        'editor.foreground': '#d4d4d4',
        'editorLineNumber.foreground': '#858585',
        'editorCursor.foreground': '#aeafad',
        'editor.selectionBackground': '#264f78',
      },
    })

    // Set theme
    monaco.editor.setTheme('mermaid-dark')
    
    // Basic validation on mount
    validateMermaid(value)
  }, [value])

  const validateMermaid = useCallback((code: string) => {
    const errors: string[] = []
    
    if (!code.trim()) {
      setErrors([])
      onValidate?.([])
      return
    }

    // Check for common Mermaid syntax errors
    const lines = code.split('\n')
    let bracketCount = 0
    let parenCount = 0
    
    lines.forEach((line, index) => {
      const lineNum = index + 1
      
      // Count brackets
      bracketCount += (line.match(/\[/g) || []).length
      bracketCount -= (line.match(/\]/g) || []).length
      
      parenCount += (line.match(/\(/g) || []).length
      parenCount -= (line.match(/\)/g) || []).length
      
      // Check for undefined nodes in edges
      const edgeMatch = line.match(/(\w+)\s*-->/)
      if (edgeMatch && !line.match(new RegExp(`\\[${edgeMatch[1]}\\]|\\(${edgeMatch[1]}\\)`))) {
        // This is a reference, not definition - check if node exists
      }
    })

    if (bracketCount !== 0) {
      errors.push(`Unbalanced square brackets: ${bracketCount > 0 ? 'missing ]' : 'missing ['}`)
    }
    
    if (parenCount !== 0) {
      errors.push(`Unbalanced parentheses: ${parenCount > 0 ? 'missing )' : 'missing ('}`)
    }

    setErrors(errors)
    onValidate?.(errors)
  }, [onValidate])

  const handleChange = useCallback((newValue: string | undefined) => {
    const code = newValue || ''
    onChange?.(code)
    validateMermaid(code)
  }, [onChange, validateMermaid])

  return (
    <div style={{ borderRadius: '8px', overflow: 'hidden', border: errors.length > 0 ? '1px solid #f87171' : '1px solid #3b3b5c' }}>
      <Editor
        height={height}
        defaultLanguage="mermaid"
        value={value}
        onChange={handleChange}
        onMount={handleEditorMount}
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: "'Fira Code', 'Consolas', monospace",
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: 'on',
          padding: { top: 16, bottom: 16 },
          renderLineHighlight: 'line',
          cursorBlinking: 'smooth',
          smoothScrolling: true,
        }}
        loading={
          <div style={{ 
            height, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            background: '#1e1e2e',
            color: '#858585'
          }}>
            Loading editor...
          </div>
        }
      />
      {errors.length > 0 && (
        <div style={{
          padding: '8px 12px',
          background: 'rgba(248, 113, 113, 0.1)',
          borderTop: '1px solid #f87171',
          fontSize: '12px',
          color: '#f87171',
        }}>
          {errors.map((error, i) => (
            <div key={i} style={{ marginBottom: i < errors.length - 1 ? '4px' : 0 }}>
              ⚠️ {error}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
