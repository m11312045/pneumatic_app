-- 0) 避免重複插入同一題（依題型+標題視為唯一）
create unique index if not exists uq_questions_type_title
on public.questions (question_type, title);

-- 1) COPY 題目（10題）
insert into public.questions
(question_type, title, prompt_text, expected_labels, explanation, difficulty)
values
  ('COPY', '照圖抄繪-三口二位閥(題1)', '請依照範例圖重新繪製該符號，要求線條清晰、連接口正確。', array['32-way NC valve'], '重點：連接埠位置與切換方塊/箭頭方向需一致。', 1),
  ('COPY', '照圖抄繪-三口二位閥(題2)', '請依照範例圖重新繪製該符號，注意常態位置與切換位置的表示。', array['32-way NO valve'], '重點：常態位置的氣路狀態要畫對。', 1),
  ('COPY', '照圖抄繪-五口二位閥(題1)', '請依照範例圖重新繪製該符號，要求埠位(P/A/B/R/S)配置清晰。', array['52-way valve'], '重點：五個埠位要完整且位置不混淆。', 2),
  ('COPY', '照圖抄繪-五口二位閥(題2)', '請依照範例圖重新繪製該符號，注意兩個工作位置的氣路對應。', array['52-way valve'], '重點：兩位置的通路要能對應工作端互換。', 2),
  ('COPY', '照圖抄繪-氣壓缸(題1)', '請依照範例圖重新繪製該符號，注意兩端接口及活塞桿表示。', array['Double-acting cylinder'], '重點：雙向驅動時兩端皆有接口。', 1),
  ('COPY', '照圖抄繪-氣壓缸(題2)', '請依照範例圖重新繪製該符號，注意彈簧/回位表示。', array['Single-acting cylinder'], '重點：回程機構（彈簧）要清楚呈現。', 1),
  ('COPY', '照圖抄繪-流量控制(題1)', '請依照範例圖重新繪製該符號，注意節流方向與旁通方向。', array['One-way flow control valve'], '重點：單向節流通常包含逆止旁通。', 2),
  ('COPY', '照圖抄繪-流量控制(題2)', '請依照範例圖重新繪製該符號，要求節流符號與方向標示清晰。', array['One-way flow control valve'], '重點：可調節流符號不要畫成單純開關閥。', 2),
  ('COPY', '照圖抄繪-邏輯閥(題1)', '請依照範例圖重新繪製該符號，注意兩輸入一輸出的配置。', array['Shuttle valve'], '重點：兩輸入端到輸出端的選擇結構要畫對。', 2),
  ('COPY', '照圖抄繪-邏輯閥(題2)', '請依照範例圖重新繪製該符號，注意兩輸入同時成立才輸出之表示。', array['Two-pressure valve'], '重點：需要兩側壓力同時存在才導通。', 2)
on conflict (question_type, title) do update
set prompt_text = excluded.prompt_text,
    expected_labels = excluded.expected_labels,
    explanation = excluded.explanation,
    difficulty = excluded.difficulty,
    updated_at = now();

