import './index.css';

// ─── Types ───────────────────────────────────────────────────────────
interface SubItemConfig {
  key: string;
  label: string;
  defaultPrice: number;
}

interface MainItemConfig {
  key: string;
  label: string;
  subItems: SubItemConfig[];
}

interface SubItemState {
  selected: boolean;
  price: number;
  pages: number;
}

interface MainItemState {
  selected: boolean;
  subItems: Record<string, SubItemState>;
}

interface AppState {
  mainItems: Record<string, MainItemState>;
  activeInputKey: string | null; // tracks which page input is focused for the keyboard
}

// ─── Constants ───────────────────────────────────────────────────────
const MAIN_ITEMS: MainItemConfig[] = [
  {
    key: 'word',
    label: 'Word化',
    subItems: [
      { key: 'input', label: '入力必要', defaultPrice: 480 },
      { key: 'selectable', label: '文字選択可', defaultPrice: 280 },
      { key: 'link', label: 'リンク作成', defaultPrice: 100 },
      { key: 'preprocess', label: '前処理', defaultPrice: 100 },
      { key: 'layout', label: '翻訳後レイアウト調整', defaultPrice: 280 },
      { key: 'beta', label: 'ベタ打ち', defaultPrice: 680 },
      { key: 'ocr', label: '画像のテクスト化', defaultPrice: 480 },
    ],
  },
  {
    key: 'ppt',
    label: 'PPT化',
    subItems: [
      { key: 'input', label: '入力必要', defaultPrice: 480 },
      { key: 'selectable', label: '文字選択可', defaultPrice: 280 },
      { key: 'link', label: 'リンク作成', defaultPrice: 100 },
      { key: 'preprocess', label: '前処理', defaultPrice: 100 },
      { key: 'layout', label: '翻訳後レイアウト調整', defaultPrice: 280 },
      { key: 'beta', label: 'ベタ打ち', defaultPrice: 680 },
      { key: 'ocr', label: '画像のテクスト化', defaultPrice: 480 },
    ],
  },
  {
    key: 'excel',
    label: 'Excell化',
    subItems: [
      { key: 'input', label: '入力必要', defaultPrice: 480 },
      { key: 'selectable', label: '文字選択可', defaultPrice: 280 },
      { key: 'link', label: 'リンク作成', defaultPrice: 100 },
      { key: 'preprocess', label: '前処理', defaultPrice: 100 },
      { key: 'layout', label: '翻訳後レイアウト調整', defaultPrice: 280 },
      { key: 'beta', label: 'ベタ打ち', defaultPrice: 680 },
      { key: 'ocr', label: '画像のテクスト化', defaultPrice: 480 },
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
        pages: 0,
      };
    }
    mainItems[main.key] = { selected: false, subItems };
  }
  return { mainItems, activeInputKey: null };
}

const state: AppState = createInitialState();

// ─── Helpers ─────────────────────────────────────────────────────────
function formatPrice(price: number): string {
  return price.toLocaleString('ja-JP') + '円';
}

function getMainConfig(key: string): MainItemConfig {
  return MAIN_ITEMS.find((m) => m.key === key)!;
}

function getSubConfig(mainKey: string, subKey: string): SubItemConfig {
  return getMainConfig(mainKey).subItems.find((s) => s.key === subKey)!;
}

function calcSubtotal(price: number, pages: number): number {
  return price * pages;
}

