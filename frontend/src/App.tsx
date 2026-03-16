import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { Loader2 } from 'lucide-react';
import { Suspense, lazy } from 'react';
import EditPet from '@/pages/EditPet';
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import Notifications from '@/pages/Notifications';
import PetDetail from '@/pages/PetDetail';
import Profile from '@/pages/Profile';
import Register from '@/pages/Register';
import ReportPet from '@/pages/ReportPet';
import SearchPage from '@/pages/Search';
import UserDetail from '@/pages/UserDetail';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

const AdminDashboard = lazy(() => import('@/pages/AdminDashboard'));
const Chat = lazy(() => import('@/pages/Chat'));
const ChatRooms = lazy(() => import('@/pages/ChatRooms').then((module) => ({ default: module.ChatRooms })));
const ChatRoomDetail = lazy(() => import('@/pages/ChatRooms').then((module) => ({ default: module.ChatRoomDetail })));

const PageLoader = () => (
  <div className="flex h-screen w-full items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/pets/:id" element={<PetDetail />} />
        <Route path="/users/:id" element={<UserDetail />} />

        {/* Protected */}
        <Route
          path="/pets/:id/edit"
          element={
            <ProtectedRoute>
              <EditPet />
            </ProtectedRoute>
          }
        />
        <Route
          path="/report"
          element={
            <ProtectedRoute>
              <ReportPet />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat/:userId"
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat/rooms"
          element={
            <ProtectedRoute>
              <ChatRooms />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat/rooms/:roomId"
          element={
            <ProtectedRoute>
              <ChatRoomDetail />
            </ProtectedRoute>
          }
        />

        {/* Admin only */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute adminOnly>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
