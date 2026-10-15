# AUTOMAIX website

3言語の静的HTMLと、会社資料の登録メール送信・ダウンロード認可用Node.jsサーバーで構成する企業サイトです。

## ローカルで確認

リポジトリのルートで、Node.jsサーバーを起動します。SMTP未設定でも閲覧・入力検証は可能ですが、会社資料はロックされます。

```sh
pnpm install --frozen-lockfile
pnpm start
```

ブラウザーで `http://127.0.0.1:8767/` を開きます。静的サーバーでprivateフォルダーを含む全ソースを公開しないでください。

## 更新元とビルド

- `content/products.json`: 製品名、カテゴリー、仕様、紹介文、画像、詳細テーブルの更新元。
- `content/pages.json`: 固定ページのタイトル、説明、構造化データ。
- `templates/page.html`: 共通ヘッダー・フッターとHTMLの外枠。
- `templates/index.html`: ホーム本文。製品一覧と相談フォームの選択肢はビルド時に挿入。
- `templates/company.html`: 日本法人と自社工場の会社紹介。
- `templates/privacy.html`, `templates/site-policy.html`: サイト上の案内文。
- `styles.css`, `app.js`: 全ページで共有する見た目・動作。

テンプレートや製品情報を更新後、Node.jsで次を実行します。外部パッケージのインストールは不要です。

```sh
node scripts/build.mjs
```

日本語・英語・簡体字中国語の84ページと `sitemap.xml` が生成されます。生成HTMLだけを編集すると次回ビルドで上書きされるため、上記の更新元を編集してください。

## 多言語

- 日本語：ルート（`/`）
- English：`/en/`
- 简体中文：`/zh/`

全ページに同じページの言語切替リンクを設けています。製品IDとページ内位置は切替時に維持します。個人情報を含むフォーム入力内容は言語切替で保存・転送しません。
本文、見出し、仕様表、画像の代替テキスト、検索説明は `content/translations.json` で管理し、`scripts/localize.mjs` が静的ページに変換します。新しい日本語の文章に翻訳がない場合はビルドを停止します。
メニュー・ニュース件数・相談文面・コピー結果などの動的メッセージは `app.js` の `messages` で管理します。翻訳を修正したら `node scripts/build.mjs` を実行してください。
各言語ページは自己参照canonical、相互hreflang、x-default、適切なhtml langとOG localeを持ちます。ブラウザー言語による自動転送は行いません。

更新後の静的チェックは次のコマンドで行えます。

```sh
node --check app.js
python scripts/check_site.py
```

ローカルリンク・ページ内アンカー・画像・メタデータ・見出し・相談フォームの送信方式を確認します。公開前にはブラウザーでPC/スマートフォン両方の動作も確認してください。

## PDF資料

各言語に会社紹介と3D製品ガイドのPDFがあります。日本語は元のファイル名、英語は `-en.pdf`、中国語は `-zh.pdf` です。各4ページ、計6資料が2026年10月版です。
作成元は `scripts/build_pdfs.py` と `scripts/build_localized_pdfs.py`。ReportLab、Pillow、lxmlと、WindowsのMeiryo／Microsoft JhengHei／Segoe UIフォントを使います。

```sh
python scripts/build_pdfs.py
```

PDFはHTMLのビルド後に作成し、全ページを画像化して文字・表・改ページを確認してください。フォントの場所を変更する場合はスクリプト冒頭を調整します。

## 公開

会社紹介PDFのダウンロードはサーバー側の登録・メール送信が必要です。GitHub Pagesだけでは動作しません。Node.js 24以上のサーバーで `server.mjs` を起動し、HTTPSリバースプロキシから転送してください。GitHubへのソース管理は継続できます。
この更新作業ではGitHubへのプッシュ・公開は実施していません。

## 会社資料のダウンロード登録

会社名・氏名・メールアドレス・個人情報利用への同意が必須、電話番号は任意です。登録内容を `info@automaix.co.jp` へSMTPで送信し、メールサーバーが受け付けた後だけ、10分間有効なHttpOnly Cookieで会社資料のダウンロードを許可します。メールの受け付けは受信トレイへの到達保証ではありません。

1. `pnpm install --frozen-lockfile` で依存をインストールします。
2. `.env.example` を `.env` にコピーし、SMTP_HOST、SMTP_PORT、SMTP_USER、SMTP_PASS（メールのアプリパスワード／認証コード）、SMTP_FROMを設定します。SMTP_FROMは送信が認証された会社アドレスを使います。TLS接続が必須です。
3. 本番は PUBLIC_ORIGIN=https://www.automaix.co.jp、COOKIE_SECURE=true とし、`pnpm start` で起動します。ローカル確認ではPUBLIC_ORIGINをローカルURLに変更するか省略し、COOKIE_SECURE=falseとします。
4. 会社紹介PDF3言語分は `private/brochures/` に置きます。公開ディレクトリや外部ストレージの公開URLにコピーしないでください。旧公開URLやCDNキャッシュが残っている場合は削除します。リバースプロキシは静的配信で迂回せず、全リクエストをNodeへ転送してください。
5. 実際の認証情報を使った送信と受信メールの確認は、公開前に行います。`.env` と node_modules はGit管理・配布ZIPから除外します。秘密情報はチャットやHTML/JSへ記入しないでください。

SMTP未設定・送信失敗・入力不備では権限を発行しません。入力情報はURL、ブラウザー保存領域、サーバーログには保存せず、会社宛メールで受け取ります。電話は任意です。製品ガイドは引き続き登録不要です。

Muumuu MailはSMTP_PORT=465、SMTP_USERとSMTP_FROMはinfo@automaix.co.jpです。SMTP_HOSTはコントロールパネルのメールアドレス一覧 > 対象アドレスの設定から確認してください。SMTP_PASSはそのメールアドレスのパスワードです。公式: https://support.muumuu-domain.com/hc/ja/articles/4407628959635-Gmail%E3%81%AE%E8%A8%AD%E5%AE%9A

private/はGit管理から除外しています。PDFを公開GitHubリポジトリへ追加しないでください。配布ZIPに含まれるprivate/brochuresをサーバーへ別途配置します。既に外部公開された過去版の回収は、この登録機能ではできません。ループバックに限定した信頼できるプロキシを使う場合のみTRUST_LOOPBACK_PROXY=trueにして、プロキシが実際の接続元IPをX-Forwarded-Forの末尾に付加してください。

`pnpm test` はローカルの模擬メール送信で、3言語の正常系、未登録、期限切れ、直接PDFアクセス、入力不備、送信失敗、連続送信制限を確認します。実際のメールは送りません。

## お問い合わせフォーム

入力内容はブラウザー内でメール文面に整形します。準備・コピー・保存の操作ではサーバーへ送信されません。利用者がメールアプリで確認し、送信する仕組みです。自動送信や受付完了の機能はありません。

送信先は `info@automaix.co.jp`。変更する場合はテンプレート、app.js、会社情報、ポリシー、PDF資料も併せて更新します。

## 内容の取り扱い

日本法人は株式会社Automaixです。製造体制は自社工場として紹介し、中国の法人名は掲載しません。日本法人と自社工場それぞれの沿革・設立年は資料に従って表示してください。
SorterMX-5／SorterMN-3と国内取扱モデルの対応関係は未確定のため、同一モデルと表示していません。未確認の性能・電源・温度帯・保険・据付日数などは、一律の保証として掲載していません。
