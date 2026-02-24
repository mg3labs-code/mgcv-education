import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";

interface Student {
  roll: number;
  name: string;
  score: number;
  performance: string;
  strengths: string;
  weaknesses: string;
}

const studentsData: Student[] = [
  { roll: 123791, name: "Avni Singh", score: 100, performance: "Outstanding", strengths: "Linear Programming, Probability", weaknesses: "None" },
  { roll: 123343, name: "Avni Rathi", score: 91, performance: "Outstanding", strengths: "Determinants, Probability", weaknesses: "None" },
  { roll: 125611, name: "Vivaan Jain", score: 44, performance: "Below Average", strengths: "Vector Algebra, Differential Equations", weaknesses: "None" },
  { roll: 123602, name: "Riya Mishra", score: 86, performance: "Excellent", strengths: "Integrals, Differential Equations", weaknesses: "None" },
  { roll: 127955, name: "Meera Sharma", score: 97, performance: "Outstanding", strengths: "Integrals, Application of Integrals", weaknesses: "None" },
  { roll: 122706, name: "Aarav Mishra", score: 57, performance: "Average", strengths: "Integrals, Differential Equations", weaknesses: "Application of Integrals" },
  { roll: 129522, name: "Meera Rathi", score: 61, performance: "Good", strengths: "Three Dimensional Geometry, Continuity", weaknesses: "Three Dimensional Geometry" },
  { roll: 129892, name: "Avni Jain", score: 72, performance: "Very Good", strengths: "Application of Derivatives, Vector Algebra", weaknesses: "None" },
  { roll: 121625, name: "Rohit Agarwal", score: 63, performance: "Good", strengths: "Differentiability, Matrices", weaknesses: "None" },
  { roll: 126278, name: "Ira Das", score: 45, performance: "Below Average", strengths: "Integrals, Relations and Functions", weaknesses: "None" },
  { roll: 122063, name: "Nikhil Chopra", score: 82, performance: "Excellent", strengths: "Differential Equations, Integrals", weaknesses: "Matrices" },
  { roll: 123198, name: "Vivaan Mehta", score: 96, performance: "Outstanding", strengths: "Continuity, Differentiability", weaknesses: "None" },
  { roll: 122552, name: "Aarav Mehta", score: 59, performance: "Average", strengths: "Determinants, Matrices", weaknesses: "None" },
  { roll: 127285, name: "Sana Agarwal", score: 45, performance: "Below Average", strengths: "Inverse Trigonometric Functions, Continuity", weaknesses: "Continuity" },
  { roll: 127691, name: "Vivaan Chopra", score: 41, performance: "Below Average", strengths: "Application of Integrals, Determinants", weaknesses: "None" },
  { roll: 128220, name: "Aarav Rathi", score: 69, performance: "Good", strengths: "Integrals, Differentiability", weaknesses: "Application of Derivatives" },
  { roll: 126883, name: "Avni Agarwal", score: 40, performance: "Below Average", strengths: "Inverse Trigonometric Functions, Vector Algebra", weaknesses: "None" },
  { roll: 124743, name: "Kunal Bansal", score: 93, performance: "Outstanding", strengths: "Three Dimensional Geometry, Integrals", weaknesses: "Vector Algebra" },
  { roll: 123817, name: "Diya Verma", score: 46, performance: "Below Average", strengths: "Linear Programming, Continuity", weaknesses: "Matrices" },
  { roll: 122849, name: "Kunal Rathi", score: 52, performance: "Average", strengths: "Determinants, Application of Derivatives", weaknesses: "Differentiability" },
  { roll: 128351, name: "Kabir Sharma", score: 46, performance: "Below Average", strengths: "Relations and Functions, Linear Programming", weaknesses: "Relations and Functions" },
  { roll: 122087, name: "Avni Agarwal", score: 54, performance: "Average", strengths: "Differentiability, Inverse Trigonometric Functions", weaknesses: "Application of Derivatives" },
  { roll: 125285, name: "Aarav Rao", score: 97, performance: "Outstanding", strengths: "Application of Integrals, Continuity", weaknesses: "None" },
  { roll: 122690, name: "Aarav Khan", score: 92, performance: "Outstanding", strengths: "Continuity, Determinants", weaknesses: "None" },
  { roll: 128663, name: "Arjun Singh", score: 53, performance: "Average", strengths: "Vector Algebra, Matrices", weaknesses: "Relations and Functions" },
  { roll: 122020, name: "Rehan Mehta", score: 77, performance: "Very Good", strengths: "Application of Integrals, Probability", weaknesses: "None" },
  { roll: 127967, name: "Ananya Agarwal", score: 73, performance: "Very Good", strengths: "Continuity, Three Dimensional Geometry", weaknesses: "None" },
  { roll: 129711, name: "Nikhil Sharma", score: 100, performance: "Outstanding", strengths: "Vector Algebra, Differentiability", weaknesses: "None" },
  { roll: 124449, name: "Aarav Khan", score: 60, performance: "Good", strengths: "Differential Equations, Three Dimensional Geometry", weaknesses: "Integrals" },
  { roll: 125405, name: "Kunal Das", score: 67, performance: "Good", strengths: "Vector Algebra, Differential Equations", weaknesses: "None" },
  { roll: 122305, name: "Aarav Nair", score: 59, performance: "Average", strengths: "Vector Algebra, Three Dimensional Geometry", weaknesses: "None" },
  { roll: 121833, name: "Rohit Nair", score: 56, performance: "Average", strengths: "Integrals, Linear Programming", weaknesses: "Application of Derivatives" },
  { roll: 126677, name: "Avni Khan", score: 73, performance: "Very Good", strengths: "Matrices, Determinants", weaknesses: "Application of Integrals" },
  { roll: 123752, name: "Nikhil Rathi", score: 46, performance: "Below Average", strengths: "Linear Programming, Three Dimensional Geometry", weaknesses: "None" },
  { roll: 127948, name: "Tanya Chopra", score: 80, performance: "Excellent", strengths: "Linear Programming, Relations and Functions", weaknesses: "Differential Equations" },
  { roll: 122407, name: "Riya Jain", score: 82, performance: "Excellent", strengths: "Probability, Relations and Functions", weaknesses: "None" },
  { roll: 122513, name: "Ira Mishra", score: 43, performance: "Below Average", strengths: "Determinants, Probability", weaknesses: "None" },
  { roll: 127267, name: "Tanya Bansal", score: 52, performance: "Average", strengths: "Integrals, Inverse Trigonometric Functions", weaknesses: "Determinants" },
  { roll: 126783, name: "Aarav Sharma", score: 62, performance: "Good", strengths: "Matrices, Three Dimensional Geometry", weaknesses: "Probability" },
  { roll: 121713, name: "Nikhil Sharma", score: 74, performance: "Very Good", strengths: "Determinants, Three Dimensional Geometry", weaknesses: "None" },
  { roll: 125293, name: "Riya Nair", score: 44, performance: "Below Average", strengths: "Application of Integrals, Linear Programming", weaknesses: "None" },
  { roll: 128583, name: "Ananya Khan", score: 91, performance: "Outstanding", strengths: "Differentiability, Differential Equations", weaknesses: "None" },
  { roll: 127698, name: "Rehan Singh", score: 50, performance: "Average", strengths: "Application of Integrals, Matrices", weaknesses: "None" },
  { roll: 126760, name: "Tanya Nair", score: 72, performance: "Very Good", strengths: "Three Dimensional Geometry, Determinants", weaknesses: "None" },
  { roll: 129031, name: "Sana Jain", score: 84, performance: "Excellent", strengths: "Matrices, Determinants", weaknesses: "None" },
  { roll: 121410, name: "Kabir Das", score: 57, performance: "Average", strengths: "Linear Programming, Matrices", weaknesses: "None" },
  { roll: 128442, name: "Arjun Singh", score: 69, performance: "Good", strengths: "Linear Programming, Inverse Trigonometric Functions", weaknesses: "None" },
  { roll: 122435, name: "Avni Khan", score: 43, performance: "Below Average", strengths: "Integrals, Relations and Functions", weaknesses: "Differentiability" },
  { roll: 127006, name: "Ishaan Nair", score: 55, performance: "Average", strengths: "Three Dimensional Geometry, Vector Algebra", weaknesses: "None" },
  { roll: 125351, name: "Kunal Verma", score: 88, performance: "Excellent", strengths: "Continuity, Application of Derivatives", weaknesses: "None" },
  { roll: 124206, name: "Ira Mehta", score: 51, performance: "Average", strengths: "Application of Derivatives, Application of Integrals", weaknesses: "None" },
  { roll: 122420, name: "Avni Jain", score: 97, performance: "Outstanding", strengths: "Probability, Determinants", weaknesses: "Probability" },
  { roll: 129398, name: "Kunal Rathi", score: 85, performance: "Excellent", strengths: "Differential Equations, Differentiability", weaknesses: "Matrices" },
  { roll: 127125, name: "Kabir Sharma", score: 81, performance: "Excellent", strengths: "Matrices, Inverse Trigonometric Functions", weaknesses: "Probability" },
  { roll: 129849, name: "Avni Gupta", score: 40, performance: "Below Average", strengths: "Application of Integrals, Three Dimensional Geometry", weaknesses: "Differential Equations" },
];

