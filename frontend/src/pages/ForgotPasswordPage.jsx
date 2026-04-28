import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ForgotPasswordPage = () => {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [devResetLink, setDevResetLink] = useState("");

  const submitHandler = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    setDevResetLink("");

    try {
      const data = await forgotPassword({ email });
      setMessage(data.message || "If your email is registered, a reset link has been sent.");
      if (data.devResetLink) {
        setDevResetLink(data.devResetLink);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Unable to process request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-lg rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-3xl font-bold text-slate-900">Reset your password</h1>
      <p className="mt-2 text-sm text-slate-600">Enter your email and we’ll send a secure reset link.</p>

      <form className="mt-6 space-y-4" onSubmit={submitHandler}>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
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

        {devResetLink && (
          <a
            href={devResetLink}
            className="block rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800 underline"
          >
            Dev reset link: {devResetLink}
          </a>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-brand-700 px-4 py-2.5 font-semibold text-white disabled:opacity-70"
        >
          {loading ? "Sending..." : "Send reset link"}
        </button>
      </form>

      <p className="mt-4 text-sm text-slate-600">
        Remembered password?{" "}
        <Link to="/login" className="font-semibold text-brand-700">
          Back to login
        </Link>
      </p>
    </section>
  );
};

export default ForgotPasswordPage;
