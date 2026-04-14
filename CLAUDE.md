# 富男管家 — Claude 工作文件

> 這份文件讓 Claude 在新對話開始時，能立刻掌握專案現況，不需要重新摸索。

---

## 專案概覽

**名稱**：富男管家（Rich Man's Butler）  
**類型**：純前端 PWA 記帳本，**無後端、無伺服器**，所有資料存於瀏覽器 IndexedDB  
**路徑**：`/Users/leochang/Desktop/Claude Code富男管家/`  
**開發伺服器**：`npm run dev` → `http://localhost:5173`  
**建置**：`npm run build`（需先通過 `tsc -b`，目前零錯誤）

---

## 技術棧

| 套件 | 版本 | 用途 |
|------|------|------|
| React | 19 | UI 框架 |
| TypeScript | 6 | 型別安全 |
| Vite | 8 | 建置工具 |
| vite-plugin-pwa | 1.2.0 | Service Worker、可安裝 PWA |
| idb | 8 | IndexedDB 包裝器 |
| Recharts | 3 | 甜甜圈圖表 |
| ExcelJS + file-saver | — | 客戶端 Excel 匯出 |
| date-fns | 4 | 日期工具（zh-TW locale）|

> ⚠️ **重要**：所有 `npm install` 都必須加 `--legacy-peer-deps`（vite 8 與 vite-plugin-pwa 1.x 的 peer deps 衝突）

---

## 檔案結構

```
src/
  main.tsx                      # React 入口
  App.tsx                       # Tab 狀態管理，渲染 BottomNav + 當前頁面
  App.css                       # app-container、橙色光暈球背景裝飾
  index.css                     # CSS 設計 Token（全域變數）
  types/
    index.ts                    # Transaction、Category、MonthlyBudget、SavingsGoal
  db/
    indexedDb.ts                # IndexedDB（版本 2）、CRUD、預設類別 seed
  utils/
    date.ts                     # formatDateDisplay、todayStr、groupByDate 等
    format.ts                   # formatAmount（Intl）、formatAmountSigned
  components/
    Icons.tsx                   # ★ 全部 SVG 圖標（線條風格，24×24）
    BottomNav.tsx / .css        # 底部三 tab 導航（磨砂玻璃）
    CategoryGrid.tsx / .css     # 類別選擇格（4欄，玻璃磁貼）
    DateNavigator.tsx / .css    # ← 日期 → 導航列
    NumericKeypad.tsx / .css    # 計算器數字鍵盤（5欄，OK 橙色）
    DonutChart.tsx / .css       # Recharts 甜甜圈圖
    TransactionList.tsx / .css  # 按日期分組的交易列表
  routes/
    Ledger.tsx / .css           # 帳本頁（預設 tab）
    Overview.tsx / .css         # 總覽頁（圖表 + 預算圓圈）
    Profile.tsx / .css          # 個人頁（結餘、存錢目標、匯出）
  features/
    export/
      exportXlsx.ts             # ExcelJS 匯出（2 個工作表）
```

---

## 設計系統（CSS 變數）

```css
/* src/index.css */
--color-primary:   #FF6B35    /* 橙色主調 */
--color-accent:    #E85D2F    /* 深橙 hover/active */
--color-bg:        #FAF8F4    /* 奶油白背景 */
--color-surface:   rgba(255,255,255,0.70)  /* 玻璃卡片底色 */
--color-expense:   #FF6B35
--color-income:    #5BAD70
--glass-blur:      blur(20px)
--glass-bg:        rgba(255,255,255,0.68)
--glass-border:    1px solid rgba(255,255,255,0.80)
--glass-shadow:    0 8px 32px rgba(0,0,0,0.08)
--radius-card:     20px
```

**視覺風格**：磨砂玻璃（`backdrop-filter: blur`）、橙色漸層按鈕、奶油白背景 + 右上角橙色光暈球

---

## IndexedDB 結構

**DB 名稱**：`FuNanGuanjia`  **版本**：`2`

| Store | keyPath | Indexes |
|-------|---------|---------|
| `transactions` | `id` | `by-date`、`by-type` |
| `categories` | `id` | — |
| `monthlyBudgets` | `yearMonth` | — |
| `savingsGoals` | `id` | — |

**v1 → v2 遷移**：清空並重新 seed `categories`（icon 欄位從 emoji 改為 SVG 圖標 ID）

### 預設類別（17 個）

```
支出：food、drinks、transport、social、rent、other、groceries、
      travel、phone、clothing、medical、subscription
收入：salary、bonus、investment、sidejob、other-income
```

> `Category.icon` 欄位現在存的是圖標 ID 字串（如 `'food'`），不是 emoji。
> 渲染時用 `<CategoryIcon id={cat.icon} />` 而非直接顯示字串。

---

## 圖標系統

**位置**：`src/components/Icons.tsx`

所有圖標：SVG、`strokeWidth=1.5`、`strokeLinecap/join="round"`、`fill="none"`

```tsx
// 類別圖標（用 cat.icon 作為 key）
<CategoryIcon id="food" size={24} />

// UI 圖標（直接 import）
import { IconChevronLeft, IconCalendar, IconDownload, IconTrash } from './Icons'
```

**ICON_MAP 對應**：
`food` `drink` `transport` `social` `rent` `grocery` `travel` `phone`
`clothing` `medical` `subscription` `other` `salary` `bonus` `investment` `side-job`

---

## 各頁面功能

### 帳本（Ledger）— 預設 tab
- 支出 / 收入切換
- 類別格（依類型過濾）
- Entry preview：選中圖標 + TWD + 備註輸入
- 日期導航
- 計算器鍵盤（支援 +、-、×、÷ 連算），OK → 存入 DB
- 本月記錄列表

### 總覽（Overview）
- 月份導航 ← 2026年4月 →
- 月支出 / 月收入卡片（點擊展開甜甜圈圖 + 類別明細）
- 當月剩餘預算圓圈（conic-gradient）
- 交易列表

### 個人（Profile）
- 本月結餘（自動計算）
- 月預算設定
- 存錢目標（CRUD，帶進度條）
- 導出 Excel（ExcelJS，2 個工作表）

---

## 資料模型

```typescript
interface Transaction {
  id: string;           // crypto.randomUUID()
  type: 'expense' | 'income';
  categoryId: string;   // 對應 Category.id
  amount: number;       // 正數，單位 TWD
  currency: 'TWD';
  note: string;
  date: string;         // 'YYYY-MM-DD'
  createdAt: number;    // Date.now()
}

interface Category {
  id: string;
  name: string;
  icon: string;         // SVG 圖標 ID（如 'food'），非 emoji
  type: 'expense' | 'income' | 'both';
  color: string;        // hex
}
```

---

## 常用指令

```bash
# 開發
npm run dev

# 建置（含 TypeScript 型別檢查）
npm run build

# 安裝新套件（一定要加這個 flag）
npm install <package> --legacy-peer-deps
```

---

## 已知限制 / 待改進

- 類別目前無法從 UI 新增（DB seed 固定 17 個）
- PWA 圖標為程式生成的純色方塊，視覺品質低
- Excel 匯出的分類欄位會顯示 category ID，尚未解析為中文名稱
- 無資料備份機制（清除瀏覽器資料即遺失）
