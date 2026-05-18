import './index.css';

// ─── Types ───────────────────────────────────────────────────────────
interface SubItemConfig {
  key: string;
  label: string;
  defaultPrice: number;
  type: 'per-unit' | 'lump-sum'; // per-unit: 単価×数量, lump-sum: 一式金額
}

interface MainItemConfig {
  key: string;
  label: string;
  unit: string; // '頁' or 'ワード'
  subItems: SubItemConfig[];
}

interface SubItemState {
  selected: boolean;
  price: number;
  quantity: number; // quantity (頁 or ワード) for per-unit type
  lumpSum: number; // total amount for lump-sum type
}

interface MainItemState {
  selected: boolean;
  subItems: Record<string, SubItemState>;
}

interface AppState {
  customerName: string;
  mainItems: Record<string, MainItemState>;
  activeInputKey: string | null; // tracks which input is focused for the keyboard
}

// ─── Constants ───────────────────────────────────────────────────────
const MAIN_ITEMS: MainItemConfig[] = [
  {
    key: 'word',
    label: 'Word化',
    unit: '頁',
    subItems: [
      { key: 'input', label: '入力必要', defaultPrice: 480, type: 'per-unit' },
      { key: 'selectable', label: '文字選択可', defaultPrice: 280, type: 'per-unit' },
      { key: 'link', label: 'リンク作成', defaultPrice: 100, type: 'per-unit' },
      { key: 'preprocess', label: '前処理', defaultPrice: 100, type: 'per-unit' },
      { key: 'layout', label: '翻訳後レイアウト調整', defaultPrice: 280, type: 'per-unit' },
      { key: 'beta', label: 'ベタ打ち', defaultPrice: 680, type: 'per-unit' },
      { key: 'ocr', label: '画像のテクスト化', defaultPrice: 480, type: 'per-unit' },
    ],
  },
  {
    key: 'ppt',
    label: 'PPT化',
    unit: '頁',
    subItems: [
      { key: 'input', label: '入力必要', defaultPrice: 480, type: 'per-unit' },
      { key: 'selectable', label: '文字選択可', defaultPrice: 280, type: 'per-unit' },
      { key: 'link', label: 'リンク作成', defaultPrice: 100, type: 'per-unit' },
      { key: 'preprocess', label: '前処理', defaultPrice: 100, type: 'per-unit' },
      { key: 'layout', label: '翻訳後レイアウト調整', defaultPrice: 280, type: 'per-unit' },
      { key: 'beta', label: 'ベタ打ち', defaultPrice: 680, type: 'per-unit' },
      { key: 'ocr', label: '画像のテクスト化', defaultPrice: 480, type: 'per-unit' },
    ],
  },
  {
    key: 'excel',
    label: 'Excell化',
    unit: '頁',
    subItems: [
      { key: 'input', label: '入力必要', defaultPrice: 480, type: 'per-unit' },
      { key: 'selectable', label: '文字選択可', defaultPrice: 280, type: 'per-unit' },
      { key: 'link', label: 'リンク作成', defaultPrice: 100, type: 'per-unit' },
      { key: 'preprocess', label: '前処理', defaultPrice: 100, type: 'per-unit' },
      { key: 'layout', label: '翻訳後レイアウト調整', defaultPrice: 280, type: 'per-unit' },
      { key: 'beta', label: 'ベタ打ち', defaultPrice: 680, type: 'per-unit' },
      { key: 'ocr', label: '画像のテクスト化', defaultPrice: 480, type: 'per-unit' },
    ],
  },
  {
    key: 'tm-translate',
    label: 'TM翻訳用',
    unit: 'ワード',
    subItems: [
      { key: 'word-file', label: 'Wordファイル', defaultPrice: 0.7, type: 'per-unit' },
      { key: 'ppt-file', label: 'PPTファイル', defaultPrice: 0.8, type: 'per-unit' },
      { key: 'excel-file', label: 'Excellファイル', defaultPrice: 0.8, type: 'per-unit' },
      { key: 'pdf-file', label: 'PDFファイル', defaultPrice: 0.9, type: 'per-unit' },
      { key: 'pdf-col', label: 'PDF段組みファイル', defaultPrice: 1.5, type: 'per-unit' },
      { key: 'image', label: '画像の部分', defaultPrice: 0, type: 'lump-sum' },
    ],
  },
  {
    key: 'tm-maru',
    label: 'TM三丸用',
    unit: 'ワード',
    subItems: [
      { key: 'word-file', label: 'Wordファイル', defaultPrice: 1.0, type: 'per-unit' },
      { key: 'ppt-file', label: 'PPTファイル', defaultPrice: 1.5, type: 'per-unit' },
      { key: 'excel-file', label: 'Excellファイル', defaultPrice: 1.5, type: 'per-unit' },
      { key: 'pdf-file', label: 'PDFファイル', defaultPrice: 1.5, type: 'per-unit' },
      { key: 'pdf-col', label: '複雑PDF', defaultPrice: 2.0, type: 'per-unit' },
      { key: 'image', label: '画像の部分', defaultPrice: 0, type: 'lump-sum' },
    ],
  },
];

