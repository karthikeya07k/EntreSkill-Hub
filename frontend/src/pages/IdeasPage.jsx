import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const IdeaCard = ({ idea, isRecommended, isBookmarked, onBookmark, onOpenRoadmap }) => (
  <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
    {isRecommended && (
      <p className="mb-2 inline-block rounded-full bg-brand-100 px-2 py-1 text-xs font-semibold text-brand-700">
        Recommended
      </p>
    )}
    <h3 className="text-lg font-semibold text-slate-900">{idea.title}</h3>
    <p className="mt-2 text-sm text-slate-600">{idea.description}</p>
    {typeof idea.matchScore === "number" && (
      <p className="mt-2 text-xs font-semibold text-brand-700">
        Match Score: {idea.matchScore}% ({idea.fitLevel})
      </p>
    )}

    <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-600">
      <div className="rounded-md bg-slate-100 px-2 py-1">Category: {idea.category}</div>
      <div className="rounded-md bg-slate-100 px-2 py-1">Investment: {idea.estimatedInvestment}</div>
      <div className="rounded-md bg-slate-100 px-2 py-1">Difficulty: {idea.difficulty}</div>
      <div className="rounded-md bg-slate-100 px-2 py-1">Market: {idea.marketPotential}</div>
    </div>

    <div className="mt-4 flex flex-wrap gap-2">
      {idea.tags?.map((tag) => (
        <span key={tag} className="rounded-full border border-slate-200 px-2 py-1 text-xs text-slate-600">
          #{tag}
        </span>
      ))}
    </div>

    {isRecommended && (
      <div className="mt-3 rounded-md bg-slate-50 p-3 text-xs text-slate-700">
        <p className="font-semibold">Why this is recommended:</p>
        <p className="mt-1">{idea.recommendationSummary}</p>
        {!!idea.matchedSkills?.length && <p className="mt-1">Matched skills: {idea.matchedSkills.join(", ")}</p>}
        {!!idea.matchedInterests?.length && (
          <p className="mt-1">Matched interests: {idea.matchedInterests.join(", ")}</p>
        )}
        {!!idea.missingSkills?.length && <p className="mt-1">Skills to build next: {idea.missingSkills.join(", ")}</p>}
      </div>
    )}

    <div className="mt-5 flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => onBookmark(idea._id)}
        className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium"
      >
        {isBookmarked ? "Remove Bookmark" : "Bookmark Idea"}
      </button>
      <button
        type="button"
        onClick={() => onOpenRoadmap(idea._id)}
        className="rounded-md bg-brand-700 px-3 py-2 text-sm font-semibold text-white"
      >
        Open Roadmap
      </button>
    </div>
  </article>
);

const IdeasPage = () => {
  const navigate = useNavigate();
  const [ideas, setIdeas] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const bookmarkSet = useMemo(() => new Set(bookmarks.map((idea) => idea._id)), [bookmarks]);
  const recommendationIds = useMemo(() => new Set(recommended.map((item) => item._id)), [recommended]);

  const loadIdeas = async () => {
    setLoading(true);
    try {
      const [ideasRes, recRes, bookmarkRes] = await Promise.all([
        api.get("/ideas"),
        api.get("/ideas/recommended"),
        api.get("/users/bookmarks")
      ]);
      setIdeas(ideasRes.data.ideas || []);
      setRecommended(recRes.data.recommendations || []);
      setBookmarks(bookmarkRes.data.bookmarks || []);
    } catch (error) {
      setMessage(error.response?.data?.message || error.message || "Unable to load business ideas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIdeas();
  }, []);

  const onBookmark = async (ideaId) => {
    try {
      await api.post("/users/bookmarks/toggle", { ideaId });
      await loadIdeas();
    } catch (error) {
      setMessage(error.response?.data?.message || error.message || "Unable to update bookmark.");
    }
  };

  const onOpenRoadmap = async (ideaId) => {
    try {
      const { data } = await api.get(`/roadmaps/idea/${ideaId}`);
      navigate(`/roadmaps/${data.roadmap._id}`);
    } catch (error) {
      setMessage("Roadmap is not available for this idea yet.");
    }
  };

  if (loading) {
    return <p className="text-slate-600">Loading ideas...</p>;
  }

  return (
    <section className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Business Idea Recommendations</h1>
        <p className="mt-2 text-sm text-slate-600">
          Discover ideas aligned with your profile and follow roadmap-based execution.
        </p>
      </div>

      {message && (
        <p className="rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-700" role="status" aria-live="polite">
          {message}
        </p>
      )}

      <div>
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Top Matches For You</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {recommended.length ? (
            recommended.map((idea) => (
              <IdeaCard
                key={idea._id}
                idea={idea}
                isRecommended
                isBookmarked={bookmarkSet.has(idea._id)}
                onBookmark={onBookmark}
                onOpenRoadmap={onOpenRoadmap}
              />
            ))
          ) : (
            <p className="rounded-md border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600">
              Add skills and interests to your profile to receive better recommendations.
            </p>
          )}
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-slate-900">All Curated Ideas</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {ideas.map((idea) => (
            <IdeaCard
              key={idea._id}
              idea={idea}
              isRecommended={recommendationIds.has(idea._id)}
              isBookmarked={bookmarkSet.has(idea._id)}
              onBookmark={onBookmark}
              onOpenRoadmap={onOpenRoadmap}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default IdeasPage;
