import { Route, Routes } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleRoute from "./components/RoleRoute";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import AssessmentPage from "./pages/AssessmentPage";
import IdeasPage from "./pages/IdeasPage";
import RoadmapPage from "./pages/RoadmapPage";
import ResourcesPage from "./pages/ResourcesPage";
import MentorsPage from "./pages/MentorsPage";
import MentorDashboardPage from "./pages/MentorDashboardPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import NotFoundPage from "./pages/NotFoundPage";

const App = () => (
  <Routes>
    <Route element={<AppLayout />}>
      <Route index element={<HomePage />} />
      <Route path="login" element={<LoginPage />} />
      <Route path="register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="assessment" element={<AssessmentPage />} />
        <Route path="ideas" element={<IdeasPage />} />
        <Route path="roadmaps/:roadmapId" element={<RoadmapPage />} />
        <Route path="resources" element={<ResourcesPage />} />
        <Route path="mentors" element={<MentorsPage />} />

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
);

export default App;
