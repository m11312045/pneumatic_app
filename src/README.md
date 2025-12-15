# 氣壓元件識別練習系統

一個基於 YOLO11 的氣壓元件符號識別練習系統，幫助學生學習和練習繪製氣壓元件符號。

## 功能特色

- ✅ **學生登入**：無需密碼，輸入學號和姓名即可開始
- ✅ **隨機出題**：每次測驗隨機選擇 20 題（照圖抄繪 10 題 + 文字描述 10 題）
- ✅ **相機拍攝**：支援相機拍攝和圖片上傳
- ✅ **AI 識別**：使用 YOLO11 模型自動識別繪製的符號
- ✅ **即時反饋**：答題後立即顯示識別結果和解析
- ✅ **歷史記錄**：所有測驗記錄雲端儲存，可查看自己和他人的測驗結果
- ✅ **公開透明**：所有記錄公開可查看（無隱私設定）

## 支援的氣壓元件

系統可識別以下 8 種氣壓元件：

1. **32-way NC valve** - 三口二位常閉氣壓閥
2. **32-way NO valve** - 三口二位常開氣壓閥
3. **52-way valve** - 五口二位氣壓閥
4. **Double-acting cylinder** - 雙動缸
5. **Single-acting cylinder** - 單動缸
6. **One-way flow control valve** - 單向節流閥
7. **Shuttle valve** - 梭動閥（OR 邏輯）
8. **Two-pressure valve** - 雙壓閥（AND 邏輯）

## 技術架構

- **前端**：React + TypeScript + Tailwind CSS
- **資料庫**：Supabase (PostgreSQL)
- **AI 模型**：YOLO11 (Ultralytics Hub)
- **圖片儲存**：Supabase Storage

## 設定步驟

### 1. 資料庫設定

資料庫已經設定完成，SQL schema 已執行。

### 2. 新增題目

在 Supabase SQL Editor 中執行 `database-seed.sql` 檔案，快速新增 30 題測驗題目：

```sql
-- 在 Supabase SQL Editor 中執行 database-seed.sql
```

### 3. 建立 Storage Bucket（選用）

如果要儲存學生答題圖片到 Supabase Storage：

1. 前往 Supabase Dashboard > Storage
2. 建立新的 bucket：`pneumatic-answers`
3. 設定為 Public bucket
4. 設定 RLS 政策允許 anon 使用者上傳

如果不建立 Storage，系統會使用 base64 格式儲存圖片到資料庫（備用方案）。

### 4. 設定 YOLO API Key

在 `/utils/yolo.ts` 中替換 API Key：

```typescript
const API_KEY = 'YOUR_ULTRALYTICS_API_KEY';
```

如果沒有 API Key，系統會使用模擬數據進行測試。

## 資料庫結構

- **students** - 學生資料
- **questions** - 題目庫
- **attempts** - 測驗會話
- **attempt_items** - 答題記錄
- **pneumatic_classes** - 氣壓元件類別對照表

## 使用流程

1. **登入**：輸入學號和姓名
2. **開始測驗**：系統隨機選擇 20 題
3. **答題**：
   - 照圖抄繪：看範例圖，在紙上繪製符號
   - 文字描述：依據題目描述，繪製對應的元件符號
4. **拍照上傳**：用相機拍攝繪製的符號
5. **送出答案**：系統使用 YOLO11 識別並評分
6. **查看解析**：立即查看識別結果和正確答案
7. **完成測驗**：顯示總分和詳細答題記錄
8. **查看歷史**：可查看自己和其他學生的測驗記錄

## 評分規則

- 每題 5 分，總分 100 分
- 識別結果與正確答案一致即得分
- 系統會顯示 AI 識別的信心度
- 答錯會顯示詳細解析

## 注意事項

⚠️ **隱私說明**：
- 本系統不需要密碼
- 所有測驗記錄公開可查看
- 不適合儲存個人隱私資料
- 僅用於教學練習用途

⚠️ **圖片上傳**：
- 建議使用清晰、光線充足的照片
- 確保符號完整可見
- 避免陰影或反光

## 開發測試

系統已內建模擬模式：
- YOLO API 無法連接時會自動使用模擬識別
- 適合開發和測試環境使用
- 正式使用時請設定正確的 API Key

## 支援與協助

如遇問題，請檢查：
1. Supabase 連線是否正常
2. 題目是否已新增到資料庫
3. YOLO API Key 是否正確設定
4. 瀏覽器相機權限是否已授予
