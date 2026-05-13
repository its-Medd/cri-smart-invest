// src/App.js
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';


import './Styles/globales.css';


import NavBar  from './Components/NavBar.jsx';
import Footer  from './Components/Footer.jsx';


import Acceuil     from './Components/Acceuil.jsx';
import Eligibilite from './Components/Eligibilite.jsx';
import CalculateurPrimes from './Components/CalculateurPrimes.jsx';
import Dossier        from './Components/Dossier.jsx';
import Questionnaire  from './Components/Questionnaire.jsx';
import AdminRoute from "./Components/AdminRoute.jsx";
import PrivateRoute from "./Components/PrivateRoute.jsx";
import AdminLogin from "./Components/AdminLogin.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import OAuth2RedirectHandler from "./Components/OAuth2RedirectHandler.jsx";
import Dashboard from './Components/Dashboard.jsx';
import VisitorLogin from './Components/VisitorLogin.jsx';
import Register from './Components/Register';
import Profile from './Components/Profile.jsx';
import Chatbot from './Components/Chatbot.jsx';

export default function App() {
  return (
    <AuthProvider>
    <BrowserRouter>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <NavBar />
        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/"            element={<Acceuil />} />
            <Route path="/eligibilite" element={<Eligibilite />} />
            <Route path="/simulateur"  element={<CalculateurPrimes />} />
            <Route path="/dossier"        element={<Dossier />} />
            <Route path="/questionnaire"  element={
              <PrivateRoute><Questionnaire /></PrivateRoute>
            } />
            <Route path="/etapes"      element={<Navigate to="/" replace />} />
            <Route path="/cri"         element={<Navigate to="/" replace />} />
            <Route path="/espace"      element={<Navigate to="/visitorlogin" replace />} />
            <Route path="/login"       element={<Navigate to="/visitorlogin" replace />} />
            <Route path="/oauth2/redirect" element={<OAuth2RedirectHandler />} />
            <Route path="/visitorlogin" element={<VisitorLogin />} />
            <Route path="/register"     element={<Register />} />
            <Route path="/profile"      element={<Profile />} />
            <Route path="/admin/login"  element={<AdminLogin />} />

            {/* Dashboard — ADMIN only */}
            <Route path="/dashboard" element={
              <AdminRoute><Dashboard /></AdminRoute>
            } />

            {/* 404 - always last */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
        <Chatbot />
      </div>
    </BrowserRouter>
    </AuthProvider>
  );
}