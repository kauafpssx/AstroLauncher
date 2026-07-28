import { ArrowLeft, Download, Search } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { CenteredSpinner } from '@/components/common/CenteredSpinner'
import { EntityAvatar } from '@/components/common/EntityAvatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ModAPI } from '@/features/mods/services/mod.api'
import type { ModSearchResult, ModVersion } from '@/types/mods'

export function ModpackBrowserPanel() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ModSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selected, setSelected] = useState<ModSearchResult | null>(null)
  const [versions, setVersions] = useState<ModVersion[]>([])
  const [selectedVersion, setSelectedVersion] = useState<ModVersion | null>(null)
  const [instanceName, setInstanceName] = useState('')
  const [isInstalling, setIsInstalling] = useState(false)
  const requestIdRef = useRef(0)

  useEffect(() => {
    if (selected) return
    const requestId = ++requestIdRef.current
    const handle = setTimeout(() => {
      setIsSearching(true)
      ModAPI.search({ source: 'modrinth', query, projectType: 'modpack' })
        .then((data) => requestIdRef.current === requestId && setResults(data))
        .catch((err) => requestIdRef.current === requestId && toast.error(`Falha ao buscar: ${String(err)}`))
        .finally(() => requestIdRef.current === requestId && setIsSearching(false))
    }, 200)
    return () => clearTimeout(handle)
  }, [query, selected])

  const selectModpack = async (result: ModSearchResult) => {
    setSelected(result)
    setInstanceName(result.name)
    setSelectedVersion(null)
    try {
      setVersions(await ModAPI.getVersions({ source: result.source, projectId: result.projectId }))
    } catch (err) {
      toast.error(`Falha ao buscar versões: ${String(err)}`)
    }
  }

  const handleInstall = async () => {
    if (!selectedVersion?.downloadUrl || !instanceName.trim()) return
    setIsInstalling(true)
    try {
      await ModAPI.installModpack({ instanceName: instanceName.trim(), downloadUrl: selectedVersion.downloadUrl })
      toast.success('Modpack instalado')
      navigate('/')
    } catch (err) {
      toast.error(`Falha ao instalar modpack: ${String(err)}`)
    } finally {
      setIsInstalling(false)
    }
  }

  if (selected) {
    return (
      <Card>
        <CardHeader className="flex-row items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setSelected(null)}>
            <ArrowLeft />
          </Button>
          <EntityAvatar name={selected.name} iconUrl={selected.iconUrl} className="size-10" />
          <div>
            <CardTitle className="text-base">{selected.name}</CardTitle>
            <p className="text-sm text-muted-foreground">{selected.author}</p>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="modpack-instance-name">Nome da Instância</Label>
            <Input id="modpack-instance-name" value={instanceName} onChange={(e) => setInstanceName(e.target.value)} />
          </div>

          <div className="flex flex-col gap-1">
            <Label>Versão</Label>
            <div className="flex flex-col gap-1 rounded-lg border p-1">
              {versions.length === 0 && <p className="p-3 text-center text-sm text-muted-foreground">Carregando...</p>}
              {versions.map((version) => (
                <button
                  key={version.id}
                  type="button"
                  onClick={() => setSelectedVersion(version)}
                  className="flex items-center justify-between rounded-md p-2 text-left text-sm hover:bg-accent data-[active=true]:bg-accent"
                  data-active={selectedVersion?.id === version.id}
                >
                  <span>{version.name}</span>
                  {selectedVersion?.id === version.id && <span className="text-xs text-primary">selecionada</span>}
                </button>
              ))}
            </div>
          </div>

          <Button disabled={!selectedVersion || !instanceName.trim() || isInstalling} onClick={handleInstall}>
            <Download /> {isInstalling ? 'Instalando...' : 'Instalar Modpack'}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Modpacks do Modrinth</CardTitle>
        <div className="relative mt-2">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Pesquisar modpacks..." className="pl-8" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </CardHeader>
      <CardContent className="flex h-[28rem] flex-col">
        {isSearching ? (
          <CenteredSpinner />
        ) : (
          <ScrollArea className="min-h-0 flex-1">
            <div className="flex flex-col gap-1 pr-3">
              {results.length === 0 && (
                <p className="p-4 text-center text-sm text-muted-foreground">Nenhum modpack encontrado.</p>
              )}
              {results.map((result) => (
                <button
                  key={result.projectId}
                  type="button"
                  onClick={() => selectModpack(result)}
                  className="flex items-center gap-3 rounded-lg p-2 text-left hover:bg-accent"
                >
                  <EntityAvatar name={result.name} iconUrl={result.iconUrl} className="size-10" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{result.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{result.description}</p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">{result.downloads.toLocaleString()} dl</span>
                </button>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
