CC     = gcc
CFLAGS = -shared -fPIC -Wall -Wextra

all: liblogger.so

liblogger.so: logger.c logger.h
	$(CC) $(CFLAGS) -o liblogger.so logger.c

clean:
	rm -f liblogger.so