const PERF_COLORS: Record<string, string> = {
  Outstanding: "#4CAF50",
  Excellent: "#2196F3",
  "Very Good": "#00BCD4",
  Good: "#FF9800",
  Average: "#FF5722",
  "Below Average": "#9C27B0",
};

const getGrade = (score: number) => {
  if (score >= 90) return "A+";
  if (score >= 80) return "A";
  if (score >= 70) return "B+";
  if (score >= 60) return "B";
  if (score >= 50) return "C";
  if (score >= 40) return "D";
  return "F";
};

const TeacherAnalytics = () => {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const stats = useMemo(() => {
    const total = studentsData.length;
    const avg = Math.round(studentsData.reduce((s, st) => s + st.score, 0) / total);
    const outstanding = studentsData.filter((s) => s.performance === "Outstanding").length;
    const passRate = Math.round((studentsData.filter((s) => s.score >= 60).length / total) * 100);
    return { total, avg, outstanding, passRate };
  }, []);

  const scoreDistribution = useMemo(() => {
    const ranges = { "90-100": 0, "80-89": 0, "70-79": 0, "60-69": 0, "50-59": 0, "40-49": 0, "0-39": 0 };
    studentsData.forEach((s) => {
      if (s.score >= 90) ranges["90-100"]++;
      else if (s.score >= 80) ranges["80-89"]++;
      else if (s.score >= 70) ranges["70-79"]++;
      else if (s.score >= 60) ranges["60-69"]++;
      else if (s.score >= 50) ranges["50-59"]++;
      else if (s.score >= 40) ranges["40-49"]++;
      else ranges["0-39"]++;
    });
    return Object.entries(ranges).map(([range, count]) => ({ range, count }));
  }, []);

  const performancePie = useMemo(() => {
    const counts: Record<string, number> = {};
    studentsData.forEach((s) => { counts[s.performance] = (counts[s.performance] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, []);

  const strengthsData = useMemo(() => {
    const counts: Record<string, number> = {};
    studentsData.forEach((s) => {
      if (s.strengths && s.strengths !== "None") {
        s.strengths.split(", ").forEach((str) => { counts[str] = (counts[str] || 0) + 1; });
      }
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, count]) => ({ name, count }));
  }, []);

  const weaknessesData = useMemo(() => {
    const counts: Record<string, number> = {};
    studentsData.forEach((s) => {
      if (s.weaknesses && s.weaknesses !== "None") {
        s.weaknesses.split(", ").forEach((w) => { counts[w] = (counts[w] || 0) + 1; });
      }
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, count]) => ({ name, count }));
  }, []);

  const selectedRadar = useMemo(() => {
    if (!selectedStudent) return [];
    const classAvg = Math.round(studentsData.reduce((s, st) => s + st.score, 0) / studentsData.length);
    const top = Math.max(...studentsData.map((s) => s.score));
    const groupStudents = studentsData.filter((s) => s.performance === selectedStudent.performance);
    const groupAvg = Math.round(groupStudents.reduce((s, st) => s + st.score, 0) / groupStudents.length);
    return [
      { metric: "Student Score", value: selectedStudent.score },
      { metric: "Class Average", value: classAvg },
      { metric: "Group Average", value: groupAvg },
      { metric: "Top Score", value: top },
    ];
  }, [selectedStudent]);

  const selectedRank = useMemo(() => {
    if (!selectedStudent) return { rank: 0, percentile: 0 };
    const rank = studentsData.filter((s) => s.score > selectedStudent.score).length + 1;
    const percentile = Math.round(((studentsData.length - rank + 1) / studentsData.length) * 100);
    return { rank, percentile };
  }, [selectedStudent]);

  const barColors = ["#4CAF50", "#66BB6A", "#81C784", "#A5D6A7", "#FFB74D", "#FF8A65", "#E57373"];

  return (
    <DashboardLayout role="teacher">
      <main className="p-8 max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-[#667eea] to-[#764ba2] bg-clip-text text-transparent">
            📊 Student Performance Analytics
          </h1>
          <p className="text-muted-foreground text-lg">
            Comprehensive analysis of student performance, strengths, and areas for improvement
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-5 mb-10">
          {[
            { value: stats.total, label: "Total Students" },
            { value: stats.avg, label: "Average Score" },
            { value: stats.outstanding, label: "Outstanding Students" },
            { value: `${stats.passRate}%`, label: "Pass Rate (≥60)" },
          ].map((s, i) => (
            <div key={i} className="bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white p-6 rounded-2xl text-center shadow-lg hover:-translate-y-1 transition-transform">
              <div className="text-3xl font-bold mb-2">{s.value}</div>
              <div className="text-sm opacity-90">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          {/* Score Distribution */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-card-foreground text-center mb-4">📈 Score Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={scoreDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" fontSize={12} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" name="Students" radius={[4, 4, 0, 0]}>
                  {scoreDistribution.map((_, i) => (
                    <Cell key={i} fill={barColors[i % barColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Performance Levels */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-card-foreground text-center mb-4">🎯 Performance Levels</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={performancePie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={50} paddingAngle={3} label>
                  {performancePie.map((entry) => (
                    <Cell key={entry.name} fill={PERF_COLORS[entry.name] || "#ccc"} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Top Strengths */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-card-foreground text-center mb-4">💪 Top Strengths</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={strengthsData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" dataKey="name" fontSize={11} width={150} />
                <Tooltip />
                <Bar dataKey="count" name="Students" fill="#4CAF50" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Common Weaknesses */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-card-foreground text-center mb-4">⚠️ Common Weaknesses</h3>
            {weaknessesData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weaknessesData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis type="category" dataKey="name" fontSize={11} width={150} />
                  <Tooltip />
                  <Bar dataKey="count" name="Students needing help" fill="#f44336" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-green-500 text-lg mt-12">🎉 Most students have no identified weaknesses!</p>
            )}
          </div>
        </div>

        {/* Student Selector */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm mb-10">
          <h3 className="text-lg font-semibold text-card-foreground mb-5">👥 Select a Student for Detailed Analysis</h3>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4">
            {studentsData.map((student) => (
              <button
                key={student.roll}
                onClick={() => setSelectedStudent(student)}
                className={`p-4 rounded-xl text-white text-center transition-all cursor-pointer border-none hover:scale-105 hover:shadow-lg ${
                  selectedStudent?.roll === student.roll
                    ? "bg-gradient-to-br from-[#667eea] to-[#764ba2] scale-105"
                    : "bg-gradient-to-br from-pink-400 to-rose-500"
                }`}
              >
                <div className="font-semibold text-sm">{student.name}</div>
                <div className="text-xs opacity-90">Score: {student.score}</div>
                <div className="text-xs opacity-80">{student.performance}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Individual Analysis */}
        {selectedStudent && (
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm mb-10 animate-fade-in">
            <h3 className="text-xl font-semibold text-card-foreground mb-6">🔍 Individual Student Analysis</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Student Info */}
              <div className="bg-muted/50 p-5 rounded-xl border-l-4 border-[#667eea]">
                <h4 className="font-semibold text-card-foreground mb-3">📋 Student Information</h4>
                <p><strong>Name:</strong> {selectedStudent.name}</p>
                <p><strong>Roll Number:</strong> {selectedStudent.roll}</p>
                <p><strong>Score:</strong> {selectedStudent.score}/100</p>
                <span className={`inline-block mt-2 py-1.5 px-4 rounded-full text-white text-sm font-bold`} style={{ backgroundColor: PERF_COLORS[selectedStudent.performance] || "#666" }}>
                  {selectedStudent.performance}
                </span>
              </div>

              {/* Strengths */}
              <div className="bg-muted/50 p-5 rounded-xl border-l-4 border-green-500">
                <h4 className="font-semibold text-card-foreground mb-3">💪 Strengths</h4>
                <ul className="space-y-2">
                  {selectedStudent.strengths !== "None"
                    ? selectedStudent.strengths.split(", ").map((s, i) => (
                        <li key={i} className="bg-card p-2 rounded border-l-3 border-green-500 text-sm">{s}</li>
                      ))
                    : <li className="text-muted-foreground text-sm">No specific strengths identified</li>}
                </ul>
              </div>

              {/* Weaknesses */}
              <div className="bg-muted/50 p-5 rounded-xl border-l-4 border-red-500">
                <h4 className="font-semibold text-card-foreground mb-3">⚠️ Areas for Improvement</h4>
                <ul className="space-y-2">
                  {selectedStudent.weaknesses !== "None"
                    ? selectedStudent.weaknesses.split(", ").map((w, i) => (
                        <li key={i} className="bg-card p-2 rounded border-l-3 border-red-500 text-sm">{w}</li>
                      ))
                    : <li className="text-muted-foreground text-sm">No weaknesses identified</li>}
                </ul>
              </div>

              {/* Metrics */}
              <div className="bg-muted/50 p-5 rounded-xl border-l-4 border-[#667eea]">
                <h4 className="font-semibold text-card-foreground mb-3">📊 Performance Metrics</h4>
                <p><strong>Class Rank:</strong> {selectedRank.rank}/{studentsData.length}</p>
                <p><strong>Percentile:</strong> {selectedRank.percentile}th</p>
                <p><strong>Above/Below Average:</strong> {selectedStudent.score >= stats.avg ? "+" : ""}{selectedStudent.score - stats.avg} points</p>
                <p><strong>Grade:</strong> {getGrade(selectedStudent.score)}</p>
              </div>
            </div>

            {/* Radar Chart */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-card-foreground text-center mb-4">📈 Performance Comparison</h3>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={selectedRadar}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="metric" fontSize={12} />
                  <PolarRadiusAxis domain={[0, 100]} tickCount={6} />
                  <Radar dataKey="value" stroke="#667eea" fill="#667eea" fillOpacity={0.2} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </main>
    </DashboardLayout>
  );
};

export default TeacherAnalytics;
