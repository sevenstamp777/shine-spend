/* ============================================================
   FinanceIQ – App Logic (API Connected)
   ============================================================ */

const API = {
  async _fetch(url, options = {}) {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    if (res.status === 401) {
      window.location.href = '/login';
      throw new Error('Não autorizado');
    }
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro na requisição');
    return data;
  },
  getTransactions() { return this._fetch('/api/transactions'); },
  createTransaction(tx) { return this._fetch('/api/transactions', { method: 'POST', body: JSON.stringify(tx) }); },
  updateTransaction(id, tx) { return this._fetch('/api/transactions/' + id, { method: 'PUT', body: JSON.stringify(tx) }); },
  deleteTransaction(id) { return this._fetch('/api/transactions/' + id, { method: 'DELETE' }); },
  getBudgets() { return this._fetch('/api/budgets'); },
  createBudget(b) { return this._fetch('/api/budgets', { method: 'POST', body: JSON.stringify(b) }); },
  updateBudget(id, b) { return this._fetch('/api/budgets/' + id, { method: 'PUT', body: JSON.stringify(b) }); },
  deleteBudget(id) { return this._fetch('/api/budgets/' + id, { method: 'DELETE' }); },
  getGoals() { return this._fetch('/api/goals'); },
  createGoal(g) { return this._fetch('/api/goals', { method: 'POST', body: JSON.stringify(g) }); },
  updateGoal(id, g) { return this._fetch('/api/goals/' + id, { method: 'PUT', body: JSON.stringify(g) }); },
  deleteGoal(id) { return this._fetch('/api/goals/' + id, { method: 'DELETE' }); },
  getMembers() { return this._fetch('/api/members'); },
  createMember(m) { return this._fetch('/api/members', { method: 'POST', body: JSON.stringify(m) }); },
  updateMember(id, m) { return this._fetch('/api/members/' + id, { method: 'PUT', body: JSON.stringify(m) }); },
  deleteMember(id) { return this._fetch('/api/members/' + id, { method: 'DELETE' }); },
  getProfile() { return this._fetch('/api/auth/me'); },
  updateProfile(data) { return this._fetch('/api/profile', { method: 'PUT', body: JSON.stringify(data) }); },
  getPaymentMethods() { return this._fetch('/api/payment-methods'); },
  createPaymentMethod(name) { return this._fetch('/api/payment-methods', { method: 'POST', body: JSON.stringify({ name }) }); },
  updatePaymentMethod(id, name) { return this._fetch('/api/payment-methods/' + id, { method: 'PUT', body: JSON.stringify({ name }) }); },
  deletePaymentMethod(id) { return this._fetch('/api/payment-methods/' + id, { method: 'DELETE' }); },
  getCategories() { return this._fetch('/api/categories'); },
  createCategory(data) { return this._fetch('/api/categories', { method: 'POST', body: JSON.stringify(data) }); },
  updateCategory(dbId, data) { return this._fetch('/api/categories/' + dbId, { method: 'PUT', body: JSON.stringify(data) }); },
  deleteCategory(dbId) { return this._fetch('/api/categories/' + dbId, { method: 'DELETE' }); },
  logout() { return this._fetch('/api/auth/logout', { method: 'POST' }); },
};

const CATEGORIES = {
  income: [
    { id: 'salary', label: 'Salário', icon: '💼', color: '#10d9a0' },
    { id: 'freelance', label: 'Freelance', icon: '💻', color: '#38bdf8' },
    { id: 'investment', label: 'Investimentos', icon: '📈', color: '#a78bfa' },
    { id: 'bonus', label: 'Bônus', icon: '🎁', color: '#fbbf24' },
    { id: 'rent', label: 'Aluguel Receb.', icon: '🏠', color: '#34d399' },
    { id: 'other_in', label: 'Outros', icon: '💰', color: '#6c63ff' },
  ],
  expense: [
    { id: 'housing', label: 'Moradia', icon: '🏠', color: '#f97316' },
    { id: 'food', label: 'Alimentação', icon: '🍕', color: '#fb923c' },
    { id: 'transport', label: 'Transporte', icon: '🚗', color: '#60a5fa' },
    { id: 'health', label: 'Saúde', icon: '💊', color: '#f43f5e' },
    { id: 'education', label: 'Educação', icon: '🎓', color: '#a78bfa' },
    { id: 'leisure', label: 'Lazer', icon: '🎮', color: '#fb7185' },
    { id: 'clothing', label: 'Vestuário', icon: '👗', color: '#e879f9' },
    { id: 'utilities', label: 'Contas/Serviços', icon: '💡', color: '#fbbf24' },
    { id: 'shopping', label: 'Compras', icon: '🛒', color: '#34d399' },
    { id: 'other_ex', label: 'Outros', icon: '📌', color: '#94a3b8' },
  ]
};

const ALL_CATEGORIES = [...CATEGORIES.income, ...CATEGORIES.expense];
let dynamicCategories = {};
let userCategories = [];

function categoryColor(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return `hsl(${h % 360}, 70%, 52%)`;
}

function categoryIcon(id) {
  const s = String(id).toLowerCase();
  const map = {
    'aliment': '🛒', 'moradia': '🏠', 'aluguel': '🏠', 'saude': '💊', 'combust': '⛽',
    'carro': '🚗', 'casa': '🧹', 'igreja': '⛪', 'raca': '🐕', 'cachorro': '🐕',
    'telefone': '📱', 'celular': '📱', 'negocio': '💼', 'receita': '💰', 'outro': '📌',
    'transporte': '🚗', 'higiene': '🧴', 'vet': '🐾',
  };
  for (const k in map) if (s.includes(k)) return map[k];
  return '💰';
}

function getAllCategories() {
  const map = new Map();
  ALL_CATEGORIES.forEach(c => map.set(c.id, { ...c, builtin: true }));
  userCategories.forEach(c => {
    map.set(c.id, {
      id: c.id,
      dbId: c.dbId,
      label: c.label || c.id,
      icon: c.icon || categoryIcon(c.id),
      color: c.color || categoryColor(c.id),
      type: c.type || 'expense',
      builtin: !!c.builtin,
    });
  });
  Object.values(dynamicCategories).forEach(c => {
    if (!map.has(c.id)) map.set(c.id, { ...c, builtin: false });
  });
  return [...map.values()];
}

function getCategoryById(id) {
  return getAllCategories().find(c => c.id === id) || { id, label: id, icon: categoryIcon(id), color: categoryColor(id) };
}

function buildCategoryRegistry() {
  dynamicCategories = {};
  const fixedIds = new Set(ALL_CATEGORIES.map(c => c.id));
  const seen = new Set();
  const add = (id) => {
    if (!id) return;
    id = String(id);
    if (seen.has(id) || fixedIds.has(id)) return;
    seen.add(id);
    dynamicCategories[id] = { id, label: id, icon: categoryIcon(id), color: categoryColor(id) };
  };
  transactions.forEach(t => {
    add(t.category);
    (t.items || []).forEach(i => add(i.category));
  });
  budgets.forEach(b => add(b.category));
}

let transactions = [];
let budgets = [];
let goals = [];
let userProfile = { name: 'Usuário', email: '', avatar: '' };
let familyMembers = [];
let paymentMethods = [];

let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let currentType = 'income';
let editingId = null;
let editingBudgetId = null;
let editingGoalId = null;

let cashflowChart = null;
let categoryChart = null;
let annualChart = null;

function showLoading(msg = 'Carregando...') {
  let overlay = document.getElementById('loadingOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'loadingOverlay';
    overlay.innerHTML = `
      <div style="
        position:fixed;inset:0;z-index:99999;
        background:rgba(10,12,28,0.85);
        display:flex;flex-direction:column;
        align-items:center;justify-content:center;
        gap:16px;
      ">
        <div style="
          width:48px;height:48px;border:3px solid rgba(108,99,255,0.3);
          border-top-color:#6c63ff;border-radius:50%;
          animation:spin 0.8s linear infinite;
        "></div>
        <span style="color:#8a8fb5;font-size:14px;" id="loadingMsg">${msg}</span>
      </div>
    `;
    document.body.appendChild(overlay);
  } else {
    const msgEl = document.getElementById('loadingMsg');
    if (msgEl) msgEl.textContent = msg;
    overlay.style.display = 'block';
  }
}

