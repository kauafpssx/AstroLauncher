import { HashRouter, Route, Routes } from 'react-router-dom'

import { CreateInstancePage } from '@/features/instances/pages/CreateInstancePage'
import { EditInstancePage } from '@/features/instances/pages/EditInstancePage'
import { InstancesPage } from '@/features/instances/pages/InstancesPage'
import { SkinsPage } from '@/features/skins/pages/SkinsPage'
import { LaunchProgressDialog } from '@/components/layout/LaunchProgressDialog'
import { Toaster } from '@/components/ui/sonner'

function App() {
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
    </HashRouter>
  )
}

export default App
