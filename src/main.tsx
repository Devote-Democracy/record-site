import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router'
import { Layout } from './components/Layout.tsx'
import { RecordProvider } from './record.tsx'
import EntriesPage from './pages/Entries.tsx'
import EntryPage from './pages/Entry.tsx'
import HomePage from './pages/Home.tsx'
import HowPage from './pages/How.tsx'
import StagePage from './pages/Stage.tsx'
import './styles.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RecordProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="stage/:index" element={<StagePage />} />
            <Route path="entries" element={<EntriesPage />} />
            <Route path="entries/:index" element={<EntryPage />} />
            <Route path="how-it-works" element={<HowPage />} />
            <Route path="*" element={<p className="py-16 text-center text-slate-500">Nothing here.</p>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </RecordProvider>
  </StrictMode>,
)
