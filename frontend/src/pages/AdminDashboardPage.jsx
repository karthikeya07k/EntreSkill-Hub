import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import StatCard from "../components/StatCard";

const AdminDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [pendingResources, setPendingResources] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const mentors = useMemo(() => users.filter((user) => user.role === "mentor"), [users]);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, pendingRes, feedbackRes] = await Promise.all([
        api.get("/admin/stats"),
        api.get("/admin/users"),
        api.get("/resources/pending/list"),
        api.get("/admin/feedback")
      ]);

      setStats(statsRes.data);
      setUsers(usersRes.data.users || []);
      setPendingResources(pendingRes.data.resources || []);
      setFeedback(feedbackRes.data.feedback || []);
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to load admin dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const verifyMentor = async (userId, mentorVerified) => {
    try {
      await api.patch(`/admin/mentors/${userId}/verify`, { mentorVerified });
      await loadAdminData();
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to update mentor verification.");
    }
  };

  const updateResourceStatus = async (id, status) => {
    try {
      await api.patch(`/resources/${id}/status`, { status });
      await loadAdminData();
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to update resource status.");
    }
  };

  if (loading) {
    return <p className="text-slate-600">Loading admin dashboard...</p>;
  }

  return (
    <section className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="mt-2 text-sm text-slate-600">
          Manage users, mentor verification, training content approvals, and engagement insights.
        </p>
      </div>

      {message && <p className="rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-700">{message}</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Users" value={stats?.usersCount ?? 0} />
        <StatCard title="Mentors" value={stats?.mentorsCount ?? 0} subtitle={`${stats?.verifiedMentorsCount ?? 0} verified`} />
        <StatCard title="Ideas Curated" value={stats?.ideaCount ?? 0} />
        <StatCard title="Roadmaps" value={stats?.roadmapCount ?? 0} />
        <StatCard title="Pending Resources" value={stats?.pendingResources ?? 0} />
        <StatCard title="Mentor Sessions" value={stats?.sessionsCount ?? 0} />
        <StatCard title="Feedback Entries" value={stats?.feedbackCount ?? 0} />
      </div>

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Mentor Verification</h2>
        <div className="mt-3 space-y-3">
          {mentors.length ? (
            mentors.map((mentor) => (
              <article key={mentor._id} className="rounded-md border border-slate-200 p-3">
                <p className="font-medium text-slate-900">{mentor.name}</p>
                <p className="text-xs text-slate-500">
                  {mentor.email} | Experience: {mentor.experienceYears || 0} years | Verified:{" "}
                  {mentor.mentorVerified ? "Yes" : "No"}
                </p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    className="rounded bg-emerald-600 px-2 py-1 text-xs font-semibold text-white"
                    onClick={() => verifyMentor(mentor._id, true)}
                  >
                    Verify
                  </button>
                  <button
                    type="button"
                    className="rounded bg-red-600 px-2 py-1 text-xs font-semibold text-white"
                    onClick={() => verifyMentor(mentor._id, false)}
                  >
                    Unverify
                  </button>
                </div>
              </article>
            ))
          ) : (
            <p className="text-sm text-slate-600">No mentors found.</p>
          )}
        </div>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Pending Training Content</h2>
        <div className="mt-3 space-y-3">
          {pendingResources.length ? (
            pendingResources.map((item) => (
              <article key={item._id} className="rounded-md border border-slate-200 p-3">
                <p className="font-medium text-slate-900">{item.title}</p>
                <p className="text-xs text-slate-500">Submitted by: {item.uploadedBy?.name || "Unknown mentor"}</p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    className="rounded bg-emerald-600 px-2 py-1 text-xs font-semibold text-white"
                    onClick={() => updateResourceStatus(item._id, "approved")}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    className="rounded bg-red-600 px-2 py-1 text-xs font-semibold text-white"
                    onClick={() => updateResourceStatus(item._id, "rejected")}
                  >
                    Reject
                  </button>
                </div>
              </article>
            ))
          ) : (
            <p className="text-sm text-slate-600">No pending resources.</p>
          )}
        </div>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Recent Feedback & Reports</h2>
        <div className="mt-3 space-y-3">
          {feedback.length ? (
            feedback.slice(0, 10).map((item) => (
              <article key={item._id} className="rounded-md border border-slate-200 p-3 text-sm">
                <p className="font-medium text-slate-900">
                  {item.fromUser?.name || "User"} rated {item.rating}/5 ({item.type})
                </p>
                <p className="mt-1 text-slate-600">{item.comment || "No comment provided."}</p>
              </article>
            ))
          ) : (
            <p className="text-sm text-slate-600">No feedback yet.</p>
          )}
        </div>
      </section>
    </section>
  );
};

export default AdminDashboardPage;
