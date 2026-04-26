import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../services/api";

const RoadmapPage = () => {
  const { roadmapId } = useParams();
  const [roadmap, setRoadmap] = useState(null);
  const [progress, setProgress] = useState({
    completedStepOrders: [],
    completionPercent: 0
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const completedSet = useMemo(() => new Set(progress.completedStepOrders || []), [progress.completedStepOrders]);

  const loadRoadmap = async () => {
    setLoading(true);
    try {
      const [roadmapRes, progressRes] = await Promise.all([
        api.get(`/roadmaps/${roadmapId}`),
        api.get(`/users/progress/${roadmapId}`)
      ]);
      setRoadmap(roadmapRes.data.roadmap);
      setProgress(progressRes.data.progress);
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to load roadmap.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoadmap();
  }, [roadmapId]);

  const toggleStep = async (stepOrder, currentlyCompleted) => {
    try {
      const { data } = await api.patch(`/roadmaps/${roadmapId}/progress`, {
        stepOrder,
        completed: !currentlyCompleted
      });
      setProgress(data.progress);
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to update progress.");
    }
  };

  if (loading) {
    return <p className="text-slate-600">Loading roadmap...</p>;
  }

  if (!roadmap) {
    return (
      <section className="rounded-xl bg-white p-6 shadow-sm">
        <p className="text-slate-700">{message || "Roadmap not found."}</p>
        <Link to="/ideas" className="mt-3 inline-block text-brand-700">
          Back to ideas
        </Link>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">{roadmap.title}</h1>
        <p className="mt-2 text-sm text-slate-600">{roadmap.overview}</p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-md bg-slate-100 px-3 py-2 text-sm">Idea: {roadmap.businessIdea?.title}</div>
          <div className="rounded-md bg-slate-100 px-3 py-2 text-sm">
            Cost: {roadmap.costEstimate?.currency} {roadmap.costEstimate?.min} - {roadmap.costEstimate?.max}
          </div>
          <div className="rounded-md bg-slate-100 px-3 py-2 text-sm">Steps: {roadmap.steps.length}</div>
          <div className="rounded-md bg-brand-100 px-3 py-2 text-sm font-semibold text-brand-700">
            Progress: {progress.completionPercent}%
          </div>
        </div>

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
          <div className="h-full bg-brand-600" style={{ width: `${progress.completionPercent}%` }} />
        </div>
      </div>

      {message && <p className="rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-700">{message}</p>}

      <div className="space-y-4">
        {roadmap.steps
          .slice()
          .sort((a, b) => a.order - b.order)
          .map((step) => {
            const isDone = completedSet.has(step.order);

            return (
              <article key={step.order} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Step {step.order}</p>
                    <h2 className="mt-1 text-lg font-semibold text-slate-900">{step.title}</h2>
                    <p className="mt-2 text-sm text-slate-600">{step.description}</p>
                  </div>
                  <label className="inline-flex items-center gap-2 rounded-md bg-slate-100 px-3 py-2 text-sm">
                    <input
                      type="checkbox"
                      checked={isDone}
                      onChange={() => toggleStep(step.order, isDone)}
                    />
                    Completed
                  </label>
                </div>

                <div className="mt-4 grid gap-3 text-xs text-slate-600 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-md bg-slate-100 px-2 py-2">Duration: {step.durationDays} days</div>
                  <div className="rounded-md bg-slate-100 px-2 py-2">
                    Skills: {step.requiredSkills?.join(", ") || "Not specified"}
                  </div>
                  <div className="rounded-md bg-slate-100 px-2 py-2">
                    Tools: {step.requiredTools?.join(", ") || "Not specified"}
                  </div>
                  <div className="rounded-md bg-slate-100 px-2 py-2">
                    Legal: {step.legalSteps?.join(", ") || "Not specified"}
                  </div>
                </div>

                {step.marketingTips?.length > 0 && (
                  <p className="mt-3 rounded-md bg-brand-50 px-3 py-2 text-sm text-brand-800">
                    Marketing tip: {step.marketingTips.join(", ")}
                  </p>
                )}
              </article>
            );
          })}
      </div>
    </section>
  );
};

export default RoadmapPage;
