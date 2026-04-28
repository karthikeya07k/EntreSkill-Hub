import { Suspense, lazy } from "react";
import { Route, Routes } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleRoute from "./components/RoleRoute";

const HomePage = lazy(() => import("./pages/HomePage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const VerifyEmailPage = lazy(() => import("./pages/VerifyEmailPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const AssessmentPage = lazy(() => import("./pages/AssessmentPage"));
const IdeasPage = lazy(() => import("./pages/IdeasPage"));
const RoadmapPage = lazy(() => import("./pages/RoadmapPage"));
const ResourcesPage = lazy(() => import("./pages/ResourcesPage"));
const MentorsPage = lazy(() => import("./pages/MentorsPage"));
const MentorApplicationPage = lazy(() => import("./pages/MentorApplicationPage"));
const MentorDashboardPage = lazy(() => import("./pages/MentorDashboardPage"));
const AdminDashboardPage = lazy(() => import("./pages/AdminDashboardPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

const PageFallback = () => (
  <p className="rounded-md bg-white px-4 py-3 text-sm text-slate-600 shadow-sm" aria-live="polite">
    Loading page...
  </p>
);

const App = () => (
  <Suspense fallback={<PageFallback />}>
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="verify-email" element={<VerifyEmailPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="reset-password" element={<ResetPasswordPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="assessment" element={<AssessmentPage />} />
          <Route path="ideas" element={<IdeasPage />} />
          <Route path="roadmaps/:roadmapId" element={<RoadmapPage />} />
          <Route path="resources" element={<ResourcesPage />} />
          <Route path="mentors" element={<MentorsPage />} />
          <Route path="mentor-apply" element={<MentorApplicationPage />} />

          <Route element={<RoleRoute roles={["mentor", "admin"]} />}>
            <Route path="mentor" element={<MentorDashboardPage />} />
          </Route>

          <Route element={<RoleRoute roles={["admin"]} />}>
            <Route path="admin" element={<AdminDashboardPage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  </Suspense>
);

export default App;
