// import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
// import LandingPage from "./pages/LandingPage";
// import OwnerDashboard from "./pages/OwnerDashboard";
// import CustomerDashboard from "./pages/CustomerDashboard";

// /* 🔐 Protect owner routes */
// function ProtectedRoute({ children }) {
//   const token = localStorage.getItem("token");
//   const role = localStorage.getItem("role");

//   return token && role === "owner"
//     ? children
//     : <Navigate to="/" replace />;
// }

// export default function App() {
//   return (
//     <Router>
//       <Routes>
//         {/* Login / Landing */}
//         <Route path="/" element={<LandingPage />} />

//         {/* Owner Dashboard */}
//         <Route
//           path="/dashboard"
//           element={
//             <ProtectedRoute>
//               <OwnerDashboard />
//             </ProtectedRoute>
//           }
//         />

//         {/* Fallback */}
//         <Route path="*" element={<Navigate to="/" />} />
//       </Routes>
//     </Router>
//   );
// }

// export default function App() {
//     return (
//         <BrowserRouter>
//             <Routes>
//                 <Route path="/"          element={<LandingPage />} />
//                 <Route path="/dashboard" element={
//                     <ProtectedRoute>
//                         <OwnerDashboard onLogout={() =>
//                             window.location.href = "/"} />
//                     </ProtectedRoute>
//                 } />
//                 <Route path="/customer"  element={
//                     <ProtectedRoute>
//                         <CustomerDashboard onLogout={() =>
//                             window.location.href = "/"} />
//                     </ProtectedRoute>
//                 } />
//             </Routes>
//         </BrowserRouter>
//     );
// }
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import LandingPage from "./pages/LandingPage";
import OwnerDashboard from "./pages/OwnerDashboard";
import CustomerDashboard from "./pages/CustomerDashboard";

/* 🔐 Protected Route for Owner */
function OwnerProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  return token && role === "owner" ? children : <Navigate to="/" replace />;
}

/* 🔐 Protected Route for Customer */
function CustomerProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  return token && role === "customer" ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public Route */}
        <Route path="/" element={<LandingPage />} />

        {/* Owner Routes */}
        <Route
          path="/dashboard"
          element={
            <OwnerProtectedRoute>
              <OwnerDashboard />
            </OwnerProtectedRoute>
          }
        />

        {/* Customer Routes */}
        <Route
          path="/customer"
          element={
            <CustomerProtectedRoute>
              <CustomerDashboard />
            </CustomerProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}