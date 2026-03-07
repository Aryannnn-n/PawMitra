import Home from '@/pages/Home';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
// Add more pages as they get built:
// import Search      from '@/pages/Search';
// import PetDetail   from '@/pages/PetDetail';
// import ReportPet   from '@/pages/ReportPet';
// import Profile     from '@/pages/Profile';
// import Notifications from '@/pages/Notifications';
// import Chat        from '@/pages/Chat';
// import AdminDashboard from '@/pages/admin/Dashboard';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected — uncomment as pages are built */}
        {/* <Route path="/search"        element={<Search />} /> */}
        {/* <Route path="/pets/:id"      element={<PetDetail />} /> */}
        {/* <Route path="/report"        element={<ProtectedRoute><ReportPet /></ProtectedRoute>} /> */}
        {/* <Route path="/profile"       element={<ProtectedRoute><Profile /></ProtectedRoute>} /> */}
        {/* <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} /> */}
        {/* <Route path="/chat/*"        element={<ProtectedRoute><Chat /></ProtectedRoute>} /> */}
        {/* <Route path="/admin/*"       element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} /> */}
      </Routes>
    </BrowserRouter>
  );
}
