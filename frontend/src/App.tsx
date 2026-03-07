import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import Notifications from '@/pages/Notifications';
import PetDetail from '@/pages/PetDetail';
import Profile from '@/pages/Profile';
import Register from '@/pages/Register';
import ReportPet from '@/pages/ReportPet';
import Search from '@/pages/Search';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected */}
        <Route path="/search" element={<Search />} />
        <Route path="/pets/:id" element={<PetDetail />} />
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
      </Routes>
    </BrowserRouter>
  );
}
