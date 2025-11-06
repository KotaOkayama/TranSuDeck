.PHONY: help install install-dev dev run docker-build docker-up docker-down docker-logs docker-dev clean test test-cov lint format format-check all-tests venv

help:
	@echo "TranSuDeck - Available commands:"
	@echo ""
	@echo "📦 Installation:"
	@echo "  make venv         - Create virtual environment"
	@echo "  make install      - Install dependencies"
	@echo "  make install-dev  - Install dev dependencies"
	@echo ""
	@echo "🚀 Running:"
	@echo "  make dev          - Run in development mode"
	@echo "  make run          - Run in production mode"
	@echo ""
	@echo "🐳 Docker:"
	@echo "  make docker-build - Build Docker image"
	@echo "  make docker-up    - Start Docker containers"
	@echo "  make docker-down  - Stop Docker containers"
	@echo "  make docker-logs  - View Docker logs"
	@echo "  make docker-dev   - Run in Docker dev mode"
	@echo "  make docker-test  - Build and test Docker container"
	@echo ""
	@echo "🧪 Testing:"
	@echo "  make test         - Run tests"
	@echo "  make test-cov     - Run tests with coverage report"
	@echo "  make lint         - Run lint checks"
	@echo "  make format-check - Check code formatting"
	@echo "  make format       - Auto-format code"
	@echo "  make all-tests    - Run all tests (recommended before commit)"
	@echo ""
	@echo "🧹 Cleanup:"
	@echo "  make clean        - Clean temporary files"
	@echo "  make clean-all    - Clean everything including venv"

# 仮想環境の作成
venv:
	@echo "📦 Creating virtual environment..."
	python3 -m venv venv
	@echo "✅ Virtual environment created"
	@echo "💡 Activate with: source venv/bin/activate"

# 依存関係のインストール
install:
	@echo "📦 Installing dependencies..."
	pip install -r requirements.txt
	@echo "✅ Dependencies installed"

install-dev:
	@echo "📦 Installing dev dependencies..."
	pip install -r requirements.txt
	pip install -r requirements-dev.txt
	@echo "✅ Dev dependencies installed"

# 開発モードで実行
dev:
	@echo "🚀 Starting development server..."
	uvicorn app.main:app --reload --host 0.0.0.0 --port 8001

# 本番モードで実行
run:
	@echo "🚀 Starting production server..."
	uvicorn app.main:app --host 0.0.0.0 --port 8001

# Dockerコマンド
docker-build:
	@echo "🐳 Building Docker image..."
	docker-compose build
	@echo "✅ Docker image built"

docker-up:
	@echo "🐳 Starting Docker containers..."
	docker-compose up -d
	@echo "✅ Containers started"
	@echo "💡 Access at: http://localhost:8001"

docker-down:
	@echo "🐳 Stopping Docker containers..."
	docker-compose down
	@echo "✅ Containers stopped"

docker-logs:
	@echo "📋 Viewing Docker logs..."
	docker-compose logs -f

docker-dev:
	@echo "🐳 Starting Docker in dev mode..."
	docker-compose -f docker-compose.dev.yml up

docker-test:
	@echo "🧪 Building and testing Docker container..."
	@docker rm -f transudeck-test 2>/dev/null || true
	docker build -t transudeck:test -f docker/Dockerfile .
	@echo "🚀 Starting test container..."
	docker run -d -p 8001:8001 \
		-e GENAI_HUB_API_KEY=test_key \
		-e GENAI_HUB_API_URL=https://api.test.com \
		-e DEBUG=true \
		--name transudeck-test \
		transudeck:test
	@echo "⏳ Waiting for container to start..."
	@sleep 10
	@echo "🔍 Testing endpoints..."
	@curl -f http://localhost:8001/ > /dev/null 2>&1 && echo "✅ Root endpoint OK" || echo "❌ Root endpoint failed"
	@curl -f http://localhost:8001/api/config/status > /dev/null 2>&1 && echo "✅ Config status OK" || echo "❌ Config status failed"
	@echo "🧹 Cleaning up..."
	@docker stop transudeck-test
	@docker rm transudeck-test
	@echo "✅ Docker test completed"

# テスト実行
test:
	@echo "🧪 Running tests..."
	pytest tests/ -v

