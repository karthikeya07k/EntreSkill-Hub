import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,64}$/;

const RegisterPage = () => {
  const { register, user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
    motivation: "",
    experienceSummary: "",
    specialization: "",
    portfolioUrl: "",
    linkedinUrl: ""
  });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const submitHandler = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    if (!strongPasswordRegex.test(form.password)) {
      setError(
        "Password must be 8-64 characters and include uppercase, lowercase, number, and special character."
      );
      setLoading(false);
      return;
    }

    try {
      const payload = {
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role
      };

      if (form.role === "mentor") {
        payload.motivation = form.motivation;
        payload.experienceSummary = form.experienceSummary;
        payload.specialization = form.specialization
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
        payload.portfolioUrl = form.portfolioUrl;
        payload.linkedinUrl = form.linkedinUrl;
      }

      const response = await register(payload);
      setMessage(response.message || "Account created.");
      navigate("/verify-email", {
        state: {
          email: form.email,
          devVerificationCode: response.devVerificationCode || ""
        }
      });
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Unable to register.");
    } finally {
      setLoading(false);
    }
  };

  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <section className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-3xl font-bold text-slate-900">Create your account</h1>
      <p className="mt-2 text-sm text-slate-600">
        Start with your profile to get tailored business recommendations.
      </p>

      <form className="mt-6 space-y-4" onSubmit={submitHandler}>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Full Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-brand-500"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-brand-500"
              required
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
            className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-brand-500"
            required
          />
          <p className="mt-1 text-xs text-slate-500">
            Use 8+ chars with uppercase, lowercase, number, and special character.
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Account Type</label>
          <select
            value={form.role}
            onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
            className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-brand-500"
          >
            <option value="user">Aspiring Entrepreneur</option>
            <option value="mentor">Mentor / Trainer</option>
          </select>
        </div>

        {form.role === "mentor" && (
          <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h2 className="text-base font-semibold text-slate-900">Mentor onboarding application</h2>
            <p className="text-xs text-slate-600">
              Mentor accounts go live only after admin verification.
            </p>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Motivation</label>
              <textarea
                className="h-24 w-full rounded-md border border-slate-300 px-3 py-2"
                value={form.motivation}
                onChange={(e) => setForm((prev) => ({ ...prev, motivation: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Experience Summary</label>
              <textarea
                className="h-24 w-full rounded-md border border-slate-300 px-3 py-2"
                value={form.experienceSummary}
                onChange={(e) => setForm((prev) => ({ ...prev, experienceSummary: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Specialization (comma separated)
              </label>
              <input
                className="w-full rounded-md border border-slate-300 px-3 py-2"
                placeholder="Tailoring, Handicrafts"
                value={form.specialization}
                onChange={(e) => setForm((prev) => ({ ...prev, specialization: e.target.value }))}
                required
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Portfolio URL</label>
                <input
                  type="url"
                  className="w-full rounded-md border border-slate-300 px-3 py-2"
                  value={form.portfolioUrl}
                  onChange={(e) => setForm((prev) => ({ ...prev, portfolioUrl: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">LinkedIn URL</label>
                <input
                  type="url"
                  className="w-full rounded-md border border-slate-300 px-3 py-2"
                  value={form.linkedinUrl}
                  onChange={(e) => setForm((prev) => ({ ...prev, linkedinUrl: e.target.value }))}
                />
              </div>
            </div>
          </div>
        )}

        {message && (
          <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700" role="status">
            {message}
          </p>
        )}

        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-brand-700 px-4 py-2.5 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "Creating account..." : "Register"}
        </button>
      </form>

      <p className="mt-4 text-sm text-slate-600">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-brand-700">
          Login
        </Link>
      </p>
    </section>
  );
};

export default RegisterPage;
