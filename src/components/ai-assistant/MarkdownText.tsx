import React from 'react'

interface MarkdownTextProps {
  text: string
}

export const MarkdownText: React.FC<MarkdownTextProps> = ({ text }) => {
  if (!text) return null

  // Dividir o texto em linhas
  const lines = text.split('\n')

  return (
    <div className="space-y-1 text-sm leading-relaxed">
      {lines.map((line, index) => {
        const trimmed = line.trim()

        // 1. Títulos Principais
        if (trimmed.startsWith('# ')) {
          return (
            <h1 key={index} className="text-xl font-bold text-foreground mt-4 mb-2">
              {parseInlineStyles(trimmed.slice(2))}
            </h1>
          )
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h2 key={index} className="text-base font-bold text-foreground mt-3 mb-1.5">
              {parseInlineStyles(trimmed.slice(3))}
            </h2>
          )
        }
        if (trimmed.startsWith('### ')) {
          return (
            <h3 key={index} className="text-sm font-semibold text-foreground mt-2.5 mb-1">
              {parseInlineStyles(trimmed.slice(4))}
            </h3>
          )
        }

        // 2. Itens de Lista (- ou *)
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const content = trimmed.slice(2)
          return (
            <div key={index} className="flex items-start gap-1.5 pl-3 my-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0 mt-2" />
              <span className="text-muted-foreground flex-1">
                {parseInlineStyles(content)}
              </span>
            </div>
          )
        }

        // 3. Cabeçalho de Colaboradores (com o emoji de avatar 👤)
        if (trimmed.startsWith('👤')) {
          return (
            <div key={index} className="font-semibold text-foreground flex items-center gap-1.5 mt-3 mb-1.5 text-sm">
              {parseInlineStyles(trimmed)}
            </div>
          )
        }

        // 4. Linhas em branco
        if (trimmed === '') {
          return <div key={index} className="h-1" />
        }

        // 5. Parágrafo Padrão
        return (
          <p key={index} className="text-muted-foreground my-0.5">
            {parseInlineStyles(trimmed)}
          </p>
        )
      })}
    </div>
  )
}

// Helper para converter negrito (**texto**) e itálico (*texto*)
function parseInlineStyles(content: string): React.ReactNode[] {
  const parts = content.split(/(\*\*.*?\*\*|\*.*?\*)/g)
  
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-bold text-foreground">
          {part.slice(2, -2)}
        </strong>
      )
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <em key={i} className="italic text-muted-foreground/90">
          {part.slice(1, -1)}
        </em>
      )
    }
    return part
  })
}
