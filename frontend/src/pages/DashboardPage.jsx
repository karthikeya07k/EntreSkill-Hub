import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import StatCard from "../components/StatCard";

const DashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feedbackForm, setFeedbackForm] = useState({ rating: 5, comment: "", type: "platform" });
  const [feedbackMessage, setFeedbackMessage] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      try {
        const [statsRes, profileRes] = await Promise.all([api.get("/users/dashboard"), api.get("/users/profile")]);
        setStats(statsRes.data);
        setProfile(profileRes.data.user);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  if (loading) {
    return <p className="text-slate-600">Loading dashboard...</p>;
  }

  const submitFeedback = async (event) => {
    event.preventDefault();
    try {
      await api.post("/feedback", feedbackForm);
      setFeedbackForm({ rating: 5, comment: "", type: "platform" });
      setFeedbackMessage("Thank you. Your feedback was submitted.");
    } catch (error) {
      setFeedbackMessage(error.response?.data?.message || "Unable to submit feedback.");
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Welcome, {profile?.name || user?.name}</h1>
        <p className="mt-2 text-sm text-slate-600">
          Track your startup progress and continue building your business roadmap with confidence.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Saved Ideas" value={stats?.totalBookmarks ?? 0} subtitle="Bookmarked business options" />
        <StatCard title="Completed Roadmaps" value={stats?.completedRoadmaps ?? 0} subtitle="Fully completed tracks" />
        <StatCard title="Average Progress" value={`${stats?.avgCompletion ?? 0}%`} subtitle="Across active roadmaps" />
        <StatCard title="Account Role" value={user?.role || "user"} subtitle="Role-based dashboard enabled" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Progress Tracking</h2>
          <div className="mt-4 space-y-3">
            {stats?.progress?.length ? (
              stats.progress.map((item) => (
                <div key={item.roadmapId} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-800">{item.roadmapTitle}</span>
                    <span className="font-semibold text-brand-700">{item.completionPercent}%</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full bg-brand-600" style={{ width: `${item.completionPercent}%` }} />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-600">No roadmap progress yet. Start with idea recommendations.</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Quick Actions</h2>
          <div className="mt-4 grid gap-3">
            <Link to="/assessment" className="rounded-lg border border-slate-300 px-4 py-3 text-sm font-medium">
              Update Skill & Interest Profile
            </Link>
            <Link to="/ideas" className="rounded-lg border border-slate-300 px-4 py-3 text-sm font-medium">
              Explore Recommended Business Ideas
            </Link>
            <Link to="/resources" className="rounded-lg border border-slate-300 px-4 py-3 text-sm font-medium">
              Continue Learning Resources
            </Link>
            <Link to="/mentors" className="rounded-lg border border-slate-300 px-4 py-3 text-sm font-medium">
              Connect with Verified Mentors
            </Link>
            {user?.role === "mentor" && (
              <Link to="/mentor" className="rounded-lg bg-brand-700 px-4 py-3 text-sm font-semibold text-white">
                Open Mentor Dashboard
              </Link>
            )}
            {user?.role === "admin" && (
              <Link to="/admin" className="rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white">
                Open Admin Dashboard
              </Link>
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Share Feedback</h2>
          <p className="mt-1 text-sm text-slate-600">
            Help us improve roadmaps, mentorship quality, and training resources.
          </p>

          <form className="mt-4 space-y-3" onSubmit={submitFeedback}>
            <div className="grid grid-cols-2 gap-3">
              <select
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={feedbackForm.type}
                onChange={(e) => setFeedbackForm((prev) => ({ ...prev, type: e.target.value }))}
              >
                <option value="platform">Platform</option>
                <option value="mentor">Mentor</option>
                <option value="resource">Resource</option>
              </select>
              <select
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={feedbackForm.rating}
                onChange={(e) => setFeedbackForm((prev) => ({ ...prev, rating: Number(e.target.value) }))}
              >
                <option value={5}>5 - Excellent</option>
                <option value={4}>4 - Good</option>
                <option value={3}>3 - Average</option>
                <option value={2}>2 - Needs Improvement</option>
                <option value={1}>1 - Poor</option>
              </select>
            </div>

            <textarea
              className="h-24 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="Your suggestions"
              value={feedbackForm.comment}
              onChange={(e) => setFeedbackForm((prev) => ({ ...prev, comment: e.target.value }))}
            />

            <button type="submit" className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
              Submit Feedback
            </button>
          </form>

          {feedbackMessage && <p className="mt-3 text-sm text-slate-600">{feedbackMessage}</p>}
        </div>
      </div>
    </section>
  );
};

export default DashboardPage;