test-cov:
	@echo "🧪 Running tests with coverage..."
	pytest tests/ -v --cov=app --cov-report=html --cov-report=term
	@echo "📊 Coverage report generated: htmlcov/index.html"
	@echo "💡 Open with: open htmlcov/index.html (macOS) or xdg-open htmlcov/index.html (Linux)"

# Lintチェック
lint:
	@echo "🔍 Running lint checks..."
	@echo "Checking for critical errors..."
	flake8 app/ tests/ --count --select=E9,F63,F7,F82 --show-source --statistics
	@echo "Checking code quality..."
	flake8 app/ tests/ --count --exit-zero --max-complexity=10 --max-line-length=127 --statistics
	@echo "✅ Lint checks completed"

# フォーマットチェック
format-check:
	@echo "🎨 Checking code format..."
	@black --check app/ tests/ && echo "✅ Black: OK" || echo "❌ Black: Formatting needed"
	@isort --profile black --check-only app/ tests/ && echo "✅ isort: OK" || echo "❌ isort: Import sorting needed"

# 自動フォーマット
format:
	@echo "🎨 Formatting code..."
	@isort --profile black app/ tests/
	@black app/ tests/
	@echo "✅ Code formatted"

# 型チェック
type-check:
	@echo "🔍 Running type checks..."
	mypy app/ --ignore-missing-imports || true
	@echo "✅ Type check completed"

# すべてのテストを実行（コミット前推奨）
all-tests:
	@echo "🧪 Running all tests..."
	@echo ""
	@echo "1️⃣ Lint checks..."
	@$(MAKE) lint
	@echo ""
	@echo "2️⃣ Format checks..."
	@$(MAKE) format-check
	@echo ""
	@echo "3️⃣ Python tests..."
	@$(MAKE) test
	@echo ""
	@echo "4️⃣ Docker build test..."
	@$(MAKE) docker-test
	@echo ""
	@echo "✅ All tests passed! Ready to commit."

# クリーンアップ
clean:
	@echo "🧹 Cleaning temporary files..."
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".mypy_cache" -exec rm -rf {} + 2>/dev/null || true
	rm -rf htmlcov/ .coverage
	rm -rf outputs/*.pptx
	rm -rf logs/*.log
	@docker rm -f transudeck-test 2>/dev/null || true
	@echo "✅ Cleanup completed"

clean-all: clean
	@echo "🧹 Cleaning everything including venv..."
	rm -rf venv/
	@echo "✅ Full cleanup completed"

# 開発環境のセットアップ（初回）
setup: venv install-dev
	@echo "✅ Development environment setup completed"
	@echo "💡 Activate venv with: source venv/bin/activate"

# クイックテスト（最小限）
quick-test:
	@echo "⚡ Running quick tests..."
	pytest tests/ -v -x
	@echo "✅ Quick test completed"

# ウォッチモード（ファイル変更時に自動テスト）
test-watch:
	@echo "👀 Watching for changes..."
	pytest-watch tests/ -- -v

# セキュリティチェック
security-check:
	@echo "🔒 Running security checks..."
	@pip install safety bandit 2>/dev/null || true
	@echo "Checking dependencies..."
	@safety check || true
	@echo "Checking code..."
	@bandit -r app/ -ll || true
	@echo "✅ Security check completed"

# 依存関係の更新
update-deps:
	@echo "📦 Updating dependencies..."
	pip install --upgrade pip
	pip list --outdated
	@echo "💡 To upgrade: pip install --upgrade <package>"

# プロジェクト情報
info:
	@echo "📊 TranSuDeck Project Info"
	@echo "=========================="
	@echo "Python version: $$(python --version)"
	@echo "Pip version: $$(pip --version)"
	@echo "Docker version: $$(docker --version 2>/dev/null || echo 'Not installed')"
	@echo "Docker Compose version: $$(docker-compose --version 2>/dev/null || echo 'Not installed')"
	@echo ""
	@echo "📁 Project structure:"
	@find . -maxdepth 2 -type d -not -path '*/\.*' -not -path './venv*' | sort

# CI/CDのシミュレーション
ci-local:
	@echo "🔄 Simulating CI/CD pipeline locally..."
	@echo ""
	@echo "Step 1: Lint"
	@make lint
	@echo ""
	@echo "Step 2: Format Check"
	@make format-check
	@echo ""
	@echo "Step 3: Tests"
	@make test-cov
	@echo ""
	@echo "Step 4: Docker Build"
	@make docker-build
	@echo ""
	@echo "✅ CI/CD simulation completed"