function hideLoading() {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) overlay.style.display = 'none';
}

function fmtCurrency(val) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
}

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function fmtDate(dateStr) {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function getMonthTransactions() {
  return transactions.filter(t => {
    const d = new Date(t.date + 'T00:00:00');
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });
}

function pickInitialMonth() {
  if (!transactions.length) return;
  const now = new Date();
  const nowIdx = now.getFullYear() * 12 + now.getMonth();
  const months = new Map();
  for (const t of transactions) {
    const d = new Date(t.date + 'T00:00:00');
    const k = d.getFullYear() * 12 + d.getMonth();
    months.set(k, (months.get(k) || 0) + 1);
  }
  const sorted = [...months.entries()].sort((a, b) => b[0] - a[0]);
  let target = sorted[0][0];
  if (target === nowIdx && sorted.length > 1 && sorted[0][1] < sorted[1][1]) {
    target = sorted[1][0];
  }
  currentYear = Math.floor(target / 12);
  currentMonth = target % 12;
}

async function loadAllData() {
  showLoading('Carregando dados...');
  try {
    const [txs, b, g, m, profile, pms, cats] = await Promise.all([
      API.getTransactions(),
      API.getBudgets(),
      API.getGoals(),
      API.getMembers(),
      API.getProfile(),
      API.getPaymentMethods(),
      API.getCategories(),
    ]);
    transactions = txs;
    pickInitialMonth();
    updateMonthLabel();
    budgets = b;
    goals = g;
    familyMembers = m;
    userProfile = profile.user;
    paymentMethods = pms;
    userCategories = cats;
    buildCategoryRegistry();
    populatePaymentMethodSelects();
    populateFilterCategorySelect();
    renderPaymentMethods();
    renderCategories();
  } catch (e) {
    console.error('Erro ao carregar dados:', e);
  }
  hideLoading();
}

function logout() {
  API.logout().finally(() => {
    window.location.href = '/login';
  });
}

function populatePaymentMethodSelects() {
  const opts = paymentMethods.map(m => `<option value="${escAttr(m.name)}">${escHtml(m.name)}</option>`).join('');

  const sel = document.getElementById('txPaymentMethod');
  if (sel) {
    const prev = sel.value;
    sel.innerHTML = '<option value="">Selecione...</option>' + opts;
    if (prev) sel.value = prev;
  }

  const fsel = document.getElementById('filterPaymentMethod');
  if (fsel) {
    const fprev = fsel.value;
    fsel.innerHTML = '<option value="">Todas as formas</option>' + opts;
    if (fprev) fsel.value = fprev;
  }
}

function populateFilterCategorySelect() {
  const sel = document.getElementById('filterCategory');
  if (!sel) return;
  const prev = sel.value;
  sel.innerHTML = '<option value="">Todas as categorias</option>';
  getAllCategories().forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = `${c.icon} ${c.label}`;
    sel.appendChild(opt);
  });
  if (prev) sel.value = prev;
}

function renderPaymentMethods() {
  const container = document.getElementById('paymentMethodsList');
  if (!container) return;
  if (!paymentMethods.length) {
    container.innerHTML = emptyState('💳', 'Nenhuma forma de pagamento. Adicione acima.');
    return;
  }
  container.innerHTML = paymentMethods.map(m => `
    <div class="payment-method-item">
      <span class="payment-method-name">💳 ${escHtml(m.name)}</span>
      <div class="tx-actions">
        <button type="button" class="tx-action-btn edit-pm" data-id="${m.id}" title="Renomear">✏️</button>
        <button type="button" class="tx-action-btn delete delete-pm" data-id="${m.id}" title="Remover">🗑️</button>
      </div>
    </div>`).join('');

  container.querySelectorAll('.edit-pm').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = parseInt(btn.dataset.id);
      const m = paymentMethods.find(x => x.id === id);
      const name = prompt('Renomear forma de pagamento:', m ? m.name : '');
      if (!name || !name.trim()) return;
      try {
        const updated = await API.updatePaymentMethod(id, name.trim());
        const idx = paymentMethods.findIndex(x => x.id === id);
        if (idx !== -1) paymentMethods[idx] = updated;
        renderPaymentMethods();
        populatePaymentMethodSelects();
        showToast('Forma de pagamento renomeada.', 'success');
      } catch (e) {
        showToast(e.message || 'Erro ao renomear.', 'error');
      }
    });
  });

  container.querySelectorAll('.delete-pm').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = parseInt(btn.dataset.id);
      const m = paymentMethods.find(x => x.id === id);
      const ok = await customConfirm(`Remover "${m ? m.name : 'esta forma'}"? Os lançamentos antigos mantêm o valor salvo.`, '💳', 'Remover Forma de Pagamento');
      if (!ok) return;
      try {
        await API.deletePaymentMethod(id);
        paymentMethods = paymentMethods.filter(x => x.id !== id);
        renderPaymentMethods();
        populatePaymentMethodSelects();
        showToast('Forma de pagamento removida.', 'info');
      } catch (e) {
        showToast('Erro ao remover.', 'error');
      }
    });
  });
}

const CATEGORY_EMOJIS = ['💰', '📌', '🛒', '🏠', '🚗', '💊', '⛽', '🐕', '🧴', '📱', '⛪', '🎮', '👗', '🎓', '💡', '🍕', '🐾', '🛍️', '🎯', '💼', '📈', '🏋️', '✈️', '🎬'];

let editingCategoryDbId = null;

function catIcon(c) {
  return c.icon || categoryIcon(c.id);
}

function catColor(c) {
  return c.color || categoryColor(c.id);
}

function renderEmojiPalette() {
  const el = document.getElementById('categoryEmojiPalette');
  if (!el) return;
  el.innerHTML = CATEGORY_EMOJIS.map(e => `<button type="button" class="emoji-chip" data-emoji="${escAttr(e)}">${e}</button>`).join('');
  el.querySelectorAll('.emoji-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const input = document.getElementById('newCategoryIcon');
      input.value = chip.dataset.emoji;
      input.focus();
    });
  });
}

