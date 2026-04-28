import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  RadialLinearScale,
  Filler,
} from 'chart.js';
import { Bar, Radar, Doughnut } from 'react-chartjs-2';
import { showSuccess, showError } from '../utils/toast';
import { Brain, Percent, Clock, Search, TrendingUp, Info, LayoutDashboard } from 'lucide-react';
import { Link } from 'react-router-dom';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  RadialLinearScale,
  Filler,
  Title,
  Tooltip,
  Legend
);

export default function PerformanceAnalysis() {
  const [summary, setSummary] = useState(null);
  const [ranking, setRanking] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // New States for Prediction Flow
  const [prediction, setPrediction] = useState(null);
  const [predicting, setPredicting] = useState(false);
  const [formData, setFormData] = useState({
    quiz_score: '',
    attendance: '',
    study_hours: ''
  });

  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
  const studentId = JSON.parse(localStorage.getItem('user'))?.studentId || 1;

  const fetchInitialData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [summaryRes, rankingRes, personalRes] = await Promise.all([
        axios.get(`${API_BASE}/performance-summary/`),
        axios.get(`${API_BASE}/student-ranking/`),
        axios.get(`${API_BASE}/predict-student-performance/${studentId}/`)
      ]);
      setSummary(summaryRes.data);
      setRanking(rankingRes.data);
      setPrediction(personalRes.data);
      
      if (personalRes.data.input_data) {
        setFormData({
          quiz_score: personalRes.data.input_data.quiz_score,
          attendance: personalRes.data.input_data.attendance,
          study_hours: personalRes.data.input_data.study_hours
        });
      }
    } catch (err) {
      console.error("Error fetching initial analysis data:", err);
    } finally {
      setLoading(false);
    }
  }, [API_BASE, studentId]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePredict = async (e) => {
    e.preventDefault();
    if (!formData.quiz_score || !formData.attendance || !formData.study_hours) {
      showError("Please fill all inputs to analyze performance.");
      return;
    }

    try {
      setPredicting(true);
      const res = await axios.post(`${API_BASE}/predict-performance/`, formData);
      setPrediction(res.data);
      showSuccess("Personal Analysis Updated!");
    } catch (err) {
      console.error("Prediction error:", err);
      showError("Failed to update analysis.");
    } finally {
      setPredicting(false);
    }
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 'Excellent': return '#22c55e';
      case 'Good': return '#6366f1';
      case 'Average': return '#f59e0b';
      case 'At Risk': return '#ef4444';
      default: return '#64748b';
    }
  };

  const barChartData = {
    labels: ['Class Average', 'Your Predicted Score'],
    datasets: [
      {
        label: 'Performance Score',
        data: [summary?.average_score || 0, prediction?.predicted_score || 0],
        backgroundColor: ['rgba(148, 163, 184, 0.4)', getLevelColor(prediction?.performance_level) + 'CC'],
        borderColor: ['#94a3b8', getLevelColor(prediction?.performance_level)],
        borderWidth: 2,
        borderRadius: 8
      },
    ],
  };

  const radarChartData = {
    labels: ['Quiz Score', 'Attendance', 'Study Target (out of 10)'],
    datasets: [
      {
        label: 'Your Current Metrics',
        data: [
          Number(formData.quiz_score) || 0,
          Number(formData.attendance) || 0,
          (Number(formData.study_hours) || 0) * 10 // scale to ~100
        ],
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        borderColor: '#6366f1',
        pointBackgroundColor: '#6366f1',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#6366f1'
      },
      {
        label: 'Target Metrics',
        data: [90, 95, 80],
        backgroundColor: 'rgba(34, 197, 94, 0.2)',
        borderColor: '#22c55e',
        pointBackgroundColor: '#22c55e',
        pointBorderColor: '#fff',
      }
    ]
  };

  const doughnutData = {
    labels: ['Pass Rate', 'Fail Rate'],
    datasets: [
      {
        data: [summary?.pass_percentage || 75, summary?.fail_percentage || 25],
        backgroundColor: ['#10b981', '#ef4444'],
        hoverBackgroundColor: ['#059669', '#dc2626'],
        borderWidth: 0,
      }
    ]
  };

  const improvementTip = () => {
    if (prediction?.predicted_score < 50) return "Urgent: Focus on increasing attendance to 90%+ and dedicate at least 4 hours of daily study to exit the 'At Risk' zone.";
    if (prediction?.predicted_score < 75) return "Focus on improving Quiz Scores by reviewing interactive materials. A 10% increase in quiz results typically boosts final performance by 15%.";
    return "You are performing exceptionally! Maintain your consistent study hours and try assisting peers to reinforce your knowledge.";
  };

  const getDynamicRank = () => {
    if (!ranking || !prediction) return 'XX';
    const predScore = prediction.predicted_score;
    let rank = 1;
    for (let r of ranking) {
      if (predScore >= r.performance_score) {
        return rank;
      }
      rank++;
    }
    return ranking.length + 1;
  };

  const getStudentName = (student) => {
    if (student.name) return student.name;
    const firstNames = ["Aarav", "Diya", "Rohan", "Neha", "Vihaan", "Aditi", "Sai", "Ananya", "Krishna", "Isha", "Arjun", "Kavya", "Aryan", "Pooja", "Dhruv", "Riya"];
    const lastNames = ["Sharma", "Patel", "Singh", "Kumar", "Gupta", "Deshmukh", "Joshi", "Kapoor", "Yadav", "Verma", "Rao", "Reddy", "Nair", "Das", "Bose"];
    const id = student.id || 0;
    
    // Simple deterministic hash
    const hash1 = (id * 13) % firstNames.length;
    const hash2 = (id * 17) % lastNames.length;
    
    return `${firstNames[hash1]} ${lastNames[hash2]}`;
  };

  if (loading) return <div className="app-container page-enter-active"><div className="card card-modern pulse" style={{ textAlign: 'center', padding: '100px' }}>Loading deep performance insights...</div></div>;

  return (
    <div className="app-container page-enter-active">
      <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '2.8rem', color: 'var(--text-main)', marginBottom: '8px' }}>Performance Analysis</h1>
          <p className="hero-subtitle">Individual academic charting and growth strategy.</p>
        </div>
        <Link to="/student-dashboard" className="btn btn-modern btn-outline-modern" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <LayoutDashboard size={18} /> Back to Hub
        </Link>
      </header>

      {/* Persistence and Comparison Analysis */}
      <div className="card card-modern slide-in-bottom delay-100" style={{ marginBottom: '40px', borderLeft: `6px solid ${getLevelColor(prediction?.performance_level)}` }}>
        <h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Brain size={28} color="var(--primary)" /> Your AI Analysis Settings
        </h3>
        <p className="small" style={{ marginBottom: '25px', opacity: 0.7 }}>
          These values are synced from your student record. Alter them to see how changes affect your global standing.
        </p>
        <form onSubmit={handlePredict} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Percent size={14} /> Quiz Score (%)
            </label>
            <input 
              className="input input-modern" 
              name="quiz_score" 
              type="number" 
              value={formData.quiz_score} 
              onChange={handleInputChange} 
              placeholder="e.g. 85" 
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Search size={14} /> Attendance (%)
            </label>
            <input 
              className="input input-modern" 
              name="attendance" 
              type="number" 
              value={formData.attendance} 
              onChange={handleInputChange} 
              placeholder="e.g. 90" 
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={14} /> Study Hours
            </label>
            <input 
              className="input input-modern" 
              name="study_hours" 
              type="number" 
              value={formData.study_hours} 
              onChange={handleInputChange} 
              placeholder="e.g. 5" 
            />
          </div>
          <button type="submit" className="btn btn-modern btn-gradient" style={{ height: '52px' }} disabled={predicting}>
            {predicting ? "Analyzing..." : "Update Analytics"}
          </button>
        </form>
      </div>

      {prediction && (
        <div className="page-enter-active">
          <div className="dashboard-grid" style={{ marginBottom: '40px' }}>
            <div className="card card-modern hover-lift slide-in-left delay-200" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', borderTop: `6px solid ${getLevelColor(prediction.performance_level)}` }}>
              <div className="small" style={{ fontWeight: 800, color: 'var(--text-main)', opacity: 0.5, letterSpacing: '1px' }}>PREDICTED SCORE</div>
              <div style={{ fontSize: '5rem', fontWeight: 900, color: getLevelColor(prediction.performance_level), lineHeight: 1, margin: '10px 0' }}>
                {prediction.predicted_score}%
              </div>
              <div style={{ 
                margin: '10px auto', 
                padding: '10px 24px', 
                background: getLevelColor(prediction.performance_level), 
                color: 'white', 
                borderRadius: '50px', 
                fontWeight: 900,
                fontSize: '1.2rem'
              }}>
                {prediction.performance_level}
              </div>
            </div>

            <div className="card card-modern slide-in-right delay-300">
               <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                 <TrendingUp size={24} color="var(--primary)" /> Growth Strategy
               </h3>
               <div style={{ background: 'rgba(99, 102, 241, 0.05)', padding: '24px', borderRadius: '16px', borderLeft: '5px solid var(--primary)' }}>
                  <p style={{ lineHeight: 1.7, margin: 0, fontWeight: 500 }}>{improvementTip()}</p>
               </div>
               <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="small" style={{ fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '6px', opacity: 0.6 }}>
                    <Info size={14} /> Comparison generated against the global class average.
                  </div>
               </div>
            </div>
          </div>

          <div className="dashboard-grid">
            <div className="card card-modern hover-lift slide-in-left delay-400">
              <h3 style={{ marginBottom: '24px' }}>Peer Comparison Chart</h3>
              <div style={{ height: '320px' }}>
                <Bar 
                  data={barChartData} 
                  options={{ 
                    maintainAspectRatio: false, 
                    plugins: { legend: { display: false } },
                    scales: { 
                      y: { 
                        beginAtZero: true, 
                        max: 100,
                        grid: { display: false }
                      },
                      x: { grid: { display: false } }
                    }
                  }} 
                />
              </div>
            </div>
            <div className="card card-modern slide-in-right delay-500">
              <h3 style={{ marginBottom: '24px' }}>Input Radar Profile</h3>
              <div style={{ height: '320px' }}>
                <Radar
                   data={radarChartData}
                   options={{ maintainAspectRatio: false }}
                />
              </div>
            </div>
            
            <div className="card card-modern hover-lift slide-in-left delay-600">
              <h3 style={{ marginBottom: '24px' }}>Class Success Rate</h3>
              <div style={{ height: '320px', display: 'flex', justifyContent: 'center' }}>
                <Doughnut 
                  data={doughnutData} 
                  options={{ 
                    maintainAspectRatio: false,
                    cutout: '70%',
                    plugins: { legend: { position: 'bottom' } }
                  }} 
                />
              </div>
            </div>

            <div className="card card-modern slide-in-right delay-700">
              <h3 style={{ marginBottom: '24px' }}>Global Academic Ranking</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '2px solid rgba(0,0,0,0.05)' }}>
                      <th style={{ padding: '14px' }}>Rank</th>
                      <th style={{ padding: '14px' }}>Student</th>
                      <th style={{ padding: '14px' }}>Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ranking?.slice(0, 4).map((student, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                        <td style={{ padding: '14px', fontWeight: 800, color: 'var(--primary)' }}>#{student.rank}</td>
                        <td style={{ padding: '14px' }}>{getStudentName(student)}</td>
                        <td style={{ padding: '14px', fontWeight: 600 }}>{student.performance_score}%</td>
                      </tr>
                    ))}
                    <tr style={{ background: 'var(--primary)', color: 'white' }}>
                       <td style={{ padding: '14px', fontWeight: 900 }}>#{getDynamicRank()}</td>
                       <td style={{ padding: '14px', fontWeight: 700 }}>YOU (Predicted)</td>
                       <td style={{ padding: '14px', fontWeight: 900 }}>{prediction.predicted_score}%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
