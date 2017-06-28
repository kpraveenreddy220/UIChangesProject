TOOLCHAIN=/opt/arm-phoenix/bin/arm-equinox-linux-gnueabi

CFLAGS=-g -Wall
CC=$(TOOLCHAIN)-gcc
AR=$(TOOLCHAIN)-ar
RANLIB=$(TOOLCHAIN)-ranlib

all: hello

hello: hello.o
	@echo Making hello using compiler $(CC)
	$(CC) hello.o -o hello ${LIBS}

clean:
	rm -f *.o *.a hello
