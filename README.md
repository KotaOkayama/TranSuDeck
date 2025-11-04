# TranSuDeck

**Translate + Summarize + Deck**

英文を翻訳してサマライズし、PPTX形式で出力するWebアプリケーション

## 🎯 機能

- ✨ テキスト翻訳（GenAI Hub API使用）
- 📝 翻訳文のサマライズ（箇条書き形式）
- 🎨 PPTXプレビュー＆編集
- 🔄 ドラッグ＆ドロップでスライド並び替え
- 📥 PPTX出力
- 🌐 多言語対応（英語、日本語、韓国語、中国語など）

## 📸 スクリーンショット

![TranSuDeck UI](docs/screenshot.png)

## 🚀 クイックスタート

### Docker使用（推奨）

```bash
# 1. リポジトリをクローン
git clone https://github.com/yourusername/TranSuDeck.git
cd TranSuDeck

# 2. 環境変数設定
cp .env.example .env
# .envを編集してAPI設定を記入

# 3. コンテナ起動
docker-compose up -d

# 4. アクセス
open http://localhost:8000
ローカル実行
bash
# 1. 仮想環境作成
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 2. 依存関係インストール
pip install -r requirements.txt

# 3. 環境変数設定
cp .env.example .env
# .envを編集

# 4. アプリ起動
uvicorn app.main:app --reload

# 5. アクセス
open http://localhost:8000
📖 使い方
基本的な使い方
API設定: 初回起動時にGenAI Hub API KeyとURLを設定
テキスト入力: 左上のテキストボックスに翻訳したいテキストを入力
言語選択: ソース言語とターゲット言語を選択
モデル選択: 使用するAIモデルを選択
翻訳＆サマライズ: ボタンをクリックして実行
PPTXに送る: サマリ結果をスライドに送信
編集: 右側でスライドを編集・並び替え
出力: Export PPTXボタンでダウンロード
高度な使い方
スライドの並び替え: スライドをドラッグ＆ドロップで移動
スライドの編集: スライドを選択して右側のエディタで編集
複数スライド作成: 異なるテキストを複数回翻訳してスライドに追加
🔧 設定
環境変数
Export table
変数名	説明	デフォルト値
GENAI_HUB_API_KEY	GenAI Hub APIキー	-
GENAI_HUB_API_URL	GenAI Hub API URL	-
DEBUG	デバッグモード	false
LOG_LEVEL	ログレベル	INFO
MAX_BULLETS	最大箇条書き数	5
API_TIMEOUT	APIタイムアウト（秒）	60
サポート言語
🇬🇧 English (en)
🇯🇵 Japanese (ja)
🇰🇷 Korean (ko)
🇨🇳 Chinese (zh)
🇫🇷 French (fr)
🇩🇪 German (de)
🇪🇸 Spanish (es)
📁 プロジェクト構造
TranSuDeck/
├── app/
│   ├── main.py              # FastAPIメインアプリ
│   ├── config.py            # 設定管理
│   ├── core/
│   │   ├── translator.py    # 翻訳機能
│   │   ├── summarizer.py    # サマライズ機能
│   │   └── pptx_generator.py # PPTX生成
│   ├── models/
│   │   └── slide.py         # データモデル
│   └── static/
│       ├── css/style.css
│       ├── js/app.js
│       └── index.html
├── docker/
│   ├── Dockerfile           # 本番用
│   └── Dockerfile.dev       # 開発用
├── outputs/                 # 生成されたPPTXファイル
├── logs/                    # ログファイル
└── tests/                   # テストファイル
🧪 テスト
bash
# テスト実行
pytest

# カバレッジ付きテスト
pytest --cov=app tests/

# Dockerでテスト
docker-compose -f docker-compose.dev.yml exec transudeck-dev pytest
🐛 トラブルシューティング
よくある問題
API設定エラー

API KeyとURLが正しく設定されているか確認
API Keyの権限を確認
モデルが読み込めない

API URLが正しいフォーマットか確認
ネットワーク接続を確認
PPTX生成エラー

python-pptxがインストールされているか確認
ログファイルでエラー詳細を確認
ログ確認
bash
# アプリケーションログ
tail -f logs/app.log

# Dockerログ
docker-compose logs -f
🤝 コントリビューション
Forkしてブランチを作成
変更を実装
テストを追加
Pull Requestを作成
📝 ライセンス
MIT License

👤 作者
Your Name

🙏 謝辞
FastAPI
python-pptx
GenAI Hub
EOF