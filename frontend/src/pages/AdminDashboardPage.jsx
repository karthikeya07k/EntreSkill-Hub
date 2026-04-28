import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import StatCard from "../components/StatCard";

const slugify = (value) =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const mentorStatusClassNames = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-700"
};

const AdminDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [mentorApplications, setMentorApplications] = useState([]);
  const [pendingResources, setPendingResources] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [reviewingMentorId, setReviewingMentorId] = useState("");
  const [trackForm, setTrackForm] = useState({
    title: "",
    slug: "",
    category: "Business Planning",
    level: "Beginner",
    description: "",
    estimatedHours: 4,
    tags: "",
    linkedSkills: "",
    linkedInterests: "",
    moduleTitle: "",
    moduleOverview: "",
    lessonTitle: "",
    lessonType: "article",
    lessonUrl: "",
    lessonSummary: ""
  });

  const mentors = useMemo(() => users.filter((user) => user.role === "mentor"), [users]);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, applicationsRes, pendingRes, feedbackRes, tracksRes] = await Promise.all([
        api.get("/admin/stats"),
        api.get("/admin/users"),
        api.get("/admin/mentor-applications?status=all"),
        api.get("/resources/pending/list"),
        api.get("/admin/feedback"),
        api.get("/courses/tracks")
      ]);

      setStats(statsRes.data);
      setUsers(usersRes.data.users || []);
      setMentorApplications(applicationsRes.data.mentors || []);
      setPendingResources(pendingRes.data.resources || []);
      setFeedback(feedbackRes.data.feedback || []);
      setTracks(tracksRes.data.tracks || []);
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to load admin dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const reviewMentorApplication = async (userId, status) => {
    setReviewingMentorId(userId);
    try {
      const reviewNote =
        status === "approved"
          ? window.prompt("Approval note for mentor (min 5 chars):", "Approved after profile review.")
          : "";
      const rejectionReason =
        status === "rejected"
          ? window.prompt("Rejection reason for mentor (min 5 chars):", "Please improve portfolio and details.")
          : "";

      await api.patch(`/admin/mentors/${userId}/verify`, {
        status,
        reviewNote: reviewNote || undefined,
        rejectionReason: rejectionReason || undefined
      });
      await loadAdminData();
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to update mentor review.");
    } finally {
      setReviewingMentorId("");
    }
  };

  const updateResourceStatus = async (id, status) => {
    try {
      await api.patch(`/resources/${id}/status`, { status });
      await loadAdminData();
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to update resource status.");
    }
  };

  const toggleTrackPublish = async (trackId, nextPublished) => {
    try {
      await api.patch(`/courses/tracks/${trackId}/publish`, { published: nextPublished });
      await loadAdminData();
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to update track publish status.");
    }
  };

  const createTrack = async (event) => {
    event.preventDefault();
    setMessage("");
    try {
      const slug = slugify(trackForm.slug || trackForm.title);
      const moduleId = `${slug}-m1`;
      const lessonId = `${slug}-l1`;

      await api.post("/courses/tracks", {
        title: trackForm.title,
        slug,
        category: trackForm.category,
        level: trackForm.level,
        description: trackForm.description,
        estimatedHours: Number(trackForm.estimatedHours),
        tags: trackForm.tags
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        linkedSkills: trackForm.linkedSkills
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        linkedInterests: trackForm.linkedInterests
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        modules: [
          {
            moduleId,
            title: trackForm.moduleTitle,
            overview: trackForm.moduleOverview,
            lessons: [
              {
                lessonId,
                title: trackForm.lessonTitle,
                summary: trackForm.lessonSummary,
                type: trackForm.lessonType,
                url: trackForm.lessonUrl,
                sourceName: "Admin Curated",
                durationMinutes: 20
              }
            ]
          }
        ]
      });

      setTrackForm({
        title: "",
        slug: "",
        category: "Business Planning",
        level: "Beginner",
        description: "",
        estimatedHours: 4,
        tags: "",
        linkedSkills: "",
        linkedInterests: "",
        moduleTitle: "",
        moduleOverview: "",
        lessonTitle: "",
        lessonType: "article",
        lessonUrl: "",
        lessonSummary: ""
      });
      await loadAdminData();
      setMessage("Learning track created.");
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to create learning track.");
    }
  };

  if (loading) {
    return <p className="text-slate-600">Loading admin dashboard...</p>;
  }

  return (
    <section className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Admin Control Center</h1>
        <p className="mt-2 text-sm text-slate-600">
          Full platform governance for mentors, learning content, and user engagement quality.
        </p>
      </div>

      {message && <p className="rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-700">{message}</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Users" value={stats?.usersCount ?? 0} />
        <StatCard title="Mentors" value={stats?.mentorsCount ?? 0} subtitle={`${stats?.verifiedMentorsCount ?? 0} verified`} />
        <StatCard title="Pending Mentor Applications" value={stats?.pendingMentorApplications ?? 0} />
        <StatCard title="Learning Tracks" value={stats?.courseTrackCount ?? 0} />
        <StatCard title="Ideas Curated" value={stats?.ideaCount ?? 0} />
        <StatCard title="Roadmaps" value={stats?.roadmapCount ?? 0} />
        <StatCard title="Pending Resources" value={stats?.pendingResources ?? 0} />
        <StatCard title="Mentor Sessions" value={stats?.sessionsCount ?? 0} />
      </div>

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Mentor Application Review</h2>
        <div className="mt-3 space-y-3">
          {mentorApplications.length ? (
            mentorApplications.map((mentor) => {
              const isPending = mentor.mentorApplicationStatus === "pending";
              const isReviewing = reviewingMentorId === mentor._id;

              return (
                <article key={mentor._id} className="rounded-md border border-slate-200 p-3">
                  <p className="font-medium text-slate-900">{mentor.name}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span>{mentor.email}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 font-semibold capitalize ${
                        mentorStatusClassNames[mentor.mentorApplicationStatus] || "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {mentor.mentorApplicationStatus}
                    </span>
                    <span>Experience: {mentor.experienceYears || 0} years</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">
                    Motivation: {mentor.mentorApplication?.motivation || "No motivation shared."}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Experience: {mentor.mentorApplication?.experienceSummary || "No summary shared."}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Specialization: {mentor.mentorApplication?.specialization?.join(", ") || "N/A"}
                  </p>

                  {mentor.mentorApplicationStatus === "approved" && mentor.mentorApplication?.approvalNote && (
                    <p className="mt-2 rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                      Approval note: {mentor.mentorApplication.approvalNote}
                    </p>
                  )}

                  {mentor.mentorApplicationStatus === "rejected" && mentor.mentorApplication?.rejectionReason && (
                    <p className="mt-2 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
                      Rejection reason: {mentor.mentorApplication.rejectionReason}
                    </p>
                  )}

                  {mentor.mentorApplication?.reviewedAt && (
                    <p className="mt-2 text-xs text-slate-500">
                      Reviewed by {mentor.mentorApplication?.reviewedBy?.name || "Admin"} on{" "}
                      {new Date(mentor.mentorApplication.reviewedAt).toLocaleString()}
                    </p>
                  )}

                  {isPending && (
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        className="rounded bg-emerald-600 px-2 py-1 text-xs font-semibold text-white"
                        onClick={() => reviewMentorApplication(mentor._id, "approved")}
                        disabled={isReviewing}
                      >
                        {isReviewing ? "Updating..." : "Approve"}
                      </button>
                      <button
                        type="button"
                        className="rounded bg-red-600 px-2 py-1 text-xs font-semibold text-white"
                        onClick={() => reviewMentorApplication(mentor._id, "rejected")}
                        disabled={isReviewing}
                      >
                        {isReviewing ? "Updating..." : "Reject"}
                      </button>
                    </div>
                  )}
                </article>
              );
            })
          ) : (
            <p className="text-sm text-slate-600">No mentor applications found.</p>
          )}
        </div>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Mentor Directory Snapshot</h2>
        <div className="mt-3 space-y-3">
          {mentors.length ? (
            mentors.map((mentor) => (
              <article key={mentor._id} className="rounded-md border border-slate-200 p-3">
                <p className="font-medium text-slate-900">{mentor.name}</p>
                <p className="text-xs text-slate-500">
                  {mentor.email} | Experience: {mentor.experienceYears || 0} years | Verified:{" "}
                  {mentor.mentorVerified ? "Yes" : "No"}
                </p>
              </article>
            ))
          ) : (
            <p className="text-sm text-slate-600">No mentors found.</p>
          )}
        </div>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Learning Track Content Manager</h2>
        <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={createTrack}>
          <input
            value={trackForm.title}
            onChange={(event) => setTrackForm((prev) => ({ ...prev, title: event.target.value }))}
            className="rounded-md border border-slate-300 px-3 py-2"
            placeholder="Track title"
            required
          />
          <input
            value={trackForm.slug}
            onChange={(event) => setTrackForm((prev) => ({ ...prev, slug: event.target.value }))}
            className="rounded-md border border-slate-300 px-3 py-2"
            placeholder="Slug (optional)"
          />
          <select
            value={trackForm.category}
            onChange={(event) => setTrackForm((prev) => ({ ...prev, category: event.target.value }))}
            className="rounded-md border border-slate-300 px-3 py-2"
          >
            <option value="Business Planning">Business Planning</option>
            <option value="Digital Growth">Digital Growth</option>
            <option value="Compliance">Compliance</option>
            <option value="Operations">Operations</option>
          </select>
          <select
            value={trackForm.level}
            onChange={(event) => setTrackForm((prev) => ({ ...prev, level: event.target.value }))}
            className="rounded-md border border-slate-300 px-3 py-2"
          >
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
          <input
            type="number"
            min="1"
            max="300"
            value={trackForm.estimatedHours}
            onChange={(event) => setTrackForm((prev) => ({ ...prev, estimatedHours: event.target.value }))}
            className="rounded-md border border-slate-300 px-3 py-2"
            placeholder="Estimated hours"
          />
          <input
            value={trackForm.tags}
            onChange={(event) => setTrackForm((prev) => ({ ...prev, tags: event.target.value }))}
            className="rounded-md border border-slate-300 px-3 py-2"
            placeholder="Tags (comma separated)"
          />
          <input
            value={trackForm.linkedSkills}
            onChange={(event) => setTrackForm((prev) => ({ ...prev, linkedSkills: event.target.value }))}
            className="rounded-md border border-slate-300 px-3 py-2"
            placeholder="Linked skills (comma separated)"
          />
          <input
            value={trackForm.linkedInterests}
            onChange={(event) => setTrackForm((prev) => ({ ...prev, linkedInterests: event.target.value }))}
            className="rounded-md border border-slate-300 px-3 py-2"
            placeholder="Linked interests (comma separated)"
          />
          <textarea
            value={trackForm.description}
            onChange={(event) => setTrackForm((prev) => ({ ...prev, description: event.target.value }))}
            className="rounded-md border border-slate-300 px-3 py-2 md:col-span-2"
            placeholder="Track description"
            required
          />
          <input
            value={trackForm.moduleTitle}
            onChange={(event) => setTrackForm((prev) => ({ ...prev, moduleTitle: event.target.value }))}
            className="rounded-md border border-slate-300 px-3 py-2"
            placeholder="First module title"
            required
          />
          <input
            value={trackForm.moduleOverview}
            onChange={(event) => setTrackForm((prev) => ({ ...prev, moduleOverview: event.target.value }))}
            className="rounded-md border border-slate-300 px-3 py-2"
            placeholder="First module overview"
          />
          <input
            value={trackForm.lessonTitle}
            onChange={(event) => setTrackForm((prev) => ({ ...prev, lessonTitle: event.target.value }))}
            className="rounded-md border border-slate-300 px-3 py-2"
            placeholder="First lesson title"
            required
          />
          <select
            value={trackForm.lessonType}
            onChange={(event) => setTrackForm((prev) => ({ ...prev, lessonType: event.target.value }))}
            className="rounded-md border border-slate-300 px-3 py-2"
          >
            <option value="article">Article</option>
            <option value="video">Video</option>
            <option value="checklist">Checklist</option>
            <option value="template">Template</option>
            <option value="tool">Tool</option>
          </select>
          <input
            type="url"
            value={trackForm.lessonUrl}
            onChange={(event) => setTrackForm((prev) => ({ ...prev, lessonUrl: event.target.value }))}
            className="rounded-md border border-slate-300 px-3 py-2 md:col-span-2"
            placeholder="Lesson URL"
            required
          />
          <textarea
            value={trackForm.lessonSummary}
            onChange={(event) => setTrackForm((prev) => ({ ...prev, lessonSummary: event.target.value }))}
            className="rounded-md border border-slate-300 px-3 py-2 md:col-span-2"
            placeholder="Lesson summary"
          />
          <button type="submit" className="rounded bg-brand-700 px-4 py-2 text-sm font-semibold text-white">
            Create Learning Track
          </button>
        </form>

        <div className="mt-6 space-y-2">
          {tracks.length ? (
            tracks.map((track) => (
              <article key={track._id} className="rounded-md border border-slate-200 p-3 text-sm">
                <p className="font-semibold text-slate-900">{track.title}</p>
                <p className="text-slate-600">
                  {track.category} | {track.level} | Modules: {track.modules?.length || 0}
                </p>
                <button
                  type="button"
                  className={`mt-2 rounded px-3 py-1 text-xs font-semibold ${
                    track.published ? "bg-red-600 text-white" : "bg-emerald-600 text-white"
                  }`}
                  onClick={() => toggleTrackPublish(track._id, !track.published)}
                >
                  {track.published ? "Unpublish" : "Publish"}
                </button>
              </article>
            ))
          ) : (
            <p className="text-sm text-slate-600">No learning tracks yet.</p>
          )}
        </div>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Pending Training Content</h2>
        <div className="mt-3 space-y-3">
          {pendingResources.length ? (
            pendingResources.map((item) => (
              <article key={item._id} className="rounded-md border border-slate-200 p-3">
                <p className="font-medium text-slate-900">{item.title}</p>
                <p className="text-xs text-slate-500">Submitted by: {item.uploadedBy?.name || "Unknown mentor"}</p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    className="rounded bg-emerald-600 px-2 py-1 text-xs font-semibold text-white"
                    onClick={() => updateResourceStatus(item._id, "approved")}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    className="rounded bg-red-600 px-2 py-1 text-xs font-semibold text-white"
                    onClick={() => updateResourceStatus(item._id, "rejected")}
                  >
                    Reject
                  </button>
                </div>
              </article>
            ))
          ) : (
            <p className="text-sm text-slate-600">No pending resources.</p>
          )}
        </div>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Recent Feedback & Reports</h2>
        <div className="mt-3 space-y-3">
          {feedback.length ? (
            feedback.slice(0, 10).map((item) => (
              <article key={item._id} className="rounded-md border border-slate-200 p-3 text-sm">
                <p className="font-medium text-slate-900">
                  {item.fromUser?.name || "User"} rated {item.rating}/5 ({item.type})
                </p>
                <p className="mt-1 text-slate-600">{item.comment || "No comment provided."}</p>
              </article>
            ))
          ) : (
            <p className="text-sm text-slate-600">No feedback yet.</p>
          )}
        </div>
      </section>
    </section>
  );
};

export default AdminDashboardPage;
