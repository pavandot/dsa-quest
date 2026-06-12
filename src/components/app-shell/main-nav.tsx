'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/learn', label: 'Learn' },
  { href: '/practice', label: 'Practice' },
  { href: '/reviews', label: 'Reviews' },
]

export function MainNav() {
  const pathname = usePathname()

  return (
    <nav className="flex items-center gap-1">
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            'rounded-md px-3 py-1.5 text-sm transition-colors',
            pathname.startsWith(link.href)
              ? 'bg-muted font-medium'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  )
}