function calcTotal(): number {
  let total = 0;
  for (const main of MAIN_ITEMS) {
    const ms = state.mainItems[main.key];
    if (!ms.selected) continue;
    for (const sub of main.subItems) {
      const ss = ms.subItems[sub.key];
      if (ss.selected && ss.pages > 0) {
        total += calcSubtotal(ss.price, ss.pages);
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
        const ms = state.mainItems[main.key];
        return `
          <div class="main-card bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-4">
            <h3 class="text-base font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-blue-500"></span>
              ${main.label}
            </h3>
            <div class="space-y-3">
              ${main.subItems.map((sub) => {
                const ss = ms.subItems[sub.key];
                const subtotal = ss.selected && ss.pages > 0 ? calcSubtotal(ss.price, ss.pages) : 0;
                const isActive = state.activeInputKey === `${main.key}:${sub.key}`;
                return `
                  <div class="sub-card rounded-xl border transition-all
                    ${isActive ? 'border-amber-300 ring-2 ring-amber-100 bg-amber-50/50' : ss.selected ? 'border-blue-200 bg-blue-50/50' : 'border-slate-100 bg-slate-50/50'}">
                    <div class="flex items-center gap-3 px-4 py-3">
                      <input type="checkbox" class="custom-check" data-action="toggle-sub" data-main="${main.key}" data-sub="${sub.key}"
                        ${ss.selected ? 'checked' : ''} />
                      <span class="text-sm font-medium text-slate-700 min-w-[130px]">${sub.label}</span>
                      <div class="flex items-center gap-1.5 ml-auto">
                        <input type="number" class="price-input" data-action="change-price"
                          data-main="${main.key}" data-sub="${sub.key}"
                          value="${ss.price}" min="0" ${ss.selected ? '' : 'disabled'} />
                        <span class="text-xs text-slate-400">円</span>
                        <span class="text-slate-300 mx-1">×</span>
                        <input type="text" class="page-input" readonly
                          data-action="open-keyboard" data-main="${main.key}" data-sub="${sub.key}"
                          value="${ss.pages > 0 ? ss.pages : ''}"
                          placeholder="0" ${ss.selected ? '' : 'disabled'} />
                        <span class="text-xs text-slate-400">頁</span>
                        <span class="text-slate-300 mx-1">＝</span>
                        <span class="text-sm font-semibold min-w-[80px] text-right
                          ${subtotal > 0 ? 'text-blue-600' : 'text-slate-300'}">
                          ${subtotal > 0 ? formatPrice(subtotal) : '−'}
                        </span>
                      </div>
                    </div>
                  </div>
                `;
              }).join('')}
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
  const activePages = state.mainItems[activeMain]?.subItems[activeSub]?.pages ?? 0;

  kbContainer.innerHTML = `
    <div class="num-keyboard-overlay" data-action="close-keyboard-bg">
      <div class="num-keyboard-panel">
        <div class="flex items-center justify-between mb-3 px-2">
          <span class="text-sm font-medium text-slate-500">ページ数を入力</span>
          <div class="flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-1.5">
            <span class="text-xl font-bold text-blue-600" id="kb-display">${activePages > 0 ? activePages : ''}</span>
            <span class="text-xs text-slate-400">頁</span>
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

/** Update only the page input display and subtotal without full re-render */
function updatePageDisplay(): void {
  if (!state.activeInputKey) return;
  const [mainKey, subKey] = state.activeInputKey.split(':');
  const ss = state.mainItems[mainKey].subItems[subKey];

  // Update keyboard display
  const kbDisplay = document.getElementById('kb-display');
  if (kbDisplay) {
    kbDisplay.textContent = ss.pages > 0 ? String(ss.pages) : '';
  }

  // Update the page input field
  const pageInput = document.querySelector<HTMLInputElement>(
    `input[data-action="open-keyboard"][data-main="${mainKey}"][data-sub="${subKey}"]`
  );
  if (pageInput) {
    pageInput.value = ss.pages > 0 ? String(ss.pages) : '';
  }

  // Update subtotal display
  const subtotal = ss.selected && ss.pages > 0 ? calcSubtotal(ss.price, ss.pages) : 0;
  const subCard = pageInput?.closest('.sub-card');
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

  const totalSection = document.querySelector('.bg-white.rounded-2xl.shadow-sm.border.border-slate-200:last-of-type .space-y-3');
  // More robust: find by content pattern
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

  lines.push('様');
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
      const pages = ss.pages > 0 ? ss.pages : 0;
      const subtotal = calcSubtotal(ss.price, pages);
      lines.push(`${sub.label}：${ss.price}円 × ${pages}ページ ＝ ${subtotal.toLocaleString('ja-JP')}円`);
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
        <button data-action="copy-output"
          class="text-sm font-medium text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors">
          コピー
        </button>
      </div>
      <div class="output-content" id="output-text">${escapeHtml(text)}</div>
      <div class="px-6 py-4 border-t border-slate-100">
        <button data-action="close-output"
          class="w-full py-2.5 rounded-xl bg-slate-100 text-slate-600 font-medium hover:bg-slate-200 transition-colors">
          閉じる
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  // Store text for copy
  overlay.setAttribute('data-output-text', text);
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
            state.mainItems[key].subItems[subKey].selected = false;
            state.mainItems[key].subItems[subKey].pages = 0;
          }
          // Close keyboard if the active input belongs to this main item
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
          ss.pages = 0;
          // Close keyboard if the active input is this sub item
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
        // Only close if clicking directly on the overlay background, not on panel/keys
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
        const currentStr = ss.pages > 0 ? String(ss.pages) : '';
        const newStr = currentStr + val;
        const newVal = parseInt(newStr, 10);
        if (!isNaN(newVal) && newVal <= 99999) {
          ss.pages = newVal;
        }
        // Lightweight update — no full re-render
        updatePageDisplay();
        break;
      }
      case 'kb-delete': {
        if (!state.activeInputKey) break;
        const [mainKey, subKey] = state.activeInputKey.split(':');
        const ss = state.mainItems[mainKey].subItems[subKey];
        const currentStr = String(ss.pages);
        if (currentStr.length > 1) {
          ss.pages = parseInt(currentStr.slice(0, -1), 10);
        } else {
          ss.pages = 0;
        }
        updatePageDisplay();
        break;
      }
      case 'kb-clear': {
        if (!state.activeInputKey) break;
        const [mainKey, subKey] = state.activeInputKey.split(':');
        state.mainItems[mainKey].subItems[subKey].pages = 0;
        updatePageDisplay();
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

  // Handle price input changes
  app.addEventListener('input', (e: Event) => {
    const target = e.target as HTMLElement;
    if (!target.hasAttribute('data-action') || target.getAttribute('data-action') !== 'change-price') return;

    const mainKey = target.getAttribute('data-main')!;
    const subKey = target.getAttribute('data-sub')!;
    const value = (target as HTMLInputElement).value;
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 0) {
      state.mainItems[mainKey].subItems[subKey].price = numValue;
    }
  });

  // Also update total on price blur
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
