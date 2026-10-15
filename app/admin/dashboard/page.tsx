'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard, Sun, Moon, Calendar, UtensilsCrossed, ShoppingBag,
  Package, LogOut, Plus, Pencil, Trash2, Camera, Search, RefreshCw,
  ChevronLeft, ChevronRight, Check, X, BarChart2, TrendingUp,
  Clock, ChefHat, AlertCircle, Loader2
} from 'lucide-react';
import { formatCurrency, formatDate, formatTime, getStatusColor, DAYS_OF_WEEK } from '@/lib/utils';
import styles from '../admin.module.css';


// ─── Types ───────────────────────────────────────────────────
type AdminTab = 'dashboard' | 'tiffins' | 'schedule' | 'thalis' | 'products' | 'orders';

interface TiffinPlan { id: number; name: string; type: 'morning' | 'evening'; price: number; description: string; active: boolean; }
interface ScheduleEntry { id: number; tiffin_plan_id: number; day_of_week: string; meal_name: string; meal_description: string; week_start_date: string; }
interface Thali { id: number; name: string; price: number; description: string; image_url: string; available: boolean; category: string; }
interface Product { id: number; barcode: string; name: string; brand: string; category: string; image_url: string; price: number; stock: number; }
interface Order { id: number; customer_name: string; customer_phone: string; items: any[]; total: number; status: string; order_type: string; created_at: string; }
interface Stats { orders: number; revenue: number; products: number; tiffins: number; }

