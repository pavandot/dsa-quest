'use client'

import { LogOut, Settings } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { signOut } from '@/features/auth/actions'

export function UserMenu({
  username,
  displayName,
  avatarUrl,
}: {
  username: string
  displayName: string | null
  avatarUrl: string | null
}) {
  const initials = (displayName ?? username).slice(0, 2).toUpperCase()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-full outline-none focus-visible:ring-2">
        <Avatar className="size-8">
          {avatarUrl && <AvatarImage src={avatarUrl} alt={username} />}
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="font-normal">
          <p className="text-sm font-medium">{displayName ?? username}</p>
          <p className="text-muted-foreground text-xs">@{username}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>
          <Settings className="size-4" /> Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void signOut()}>
          <LogOut className="size-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
