# TranSuDeck

GenAI Hubを使用した翻訳・要約・PPTX生成アプリケーション

## 概要

TranSuDeckは、GenAI Hubを活用してテキストの翻訳、要約、PowerPointプレゼンテーションの生成を行うWebアプリケーションです。

## 機能

- **翻訳**: 多言語テキスト翻訳
- **要約**: 長文テキストの自動要約
- **PPTX生成**: PowerPointファイルの自動生成
- **モデル選択**: Claude、Llamaなどから選択可能
- **初回設定**: API設定画面で.envファイルを自動生成

## 必要要件

- Python 3.11以上
- GenAI Hub APIアクセス権限
- Docker & Docker Compose（オプション）

## クイックスタート

### Dockerを使用（推奨）

```bash
# リポジトリのクローン
git clone <repository-url>
cd TranSuDeck

# 起動
docker-compose up --build
ローカル環境
bash
# 仮想環境の作成と起動
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 依存パッケージのインストール
pip install -r requirements.txt

# アプリケーションの起動
python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
使用方法
ブラウザで http://localhost:8001 にアクセス
初回起動時、API設定画面が表示されます
GenAI Hub URLとAPIキーを入力
「設定を保存」で.envファイルが自動生成されます
メイン画面でモデルを選択し、翻訳・要約・PPTX生成を実行
環境変数
初回起動時の設定画面で自動的に.envファイルが生成されます。

手動で設定する場合は、.env.exampleをコピーして編集してください：

bash
cp .env.example .env
主な設定項目
Export table
変数名	説明	必須
GENAI_API_KEY	GenAI Hub APIキー	✓
GENAI_API_URL	GenAI Hub APIエンドポイントURL	✓
LOG_LEVEL	ログレベル（INFO/DEBUG/WARNING/ERROR）	-
MAX_BULLETS	要約時の最大箇条書き数	-
開発
テスト実行
bash
pytest
コードフォーマット
bash
make format
リント
bash
make lint
プロジェクト構造
TranSuDeck/
├── app/
│   ├── core/              # 翻訳・要約・PPTX生成機能
│   ├── models/            # データモデル
│   ├── utils/             # ユーティリティ
│   ├── static/            # HTML/CSS/JS
│   ├── config.py          # 設定
│   └── main.py            # メインアプリ
├── tests/                 # テスト
├── docker/                # Dockerファイル
├── outputs/               # 生成ファイル出力先
├── logs/                  # ログ
└── .env                   # 環境変数（自動生成）
トラブルシューティング
設定をリセットしたい
bash
rm .env
アプリを再起動すると、API設定画面が再表示されます。

ポートが使用中
bash
# 別のポートを使用
uvicorn app.main:app --host 0.0.0.0 --port 8002
モデルが表示されない
API設定が正しいか確認
ブラウザのコンソールでエラーを確認
.envファイルの内容を確認
セキュリティ注意事項
.envファイルは絶対にGitにコミットしないでください
APIキーは安全に管理してください
本番環境ではHTTPSを使用してください
ライセンス
MIT License - 詳細は
LICENSE
ファイルを参照