// ─── Toast ───────────────────────────────────────────────────
function useAdminToast() {
  const [toasts, setToasts] = useState<{ id: number; msg: string; type: string }[]>([]);
  const show = useCallback((msg: string, type = 'success') => {
    const id = Date.now();
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);
  return { toasts, show };
}

// ─── ADMIN DASHBOARD ─────────────────────────────────────────
export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const router = useRouter();
  const { toasts, show: showToast } = useAdminToast();

  const handleLogout = async () => {
    await fetch('/api/auth', { method: 'DELETE' });
    router.push('/admin');
  };

  type NavItem = { id: AdminTab; Icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>; label: string };
  const navItems: NavItem[] = [
    { id: 'dashboard', Icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'tiffins',   Icon: Sun,             label: 'Tiffins' },
    { id: 'schedule',  Icon: Calendar,        label: 'Schedule' },
    { id: 'thalis',    Icon: ChefHat,         label: 'Thalis' },
    { id: 'products',  Icon: ShoppingBag,     label: 'Products' },
    { id: 'orders',    Icon: Package,         label: 'Orders' },
  ];

  return (
    <div className={styles.adminApp}>
      {/* Toast */}
      <div className={styles.toastContainer}>
        {toasts.map((t) => (
          <div key={t.id} className={`${styles.toast} ${styles[`toast_${t.type}`]}`}>
            {t.type === 'success' ? <Check size={14} strokeWidth={3} /> : t.type === 'error' ? <X size={14} strokeWidth={3} /> : <AlertCircle size={14} />}
            {t.msg}
          </div>
        ))}
      </div>

      {/* Admin Header */}
      <header className={styles.adminHeader}>
        <div className={styles.adminHeaderLeft}>
          <ChefHat size={26} strokeWidth={1.5} className={styles.adminLogoIcon} />
          <div>
            <span className={styles.adminTitle}>TRC Admin</span>
            <span className={styles.adminBadge}>Portal</span>
          </div>
        </div>
        <button className={styles.logoutBtn} onClick={handleLogout}>
          <LogOut size={14} strokeWidth={2} /> Logout
        </button>
      </header>

      {/* Main */}
      <main className={styles.adminMain}>
        {activeTab === 'dashboard' && <DashboardTab showToast={showToast} onTabChange={setActiveTab} />}
        {activeTab === 'tiffins' && <TiffinsTab showToast={showToast} />}
        {activeTab === 'schedule' && <ScheduleTab showToast={showToast} />}
        {activeTab === 'thalis' && <ThalisTab showToast={showToast} />}
        {activeTab === 'products' && <ProductsTab showToast={showToast} />}
        {activeTab === 'orders' && <OrdersTab showToast={showToast} />}
      </main>

      {/* Bottom Nav */}
      <nav className={styles.adminBottomNav}>
        {navItems.map(({ id, Icon, label }) => (
          <button
            key={id}
            className={`${styles.adminNavBtn} ${activeTab === id ? styles.adminNavBtnActive : ''}`}
            onClick={() => setActiveTab(id)}
          >
            <Icon size={20} strokeWidth={activeTab === id ? 2.5 : 1.8} className={styles.adminNavIcon} />
            <span className={styles.adminNavLabel}>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

// ─── DASHBOARD TAB ───────────────────────────────────────────
function DashboardTab({ showToast, onTabChange }: { showToast: (m: string, t?: string) => void; onTabChange: (t: AdminTab) => void }) {
  const [stats, setStats] = useState<Stats>({ orders: 0, revenue: 0, products: 0, tiffins: 0 });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/orders').then((r) => r.json()),
      fetch('/api/products').then((r) => r.json()),
      fetch('/api/tiffins').then((r) => r.json()),
    ]).then(([orders, products, tiffins]) => {
      const ords = Array.isArray(orders) ? orders : [];
      const prods = Array.isArray(products) ? products : [];
      const tifs = Array.isArray(tiffins) ? tiffins : [];
      setStats({
        orders: ords.length,
        revenue: ords.reduce((s: number, o: Order) => s + Number(o.total), 0),
        products: prods.length,
        tiffins: tifs.filter((t: TiffinPlan) => t.active).length,
      });
      setRecentOrders(ords.slice(0, 5));
    }).catch(() => showToast('Failed to load stats', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const statCards = [
    { Icon: Package,      label: 'Total Orders',   value: stats.orders,                  color: '#3b82f6', tab: 'orders' as AdminTab },
    { Icon: TrendingUp,   label: 'Revenue',         value: formatCurrency(stats.revenue), color: '#00c853', tab: 'orders' as AdminTab },
    { Icon: ShoppingBag,  label: 'Products',        value: stats.products,                color: '#f5a623', tab: 'products' as AdminTab },
    { Icon: Sun,          label: 'Active Tiffins',  value: stats.tiffins,                 color: '#e94560', tab: 'tiffins' as AdminTab },
  ];

  return (
    <div className={styles.tabContent}>
      <div className={styles.dashboardHeader}>
        <h2 className={styles.dashTitle}>Good {new Date().getHours() < 12 ? 'Morning' : 'Afternoon'}, Admin!</h2>
        <p className={styles.dashSubtitle}>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      </div>

      {/* DB Init Button */}
      <div style={{ padding: '0 20px 12px' }}>
        <button
          className={`btn btn-secondary btn-sm`}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          onClick={async () => {
            const res = await fetch('/api/init');
            const data = await res.json();
            showToast(data.success ? 'Database initialized' : 'DB init failed', data.success ? 'success' : 'error');
          }}
        >
          <RefreshCw size={14} strokeWidth={2} /> Initialize Database
        </button>
      </div>

      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        {statCards.map(({ Icon, label, value, color, tab }) => (
          <button key={label} className={styles.statCard} onClick={() => onTabChange(tab)} style={{ '--stat-color': color } as any}>
            <div className={styles.statIcon} style={{ background: `${color}20` }}>
              <Icon size={20} strokeWidth={1.8} color={color} />
            </div>
            <div className={styles.statValue}>{value}</div>
            <div className={styles.statLabel}>{label}</div>
          </button>
        ))}
      </div>

      {/* Recent Orders */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Recent Orders</h3>
          <button className={styles.seeAll} onClick={() => onTabChange('orders')}>View all</button>
        </div>
        {loading ? (
          <div className={styles.loadingCenter}><div className="spinner" /></div>
        ) : recentOrders.length === 0 ? (
          <div className="empty-state">
            <Package size={36} strokeWidth={1} style={{ color: 'var(--text-disabled)', margin: '0 auto 8px' }} />
            <div className="empty-state-title">No orders yet</div>
          </div>
        ) : (
          recentOrders.map((order) => (
            <div key={order.id} className={styles.recentOrderRow}>
              <div>
                <p className={styles.recentOrderName}>{order.customer_name}</p>
                <p className={styles.recentOrderTime}>{formatTime(order.created_at)}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="badge" style={{ background: `${getStatusColor(order.status)}20`, color: getStatusColor(order.status) }}>
                  {order.status}
                </span>
                <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{formatCurrency(order.total)}</span>
              </div>
            </div>
          ))
        )}
      </div>
      <div style={{ height: 100 }} />
    </div>
  );
}



// ─── TIFFINS TAB ─────────────────────────────────────────────
function TiffinsTab({ showToast }: { showToast: (m: string, t?: string) => void }) {
  const [tiffins, setTiffins] = useState<TiffinPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<TiffinPlan | null>(null);
  const [form, setForm] = useState({ name: '', type: 'morning', price: '', description: '', active: true });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    fetch('/api/tiffins').then((r) => r.json()).then((d) => setTiffins(Array.isArray(d) ? d : [])).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openAdd = () => { setForm({ name: '', type: 'morning', price: '', description: '', active: true }); setEditItem(null); setShowForm(true); };
  const openEdit = (t: TiffinPlan) => { setForm({ name: t.name, type: t.type, price: String(t.price), description: t.description || '', active: t.active }); setEditItem(t); setShowForm(true); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price) return showToast('Fill all required fields', 'error');
    setSaving(true);
    try {
      const url = editItem ? `/api/tiffins/${editItem.id}` : '/api/tiffins';
      const method = editItem ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, price: parseFloat(form.price) }) });
      if (!res.ok) throw new Error();
      showToast(editItem ? 'Tiffin plan updated!' : 'Tiffin plan created!');
      setShowForm(false); load();
    } catch { showToast('Failed to save', 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this tiffin plan?')) return;
    try {
      await fetch(`/api/tiffins/${id}`, { method: 'DELETE' });
      showToast('Deleted successfully');
      load();
    } catch { showToast('Failed to delete', 'error'); }
  };

  return (
    <div className={styles.tabContent}>
      <div className={styles.tabHeader}>
        <div>
          <h2 className={styles.tabTitle}>Tiffin Plans</h2>
          <p className={styles.tabSubtitle}>Manage morning & evening tiffin subscriptions</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={openAdd} style={{ display:'flex', alignItems:'center', gap:5 }}><Plus size={14} strokeWidth={2.5} /> Add</button>
      </div>

      {loading ? (
        <div className={styles.loadingCenter}><div className="spinner" /></div>
      ) : tiffins.length === 0 ? (
        <div className="empty-state"><Sun size={40} strokeWidth={1} style={{ color: 'var(--text-disabled)' }} /><div className="empty-state-title">No tiffin plans yet</div><button className="btn btn-primary" onClick={openAdd} style={{ marginTop: 12 }}>Add First Plan</button></div>
      ) : (
        <div className={styles.cardList}>
          {tiffins.map((t) => (
            <div key={t.id} className={styles.adminCard}>
              <div className={styles.adminCardHeader}>
                <div className={styles.tiffinBadge} style={{ background: t.type === 'morning' ? '#f5a62320' : '#7c3aed20', color: t.type === 'morning' ? '#f5a623' : '#a78bfa', display:'flex', alignItems:'center', gap:4 }}>
                  {t.type === 'morning' ? <><Sun size={12} strokeWidth={2.5} /> Morning</> : <><Moon size={12} strokeWidth={2.5} /> Evening</>}
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span className={`badge ${t.active ? 'badge-success' : 'badge-error'}`}>{t.active ? 'Active' : 'Inactive'}</span>
                  <span className={styles.adminCardPrice}>{formatCurrency(t.price)}</span>
                </div>
              </div>
              <h3 className={styles.adminCardTitle}>{t.name}</h3>
              <p className={styles.adminCardDesc}>{t.description}</p>
              <div className={styles.adminCardActions}>
                <button className="btn btn-secondary btn-sm" onClick={() => openEdit(t)} style={{ display:'flex', alignItems:'center', gap:5 }}><Pencil size={13} strokeWidth={2} /> Edit</button>
                <button className={`btn btn-sm ${styles.deleteBtn}`} onClick={() => handleDelete(t.id)} style={{ display:'flex', alignItems:'center', gap:5 }}><Trash2 size={13} strokeWidth={2} /> Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <>
          <div className="overlay" onClick={() => setShowForm(false)} />
          <div className="modal" style={{ padding: '0 0 32px' }}>
            <div className="modal-handle" />
            <div style={{ padding: '0 20px' }}>
              <h3 style={{ fontSize: 20, marginBottom: 20 }}>{editItem ? 'Edit Tiffin Plan' : 'Add Tiffin Plan'}</h3>
              <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Plan Name *</label>
                  <input className="form-input" placeholder="e.g. Gujarati Tiffin" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Type *</label>
                  <select className="form-select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                    <option value="morning">Morning</option>
                    <option value="evening">Evening</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Price per Day (₹) *</label>
                  <input className="form-input" type="number" placeholder="80" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className={`form-input form-textarea`} placeholder="What's included..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input type="checkbox" id="active" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} style={{ width: 18, height: 18 }} />
                  <label htmlFor="active" style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Active (visible to customers)</label>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="button" className="btn btn-secondary btn-full" onClick={() => setShowForm(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary btn-full" disabled={saving}>
                    {saving ? <span className="spinner" style={{ width: 16, height: 16 }} /> : editItem ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
      <div style={{ height: 100 }} />
    </div>
  );
}

// ─── SCHEDULE TAB ─────────────────────────────────────────────
function ScheduleTab({ showToast }: { showToast: (m: string, t?: string) => void }) {
  const [tiffins, setTiffins] = useState<TiffinPlan[]>([]);
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date(); const day = d.getDay(); const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff)).toISOString().split('T')[0];
  });
  const [editEntry, setEditEntry] = useState<{ day: string; meal_name: string; meal_description: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/tiffins').then((r) => r.json()).then((d) => {
      const t = Array.isArray(d) ? d.filter((x: TiffinPlan) => x.active) : [];
      setTiffins(t);
      if (t.length > 0) setSelectedPlan(t[0].id);
    });
  }, []);

  useEffect(() => {
    if (selectedPlan) {
      fetch(`/api/schedule?tiffin_plan_id=${selectedPlan}&week_start=${weekStart}`)
        .then((r) => r.json()).then((d) => setSchedule(Array.isArray(d) ? d : []));
    }
  }, [selectedPlan, weekStart]);

  const getEntry = (day: string) => schedule.find((s) => s.day_of_week === day);

  const handleSaveDay = async (day: string, meal_name: string, meal_description: string) => {
    if (!selectedPlan || !meal_name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tiffin_plan_id: selectedPlan, day_of_week: day, meal_name, meal_description, week_start_date: weekStart }),
      });
      if (!res.ok) throw new Error();
      showToast(`${day} meal saved!`);
      const updated = await fetch(`/api/schedule?tiffin_plan_id=${selectedPlan}&week_start=${weekStart}`).then((r) => r.json());
      setSchedule(Array.isArray(updated) ? updated : []);
      setEditEntry(null);
    } catch { showToast('Failed to save', 'error'); }
    finally { setSaving(false); }
  };

  const [activeDay, setActiveDay] = useState<string | null>(null);
  const [dayForm, setDayForm] = useState({ meal_name: '', meal_description: '' });

  const openDayEdit = (day: string) => {
    const entry = getEntry(day);
    setDayForm({ meal_name: entry?.meal_name || '', meal_description: entry?.meal_description || '' });
    setActiveDay(day);
  };

  return (
    <div className={styles.tabContent}>
      <div className={styles.tabHeader}>
        <div>
          <h2 className={styles.tabTitle}>Weekly Schedule</h2>
          <p className={styles.tabSubtitle}>Set daily meals for each tiffin plan</p>
        </div>
      </div>

      {/* Plan Selector */}
      {tiffins.length > 0 && (
        <div className={styles.filterScroll}>
          {tiffins.map((t) => (
            <button
              key={t.id}
              className={`${styles.filterChip} ${selectedPlan === t.id ? styles.filterChipActive : ''}`}
              onClick={() => setSelectedPlan(t.id)}
            >
              {t.type === 'morning' ? '🌅' : '🌙'} {t.name}
            </button>
          ))}
        </div>
      )}

      {/* Week Navigation */}
      <div className={styles.weekNav}>
        <button className={`btn btn-secondary btn-sm`} onClick={() => {
          const d = new Date(weekStart); d.setDate(d.getDate() - 7);
          setWeekStart(d.toISOString().split('T')[0]);
        }}>← Prev</button>
        <div className={styles.weekLabel}>
          <span>Week of {new Date(weekStart).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
        </div>
        <button className={`btn btn-secondary btn-sm`} onClick={() => {
          const d = new Date(weekStart); d.setDate(d.getDate() + 7);
          setWeekStart(d.toISOString().split('T')[0]);
        }}>Next →</button>
      </div>

      {/* Schedule Grid */}
      {!selectedPlan ? (
        <div className="empty-state"><div className="empty-state-icon">📅</div><div className="empty-state-title">No active tiffin plans</div></div>
      ) : (
        <div className={styles.scheduleGrid}>
          {DAYS_OF_WEEK.map((day) => {
            const entry = getEntry(day);
            return (
              <div key={day} className={`${styles.scheduleDayCard} ${entry ? styles.scheduleDayCardFilled : ''}`}>
                <div className={styles.scheduleDayHeader}>
                  <span className={styles.scheduleDayName}>{day}</span>
                  <button className={styles.editDayBtn} onClick={() => openDayEdit(day)}>
                    {entry ? '✏️' : '+'}
                  </button>
                </div>
                {entry ? (
                  <div>
                    <p className={styles.scheduleMealName}>{entry.meal_name}</p>
                    {entry.meal_description && <p className={styles.scheduleMealDesc}>{entry.meal_description}</p>}
                  </div>
                ) : (
                  <p className={styles.scheduleEmpty}>Tap + to add meal</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Day Edit Modal */}
      {activeDay && (
        <>
          <div className="overlay" onClick={() => setActiveDay(null)} />
          <div className="modal" style={{ padding: '0 0 32px' }}>
            <div className="modal-handle" />
            <div style={{ padding: '0 20px' }}>
              <h3 style={{ fontSize: 20, marginBottom: 8 }}>{activeDay} Meal</h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>Week of {new Date(weekStart).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Meal Name *</label>
                  <input className="form-input" placeholder="e.g. Dal Chawal + Sabzi + Roti" value={dayForm.meal_name} onChange={(e) => setDayForm({ ...dayForm, meal_name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Description (optional)</label>
                  <textarea className={`form-input form-textarea`} placeholder="Additional details..." value={dayForm.meal_description} onChange={(e) => setDayForm({ ...dayForm, meal_description: e.target.value })} />
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn btn-secondary btn-full" onClick={() => setActiveDay(null)}>Cancel</button>
                  <button className="btn btn-primary btn-full" disabled={saving} onClick={() => handleSaveDay(activeDay, dayForm.meal_name, dayForm.meal_description)}>
                    {saving ? <span className="spinner" style={{ width: 16, height: 16 }} /> : 'Save Meal'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      <div style={{ height: 100 }} />
    </div>
  );
}

// ─── THALIS TAB ───────────────────────────────────────────────
function ThalisTab({ showToast }: { showToast: (m: string, t?: string) => void }) {
  const [thalis, setThalis] = useState<Thali[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<Thali | null>(null);
  const [form, setForm] = useState({ name: '', price: '', description: '', image_url: '', available: true, category: 'regular' });
  const [saving, setSaving] = useState(false);

  const load = () => { setLoading(true); fetch('/api/thalis').then((r) => r.json()).then((d) => setThalis(Array.isArray(d) ? d : [])).finally(() => setLoading(false)); };
  useEffect(load, []);

  const openAdd = () => { setForm({ name: '', price: '', description: '', image_url: '', available: true, category: 'regular' }); setEditItem(null); setShowForm(true); };
  const openEdit = (t: Thali) => { setForm({ name: t.name, price: String(t.price), description: t.description || '', image_url: t.image_url || '', available: t.available, category: t.category || 'regular' }); setEditItem(t); setShowForm(true); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editItem ? `/api/thalis/${editItem.id}` : '/api/thalis';
      const method = editItem ? 'PUT' : 'POST';
      await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, price: parseFloat(form.price) }) });
      showToast(editItem ? 'Thali updated!' : 'Thali created!');
      setShowForm(false); load();
    } catch { showToast('Failed to save', 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this thali?')) return;
    await fetch(`/api/thalis/${id}`, { method: 'DELETE' });
    showToast('Deleted'); load();
  };

  return (
    <div className={styles.tabContent}>
      <div className={styles.tabHeader}>
        <div><h2 className={styles.tabTitle}>Thalis</h2><p className={styles.tabSubtitle}>Manage daily thali offerings</p></div>
        <button className="btn btn-primary btn-sm" onClick={openAdd} style={{ display:'flex', alignItems:'center', gap:5 }}><Plus size={14} strokeWidth={2.5} /> Add</button>
      </div>

      {loading ? <div className={styles.loadingCenter}><div className="spinner" /></div> : thalis.length === 0 ? (
        <div className="empty-state"><ChefHat size={40} strokeWidth={1} style={{ color: 'var(--text-disabled)' }} /><div className="empty-state-title">No thalis yet</div><button className="btn btn-primary" onClick={openAdd} style={{ marginTop: 12 }}>Add First Thali</button></div>
      ) : (
        <div className={styles.cardList}>
          {thalis.map((t) => (
            <div key={t.id} className={styles.adminCard}>
              {t.image_url && <div className={styles.adminCardImg}><img src={t.image_url} alt={t.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>}
              <div className={styles.adminCardHeader}>
                <span className={`badge ${t.available ? 'badge-success' : 'badge-error'}`}>{t.available ? 'Available' : 'Unavailable'}</span>
                <span className={styles.adminCardPrice}>{formatCurrency(t.price)}</span>
              </div>
              <h3 className={styles.adminCardTitle}>{t.name}</h3>
              <p className={styles.adminCardDesc}>{t.description}</p>
              <div className={styles.adminCardActions}>
                <button className="btn btn-secondary btn-sm" onClick={() => openEdit(t)} style={{ display:'flex', alignItems:'center', gap:5 }}><Pencil size={13} strokeWidth={2} /> Edit</button>
                <button className={`btn btn-sm ${styles.deleteBtn}`} onClick={() => handleDelete(t.id)} style={{ display:'flex', alignItems:'center', gap:5 }}><Trash2 size={13} strokeWidth={2} /> Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <>
          <div className="overlay" onClick={() => setShowForm(false)} />
          <div className="modal" style={{ padding: '0 0 32px' }}>
            <div className="modal-handle" />
            <div style={{ padding: '0 20px' }}>
              <h3 style={{ fontSize: 20, marginBottom: 20 }}>{editItem ? 'Edit Thali' : 'Add Thali'}</h3>
              <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group"><label className="form-label">Thali Name *</label><input className="form-input" placeholder="e.g. Special Thali" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
                <div className="form-group"><label className="form-label">Price (₹) *</label><input className="form-input" type="number" placeholder="120" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required /></div>
                <div className="form-group"><label className="form-label">Category</label>
                  <select className="form-select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    <option value="regular">Regular</option><option value="special">Special</option><option value="veg">Veg</option><option value="non-veg">Non-Veg</option>
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Description</label><textarea className={`form-input form-textarea`} placeholder="What's included in this thali..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
                <div className="form-group"><label className="form-label">Image URL</label><input className="form-input" placeholder="https://..." value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} /></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input type="checkbox" id="avail" checked={form.available} onChange={(e) => setForm({ ...form, available: e.target.checked })} style={{ width: 18, height: 18 }} />
                  <label htmlFor="avail" style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Available today</label>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="button" className="btn btn-secondary btn-full" onClick={() => setShowForm(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary btn-full" disabled={saving}>{saving ? <span className="spinner" style={{ width: 16, height: 16 }} /> : editItem ? 'Update' : 'Create'}</button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
      <div style={{ height: 100 }} />
    </div>
  );
}

// ─── PRODUCTS TAB ─────────────────────────────────────────────
function ProductsTab({ showToast }: { showToast: (m: string, t?: string) => void }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [editItem, setEditItem] = useState<Product | null>(null);
  const [form, setForm] = useState({ barcode: '', name: '', brand: '', category: '', image_url: '', price: '', stock: '0', nutrition_data: null as any });
  const [saving, setSaving] = useState(false);
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef<any>(null);
  const [scanMsg, setScanMsg] = useState('');

  const load = () => { setLoading(true); fetch('/api/products').then((r) => r.json()).then((d) => setProducts(Array.isArray(d) ? d : [])).finally(() => setLoading(false)); };
  useEffect(load, []);

  const openAdd = () => { setForm({ barcode: '', name: '', brand: '', category: '', image_url: '', price: '', stock: '0', nutrition_data: null }); setEditItem(null); setShowForm(true); };
  const openEdit = (p: Product) => { setForm({ barcode: p.barcode || '', name: p.name, brand: p.brand || '', category: p.category || '', image_url: p.image_url || '', price: String(p.price), stock: String(p.stock), nutrition_data: null }); setEditItem(p); setShowForm(true); };

  // Barcode Scan
  const startScanner = useCallback(async () => {
    setShowScanner(true);
    setScanMsg('Initializing camera...');
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 150 } },
        async (decodedText: string) => {
          setScanMsg(`Barcode: ${decodedText} — Fetching product...`);
          await scanner.stop();
          scannerRef.current = null;
          // Lookup Open Food Facts
          try {
            const res = await fetch(`/api/openfoodfacts?barcode=${decodedText}`);
            const data = await res.json();
            if (data.found) {
              setForm((f) => ({
                ...f,
                barcode: decodedText,
                name: data.name || f.name,
                brand: data.brand || f.brand,
                category: data.category || f.category,
                image_url: data.image_url || f.image_url,
                nutrition_data: data.nutrition,
              }));
              showToast(`Found: ${data.name || 'Product'} ✅`);
            } else {
              setForm((f) => ({ ...f, barcode: decodedText }));
              showToast('Product not in database — fill manually', 'info');
            }
          } catch {
            setForm((f) => ({ ...f, barcode: decodedText }));
            showToast('Lookup failed — fill manually', 'info');
          }
          setShowScanner(false);
          setScanMsg('');
          setShowForm(true);
        },
        () => {}
      );
      setScanMsg('Point camera at barcode...');
    } catch (err) {
      setScanMsg('Camera not available');
      showToast('Camera access failed. Enter barcode manually.', 'error');
    }
  }, [showToast]);

  const stopScanner = useCallback(async () => {
    try {
      if (scannerRef.current) { await scannerRef.current.stop(); scannerRef.current = null; }
    } catch {}
    setShowScanner(false); setScanMsg('');
  }, []);

  const handleManualBarcode = async () => {
    if (!form.barcode.trim()) return;
    try {
      const res = await fetch(`/api/openfoodfacts?barcode=${form.barcode}`);
      const data = await res.json();
      if (data.found) {
        setForm((f) => ({ ...f, name: data.name || f.name, brand: data.brand || f.brand, category: data.category || f.category, image_url: data.image_url || f.image_url, nutrition_data: data.nutrition }));
        showToast(`Found: ${data.name} ✅`);
      } else {
        showToast('Product not in Open Food Facts database', 'info');
      }
    } catch { showToast('Lookup failed', 'error'); }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price) return showToast('Name and price required', 'error');
    setSaving(true);
    try {
      const url = editItem ? `/api/products/${editItem.id}` : '/api/products';
      const method = editItem ? 'PUT' : 'POST';
      await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, price: parseFloat(form.price), stock: parseInt(form.stock) }) });
      showToast(editItem ? 'Product updated!' : 'Product added!');
      setShowForm(false); load();
    } catch { showToast('Failed to save', 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this product?')) return;
    await fetch(`/api/products/${id}`, { method: 'DELETE' });
    showToast('Product deleted'); load();
  };

  return (
    <div className={styles.tabContent}>
      <div className={styles.tabHeader}>
        <div><h2 className={styles.tabTitle}>Products</h2><p className={styles.tabSubtitle}>Snacks, beverages & general goods</p></div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className={`btn btn-secondary btn-sm`} onClick={() => { setShowScanner(true); startScanner(); }} style={{ display:'flex', alignItems:'center', gap:5 }}><Camera size={14} strokeWidth={2} /> Scan</button>
          <button className="btn btn-primary btn-sm" onClick={openAdd} style={{ display:'flex', alignItems:'center', gap:5 }}><Plus size={14} strokeWidth={2.5} /> Add</button>
        </div>
      </div>

      {/* Scanner Modal */}
      {showScanner && (
        <>
          <div className="overlay" onClick={stopScanner} />
          <div className="modal" style={{ padding: '0 0 32px' }}>
            <div className="modal-handle" />
            <div style={{ padding: '0 20px' }}>
              <h3 style={{ fontSize: 20, marginBottom: 12, display:'flex', alignItems:'center', gap:8 }}><Camera size={20} strokeWidth={1.8} /> Scan Barcode</h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>{scanMsg || 'Point camera at product barcode'}</p>
              <div id="qr-reader" style={{ width: '100%', borderRadius: 12, overflow: 'hidden', minHeight: 200, background: 'var(--bg-elevated)' }} />
              <button className="btn btn-secondary btn-full" style={{ marginTop: 16, display:'flex', alignItems:'center', justifyContent:'center', gap:6 }} onClick={stopScanner}><X size={14} strokeWidth={2.5} /> Cancel</button>
            </div>
          </div>
        </>
      )}

      {loading ? <div className={styles.loadingCenter}><div className="spinner" /></div> : products.length === 0 ? (
        <div className="empty-state">
          <ShoppingBag size={40} strokeWidth={1} style={{ color: 'var(--text-disabled)' }} />
          <div className="empty-state-title">No products yet</div>
          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            <button className="btn btn-secondary" onClick={() => { setShowScanner(true); startScanner(); }} style={{ display:'flex', alignItems:'center', gap:6 }}><Camera size={14} strokeWidth={2} /> Scan to Add</button>
            <button className="btn btn-primary" onClick={openAdd} style={{ display:'flex', alignItems:'center', gap:6 }}><Plus size={14} strokeWidth={2.5} /> Add Manually</button>
          </div>
        </div>
      ) : (
        <div className={styles.productsAdminGrid}>
          {products.map((p) => (
            <div key={p.id} className={styles.productAdminCard}>
              <div className={styles.productAdminImg}>
                {p.image_url ? <img src={p.image_url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Package size={28} strokeWidth={1} color="var(--text-muted)" />}
              </div>
              <div style={{ padding: '10px' }}>
                <p className={styles.productAdminBrand}>{p.brand}</p>
                <p className={styles.productAdminName}>{p.name}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                  <span style={{ fontWeight: 700, color: 'var(--accent)', fontSize: 14 }}>{formatCurrency(p.price)}</span>
                  <span className={`badge ${p.stock > 0 ? 'badge-success' : 'badge-error'}`}>Stock: {p.stock}</span>
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                  <button className="btn btn-secondary btn-sm" style={{ flex: 1, display:'flex', alignItems:'center', justifyContent:'center', gap:4 }} onClick={() => openEdit(p)}><Pencil size={13} strokeWidth={2} /></button>
                  <button className={`btn btn-sm ${styles.deleteBtn}`} style={{ flex: 1, display:'flex', alignItems:'center', justifyContent:'center', gap:4 }} onClick={() => handleDelete(p.id)}><Trash2 size={13} strokeWidth={2} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Product Form Modal */}
      {showForm && (
        <>
          <div className="overlay" onClick={() => setShowForm(false)} />
          <div className="modal" style={{ padding: '0 0 32px' }}>
            <div className="modal-handle" />
            <div style={{ padding: '0 20px' }}>
              <h3 style={{ fontSize: 20, marginBottom: 20 }}>{editItem ? 'Edit Product' : 'Add Product'}</h3>
              {form.image_url && (
                <div style={{ marginBottom: 16, borderRadius: 12, overflow: 'hidden', height: 120, background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src={form.image_url} alt="preview" style={{ height: '100%', objectFit: 'contain' }} />
                </div>
              )}
              <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Barcode</label>
                    <input className="form-input" placeholder="Scan or enter" value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} />
                  </div>
                  <button type="button" className="btn btn-secondary btn-sm" style={{ marginTop: 26, display:'flex', alignItems:'center', gap:4 }} onClick={handleManualBarcode}><Search size={14} strokeWidth={2} /></button>
                </div>
                <div className="form-group"><label className="form-label">Product Name *</label><input className="form-input" placeholder="Product name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <div className="form-group" style={{ flex: 1 }}><label className="form-label">Brand</label><input className="form-input" placeholder="Brand" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} /></div>
                  <div className="form-group" style={{ flex: 1 }}><label className="form-label">Category</label><input className="form-input" placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <div className="form-group" style={{ flex: 1 }}><label className="form-label">Price (₹) *</label><input className="form-input" type="number" placeholder="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required /></div>
                  <div className="form-group" style={{ flex: 1 }}><label className="form-label">Stock Qty</label><input className="form-input" type="number" placeholder="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} /></div>
                </div>
                <div className="form-group"><label className="form-label">Image URL</label><input className="form-input" placeholder="https://..." value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} /></div>
                {form.nutrition_data && (
                  <div style={{ background: 'var(--bg-primary)', borderRadius: 12, padding: 12, fontSize: 12, color: 'var(--text-muted)' }}>
                    <p style={{ fontWeight: 700, marginBottom: 6, color: 'var(--text-secondary)' }}>Nutrition (per 100g):</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                      {Object.entries(form.nutrition_data).filter(([, v]) => v !== null).map(([k, v]) => (
                        <span key={k}>{k.replace('_', ' ')}: <strong>{String(v)}g</strong></span>
                      ))}
                    </div>
                  </div>
                )}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="button" className="btn btn-secondary btn-full" onClick={() => setShowForm(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary btn-full" disabled={saving}>{saving ? <span className="spinner" style={{ width: 16, height: 16 }} /> : editItem ? 'Update' : 'Add Product'}</button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
      <div style={{ height: 100 }} />
    </div>
  );
}

// ─── ORDERS TAB ───────────────────────────────────────────────
function OrdersTab({ showToast }: { showToast: (m: string, t?: string) => void }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const load = () => { setLoading(true); fetch('/api/orders').then((r) => r.json()).then((d) => setOrders(Array.isArray(d) ? d : [])).finally(() => setLoading(false)); };
  useEffect(load, []);

  const updateStatus = async (id: number, status: string) => {
    try {
      await fetch(`/api/orders/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
      showToast(`Order #${id} marked as ${status}`);
      load();
    } catch { showToast('Failed to update status', 'error'); }
  };

  const statuses = ['all', 'pending', 'confirmed', 'preparing', 'delivered', 'cancelled'];
  const filtered = filter === 'all' ? orders : orders.filter((o) => o.status === filter);

  return (
    <div className={styles.tabContent}>
      <div className={styles.tabHeader}>
        <div><h2 className={styles.tabTitle}>Orders</h2><p className={styles.tabSubtitle}>{orders.length} total orders</p></div>
        <button className="btn btn-secondary btn-sm" onClick={load}>🔄 Refresh</button>
      </div>

      <div className={styles.filterScroll}>
        {statuses.map((s) => (
          <button key={s} className={`${styles.filterChip} ${filter === s ? styles.filterChipActive : ''}`} onClick={() => setFilter(s)} style={{ textTransform: 'capitalize' }}>
            {s === 'all' ? '📦 All' : s}
          </button>
        ))}
      </div>

      {loading ? <div className={styles.loadingCenter}><div className="spinner" /></div> : filtered.length === 0 ? (
        <div className="empty-state"><div className="empty-state-icon">📭</div><div className="empty-state-title">No orders</div></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '0 20px' }}>
          {filtered.map((order) => (
            <div key={order.id} className={styles.adminOrderCard}>
              <div className={styles.adminOrderHeader}>
                <div>
                  <span className={styles.adminOrderId}>#{order.id}</span>
                  <span className={styles.adminOrderName}>{order.customer_name}</span>
                  {order.customer_phone && <span className={styles.adminOrderPhone}>{order.customer_phone}</span>}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontWeight: 800, color: 'var(--accent)', fontSize: 16 }}>{formatCurrency(order.total)}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatDate(order.created_at)}</p>
                </div>
              </div>

              <div className={styles.adminOrderItems}>
                {(Array.isArray(order.items) ? order.items : []).map((item: any, i: number) => (
                  <span key={i} className={styles.adminOrderItem}>{item.name} ×{item.quantity}</span>
                ))}
              </div>

              <div className={styles.adminOrderFooter}>
                <select
                  className={styles.statusSelect}
                  value={order.status}
                  onChange={(e) => updateStatus(order.id, e.target.value)}
                  style={{ color: getStatusColor(order.status) }}
                >
                  {['pending', 'confirmed', 'preparing', 'delivered', 'cancelled'].map((s) => (
                    <option key={s} value={s} style={{ color: 'var(--text-primary)' }}>{s}</option>
                  ))}
                </select>
                <span className="badge" style={{ background: `${getStatusColor(order.status)}20`, color: getStatusColor(order.status) }}>
                  {order.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
      <div style={{ height: 100 }} />
    </div>
  );
}
