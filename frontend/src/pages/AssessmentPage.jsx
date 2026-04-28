import { useEffect, useState } from "react";
import api from "../services/api";

const toggleValue = (list, value) => (list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);

const AssessmentPage = () => {
  const [skills, setSkills] = useState([]);
  const [interests, setInterests] = useState([]);
  const [form, setForm] = useState({
    name: "",
    location: "",
    bio: "",
    skills: [],
    interests: [],
    expertise: [],
    experienceYears: 0,
    availability: ""
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [skillsRes, interestsRes, profileRes] = await Promise.all([
          api.get("/meta/skills"),
          api.get("/meta/interests"),
          api.get("/users/profile")
        ]);

        const profile = profileRes.data.user;
        setSkills(skillsRes.data.skills);
        setInterests(interestsRes.data.interests);
        setForm({
          name: profile.name || "",
          location: profile.location || "",
          bio: profile.bio || "",
          skills: profile.skills || [],
          interests: profile.interests || [],
          expertise: profile.expertise || [],
          experienceYears: profile.experienceYears || 0,
          availability: profile.availability || ""
        });
      } catch (error) {
        setMessage(
          error.response?.data?.message ||
            error.message ||
            "Unable to load skills/interests right now. Try again after backend wakes up."
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const submitHandler = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      await api.put("/users/profile", form);
      setMessage("Profile updated. Your recommendations are now refreshed.");
    } catch (error) {
      setMessage(error.response?.data?.message || error.message || "Unable to update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-slate-600">Loading assessment form...</p>;
  }

  return (
    <section className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Skill & Interest Assessment</h1>
        <p className="mt-2 text-sm text-slate-600">
          Build your profile so we can map your skills and interests to relevant business opportunities.
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Completion tip: add both core skills and goals for better recommendation accuracy.
        </p>
      </div>

      <form className="rounded-2xl bg-white p-6 shadow-sm" onSubmit={submitHandler}>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Name</label>
            <input
              type="text"
              className="w-full rounded-md border border-slate-300 px-3 py-2"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Location</label>
            <input
              type="text"
              className="w-full rounded-md border border-slate-300 px-3 py-2"
              value={form.location}
              onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
              placeholder="City / Region"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="mb-1 block text-sm font-medium text-slate-700">Short Bio</label>
          <textarea
            className="h-24 w-full rounded-md border border-slate-300 px-3 py-2"
            value={form.bio}
            onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value }))}
            placeholder="Tell us about your business goals"
          />
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Mentor Expertise (optional)</label>
            <input
              type="text"
              className="w-full rounded-md border border-slate-300 px-3 py-2"
              placeholder="Comma separated (e.g., Tailoring, Sales)"
              value={form.expertise.join(", ")}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  expertise: e.target.value
                    .split(",")
                    .map((item) => item.trim())
                    .filter(Boolean)
                }))
              }
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Experience Years (optional)</label>
            <input
              type="number"
              min={0}
              max={60}
              className="w-full rounded-md border border-slate-300 px-3 py-2"
              value={form.experienceYears}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  experienceYears: Number(e.target.value || 0)
                }))
              }
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="mb-1 block text-sm font-medium text-slate-700">Availability (optional)</label>
          <input
            type="text"
            className="w-full rounded-md border border-slate-300 px-3 py-2"
            value={form.availability}
            onChange={(e) => setForm((prev) => ({ ...prev, availability: e.target.value }))}
            placeholder="Weekdays 6 PM - 9 PM"
          />
        </div>

        <div className="mt-6">
          <h2 className="text-base font-semibold text-slate-900">Select Skills</h2>
          {!skills.length && (
            <p className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Skills catalog is empty in your deployed DB. Run seed once for Atlas to enable recommendations.
            </p>
          )}
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {skills.map((skill) => (
              <label key={skill._id} className="flex items-center gap-2 rounded-md border border-slate-200 p-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.skills.includes(skill.name)}
                  onChange={() =>
                    setForm((prev) => ({
                      ...prev,
                      skills: toggleValue(prev.skills, skill.name)
                    }))
                  }
                />
                <span>{skill.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <h2 className="text-base font-semibold text-slate-900">Select Interests</h2>
          {!interests.length && (
            <p className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Interests catalog is empty in your deployed DB. Run seed once for Atlas to enable recommendations.
            </p>
          )}
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {interests.map((interest) => (
              <label
                key={interest._id}
                className="flex items-center gap-2 rounded-md border border-slate-200 p-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={form.interests.includes(interest.name)}
                  onChange={() =>
                    setForm((prev) => ({
                      ...prev,
                      interests: toggleValue(prev.interests, interest.name)
                    }))
                  }
                />
                <span>{interest.name}</span>
              </label>
            ))}
          </div>
        </div>

        {message && (
          <p className="mt-4 rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-700" role="status" aria-live="polite">
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="mt-6 rounded-md bg-brand-700 px-4 py-2.5 font-semibold text-white disabled:opacity-70"
        >
          {saving ? "Saving..." : "Save Assessment"}
        </button>
      </form>
    </section>
  );
};

export default AssessmentPage;
