import { useEffect, useState } from "react";
import api from "../services/api";
import StatCard from "../components/StatCard";

const MentorDashboardPage = () => {
  const [engagement, setEngagement] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [resources, setResources] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const loadMentorDashboard = async () => {
    setLoading(true);
    try {
      const [engagementRes, sessionsRes, resourcesRes] = await Promise.all([
        api.get("/mentors/engagement/me"),
        api.get("/mentors/sessions/me"),
        api.get("/resources/me")
      ]);

      setEngagement(engagementRes.data);
      setSessions(sessionsRes.data.sessions || []);
      setResources(resourcesRes.data.resources || []);
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to load mentor dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMentorDashboard();
  }, []);

  const updateSessionStatus = async (sessionId, status) => {
    try {
      await api.patch(`/mentors/sessions/${sessionId}/status`, { status });
      await loadMentorDashboard();
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to update session.");
    }
  };

  if (loading) {
    return <p className="text-slate-600">Loading mentor dashboard...</p>;
  }

  return (
    <section className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Mentor Dashboard</h1>
        <p className="mt-2 text-sm text-slate-600">Track mentee engagement and manage mentorship sessions.</p>
      </div>

      {message && <p className="rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-700">{message}</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Sessions" value={engagement?.totalSessions ?? 0} />
        <StatCard title="Completed" value={engagement?.completedSessions ?? 0} />
        <StatCard title="Active" value={engagement?.activeSessions ?? 0} />
        <StatCard title="Completion Rate" value={`${engagement?.completionRate ?? 0}%`} />
      </div>

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Upcoming & Active Sessions</h2>
        <div className="mt-3 space-y-3">
          {sessions.length ? (
            sessions.map((session) => (
              <article key={session._id} className="rounded-lg border border-slate-200 p-3">
                <p className="font-medium text-slate-900">{session.topic}</p>
                <p className="text-xs text-slate-500">
                  Mentee: {session.mentee?.name} | {new Date(session.scheduledAt).toLocaleString()} |{" "}
                  <span className="capitalize">{session.status}</span>
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => updateSessionStatus(session._id, "confirmed")}
                    className="rounded bg-emerald-600 px-2 py-1 text-xs font-semibold text-white"
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    onClick={() => updateSessionStatus(session._id, "completed")}
                    className="rounded bg-slate-800 px-2 py-1 text-xs font-semibold text-white"
                  >
                    Complete
                  </button>
                  <button
                    type="button"
                    onClick={() => updateSessionStatus(session._id, "cancelled")}
                    className="rounded bg-red-600 px-2 py-1 text-xs font-semibold text-white"
                  >
                    Cancel
                  </button>
                </div>
              </article>
            ))
          ) : (
            <p className="text-sm text-slate-600">No mentorship sessions yet.</p>
          )}
        </div>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Uploaded Training Content</h2>
        <div className="mt-3 space-y-2">
          {resources.length ? (
            resources.map((item) => (
              <div key={item._id} className="rounded-md border border-slate-200 p-3 text-sm">
                <span className="font-medium text-slate-900">{item.title}</span>
                <span className="ml-2 rounded bg-slate-100 px-2 py-0.5 text-xs capitalize">{item.status}</span>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-600">No uploaded resources yet.</p>
          )}
        </div>
      </section>
    </section>
  );
};

export default MentorDashboardPage;