const TAX_RATE = 0.1;

// ─── State ───────────────────────────────────────────────────────────
function createInitialState(): AppState {
  const mainItems: Record<string, MainItemState> = {};
  for (const main of MAIN_ITEMS) {
    const subItems: Record<string, SubItemState> = {};
    for (const sub of main.subItems) {
      subItems[sub.key] = {
        selected: false,
        price: sub.defaultPrice,
        quantity: 0,
        lumpSum: 0,
      };
    }
    mainItems[main.key] = { selected: false, subItems };
  }
  return { customerName: '', mainItems, activeInputKey: null };
}

const state: AppState = createInitialState();

// ─── Helpers ─────────────────────────────────────────────────────────
function formatPrice(price: number): string {
  return price.toLocaleString('ja-JP') + '円';
}

function formatPriceValue(price: number): string {
  // Show decimal prices like 0.7 as-is; show integer prices without decimals
  if (Number.isInteger(price)) return String(price);
  return String(price);
}

function getMainConfig(key: string): MainItemConfig {
  return MAIN_ITEMS.find((m) => m.key === key)!;
}

function getSubConfig(mainKey: string, subKey: string): SubItemConfig {
  return getMainConfig(mainKey).subItems.find((s) => s.key === subKey)!;
}

function calcSubtotal(mainKey: string, subKey: string): number {
  const ss = state.mainItems[mainKey].subItems[subKey];
  const subConfig = getSubConfig(mainKey, subKey);
  if (subConfig.type === 'lump-sum') {
    return ss.lumpSum;
  }
  return ss.price * ss.quantity;
}

function calcTotal(): number {
  let total = 0;
  for (const main of MAIN_ITEMS) {
    const ms = state.mainItems[main.key];
    if (!ms.selected) continue;
    for (const sub of main.subItems) {
      const ss = ms.subItems[sub.key];
      if (ss.selected) {
        total += calcSubtotal(main.key, sub.key);
      }
    }
  }
  return total;
}

function hasAnySelection(): boolean {
  for (const main of MAIN_ITEMS) {
    const ms = state.mainItems[main.key];
    if (!ms.selected) continue;
    for (const sub of main.subItems) {
      if (ms.subItems[sub.key].selected) return true;
    }
  }
  return false;
}

