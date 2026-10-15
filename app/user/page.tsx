'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Home, UtensilsCrossed, ShoppingBag, ShoppingCart, Package,
  MapPin, Search, ChevronRight, Plus, Minus, X, Check,
  Sun, Moon, Star, Clock, Truck, ArrowRight, ChefHat,
  Leaf, Flame, Heart, Bell, User
} from 'lucide-react';
import { useCartStore } from '@/lib/store';
import { formatCurrency, formatDate, formatTime, getStatusColor, DAYS_OF_WEEK } from '@/lib/utils';
import styles from './user.module.css';

// ─── Types ───────────────────────────────────────────────────
type Tab = 'home' | 'menu' | 'products' | 'orders';

interface TiffinPlan {
  id: number; name: string; type: 'morning' | 'evening';
  price: number; description: string; active: boolean;
}
interface ScheduleEntry {
  id: number; tiffin_plan_id: number; day_of_week: string;
  meal_name: string; meal_description: string; plan_name: string; plan_type: string;
}
interface Thali {
  id: number; name: string; price: number; description: string;
  image_url: string; available: boolean; category: string;
}
interface Product {
  id: number; name: string; brand: string; category: string;
  image_url: string; price: number; stock: number;
}
interface Order {
  id: number; customer_name: string; customer_phone: string;
  items: { name: string; price: number; quantity: number; type: string }[];
  total: number; status: string; order_type: string; created_at: string;
}

// ─── Toast (only for errors/success, not cart) ───────────────
function useToast() {
  const [toasts, setToasts] = useState<{ id: number; msg: string; type: string }[]>([]);
  const show = useCallback((msg: string, type = 'success') => {
    const id = Date.now();
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
  }, []);
  return { toasts, show };
}

// ─── MAIN APP ─────────────────────────────────────────────────
export default function UserApp() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const { items, addItem, removeItem, updateQuantity, clearCart, itemCount, total } = useCartStore();
  const { toasts, show: showToast } = useToast();

  const handleAddToCart = (item: { id: number; name: string; price: number; image_url?: string; type: 'product' | 'thali' | 'tiffin' }) => {
    addItem(item);
  };

  const count = itemCount();
  const cartTotal = total();

  return (
    <div className={styles.app}>
      {/* Toasts — only errors */}
      <div className={styles.toastContainer}>
        {toasts.map((t) => (
          <div key={t.id} className={`${styles.toast} ${styles[`toast_${t.type}`]}`}>
            {t.type === 'success' ? <Check size={14} /> : <X size={14} />} {t.msg}
          </div>
        ))}
      </div>

      {/* Page Content */}
      <main className={styles.main} style={{ paddingBottom: count > 0 ? '148px' : '80px' }}>
        {activeTab === 'home'     && <HomeTab     onTabChange={setActiveTab} onAddToCart={handleAddToCart} cartItems={items} onUpdateQty={updateQuantity} showToast={showToast} />}
        {activeTab === 'menu'     && <MenuTab     onAddToCart={handleAddToCart} cartItems={items} onUpdateQty={updateQuantity} showToast={showToast} />}
        {activeTab === 'products' && <ProductsTab onAddToCart={handleAddToCart} cartItems={items} onUpdateQty={updateQuantity} showToast={showToast} />}
        {activeTab === 'orders'   && <OrdersTab />}
      </main>

      {/* Zepto-style Cart Bar */}
      {count > 0 && (
        <div className={styles.cartBar} onClick={() => setCheckoutOpen(true)}>
          <div className={styles.cartBarLeft}>
            <div className={styles.cartBarCount}>{count}</div>
            <div>
              <p className={styles.cartBarLabel}>View Cart</p>
              <p className={styles.cartBarItems}>{count} item{count > 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className={styles.cartBarRight}>
            <span className={styles.cartBarTotal}>{formatCurrency(cartTotal)}</span>
            <ArrowRight size={18} strokeWidth={2.5} />
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className={styles.bottomNav}>
        {([
          { id: 'home'     as Tab, icon: Home,          label: 'Home' },
          { id: 'menu'     as Tab, icon: UtensilsCrossed, label: 'Menu' },
          { id: 'products' as Tab, icon: ShoppingBag,   label: 'Store' },
          { id: 'orders'   as Tab, icon: Package,       label: 'Orders' },
        ]).map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            className={`${styles.navBtn} ${activeTab === id ? styles.navBtnActive : ''}`}
            onClick={() => setActiveTab(id)}
          >
            <Icon size={22} strokeWidth={activeTab === id ? 2.5 : 1.8} className={styles.navIcon} />
            <span className={styles.navLabel}>{label}</span>
          </button>
        ))}
      </nav>

      {/* Cart / Checkout Drawer */}
      {checkoutOpen && (
        <CartDrawer
          cartItems={items}
          onUpdateQty={updateQuantity}
          onRemove={removeItem}
          total={cartTotal}
          onClose={() => setCheckoutOpen(false)}
          onSuccess={() => {
            clearCart();
            setCheckoutOpen(false);
            setActiveTab('orders');
            showToast('Order placed successfully!');
          }}
          showToast={showToast}
        />
      )}
    </div>
  );
}

