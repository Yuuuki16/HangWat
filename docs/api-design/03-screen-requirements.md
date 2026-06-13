# 画面要件

## 目的

このドキュメントでは、Figmaから読み取った画面ごとの表示内容、入力内容、操作、必要なAPIを整理する。

Notionの目次が増えすぎないように、各画面名は見出しではなく太字で記載する。

---

# 画面構成

---

### **ログイン画面**

| 項目 | 内容 |
| --- | --- |
| 表示内容 | メールアドレス入力欄、パスワード入力欄、ログインボタン、新規登録画面への導線 |
| 入力内容 | メールアドレス、パスワード |
| 操作 | ログインする、新規登録画面へ移動する |
| 必要なAPI | POST /api/auth/login |
| API不要の操作 | 新規登録画面へ移動する |

---

### **新規登録画面**

| 項目 | 内容 |
| --- | --- |
| 表示内容 | ユーザー名入力欄、メールアドレス入力欄、パスワード入力欄、新規登録ボタン、ログイン画面への導線 |
| 入力内容 | ユーザー名、メールアドレス、パスワード |
| 操作 | アカウントを作成する、ログイン画面へ移動する |
| 必要なAPI | POST /api/auth/register |
| API不要の操作 | ログイン画面へ移動する |

---

### **ホーム画面**

| 項目 | 内容 |
| --- | --- |
| 表示内容 | イベント一覧、イベント名、開催日、場所、参加者数、予定が確定済みかどうか、イベント作成ボタン |
| 入力内容 | なし |
| 必要なデータ | イベントID、イベント名、開催日、場所、参加者数、確定済み状態 |
| 操作 | イベント一覧を見る、イベント作成画面へ移動する、イベント詳細へ移動する |
| 必要なAPI | GET /api/events |
| API不要の操作 | イベント作成画面へ移動する、イベント詳細へ移動する |

---

### **イベント作成画面**

| 項目 | 内容 |
| --- | --- |
| 表示内容 | イベント名入力欄、日時入力欄、場所入力欄、Google Maps URL入力欄、取得した場所名、住所、Google Mapsリンク、詳細入力欄、作成ボタン |
| 入力内容 | イベント名、日時、場所名、Google Maps URL、詳細 |
| 必要なデータ | イベント名、開催日、場所情報、詳細 |
| 操作 | Google Maps URLから場所情報を取得する、イベントを作成する |
| 必要なAPI | POST /api/locations/resolve-google-maps-url、POST /api/events |
| API不要の操作 | Google Maps外部ページを開く |

---

### **タイムライン画面**

| 項目 | 内容 |
| --- | --- |
| 表示内容 | イベント名、開催日、場所、参加者、共有URL、予定候補一覧、コメント数、いいね数、確定済み予定、追加ボタン、編集ボタン、削除ボタン、予定確定ボタン、予定取消ボタン |
| 入力内容 | 予定候補のタイトル、日時、場所名、Google Maps URL、詳細 |
| 必要なデータ | イベントID、イベント名、開催日、場所、詳細、共有URL、作成者情報、参加者一覧、自分のイベント内メンバー情報、確定済み予定候補ID、予定候補一覧、コメント数、いいね数、予定候補ステータス |
| 操作 | イベント詳細を見る、参加者一覧を見る、自分のイベント内メンバー情報を見る、招待URLを発行する、予定候補を追加する、予定候補を編集する、予定候補を削除する、予定候補を確定する、予定確定を取り消す、コメント画面へ移動する、Google Maps URLから場所情報を取得する |
| 必要なAPI | GET /api/events/:eventId、GET /api/events/:eventId/members、GET /api/events/:eventId/me/member、POST /api/events/:eventId/invite-tokens、POST /api/events/:eventId/candidates、PATCH /api/events/:eventId/candidates/:candidateId、DELETE /api/events/:eventId/candidates/:candidateId、POST /api/events/:eventId/candidates/:candidateId/confirm、POST /api/events/:eventId/candidates/:candidateId/cancel-confirm、POST /api/events/:eventId/locations/resolve-google-maps-url |
| API不要の操作 | コメント画面へ移動する、Google Maps外部ページを開く |

---

### **コメント画面**

