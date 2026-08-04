import { BookOpen, Code2, ExternalLink, MessageCircle } from 'lucide-react'

import { useLinkPreviewStore } from '@/stores/link-preview.store'
import type { ModProject } from '@/types/mods'

interface ModpackProjectLinksProps {
  project: ModProject
}

export function ModpackProjectLinks({ project }: ModpackProjectLinksProps) {
  const openLink = useLinkPreviewStore((s) => s.open)

  if (
    !project.sourceUrl &&
    !project.issuesUrl &&
    !project.wikiUrl &&
    !project.discordUrl
  ) {
    return null
  }

  const link = (url: string, icon: React.ReactNode, label: string) => (
    <a
      href={url}
      onClick={(e) => (e.preventDefault(), openLink(url))}
      className="flex items-center gap-2 hover:underline"
    >
      {icon} {label}
    </a>
  )

  return (
    <div className="flex flex-col gap-1.5 border-t pt-3 text-sm">
      {project.sourceUrl &&
        link(project.sourceUrl, <Code2 className="size-4" />, 'Repositório')}
      {project.wikiUrl &&
        link(
          project.wikiUrl,
          <BookOpen className="size-4" />,
          'Wiki / Documentação',
        )}
      {project.issuesUrl &&
        link(project.issuesUrl, <ExternalLink className="size-4" />, 'Issues')}
      {project.discordUrl &&
        link(
          project.discordUrl,
          <MessageCircle className="size-4" />,
          'Discord',
        )}
    </div>
  )
}
