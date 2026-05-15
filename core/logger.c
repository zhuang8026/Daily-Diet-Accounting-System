#include "logger.h"
#include <stdio.h>
#include <string.h>
#include <time.h>

#define LOG_PATH "ddas.log"

/*
 * Append one log line to ddas.log.
 * Format: [YYYY-MM-DD HH:MM:SS] user | action | detail
 */
void log_write(const char* user, const char* action, const char* detail) {
    FILE* fp = fopen(LOG_PATH, "a");
    if (!fp) return;

    time_t now = time(NULL);
    struct tm* t = localtime(&now);
    char timestamp[32];
    strftime(timestamp, sizeof(timestamp), "%Y-%m-%d %H:%M:%S", t);

    fprintf(fp, "[%s] %s | %s | %s\n", timestamp, user, action, detail);
    fclose(fp);
}

/*
 * Read the entire ddas.log into output buffer.
 * Returns the number of lines read, or 0 if file does not exist.
 */
int log_read_all(char* output, int max_size) {
    FILE* fp = fopen(LOG_PATH, "r");
    if (!fp) {
        output[0] = '\0';
        return 0;
    }

    int total = 0;
    int lines = 0;
    char line[512];

    while (fgets(line, sizeof(line), fp) != NULL) {
        int len = (int)strlen(line);
        if (total + len + 1 < max_size) {
            memcpy(output + total, line, len);
            total += len;
            lines++;
        }
    }
    output[total] = '\0';
    fclose(fp);
    return lines;
}