// ─── QTY CONTROL — inline +/- on cards ───────────────────────
function QtyControl({ productId, cartItems, onAdd, onUpdateQty, size = 'sm' }: {
  productId: number;
  cartItems: any[];
  onAdd: () => void;
  onUpdateQty: (id: number, qty: number) => void;
  size?: 'sm' | 'md';
}) {
  const item = cartItems.find((i) => i.id === productId);
  if (!item) {
    return (
      <button className={`${styles.addBtn} ${size === 'md' ? styles.addBtnMd : ''}`} onClick={onAdd} aria-label="Add to cart">
        <Plus size={size === 'md' ? 18 : 14} strokeWidth={3} />
      </button>
    );
  }
  return (
    <div className={`${styles.qtyControl} ${size === 'md' ? styles.qtyControlMd : ''}`}>
      <button className={styles.qtyBtn} onClick={() => onUpdateQty(item.id, item.quantity - 1)} aria-label="Decrease">
        <Minus size={12} strokeWidth={3} />
      </button>
      <span className={styles.qtyNum}>{item.quantity}</span>
      <button className={styles.qtyBtn} onClick={() => onUpdateQty(item.id, item.quantity + 1)} aria-label="Increase">
        <Plus size={12} strokeWidth={3} />
      </button>
    </div>
  );
}

