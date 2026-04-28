import { useEffect, useMemo, useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";

const AppLayout = () => {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [isLowBandwidth, setIsLowBandwidth] = useState(false);

  useEffect(() => {
    const updateBandwidth = () => {
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      const effectiveType = connection?.effectiveType || "";
      const saveData = Boolean(connection?.saveData);
      setIsLowBandwidth(saveData || ["slow-2g", "2g"].includes(effectiveType));
    };

    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    updateBandwidth();

    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    connection?.addEventListener?.("change", updateBandwidth);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      connection?.removeEventListener?.("change", updateBandwidth);
    };
  }, []);

  const banner = useMemo(() => {
    if (!isOnline) {
      return {
        className: "bg-red-700 text-white",
        text: "You are offline. Some features like chat and profile updates will not sync."
      };
    }

    if (isLowBandwidth) {
      return {
        className: "bg-amber-100 text-amber-900",
        text: "Low-bandwidth mode detected. If pages are slow, wait a few seconds and retry."
      };
    }

    return null;
  }, [isLowBandwidth, isOnline]);

  return (
    <div className="min-h-screen">
      <div className="pointer-events-none fixed -left-20 top-10 h-56 w-56 rounded-full bg-brand-200/50 blur-3xl" />
      <div className="pointer-events-none fixed -right-20 top-40 h-64 w-64 rounded-full bg-cyan-200/50 blur-3xl" />
      <a
        href="#main-content"
        className="sr-only z-50 rounded-md bg-white px-3 py-2 text-sm font-medium text-slate-900 focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        Skip to main content
      </a>

      {banner && (
        <div className={`${banner.className} px-4 py-2 text-center text-sm`} role="status" aria-live="polite">
          {banner.text}
        </div>
      )}

      <Navbar />
      <main id="main-content" className="mx-auto max-w-6xl px-4 py-6 fade-in-rise">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
