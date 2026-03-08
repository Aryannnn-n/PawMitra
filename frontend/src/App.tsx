import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import AdminDashboard from '@/pages/AdminDashboard';
import Chat from '@/pages/Chat';
import { ChatRoomDetail, ChatRooms } from '@/pages/ChatRooms';
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

export default function App() {
  return (
    <BrowserRouter>
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
    </BrowserRouter>
  );
}
