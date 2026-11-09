
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

function App() {
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user")) || null
  );

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
    return <p>Please login to continue.</p>;
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
