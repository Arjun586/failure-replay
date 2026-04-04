// client/src/App.tsx
import Sidebar from './components/Sidebar';
import IncidentTable from './components/incidentTable';
import FileUploader from './components/FileUploader';
import { useState } from 'react';

function App() {

  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar />
      
      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-10">
        <div className="max-w-6xl mx-auto">
          <header className="mb-8 flex justify-between items-end">
            <div>
              <h2 className="text-3xl font-bold text-gray-100 tracking-tight">Dashboard</h2>
              <p className="text-muted mt-2">Monitor and investigate system failures in real-time.</p>
            </div>
            
            {/* We will make this button work later! */}
            <button className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-md font-medium transition-colors shadow-[0_0_15px_rgba(139,92,246,0.3)]">
              + New Incident
            </button>
          </header>

          <FileUploader onUploadSuccess={() => setRefreshKey(prev => prev + 1)} />
          
          {/* Our new live data table */}
          <IncidentTable key={refreshKey} />
        </div>
      </main>
    </div>
  );
}

export default App;