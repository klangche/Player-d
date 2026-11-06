import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ApiProvider } from "./api/ApiProvider";
import { Sidebar } from "./components/Sidebar";
import { ZoneRedirect } from "./components/ZoneRedirect";
import { ZonePage } from "./features/zones/ZonePage";
import { DantePage } from "./features/dante/DantePage";
import { ZoneMixerPage } from "./features/zoneMixer/ZoneMixerPage";
import { SettingsPage } from "./features/settings/SettingsPage";

export default function App() {
  return (
    <ApiProvider>
      <BrowserRouter>
        <div className="app">
          <Sidebar />
          <main className="main">
            <Routes>
              <Route path="/" element={<ZoneRedirect />} />
              <Route path="/zones/:id" element={<ZonePage />} />
              <Route path="/dante" element={<DantePage />} />
              <Route path="/zone-mixer" element={<ZoneMixerPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </ApiProvider>
  );
}
