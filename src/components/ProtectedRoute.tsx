
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  redirectPath?: string;
}

const ProtectedRoute = ({ redirectPath = '/login' }: ProtectedRouteProps) => {
  const { user, isLoading } = useAuth();
  
  // Show nothing while checking authentication
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to={redirectPath} replace />;
  }
  
  // Render children if authenticated
  return <Outlet />;
};

export default ProtectedRoute;
