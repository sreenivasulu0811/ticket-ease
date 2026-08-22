import { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import { AuthUser } from '../../types';
import AdminLayout from '../../components/admin/AdminLayout';
import toast from 'react-hot-toast';
import { Users, ShieldCheck, User } from 'lucide-react';

export default function UsersAdmin() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    adminApi
      .getAllUsers()
      .then((res) => {
        if (res.data.success) setUsers(res.data.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <AdminLayout
      title="User Accounts &amp; Roles"
      subtitle="Directory of customer, administrator, and venue operator accounts."
    >
      {isLoading ? (
        <div className="bg-slate-900 rounded-3xl h-64 animate-pulse border border-slate-800"></div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase font-semibold bg-slate-950/40">
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4">Phone</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Total Bookings</th>
                  <th className="py-3.5 px-4">Registered Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-brand-400">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <span>{u.name}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">{u.email}</td>
                    <td className="py-3 px-4 text-slate-400 font-mono">{u.phone || '—'}</td>
                    <td className="py-3 px-4">
                      {u.role === 'ADMIN' ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1 w-fit">
                          <ShieldCheck className="w-3 h-3" />
                          ADMIN
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-slate-800 text-slate-300 w-fit">
                          CUSTOMER
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-white">
                      {u._count?.bookings || 0}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
