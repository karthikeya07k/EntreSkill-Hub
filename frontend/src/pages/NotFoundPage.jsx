import { Link } from "react-router-dom";

const NotFoundPage = () => (
  <section className="mx-auto max-w-xl rounded-2xl bg-white p-8 text-center shadow-sm">
    <h1 className="text-3xl font-bold text-slate-900">404</h1>
    <p className="mt-2 text-slate-600">The page you are looking for does not exist.</p>
    <Link to="/" className="mt-4 inline-block rounded-md bg-brand-700 px-4 py-2 font-semibold text-white">
      Return Home
    </Link>
  </section>
);

export default NotFoundPage;
