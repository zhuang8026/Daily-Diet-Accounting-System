// logger.h
// 對外函式宣告

#ifndef LOGGER_H
#define LOGGER_H

void log_write(const char* user, const char* action, const char* detail);
int  log_read_all(char* output, int max_size);

#endif
