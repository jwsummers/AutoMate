import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Index from './pages/Index';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Pricing from './pages/Pricing';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';
import VehicleDetails from './pages/VehicleDetails';
import MaintenanceDetails from './pages/MaintenanceDetails';
import IntakePublic from '@/pages/IntakePublic';
import VehicleReport from '@/pages/VehicleReport';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path='/' element={<Index />} />
            <Route path='/pricing' element={<Pricing />} />
            <Route path='/login' element={<Login />} />
            <Route path='/register' element={<Register />} />

            {/* PUBLIC intake page for shops/mechanics */}
            <Route path='/s/:slug' element={<IntakePublic />} />

            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route path='/dashboard' element={<Dashboard />} />
              <Route
                path='/dashboard/vehicles/:id'
                element={<VehicleDetails />}
              />
              <Route
                path='/dashboard/maintenance/:id'
                element={<MaintenanceDetails />}
              />
              <Route path='/profile' element={<Profile />} />
              {/* Vehicle report should require login */}
              <Route path='/vehicles/:id/report' element={<VehicleReport />} />
            </Route>

            {/* 404 */}
            <Route path='*' element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