function renderCategories() {
  const container = document.getElementById('categoriesList');
  if (!container) return;
  const cats = getAllCategories();
  if (!cats.length) {
    container.innerHTML = emptyState('🏷️', 'Nenhuma categoria cadastrada.');
    return;
  }
  container.innerHTML = cats.map(c => `
    <div class="category-item">
      <span class="category-swatch" style="background:${catColor(c)};opacity:.15;">&nbsp;</span>
      <span class="category-icon" style="color:${catColor(c)};">${catIcon(c)}</span>
      <span class="category-name">${escHtml(c.label)}</span>
      <span class="category-type ${c.type === 'income' ? 'type-income' : 'type-expense'}">${c.type === 'income' ? 'Receita' : 'Despesa'}</span>
      ${c.builtin ? '<span class="category-badge">Padrão</span>' : ''}
      <div class="tx-actions">
        <button type="button" class="tx-action-btn edit-cat" data-dbid="${c.dbId}" data-id="${escAttr(c.id)}" title="Editar">✏️</button>
        ${c.builtin ? '' : `<button type="button" class="tx-action-btn delete delete-cat" data-dbid="${c.dbId}" data-id="${escAttr(c.id)}" title="Remover">🗑️</button>`}
      </div>
    </div>`).join('');

  container.querySelectorAll('.edit-cat').forEach(btn => {
    btn.addEventListener('click', () => {
      const dbId = parseInt(btn.dataset.dbid);
      const c = userCategories.find(x => x.dbId === dbId) || getAllCategories().find(x => x.id === btn.dataset.id);
      if (!c) return;
      editingCategoryDbId = dbId;
      document.getElementById('newCategoryName').value = c.label;
      document.getElementById('newCategoryType').value = c.type === 'income' ? 'income' : 'expense';
      document.getElementById('newCategoryIcon').value = catIcon(c);
      document.getElementById('newCategoryColor').value = catColor(c);
      document.getElementById('categoryFormSubmit').textContent = 'Salvar Alterações';
      document.getElementById('categoryFormCancel').style.display = 'inline-block';
      document.getElementById('newCategoryName').focus();
      document.querySelector('#page-settings .settings-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  container.querySelectorAll('.delete-cat').forEach(btn => {
    btn.addEventListener('click', async () => {
      const dbId = parseInt(btn.dataset.dbid);
      const c = userCategories.find(x => x.dbId === dbId) || getAllCategories().find(x => x.id === btn.dataset.id);
      const ok = await customConfirm(`Remover a categoria "${c ? c.label : ''}"? Lançamentos existentes mantêm o valor salvo.`, '🏷️', 'Remover Categoria');
      if (!ok) return;
      try {
        await API.deleteCategory(dbId);
        userCategories = userCategories.filter(x => x.dbId !== dbId);
        resetCategoryForm();
        renderCategories();
        populateFilterCategorySelect();
        renderAll();
        showToast('Categoria removida.', 'info');
      } catch (e) {
        showToast(e.message || 'Erro ao remover.', 'error');
      }
    });
  });
}

function resetCategoryForm() {
  editingCategoryDbId = null;
  document.getElementById('categoryForm').reset();
  document.getElementById('newCategoryIcon').value = '💰';
  document.getElementById('newCategoryColor').value = '#6c63ff';
  document.getElementById('categoryFormSubmit').textContent = 'Adicionar';
  document.getElementById('categoryFormCancel').style.display = 'none';
}

async function saveCategoryFromForm() {
  const label = document.getElementById('newCategoryName').value.trim();
  if (!label) {
    showToast('Informe o nome da categoria.', 'error');
    return;
  }
  const type = document.getElementById('newCategoryType').value;
  const icon = document.getElementById('newCategoryIcon').value.trim();
  const color = document.getElementById('newCategoryColor').value;
  try {
    if (editingCategoryDbId) {
      const updated = await API.updateCategory(editingCategoryDbId, { label, type, icon, color });
      const idx = userCategories.findIndex(x => x.dbId === editingCategoryDbId);
      if (idx !== -1) userCategories[idx] = { ...userCategories[idx], ...updated, dbId: editingCategoryDbId, builtin: userCategories[idx].builtin };
      showToast('Categoria atualizada!', 'success');
    } else {
      const created = await API.createCategory({ label, type, icon, color });
      userCategories.push(created);
      showToast('Categoria adicionada!', 'success');
    }
    resetCategoryForm();
    renderCategories();
    populateFilterCategorySelect();
    renderAll();
  } catch (e) {
    showToast(e.message || 'Erro ao salvar categoria.', 'error');
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  initTopbar();
  initNav();
  initConfirmModal();
  initTransactionModal();
  initBudgetModal();
  initGoalModal();
  initSettings();
  initFilters();

  await loadAllData();

  setUserInfo();
  document.getElementById('profileName').value = userProfile.name;
  document.getElementById('profileEmail').value = userProfile.email;
  updateAvatarPreview(userProfile.avatar);
  renderMembers();
  renderAll();
});

/* CUSTOM CONFIRM MODAL */
let _confirmResolve = null;

function initConfirmModal() {
  document.getElementById('confirmOk').addEventListener('click', () => {
    document.getElementById('confirmModal').classList.remove('open');
    if (_confirmResolve) { _confirmResolve(true); _confirmResolve = null; }
  });
  document.getElementById('confirmCancel').addEventListener('click', () => {
    document.getElementById('confirmModal').classList.remove('open');
    if (_confirmResolve) { _confirmResolve(false); _confirmResolve = null; }
  });
}

function customConfirm(msg = 'Tem certeza?', icon = '🗑️', title = 'Confirmar exclusão') {
  document.getElementById('confirmIcon').textContent = icon;
  document.getElementById('confirmTitle').textContent = title;
  document.getElementById('confirmMsg').textContent = msg;
  document.getElementById('confirmModal').classList.add('open');
  return new Promise(resolve => { _confirmResolve = resolve; });
}

/* TOPBAR & NAV */
function initTopbar() {
  updateMonthLabel();
  updatePageDate();

  document.getElementById('prevMonth').addEventListener('click', () => {
    currentMonth--;
    if (currentMonth < 0) { currentMonth = 11; currentYear--; }
    updateMonthLabel();
    renderAll();
  });
  document.getElementById('nextMonth').addEventListener('click', () => {
    currentMonth++;
    if (currentMonth > 11) { currentMonth = 0; currentYear++; }
    updateMonthLabel();
    renderAll();
  });

  document.getElementById('menuToggle').addEventListener('click', toggleSidebar);
  document.getElementById('sidebarClose').addEventListener('click', closeSidebar);
  document.getElementById('sidebarOverlay').addEventListener('click', closeSidebar);
}

function setUserInfo() {
  const name = userProfile.name || 'Usuário';
  document.getElementById('userNameSidebar').textContent = name;
  const initial = name[0].toUpperCase();

  const applyAvatar = (el) => {
    if (userProfile.avatar) {
      el.textContent = '';
      el.style.backgroundImage = `url(${userProfile.avatar})`;
      el.style.backgroundSize = 'cover';
    } else {
      el.textContent = initial;
      el.style.backgroundImage = 'linear-gradient(135deg, var(--accent), #a78bfa)';
    }
  };

  applyAvatar(document.getElementById('userAvatarSidebar'));
  applyAvatar(document.getElementById('topbarAvatar'));
}

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

function updateMonthLabel() {
  document.getElementById('monthLabel').textContent = `${MONTHS[currentMonth]} ${currentYear}`;
}

function updatePageDate() {
  const now = new Date();
  document.getElementById('pageDate').textContent = now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  sidebar.classList.toggle('open');
  overlay.style.display = sidebar.classList.contains('open') ? 'block' : 'none';
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').style.display = 'none';
}

function initNav() {
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      showPage(btn.dataset.page);
      closeSidebar();
    });
  });
}

function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  document.getElementById(`page-${name}`).classList.add('active');
  document.getElementById(`nav-${name}`).classList.add('active');

  const titles = { dashboard: 'Dashboard', transactions: 'Transações', budget: 'Orçamento', goals: 'Metas', reports: 'Relatórios', settings: 'Configurações' };
  document.getElementById('pageTitle').textContent = titles[name] || name;

  if (name === 'reports') renderAnnualChart();
}

/* RENDER ALL */
function renderAll() {
  renderCards();
  renderCashflowChart();
  renderCategoryChart();
  renderRecentTransactions();
  renderAllTransactions();
  renderBudgets();
  renderGoals();
  renderReportStats();
}

/* DASHBOARD CARDS */
function renderCards() {
  const txs = getMonthTransactions();
  const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;
  const rate = income > 0 ? Math.max(0, Math.min(100, ((income - expense) / income) * 100)) : 0;

  document.getElementById('totalBalance').textContent = fmtCurrency(balance);
  document.getElementById('totalIncome').textContent = fmtCurrency(income);
  document.getElementById('totalExpense').textContent = fmtCurrency(expense);
  document.getElementById('savingsRate').textContent = rate.toFixed(1) + '%';
  document.getElementById('savingsFill').style.width = rate + '%';

  const incomeCount = txs.filter(t => t.type === 'income').length;
  const expenseCount = txs.filter(t => t.type === 'expense').length;
  document.getElementById('incomeCount').textContent = `${incomeCount} entrada${incomeCount !== 1 ? 's' : ''}`;
  document.getElementById('expenseCount').textContent = `${expenseCount} saída${expenseCount !== 1 ? 's' : ''}`;
  const trendEl = document.getElementById('monthTrendLabel');
  if (trendEl) trendEl.textContent = MONTHS[currentMonth];
}

/* CASHFLOW CHART (Bar) */
function renderCashflowChart() {
  const labels = [];
  const incomeData = [];
  const expenseData = [];

  for (let i = 5; i >= 0; i--) {
    let m = currentMonth - i;
    let y = currentYear;
    if (m < 0) { m += 12; y--; }
    labels.push(MONTHS[m].substr(0, 3));
    const txs = transactions.filter(t => { const d = new Date(t.date + 'T00:00:00'); return d.getMonth() === m && d.getFullYear() === y; });
    incomeData.push(txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0));
    expenseData.push(txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0));
  }

  const ctx = document.getElementById('cashflowChart').getContext('2d');
  if (cashflowChart) cashflowChart.destroy();

  cashflowChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Receitas',
          data: incomeData,
          backgroundColor: 'rgba(16,217,160,0.5)',
          borderColor: 'rgba(16,217,160,0.9)',
          borderWidth: 2,
          borderRadius: 6,
          borderSkipped: false,
        },
        {
          label: 'Despesas',
          data: expenseData,
          backgroundColor: 'rgba(255,92,124,0.5)',
          borderColor: 'rgba(255,92,124,0.9)',
          borderWidth: 2,
          borderRadius: 6,
          borderSkipped: false,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { ...tooltipStyle() } },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#8a8fb5', font: { size: 11 } } },
        y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#8a8fb5', font: { size: 11 }, callback: v => 'R$' + (v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v) } }
      }
    }
  });
}

