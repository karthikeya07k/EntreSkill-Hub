import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { getSocket, isSocketConnected } from "../services/socket";
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
      { label: "Mark Complete", nextStatus: "completed", className: "bg-slate-800 text-white" },
      { label: "Cancel", nextStatus: "cancelled", className: "bg-red-600 text-white" }
    ];
  }

  return [];
};

const MentorsPage = () => {
  const { user } = useAuth();
  const [mentors, setMentors] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [messages, setMessages] = useState([]);
  const [chatText, setChatText] = useState("");
  const [chatSending, setChatSending] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    assignedTo: "mentee",
    dueAt: ""
  });
  const [followUpForm, setFollowUpForm] = useState({
    summary: "",
    nextCheckInAt: ""
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [updatingSessionId, setUpdatingSessionId] = useState("");
  const [socketStatus, setSocketStatus] = useState(isSocketConnected() ? "connected" : "connecting");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState({
    mentorId: "",
    topic: "",
    scheduledAt: ""
  });

  const selectedSession = useMemo(
    () => sessions.find((session) => session._id === selectedSessionId),
    [sessions, selectedSessionId]
  );

  const canRequestSession = user.role === "user" || user.role === "admin";

  const loadData = async () => {
    setLoading(true);
    try {
      const [mentorsRes, sessionsRes] = await Promise.all([api.get("/mentors"), api.get("/mentors/sessions/me")]);
      setMentors(mentorsRes.data.mentors || []);
      setSessions(sessionsRes.data.sessions || []);
    } catch (error) {
      setMessage(error.response?.data?.message || error.message || "Unable to load mentor data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) {
      setSocketStatus("disconnected");
      return undefined;
    }

    const onConnect = () => setSocketStatus("connected");
    const onDisconnect = () => setSocketStatus("disconnected");
    const onConnectError = () => setSocketStatus("error");
    const onReady = () => setSocketStatus("connected");
    const onSessionRequest = (session) => {
      setSessions((prev) => {
        const exists = prev.some((item) => item._id === session._id);
        return exists ? prev : [...prev, session];
      });
    };
    const onSessionUpdated = (session) => {
      setSessions((prev) => prev.map((item) => (item._id === session._id ? session : item)));
    };

    if (socket.connected) {
      setSocketStatus("connected");
    } else {
      setSocketStatus("connecting");
      socket.connect();
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.on("socket:ready", onReady);
    socket.on("session:request", onSessionRequest);
    socket.on("session:updated", onSessionUpdated);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.off("socket:ready", onReady);
      socket.off("session:request", onSessionRequest);
      socket.off("session:updated", onSessionUpdated);
    };
  }, []);

  const requestSession = async (event) => {
    event.preventDefault();
    setMessage("");

    try {
      await api.post("/mentors/sessions", booking);
      setBooking({ mentorId: "", topic: "", scheduledAt: "" });
      setMessage("Session request submitted.");
      await loadData();
    } catch (error) {
      setMessage(error.response?.data?.message || error.message || "Unable to request session.");
    }
  };

  const updateSessionStatus = async (sessionId, status) => {
    setUpdatingSessionId(sessionId);
    try {
      await api.patch(`/mentors/sessions/${sessionId}/status`, { status });
      await loadData();
    } catch (error) {
      setMessage(error.response?.data?.message || error.message || "Unable to update session.");
    } finally {
      setUpdatingSessionId("");
    }
  };

  const addSessionNote = async () => {
    if (!selectedSessionId || !noteText.trim()) return;
    setActionLoading(true);
    try {
      await api.post(`/mentors/sessions/${selectedSessionId}/notes`, {
        text: noteText
      });
      setNoteText("");
      await loadData();
    } catch (error) {
      setMessage(error.response?.data?.message || error.message || "Unable to add note.");
    } finally {
      setActionLoading(false);
    }
  };

  const addSessionTask = async (event) => {
    event.preventDefault();
    if (!selectedSessionId) return;
    setActionLoading(true);
    try {
      await api.post(`/mentors/sessions/${selectedSessionId}/tasks`, {
        ...taskForm,
        dueAt: taskForm.dueAt || undefined
      });
      setTaskForm({
        title: "",
        description: "",
        assignedTo: "mentee",
        dueAt: ""
      });
      await loadData();
    } catch (error) {
      setMessage(error.response?.data?.message || error.message || "Unable to add task.");
    } finally {
      setActionLoading(false);
    }
  };

  const updateTaskStatus = async (taskId, status) => {
    if (!selectedSessionId) return;
    setActionLoading(true);
    try {
      await api.patch(`/mentors/sessions/${selectedSessionId}/tasks/${taskId}`, { status });
      await loadData();
    } catch (error) {
      setMessage(error.response?.data?.message || error.message || "Unable to update task.");
    } finally {
      setActionLoading(false);
    }
  };

  const addFollowUp = async (event) => {
    event.preventDefault();
    if (!selectedSessionId) return;
    setActionLoading(true);
    try {
      await api.post(`/mentors/sessions/${selectedSessionId}/follow-ups`, {
        ...followUpForm,
        nextCheckInAt: followUpForm.nextCheckInAt || undefined
      });
      setFollowUpForm({
        summary: "",
        nextCheckInAt: ""
      });
      await loadData();
    } catch (error) {
      setMessage(error.response?.data?.message || error.message || "Unable to add follow-up.");
    } finally {
      setActionLoading(false);
    }
  };

  const updateFollowUpStatus = async (followUpId, status) => {
    if (!selectedSessionId) return;
    setActionLoading(true);
    try {
      await api.patch(`/mentors/sessions/${selectedSessionId}/follow-ups/${followUpId}`, { status });
      await loadData();
    } catch (error) {
      setMessage(error.response?.data?.message || error.message || "Unable to update follow-up.");
    } finally {
      setActionLoading(false);
    }
  };

  const openChat = async (sessionId) => {
    setSelectedSessionId(sessionId);
    setMessage("");

    try {
      const { data } = await api.get(`/mentors/sessions/${sessionId}/messages`);
      setMessages(data.messages || []);
      const socket = getSocket();

      if (!socket) {
        setMessage("Chat is unavailable because socket is disconnected.");
        return;
      }

      socket.emit("session:join", { sessionId }, (response) => {
        if (!response?.ok) {
          setMessage(response?.message || "Unable to join chat room.");
        }
      });
    } catch (error) {
      setMessage(error.response?.data?.message || error.message || "Unable to load chat history.");
    }
  };

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !selectedSessionId) return undefined;

    const onNewMessage = (chatMessage) => {
      if (chatMessage.roomId !== `session:${selectedSessionId}`) {
        return;
      }

      setMessages((prev) => {
        if (prev.some((item) => item._id === chatMessage._id)) {
          return prev;
        }
        return [...prev, chatMessage];
      });
    };

    socket.on("chat:new", onNewMessage);

    return () => {
      socket.off("chat:new", onNewMessage);
    };
  }, [selectedSessionId]);

  const sendChat = () => {
    if (!chatText.trim() || !selectedSessionId || chatSending) return;
    const socket = getSocket();
    if (!socket) {
      setMessage("Unable to send message. Socket is disconnected.");
      return;
    }

    setChatSending(true);
    socket.emit(
      "chat:message",
      {
        sessionId: selectedSessionId,
        text: chatText
      },
      (response) => {
        setChatSending(false);
        if (!response?.ok) {
          setMessage(response?.message || "Unable to send message.");
          return;
        }
        setChatText("");
      }
    );
  };

  if (loading) {
    return <p className="text-slate-600">Loading mentors and sessions...</p>;
  }

  return (
    <section className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Mentorship Directory</h1>
        <p className="mt-2 text-sm text-slate-600">
          Connect with verified mentors, schedule sessions, and collaborate in real time.
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Chat status: <span className="font-semibold capitalize">{socketStatus}</span>
        </p>
      </div>

      {message && (
        <p className="rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-700" role="status" aria-live="polite">
          {message}
        </p>
      )}

      {canRequestSession && (
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Book a Mentor Session</h2>
          <form className="mt-4 grid gap-3 md:grid-cols-3" onSubmit={requestSession}>
            <select
              value={booking.mentorId}
              onChange={(e) => setBooking((prev) => ({ ...prev, mentorId: e.target.value }))}
              className="rounded-md border border-slate-300 px-3 py-2"
              required
            >
              <option value="">Select mentor</option>
              {mentors.map((mentor) => (
                <option key={mentor._id} value={mentor._id}>
                  {mentor.name} - {mentor.expertise?.join(", ")}
                </option>
              ))}
            </select>
            <input
              value={booking.topic}
              onChange={(e) => setBooking((prev) => ({ ...prev, topic: e.target.value }))}
              className="rounded-md border border-slate-300 px-3 py-2"
              placeholder="Session topic"
              required
            />
            <input
              type="datetime-local"
              value={booking.scheduledAt}
              onChange={(e) => setBooking((prev) => ({ ...prev, scheduledAt: e.target.value }))}
              className="rounded-md border border-slate-300 px-3 py-2"
              required
            />
            <button type="submit" className="rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white">
              Request Session
            </button>
          </form>
        </section>
      )}

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Verified Mentors</h2>
          <div className="mt-3 space-y-3">
            {mentors.length ? (
              mentors.map((mentor) => (
                <article key={mentor._id} className="rounded-lg border border-slate-200 p-3">
                  <h3 className="font-semibold text-slate-900">{mentor.name}</h3>
                  <p className="text-sm text-slate-600">{mentor.bio || "Experienced mentor."}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Expertise: {mentor.expertise?.join(", ") || "General"} | Availability: {mentor.availability}
                  </p>
                </article>
              ))
            ) : (
              <p className="text-sm text-slate-600">No verified mentors available yet.</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">My Sessions</h2>
          <div className="mt-3 space-y-3">
            {sessions.length ? (
              sessions.map((session) => {
                const actions = getSessionActions(session.status);
                const isUpdating = updatingSessionId === session._id;

                return (
                  <article key={session._id} className="rounded-lg border border-slate-200 p-3">
                    <p className="font-medium text-slate-900">{session.topic}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
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
                      <button
                        type="button"
                        className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium"
                        onClick={() => openChat(session._id)}
                      >
                        Open Chat
                      </button>
                      {user.role === "mentor" &&
                        actions.map((action) => (
                          <button
                            key={action.nextStatus}
                            type="button"
                            className={`rounded-md px-2 py-1 text-xs font-semibold ${action.className}`}
                            onClick={() => updateSessionStatus(session._id, action.nextStatus)}
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
              <p className="text-sm text-slate-600">No sessions booked yet.</p>
            )}
          </div>
        </div>
      </section>

      {selectedSession && (
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Live Session Chat</h2>
          <p className="mt-1 text-xs text-slate-500">
            Session topic: {selectedSession.topic} | {new Date(selectedSession.scheduledAt).toLocaleString()}
          </p>

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <div className="rounded-lg border border-slate-200 p-3">
              <p className="text-sm font-semibold text-slate-900">Session Notes</p>
              <div className="mt-2 max-h-40 space-y-2 overflow-y-auto">
                {selectedSession.sessionNotes?.length ? (
                  selectedSession.sessionNotes.map((note) => (
                    <div key={note._id} className="rounded bg-slate-100 p-2 text-xs text-slate-700">
                      <p className="font-semibold">{note.author?.name || "User"}</p>
                      <p>{note.text}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500">No notes added yet.</p>
                )}
              </div>
              <textarea
                className="mt-2 h-16 w-full rounded border border-slate-300 px-2 py-1 text-xs"
                placeholder="Add a session note"
                value={noteText}
                onChange={(event) => setNoteText(event.target.value)}
              />
              <button
                type="button"
                className="mt-2 rounded bg-brand-700 px-2 py-1 text-xs font-semibold text-white"
                onClick={addSessionNote}
                disabled={actionLoading}
              >
                Add note
              </button>
            </div>

            <div className="rounded-lg border border-slate-200 p-3">
              <p className="text-sm font-semibold text-slate-900">Action Tasks</p>
              <div className="mt-2 max-h-40 space-y-2 overflow-y-auto">
                {selectedSession.actionTasks?.length ? (
                  selectedSession.actionTasks.map((task) => (
                    <div key={task._id} className="rounded bg-slate-100 p-2 text-xs text-slate-700">
                      <p className="font-semibold">{task.title}</p>
                      <p>{task.description}</p>
                      <p>
                        Assigned: {task.assignedTo} | Status: {task.status}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {["open", "in_progress", "done", "blocked"].map((state) => (
                          <button
                            key={state}
                            type="button"
                            className="rounded border border-slate-300 px-1.5 py-0.5 text-[10px]"
                            onClick={() => updateTaskStatus(task._id, state)}
                            disabled={actionLoading}
                          >
                            {state}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500">No tasks yet.</p>
                )}
              </div>
              {(user.role === "mentor" || user.role === "admin") && (
                <form className="mt-2 space-y-2" onSubmit={addSessionTask}>
                  <input
                    className="w-full rounded border border-slate-300 px-2 py-1 text-xs"
                    placeholder="Task title"
                    value={taskForm.title}
                    onChange={(event) => setTaskForm((prev) => ({ ...prev, title: event.target.value }))}
                    required
                  />
                  <input
                    className="w-full rounded border border-slate-300 px-2 py-1 text-xs"
                    placeholder="Task description"
                    value={taskForm.description}
                    onChange={(event) => setTaskForm((prev) => ({ ...prev, description: event.target.value }))}
                  />
                  <div className="grid gap-1 sm:grid-cols-2">
                    <select
                      className="rounded border border-slate-300 px-2 py-1 text-xs"
                      value={taskForm.assignedTo}
                      onChange={(event) => setTaskForm((prev) => ({ ...prev, assignedTo: event.target.value }))}
                    >
                      <option value="mentee">Mentee</option>
                      <option value="mentor">Mentor</option>
                      <option value="both">Both</option>
                    </select>
                    <input
                      type="datetime-local"
                      className="rounded border border-slate-300 px-2 py-1 text-xs"
                      value={taskForm.dueAt}
                      onChange={(event) => setTaskForm((prev) => ({ ...prev, dueAt: event.target.value }))}
                    />
                  </div>
                  <button
                    type="submit"
                    className="rounded bg-brand-700 px-2 py-1 text-xs font-semibold text-white"
                    disabled={actionLoading}
                  >
                    Add task
                  </button>
                </form>
              )}
            </div>

            <div className="rounded-lg border border-slate-200 p-3">
              <p className="text-sm font-semibold text-slate-900">Follow-up Actions</p>
              <div className="mt-2 max-h-40 space-y-2 overflow-y-auto">
                {selectedSession.followUpActions?.length ? (
                  selectedSession.followUpActions.map((item) => (
                    <div key={item._id} className="rounded bg-slate-100 p-2 text-xs text-slate-700">
                      <p className="font-semibold">{item.summary}</p>
                      <p>
                        Next: {item.nextCheckInAt ? new Date(item.nextCheckInAt).toLocaleString() : "Not set"}
                      </p>
                      <p>Status: {item.status}</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {["planned", "completed", "cancelled"].map((state) => (
                          <button
                            key={state}
                            type="button"
                            className="rounded border border-slate-300 px-1.5 py-0.5 text-[10px]"
                            onClick={() => updateFollowUpStatus(item._id, state)}
                            disabled={actionLoading}
                          >
                            {state}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500">No follow-ups yet.</p>
                )}
              </div>
              {(user.role === "mentor" || user.role === "admin") && (
                <form className="mt-2 space-y-2" onSubmit={addFollowUp}>
                  <input
                    className="w-full rounded border border-slate-300 px-2 py-1 text-xs"
                    placeholder="Follow-up summary"
                    value={followUpForm.summary}
                    onChange={(event) => setFollowUpForm((prev) => ({ ...prev, summary: event.target.value }))}
                    required
                  />
                  <input
                    type="datetime-local"
                    className="w-full rounded border border-slate-300 px-2 py-1 text-xs"
                    value={followUpForm.nextCheckInAt}
                    onChange={(event) =>
                      setFollowUpForm((prev) => ({ ...prev, nextCheckInAt: event.target.value }))
                    }
                  />
                  <button
                    type="submit"
                    className="rounded bg-brand-700 px-2 py-1 text-xs font-semibold text-white"
                    disabled={actionLoading}
                  >
                    Add follow-up
                  </button>
                </form>
              )}
            </div>
          </div>

          <div className="mt-4 h-72 space-y-2 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-3">
            {messages.length ? (
              messages.map((chat) => {
                const mine = chat.sender?._id === user.id;
                return (
                  <div
                    key={chat._id}
                    className={`max-w-[80%] rounded-md px-3 py-2 text-sm ${
                      mine ? "ml-auto bg-brand-700 text-white" : "bg-white text-slate-700"
                    }`}
                  >
                    <p className="text-[11px] font-semibold opacity-80">{chat.sender?.name || "User"}</p>
                    <p>{chat.text}</p>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-slate-500">No messages yet.</p>
            )}
          </div>

          <div className="mt-3 flex gap-2">
            <input
              className="flex-1 rounded-md border border-slate-300 px-3 py-2"
              placeholder={socketStatus === "connected" ? "Type your message" : "Waiting for socket connection..."}
              value={chatText}
              onChange={(e) => setChatText(e.target.value)}
              disabled={socketStatus !== "connected" || chatSending}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  sendChat();
                }
              }}
            />
            <button
              type="button"
              onClick={sendChat}
              className="rounded-md bg-brand-700 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
              disabled={socketStatus !== "connected" || chatSending}
            >
              {chatSending ? "Sending..." : "Send"}
            </button>
          </div>
        </section>
      )}
    </section>
  );
};

export default MentorsPage;
