import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const passwordChecklist = [
  "8-64 characters",
  "At least 1 uppercase letter",
  "At least 1 lowercase letter",
  "At least 1 number",
  "At least 1 special character"
];

const ResetPasswordPage = () => {
  const { resetPassword } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);

  const submitHandler = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!token) {
      setError("Reset token is missing. Please request a new reset link.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const data = await resetPassword({ token, password });
      setMessage(data.message || "Password reset successful.");
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Unable to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-lg rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-3xl font-bold text-slate-900">Set a new password</h1>
      <p className="mt-2 text-sm text-slate-600">Create a strong password to secure your account.</p>

      <ul className="mt-4 list-disc space-y-1 pl-5 text-xs text-slate-600">
        {passwordChecklist.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      <form className="mt-6 space-y-4" onSubmit={submitHandler}>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">New password</label>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Confirm password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            required
          />
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
          className="w-full rounded-lg bg-brand-700 px-4 py-2.5 font-semibold text-white disabled:opacity-70"
        >
          {loading ? "Updating..." : "Update password"}
        </button>
      </form>

      <p className="mt-4 text-sm text-slate-600">
        Back to{" "}
        <Link to="/login" className="font-semibold text-brand-700">
          login
        </Link>
      </p>
    </section>
  );
};

export default ResetPasswordPage;
