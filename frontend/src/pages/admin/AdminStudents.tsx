import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import api from "../../api/axios";

interface Student {
  _id: string;
  fullName: string;
  gender: string;
  email: string;
  phone: string;
  place: string;
  board: string;
  course: string;
  currentClass?: string;
  neetExamYear?: number;
  yneetSubscribed?: boolean;
  createdAt: string;
}

const COLS = 11;

const AdminStudents = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/content/students")
      .then((res) => setStudents(res.data.students || []))
      .finally(() => setLoading(false));
  }, []);

  const exportCsv = async () => {
    const res = await api.get("/content/students/export", { responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "students.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Registrations</h1>
        <button
          onClick={exportCsv}
          className="flex items-center gap-2 text-sm font-semibold bg-ink text-paper px-4 py-2 rounded-full"
        >
          <Download size={16} /> Export CSV
        </button>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-ink/10">
        <table className="w-full text-sm whitespace-nowrap">
          <thead className="bg-ink/5 text-left">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Gender</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Place</th>
              <th className="px-4 py-3">Board</th>
              <th className="px-4 py-3">Course</th>
              <th className="px-4 py-3">NEET Current Class</th>
              <th className="px-4 py-3">NEET Exam Year</th>
              <th className="px-4 py-3">YNeet</th>
              <th className="px-4 py-3">Joined</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={COLS} className="px-4 py-6 text-center text-ink/50">Loading…</td></tr>
            )}
            {!loading && students.length === 0 && (
              <tr><td colSpan={COLS} className="px-4 py-6 text-center text-ink/50">No registrations yet.</td></tr>
            )}
            {students.map((s) => (
              <tr key={s._id} className="border-t border-ink/10">
                <td className="px-4 py-3 font-medium">{s.fullName}</td>
                <td className="px-4 py-3">{s.gender || "—"}</td>
                <td className="px-4 py-3">{s.email}</td>
                <td className="px-4 py-3">{s.phone}</td>
                <td className="px-4 py-3">{s.place || "—"}</td>
                <td className="px-4 py-3">{s.board}</td>
                <td className="px-4 py-3">{s.course}</td>
                <td className="px-4 py-3">{s.currentClass || "—"}</td>
                <td className="px-4 py-3">{s.neetExamYear || "—"}</td>
                <td className="px-4 py-3">
                  {s.yneetSubscribed ? (
                    <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-1 rounded-full">Active</span>
                  ) : (
                    <span className="text-xs text-ink/40">—</span>
                  )}
                </td>
                <td className="px-4 py-3">{new Date(s.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminStudents;