// ─── Render ──────────────────────────────────────────────────────────
function renderSubItem(main: MainItemConfig, sub: SubItemConfig): string {
  const ms = state.mainItems[main.key];
  const ss = ms.subItems[sub.key];
  const isActive = state.activeInputKey === `${main.key}:${sub.key}`;

  if (sub.type === 'lump-sum') {
    // 一式金額 type: only a lump sum input
    const subtotal = ss.selected && ss.lumpSum > 0 ? ss.lumpSum : 0;
    return `
      <div class="sub-card rounded-xl border transition-all
        ${isActive ? 'border-amber-300 ring-2 ring-amber-100 bg-amber-50/50' : ss.selected ? 'border-blue-200 bg-blue-50/50' : 'border-slate-100 bg-slate-50/50'}">
        <div class="flex items-center gap-3 px-4 py-3">
          <input type="checkbox" class="custom-check" data-action="toggle-sub" data-main="${main.key}" data-sub="${sub.key}"
            ${ss.selected ? 'checked' : ''} />
          <span class="text-sm font-medium text-slate-700 min-w-[160px]">${sub.label}</span>
          <div class="flex items-center gap-1.5 ml-auto">
            <span class="text-xs text-slate-400 mr-1">一式金額</span>
            <input type="text" class="page-input" readonly
              data-action="open-keyboard" data-main="${main.key}" data-sub="${sub.key}" data-input-type="lump-sum"
              value="${ss.lumpSum > 0 ? ss.lumpSum : ''}"
              placeholder="0" ${ss.selected ? '' : 'disabled'} />
            <span class="text-xs text-slate-400">円</span>
            <span class="text-slate-300 mx-1">＝</span>
            <span class="text-sm font-semibold min-w-[80px] text-right
              ${subtotal > 0 ? 'text-blue-600' : 'text-slate-300'}">
              ${subtotal > 0 ? formatPrice(subtotal) : '−'}
            </span>
          </div>
        </div>
      </div>
    `;
  }

  // per-unit type: 単価 × 数量
  const subtotal = ss.selected && ss.quantity > 0 ? calcSubtotal(main.key, sub.key) : 0;
  return `
    <div class="sub-card rounded-xl border transition-all
      ${isActive ? 'border-amber-300 ring-2 ring-amber-100 bg-amber-50/50' : ss.selected ? 'border-blue-200 bg-blue-50/50' : 'border-slate-100 bg-slate-50/50'}">
      <div class="flex items-center gap-3 px-4 py-3">
        <input type="checkbox" class="custom-check" data-action="toggle-sub" data-main="${main.key}" data-sub="${sub.key}"
          ${ss.selected ? 'checked' : ''} />
        <span class="text-sm font-medium text-slate-700 min-w-[160px]">${sub.label}</span>
        <div class="flex items-center gap-1.5 ml-auto">
          <input type="number" class="price-input" data-action="change-price"
            data-main="${main.key}" data-sub="${sub.key}"
            value="${formatPriceValue(ss.price)}" min="0" step="0.1" ${ss.selected ? '' : 'disabled'} />
          <span class="text-xs text-slate-400">円</span>
          <span class="text-slate-300 mx-1">×</span>
          <input type="text" class="page-input" readonly
            data-action="open-keyboard" data-main="${main.key}" data-sub="${sub.key}" data-input-type="quantity"
            value="${ss.quantity > 0 ? ss.quantity : ''}"
            placeholder="0" ${ss.selected ? '' : 'disabled'} />
          <span class="text-xs text-slate-400">${main.unit}</span>
          <span class="text-slate-300 mx-1">＝</span>
          <span class="text-sm font-semibold min-w-[80px] text-right
            ${subtotal > 0 ? 'text-blue-600' : 'text-slate-300'}">
            ${subtotal > 0 ? formatPrice(subtotal) : '−'}
          </span>
        </div>
      </div>
    </div>
  `;
}

