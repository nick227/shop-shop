import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { RiverComment } from '@api/types'
import { apiClient } from '@api/client'
import { PostCommentList } from '../PostCommentList/PostCommentList'
import { Button } from '@shared/ui/primitives'

interface RiverCommentsPanelProps {
  readonly postId: string
  readonly onClose: () => void
  readonly isAuthenticated: boolean
  readonly onRequireLogin: () => void
}

export function RiverCommentsPanel({
  postId,
  onClose,
  isAuthenticated,
  onRequireLogin,
}: RiverCommentsPanelProps) {
  const queryClient = useQueryClient()
  const [draft, setDraft] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['river-comments', postId],
    queryFn: () => apiClient.river.listComments(postId, { page: 1, limit: 50 }),
  })

  const comments = useMemo((): RiverComment[] => {
    const rows = data?.data ?? []
    return rows.map((c) => ({
      id: c.id,
      postId: c.postId,
      content: c.content,
      authorId: c.userId,
      userName: c.userName,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }))
  }, [data])

  const createMutation = useMutation({
    mutationFn: async () => apiClient.river.createComment(postId, draft.trim()),
    onSuccess: async () => {
      setDraft('')
      await queryClient.invalidateQueries({ queryKey: ['river-comments', postId] })
      await queryClient.invalidateQueries({ queryKey: ['river-feed'] })
      await queryClient.invalidateQueries({ queryKey: ['store-feed'] })
    },
  })

  const submit = () => {
    if (!isAuthenticated) {
      onRequireLogin()
      return
    }
    if (!draft.trim()) return
    createMutation.mutate()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close comments"
        onClick={onClose}
      />
      <div
        className="relative z-10 flex max-h-[88vh] w-full max-w-lg flex-col rounded-t-xl border border-border bg-card shadow-lg sm:rounded-xl"
        role="dialog"
        aria-labelledby="river-comments-title"
      >
        <header className="flex items-center justify-between gap-2 border-b border-border p-3">
          <h2 id="river-comments-title" className="text-base font-semibold text-foreground">
            Comments
          </h2>
          <Button variant="ghost" size="small" type="button" onClick={onClose}>
            Close
          </Button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-2">
          {isLoading ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Loading…</p>
          ) : (
            <PostCommentList comments={comments} postId={postId} />
          )}
        </div>
        <footer className="space-y-2 border-t border-border p-3">
          {!isAuthenticated ? (
            <Button variant="outline" size="small" type="button" fullWidth onClick={onRequireLogin}>
              Log in to comment
            </Button>
          ) : (
            <>
              <textarea
                className="min-h-[72px] w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                placeholder="Write a comment…"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
              <Button
                type="button"
                size="small"
                onClick={submit}
                isLoading={createMutation.isPending}
                disabled={!draft.trim()}
              >
                Post
              </Button>
            </>
          )}
        </footer>
      </div>
    </div>
  )
}
