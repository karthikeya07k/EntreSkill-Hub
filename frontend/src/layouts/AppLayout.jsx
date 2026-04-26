import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";

const AppLayout = () => (
  <div className="min-h-screen bg-slate-100">
    <Navbar />
    <main className="mx-auto max-w-6xl px-4 py-6">
      <Outlet />
    </main>
  </div>
);

export default AppLayout;