function renderMainContent(): void {
  const app = document.getElementById('app');
  if (!app) return;

  const total = calcTotal();
  const tax = Math.floor(total * TAX_RATE);
  const totalWithTax = total + tax;

  app.innerHTML = `
    <div class="max-w-2xl mx-auto px-4 py-8 pb-32">
      <!-- Header -->
      <div class="text-center mb-8">
        <h1 class="text-2xl font-bold text-slate-800 tracking-tight">お見積り作成</h1>
        <p class="text-sm text-slate-500 mt-1">項目を選択して見積りを作成します</p>
      </div>

      <!-- Customer Name -->
      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
        <label class="block text-base font-semibold text-slate-700 mb-3">顧客名</label>
        <input type="text" id="customer-name" data-action="change-customer-name"
          class="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-base text-slate-800 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          placeholder="顧客名を入力してください" value="${escapeHtml(state.customerName)}" />
      </div>

      <!-- Main Items Selection -->
      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
        <h2 class="text-base font-semibold text-slate-700 mb-4">項目選択</h2>
        <div class="flex flex-wrap gap-3">
          ${MAIN_ITEMS.map((main) => `
            <label class="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border-2 cursor-pointer transition-all
              ${state.mainItems[main.key].selected
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'}">
              <input type="checkbox" class="custom-check" data-action="toggle-main" data-key="${main.key}"
                ${state.mainItems[main.key].selected ? 'checked' : ''} />
              <span class="font-medium text-sm">${main.label}</span>
            </label>
          `).join('')}
        </div>
      </div>

      <!-- Sub Items per Main Item -->
      ${MAIN_ITEMS.filter((main) => state.mainItems[main.key].selected).map((main) => {
        return `
          <div class="main-card bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-4">
            <h3 class="text-base font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-blue-500"></span>
              ${main.label}
              <span class="text-xs font-normal text-slate-400 ml-1">（単位：${main.unit}）</span>
            </h3>
            <div class="space-y-3">
              ${main.subItems.map((sub) => renderSubItem(main, sub)).join('')}
            </div>
          </div>
        `;
      }).join('')}

      <!-- Total Section -->
      ${hasAnySelection() ? `
        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-4">
          <div class="space-y-3">
            <div class="flex justify-between items-center">
              <span class="text-base text-slate-600">小計</span>
              <span class="text-lg font-semibold text-slate-800">${formatPrice(total)}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-base text-slate-600">消費税（10%）</span>
              <span class="text-base text-slate-500">${formatPrice(tax)}</span>
            </div>
            <div class="border-t border-slate-200 pt-3 flex justify-between items-center">
              <span class="text-lg font-bold text-slate-800">税込合計</span>
              <span class="text-xl font-bold text-blue-600">${formatPrice(totalWithTax)}</span>
            </div>
          </div>
        </div>
      ` : ''}

      <!-- Output Button -->
      <button data-action="generate-output" ${!hasAnySelection() ? 'disabled' : ''}
        class="w-full py-3.5 rounded-xl font-semibold text-white transition-all
          ${hasAnySelection()
            ? 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98] shadow-md shadow-blue-200'
            : 'bg-slate-300 cursor-not-allowed'}">
        見積りテキストを出力
      </button>
    </div>
  `;
}

function renderKeyboard(): void {
  const kbContainer = document.getElementById('kb-container');
  if (!kbContainer) return;

  if (!state.activeInputKey) {
    kbContainer.innerHTML = '';
    return;
  }

  const [activeMain, activeSub] = state.activeInputKey.split(':');
  const mainConfig = getMainConfig(activeMain);
  const subConfig = getSubConfig(activeMain, activeSub);
  const ss = state.mainItems[activeMain]?.subItems[activeSub];

  const isLumpSum = subConfig.type === 'lump-sum';
  const inputLabel = isLumpSum ? '金額を入力' : `${mainConfig.unit}数を入力`;
  const unitLabel = isLumpSum ? '円' : mainConfig.unit;
  const displayValue = isLumpSum
    ? (ss.lumpSum > 0 ? String(ss.lumpSum) : '')
    : (ss.quantity > 0 ? String(ss.quantity) : '');

  kbContainer.innerHTML = `
    <div class="num-keyboard-overlay" data-action="close-keyboard-bg">
      <div class="num-keyboard-panel">
        <div class="flex items-center justify-between mb-3 px-2">
          <span class="text-sm font-medium text-slate-500">${inputLabel}</span>
          <div class="flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-1.5">
            <span class="text-xl font-bold text-blue-600" id="kb-display">${displayValue}</span>
            <span class="text-xs text-slate-400">${unitLabel}</span>
          </div>
        </div>
        <div class="grid grid-cols-4 gap-2">
          <div class="kb-key" data-action="kb-input" data-val="7">7</div>
          <div class="kb-key" data-action="kb-input" data-val="8">8</div>
          <div class="kb-key" data-action="kb-input" data-val="9">9</div>
          <div class="kb-key kb-key-delete" data-action="kb-delete">⌫</div>
          <div class="kb-key" data-action="kb-input" data-val="4">4</div>
          <div class="kb-key" data-action="kb-input" data-val="5">5</div>
          <div class="kb-key" data-action="kb-input" data-val="6">6</div>
          <div class="kb-key" data-action="kb-clear">C</div>
          <div class="kb-key" data-action="kb-input" data-val="1">1</div>
          <div class="kb-key" data-action="kb-input" data-val="2">2</div>
          <div class="kb-key" data-action="kb-input" data-val="3">3</div>
          <div class="kb-key kb-key-confirm" data-action="kb-confirm" style="grid-row: span 2;">OK</div>
          <div class="kb-key" data-action="kb-input" data-val="0" style="grid-column: span 2;">0</div>
          <div class="kb-key" data-action="kb-input" data-val="00">00</div>
        </div>
      </div>
    </div>
  `;
}

/** Lightweight update — no full re-render */
function updateInputDisplay(): void {
  if (!state.activeInputKey) return;
  const [mainKey, subKey] = state.activeInputKey.split(':');
  const ss = state.mainItems[mainKey].subItems[subKey];
  const subConfig = getSubConfig(mainKey, subKey);
  const isLumpSum = subConfig.type === 'lump-sum';

  // Update keyboard display
  const kbDisplay = document.getElementById('kb-display');
  if (kbDisplay) {
    kbDisplay.textContent = isLumpSum
      ? (ss.lumpSum > 0 ? String(ss.lumpSum) : '')
      : (ss.quantity > 0 ? String(ss.quantity) : '');
  }

  // Update the input field
  const inputEl = document.querySelector<HTMLInputElement>(
    `input[data-action="open-keyboard"][data-main="${mainKey}"][data-sub="${subKey}"]`
  );
  if (inputEl) {
    inputEl.value = isLumpSum
      ? (ss.lumpSum > 0 ? String(ss.lumpSum) : '')
      : (ss.quantity > 0 ? String(ss.quantity) : '');
  }

  // Update subtotal display
  const subtotal = ss.selected ? calcSubtotal(mainKey, subKey) : 0;
  const subCard = inputEl?.closest('.sub-card');
  if (subCard) {
    const subtotalSpan = subCard.querySelector('.font-semibold.min-w-\\[80px\\]');
    if (subtotalSpan) {
      subtotalSpan.textContent = subtotal > 0 ? formatPrice(subtotal) : '−';
      subtotalSpan.className = `text-sm font-semibold min-w-[80px] text-right ${subtotal > 0 ? 'text-blue-600' : 'text-slate-300'}`;
    }
  }

  // Update totals
  updateTotalsDisplay();
}

function updateTotalsDisplay(): void {
  const total = calcTotal();
  const tax = Math.floor(total * TAX_RATE);
  const totalWithTax = total + tax;

  const allSections = document.querySelectorAll('.space-y-3');
  const totalsSection = allSections[allSections.length - 1];
  if (totalsSection && hasAnySelection()) {
    const rows = totalsSection.querySelectorAll('.flex.justify-between');
    if (rows.length >= 3) {
      rows[0].querySelector('span:last-child')!.textContent = formatPrice(total);
      rows[1].querySelector('span:last-child')!.textContent = formatPrice(tax);
      rows[2].querySelector('span:last-child')!.textContent = formatPrice(totalWithTax);
    }
  }
}

function render(): void {
  renderMainContent();
  renderKeyboard();
}

// ─── Output Text Generation ─────────────────────────────────────────
function generateOutputText(): string {
  const lines: string[] = [];

  lines.push(`${state.customerName}様`);
  lines.push('　いつもお世話になっております。');
  lines.push('お見積りします。');
  lines.push('');

  for (const main of MAIN_ITEMS) {
    const ms = state.mainItems[main.key];
    if (!ms.selected) continue;

    const selectedSubs = main.subItems.filter((sub) => ms.subItems[sub.key].selected);
    if (selectedSubs.length === 0) continue;

    lines.push(main.label);

    for (const sub of selectedSubs) {
      const ss = ms.subItems[sub.key];
      const subtotal = calcSubtotal(main.key, sub.key);

      if (sub.type === 'lump-sum') {
        lines.push(`${sub.label}：${ss.lumpSum.toLocaleString('ja-JP')}円`);
      } else {
        const qty = ss.quantity > 0 ? ss.quantity : 0;
        lines.push(`${sub.label}：${ss.price}円 × ${qty}${main.unit} ＝ ${subtotal.toLocaleString('ja-JP')}円`);
      }
    }

    lines.push('');
  }

  const total = calcTotal();
  const tax = Math.floor(total * TAX_RATE);
  const totalWithTax = total + tax;

  lines.push(`合計：${total.toLocaleString('ja-JP')}円`);
  lines.push(`税込合計（10%）：${totalWithTax.toLocaleString('ja-JP')}円`);
  lines.push('');
  lines.push('ご確認、お願いします。');
  lines.push('李　寧章');

  return lines.join('\n');
}

function showOutputModal(text: string): void {
  const overlay = document.createElement('div');
  overlay.className = 'output-overlay';
  overlay.innerHTML = `
    <div class="output-panel">
      <div class="flex items-center justify-between px-6 py-4 border-b border-slate-200">
        <h3 class="text-base font-semibold text-slate-700">見積りテキスト</h3>
        <button id="btn-copy"
          class="text-sm font-medium text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors">
          コピー
        </button>
      </div>
      <div class="output-content" id="output-text">${escapeHtml(text)}</div>
      <div class="px-6 py-4 border-t border-slate-100">
        <button id="btn-close"
          class="w-full py-2.5 rounded-xl bg-slate-100 text-slate-600 font-medium hover:bg-slate-200 transition-colors">
          閉じる
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  // Bind close button
  overlay.querySelector('#btn-close')!.addEventListener('click', () => {
    overlay.remove();
  });

  // Bind copy button
  overlay.querySelector('#btn-copy')!.addEventListener('click', () => {
    navigator.clipboard.writeText(text).then(() => {
      const btn = overlay.querySelector('#btn-copy')!;
      btn.textContent = 'コピーしました！';
      btn.classList.add('text-green-600');
      setTimeout(() => {
        btn.textContent = 'コピー';
        btn.classList.remove('text-green-600');
      }, 1500);
    });
  });

  // Close on clicking overlay background
  overlay.addEventListener('click', (e: MouseEvent) => {
    if (e.target === overlay) {
      overlay.remove();
    }
  });
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ─── Event Handling ──────────────────────────────────────────────────
function setupEvents(): void {
  const app = document.getElementById('app')!;
  const kbContainer = document.getElementById('kb-container')!;

  // Main app click handler
  app.addEventListener('click', (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const action = target.closest('[data-action]') as HTMLElement | null;
    if (!action) return;

    const actionName = action.getAttribute('data-action');

    switch (actionName) {
      case 'toggle-main': {
        const key = action.getAttribute('data-key')!;
        state.mainItems[key].selected = !state.mainItems[key].selected;
        if (!state.mainItems[key].selected) {
          for (const subKey of Object.keys(state.mainItems[key].subItems)) {
            const ss = state.mainItems[key].subItems[subKey];
            ss.selected = false;
            ss.quantity = 0;
            ss.lumpSum = 0;
          }
          if (state.activeInputKey && state.activeInputKey.startsWith(key + ':')) {
            state.activeInputKey = null;
          }
        }
        render();
        break;
      }
      case 'toggle-sub': {
        const mainKey = action.getAttribute('data-main')!;
        const subKey = action.getAttribute('data-sub')!;
        const ss = state.mainItems[mainKey].subItems[subKey];
        ss.selected = !ss.selected;
        if (!ss.selected) {
          ss.quantity = 0;
          ss.lumpSum = 0;
          if (state.activeInputKey === `${mainKey}:${subKey}`) {
            state.activeInputKey = null;
          }
        }
        render();
        break;
      }
      case 'open-keyboard': {
        const mainKey = action.getAttribute('data-main')!;
        const subKey = action.getAttribute('data-sub')!;
        state.activeInputKey = `${mainKey}:${subKey}`;
        render();
        break;
      }
      case 'generate-output': {
        if (!hasAnySelection()) break;
        const text = generateOutputText();
        showOutputModal(text);
        break;
      }
    }
  });

  // Keyboard container click handler (separate from app)
  kbContainer.addEventListener('click', (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const action = target.closest('[data-action]') as HTMLElement | null;
    if (!action) return;

    const actionName = action.getAttribute('data-action');

    switch (actionName) {
      case 'close-keyboard-bg': {
        if (target === action) {
          state.activeInputKey = null;
          renderMainContent();
          renderKeyboard();
        }
        break;
      }
      case 'kb-input': {
        if (!state.activeInputKey) break;
        const val = action.getAttribute('data-val')!;
        const [mainKey, subKey] = state.activeInputKey.split(':');
        const ss = state.mainItems[mainKey].subItems[subKey];
        const subConfig = getSubConfig(mainKey, subKey);
        const isLumpSum = subConfig.type === 'lump-sum';

        const currentField = isLumpSum ? ss.lumpSum : ss.quantity;
        const currentStr = currentField > 0 ? String(currentField) : '';
        const newStr = currentStr + val;
        const newVal = parseInt(newStr, 10);
        if (!isNaN(newVal) && newVal <= 9999999) {
          if (isLumpSum) {
            ss.lumpSum = newVal;
          } else {
            ss.quantity = newVal;
          }
        }
        updateInputDisplay();
        break;
      }
      case 'kb-delete': {
        if (!state.activeInputKey) break;
        const [mainKey, subKey] = state.activeInputKey.split(':');
        const ss = state.mainItems[mainKey].subItems[subKey];
        const subConfig = getSubConfig(mainKey, subKey);
        const isLumpSum = subConfig.type === 'lump-sum';

        const currentField = isLumpSum ? ss.lumpSum : ss.quantity;
        const currentStr = String(currentField);
        if (currentStr.length > 1) {
          const newVal = parseInt(currentStr.slice(0, -1), 10);
          if (isLumpSum) {
            ss.lumpSum = newVal;
          } else {
            ss.quantity = newVal;
          }
        } else {
          if (isLumpSum) {
            ss.lumpSum = 0;
          } else {
            ss.quantity = 0;
          }
        }
        updateInputDisplay();
        break;
      }
      case 'kb-clear': {
        if (!state.activeInputKey) break;
        const [mainKey, subKey] = state.activeInputKey.split(':');
        const ss = state.mainItems[mainKey].subItems[subKey];
        const subConfig = getSubConfig(mainKey, subKey);
        if (subConfig.type === 'lump-sum') {
          ss.lumpSum = 0;
        } else {
          ss.quantity = 0;
        }
        updateInputDisplay();
        break;
      }
      case 'kb-confirm': {
        state.activeInputKey = null;
        renderMainContent();
        renderKeyboard();
        break;
      }
    }
  });

  // Handle input changes (customer name + price)
  app.addEventListener('input', (e: Event) => {
    const target = e.target as HTMLElement;
    const action = target.getAttribute('data-action');

    if (action === 'change-customer-name') {
      state.customerName = (target as HTMLInputElement).value;
      return;
    }

    if (action === 'change-price') {
      const mainKey = target.getAttribute('data-main')!;
      const subKey = target.getAttribute('data-sub')!;
      const value = (target as HTMLInputElement).value;
      const numValue = parseFloat(value);
      if (!isNaN(numValue) && numValue >= 0) {
        state.mainItems[mainKey].subItems[subKey].price = numValue;
      }
    }
  });

  // Update total on price blur
  app.addEventListener('focusout', (e: Event) => {
    const target = e.target as HTMLElement;
    if (target.hasAttribute('data-action') && target.getAttribute('data-action') === 'change-price') {
      updateTotalsDisplay();
    }
  });
}

// ─── Init ────────────────────────────────────────────────────────────
export function initApp(): void {
  const app = document.getElementById('app');
  if (!app) {
    console.error('App element not found');
    return;
  }

  render();
  setupEvents();
}