| 項目 | 内容 |
| --- | --- |
| 表示内容 | 予定候補名、予定候補の日時、予定候補の場所、コメント一覧、コメント投稿者名、コメント本文、いいね数、自分がいいね済みかどうか、コメント入力欄、コメント送信ボタン、いいねボタン、予定確定ボタン、編集ボタン、削除ボタン |
| 入力内容 | コメント本文 |
| 必要なデータ | 予定候補ID、予定候補名、予定候補日時、予定候補場所、コメントID、コメント本文、コメント投稿者のEventMember情報、いいね数、自分がいいね済みかどうか、投稿日時、自分のイベント内メンバー情報 |
| 操作 | コメント一覧を見る、コメントを投稿する、コメントにいいねする、コメントのいいねを解除する、予定候補を確定する、予定候補を編集する、予定候補を削除する、自分のイベント内メンバー情報を見る |
| 必要なAPI | GET /api/events/:eventId/candidates/:candidateId/comments、POST /api/events/:eventId/candidates/:candidateId/comments、PUT /api/comments/:commentId/like、DELETE /api/comments/:commentId/like、POST /api/events/:eventId/candidates/:candidateId/confirm、PATCH /api/events/:eventId/candidates/:candidateId、DELETE /api/events/:eventId/candidates/:candidateId、GET /api/events/:eventId/me/member |

---

### **編集画面**

| 項目 | 内容 |
| --- | --- |
| 表示内容 | 編集対象のタイトル、日時、場所、詳細、保存ボタン |
| 入力内容 | タイトル、日時、場所、詳細 |
| 操作 | イベントを編集する、予定候補を編集する |
| 必要なAPI | PATCH /api/events/:eventId、PATCH /api/events/:eventId/candidates/:candidateId |

---

### **削除確認モーダル**

| 項目 | 内容 |
| --- | --- |
| 表示内容 | 削除確認メッセージ、キャンセルボタン、削除ボタン |
| 入力内容 | なし |
| 操作 | イベントを削除する、予定候補を削除する、コメントを削除する |
| 必要なAPI | DELETE /api/events/:eventId、DELETE /api/events/:eventId/candidates/:candidateId、DELETE /api/comments/:commentId |

---

### **予定確定確認モーダル**

| 項目 | 内容 |
| --- | --- |
| 表示内容 | 予定確定確認メッセージ、キャンセルボタン、確定ボタン |
| 入力内容 | なし |
| 操作 | 予定候補を確定する |
| 必要なAPI | POST /api/events/:eventId/candidates/:candidateId/confirm |

---

### **予定取消確認モーダル**

| 項目 | 内容 |
| --- | --- |
| 表示内容 | 予定取消確認メッセージ、キャンセルボタン、取消ボタン |
| 入力内容 | なし |
| 操作 | 確定済み予定を取り消す |
| 必要なAPI | POST /api/events/:eventId/candidates/:candidateId/cancel-confirm |

---

### **招待参加画面**

| 項目 | 内容 |
| --- | --- |
| 表示内容 | イベント名、開催日、場所、詳細、名前入力欄、参加ボタン、招待URLエラー表示 |
| 入力内容 | 表示名 |
| 必要なデータ | イベントID、イベント名、開催日、場所、詳細、招待URLの有効状態 |
| 操作 | 招待URLからイベント概要を見る、名前を登録して参加する、ローカルトークンがある場合は自動復帰する |
| 必要なAPI | GET /api/invite-tokens/:inviteToken、POST /api/invite-tokens/:inviteToken/join、POST /api/invite-tokens/:inviteToken/rejoin |
| API不要の操作 | なし |

---

### **場所登録UI**

| 項目 | 内容 |
| --- | --- |
| 表示内容 | 場所入力欄、Google Maps URL入力欄、取得した場所名、住所、Google Mapsリンク |
| 入力内容 | Google Maps URL、または場所名 |
| 必要なデータ | 場所名、住所、Google Place ID、緯度、経度、Google Maps URL |
| 操作 | Google Maps URLから場所情報を取得する、場所候補を検索する、場所をイベントまたは予定候補に登録する、Google Maps外部ページを開く |
| 必要なAPI | POST /api/locations/resolve-google-maps-url、POST /api/events/:eventId/locations/resolve-google-maps-url、GET /api/events/:eventId/locations/google-place-autocomplete、GET /api/events/:eventId/locations/google-place-details |
| API不要の操作 | Google Maps外部ページを開く |