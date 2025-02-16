APP_NAME = GeoView
BUILD_DIR = build/bin
OS := $(shell uname 2>/dev/null || echo Windows)

# Default VERSION (fallback)
VERSION ?= dev

DEV_LDFLAGS = "-X 'main.version=dev'"
PROD_LDFLAGS = "-X 'main.version=$(VERSION)'"

# Default target
all: dev

# Build for development
dev:
	@echo "Building DEV version..."
	wails build -ldflags $(DEV_LDFLAGS)

# Build for production with a dynamic version
prod:
	@echo "Building PROD version $(VERSION)..."
	wails build -ldflags $(PROD_LDFLAGS) -clean

# Clean build artifacts
clean:
	@echo "Cleaning build directory..."
ifeq ($(OS), Windows)
	@if exist build\bin rmdir /s /q build\bin
else
	rm -rf build/bin
endif


.PHONY: all dev prod clean
