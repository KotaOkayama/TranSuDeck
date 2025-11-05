# TranSuDeck

GenAI Hubを使用した翻訳・要約・PPTX生成アプリケーション

## 概要

TranSuDeckは、GenAI Hubを活用してテキストの翻訳、要約、PowerPointプレゼンテーションの生成を行うWebアプリケーションです。

## UI スクリーンショット

### API設定画面（初回起動時）
![API設定画面](images/API.png)

### メインUI画面
![メインUI画面](images/UI1.png)

## 機能

- **翻訳**: 多言語テキスト翻訳（10言語対応）
- **要約**: 長文テキストの自動要約
- **PPTX生成**: PowerPointファイルの自動生成
- **モデル選択**: Claude、Llamaなどから選択可能
- **初回設定**: API設定画面で設定を自動保存

## 対応言語

| 言語 | コード |
|------|--------|
| English（英語） | en |
| Japanese（日本語） | ja |
| Korean（韓国語） | ko |
| Chinese（中国語） | zh |
| French（フランス語） | fr |
| German（ドイツ語） | de |
| Spanish（スペイン語） | es |
| Hindi（ヒンディー語） | hi |
| Vietnamese（ベトナム語） | vi |
| Thai（タイ語） | th |

## 必要要件

- Docker & Docker Compose
- GenAI Hub APIアクセス権限

## 🚀 クイックスタート（利用者向け）

### GitHub Container Registry からのイメージ利用

1. Dockerイメージのプル:
   docker pull ghcr.io/kotaokayama/transudeck:latest

2. コンテナの起動:
   docker run -d -p 8001:8001 --name transudeck ghcr.io/kotaokayama/transudeck:latest

   - アプリケーションにアクセスするポートを変更する場合は左側のポート番号（ホスト側）のみを変更してください
   - 例: -p 8080:8001 でポート8080でアクセス可能

3. アプリケーションへのアクセス:
   - ブラウザで http://localhost:8001 を開く
   - 初回起動時にAPI キーとAPI URLを設定

4. コンテナの停止:
   docker stop transudeck

5. コンテナの起動（2回目以降）:
   docker start transudeck

6. コンテナの削除:
   docker rm transudeck

   注意: コンテナを削除すると、設定と生成ファイルも削除されます

## クイックスタート（開発者向け）

### Dockerを使用

リポジトリのクローン:
git clone <repository-url>
cd TranSuDeck

起動:
docker-compose up -d --build

ログ確認:
docker-compose logs -f

ブラウザで http://localhost:8001 にアクセス

### ローカル環境

仮想環境の作成と起動:
python -m venv venv
source venv/bin/activate
Windows の場合: venv\Scripts\activate

依存パッケージのインストール:
pip install -r requirements.txt

アプリケーションの起動:
python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload

## 使用方法

1. ブラウザで http://localhost:8001 にアクセス
2. 初回起動時、API設定画面が表示されます
3. GenAI Hub APIキーとエンドポイントURLを入力
4. 「Save Settings」をクリック
5. メイン画面でモデルを選択
6. テキストを入力し「Translate & Summarize」をクリック
7. 要約結果を「Send to Editor」でスライドエディタに送信
8. スライドを編集後、「Generate PPTX」でPowerPointファイルを生成

## 環境変数

初回起動時の設定画面で自動的に保存されます。

Docker環境では /app/config/.env に、ローカル環境では .env に保存されます。

### 主な設定項目

| 変数名 | 説明 | 必須 |
|--------|------|------|
| GENAI_API_KEY | GenAI Hub APIキー | ✓ |
| GENAI_API_URL | GenAI Hub APIエンドポイントURL | ✓ |

## プロジェクト構造

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
└── docker-compose.yml     # Docker設定

## 🧪 テスト

### テストの実行

すべてのテストを実行:
make test

または:
pytest

## トラブルシューティング

### 一般的な問題

1. API設定の問題:
   - API KeyとAPI URLが正しく設定されているか確認
   - API Keyの権限を確認
   - API URLが正しいフォーマットであることを確認（例: https://api.example.com/v1）

2. Docker関連の問題:
   - Docker Desktopが起動していることを確認
   - コンテナのログを確認: docker logs transudeck
   - コンテナの再ビルドを試す

3. ポートが使用中:
   別のポートを使用:
   docker run -d -p 8080:8001 --name transudeck ghcr.io/kotaokayama/transudeck:latest

### 設定をリセットしたい

Docker環境（GitHub Container Registry）:
コンテナを削除して再起動:
docker stop transudeck
docker rm transudeck
docker run -d -p 8001:8001 --name transudeck ghcr.io/kotaokayama/transudeck:latest

Docker環境（docker-compose）:
docker-compose down --volumes
docker-compose up -d

ローカル環境:
rm .env

アプリを再起動すると、API設定画面が再表示されます。

### モデルが表示されない

- API設定が正しいか確認
- ブラウザのコンソールでエラーを確認（F12キー）
- ログを確認: docker logs transudeck

### 完全リセット（docker-compose）

docker-compose down --rmi all --volumes --remove-orphans
docker-compose build --no-cache
docker-compose up -d

## セキュリティ注意事項

- APIキーは安全に管理してください
- 本番環境ではHTTPSを使用してください
- 設定ファイルは絶対にGitにコミットしないでください

## ライセンス

MIT License - 詳細は LICENSE ファイルを参照