/* CATEGORY DONUT CHART */
function renderCategoryChart() {
  const txs = getMonthTransactions().filter(t => t.type === 'expense');
  const byCategory = {};
  txs.forEach(t => {
    byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
  });

  const sorted = Object.entries(byCategory).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const labels = sorted.map(([id]) => getCategoryById(id).label);
  const data = sorted.map(([, v]) => v);
  const colors = sorted.map(([id]) => getCategoryById(id).color);
  const total = data.reduce((s, v) => s + v, 0);

  document.getElementById('donutTotal').textContent = fmtCurrency(total);

  const ctx = document.getElementById('categoryChart').getContext('2d');
  if (categoryChart) categoryChart.destroy();

  if (data.length === 0) {
    categoryChart = null;
    return;
  }

  categoryChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colors.map(c => c + 'cc'),
        borderColor: colors,
        borderWidth: 2,
        hoverOffset: 6,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '68%',
      plugins: {
        legend: { display: false },
        tooltip: { ...tooltipStyle(), callbacks: { label: ctx => ` ${ctx.label}: ${fmtCurrency(ctx.raw)}` } }
      }
    }
  });
}

/* ANNUAL CHART (Line) */
function renderAnnualChart() {
  const labels = MONTHS.map(m => m.substr(0, 3));
  const incomeData = [];
  const expenseData = [];
  const balanceData = [];

  for (let m = 0; m < 12; m++) {
    const txs = transactions.filter(t => { const d = new Date(t.date + 'T00:00:00'); return d.getMonth() === m && d.getFullYear() === currentYear; });
    const inc = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const exp = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    incomeData.push(inc);
    expenseData.push(exp);
    balanceData.push(inc - exp);
  }

  const ctx = document.getElementById('annualChart').getContext('2d');
  if (annualChart) annualChart.destroy();

  annualChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Receitas',
          data: incomeData,
          borderColor: '#10d9a0',
          backgroundColor: 'rgba(16,217,160,0.1)',
          borderWidth: 2.5,
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#10d9a0',
          pointRadius: 4,
        },
        {
          label: 'Despesas',
          data: expenseData,
          borderColor: '#ff5c7c',
          backgroundColor: 'rgba(255,92,124,0.1)',
          borderWidth: 2.5,
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#ff5c7c',
          pointRadius: 4,
        },
        {
          label: 'Saldo',
          data: balanceData,
          borderColor: '#6c63ff',
          backgroundColor: 'rgba(108,99,255,0.08)',
          borderWidth: 2.5,
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#6c63ff',
          pointRadius: 4,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          labels: { color: '#8a8fb5', font: { size: 12 }, boxWidth: 12, padding: 20 }
        },
        tooltip: { ...tooltipStyle() }
      },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#8a8fb5', font: { size: 11 } } },
        y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#8a8fb5', font: { size: 11 }, callback: v => 'R$' + (v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v) } }
      }
    }
  });
}

function tooltipStyle() {
  return {
    backgroundColor: '#1a1e35',
    borderColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    titleColor: '#eef0ff',
    bodyColor: '#8a8fb5',
    padding: 10,
    cornerRadius: 8,
  };
}

/* RECENT TRANSACTIONS */
function renderRecentTransactions() {
  const txs = getMonthTransactions().sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6);
  const container = document.getElementById('recentTransactions');
  container.innerHTML = txs.length === 0 ? emptyState('💸', 'Nenhuma transação este mês.', true) : txs.map(txHTML).join('');
  attachTxActions(container);
}

function renderAllTransactions() {
  const search = (document.getElementById('searchInput')?.value || '').toLowerCase().trim();
  const placeF = (document.getElementById('filterPlace')?.value || '').toLowerCase().trim();
  const dateFrom = document.getElementById('filterDateFrom')?.value || '';
  const dateTo = document.getElementById('filterDateTo')?.value || '';
  const typeF = document.getElementById('filterType')?.value || '';
  const catF = document.getElementById('filterCategory')?.value || '';
  const pmF = document.getElementById('filterPaymentMethod')?.value || '';

  let txs = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));

  if (search) {
    txs = txs.filter(t => {
      const haystack = [
        t.description.toLowerCase(),
        t.place || '',
        t.payment_method || '',
        getCategoryById(t.category).label.toLowerCase(),
        ...(t.items || []).map(i => i.description.toLowerCase()),
        ...(t.items || []).map(i => i.brand || ''),
        ...(t.items || []).map(i => i.unit || ''),
        ...(t.items || []).map(i => getCategoryById(i.category).label.toLowerCase()),
      ].join(' ');
      return haystack.includes(search);
    });
  }
  if (placeF) txs = txs.filter(t => (t.place || t.description || '').toLowerCase().includes(placeF));
  if (dateFrom) txs = txs.filter(t => t.date >= dateFrom);
  if (dateTo) txs = txs.filter(t => t.date <= dateTo);
  if (typeF) txs = txs.filter(t => t.type === typeF);
  if (catF) {
    txs = txs.filter(t => t.category === catF || (t.items || []).some(i => i.category === catF));
  }
  if (pmF) txs = txs.filter(t => (t.payment_method || '') === pmF);

  const countEl = document.getElementById('filterCount');
  if (countEl) countEl.textContent = `${txs.length} resultado${txs.length !== 1 ? 's' : ''}`;

  const container = document.getElementById('allTransactions');
  container.innerHTML = txs.length === 0 ? emptyState('📋', 'Nenhuma transação encontrada.') : txs.map(txHTML).join('');
  attachTxActions(container);
  renderAggregations(txs);
}

function aggregateItems(txs) {
  const map = {};
  txs.filter(t => t.type === 'expense').forEach(t => {
    (t.items || []).forEach(i => {
      const name = String(i.description || '').trim();
      if (!name) return;
      if (!map[name]) map[name] = { name, total: 0, count: 0, unit: i.unit || '' };
      map[name].total += Number(i.amount) || 0;
      map[name].count++;
    });
  });
  return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 6);
}

function aggregateBy(txs, keyFn) {
  const map = {};
  txs.filter(t => t.type === 'expense').forEach(t => {
    const name = String(keyFn(t) || '').trim() || 'Sem local';
    if (!map[name]) map[name] = { name, total: 0, count: 0 };
    map[name].total += Number(t.amount) || 0;
    map[name].count++;
  });
  return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 6);
}

function renderTopList(id, list) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = list.length ? list.map((x, i) => `
    <div class="agg-row">
      <span class="agg-rank">${i + 1}</span>
      <span class="agg-name">${escHtml(x.name)}${x.unit && x.unit !== 'un' ? ` <small>${escHtml(x.unit)}</small>` : ''}${x.count > 1 ? ` <small>×${x.count}</small>` : ''}</span>
      <span class="agg-total">${fmtCurrency(x.total)}</span>
    </div>`).join('') : '<span class="agg-empty">Sem dados no filtro atual.</span>';
}

function renderAggregations(txs) {
  const panel = document.getElementById('aggPanel');
  if (!panel) return;
  const exps = txs.filter(t => t.type === 'expense');
  const incs = txs.filter(t => t.type === 'income');
  document.getElementById('aggTotalExpense').textContent = fmtCurrency(exps.reduce((s, t) => s + t.amount, 0));
  document.getElementById('aggTotalIncome').textContent = fmtCurrency(incs.reduce((s, t) => s + t.amount, 0));
  document.getElementById('aggCount').textContent = String(txs.length);
  renderTopList('aggTopProducts', aggregateItems(txs));
  renderTopList('aggTopPlaces', aggregateBy(txs, t => t.place || t.description));
  renderTopList('aggTopCategories', aggregateBy(txs, t => `${getCategoryById(t.category).icon} ${getCategoryById(t.category).label}`));
}

