import { Navigate, useNavigate } from "react-router-dom";
import { useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const MentorApplicationPage = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    motivation: "",
    experienceSummary: "",
    specialization: "",
    portfolioUrl: "",
    linkedinUrl: "",
    availability: ""
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  if (!user) return <Navigate to="/login" replace />;

  if (user.role === "mentor" && user.mentorApplicationStatus === "approved") {
    return <Navigate to="/mentor" replace />;
  }

  const submitHandler = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      await api.post("/mentors/apply", {
        motivation: form.motivation,
        experienceSummary: form.experienceSummary,
        specialization: form.specialization
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        portfolioUrl: form.portfolioUrl,
        linkedinUrl: form.linkedinUrl,
        availability: form.availability
      });
      await refreshUser();
      setMessage("Application submitted. Admin review is pending.");
      setTimeout(() => navigate("/dashboard"), 800);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Unable to submit mentor application.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-3xl font-bold text-slate-900">Apply as a mentor</h1>
      <p className="mt-2 text-sm text-slate-600">
        Your profile goes live only after admin approval. Please submit complete details for verification.
      </p>

      <form className="mt-6 space-y-4" onSubmit={submitHandler}>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Why do you want to mentor?</label>
          <textarea
            className="h-24 w-full rounded-lg border border-slate-300 px-3 py-2"
            value={form.motivation}
            onChange={(event) => setForm((prev) => ({ ...prev, motivation: event.target.value }))}
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Experience summary</label>
          <textarea
            className="h-24 w-full rounded-lg border border-slate-300 px-3 py-2"
            value={form.experienceSummary}
            onChange={(event) => setForm((prev) => ({ ...prev, experienceSummary: event.target.value }))}
            required
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Specializations (comma separated)
            </label>
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              value={form.specialization}
              onChange={(event) => setForm((prev) => ({ ...prev, specialization: event.target.value }))}
              placeholder="Tailoring, Digital Marketing"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Availability</label>
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              value={form.availability}
              onChange={(event) => setForm((prev) => ({ ...prev, availability: event.target.value }))}
              placeholder="Weekdays 6 PM - 9 PM"
              required
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Portfolio URL</label>
            <input
              type="url"
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              value={form.portfolioUrl}
              onChange={(event) => setForm((prev) => ({ ...prev, portfolioUrl: event.target.value }))}
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">LinkedIn URL</label>
            <input
              type="url"
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              value={form.linkedinUrl}
              onChange={(event) => setForm((prev) => ({ ...prev, linkedinUrl: event.target.value }))}
              placeholder="https://..."
            />
          </div>
        </div>

        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {error}
          </p>
        )}

        {message && (
          <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700" role="status">
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-brand-700 px-4 py-2.5 font-semibold text-white disabled:opacity-70"
        >
          {loading ? "Submitting..." : "Submit mentor application"}
        </button>
      </form>
    </section>
  );
};

export default MentorApplicationPage;
