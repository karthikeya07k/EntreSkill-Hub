import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { getSocket } from "../services/socket";
import { useAuth } from "../context/AuthContext";

const MentorsPage = () => {
  const { user } = useAuth();
  const [mentors, setMentors] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [messages, setMessages] = useState([]);
  const [chatText, setChatText] = useState("");
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
      setMessage(error.response?.data?.message || "Unable to load mentor data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onSessionRequest = (session) => {
      setSessions((prev) => {
        const exists = prev.some((item) => item._id === session._id);
        return exists ? prev : [...prev, session];
      });
    };

    const onSessionUpdated = (session) => {
      setSessions((prev) => prev.map((item) => (item._id === session._id ? session : item)));
    };

    socket.on("session:request", onSessionRequest);
    socket.on("session:updated", onSessionUpdated);

    return () => {
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
      setMessage(error.response?.data?.message || "Unable to request session.");
    }
  };

  const updateSessionStatus = async (sessionId, status) => {
    try {
      await api.patch(`/mentors/sessions/${sessionId}/status`, { status });
      await loadData();
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to update session.");
    }
  };

  const openChat = async (sessionId) => {
    setSelectedSessionId(sessionId);
    setMessage("");

    try {
      const { data } = await api.get(`/mentors/sessions/${sessionId}/messages`);
      setMessages(data.messages || []);
      const socket = getSocket();
      socket?.emit("session:join", { sessionId });
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to load chat history.");
    }
  };

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !selectedSessionId) return;

    const onNewMessage = (chatMessage) => {
      if (chatMessage.roomId === `session:${selectedSessionId}`) {
        setMessages((prev) => [...prev, chatMessage]);
      }
    };

    socket.on("chat:new", onNewMessage);

    return () => socket.off("chat:new", onNewMessage);
  }, [selectedSessionId]);

  const sendChat = () => {
    if (!chatText.trim() || !selectedSessionId) return;
    const socket = getSocket();
    socket?.emit("chat:message", {
      sessionId: selectedSessionId,
      text: chatText
    });
    setChatText("");
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
      </div>

      {message && <p className="rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-700">{message}</p>}

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
              sessions.map((session) => (
                <article key={session._id} className="rounded-lg border border-slate-200 p-3">
                  <p className="font-medium text-slate-900">{session.topic}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(session.scheduledAt).toLocaleString()} | Status:{" "}
                    <span className="capitalize">{session.status}</span>
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium"
                      onClick={() => openChat(session._id)}
                    >
                      Open Chat
                    </button>
                    {user.role === "mentor" && ["requested", "confirmed"].includes(session.status) && (
                      <>
                        <button
                          type="button"
                          className="rounded-md bg-emerald-600 px-2 py-1 text-xs font-semibold text-white"
                          onClick={() => updateSessionStatus(session._id, "confirmed")}
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          className="rounded-md bg-slate-800 px-2 py-1 text-xs font-semibold text-white"
                          onClick={() => updateSessionStatus(session._id, "completed")}
                        >
                          Mark Complete
                        </button>
                        <button
                          type="button"
                          className="rounded-md bg-red-600 px-2 py-1 text-xs font-semibold text-white"
                          onClick={() => updateSessionStatus(session._id, "cancelled")}
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </article>
              ))
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

          <div className="mt-4 h-72 space-y-2 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-3">
            {messages.length ? (
              messages.map((chat) => {
                const mine = chat.sender?._id === user.id;
                return (
                  <div key={chat._id} className={`max-w-[80%] rounded-md px-3 py-2 text-sm ${mine ? "ml-auto bg-brand-700 text-white" : "bg-white text-slate-700"}`}>
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
              placeholder="Type your message"
              value={chatText}
              onChange={(e) => setChatText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  sendChat();
                }
              }}
            />
            <button type="button" onClick={sendChat} className="rounded-md bg-brand-700 px-4 py-2 text-white">
              Send
            </button>
          </div>
        </section>
      )}
    </section>
  );
};

export default MentorsPage;
