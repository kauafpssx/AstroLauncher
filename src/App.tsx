import { useEffect } from 'react'
import { HashRouter, Route, Routes, useNavigate } from 'react-router-dom'

import { CreateInstancePage } from '@/features/instances/pages/CreateInstancePage'
import { EditInstancePage } from '@/features/instances/pages/EditInstancePage'
import { InstancesPage } from '@/features/instances/pages/InstancesPage'
import { SkinsPage } from '@/features/skins/pages/SkinsPage'
import { CursorTooltip } from '@/components/common/CursorTooltip'
import { LaunchProgressDialog } from '@/components/layout/LaunchProgressDialog'
import { Toaster } from '@/components/ui/sonner'
import { useBlockBrowserNavigation } from '@/hooks/useBlockBrowserNavigation'
import { useBlockNativeContextMenu } from '@/hooks/useBlockNativeContextMenu'
import { useImportAstropackStore } from '@/stores/import-astropack.store'

/** Jumps to the instances page (where the import dialog lives) when a
 * `.astropack` is opened via its file association while the user is on a
 * different screen: InstancesPage itself picks up the pending path once
 * mounted. */
function AstropackFileAssociationBridge() {
  const navigate = useNavigate()
  const pendingPath = useImportAstropackStore((s) => s.pendingPath)

  useEffect(() => {
    if (pendingPath) navigate('/')
  }, [pendingPath, navigate])

  return null
}

function App() {
  useBlockBrowserNavigation()
  useBlockNativeContextMenu()

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<InstancesPage />} />
        <Route path="/instances/new" element={<CreateInstancePage />} />
        <Route path="/instances/:id/edit" element={<EditInstancePage />} />
        <Route path="/skins" element={<SkinsPage />} />
      </Routes>
      <Toaster />
      <LaunchProgressDialog />
      <CursorTooltip />
      <AstropackFileAssociationBridge />
    </HashRouter>
  )
}

export default App
