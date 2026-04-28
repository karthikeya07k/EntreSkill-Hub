import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const ResourcesPage = () => {
  const { user } = useAuth();
  const [resources, setResources] = useState([]);
  const [myResources, setMyResources] = useState([]);
  const [pendingResources, setPendingResources] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [recommendedTracks, setRecommendedTracks] = useState([]);
  const [selectedTrackId, setSelectedTrackId] = useState("");
  const [selectedTrackData, setSelectedTrackData] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingLessonId, setSavingLessonId] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "article",
    url: "",
    topic: "",
    tags: ""
  });

  const completedLessonsSet = useMemo(
    () => new Set(selectedTrackData?.progress?.completedLessonIds || []),
    [selectedTrackData?.progress?.completedLessonIds]
  );

  const loadTrackDetails = async (trackId) => {
    if (!trackId) {
      setSelectedTrackData(null);
      return;
    }

    try {
      const { data } = await api.get(`/courses/tracks/${trackId}`);
      setSelectedTrackData(data);
    } catch (error) {
      setSelectedTrackData(null);
    }
  };

  const loadResources = async () => {
    setLoading(true);
    try {
      const requests = [api.get("/resources"), api.get("/courses/tracks"), api.get("/courses/tracks/recommended")];

      if (["mentor", "admin"].includes(user.role)) {
        requests.push(api.get("/resources/me"));
      }

      if (user.role === "admin") {
        requests.push(api.get("/resources/pending/list"));
      }

      const responses = await Promise.all(requests);
      setResources(responses[0].data.resources || []);
      const fetchedTracks = responses[1].data.tracks || [];
      const fetchedRecommendedTracks = responses[2].data.tracks || [];
      setTracks(fetchedTracks);
      setRecommendedTracks(fetchedRecommendedTracks);

      const firstTrackId =
        selectedTrackId ||
        fetchedRecommendedTracks[0]?._id ||
        fetchedTracks[0]?._id ||
        "";

      if (firstTrackId) {
        setSelectedTrackId(firstTrackId);
        await loadTrackDetails(firstTrackId);
      } else {
        setSelectedTrackId("");
        setSelectedTrackData(null);
      }

      let pointer = 3;
      if (["mentor", "admin"].includes(user.role)) {
        setMyResources(responses[pointer].data.resources || []);
        pointer += 1;
      }

      if (user.role === "admin") {
        setPendingResources(responses[pointer].data.resources || []);
      }
    } catch (error) {
      setMessage(error.response?.data?.message || error.message || "Unable to load learning hub.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResources();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.role]);

  useEffect(() => {
    if (selectedTrackId) {
      loadTrackDetails(selectedTrackId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTrackId]);

  const submitResource = async (event) => {
    event.preventDefault();
    setMessage("");

    try {
      await api.post("/resources", {
        ...form,
        tags: form.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
      });
      setForm({
        title: "",
        description: "",
        type: "article",
        url: "",
        topic: "",
        tags: ""
      });
      setMessage("Resource submitted successfully.");
      await loadResources();
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to submit resource.");
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/resources/${id}/status`, { status });
      await loadResources();
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to update resource status.");
    }
  };

  const toggleLesson = async (lessonId, completed) => {
    if (!selectedTrackId) return;
    setSavingLessonId(lessonId);
    try {
      await api.patch(`/courses/tracks/${selectedTrackId}/progress`, {
        lessonId,
        completed: !completed
      });
      await loadTrackDetails(selectedTrackId);
      const tracksRes = await api.get("/courses/tracks");
      setTracks(tracksRes.data.tracks || []);
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to update learning progress.");
    } finally {
      setSavingLessonId("");
    }
  };

  if (loading) {
    return <p className="text-slate-600">Loading learning hub...</p>;
  }

  return (
    <section className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Learning Hub</h1>
        <p className="mt-2 text-sm text-slate-600">
          Follow structured tracks (modules and lessons), track completion, and access curated resources.
        </p>
      </div>

      {message && <p className="rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-700">{message}</p>}

      <section className="grid gap-4 lg:grid-cols-[340px_1fr]">
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Recommended tracks</h2>
          <div className="mt-3 space-y-2">
            {recommendedTracks.length ? (
              recommendedTracks.map((track) => (
                <button
                  key={track._id}
                  type="button"
                  onClick={() => setSelectedTrackId(track._id)}
                  className={`w-full rounded-md border p-3 text-left text-sm ${
                    selectedTrackId === track._id ? "border-brand-500 bg-brand-50" : "border-slate-200"
                  }`}
                >
                  <p className="font-semibold text-slate-900">{track.title}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {track.level} | Score: {track.score ?? 0}
                  </p>
                </button>
              ))
            ) : (
              <p className="text-sm text-slate-600">No personalized tracks yet.</p>
            )}
          </div>

          <h3 className="mt-5 text-sm font-semibold text-slate-900">All tracks</h3>
          <div className="mt-2 space-y-2">
            {tracks.map((track) => (
              <button
                key={track._id}
                type="button"
                onClick={() => setSelectedTrackId(track._id)}
                className={`w-full rounded-md border p-2 text-left text-xs ${
                  selectedTrackId === track._id ? "border-brand-500 bg-brand-50" : "border-slate-200"
                }`}
              >
                <p className="font-semibold text-slate-900">{track.title}</p>
                <p className="text-slate-600">
                  {track.completionPercent || 0}% complete | {track.totalLessons || 0} lessons
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          {selectedTrackData?.track ? (
            <>
              <h2 className="text-xl font-semibold text-slate-900">{selectedTrackData.track.title}</h2>
              <p className="mt-2 text-sm text-slate-600">{selectedTrackData.track.description}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
                <span className="rounded-full bg-slate-100 px-2 py-1">{selectedTrackData.track.category}</span>
                <span className="rounded-full bg-slate-100 px-2 py-1">{selectedTrackData.track.level}</span>
                <span className="rounded-full bg-brand-100 px-2 py-1 font-semibold text-brand-700">
                  {selectedTrackData.progress?.completionPercent || 0}% completed
                </span>
              </div>

              <div className="mt-4 space-y-4">
                {(selectedTrackData.track.modules || []).map((moduleItem) => (
                  <article key={moduleItem.moduleId} className="rounded-lg border border-slate-200 p-4">
                    <h3 className="text-base font-semibold text-slate-900">{moduleItem.title}</h3>
                    <p className="mt-1 text-xs text-slate-600">{moduleItem.overview}</p>
                    <div className="mt-3 space-y-2">
                      {(moduleItem.lessons || []).map((lesson) => {
                        const completed = completedLessonsSet.has(lesson.lessonId);
                        return (
                          <div key={lesson.lessonId} className="rounded-md border border-slate-200 p-3 text-sm">
                            <p className="font-medium text-slate-900">{lesson.title}</p>
                            <p className="mt-1 text-xs text-slate-600">{lesson.summary}</p>
                            <p className="mt-1 text-xs text-slate-500">
                              {lesson.type} | {lesson.durationMinutes || 10} min
                            </p>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <a
                                href={lesson.url}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700"
                              >
                                Open Lesson
                              </a>
                              <button
                                type="button"
                                onClick={() => toggleLesson(lesson.lessonId, completed)}
                                disabled={savingLessonId === lesson.lessonId}
                                className={`rounded px-2 py-1 text-xs font-semibold text-white ${
                                  completed ? "bg-slate-700" : "bg-brand-700"
                                }`}
                              >
                                {savingLessonId === lesson.lessonId
                                  ? "Saving..."
                                  : completed
                                    ? "Mark Incomplete"
                                    : "Mark Complete"}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </article>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-600">No learning track selected.</p>
          )}
        </div>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Curated Learning Resources</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {resources.map((resource) => (
            <article key={resource._id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="inline-block rounded-full bg-brand-100 px-2 py-1 text-xs font-semibold text-brand-700">
                {resource.type}
              </p>
              <h3 className="mt-2 text-lg font-semibold text-slate-900">{resource.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{resource.description}</p>
              <p className="mt-2 text-xs text-slate-500">Topic: {resource.topic || "General"}</p>
              <a
                href={resource.url}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-block text-sm font-semibold text-brand-700"
              >
                Open resource
              </a>
            </article>
          ))}
        </div>
      </section>

      {["mentor", "admin"].includes(user.role) && (
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Upload Training Resource</h2>
          <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={submitResource}>
            <input
              placeholder="Title"
              className="rounded-md border border-slate-300 px-3 py-2"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              required
            />
            <select
              className="rounded-md border border-slate-300 px-3 py-2"
              value={form.type}
              onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}
            >
              <option value="article">Article</option>
              <option value="video">Video</option>
              <option value="checklist">Checklist</option>
            </select>
            <input
              placeholder="Resource URL"
              className="rounded-md border border-slate-300 px-3 py-2 md:col-span-2"
              value={form.url}
              onChange={(e) => setForm((prev) => ({ ...prev, url: e.target.value }))}
              required
            />
            <input
              placeholder="Topic (e.g., Tailoring)"
              className="rounded-md border border-slate-300 px-3 py-2"
              value={form.topic}
              onChange={(e) => setForm((prev) => ({ ...prev, topic: e.target.value }))}
            />
            <input
              placeholder="Tags (comma separated)"
              className="rounded-md border border-slate-300 px-3 py-2"
              value={form.tags}
              onChange={(e) => setForm((prev) => ({ ...prev, tags: e.target.value }))}
            />
            <textarea
              placeholder="Description"
              className="h-24 rounded-md border border-slate-300 px-3 py-2 md:col-span-2"
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              required
            />
            <button type="submit" className="rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white">
              Submit Resource
            </button>
          </form>
        </section>
      )}

      {["mentor", "admin"].includes(user.role) && (
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">My Uploaded Resources</h2>
          <div className="mt-3 space-y-2 text-sm">
            {myResources.length ? (
              myResources.map((item) => (
                <div key={item._id} className="rounded-md border border-slate-200 p-3">
                  <span className="font-medium">{item.title}</span>
                  <span className="ml-2 rounded bg-slate-100 px-2 py-0.5 text-xs capitalize">{item.status}</span>
                </div>
              ))
            ) : (
              <p className="text-slate-600">No resources uploaded yet.</p>
            )}
          </div>
        </section>
      )}

      {user.role === "admin" && (
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Pending Content Approval</h2>
          <div className="mt-3 space-y-3">
            {pendingResources.length ? (
              pendingResources.map((item) => (
                <div key={item._id} className="rounded-md border border-slate-200 p-3">
                  <p className="font-medium text-slate-900">{item.title}</p>
                  <p className="text-xs text-slate-500">By {item.uploadedBy?.name}</p>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white"
                      onClick={() => updateStatus(item._id, "approved")}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white"
                      onClick={() => updateStatus(item._id, "rejected")}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-600">No pending resources.</p>
            )}
          </div>
        </section>
      )}
    </section>
  );
};

export default ResourcesPage;
