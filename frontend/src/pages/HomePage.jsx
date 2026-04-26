import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const HomePage = () => {
  const { user } = useAuth();

  return (
    <section className="rounded-2xl bg-white p-8 shadow-sm">
      <div className="grid gap-8 md:grid-cols-2 md:items-center">
        <div>
          <p className="mb-3 inline-block rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-700">
            Skill-to-Startup Enablement
          </p>
          <h1 className="text-3xl font-bold leading-tight text-slate-900 md:text-4xl">
            Turn your practical skills into a sustainable micro-business
          </h1>
          <p className="mt-4 text-slate-600">
            EntreSkill Hub guides you from idea discovery to execution with roadmaps, training resources, and mentor
            support.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            {user ? (
              <Link to="/dashboard" className="rounded-md bg-brand-700 px-5 py-2.5 font-semibold text-white">
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link to="/register" className="rounded-md bg-brand-700 px-5 py-2.5 font-semibold text-white">
                  Start Your Journey
                </Link>
                <Link
                  to="/login"
                  className="rounded-md border border-slate-300 px-5 py-2.5 font-semibold text-slate-800"
                >
                  Login
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-brand-800 to-brand-500 p-6 text-white shadow-lg">
          <h2 className="text-xl font-semibold">What you get in Phase 1</h2>
          <ul className="mt-4 space-y-2 text-sm">
            <li>Skill and interest assessment</li>
            <li>Business idea recommendations</li>
            <li>Step-by-step business roadmaps</li>
            <li>Learning videos, articles, and checklists</li>
            <li>Mentor directory with session booking</li>
            <li>Progress tracking dashboard</li>
          </ul>
        </div>
      </div>
    </section>
  );
};

export default HomePage;
