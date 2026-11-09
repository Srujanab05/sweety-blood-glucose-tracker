
import { useEffect, useState } from "react";
import axios from "axios";
import {
  HeartPulse,
  Droplet,
  Activity,
  TrendingUp,
  TrendingDown,
  Plus,
  LogOut,
  CalendarDays,
  Pencil,
  Trash2
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import "./App.css";

const API = "http://localhost:5000";
const authInputStyle = { width: "100%", boxSizing: "border-box", padding: "13px 14px", border: "1px solid #eadde5", borderRadius: 10, fontSize: 15, outlineColor: "#d94f83" };
const authButtonStyle = { width: "100%", padding: 14, border: 0, borderRadius: 10, background: "#d94f83", color: "white", fontSize: 16, fontWeight: 700, cursor: "pointer" };

function App() {
  const [user, setUser] = useState(() => {
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    if (!savedToken || !savedUser) return null;
    try { return JSON.parse(savedUser); } catch { return null; }
  });
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "" });
  const [authMessage, setAuthMessage] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const [readings, setReadings] = useState([]);
  const [reports, setReports] = useState(null);

  const [date, setDate] = useState(
    new Date().toLocaleDateString("en-CA")
  );

  const [form, setForm] = useState({
    reading_date: new Date().toLocaleDateString("en-CA"),
    time_slot: "Morning",
    glucose_value: ""
  });

  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");

  const token = localStorage.getItem("token");

  const config = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthMessage("");
    setAuthLoading(true);
    try {
      if (authMode === "signup") {
        const response = await axios.post(`${API}/api/auth/signup`, {
          name: authForm.name.trim(),
          email: authForm.email.trim(),
          password: authForm.password
        });
        const returnedToken = response.data.token;
        const returnedUser = response.data.user;
        if (returnedToken && returnedUser) {
          localStorage.setItem("token", returnedToken);
          localStorage.setItem("user", JSON.stringify(returnedUser));
          setUser(returnedUser);
        } else {
          setAuthMode("login");
          setAuthMessage(response.data.message || "Account created successfully. Please log in.");
        }
      } else {
        const response = await axios.post(`${API}/api/auth/login`, {
          email: authForm.email.trim(),
          password: authForm.password
        });
        const returnedToken = response.data.token;
        const returnedUser = response.data.user;
        if (!returnedToken || !returnedUser) {
          throw new Error("Login response did not include a token and user. Check the backend login response.");
        }
        localStorage.setItem("token", returnedToken);
        localStorage.setItem("user", JSON.stringify(returnedUser));
        setUser(returnedUser);
        setAuthForm({ name: "", email: "", password: "" });
      }
    } catch (error) {
      setAuthMessage(error.response?.data?.message || error.message || "Unable to connect to the server.");
    } finally {
      setAuthLoading(false);
    }
  };

  const loadData = async () => {
    try {
      const readingResponse = await axios.get(
        `${API}/api/readings`,
        config
      );

      setReadings(readingResponse.data.readings || []);

      const reportResponse = await axios.get(
        `${API}/api/reports?date=${date}`,
        config
      );

      setReports(reportResponse.data);
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Unable to load dashboard"
      );
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, date]);

  const handleAddReading = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      await axios.post(
        `${API}/api/readings`,
        {
          ...form,
          glucose_value: Number(form.glucose_value)
        },
        config
      );

      setMessage("Reading added successfully!");

      setForm({
        reading_date: date,
        time_slot: "Morning",
        glucose_value: ""
      });

      await loadData();
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Unable to add reading"
      );
    }
  };

  const handleEdit = (reading) => {
    setEditingId(reading.id);

    setForm({
      reading_date: String(reading.reading_date).slice(0, 10),
      time_slot: reading.time_slot,
      glucose_value: String(reading.glucose_value)
    });

    setMessage("Edit the reading details and click Update Reading.");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleUpdateReading = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      await axios.put(
        `${API}/api/readings/${editingId}`,
        {
          ...form,
          glucose_value: Number(form.glucose_value)
        },
        config
      );

      setMessage("Reading updated successfully!");
      setEditingId(null);

      setForm({
        reading_date: date,
        time_slot: "Morning",
        glucose_value: ""
      });

      await loadData();
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Unable to update reading"
      );
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);

    setForm({
      reading_date: date,
      time_slot: "Morning",
      glucose_value: ""
    });

    setMessage("");
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this reading?")) {
      return;
    }

    try {
      await axios.delete(
        `${API}/api/readings/${id}`,
        config
      );

      setMessage("Reading deleted successfully!");
      await loadData();
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Unable to delete reading"
      );
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setUser(null);
    setReadings([]);
    setReports(null);
  };

  if (!user) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 20, background: "linear-gradient(135deg, #fff1f6, #f4efff)", fontFamily: "Arial, sans-serif" }}>
        <div style={{ width: "100%", maxWidth: 430, background: "white", padding: 32, borderRadius: 22, boxShadow: "0 15px 45px rgba(100, 60, 90, 0.12)" }}>
          <div style={{ textAlign: "center", marginBottom: 24, color: "#d94f83" }}>
            <HeartPulse size={42} />
            <h1 style={{ margin: "12px 0 8px", color: "#39283a", fontSize: 30, lineHeight: 1.2, fontWeight: 700, letterSpacing: "-0.5px", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
              <span>Welcome to</span>
              <span style={{ color: "#d94f83" }}>Sweety 💗</span>
            </h1>
            <p style={{ margin: 0, color: "#786b79", fontSize: 14, lineHeight: 1.5 }}>Your personal blood glucose tracker</p>
          </div>
          <h2 style={{ color: "#39283a" }}>{authMode === "login" ? "Login to your account" : "Create your account"}</h2>
          <form onSubmit={handleAuthSubmit} style={{ display: "grid", gap: 13 }}>
            {authMode === "signup" && (
              <input required type="text" placeholder="Full name" value={authForm.name} onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })} style={authInputStyle} />
            )}
            <input required type="email" placeholder="Email address" value={authForm.email} onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })} style={authInputStyle} />
            <input required minLength={6} type="password" placeholder="Password" value={authForm.password} onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })} style={authInputStyle} />
            <button type="submit" disabled={authLoading} style={authButtonStyle}>{authLoading ? "Please wait..." : authMode === "login" ? "Login" : "Sign Up"}</button>
          </form>
          {authMessage && <p role="alert" style={{ color: "#bd315f", marginTop: 16 }}>{authMessage}</p>}
          <p style={{ textAlign: "center", color: "#786b79", marginTop: 20 }}>
            {authMode === "login" ? "Don't have an account? " : "Already have an account? "}
            <button type="button" onClick={() => { setAuthMode(authMode === "login" ? "signup" : "login"); setAuthMessage(""); }} style={{ border: 0, background: "none", color: "#d94f83", fontWeight: 700, cursor: "pointer" }}>
              {authMode === "login" ? "Sign up" : "Login"}
            </button>
          </p>
        </div>
      </div>
    );
  }

  const daily = reports?.daily;
