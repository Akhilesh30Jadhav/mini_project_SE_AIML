import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import AppShell from "./AppShell";
import { getAuth } from "@/features/auth/auth.store";
import type { UserRole } from "@/lib/utils";

// Public
import Landing from "@/pages/public/Landing";
import Login from "@/pages/public/Login";

// Patient
import PatientDashboard from "@/pages/patient/PatientDashboard";
import RiskPrediction from "@/pages/patient/RiskPrediction";
import ReportAnalyzer from "@/pages/patient/ReportAnalyzer";
import Appointments from "@/pages/patient/Appointments";
import History from "@/pages/patient/History";

// Doctor
import DoctorDashboard from "@/pages/doctor/DoctorDashboard";
import Patients from "@/pages/doctor/Patients";
import PatientDetail from "@/pages/doctor/PatientDetail";

function RequireAuth({ role, children }: { role: UserRole; children: React.ReactNode }) {
  const auth = getAuth();
  const loc = useLocation();

  if (!auth.isAuthed) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  if (auth.role !== role) return <Navigate to={auth.role === "doctor" ? "/doctor" : "/patient"} replace />;
  return <>{children}</>;
}

function HomeRedirect() {
  const auth = getAuth();
  if (!auth.isAuthed) return <Landing />;
  return <Navigate to={auth.role === "doctor" ? "/doctor" : "/patient"} replace />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<Login />} />

      {/* Patient area */}
      <Route
        path="/patient"
        element={
          <RequireAuth role="patient">
            <AppShell role="patient" />
          </RequireAuth>
        }
      >
        <Route index element={<PatientDashboard />} />
        <Route path="risk" element={<RiskPrediction />} />
        <Route path="reports" element={<ReportAnalyzer />} />
        <Route path="appointments" element={<Appointments />} />
        <Route path="history" element={<History />} />
      </Route>

      {/* Doctor area */}
      <Route
        path="/doctor"
        element={
          <RequireAuth role="doctor">
            <AppShell role="doctor" />
          </RequireAuth>
        }
      >
        <Route index element={<DoctorDashboard />} />
        <Route path="patients" element={<Patients />} />
        <Route path="patients/:id" element={<PatientDetail />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
