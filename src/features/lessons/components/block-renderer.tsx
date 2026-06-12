import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Info, Lightbulb, TriangleAlert, Wand2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ContentBlock } from '@/features/lessons/server/queries'

function Md({ md, className }: { md: string; className?: string }) {
  return (
    <div
      className={cn(
        'prose prose-neutral dark:prose-invert max-w-none',
        'prose-headings:tracking-tight prose-h2:text-xl prose-h3:text-lg',
        'prose-code:before:content-none prose-code:after:content-none',
        'prose-code:bg-muted prose-code:rounded prose-code:px-1 prose-code:py-0.5 prose-code:text-[0.85em]',
        className
      )}
    >
      <Markdown remarkPlugins={[remarkGfm]}>{md}</Markdown>
    </div>
  )
}

const CALLOUT_STYLE = {
  info: { icon: Info, cls: 'border-sky-500/30 bg-sky-500/5' },
  tip: { icon: Lightbulb, cls: 'border-emerald-500/30 bg-emerald-500/5' },
  warning: { icon: TriangleAlert, cls: 'border-amber-500/30 bg-amber-500/5' },
} as const

export function BlockRenderer({ blocks }: { blocks: ContentBlock[] }) {
  if (blocks.length === 0) {
    return (
      <div className="text-muted-foreground rounded-lg border border-dashed p-8 text-center text-sm">
        This lesson&apos;s content is being authored. Mark it complete to keep your momentum —
        it&apos;ll be worth revisiting later.
      </div>
    )
  }

  return (
    <div className="grid gap-6">
      {blocks.map((block, i) => {
        switch (block.type) {
          case 'text':
            return <Md key={i} md={block.md} />
          case 'code':
            return (
              <figure key={i} className="grid gap-1.5">
                <pre className="bg-muted/60 overflow-x-auto rounded-lg border p-4 text-sm leading-relaxed">
                  <code>{block.code}</code>
                </pre>
                {block.caption && (
                  <figcaption className="text-muted-foreground text-xs">{block.caption}</figcaption>
                )}
              </figure>
            )
          case 'callout': {
            const style = CALLOUT_STYLE[block.variant] ?? CALLOUT_STYLE.info
            const Icon = style.icon
            return (
              <div key={i} className={cn('flex gap-3 rounded-lg border p-4', style.cls)}>
                <Icon className="mt-1 size-4 shrink-0" />
                <Md md={block.md} className="prose-sm" />
              </div>
            )
          }
          case 'visualization':
            return (
              <div
                key={i}
                className="text-muted-foreground flex items-center justify-center gap-2 rounded-lg border border-dashed p-8 text-sm"
              >
                <Wand2 className="size-4" />
                Interactive visualization ({block.kind}) — coming with the visualization engine
              </div>
            )
          default:
            return null
        }
      })}
    </div>
  )
}
