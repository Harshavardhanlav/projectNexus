import "./App.css";

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navbar } from "./frontend/RNavbar";
import { LNavbar } from "./frontend/LNavbar";

import { Hero } from "./frontend/Hero";
import { AuthPanel } from "./frontend/AuthPanel";
import { Features } from "./frontend/Features";
import { About } from "./frontend/About";
import { Team } from "./frontend/Team";
import { Footer } from "./frontend/Footer";
import {LAuthPanel} from "./frontend/LAuthPanel"
import{LHero} from "./frontend/LHero"

// Import Dashboard Components
import { Sidebar } from "./components/Sidebar/Sidebar";
import { TeacherSidebar } from "./components/TeacherSidebar/TeacherSidebar";
import { Header } from "./components/Header/Header";
import { AppRoutes } from "./routes/AppRoutes";
import { TeacherRoutes } from "./routes/TeacherRoutes";
import { ThemeProvider } from "./components/ThemeProvider/ThemeProvider";

import { useEffect, useState } from "react";

function App() {

   const initialRole = (() => {
      const storedRole = localStorage.getItem("userRole");
      if (storedRole === "teacher" || storedRole === "admin") return storedRole;
      return localStorage.getItem("adminLoggedIn") === "true" ? "admin" : null;
   })();

   const [register, setRegister] = useState(() => initialRole === null);
   const [isUserLoggedIn, setIsUserLoggedIn] = useState(() => initialRole !== null);
   const [userRole, setUserRole] = useState(() => initialRole);
   const [mobileNavOpen, setMobileNavOpen] = useState(false);

   const checkAdmin = async () => {
      try {
         const response = await fetch(
"https://community-service-project-backend.onrender.com/admin/check-admin"
);

         const data = await response.json();

         console.log(data);

         setRegister(false);
      } catch (err) {
         console.error(err);
         setRegister(true);
      }
   };

   useEffect(() => {
      if (userRole) return;
      checkAdmin();
   }, [userRole]);

const handleLoginSuccess = () => {
   const role = localStorage.getItem("userRole");
   setUserRole(role);
   setIsUserLoggedIn(true);
};

const handleRegisterSuccess = () => {
   localStorage.setItem("userRole", "admin");
   localStorage.setItem("adminLoggedIn", "true");
   setUserRole("admin");
   setIsUserLoggedIn(true);
};

if (isUserLoggedIn && userRole === "admin") {
   return (
      <BrowserRouter>
         <ThemeProvider>
            <div className="app-dashboard">
               <Sidebar isOpen={mobileNavOpen} onNavigate={() => setMobileNavOpen(false)} />
               <div className="app-dashboard-content">
                  <Header onMenuClick={() => setMobileNavOpen((open) => !open)} />
                  <AppRoutes />
               </div>
            </div>
         </ThemeProvider>
      </BrowserRouter>
   );
}

if (isUserLoggedIn && userRole === "teacher") {
   return (
      <BrowserRouter>
         <ThemeProvider>
            <div className="app-dashboard">
               <TeacherSidebar isOpen={mobileNavOpen} onNavigate={() => setMobileNavOpen(false)} />
               <div className="app-dashboard-content">
                  <Header onMenuClick={() => setMobileNavOpen((open) => !open)} />
                  <TeacherRoutes />
               </div>
            </div>
         </ThemeProvider>
      </BrowserRouter>
   );
}

return (
   <div className="app">

      {register ? <Navbar /> : <LNavbar />}

      {register ? <Hero /> : <LHero />}

      {register ? (
         <AuthPanel onRegisterSuccess={handleRegisterSuccess} />
      ) : (
         <LAuthPanel onLoginSuccess={handleLoginSuccess} />
      )}

      <Features />
      <About />
      <Team />
      <Footer />

   </div>
);
}

export default App;