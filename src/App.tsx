import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { NavHeader } from './components';
import MapPage from './pages/MapPage';
import CalendarPage from './pages/CalendarPage';
import TemplateAddPage from './pages/TemplateAddPage';
import { useTemplateStore, usePlanStore } from './store/useStore';

export default function App() {
  const { templates, addTemplate } = useTemplateStore();
  const { plans, addPlan } = usePlanStore();

  return (
    <BrowserRouter>
      <div className="max-w-md mx-auto bg-white min-h-screen shadow-lg">
        <NavHeader />
        <Routes>
          <Route path="/" element={<MapPage />} />
          <Route
            path="/calendar"
            element={
              <CalendarPage
                templates={templates}
                plans={plans}
                onAddPlan={addPlan}
              />
            }
          />
          <Route
            path="/templates/new"
            element={<TemplateAddPage onSave={addTemplate} />}
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
