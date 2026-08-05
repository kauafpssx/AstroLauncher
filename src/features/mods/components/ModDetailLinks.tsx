import { BookOpen, Code2, ExternalLink, MessageCircle } from 'lucide-react'

import type { ModProject } from '@/types/mods'

interface ModDetailLinksProps {
  project: ModProject
  openLink: (url: string) => void
}

export function ModDetailLinks({ project, openLink }: ModDetailLinksProps) {
  if (
    !project.sourceUrl &&
    !project.issuesUrl &&
    !project.wikiUrl &&
    !project.discordUrl
  ) {
    return null
  }

  return (
    <div className="flex flex-col gap-1.5 border-t pt-3 text-sm">
      {project.sourceUrl && (
        <a
          href={project.sourceUrl}
          onClick={(e) => (e.preventDefault(), openLink(project.sourceUrl!))}
          className="flex items-center gap-2 hover:underline"
        >
          <Code2 className="size-4" /> Repositório
        </a>
      )}
      {project.wikiUrl && (
        <a
          href={project.wikiUrl}
          onClick={(e) => (e.preventDefault(), openLink(project.wikiUrl!))}
          className="flex items-center gap-2 hover:underline"
        >
          <BookOpen className="size-4" /> Wiki / Documentação
        </a>
      )}
      {project.issuesUrl && (
        <a
          href={project.issuesUrl}
          onClick={(e) => (e.preventDefault(), openLink(project.issuesUrl!))}
          className="flex items-center gap-2 hover:underline"
        >
          <ExternalLink className="size-4" /> Issues
        </a>
      )}
      {project.discordUrl && (
        <a
          href={project.discordUrl}
          onClick={(e) => (e.preventDefault(), openLink(project.discordUrl!))}
          className="flex items-center gap-2 hover:underline"
        >
          <MessageCircle className="size-4" /> Discord
        </a>
      )}
    </div>
  )
}