function txHTML(t) {
  const cat = getCategoryById(t.category);
  const sign = t.type === 'income' ? '+' : '-';
  const color = t.type === 'income' ? 'var(--income)' : 'var(--expense)';
  const items = (t.items && t.items.length) ? t.items : [];
  const itemMeta = items.length > 1 ? ` · ${items.length} itens` : '';
  const pm = t.payment_method ? `<span class="pm-badge">💳 ${escHtml(t.payment_method)}</span>` : '';
  const place = t.place && t.place !== t.description ? `<div class="tx-place">📍 ${escHtml(t.place)}</div>` : '';
  const itemsHTML = items.length > 1 ? `
    <div class="tx-items-toggle">
      <button type="button" class="tx-items-btn" data-id="${t.id}">Ver itens (${items.length}) ▾</button>
      <div class="tx-items-list" id="txItems-${t.id}" style="display:none;">
        ${items.map(i => {
          const icat = getCategoryById(i.category);
          const qty = i.quantity && Number(i.quantity) !== 1 ? `${i.quantity}× ` : '';
          const unit = i.unit && i.unit !== 'un' ? ` ${escHtml(i.unit)}` : '';
          const unitRef = (i.unitPrice || i.unitPrice === 0) ? `${fmtCurrency(i.unitPrice)}${unit}` : '';
          const disc = i.discount ? ` · -${fmtCurrency(i.discount)}` : '';
          const brand = i.brand ? ` · ${escHtml(i.brand)}` : '';
          return `<div class="tx-item-line"><span>${escHtml(i.description)} <em>${icat.label}</em><small>${qty}${unitRef}${brand}${disc}</small></span><span>${fmtCurrency(i.amount)}</span></div>`;
        }).join('')}
        <div class="tx-item-line tx-item-total"><span>Total</span><span>${fmtCurrency(t.amount)}</span></div>
      </div>
    </div>` : '';
  return `
    <div class="tx-item" data-id="${t.id}">
      <div class="tx-icon" style="background:${cat.color}22; color:${cat.color};">${cat.icon}</div>
      <div class="tx-info">
        <div class="tx-desc">${escHtml(t.description)}</div>
        <div class="tx-meta">${cat.label}${itemMeta}${t.note ? ' · ' + escHtml(t.note) : ''}</div>
        ${pm}
        ${place}
        ${itemsHTML}
      </div>
      <div class="tx-amount-col">
        <div class="tx-amount" style="color:${color}">${sign} ${fmtCurrency(t.amount)}</div>
        <div class="tx-date-label">${fmtDate(t.date)}</div>
      </div>
      <div class="tx-actions">
        <button class="tx-action-btn edit-tx" data-id="${t.id}">✏️</button>
        <button class="tx-action-btn delete delete-tx" data-id="${t.id}">🗑️</button>
      </div>
    </div>`;
}

function attachTxActions(container) {
  container.querySelectorAll('.edit-tx').forEach(btn => {
    btn.addEventListener('click', (e) => { e.stopPropagation(); editTransaction(btn.dataset.id); });
  });
  container.querySelectorAll('.delete-tx').forEach(btn => {
    btn.addEventListener('click', (e) => { e.stopPropagation(); deleteTransaction(btn.dataset.id); });
  });
  container.querySelectorAll('.tx-items-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const list = document.getElementById('txItems-' + btn.dataset.id);
      if (!list) return;
      const hidden = list.style.display === 'none';
      list.style.display = hidden ? 'block' : 'none';
      btn.textContent = hidden ? `Ocultar itens (${list.querySelectorAll('.tx-item-line').length - 1}) ▴` : `Ver itens (${list.querySelectorAll('.tx-item-line').length - 1}) ▾`;
    });
  });
}

function emptyState(icon, msg, withBtn = false) {
  return `<div class="empty-state">
    <div class="empty-icon">${icon}</div>
    <p>${msg}</p>
    ${withBtn ? `<button class="btn-primary small" onclick="document.getElementById('addTransactionBtn').click()">Adicionar transação</button>` : ''}
  </div>`;
}

function escHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escAttr(str) {
  return escHtml(str).replace(/'/g, '&#39;');
}

/* TRANSACTION MODAL */
function initTransactionModal() {
  const modal = document.getElementById('transactionModal');
  const form = document.getElementById('transactionForm');
  const openBtn = document.getElementById('addTransactionBtn');

  openBtn.addEventListener('click', () => openTransactionModal());
  document.getElementById('closeTransactionModal').addEventListener('click', closeTransactionModal);
  document.getElementById('cancelTransaction').addEventListener('click', closeTransactionModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeTransactionModal(); });

  document.getElementById('typeIncome').addEventListener('click', () => setTransactionType('income'));
  document.getElementById('typeExpense').addEventListener('click', () => setTransactionType('expense'));

  document.getElementById('addItemBtn').addEventListener('click', () => addItemRow());

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    saveTransactionFromForm();
  });

  document.getElementById('txDate').value = new Date().toISOString().split('T')[0];
}

const UNITS = ['un', 'kg', 'g', 'L', 'mL', 'dúzia', 'pacote', 'lata', 'caixa', 'cx', 'pct'];

function itemCategoryOptions() {
  const seen = new Set();
  const opts = [];
  getAllCategories().forEach(c => {
    if (seen.has(c.id)) return;
    seen.add(c.id);
    opts.push(c);
  });
  return opts;
}

function itemRowHTML(item = {}) {
  const description = item.description || '';
  const brand = item.brand || '';
  const category = item.category || '';
  const qty = item.quantity != null ? item.quantity : 1;
  const unit = item.unit || 'un';
  const price = item.unitPrice != null ? item.unitPrice : (item.amount != null && qty ? round2(item.amount / qty) : '');
  const discount = item.discount || '';
  const discountType = item.discountType || 'amount';
  const catOpts = itemCategoryOptions().map(c => `<option value="${escAttr(c.id)}" ${c.id === category ? 'selected' : ''}>${c.icon} ${escHtml(c.label)}</option>`).join('');
  const unitOpts = UNITS.filter(u => u !== 'un').map(u => `<option value="${u}" ${u === unit ? 'selected' : ''}>${u}</option>`).join('');
  return `
    <div class="item-row">
      <div class="item-field item-field-desc">
        <input type="text" class="item-description" placeholder="Produto" value="${escAttr(description)}" />
      </div>
      <div class="item-field item-field-brand">
        <input type="text" class="item-brand" placeholder="Marca" value="${escAttr(brand)}" />
      </div>
      <div class="item-field item-field-cat">
        <select class="item-category">
          <option value="">Categoria</option>
          ${catOpts}
        </select>
      </div>
      <div class="item-field item-field-qty">
        <input type="number" class="item-qty" placeholder="Qtd" step="0.001" min="0.001" value="${qty}" />
      </div>
      <div class="item-field item-field-unit">
        <select class="item-unit">
          <option value="un" ${unit === 'un' ? 'selected' : ''}>un</option>
          ${unitOpts}
        </select>
      </div>
      <div class="item-field item-field-price">
        <input type="number" class="item-price" placeholder="Vlr unit" step="0.01" min="0" value="${price}" />
      </div>
      <div class="item-field item-field-discount">
        <input type="number" class="item-discount" placeholder="Desconto" step="0.01" min="0" value="${discount}" />
        <button type="button" class="discount-toggle" title="Alternar R$ / %">${discountType === 'percent' ? '%' : 'R$'}</button>
      </div>
      <div class="item-field item-field-itemtotal">
        <span class="item-line-total">R$ 0,00</span>
      </div>
      <button type="button" class="item-remove" title="Remover item">✕</button>
    </div>`;
}

function addItemRow(item = {}) {
  const list = document.getElementById('itemsList');
  const row = document.createElement('div');
  row.innerHTML = itemRowHTML(item);
  const node = row.firstElementChild;

  node.querySelector('.item-remove').addEventListener('click', () => {
    node.remove();
    updateItemsTotal();
  });
  const toggle = node.querySelector('.discount-toggle');
  if (toggle) {
    toggle.addEventListener('click', () => {
      toggle.textContent = toggle.textContent === '%' ? 'R$' : '%';
      updateItemsTotal();
    });
  }
  node.querySelectorAll('input, select').forEach(inp => inp.addEventListener('input', updateItemsTotal));
  list.appendChild(node);
  updateItemsTotal();
}