-- 2) TEXT 題目（20題）：title 每題唯一，但題幹不露元件名稱
insert into public.questions
(question_type, title, prompt_text, expected_labels, explanation, difficulty)
values
  ('TEXT', '功能題-邏輯(題1)', '請畫出一種「兩個輸入、任一輸入有壓力就會在輸出端出現壓力」的元件符號。', array['Shuttle valve'], '判讀：任一輸入成立→輸出成立（氣壓 OR）。', 2),
  ('TEXT', '功能題-邏輯(題2)', '請畫出一種「兩個輸入、必須兩個輸入同時有壓力才會輸出」的元件符號。', array['Two-pressure valve'], '判讀：兩輸入同時成立→輸出成立（氣壓 AND）。', 2),

  ('TEXT', '功能題-方向控制(題1)', '請畫出「三個連接埠、兩個工作位置」且「常態時供氣端不會與工作端導通」的閥符號。', array['32-way NC valve'], '關鍵字：常態阻斷供氣到工作端。', 1),
  ('TEXT', '功能題-方向控制(題2)', '請畫出「三個連接埠、兩個工作位置」且「常態時供氣端會與工作端導通」的閥符號。', array['32-way NO valve'], '關鍵字：常態供氣到工作端為導通。', 1),

  ('TEXT', '功能題-方向控制(題3)', '請畫出「五個連接埠、兩個工作位置」常用於控制「可前進/可後退」之致動器的閥符號。', array['52-way valve'], '關鍵字：五埠二位、兩位置切換工作端與排氣/供氣。', 2),
  ('TEXT', '功能題-方向控制(題4)', '請畫出「五個連接埠」且能切換「工作端A/B在兩位置下互換接到供氣或排氣」的閥符號。', array['52-way valve'], '重點：兩個位置下 A/B 通路互換。', 2),

  ('TEXT', '功能題-致動器(題1)', '請畫出一種「伸出與縮回都需要氣壓驅動」的氣壓致動器符號。', array['Double-acting cylinder'], '兩端皆進氣控制，無彈簧回位。', 1),
  ('TEXT', '功能題-致動器(題2)', '請畫出一種「只有一個方向由氣壓驅動，回程靠彈性元件回位」的氣壓致動器符號。', array['Single-acting cylinder'], '一端進氣驅動，回程彈簧復位。', 1),

  ('TEXT', '功能題-流量控制(題1)', '請畫出一種「一個方向可調節流量、反方向可自由通過」的元件符號。', array['One-way flow control valve'], '典型：節流+旁通逆止結構。', 2),
  ('TEXT', '功能題-流量控制(題2)', '請畫出用於「控制致動器速度」且具備「單向可調、反向旁通」特性的元件符號。', array['One-way flow control valve'], '速度控制常見配置：回程/出程單向節流。', 2),

  ('TEXT', '功能題-邏輯(題3)', '請畫出：兩個輸入端同時施壓才允許氣流通往輸出端的邏輯元件符號。', array['Two-pressure valve'], '同時施壓才導通。', 2),
  ('TEXT', '功能題-邏輯(題4)', '請畫出：兩個輸入端任一端有壓力即可在輸出端得到壓力的邏輯元件符號。', array['Shuttle valve'], '任一端有壓力即可輸出。', 2),

  ('TEXT', '功能題-方向控制(題5)', '請畫出三埠二位閥，要求常態位置「工作端與排氣端導通」而非供氣端導通。', array['32-way NC valve'], '常態：A→R（排氣），供氣P不通A。', 1),
  ('TEXT', '功能題-方向控制(題6)', '請畫出三埠二位閥，要求常態位置「供氣端與工作端導通」。', array['32-way NO valve'], '常態：P→A 導通。', 1),

  ('TEXT', '功能題-致動器(題3)', '請畫出：有兩個進氣口、可被兩側壓力推動往返的致動器符號。', array['Double-acting cylinder'], '雙端進氣表示雙向驅動。', 1),
  ('TEXT', '功能題-致動器(題4)', '請畫出：只有一個進氣口、另一側為回位機構的致動器符號。', array['Single-acting cylinder'], '單端進氣+彈簧回位。', 1),

  ('TEXT', '功能題-流量控制(題3)', '請畫出：可調節某方向流量以控制速度、另一方向不受節流影響的元件符號。', array['One-way flow control valve'], '關鍵：單向節流+旁通。', 2),
  ('TEXT', '功能題-方向控制(題7)', '請畫出：五個連接埠、兩位置，能讓兩個工作端在兩位置下交替接到供氣或排氣的閥符號。', array['52-way valve'], 'A/B 在兩位置下互換接到P或R/S。', 2),

  ('TEXT', '功能題-邏輯(題5)', '請畫出：具有兩個輸入、一個輸出，輸出壓力取決於輸入端較高壓力來源的元件符號。', array['Shuttle valve'], '輸出選擇較高壓來源。', 2),
  ('TEXT', '功能題-邏輯(題6)', '請畫出：兩個輸入端皆需成立，輸出端才可能有壓力的元件符號。', array['Two-pressure valve'], '兩輸入皆成立才輸出。', 2)
on conflict (question_type, title) do update
set prompt_text = excluded.prompt_text,
    expected_labels = excluded.expected_labels,
    explanation = excluded.explanation,
    difficulty = excluded.difficulty,
    updated_at = now();

-- 3) 檢查插入結果
select question_type, count(*) as count
from public.questions
where is_active = true
group by question_type;

-- 4) 顯示題目
select id, question_type, title, expected_labels, difficulty
from public.questions
where is_active = true
order by question_type, difficulty, created_at;
