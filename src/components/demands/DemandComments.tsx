import { useState } from 'react'
import { Comment } from '@/lib/types'
import { useAppStore } from '@/stores/use-app-store'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { MessageSquare, Send } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface DemandCommentsProps {
  demandId: string
  comments: Comment[]
  canComment: boolean
}

export function DemandComments({ demandId, comments, canComment }: DemandCommentsProps) {
  const { addComment, currentUser, users } = useAppStore()
  const [text, setText] = useState('')

  const handleSend = () => {
    if (!text.trim() || !currentUser) return
    addComment(demandId, text.trim(), currentUser.id, currentUser.name)
    setText('')
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold flex items-center gap-2">
        <MessageSquare className="w-4 h-4" /> Comentários ({comments.length})
      </h4>
      {comments.length > 0 && (
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {comments.map((comment) => {
            const author = users.find((u) => u.id === comment.authorId)
            return (
              <div key={comment.id} className="flex gap-2 p-2 bg-muted/50 rounded-lg">
                <Avatar className="w-6 h-6 shrink-0">
                  <AvatarImage src={author?.avatarUrl} />
                  <AvatarFallback className="text-xs">
                    {comment.authorName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-medium">{comment.authorName}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(comment.timestamp).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{comment.text}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
      {canComment && (
        <div className="flex gap-2 items-end">
          <Textarea
            placeholder="Adicione um comentário..."
            className="min-h-[40px] max-h-[80px] resize-none text-sm"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
          />
          <Button
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={handleSend}
            disabled={!text.trim()}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