function readItemRow(row) {
  const description = row.querySelector('.item-description').value.trim();
  const brand = row.querySelector('.item-brand').value.trim();
  const category = row.querySelector('.item-category').value;
  const quantity = parseFloat(row.querySelector('.item-qty').value);
  const qty = !isNaN(quantity) && quantity > 0 ? quantity : 1;
  const unit = row.querySelector('.item-unit').value || 'un';
  const price = parseFloat(row.querySelector('.item-price').value);
  const unitPrice = !isNaN(price) && price >= 0 ? price : 0;
  const discount = parseFloat(row.querySelector('.item-discount').value) || 0;
  const discountType = row.querySelector('.discount-toggle').textContent === '%' ? 'percent' : 'amount';
  const rawAmount = qty * unitPrice;
  const discountAmount = discountType === 'percent' ? round2(rawAmount * discount / 100) : round2(discount);
  const amount = round2(Math.max(0, rawAmount - discountAmount));
  return { description, brand, category, quantity: qty, unit, unitPrice: round2(unitPrice), discount: round2(discount), discountType, amount };
}

function collectItems() {
  const rows = document.querySelectorAll('#itemsList .item-row');
  const items = [];
  rows.forEach(row => {
    const it = readItemRow(row);
    if (it.description && it.category && it.amount > 0) {
      items.push(it);
    }
  });
  return items;
}

function updateItemsTotal() {
  let total = 0;
  document.querySelectorAll('#itemsList .item-row').forEach(row => {
    const it = readItemRow(row);
    const lineTotal = row.querySelector('.item-line-total');
    if (lineTotal) lineTotal.textContent = fmtCurrency(it.amount);
    total += it.amount;
  });
  const totalEl = document.getElementById('itemsTotal');
  if (totalEl) totalEl.textContent = fmtCurrency(total);
}

function openTransactionModal(tx = null) {
  editingId = tx ? tx.id : null;
  document.getElementById('modalTitle').textContent = tx ? 'Editar Lançamento' : 'Novo Lançamento';
  document.getElementById('editId').value = tx ? tx.id : '';

  const type = tx ? tx.type : 'income';
  setTransactionType(type);

  document.getElementById('txDescription').value = tx ? tx.description : '';
  document.getElementById('txPlace').value = tx ? (tx.place || '') : '';
  document.getElementById('txDate').value = tx ? tx.date : new Date().toISOString().split('T')[0];
  document.getElementById('txNote').value = tx ? (tx.note || '') : '';
  document.getElementById('txPaymentMethod').value = tx ? (tx.payment_method || '') : '';

  const itemsList = document.getElementById('itemsList');
  itemsList.innerHTML = '';
  const items = (tx && tx.items && tx.items.length) ? tx.items : [{}];
  items.forEach(item => addItemRow(item));

  document.getElementById('transactionModal').classList.add('open');
  document.getElementById('txDescription').focus();
}

function closeTransactionModal() {
  document.getElementById('transactionModal').classList.remove('open');
  document.getElementById('transactionForm').reset();
  document.getElementById('itemsList').innerHTML = '';
  editingId = null;
}

function setTransactionType(type) {
  currentType = type;
  document.getElementById('typeIncome').classList.toggle('active', type === 'income');
  document.getElementById('typeIncome').classList.toggle('income-btn', type === 'income');
  document.getElementById('typeExpense').classList.toggle('active', type === 'expense');
  document.getElementById('typeExpense').classList.toggle('expense-btn', type === 'expense');
}

function populateCategorySelect(selectId, type) {
  const sel = document.getElementById(selectId);
  const prevVal = sel.value;
  sel.innerHTML = '<option value="">Selecione...</option>';
  const all = getAllCategories();
  const opts = type ? all.filter(c => c.type === type) : all;
  const seen = new Set();
  opts.forEach(c => {
    if (seen.has(c.id)) return;
    seen.add(c.id);
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = `${c.icon} ${c.label}`;
    sel.appendChild(opt);
  });
  if (prevVal) sel.value = prevVal;
}

async function saveTransactionFromForm() {
  const txData = {
    type: currentType,
    description: document.getElementById('txDescription').value.trim(),
    place: document.getElementById('txPlace').value.trim(),
    date: document.getElementById('txDate').value,
    note: document.getElementById('txNote').value.trim(),
    payment_method: document.getElementById('txPaymentMethod').value,
    items: collectItems(),
  };
  if (!txData.description || !txData.date || txData.items.length === 0) {
    showToast('Preencha a descrição, data e ao menos um item válido.', 'error');
    return;
  }

  try {
    if (editingId) {
      const updated = await API.updateTransaction(editingId, txData);
      const idx = transactions.findIndex(t => t.id == editingId);
      if (idx !== -1) transactions[idx] = updated;
      showToast('Lançamento atualizado!', 'success');
    } else {
      const newTx = await API.createTransaction(txData);
      transactions.unshift(newTx);
      showToast('Lançamento adicionado!', 'success');
    }
    closeTransactionModal();
    renderAll();
  } catch (e) {
    showToast('Erro ao salvar lançamento.', 'error');
  }
}

function editTransaction(id) {
  const numId = parseInt(id);
  const tx = transactions.find(t => t.id === numId);
  if (tx) openTransactionModal(tx);
}

async function deleteTransaction(id) {
  const numId = parseInt(id);
  const tx = transactions.find(t => t.id === numId);
  const name = tx ? tx.description : 'esta transação';
  const ok = await customConfirm(`Excluir "${name}"? Esta ação não pode ser desfeita.`, '🗑️', 'Excluir Transação');
  if (!ok) return;

  try {
    await API.deleteTransaction(numId);
    transactions = transactions.filter(t => t.id !== numId);
    renderAll();
    showToast('Transação excluída.', 'info');
  } catch (e) {
    showToast('Erro ao excluir transação.', 'error');
  }
}

/* FILTERS */
function initFilters() {
  populateFilterCategorySelect();

  document.getElementById('searchInput').addEventListener('input', renderAllTransactions);
  document.getElementById('filterPlace').addEventListener('input', renderAllTransactions);
  document.getElementById('filterDateFrom').addEventListener('change', renderAllTransactions);
  document.getElementById('filterDateTo').addEventListener('change', renderAllTransactions);
  document.getElementById('filterType').addEventListener('change', renderAllTransactions);
  document.getElementById('filterCategory').addEventListener('change', renderAllTransactions);
  document.getElementById('filterPaymentMethod').addEventListener('change', renderAllTransactions);
  document.getElementById('clearFiltersBtn').addEventListener('click', clearFilters);
}

function clearFilters() {
  document.getElementById('searchInput').value = '';
  document.getElementById('filterPlace').value = '';
  document.getElementById('filterDateFrom').value = '';
  document.getElementById('filterDateTo').value = '';
  document.getElementById('filterType').value = '';
  document.getElementById('filterCategory').value = '';
  document.getElementById('filterPaymentMethod').value = '';
  renderAllTransactions();
}

/* BUDGET MODAL */
function initBudgetModal() {
  document.getElementById('addBudgetBtn').addEventListener('click', openBudgetModal);
  document.getElementById('closeBudgetModal').addEventListener('click', closeBudgetModal);
  document.getElementById('cancelBudget').addEventListener('click', closeBudgetModal);
  document.getElementById('budgetModal').addEventListener('click', (e) => { if (e.target.id === 'budgetModal') closeBudgetModal(); });
  document.getElementById('budgetForm').addEventListener('submit', (e) => { e.preventDefault(); saveBudget(); });
  populateCategorySelect('budgetCategory', 'expense');
}

function openBudgetModal(budget = null) {
  editingBudgetId = budget ? budget.id : null;
  document.getElementById('editBudgetId').value = budget ? budget.id : '';
  document.getElementById('budgetCategory').value = budget ? budget.category : '';
  document.getElementById('budgetLimit').value = budget ? budget.limit : '';
  document.getElementById('budgetModal').classList.add('open');
}

