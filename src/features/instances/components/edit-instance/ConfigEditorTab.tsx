import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TabHeader } from '@/components/common/TabHeader'

import { ConfigFilesTab } from './ConfigFilesTab'
import { KeybindsTab } from './KeybindsTab'
import { MinecraftOptionsTab } from './MinecraftOptionsTab'

interface ConfigEditorTabProps {
  instanceId: string
}

export function ConfigEditorTab({ instanceId }: ConfigEditorTabProps) {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
      <TabHeader description="Edite as configurações do Minecraft e dos mods desta instância diretamente." />

      <Tabs
        defaultValue="minecraft"
        className="flex min-h-0 min-w-0 flex-1 flex-col"
      >
        <TabsList variant="line">
          <TabsTrigger value="minecraft">Minecraft</TabsTrigger>
          <TabsTrigger value="keybinds">Keybinds</TabsTrigger>
          <TabsTrigger value="mods">Mods</TabsTrigger>
        </TabsList>
        <TabsContent
          value="minecraft"
          className="min-h-0 min-w-0 overflow-y-auto"
        >
          <MinecraftOptionsTab instanceId={instanceId} />
        </TabsContent>
        <TabsContent
          value="keybinds"
          className="min-h-0 min-w-0 overflow-y-auto"
        >
          <KeybindsTab instanceId={instanceId} />
        </TabsContent>
        <TabsContent value="mods" className="flex min-h-0 min-w-0 flex-col">
          <ConfigFilesTab instanceId={instanceId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
