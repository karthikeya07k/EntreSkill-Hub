import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const LoginPage = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  const submitHandler = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const data = await login(form);
      if (data.emailVerificationRequired) {
        navigate("/verify-email", {
          state: { email: form.email, devVerificationCode: data.devVerificationCode || "" }
        });
        return;
      }
      navigate(location.state?.from || "/dashboard");
    } catch (err) {
      if (err.response?.data?.emailVerificationRequired) {
        setMessage(err.response?.data?.message || "Verify your email first.");
        navigate("/verify-email", {
          state: {
            email: form.email,
            devVerificationCode: err.response?.data?.devVerificationCode || ""
          }
        });
      } else {
        setError(err.response?.data?.message || err.message || "Unable to log in.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-lg rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-3xl font-bold text-slate-900">Welcome back</h1>
      <p className="mt-2 text-sm text-slate-600">Login to continue your entrepreneurship roadmap.</p>

      <form className="mt-6 space-y-4" onSubmit={submitHandler}>
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

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
            className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-brand-500"
            required
          />
        </div>

        {message && (
          <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800" role="status">
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
          {loading ? "Signing in..." : "Login"}
        </button>
      </form>

      <div className="mt-4 flex items-center justify-between gap-2 text-sm text-slate-600">
        <p>
          New here?{" "}
          <Link to="/register" className="font-medium text-brand-700">
            Create an account
          </Link>
        </p>
        <Link to="/forgot-password" className="font-medium text-brand-700">
          Forgot password?
        </Link>
      </div>
    </section>
  );
};

export default LoginPage;
