import { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  BookOpen,
  CheckCircle2,
  CircleDollarSign,
  GraduationCap,
  Search,
  ShieldCheck,
  Users,
  Eye,
  EyeOff,
  Ban,
  UserCheck,
  RefreshCw,
  Sliders,
  DollarSign,
  Star,
  FileText,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api, getErrorMessage } from '../api';

const money = (value, currency = 'USD') =>
  new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: String(currency || 'usd').toUpperCase(),
    maximumFractionDigits: 0,
  }).format(value || 0);

export default function AdminDashboard() {
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [payments, setPayments] = useState([]);
  const [logs, setLogs] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [o, u, c, p, l, r] = await Promise.all([
        api.get('/admin/overview'),
        api.get('/admin/users'),
        api.get('/admin/courses'),
        api.get('/admin/payments'),
        api.get('/admin/audit-logs'),
        api.get('/admin/reviews'),
      ]);
      setStats(o.data.stats);
      setUsers(u.data.users || []);
      setCourses(c.data.courses || []);
      setPayments(p.data.payments || []);
      setLogs(l.data.logs || []);
      setReviews(r.data.reviews || []);
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updateUser = async (user, patch) => {
    try {
      await api.patch(`/admin/users/${user._id}`, patch);
      toast.success('User privileges updated.');
      load();
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  const moderateCourse = async (course, published) => {
    try {
      await api.patch(`/admin/courses/${course._id}`, { published });
      toast.success(published ? 'Course published to catalog.' : 'Course taken offline.');
      load();
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  const moderateReview = async (review, status) => {
    try {
      await api.patch(`/admin/reviews/${review._id}`, { status });
      toast.success('Review moderation updated.');
      load();
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  const filteredUsers = users.filter((u) =>
    `${u.name} ${u.email}`.toLowerCase().includes(query.toLowerCase()),
  );

  const tabs = [
    ['overview', 'Overview', Activity],
    ['users', 'Users & Roles', Users],
    ['courses', 'Course Catalog', BookOpen],
    ['payments', 'Transactions', CircleDollarSign],
    ['reviews', 'Reviews & Feedback', Star],
    ['audit', 'Security Audit', ShieldCheck],
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-[10px] tracking-wider uppercase border border-indigo-200 dark:border-indigo-800">
                Super Admin Console
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1 font-['Manrope']">
              EDUNEXA Platform Control
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Manage platform roles, course moderation, payments, and security logs.
            </p>
          </div>

          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 font-semibold text-xs transition cursor-pointer shadow-xs shrink-0"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh Data</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {tabs.map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition cursor-pointer ${
                tab === id
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/90 dark:border-slate-800'
              }`}
            >
              <Icon size={14} />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Tab 1: Overview */}
        {tab === 'overview' && (
          <div className="space-y-6">
            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                [
                  Users,
                  'Total Registered Users',
                  stats?.users ?? users.length,
                  'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
                ],
                [
                  GraduationCap,
                  'Active Educators',
                  stats?.educators ?? 0,
                  'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
                ],
                [
                  BookOpen,
                  'Published Courses',
                  stats?.published ?? courses.filter((c) => c.published).length,
                  'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
                ],
                [
                  CircleDollarSign,
                  'Platform Volume',
                  money(stats?.revenue ?? 0),
                  'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
                ],
              ].map(([Icon, label, val, colorClass]) => (
                <div
                  key={label}
                  className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm flex items-center justify-between"
                >
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      {label}
                    </span>
                    <strong className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
                      {val}
                    </strong>
                  </div>
                  <span
                    className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${colorClass}`}
                  >
                    <Icon size={20} />
                  </span>
                </div>
              ))}
            </div>

            {/* Recent Audit Log */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Recent Platform Audit Trail
                  </h3>
                  <p className="text-xs text-slate-500">
                    Live record of administrative updates, role modifications, and status changes.
                  </p>
                </div>
                <Activity size={18} className="text-slate-400" />
              </div>

              {logs.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No audit records logged yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                        <th className="pb-3">Action</th>
                        <th className="pb-3">Actor</th>
                        <th className="pb-3">Target</th>
                        <th className="pb-3">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {logs.slice(0, 6).map((log) => (
                        <tr key={log._id} className="text-slate-700 dark:text-slate-300">
                          <td className="py-3 font-semibold text-slate-900 dark:text-white">
                            {log.action}
                          </td>
                          <td className="py-3">{log.actor?.name || 'Administrator'}</td>
                          <td className="py-3 text-slate-500">
                            {log.targetType}{' '}
                            {log.targetId ? `· ${String(log.targetId).slice(-6)}` : ''}
                          </td>
                          <td className="py-3 text-slate-400">
                            {new Date(log.createdAt).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Users Management */}
        {tab === 'users' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  User Directory & Permissions
                </h3>
                <p className="text-xs text-slate-500">
                  Manage user roles (student, educator, admin) and suspend or reinstate accounts.
                </p>
              </div>

              {/* Search */}
              <div className="relative w-full sm:w-72">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search user name or email…"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="pb-3">User</th>
                    <th className="pb-3">Role</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Joined</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredUsers.map((u) => (
                    <tr key={u._id} className="text-slate-700 dark:text-slate-300">
                      <td className="py-3">
                        <strong className="text-slate-900 dark:text-white block font-semibold">
                          {u.name}
                        </strong>
                        <small className="text-slate-400">{u.email || 'OAuth / Clerk ID'}</small>
                      </td>
                      <td className="py-3">
                        <select
                          value={u.role}
                          onChange={(e) => updateUser(u, { role: e.target.value })}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200"
                        >
                          <option value="student">Student</option>
                          <option value="educator">Educator</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                            u.active === false
                              ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          }`}
                        >
                          {u.active === false ? 'Suspended' : 'Active'}
                        </span>
                      </td>
                      <td className="py-3 text-slate-400">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 text-right">
                        <button
                          type="button"
                          onClick={() => updateUser(u, { active: u.active === false })}
                          className={`p-1.5 rounded-lg border transition cursor-pointer ${
                            u.active === false
                              ? 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
                          }`}
                          title={u.active === false ? 'Reactivate User' : 'Suspend User'}
                        >
                          {u.active === false ? <UserCheck size={14} /> : <Ban size={14} />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Courses Moderation */}
        {tab === 'courses' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm p-6 space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Course Catalog Moderation
              </h3>
              <p className="text-xs text-slate-500">
                Review courses submitted by educators and control their visibility in the public catalog.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="pb-3">Course Title</th>
                    <th className="pb-3">Educator</th>
                    <th className="pb-3">Price</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Moderation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {courses.map((c) => (
                    <tr key={c._id} className="text-slate-700 dark:text-slate-300">
                      <td className="py-3">
                        <strong className="text-slate-900 dark:text-white font-semibold block">
                          {c.title}
                        </strong>
                        <small className="text-slate-400">
                          {c.category} · {c.level}
                        </small>
                      </td>
                      <td className="py-3">{c.educator?.name || '—'}</td>
                      <td className="py-3 font-semibold">
                        {c.price === 0 ? 'Free' : money(c.price)}
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                            c.published
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {c.published ? 'Live' : 'Draft'}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          type="button"
                          onClick={() => moderateCourse(c, !c.published)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 font-semibold text-xs transition cursor-pointer"
                        >
                          {c.published ? (
                            <>
                              <EyeOff size={13} className="text-amber-600" />
                              <span>Take Offline</span>
                            </>
                          ) : (
                            <>
                              <Eye size={13} className="text-emerald-600" />
                              <span>Publish</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Payments & Transactions */}
        {tab === 'payments' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm p-6 space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Transaction History
              </h3>
              <p className="text-xs text-slate-500">
                Stripe checkout receipts, student enrollments, and payment statuses.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="pb-3">Customer</th>
                    <th className="pb-3">Course</th>
                    <th className="pb-3">Amount</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {payments.map((p) => (
                    <tr key={p._id} className="text-slate-700 dark:text-slate-300">
                      <td className="py-3">
                        <strong className="text-slate-900 dark:text-white block font-semibold">
                          {p.user?.name || p.receiptEmail || 'Learner'}
                        </strong>
                        <small className="text-slate-400">{p.user?.email}</small>
                      </td>
                      <td className="py-3">{p.course?.title || 'Course'}</td>
                      <td className="py-3 font-semibold text-slate-900 dark:text-white">
                        {money(p.amount, p.currency)}
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                            p.status === 'succeeded'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 text-slate-400">
                        {new Date(p.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 5: Reviews Moderation */}
        {tab === 'reviews' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm p-6 space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Course Reviews & Feedback Moderation
              </h3>
              <p className="text-xs text-slate-500">
                Ensure community reviews meet platform guidelines.
              </p>
            </div>

            {reviews.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No reviews currently awaiting moderation.</p>
            ) : (
              <div className="space-y-3">
                {reviews.map((r) => (
                  <div
                    key={r._id}
                    className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 flex items-start justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <strong className="text-xs font-bold text-slate-900 dark:text-white">
                          {r.course?.title || 'Course'}
                        </strong>
                        <span className="text-amber-500 font-bold text-xs">
                          ★ {r.rating}/5
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {r.body}
                      </p>
                      <small className="text-[10px] text-slate-400 mt-1 block">
                        By {r.user?.name || 'Learner'} ·{' '}
                        {new Date(r.createdAt).toLocaleDateString()}
                      </small>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        moderateReview(r, r.status === 'hidden' ? 'published' : 'hidden')
                      }
                      className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-xs font-semibold shrink-0 cursor-pointer"
                    >
                      {r.status === 'hidden' ? 'Restore' : 'Hide Review'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 6: Audit Log */}
        {tab === 'audit' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm p-6 space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Detailed Security Audit Log
              </h3>
              <p className="text-xs text-slate-500">
                Complete forensic history of administrative events on the platform.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="pb-3">Action</th>
                    <th className="pb-3">Actor</th>
                    <th className="pb-3">Target</th>
                    <th className="pb-3">Details</th>
                    <th className="pb-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {logs.map((log) => (
                    <tr key={log._id} className="text-slate-700 dark:text-slate-300">
                      <td className="py-3 font-semibold text-slate-900 dark:text-white">
                        {log.action}
                      </td>
                      <td className="py-3">{log.actor?.name || 'System Admin'}</td>
                      <td className="py-3">{log.targetType}</td>
                      <td className="py-3">
                        <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-indigo-600 font-mono text-[10px]">
                          {JSON.stringify(log.details || {})}
                        </code>
                      </td>
                      <td className="py-3 text-slate-400">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
