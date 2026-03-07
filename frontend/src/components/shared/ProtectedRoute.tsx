import { useAuthStore } from '@/store/auth.store';
import { Navigate } from 'react-router-dom';

interface Props {
  children: React.ReactNode;
  adminOnly?: boolean;
}

export const ProtectedRoute = ({ children, adminOnly = false }: Props) => {
  const { isAuth, user } = useAuthStore();

  if (!isAuth) return <Navigate to="/login" replace />;
  if (adminOnly && user?.role !== 'ADMIN') return <Navigate to="/" replace />;

  return <>{children}</>;
};