function closeBudgetModal() {
  document.getElementById('budgetModal').classList.remove('open');
  document.getElementById('budgetForm').reset();
  editingBudgetId = null;
}

async function saveBudget() {
  const budgetData = {
    category: document.getElementById('budgetCategory').value,
    limit: parseFloat(document.getElementById('budgetLimit').value),
  };
  if (!budgetData.category || !budgetData.limit) return;

  try {
    if (editingBudgetId) {
      const updated = await API.updateBudget(editingBudgetId, budgetData);
      const idx = budgets.findIndex(b => b.id === editingBudgetId);
      if (idx !== -1) budgets[idx] = updated;
      showToast('Orçamento atualizado!', 'success');
    } else {
      const newB = await API.createBudget(budgetData);
      budgets.push(newB);
      showToast('Orçamento criado!', 'success');
    }
    closeBudgetModal();
    renderBudgets();
  } catch (e) {
    showToast(e.message || 'Erro ao salvar orçamento.', 'error');
  }
}

function renderBudgets() {
  const txs = getMonthTransactions().filter(t => t.type === 'expense');
  const container = document.getElementById('budgetList');

  if (budgets.length === 0) {
    container.innerHTML = emptyState('🎯', 'Nenhum orçamento definido ainda.');
    return;
  }

  container.innerHTML = budgets.map(b => {
    const cat = getCategoryById(b.category);
    const spent = txs.filter(t => t.category === b.category).reduce((s, t) => s + t.amount, 0);
    const pct = Math.min(100, (spent / b.limit) * 100);
    const cls = pct >= 90 ? 'danger' : pct >= 70 ? 'warn' : 'safe';
    const remaining = b.limit - spent;

    return `
      <div class="budget-item" data-id="${b.id}">
        <div class="budget-item-header">
          <div class="budget-cat-info">
            <div class="budget-cat-icon" style="background:${cat.color}22; color:${cat.color};">${cat.icon}</div>
            <span class="budget-cat-name">${cat.label}</span>
          </div>
          <div style="display:flex; align-items:center; gap:12px;">
            <div class="budget-amounts">
              <span class="budget-spent">${fmtCurrency(spent)}</span>
              <span class="budget-sep">/</span>
              <span class="budget-limit">${fmtCurrency(b.limit)}</span>
            </div>
            <div class="budget-actions">
              <button class="tx-action-btn edit-budget" data-id="${b.id}">✏️</button>
              <button class="tx-action-btn delete delete-budget" data-id="${b.id}">🗑️</button>
            </div>
          </div>
        </div>
        <div class="budget-progress">
          <div class="progress-bar">
            <div class="progress-fill ${cls}" style="width:${pct}%"></div>
          </div>
        </div>
        <div class="budget-item-footer">
          <span class="budget-pct">${pct.toFixed(0)}% utilizado</span>
          <span class="budget-remaining">${remaining >= 0 ? fmtCurrency(remaining) + ' restante' : '⚠️ Excedeu ' + fmtCurrency(-remaining)}</span>
        </div>
      </div>`;
  }).join('');

  container.querySelectorAll('.edit-budget').forEach(btn => {
    btn.addEventListener('click', () => {
      const numId = parseInt(btn.dataset.id);
      const b = budgets.find(x => x.id === numId);
      if (b) openBudgetModal(b);
    });
  });
  container.querySelectorAll('.delete-budget').forEach(btn => {
    btn.addEventListener('click', async () => {
      const numId = parseInt(btn.dataset.id);
      const b = budgets.find(x => x.id === numId);
      const cat = b ? getCategoryById(b.category).label : 'este orçamento';
      const ok = await customConfirm(`Excluir orçamento de "${cat}"?`, '🎯', 'Excluir Orçamento');
      if (!ok) return;

      try {
        await API.deleteBudget(numId);
        budgets = budgets.filter(x => x.id !== numId);
        renderBudgets();
        showToast('Orçamento excluído.', 'info');
      } catch (e) {
        showToast('Erro ao excluir orçamento.', 'error');
      }
    });
  });
}

/* GOAL MODAL */
function initGoalModal() {
  document.getElementById('addGoalBtn').addEventListener('click', openGoalModal);
  document.getElementById('closeGoalModal').addEventListener('click', closeGoalModal);
  document.getElementById('cancelGoal').addEventListener('click', closeGoalModal);
  document.getElementById('goalModal').addEventListener('click', (e) => { if (e.target.id === 'goalModal') closeGoalModal(); });
  document.getElementById('goalForm').addEventListener('submit', (e) => { e.preventDefault(); saveGoal(); });
}

function openGoalModal(goal = null) {
  editingGoalId = goal ? goal.id : null;
  document.getElementById('goalModalTitle').textContent = goal ? 'Editar Meta' : 'Nova Meta';
  document.getElementById('editGoalId').value = goal ? goal.id : '';
  document.getElementById('goalName').value = goal ? goal.name : '';
  document.getElementById('goalTarget').value = goal ? goal.target : '';
  document.getElementById('goalCurrent').value = goal ? goal.current : '0';
  document.getElementById('goalDeadline').value = goal ? (goal.deadline || '') : '';
  document.getElementById('goalIcon').value = goal ? goal.icon : '🏆';
  document.getElementById('goalModal').classList.add('open');
}

function closeGoalModal() {
  document.getElementById('goalModal').classList.remove('open');
  document.getElementById('goalForm').reset();
  editingGoalId = null;
}

async function saveGoal() {
  const goalData = {
    name: document.getElementById('goalName').value.trim(),
    icon: document.getElementById('goalIcon').value,
    target: parseFloat(document.getElementById('goalTarget').value),
    current: parseFloat(document.getElementById('goalCurrent').value || '0'),
    deadline: document.getElementById('goalDeadline').value || null,
  };
  if (!goalData.name || !goalData.target) return;

  try {
    if (editingGoalId) {
      const updated = await API.updateGoal(editingGoalId, goalData);
      const idx = goals.findIndex(g => g.id === editingGoalId);
      if (idx !== -1) goals[idx] = updated;
      showToast('Meta atualizada!', 'success');
    } else {
      const newG = await API.createGoal(goalData);
      goals.push(newG);
      showToast('Meta criada!', 'success');
    }
    closeGoalModal();
    renderGoals();
  } catch (e) {
    showToast('Erro ao salvar meta.', 'error');
  }
}

function renderGoals() {
  const container = document.getElementById('goalsList');
  if (goals.length === 0) {
    container.innerHTML = emptyState('🏆', 'Nenhuma meta criada ainda.');
    return;
  }
  container.className = 'goals-grid';
  container.innerHTML = goals.map(g => {
    const pct = Math.min(100, (g.current / g.target) * 100);
    const deadlineStr = g.deadline ? `Prazo: ${fmtDate(g.deadline)}` : 'Sem prazo definido';
    return `
      <div class="goal-card" data-id="${g.id}">
        <div class="goal-card-header">
          <div class="goal-icon-wrap">${g.icon}</div>
          <div class="goal-actions">
            <button class="tx-action-btn edit-goal" data-id="${g.id}">✏️</button>
            <button class="tx-action-btn delete delete-goal" data-id="${g.id}">🗑️</button>
          </div>
        </div>
        <div class="goal-name">${escHtml(g.name)}</div>
        <div class="goal-amounts">
          <span class="goal-current">${fmtCurrency(g.current)}</span>
          <span class="goal-sep">/</span>
          <span class="goal-target">${fmtCurrency(g.target)}</span>
        </div>
        <div class="goal-progress-bar">
          <div class="goal-progress-fill" style="width:${pct}%"></div>
        </div>
        <div class="goal-footer">
          <span class="goal-pct">${pct.toFixed(0)}% concluído</span>
          <span class="goal-deadline">${deadlineStr}</span>
        </div>
      </div>`;
  }).join('');

  container.querySelectorAll('.edit-goal').forEach(btn => {
    btn.addEventListener('click', () => {
      const numId = parseInt(btn.dataset.id);
      const g = goals.find(x => x.id === numId);
      if (g) openGoalModal(g);
    });
  });
  container.querySelectorAll('.delete-goal').forEach(btn => {
    btn.addEventListener('click', async () => {
      const numId = parseInt(btn.dataset.id);
      const g = goals.find(x => x.id === numId);
      const name = g ? g.name : 'esta meta';
      const ok = await customConfirm(`Excluir a meta "${name}"?`, '🏆', 'Excluir Meta');
      if (!ok) return;

      try {
        await API.deleteGoal(numId);
        goals = goals.filter(x => x.id !== numId);
        renderGoals();
        showToast('Meta excluída.', 'info');
      } catch (e) {
        showToast('Erro ao excluir meta.', 'error');
      }
    });
  });
}

