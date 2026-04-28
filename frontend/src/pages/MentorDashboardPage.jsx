import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import StatCard from "../components/StatCard";
import { useAuth } from "../context/AuthContext";

const sessionStatusClassNames = {
  requested: "bg-amber-100 text-amber-800",
  confirmed: "bg-emerald-100 text-emerald-800",
  completed: "bg-slate-200 text-slate-700",
  cancelled: "bg-red-100 text-red-700"
};

const getSessionActions = (status) => {
  if (status === "requested") {
    return [
      { label: "Confirm", nextStatus: "confirmed", className: "bg-emerald-600 text-white" },
      { label: "Cancel", nextStatus: "cancelled", className: "bg-red-600 text-white" }
    ];
  }

  if (status === "confirmed") {
    return [
      { label: "Complete", nextStatus: "completed", className: "bg-slate-800 text-white" },
      { label: "Cancel", nextStatus: "cancelled", className: "bg-red-600 text-white" }
    ];
  }

  return [];
};

const MentorDashboardPage = () => {
  const { user } = useAuth();
  const [engagement, setEngagement] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [resources, setResources] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [updatingSessionId, setUpdatingSessionId] = useState("");
  const [noteText, setNoteText] = useState("");
  const [taskForm, setTaskForm] = useState({ title: "", description: "", assignedTo: "mentee", dueAt: "" });
  const [followUpForm, setFollowUpForm] = useState({ summary: "", nextCheckInAt: "" });

  const selectedSession = useMemo(
    () => sessions.find((session) => session._id === selectedSessionId),
    [selectedSessionId, sessions]
  );

  const loadMentorDashboard = async () => {
    setLoading(true);
    try {
      const [engagementRes, sessionsRes, resourcesRes] = await Promise.all([
        api.get("/mentors/engagement/me"),
        api.get("/mentors/sessions/me"),
        api.get("/resources/me")
      ]);

      setEngagement(engagementRes.data);
      setSessions(sessionsRes.data.sessions || []);
      setResources(resourcesRes.data.resources || []);
      if (!selectedSessionId && sessionsRes.data.sessions?.length) {
        setSelectedSessionId(sessionsRes.data.sessions[0]._id);
      }
    } catch (error) {
      setMessage(error.response?.data?.message || error.message || "Unable to load mentor dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMentorDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateSessionStatus = async (sessionId, status) => {
    setUpdatingSessionId(sessionId);
    try {
      await api.patch(`/mentors/sessions/${sessionId}/status`, { status });
      await loadMentorDashboard();
    } catch (error) {
      setMessage(error.response?.data?.message || error.message || "Unable to update session.");
    } finally {
      setUpdatingSessionId("");
    }
  };

  const addSessionNote = async () => {
    if (!selectedSessionId || !noteText.trim()) return;
    try {
      await api.post(`/mentors/sessions/${selectedSessionId}/notes`, { text: noteText });
      setNoteText("");
      await loadMentorDashboard();
    } catch (error) {
      setMessage(error.response?.data?.message || error.message || "Unable to save note.");
    }
  };

  const addTask = async (event) => {
    event.preventDefault();
    if (!selectedSessionId) return;
    try {
      await api.post(`/mentors/sessions/${selectedSessionId}/tasks`, {
        ...taskForm,
        dueAt: taskForm.dueAt || undefined
      });
      setTaskForm({ title: "", description: "", assignedTo: "mentee", dueAt: "" });
      await loadMentorDashboard();
    } catch (error) {
      setMessage(error.response?.data?.message || error.message || "Unable to add task.");
    }
  };

  const updateTaskStatus = async (taskId, status) => {
    if (!selectedSessionId) return;
    try {
      await api.patch(`/mentors/sessions/${selectedSessionId}/tasks/${taskId}`, { status });
      await loadMentorDashboard();
    } catch (error) {
      setMessage(error.response?.data?.message || error.message || "Unable to update task.");
    }
  };

  const addFollowUp = async (event) => {
    event.preventDefault();
    if (!selectedSessionId) return;
    try {
      await api.post(`/mentors/sessions/${selectedSessionId}/follow-ups`, {
        ...followUpForm,
        nextCheckInAt: followUpForm.nextCheckInAt || undefined
      });
      setFollowUpForm({ summary: "", nextCheckInAt: "" });
      await loadMentorDashboard();
    } catch (error) {
      setMessage(error.response?.data?.message || error.message || "Unable to add follow-up.");
    }
  };

  const updateFollowUpStatus = async (followUpId, status) => {
    if (!selectedSessionId) return;
    try {
      await api.patch(`/mentors/sessions/${selectedSessionId}/follow-ups/${followUpId}`, { status });
      await loadMentorDashboard();
    } catch (error) {
      setMessage(error.response?.data?.message || error.message || "Unable to update follow-up.");
    }
  };

  if (loading) {
    return <p className="text-slate-600">Loading mentor dashboard...</p>;
  }

  if (user.mentorApplicationStatus !== "approved" || !user.mentorVerified) {
    return (
      <section className="space-y-6">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Mentor Dashboard</h1>
          <p className="mt-2 text-sm text-slate-600">
            Your mentor access is not active yet. Admin approval is required before your profile goes live.
          </p>
          <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Current status: {user.mentorApplicationStatus || "pending"}
          </p>
          <Link to="/dashboard" className="mt-4 inline-block text-sm font-semibold text-brand-700">
            Back to Dashboard
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Mentor Operations Dashboard</h1>
        <p className="mt-2 text-sm text-slate-600">
          Manage sessions, assign action plans, track follow-ups, and monitor mentee engagement quality.
        </p>
      </div>

      {message && <p className="rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-700">{message}</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Sessions" value={engagement?.totalSessions ?? 0} />
        <StatCard title="Completed" value={engagement?.completedSessions ?? 0} />
        <StatCard title="Completion Rate" value={`${engagement?.completionRate ?? 0}%`} />
        <StatCard title="Unique Mentees" value={engagement?.uniqueMentees ?? 0} />
        <StatCard title="Upcoming (7 days)" value={engagement?.upcomingSessions ?? 0} />
        <StatCard title="Session Tasks" value={engagement?.totalTasks ?? 0} subtitle={`${engagement?.completedTasks ?? 0} done`} />
        <StatCard
          title="Follow-ups"
          value={engagement?.followUpActions ?? 0}
          subtitle={`${engagement?.completedFollowUps ?? 0} completed`}
        />
        <StatCard title="Total Chat Messages" value={engagement?.totalMessages ?? 0} />
      </div>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Session Queue</h2>
          <div className="mt-3 space-y-3">
            {sessions.length ? (
              sessions.map((session) => {
                const actions = getSessionActions(session.status);
                const isUpdating = updatingSessionId === session._id;

                return (
                  <article
                    key={session._id}
                    className={`cursor-pointer rounded-lg border p-3 ${
                      selectedSessionId === session._id ? "border-brand-500 bg-brand-50" : "border-slate-200"
                    }`}
                    onClick={() => setSelectedSessionId(session._id)}
                  >
                    <p className="font-medium text-slate-900">{session.topic}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span>Mentee: {session.mentee?.name}</span>
                      <span>{new Date(session.scheduledAt).toLocaleString()}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 font-semibold capitalize ${
                          sessionStatusClassNames[session.status] || "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {session.status}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {actions.map((action) => (
                        <button
                          key={action.nextStatus}
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            updateSessionStatus(session._id, action.nextStatus);
                          }}
                          className={`rounded px-2 py-1 text-xs font-semibold ${action.className}`}
                          disabled={isUpdating}
                        >
                          {isUpdating ? "Updating..." : action.label}
                        </button>
                      ))}
                    </div>
                  </article>
                );
              })
            ) : (
              <p className="text-sm text-slate-600">No mentorship sessions yet.</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Uploaded Training Content</h2>
          <div className="mt-3 space-y-2">
            {resources.length ? (
              resources.map((item) => (
                <div key={item._id} className="rounded-md border border-slate-200 p-3 text-sm">
                  <span className="font-medium text-slate-900">{item.title}</span>
                  <span className="ml-2 rounded bg-slate-100 px-2 py-0.5 text-xs capitalize">{item.status}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-600">No uploaded resources yet.</p>
            )}
          </div>
        </div>
      </section>

      {selectedSession && (
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Session Workbench</h2>
          <p className="mt-1 text-sm text-slate-600">
            {selectedSession.topic} | {new Date(selectedSession.scheduledAt).toLocaleString()}
          </p>

          <div className="mt-4 grid gap-5 xl:grid-cols-3">
            <div className="space-y-3 rounded-xl border border-slate-200 p-4">
              <h3 className="font-semibold text-slate-900">Session Notes</h3>
              <div className="max-h-56 space-y-2 overflow-y-auto">
                {selectedSession.sessionNotes?.length ? (
                  selectedSession.sessionNotes.map((note) => (
                    <div key={note._id} className="rounded-md bg-slate-100 p-2 text-xs text-slate-700">
                      <p className="font-semibold">{note.author?.name || "Mentor"}</p>
                      <p>{note.text}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500">No notes yet.</p>
                )}
              </div>
              <textarea
                className="h-20 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={noteText}
                onChange={(event) => setNoteText(event.target.value)}
                placeholder="Add practical mentoring notes..."
              />
              <button
                type="button"
                onClick={addSessionNote}
                className="rounded-md bg-brand-700 px-3 py-1.5 text-sm font-semibold text-white"
              >
                Add Note
              </button>
            </div>

            <div className="space-y-3 rounded-xl border border-slate-200 p-4">
              <h3 className="font-semibold text-slate-900">Action Tasks</h3>
              <div className="max-h-56 space-y-2 overflow-y-auto">
                {selectedSession.actionTasks?.length ? (
                  selectedSession.actionTasks.map((task) => (
                    <div key={task._id} className="rounded-md bg-slate-100 p-2 text-xs text-slate-700">
                      <p className="font-semibold">{task.title}</p>
                      <p>{task.description}</p>
                      <p>
                        Assigned: {task.assignedTo} | Status: {task.status}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {["open", "in_progress", "done", "blocked"].map((state) => (
                          <button
                            type="button"
                            key={state}
                            className="rounded border border-slate-300 px-2 py-0.5 text-[11px]"
                            onClick={() => updateTaskStatus(task._id, state)}
                          >
                            {state}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500">No action tasks yet.</p>
                )}
              </div>
              <form className="space-y-2" onSubmit={addTask}>
                <input
                  className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                  placeholder="Task title"
                  value={taskForm.title}
                  onChange={(event) => setTaskForm((prev) => ({ ...prev, title: event.target.value }))}
                  required
                />
                <textarea
                  className="h-16 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                  placeholder="Task description"
                  value={taskForm.description}
                  onChange={(event) => setTaskForm((prev) => ({ ...prev, description: event.target.value }))}
                />
                <div className="grid gap-2 sm:grid-cols-2">
                  <select
                    className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                    value={taskForm.assignedTo}
                    onChange={(event) => setTaskForm((prev) => ({ ...prev, assignedTo: event.target.value }))}
                  >
                    <option value="mentee">Mentee</option>
                    <option value="mentor">Mentor</option>
                    <option value="both">Both</option>
                  </select>
                  <input
                    type="datetime-local"
                    className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                    value={taskForm.dueAt}
                    onChange={(event) => setTaskForm((prev) => ({ ...prev, dueAt: event.target.value }))}
                  />
                </div>
                <button type="submit" className="rounded-md bg-brand-700 px-3 py-1.5 text-sm font-semibold text-white">
                  Add Task
                </button>
              </form>
            </div>

            <div className="space-y-3 rounded-xl border border-slate-200 p-4">
              <h3 className="font-semibold text-slate-900">Follow-up Actions</h3>
              <div className="max-h-56 space-y-2 overflow-y-auto">
                {selectedSession.followUpActions?.length ? (
                  selectedSession.followUpActions.map((item) => (
                    <div key={item._id} className="rounded-md bg-slate-100 p-2 text-xs text-slate-700">
                      <p className="font-semibold">{item.summary}</p>
                      <p>
                        Next check-in:{" "}
                        {item.nextCheckInAt ? new Date(item.nextCheckInAt).toLocaleString() : "Not set"}
                      </p>
                      <p>Status: {item.status}</p>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {["planned", "completed", "cancelled"].map((state) => (
                          <button
                            type="button"
                            key={state}
                            className="rounded border border-slate-300 px-2 py-0.5 text-[11px]"
                            onClick={() => updateFollowUpStatus(item._id, state)}
                          >
                            {state}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500">No follow-up actions yet.</p>
                )}
              </div>
              <form className="space-y-2" onSubmit={addFollowUp}>
                <textarea
                  className="h-16 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                  placeholder="Follow-up summary"
                  value={followUpForm.summary}
                  onChange={(event) => setFollowUpForm((prev) => ({ ...prev, summary: event.target.value }))}
                  required
                />
                <input
                  type="datetime-local"
                  className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
                  value={followUpForm.nextCheckInAt}
                  onChange={(event) => setFollowUpForm((prev) => ({ ...prev, nextCheckInAt: event.target.value }))}
                />
                <button type="submit" className="rounded-md bg-brand-700 px-3 py-1.5 text-sm font-semibold text-white">
                  Add Follow-up
                </button>
              </form>
            </div>
          </div>
        </section>
      )}
    </section>
  );
};

export default MentorDashboardPage;
