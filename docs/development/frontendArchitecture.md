# フロントエンドアーキテクチャ

フロントエンドは Next.js、React、TypeScript、Tailwind CSS を使います。
ルーティング、共通 UI、機能固有の実装、外部との接続を分離し、変更の影響範囲を小さくします。

## 基本方針

- `app` はルーティングと Next.js 固有の処理に集中する。
- 複数機能で使う UI は `components` に置く。
- 機能固有のコードは `features` にまとめる。
- 複数機能で使うロジックは `hooks` または `lib` に置く。
- API のレスポンスを画面から直接扱わず、機能のデータ層を経由する。
- ディレクトリやファイルは、必要になった時点で追加する。

## ディレクトリ構成

```txt
front/
  app/
    events/
      new/
        page.tsx
      [eventid]/
        page.tsx
        slots/
          [slotid]/
            page.tsx
    home/
      page.tsx
    login/
      page.tsx
    globals.css
    layout.tsx
    page.tsx
  components/
    feedback/
    layout/
  features/
    auth/
      components/
      data/
      services/
      types/
    events/
      components/
      data/
      services/
      types/
  hooks/
  lib/
  public/
```

## app

Next.js App Router のルーティング層です。

責任:

- URL と画面の対応
- path parameter、query parameter の受け取り
- `layout.tsx` による共通レイアウト
- `loading.tsx` によるローディング表示
- `error.tsx` によるエラー境界
- Server Component での初期データ取得
- `features` のコンポーネントを組み合わせた画面表示

避けること:

- 複雑な画面ロジックを書く
- API 通信処理を直接定義する
- 再利用可能な UI を `page.tsx` 内に作り込む

`page.tsx` は、データの受け取りと画面コンポーネントへの受け渡しを中心に薄く保ちます。

## components

複数の機能から利用する共通 UI を置きます。

### components/feedback

処理結果や状態を伝える UI を置きます。

例:

- ローディング表示
- エラー表示
- データがない場合の表示
- 通知やメッセージ

### components/layout

画面全体の構造を作る UI を置きます。

例:

- ヘッダー
- ナビゲーション
- ページコンテナ
- 共通フッター

機能固有の文言やロジックを持つコンポーネントは、ここではなく `features` に置きます。

## features

機能単位でコードをまとめます。
現在は認証を扱う `auth` と、イベントを扱う `events` を用意しています。

```txt
features/<feature-name>/
  components/
  data/
  services/
  types/
```

### components

その機能だけで使う UI コンポーネントを置きます。

例:

- `LoginForm`
- `EventCard`
- `EventTimeline`
- `CommentList`

### data

データを受け取る、または外部へ渡す処理を置きます。

責任:

- API client の呼び出し
- request の組み立て
- response の受け取り
- 外部データからフロントエンド用データへの変換

例:

```txt
authApi.ts
eventApi.ts
```

避けること:

- React の表示処理を含める
- コンポーネントの状態を管理する
- 複雑な画面判断を行う

### services

機能固有の処理や判断を置きます。

責任:

- 複数のデータ取得処理の組み合わせ
- 画面表示に必要なデータ加工
- 機能固有の入力チェック
- イベント決定などのユースケース処理

API を呼ぶだけで追加の処理がない場合は、無理に service を作らず `data` を直接利用して構いません。

### types

機能内で利用する型を置きます。

例:

```txt
event.ts
timeSlot.ts
user.ts
```

バックエンドの型をそのまま複製せず、フロントエンドで必要な形として定義します。
型共有が必要になった場合は、共有方法を別途設計します。

## hooks

複数の機能から利用する React Hook を置きます。

例:

- 画面幅の監視
- ブラウザストレージの操作
- 共通の開閉状態管理

機能固有の Hook は、必要になった時点で `features/<feature-name>/hooks` を作成して置きます。
React を利用しない処理は `hooks` ではなく `lib` に置きます。

## lib

特定の機能や React に依存しない共通処理を置きます。

例:

- API client の共通設定
- 環境変数の読み込み
- 日付や文字列の変換
- 汎用 validation

```txt
lib/
  apiClient.ts
  env.ts
  formatDate.ts
```

機能固有の処理を `lib` に集めず、該当する `features` に置きます。

## public

ブラウザから直接配信する静的ファイルを置きます。

例:

- ロゴ
- アイコン
- OGP 画像

コンポーネントとして操作したい SVG は、利用方法を検討したうえで `components` に置く場合があります。

## データの流れ

基本的な依存方向は次のとおりです。

```txt
app
  -> features/*/components
  -> features/*/services
  -> features/*/data
  -> lib
```

共通 UI は次のように利用します。

```txt
app or features/*/components
  -> components
```

ルール:

- `components` は `features` に依存しない。
- `lib` は `app`、`components`、`features` に依存しない。
- ある feature から別の feature の内部ファイルを安易に import しない。
- feature 間で共有が必要なものは、責任を確認して `components`、`hooks`、`lib` への移動を検討する。
- 循環参照を作らない。

## Server Component と Client Component

- `page.tsx` は原則として Server Component を使う。
- ブラウザ API、イベントハンドラ、React の state が必要な部分だけ Client Component にする。
- `"use client"` を画面全体へ付けず、必要なコンポーネントまで範囲を狭める。
- Server Component から Client Component へ渡す値は serializable なデータにする。

## ローディングとエラー

画面全体の状態は App Router の規約ファイルを利用します。

```txt
app/loading.tsx
app/error.tsx
```

特定のコンポーネント内で発生する状態は `components/feedback` の共通 UI を使います。

- 初期画面の待機: `loading.tsx`
- ルート単位の予期しないエラー: `error.tsx`
- 一覧が空の場合: Empty State コンポーネント
- フォーム送信エラー: フォーム付近のエラー表示

## 命名規則

命名は [コーディングルール](./coding-rules.md) に従います。

- ディレクトリ名: lower-case
- ファイル名: camelCase
- コンポーネント名: PascalCase
- 関数名、変数名: camelCase
- 型名、interface 名: PascalCase
- 環境変数: UPPER_SNAKE_CASE

Next.js の `page.tsx`、`layout.tsx`、`loading.tsx`、`error.tsx` などはフレームワークの規約名を優先します。

動的ルートもディレクトリ名の規則に合わせ、すべて小文字で記述します。

```txt
[eventid]
[slotid]
```

## ディレクトリ追加の判断

次のようなディレクトリは、実際に必要になってから追加します。

```txt
features/<feature-name>/hooks/
features/<feature-name>/utils/
features/<feature-name>/schemas/
```

用途のない空ディレクトリを増やさず、コードの責任が明確になった時点で分割します。