/* REPORT STATS */
function renderReportStats() {
  const incomes = transactions.filter(t => t.type === 'income');
  const expenses = transactions.filter(t => t.type === 'expense');

  const bigIncome = incomes.length ? Math.max(...incomes.map(t => t.amount)) : 0;
  const bigExpense = expenses.length ? Math.max(...expenses.map(t => t.amount)) : 0;

  const monthMap = {};
  expenses.forEach(t => {
    const key = t.date.substr(0, 7);
    monthMap[key] = (monthMap[key] || 0) + t.amount;
  });
  const monthVals = Object.values(monthMap);
  const avgExp = monthVals.length ? monthVals.reduce((s, v) => s + v, 0) / monthVals.length : 0;

  const yearInc = transactions.filter(t => { const d = new Date(t.date + 'T00:00:00'); return t.type === 'income' && d.getFullYear() === currentYear; }).reduce((s, t) => s + t.amount, 0);
  const yearExp = transactions.filter(t => { const d = new Date(t.date + 'T00:00:00'); return t.type === 'expense' && d.getFullYear() === currentYear; }).reduce((s, t) => s + t.amount, 0);

  document.getElementById('biggestIncome').textContent = fmtCurrency(bigIncome);
  document.getElementById('biggestExpense').textContent = fmtCurrency(bigExpense);
  document.getElementById('avgExpense').textContent = fmtCurrency(avgExp);
  document.getElementById('totalSaved').textContent = fmtCurrency(Math.max(0, yearInc - yearExp));
}

/* TOAST */
let toastTimeout;
function showToast(msg, type = 'info') {
  clearTimeout(toastTimeout);
  const toast = document.getElementById('toast');
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  toast.textContent = '';
  toast.className = `toast ${type}`;
  toast.textContent = icons[type] + ' ' + msg;
  toast.classList.add('show');
  toastTimeout = setTimeout(() => toast.classList.remove('show'), 3200);
}

/* SETTINGS & MEMBERS */
function initSettings() {
  document.getElementById('profileName').value = userProfile.name;
  document.getElementById('profileEmail').value = userProfile.email;
  updateAvatarPreview(userProfile.avatar);

  document.getElementById('profileForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('profileName').value.trim();
    const email = document.getElementById('profileEmail').value.trim();
    const avatar = userProfile.avatar || '';
    const currentPassword = document.getElementById('profileCurrentPassword').value;
    const newPassword = document.getElementById('profileNewPassword').value;

    try {
      const result = await API.updateProfile({ name, email, avatar, currentPassword, newPassword });
      userProfile = result.user;
      setUserInfo();
      document.getElementById('profileCurrentPassword').value = '';
      document.getElementById('profileNewPassword').value = '';
      showToast(newPassword ? 'Perfil e senha atualizados!' : 'Perfil atualizado com sucesso!', 'success');
    } catch (err) {
      showToast(err.message || 'Erro ao atualizar perfil.', 'error');
    }
  });

  document.getElementById('paymentMethodForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('newPaymentMethod');
    const name = input.value.trim();
    if (!name) return;
    try {
      const m = await API.createPaymentMethod(name);
      paymentMethods.push(m);
      input.value = '';
      renderPaymentMethods();
      populatePaymentMethodSelects();
      showToast('Forma de pagamento adicionada!', 'success');
    } catch (err) {
      showToast(err.message || 'Erro ao adicionar.', 'error');
    }
  });

  const avatarInput = document.getElementById('avatarInput');
  avatarInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        userProfile.avatar = e.target.result;
        updateAvatarPreview(userProfile.avatar);
      };
      reader.readAsDataURL(file);
    }
  });

  document.getElementById('removeAvatarBtn').addEventListener('click', () => {
    userProfile.avatar = '';
    avatarInput.value = '';
    updateAvatarPreview('');
  });

  document.getElementById('addMemberBtn').addEventListener('click', () => openMemberModal());
  document.getElementById('closeMemberModal').addEventListener('click', closeMemberModal);
  document.getElementById('cancelMember').addEventListener('click', closeMemberModal);
  document.getElementById('memberForm').addEventListener('submit', saveMember);

  renderEmojiPalette();
  renderCategories();
  document.getElementById('categoryForm').addEventListener('submit', (e) => {
    e.preventDefault();
    saveCategoryFromForm();
  });
  document.getElementById('categoryFormCancel').addEventListener('click', resetCategoryForm);

  renderMembers();
}

function updateAvatarPreview(src) {
  const container = document.getElementById('avatarPreviewContainer');
  const text = document.getElementById('avatarPreviewText');
  if (src) {
    container.style.backgroundImage = `url(${src})`;
    text.style.display = 'none';
  } else {
    container.style.backgroundImage = 'none';
    text.style.display = 'block';
    text.textContent = (userProfile.name || 'U')[0].toUpperCase();
  }
}

function openMemberModal(member = null) {
  document.getElementById('editMemberId').value = member ? member.id : '';
  document.getElementById('memberName').value = member ? member.name : '';
  document.getElementById('memberRelation').value = member ? member.relation : 'Esposa';
  document.getElementById('memberModalTitle').textContent = member ? 'Editar Membro' : 'Novo Membro';
  document.getElementById('memberModal').classList.add('open');
}

function closeMemberModal() {
  document.getElementById('memberModal').classList.remove('open');
  document.getElementById('memberForm').reset();
}

async function saveMember(e) {
  e.preventDefault();
  const id = document.getElementById('editMemberId').value;
  const name = document.getElementById('memberName').value.trim();
  const relation = document.getElementById('memberRelation').value;
  if (!name || !relation) return;

  try {
    if (id) {
      const numId = parseInt(id);
      const updated = await API.updateMember(numId, { name, relation });
      const idx = familyMembers.findIndex(m => m.id === numId);
      if (idx !== -1) familyMembers[idx] = updated;
      showToast('Membro atualizado!', 'success');
    } else {
      const newM = await API.createMember({ name, relation });
      familyMembers.push(newM);
      showToast('Membro adicionado!', 'success');
    }
    closeMemberModal();
    renderMembers();
  } catch (e) {
    showToast('Erro ao salvar membro.', 'error');
  }
}

function renderMembers() {
  const container = document.getElementById('membersList');
  if (familyMembers.length === 0) {
    container.innerHTML = emptyState('👨‍👩‍👦', 'Nenhum membro da família adicionado.');
    return;
  }

  container.innerHTML = familyMembers.map(m => `
    <div class="member-item">
      <div class="member-info">
        <div class="member-avatar">${m.name[0].toUpperCase()}</div>
        <div class="member-details">
          <span class="member-name">${escHtml(m.name)}</span>
          <span class="member-relation">${m.relation}</span>
        </div>
      </div>
      <div class="tx-actions">
        <button type="button" class="tx-action-btn edit-member" data-id="${m.id}">✏️</button>
        <button type="button" class="tx-action-btn delete delete-member" data-id="${m.id}">🗑️</button>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.edit-member').forEach(btn => {
    btn.addEventListener('click', () => {
      const numId = parseInt(btn.dataset.id);
      const m = familyMembers.find(x => x.id === numId);
      if (m) openMemberModal(m);
    });
  });

  container.querySelectorAll('.delete-member').forEach(btn => {
    btn.addEventListener('click', async () => {
      const numId = parseInt(btn.dataset.id);
      const m = familyMembers.find(x => x.id === numId);
      const name = m ? m.name : 'este membro';
      const ok = await customConfirm(`Remover "${name}" da família?`, '👨‍👩‍👦', 'Remover Membro');
      if (!ok) return;

      try {
        await API.deleteMember(numId);
        familyMembers = familyMembers.filter(x => x.id !== numId);
        renderMembers();
        showToast('Membro removido.', 'info');
      } catch (e) {
        showToast('Erro ao remover membro.', 'error');
      }
    });
  });
}