const chartData = [...readings]
  .sort(
    (a, b) =>
      new Date(a.reading_date) - new Date(b.reading_date)
  )
  .map((reading) => ({
    date: new Date(
  String(reading.reading_date).slice(0, 10) + "T00:00:00"
).toLocaleDateString("en-IN", {
  day: "2-digit",
  month: "short"
}),
    glucose: reading.glucose_value,
    slot: reading.time_slot
  }));
  return (
    <div className="dashboard">

      <header className="topbar">
        <div className="brand">
          <HeartPulse size={28} />
          <span>Sweety</span>
        </div>

        <div className="profile">
          <span>Welcome, {user.name}!</span>

          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={17} />
            Logout
          </button>
        </div>
      </header>

      <main className="main-content">

        <section className="welcome-section">
          <div>
            <p className="eyebrow">YOUR HEALTH COMPANION</p>
            <h1>Hello, {user.name}! 💗</h1>
            <p>Stay aware, stay healthy. Every reading matters.</p>
          </div>

          <div className="heart-icon">
            <HeartPulse size={48} />
          </div>
        </section>

        <section className="stats-grid">

          <div className="stat-card">
            <div className="stat-icon pink">
              <TrendingUp />
            </div>
            <p>Highest Glucose</p>
            <h2>{daily?.highest ?? "--"} <small>mg/dL</small></h2>
          </div>

          <div className="stat-card">
            <div className="stat-icon green">
              <TrendingDown />
            </div>
            <p>Lowest Glucose</p>
            <h2>{daily?.lowest ?? "--"} <small>mg/dL</small></h2>
          </div>

          <div className="stat-card">
            <div className="stat-icon purple">
              <Activity />
            </div>
            <p>Average Glucose</p>
            <h2>{daily?.average ?? "--"} <small>mg/dL</small></h2>
          </div>

          <div className="stat-card">
            <div className="stat-icon orange">
              <Droplet />
            </div>
            <p>Total Readings</p>
            <h2>{daily?.count ?? 0}</h2>
          </div>

        </section>

        <div className="content-grid">

          <section className="panel">
            <div className="panel-heading">
              <div>
                <h2>
                  <Plus size={20} />
                  {editingId ? "Edit Glucose Reading" : "Add Glucose Reading"}
                </h2>

                <p>
                  {editingId
                    ? "Update your glucose measurement."
                    : "Record your latest glucose measurement."}
                </p>
              </div>
            </div>

            <form
              onSubmit={editingId ? handleUpdateReading : handleAddReading}
              className="reading-form"
            >

              <label>Date</label>

              <input
                type="date"
                value={form.reading_date}
                max={new Date().toLocaleDateString("en-CA")}
                onChange={(e) =>
                  setForm({ ...form, reading_date: e.target.value })
                }
                required
              />

              <label>Time Slot</label>

              <select
                value={form.time_slot}
                onChange={(e) =>
                  setForm({ ...form, time_slot: e.target.value })
                }
              >
                <option>Morning</option>
                <option>After breakfast</option>
                <option>After lunch</option>
                <option>After dinner</option>
              </select>

              <label>Glucose Value (mg/dL)</label>

              <input
                type="number"
                min="40"
                max="600"
                step="1"
                placeholder="Enter glucose value"
                value={form.glucose_value}
                onChange={(e) =>
                  setForm({ ...form, glucose_value: e.target.value })
                }
                required
              />

              <button type="submit" className="add-btn">
                <Plus size={18} />
                {editingId ? "Update Reading" : "Save Reading"}
              </button>

              {editingId && (
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={handleCancelEdit}
                >
                  Cancel Edit
                </button>
              )}

            </form>
          </section>

          <section className="panel">
            <div className="panel-heading">
              <div>
                <h2>
                  <CalendarDays size={20} />
                  Reports
                </h2>
                <p>Select a date to view your statistics.</p>
              </div>
            </div>

            <label>Selected Date</label>

            <input
              type="date"
              value={date}
              max={new Date().toLocaleDateString("en-CA")}
              onChange={(e) => {
                setDate(e.target.value);

                if (!editingId) {
                  setForm((prev) => ({
                    ...prev,
                    reading_date: e.target.value
                  }));
                }
              }}
            />

            <div className="report-row">
              <span>Month-to-date average</span>
              <strong>
                {reports?.monthToDate?.average ?? "--"} mg/dL
              </strong>
            </div>

            <div className="report-row">
              <span>Previous month average</span>
              <strong>
                {reports?.previousMonth?.average ?? "--"} mg/dL
              </strong>
            </div>

            <div className="report-row">
              <span>Month-to-date readings</span>
              <strong>{reports?.monthToDate?.count ?? 0}</strong>
            </div>

          </section>

        </div>
<section className="panel chart-panel">
  <div className="panel-heading">
    <div>
      <h2>Glucose Trends 📈</h2>
      <p>Track your glucose measurements over time.</p>
    </div>
  </div>

  {chartData.length === 0 ? (
    <p className="empty-state">
      No readings available for the chart.
    </p>
  ) : (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eeeaf3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip
          formatter={(value) => [`${value} mg/dL`, "Glucose"]}
        />
        <Line
          type="monotone"
          dataKey="glucose"
          stroke="#dc5485"
          strokeWidth={3}
          dot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )}
</section>
        <section className="panel history-panel">

          <div className="panel-heading">
            <div>
              <h2>Reading History</h2>
              <p>Your recorded glucose measurements.</p>
            </div>
          </div>

          {readings.length === 0 ? (
            <p className="empty-state">
              No readings recorded yet.
            </p>
          ) : (

            <div className="table-wrapper">
              <table>

                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Time Slot</th>
                    <th>Glucose Value</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {readings.map((reading) => (

                    <tr key={reading.id}>

                      <td>
                        {new Date(reading.reading_date).toLocaleDateString("en-CA")}
                      </td>

                      <td>{reading.time_slot}</td>

                      <td>
                        <strong>
                          {reading.glucose_value} mg/dL
                        </strong>
                      </td>

                      <td>
                        <button
                          className="edit-btn"
                          onClick={() => handleEdit(reading)}
                        >
                          <Pencil size={14} />
                          Edit
                        </button>

                        <button
                          className="delete-btn"
                          onClick={() => handleDelete(reading.id)}
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </td>

                    </tr>

                  ))}
                </tbody>

              </table>
            </div>

          )}

        </section>

        {message && (
          <p className="message">{message}</p>
        )}

        <footer>
          Made with 💗 Sweety Blood Glucose Tracker
        </footer>

      </main>
    </div>
  );
}

export default App;