// ─── HOME TAB ────────────────────────────────────────────────
function HomeTab({ onTabChange, onAddToCart, cartItems, onUpdateQty, showToast }: {
  onTabChange: (tab: Tab) => void;
  onAddToCart: (item: any) => void;
  cartItems: any[];
  onUpdateQty: (id: number, qty: number) => void;
  showToast: (msg: string, type?: string) => void;
}) {
  const [thalis, setThalis] = useState<Thali[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/thalis').then((r) => r.json()),
      fetch('/api/products').then((r) => r.json()),
    ]).then(([t, p]) => {
      setThalis(Array.isArray(t) ? t.filter((x: Thali) => x.available).slice(0, 4) : []);
      setProducts(Array.isArray(p) ? p.filter((x: Product) => x.stock > 0).slice(0, 6) : []);
    }).catch(() => showToast('Failed to load', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  const categories = [
    { icon: Sun,         title: 'Morning Tiffin', sub: 'Fresh breakfast',  tab: 'menu' as Tab,     color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
    { icon: Moon,        title: 'Evening Tiffin', sub: 'Warm meal',         tab: 'menu' as Tab,     color: '#7c3aed', bg: 'rgba(124,58,237,0.1)' },
    { icon: ChefHat,     title: 'Thali',           sub: "Today's special",  tab: 'menu' as Tab,     color: '#fc6011', bg: 'rgba(252,96,17,0.1)' },
    { icon: ShoppingBag, title: 'Snacks',          sub: 'Chips & more',    tab: 'products' as Tab, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  ];


  return (
    <div className={styles.tabContent}>
      {/* Header */}
      <div className={styles.homeHeader}>
        <div className={styles.headerTop}>
          <div>
            <p className={styles.greeting}>{greeting} 👋</p>
            <h1 className={styles.brandName}>
              TRC <span className={styles.brandAccent}>Cafe</span>
            </h1>
          </div>
          <button className={styles.headerIconBtn}>
            <Bell size={20} strokeWidth={1.8} />
          </button>
        </div>
        <div className={styles.locationRow}>
          <MapPin size={13} className={styles.locationIcon} />
          <span>Delivering to your location</span>
          <ChevronRight size={13} className={styles.locationIcon} />
        </div>
      </div>

      {/* Hero */}
      <div className={styles.heroBanner}>
        <div className={styles.heroText}>
          <span className={styles.heroChip}>
            <Flame size={11} /> Daily Special
          </span>
          <h2 className={styles.heroTitle}>Fresh Home-Style<br />Meals, Every Day</h2>
          <p className={styles.heroSub}>Tiffins · Thalis · Snacks</p>
          <button className={styles.heroBtn} onClick={() => onTabChange('menu')}>
            Order Now <ArrowRight size={14} strokeWidth={2.5} />
          </button>
        </div>
        <div className={styles.heroIllustration}>
          <ChefHat size={64} strokeWidth={1} className={styles.heroIllustrationIcon} />
        </div>
      </div>

      {/* Categories */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>What are you craving?</h3>
        <div className={styles.categoriesGrid}>
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <button key={cat.title} className={styles.categoryCard} onClick={() => onTabChange(cat.tab)}>
                <div className={styles.categoryIcon} style={{ background: cat.bg }}>
                  <Icon size={22} color={cat.color} strokeWidth={1.8} />
                </div>
                <p className={styles.categoryTitle}>{cat.title}</p>
                <p className={styles.categorySub}>{cat.sub}</p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Info Pills */}
      <div className={styles.infoPills}>
        {[
          { icon: Truck, text: 'Free Delivery' },
          { icon: Clock, text: '30 min delivery' },
          { icon: Leaf, text: '100% Fresh' },
        ].map(({ icon: Icon, text }) => (
          <div key={text} className={styles.infoPill}>
            <Icon size={13} strokeWidth={2} />
            <span>{text}</span>
          </div>
        ))}
      </div>

      {/* Featured Thalis */}
      {!loading && thalis.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Today&apos;s Thalis</h3>
            <button className={styles.seeAll} onClick={() => onTabChange('menu')}>
              See all <ChevronRight size={14} />
            </button>
          </div>
          <div className={styles.horizontalScroll}>
            {thalis.map((thali) => (
              <div key={thali.id} className={styles.thaliCard}>
                <div className={styles.thaliImgWrap}>
                  {thali.image_url
                    ? <img src={thali.image_url} alt={thali.name} className={styles.thaliImg} />
                    : <div className={styles.thaliImgPlaceholder}><ChefHat size={32} strokeWidth={1} /></div>
                  }
                  <span className={styles.thaliCategoryBadge}>{thali.category}</span>
                </div>
                <div className={styles.thaliInfo}>
                  <p className={styles.thaliName}>{thali.name}</p>
                  <p className={styles.thaliDesc}>{thali.description?.slice(0, 35) || 'Fresh daily thali'}...</p>
                  <div className={styles.thaliFooter}>
                    <span className={styles.thaliPrice}>{formatCurrency(thali.price)}</span>
                    <QtyControl
                      productId={thali.id}
                      cartItems={cartItems}
                      onAdd={() => onAddToCart({ id: thali.id, name: thali.name, price: thali.price, image_url: thali.image_url, type: 'thali' })}
                      onUpdateQty={onUpdateQty}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Featured Products */}
      {!loading && products.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Popular Snacks</h3>
            <button className={styles.seeAll} onClick={() => onTabChange('products')}>
              See all <ChevronRight size={14} />
            </button>
          </div>
          <div className={styles.productsGrid}>
            {products.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                cartItems={cartItems}
                onAdd={() => onAddToCart({ id: p.id, name: p.name, price: p.price, image_url: p.image_url, type: 'product' })}
                onUpdateQty={onUpdateQty}
              />
            ))}
          </div>
        </section>
      )}

      {loading && (
        <div className={styles.loadingCenter}>
          <div className={styles.spinner} />
        </div>
      )}
      <div style={{ height: 24 }} />
    </div>
  );
}

// ─── MENU TAB ────────────────────────────────────────────────
function MenuTab({ onAddToCart, cartItems, onUpdateQty, showToast }: {
  onAddToCart: (item: any) => void; cartItems: any[];
  onUpdateQty: (id: number, qty: number) => void;
  showToast: (msg: string, type?: string) => void;
}) {
  const [tiffins, setTiffins] = useState<TiffinPlan[]>([]);
  const [thalis, setThalis] = useState<Thali[]>([]);
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState<'tiffin' | 'thali'>('tiffin');
  const today = DAYS_OF_WEEK[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];

  useEffect(() => {
    Promise.all([
      fetch('/api/tiffins').then((r) => r.json()),
      fetch('/api/thalis').then((r) => r.json()),
      fetch('/api/schedule').then((r) => r.json()),
    ]).then(([t, th, s]) => {
      setTiffins(Array.isArray(t) ? t.filter((x: TiffinPlan) => x.active) : []);
      setThalis(Array.isArray(th) ? th.filter((x: Thali) => x.available) : []);
      setSchedule(Array.isArray(s) ? s : []);
    }).catch(() => showToast('Failed to load menu', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const getScheduleForPlan = (planId: number) => schedule.filter((s) => s.tiffin_plan_id === planId);

  return (
    <div className={styles.tabContent}>
      <div className={styles.pageHeader}>
        <h2 className={styles.pageTitle}>Our Menu</h2>
        <p className={styles.pageSubtitle}>Fresh meals prepared daily with love</p>
      </div>

      <div className={styles.segmentControl}>
        <button className={`${styles.segment} ${section === 'tiffin' ? styles.segmentActive : ''}`} onClick={() => setSection('tiffin')}>
          <Sun size={14} strokeWidth={2} /> Tiffin Plans
        </button>
        <button className={`${styles.segment} ${section === 'thali' ? styles.segmentActive : ''}`} onClick={() => setSection('thali')}>
          <ChefHat size={14} strokeWidth={2} /> Thalis
        </button>
      </div>

      {loading ? (
        <div className={styles.loadingCenter}><div className={styles.spinner} /></div>
      ) : section === 'tiffin' ? (
        <div className={styles.sectionContent}>
          {tiffins.length === 0 ? (
            <div className={styles.emptyState}>
              <UtensilsCrossed size={40} strokeWidth={1} className={styles.emptyIcon} />
              <p className={styles.emptyTitle}>No tiffin plans available</p>
              <p className={styles.emptyDesc}>Check back soon!</p>
            </div>
          ) : tiffins.map((plan) => {
            const planSchedule = getScheduleForPlan(plan.id);
            const todayMeal = planSchedule.find((s) => s.day_of_week === today);
            return (
              <div key={plan.id} className={styles.tiffinCard}>
                <div className={styles.tiffinCardTop}>
                  <div className={styles.tiffinTypePill} style={plan.type === 'morning'
                    ? { background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }
                    : { background: 'rgba(139,92,246,0.12)', color: '#a78bfa' }}>
                    {plan.type === 'morning'
                      ? <><Sun size={12} strokeWidth={2.5} /> Morning</>
                      : <><Moon size={12} strokeWidth={2.5} /> Evening</>}
                  </div>
                  <div className={styles.tiffinPriceWrap}>
                    <span className={styles.tiffinPrice}>{formatCurrency(plan.price)}</span>
                    <span className={styles.tiffinPriceSub}>/day</span>
                  </div>
                </div>

                <h3 className={styles.tiffinName}>{plan.name}</h3>
                <p className={styles.tiffinDesc}>{plan.description}</p>

                {todayMeal && (
                  <div className={styles.todayMealBox}>
                    <Star size={12} strokeWidth={2.5} className={styles.todayIcon} />
                    <div>
                      <p className={styles.todayLabel}>Today&apos;s Meal</p>
                      <p className={styles.todayMeal}>{todayMeal.meal_name}</p>
                    </div>
                  </div>
                )}

                {planSchedule.length > 0 && (
                  <div className={styles.schedulePreview}>
                    <p className={styles.scheduleTitle}>This Week</p>
                    <div className={styles.scheduleDays}>
                      {DAYS_OF_WEEK.map((day) => {
                        const entry = planSchedule.find((s) => s.day_of_week === day);
                        const isToday = day === today;
                        return (
                          <div key={day} className={`${styles.scheduleDay} ${isToday ? styles.scheduleDayToday : ''}`}>
                            <span className={styles.scheduleDayLabel}>{day}</span>
                            <span className={styles.scheduleDayMeal}>{entry?.meal_name?.split('+')[0]?.trim() || '—'}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <button
                  className={styles.tiffinOrderBtn}
                  onClick={() => onAddToCart({ id: plan.id, name: `${plan.name} (${plan.type})`, price: plan.price, type: 'tiffin' })}
                >
                  <ShoppingCart size={16} strokeWidth={2} />
                  Subscribe — {formatCurrency(plan.price)}/day
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className={styles.sectionContent}>
          {thalis.length === 0 ? (
            <div className={styles.emptyState}>
              <ChefHat size={40} strokeWidth={1} className={styles.emptyIcon} />
              <p className={styles.emptyTitle}>No thalis available today</p>
              <p className={styles.emptyDesc}>Check back tomorrow!</p>
            </div>
          ) : thalis.map((thali) => (
            <div key={thali.id} className={styles.thaliCardFull}>
              <div className={styles.thaliImgFull}>
                {thali.image_url
                  ? <img src={thali.image_url} alt={thali.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <ChefHat size={48} strokeWidth={1} color="var(--text-muted)" />}
              </div>
              <div className={styles.thaliInfoFull}>
                <span className={styles.thaliCatTag}>{thali.category}</span>
                <h3 className={styles.thaliNameFull}>{thali.name}</h3>
                <p className={styles.thaliDescFull}>{thali.description}</p>
                <div className={styles.thaliFullFooter}>
                  <span className={styles.thaliPriceFull}>{formatCurrency(thali.price)}</span>
                  <QtyControl
                    productId={thali.id} cartItems={cartItems} size="md"
                    onAdd={() => onAddToCart({ id: thali.id, name: thali.name, price: thali.price, image_url: thali.image_url, type: 'thali' })}
                    onUpdateQty={onUpdateQty}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <div style={{ height: 24 }} />
    </div>
  );
}

// ─── PRODUCTS TAB ─────────────────────────────────────────────
function ProductsTab({ onAddToCart, cartItems, onUpdateQty, showToast }: {
  onAddToCart: (item: any) => void; cartItems: any[];
  onUpdateQty: (id: number, qty: number) => void;
  showToast: (msg: string, type?: string) => void;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/products').then((r) => r.json()).then((data) => {
      const prods = Array.isArray(data) ? data : [];
      setProducts(prods);
      const cats = [...new Set<string>(prods.map((p: Product) => p.category).filter(Boolean))];
      setCategories(cats);
    }).catch(() => showToast('Failed to load products', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = products.filter((p) => {
    const matchCat = selectedCat === 'all' || p.category === selectedCat;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.brand || '').toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch && p.stock > 0;
  });

  return (
    <div className={styles.tabContent}>
      <div className={styles.pageHeader}>
        <h2 className={styles.pageTitle}>Store</h2>
        <p className={styles.pageSubtitle}>Snacks, beverages & more</p>
      </div>

      <div className={styles.searchBar}>
        <Search size={16} strokeWidth={2} className={styles.searchIcon} />
        <input className={styles.searchInput} placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} />
        {search && <button className={styles.clearSearch} onClick={() => setSearch('')}><X size={14} /></button>}
      </div>

      {categories.length > 0 && (
        <div className={styles.filterScroll}>
          {['all', ...categories].map((cat) => (
            <button key={cat} className={`${styles.filterChip} ${selectedCat === cat ? styles.filterChipActive : ''}`} onClick={() => setSelectedCat(cat)}>
              {cat === 'all' ? 'All' : cat}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className={styles.loadingCenter}><div className={styles.spinner} /></div>
      ) : filtered.length === 0 ? (
        <div className={styles.emptyState}>
          <ShoppingBag size={40} strokeWidth={1} className={styles.emptyIcon} />
          <p className={styles.emptyTitle}>No products found</p>
          <p className={styles.emptyDesc}>Try a different search</p>
        </div>
      ) : (
        <div className={styles.productsGridFull}>
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} cartItems={cartItems}
              onAdd={() => onAddToCart({ id: p.id, name: p.name, price: p.price, image_url: p.image_url, type: 'product' })}
              onUpdateQty={onUpdateQty}
            />
          ))}
        </div>
      )}
      <div style={{ height: 24 }} />
    </div>
  );
}

// ─── PRODUCT CARD ─────────────────────────────────────────────
function ProductCard({ product, cartItems, onAdd, onUpdateQty }: {
  product: Product; cartItems: any[];
  onAdd: () => void; onUpdateQty: (id: number, qty: number) => void;
}) {
  const inCart = cartItems.find((i) => i.id === product.id);
  return (
    <div className={`${styles.productCard} ${inCart ? styles.productCardActive : ''}`}>
      <div className={styles.productImgWrap}>
        {product.image_url
          ? <img src={product.image_url} alt={product.name} className={styles.productImg} />
          : <div className={styles.productImgPlaceholder}><Package size={28} strokeWidth={1} /></div>}
        {inCart && <div className={styles.productInCartBadge}><Check size={10} strokeWidth={3} /></div>}
      </div>
      <div className={styles.productInfo}>
        {product.brand && <p className={styles.productBrand}>{product.brand}</p>}
        <p className={styles.productName}>{product.name}</p>
        <div className={styles.productFooter}>
          <span className={styles.productPrice}>{formatCurrency(product.price)}</span>
          <QtyControl productId={product.id} cartItems={cartItems} onAdd={onAdd} onUpdateQty={onUpdateQty} />
        </div>
      </div>
    </div>
  );
}

// ─── CART DRAWER ──────────────────────────────────────────────
function CartDrawer({ cartItems, onUpdateQty, onRemove, total, onClose, onSuccess, showToast }: {
  cartItems: any[]; onUpdateQty: (id: number, qty: number) => void;
  onRemove: (id: number) => void; total: number;
  onClose: () => void; onSuccess: () => void;
  showToast: (msg: string, type?: string) => void;
}) {
  const [step, setStep] = useState<'cart' | 'checkout'>('cart');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [placing, setPlacing] = useState(false);

  const handleOrder = async () => {
    if (!name.trim()) return showToast('Enter your name', 'error');
    if (phone.length < 10) return showToast('Enter valid phone number', 'error');
    setPlacing(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: name, customer_phone: phone,
          items: cartItems, total,
          order_type: cartItems[0]?.type || 'product',
          notes,
        }),
      });
      if (!res.ok) throw new Error();
      onSuccess();
    } catch {
      showToast('Order failed. Please try again.', 'error');
    } finally {
      setPlacing(false);
    }
  };

  return (
    <>
      <div className={styles.drawerOverlay} onClick={onClose} />
      <div className={styles.drawer}>
        <div className={styles.drawerHandle} />

        {step === 'cart' ? (
          <>
            <div className={styles.drawerHeader}>
              <h3 className={styles.drawerTitle}>Your Cart</h3>
              <button className={styles.drawerClose} onClick={onClose}><X size={20} /></button>
            </div>

            <div className={styles.drawerBody}>
              {cartItems.map((item) => (
                <div key={item.id} className={styles.cartItem}>
                  <div className={styles.cartItemImg}>
                    {item.image_url
                      ? <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10 }} />
                      : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                          {item.type === 'tiffin' ? <Sun size={20} strokeWidth={1.5} /> : item.type === 'thali' ? <ChefHat size={20} strokeWidth={1.5} /> : <Package size={20} strokeWidth={1.5} />}
                        </div>}
                  </div>
                  <div className={styles.cartItemInfo}>
                    <p className={styles.cartItemName}>{item.name}</p>
                    <p className={styles.cartItemPrice}>{formatCurrency(item.price)} each</p>
                  </div>
                  <div className={styles.cartItemActions}>
                    <div className={styles.qtyControlLg}>
                      <button className={styles.qtyBtnLg} onClick={() => onUpdateQty(item.id, item.quantity - 1)}>
                        {item.quantity === 1 ? <X size={12} strokeWidth={3} /> : <Minus size={12} strokeWidth={3} />}
                      </button>
                      <span className={styles.qtyNumLg}>{item.quantity}</span>
                      <button className={styles.qtyBtnLg} onClick={() => onUpdateQty(item.id, item.quantity + 1)}>
                        <Plus size={12} strokeWidth={3} />
                      </button>
                    </div>
                    <span className={styles.cartItemTotal}>{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.drawerFooter}>
              <div className={styles.billSummary}>
                <div className={styles.billRow}><span>Subtotal</span><span>{formatCurrency(total)}</span></div>
                <div className={styles.billRow}><span>Delivery</span><span className={styles.freeTag}>FREE</span></div>
                <div className={styles.billTotal}><span>Total</span><span>{formatCurrency(total)}</span></div>
              </div>
              <button className={styles.proceedBtn} onClick={() => setStep('checkout')}>
                <Truck size={16} strokeWidth={2} /> Proceed to Checkout
                <ArrowRight size={16} strokeWidth={2.5} />
              </button>
            </div>
          </>
        ) : (
          <>
            <div className={styles.drawerHeader}>
              <button className={styles.backBtn} onClick={() => setStep('cart')}>
                <ArrowRight size={18} style={{ transform: 'rotate(180deg)' }} />
              </button>
              <h3 className={styles.drawerTitle}>Delivery Details</h3>
              <button className={styles.drawerClose} onClick={onClose}><X size={20} /></button>
            </div>

            <div className={styles.drawerBody}>
              <div className={styles.checkoutForm}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    <User size={13} /> Full Name
                  </label>
                  <input className={styles.formInput} placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    <Bell size={13} /> Phone Number
                  </label>
                  <input className={styles.formInput} placeholder="10-digit mobile number" type="tel" maxLength={10} value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Special Instructions (optional)</label>
                  <textarea className={`${styles.formInput} ${styles.formTextarea}`} placeholder="Any notes for the kitchen..." value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>

                <div className={styles.codBox}>
                  <div className={styles.codIcon}><ShoppingBag size={16} strokeWidth={2} /></div>
                  <div>
                    <p className={styles.codTitle}>Cash on Delivery</p>
                    <p className={styles.codSub}>Pay when your order arrives</p>
                  </div>
                  <Check size={18} strokeWidth={2.5} className={styles.codCheck} />
                </div>
              </div>
            </div>

            <div className={styles.drawerFooter}>
              <button className={styles.proceedBtn} onClick={handleOrder} disabled={placing}>
                {placing ? <div className={styles.spinner} style={{ width: 18, height: 18 }} /> : <Check size={16} strokeWidth={2.5} />}
                {placing ? 'Placing Order...' : `Place Order — ${formatCurrency(total)}`}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

// ─── ORDERS TAB ───────────────────────────────────────────────
function OrdersTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/orders').then((r) => r.json())
      .then((d) => setOrders(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, []);

  const statusIcon: Record<string, React.ReactNode> = {
    pending: <Clock size={13} strokeWidth={2} />,
    confirmed: <Check size={13} strokeWidth={2.5} />,
    preparing: <ChefHat size={13} strokeWidth={2} />,
    delivered: <Truck size={13} strokeWidth={2} />,
    cancelled: <X size={13} strokeWidth={2.5} />,
  };

  return (
    <div className={styles.tabContent}>
      <div className={styles.pageHeader}>
        <h2 className={styles.pageTitle}>Your Orders</h2>
        <p className={styles.pageSubtitle}>Track your recent orders</p>
      </div>

      {loading ? (
        <div className={styles.loadingCenter}><div className={styles.spinner} /></div>
      ) : orders.length === 0 ? (
        <div className={styles.emptyState} style={{ marginTop: 60 }}>
          <Package size={44} strokeWidth={1} className={styles.emptyIcon} />
          <p className={styles.emptyTitle}>No orders yet</p>
          <p className={styles.emptyDesc}>Your orders will appear here once placed</p>
        </div>
      ) : (
        <div className={styles.ordersList}>
          {orders.slice(0, 20).map((order) => (
            <div key={order.id} className={styles.orderCard}>
              <div className={styles.orderCardTop}>
                <div>
                  <p className={styles.orderId}>Order #{order.id}</p>
                  <p className={styles.orderMeta}>{formatDate(order.created_at)} · {formatTime(order.created_at)}</p>
                </div>
                <div className={styles.statusPill} style={{ background: `${getStatusColor(order.status)}15`, color: getStatusColor(order.status), borderColor: `${getStatusColor(order.status)}30` }}>
                  {statusIcon[order.status]} {order.status}
                </div>
              </div>
              <div className={styles.orderItems}>
                {(Array.isArray(order.items) ? order.items : []).map((item, i) => (
                  <span key={i} className={styles.orderItemTag}>{item.name} ×{item.quantity}</span>
                ))}
              </div>
              <div className={styles.orderFooter}>
                <span className={styles.orderCustomer}><User size={12} /> {order.customer_name}</span>
                <span className={styles.orderTotal}>{formatCurrency(order.total)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      <div style={{ height: 24 }} />
    </div>
  );
}
