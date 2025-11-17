import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";
import { AppProvider } from "./context/AppContext";
import SignupPage from "./pages/SignupPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import EmailVerificationPage from "./pages/EmailVerificationPage";

function App() {

  return (
    <AppProvider>
      <div className="bg-black min-h-screen text-white">
        <Routes>
          <Route path="/signup" element={<SignupPage />}></Route>
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route
            path="/forgot-password/:token"
            element={<EmailVerificationPage />}
          />
          <Route path="/verify-email" element={<EmailVerificationPage />} />

          
          <Route path="/" element={<HomePage />}/>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </div>
    </AppProvider>
  );
}

export default App;
