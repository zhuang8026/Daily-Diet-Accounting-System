# ============================================================
# 每日飲食記帳系統 — BDD 行為驅動開發規格（Gherkin）
# 對應規格書第 13 節 OTHER-01 選項 A
# 涵蓋 TC-001 至 TC-007 全部測試案例
# ============================================================

Feature: TC-001 使用者註冊

  Scenario: 成功以有效資料建立帳號
    Given 使用者尚未擁有帳號
    When 使用者填寫 Email "newuser@test.com"、密碼 "Test@123"、確認密碼 "Test@123"、暱稱 "測試用戶"
    Then 系統顯示「註冊成功，請登入」
    And 頁面導向至登入頁

  Scenario: 使用重複 Email 註冊
    Given 系統中已存在 Email 為 "demo@demo.com" 的帳號
    When 使用者嘗試以同一 Email "demo@demo.com" 進行註冊
    Then 系統顯示「此 Email 已被使用」
    And 頁面停留在註冊頁

  Scenario: 密碼強度不足無法送出
    Given 使用者在註冊表單填寫密碼 "abc"（長度不足且缺少字元類型）
    When 使用者點擊「建立帳號」按鈕
    Then 系統顯示「密碼強度不足，需至少 6 字元且包含 3 種字元類型」
    And 表單無法送出

---

Feature: TC-002 使用者登入

  Scenario: 以正確帳密登入
    Given 使用者帳號 "demo@demo.com" / 密碼 "Demo@123" 已存在
    When 使用者在登入頁輸入正確帳密並點擊「登入」
    Then 系統驗證通過
    And 頁面導向至 /dashboard（今日飲食總覽頁）

  Scenario: 輸入錯誤密碼
    Given 使用者存在帳號 "demo@demo.com"
    When 使用者輸入密碼 "WrongPassword1!"（錯誤密碼）並點擊「登入」
    Then 系統顯示「帳號或密碼錯誤」
    And 頁面停留在登入頁

  Scenario: 連續輸入錯誤密碼 5 次後帳號鎖定
    Given 使用者存在帳號 "demo@demo.com"
    When 使用者連續 5 次輸入錯誤密碼
    Then 系統顯示「帳號已鎖定，請於 15 分鐘後再試」
    And 登入按鈕在鎖定期間無法送出

---

Feature: TC-003 新增飲食紀錄

  Background:
    Given 使用者已以帳號 "demo@demo.com" / "Demo@123" 登入
    And 使用者目前位於 /dashboard 頁面

  Scenario: 成功新增午餐雞胸肉紀錄
    When 使用者點擊「新增飲食」按鈕
    And 在食物名稱欄位輸入「雞胸肉」
    And 從自動補全清單選擇「雞胸肉（水煮）」（foodId: F002）
    And 選擇餐別「午餐」
    And 輸入份量 1.0
    And 點擊「儲存」
    Then 系統顯示 Toast 通知「✓ 飲食紀錄已儲存，今日累計 165 kcal」
    And 午餐區塊出現「雞胸肉（水煮） 1.0 份 165 kcal」

  Scenario: 不輸入份量直接送出
    When 使用者點擊「新增飲食」按鈕
    And 選擇食物後清空份量欄位
    And 點擊「儲存」
    Then 系統顯示警示「份量為必填欄位，需大於 0」
    And Modal 保持開啟狀態

---

Feature: TC-004 個人目標設定

  Background:
    Given 使用者已以帳號 "demo@demo.com" / "Demo@123" 登入

  Scenario: 輸入生理資料後系統計算建議熱量
    When 使用者進入設定頁（/settings）
    And 選擇性別「男」、輸入年齡 28、身高 175cm、體重 70kg、活動量「中度」
    And 選擇飲食目標「維持體重」
    Then 系統使用 Harris-Benedict 公式計算並顯示建議熱量（應約為 2782 kcal）

  Scenario: 手動覆蓋目標熱量
    When 使用者進入設定頁
    And 點擊「套用建議值」後再手動將熱量目標改為 2000
    And 點擊「儲存設定」
    Then 設定成功儲存
    And 返回 /dashboard 時進度條反映 2000 kcal 目標

---

Feature: TC-005 趨勢報表

  Background:
    Given 使用者已以帳號 "demo@demo.com" / "Demo@123" 登入
    And 使用者至少有 1 天的飲食紀錄

  Scenario: 切換 7 天與 30 天報表
    When 使用者進入 /report 頁面
    And 預設顯示「近 7 天」報表
    Then 熱量折線圖 X 軸顯示 7 個日期資料點
    When 使用者點擊「近 30 天」
    Then 熱量折線圖 X 軸顯示 30 個日期資料點

  Scenario: 無紀錄日期顯示 0 並以空心圓標示
    Given 使用者在 7 天內有某日無飲食紀錄
    When 使用者查看 7 天趨勢折線圖
    Then 無紀錄的日期資料點顯示為 0 kcal
    And 該點以空心圓標示（pointBackgroundColor: transparent）

---

Feature: TC-006 後台食物資料庫管理

  Background:
    Given 使用者已以管理員帳號 "admin@demo.com" / "Admin@123" 登入
    And 使用者目前位於後台食物管理頁（/admin/foods）

  Scenario: 新增一筆食物
    When 管理員點擊「新增食物」
    And 填寫食物名稱「烤雞腿」、類別「肉類」、熱量 250
    And 點擊「儲存」
    Then 食物列表中出現「烤雞腿」新紀錄

  Scenario: 編輯食物名稱
    When 管理員點擊「白飯」的編輯按鈕
    And 將名稱改為「白飯（大碗）」
    And 點擊「儲存」
    Then 食物列表中「白飯」名稱更新為「白飯（大碗）」

  Scenario: 刪除未被引用的食物
    Given 食物資料庫中存在「洋芋片」且未被任何使用者飲食紀錄引用
    When 管理員點擊「洋芋片」的刪除按鈕
    And 在確認對話框點擊「確認刪除」
    Then 「洋芋片」從食物列表消失

---

Feature: TC-007 響應式設計（RWD）

  Scenario: 手機版（375px）顯示底部導覽列
    Given 使用者已登入並在 /dashboard
    When 瀏覽器視窗寬度設定為 375px（模擬 iPhone SE）
    Then 底部導覽列（app-bottom-nav）顯示於頁面底部
    And 左側側邊欄（app-sidebar）隱藏

  Scenario: 桌機版（1440px）顯示左側側邊欄
    Given 使用者已登入並在 /dashboard
    When 瀏覽器視窗寬度設定為 1440px（模擬桌機）
    Then 左側側邊欄（app-sidebar）顯示
    And 底部導覽列（app-bottom-nav）隱藏
