// logger.c
// 實作 logger.h 中的函式

/**
* Makefile 給 make 工具讀的「建置說明書」，用來自動化編譯
* 包含編譯器、編譯選項、目標檔案、依賴關係等資訊
    - 使用 "all" 目標來指定預設建置行為
    - 使用 "clean" 目標來清除編譯產物
* 有 Makefile 之後，只要在 core/ 目錄執行
    - make        # 編譯，產生 liblogger.so
    - make clean  # 刪除編譯產物
*/ 


// liblogger.so 是編譯產物，使用 make 命令生成

#include "logger.h"
#include <stdio.h>
#include <string.h>
#include <time.h>

#define LOG_PATH "ddas.log" // 日誌檔案路徑

/*
 * Append one log line to ddas.log.
 * Format: [YYYY-MM-DD HH:MM:SS] user | action | detail
 */
void log_write(const char* user, const char* action, const char* detail) {
    FILE* fp = fopen(LOG_PATH, "a"); // "a" 表示以追加模式開啟檔案
    if (!fp) return; // 如果檔案開啟失敗，則返回

    time_t now = time(NULL); // 獲取當前時間
    struct tm* t = localtime(&now); // 將時間轉換為本地時間
    char timestamp[32]; // 時間戳字串
    strftime(timestamp, sizeof(timestamp), "%Y-%m-%d %H:%M:%S", t); // 將時間轉換為字串

    fprintf(fp, "[%s] %s | %s | %s\n", timestamp, user, action, detail); // 寫入日誌
    fclose(fp); // 關閉檔案
}

/*
 * Read the entire ddas.log into output buffer.
 * Returns the number of lines read, or 0 if file does not exist.
 */
int log_read_all(char* output, int max_size) {
    FILE* fp = fopen(LOG_PATH, "r"); // "r" 表示以讀取模式開啟檔案
    if (!fp) {
        output[0] = '\0';
        return 0;
    }

    int total = 0; // 總字元數
    int lines = 0; // 行數
    char line[512]; // 行字串

    while (fgets(line, sizeof(line), fp) != NULL) {
        int len = (int)strlen(line); // 行字串長度
        if (total + len + 1 < max_size) {
            memcpy(output + total, line, len); // 複製行字串到輸出緩衝區
            total += len;
            lines++; // 行數加1
        }
    }
    output[total] = '\0'; // 結尾字元
    fclose(fp); // 關閉檔案
    return lines;
}
