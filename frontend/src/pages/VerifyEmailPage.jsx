import { useMemo, useState } from "react";
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const VerifyEmailPage = () => {
  const { user, verifyEmail, resendVerification } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const initialEmail = useMemo(
    () => location.state?.email || searchParams.get("email") || "",
    [location.state?.email, searchParams]
  );

  const [form, setForm] = useState({
    email: initialEmail,
    code: ""
  });
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [devCode, setDevCode] = useState(location.state?.devVerificationCode || "");

  if (user) return <Navigate to="/dashboard" replace />;

  const submitHandler = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      await verifyEmail(form);
      setMessage("Email verified. Redirecting to your dashboard...");
      setTimeout(() => navigate("/dashboard"), 700);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Unable to verify email.");
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    if (!form.email) {
      setError("Enter your email first.");
      return;
    }

    setResending(true);
    setError("");
    setMessage("");

    try {
      const response = await resendVerification({ email: form.email });
      setMessage(response.message || "Verification code sent.");
      if (response.devVerificationCode) {
        setDevCode(response.devVerificationCode);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Unable to resend code.");
    } finally {
      setResending(false);
    }
  };

  return (
    <section className="mx-auto max-w-lg rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-3xl font-bold text-slate-900">Verify your email</h1>
      <p className="mt-2 text-sm text-slate-600">
        Enter the 6-digit code sent to your email. Email verification is required before login.
      </p>

      <form className="mt-6 space-y-4" onSubmit={submitHandler}>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Verification code</label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={form.code}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                code: event.target.value.replace(/[^\d]/g, "").slice(0, 6)
              }))
            }
            className="w-full rounded-lg border border-slate-300 px-3 py-2 tracking-[0.25em]"
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

        {devCode && (
          <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Dev mode code: <span className="font-semibold">{devCode}</span>
          </p>
        )}

        <button
          type="submit"
          className="w-full rounded-lg bg-brand-700 px-4 py-2.5 font-semibold text-white disabled:opacity-70"
          disabled={loading}
        >
          {loading ? "Verifying..." : "Verify email"}
        </button>
      </form>

      <div className="mt-4 flex items-center justify-between">
        <button
          type="button"
          onClick={resendCode}
          disabled={resending}
          className="text-sm font-semibold text-brand-700 disabled:opacity-60"
        >
          {resending ? "Resending..." : "Resend code"}
        </button>
        <Link to="/login" className="text-sm text-slate-600 underline-offset-2 hover:underline">
          Back to login
        </Link>
      </div>
    </section>
  );
};

export default VerifyEmailPage;
