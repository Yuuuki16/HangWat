# API詳細

このドキュメントでは、各APIの概要、使用画面、認証、Request、Response、Errorを整理する。

---

## 認証・認可の表記

| 表記 | 意味 |
| --- | --- |
| 不要 | ログインもイベント参加も不要 |
| ログイン必須 | `users` としてログインしている必要がある |
| イベント参加者 | ログインユーザーまたはURL参加者として、対象イベントの `event_members` に存在する必要がある |
| owner | 対象イベントの `event_members.role = owner` である必要がある |
| 本人またはowner | 作成者本人、またはイベントownerである必要がある |

---

### **POST /api/auth/register**

| 項目 | 内容 |
| --- | --- |
| 概要 | 新規ユーザーを登録する |
| 使用画面 | 新規登録画面 |
| 認証 | 不要 |

Request Body

```json
{
  "name": "はせたく",
  "email": "takuya@example.com",
  "password": "password123"
}
```

Response Body

```json
{
  "user": {
    "id": "user_001",
    "name": "はせたく",
    "email": "takuya@example.com",
    "avatarUrl": null
  }
}
```

Error

| Status | Code | 説明 |
| --- | --- | --- |
| 400 | VALIDATION_ERROR | 入力値が不正 |
| 409 | CONFLICT | メールアドレスが既に使用されている |
| 500 | INTERNAL_SERVER_ERROR | サーバーエラー |

---

### **POST /api/auth/login**

| 項目 | 内容 |
| --- | --- |
| 概要 | ユーザーがログインする |
| 使用画面 | ログイン画面 |
| 認証 | 不要 |

Request Body

```json
{
  "email": "takuya@example.com",
  "password": "password123"
}
```

Response Body

```json
{
  "user": {
    "id": "user_001",
    "name": "はせたく",
    "email": "takuya@example.com",
    "avatarUrl": null
  }
}
```

Error

| Status | Code | 説明 |
| --- | --- | --- |
| 400 | VALIDATION_ERROR | 入力値が不正 |
| 401 | UNAUTHORIZED | メールアドレスまたはパスワードが正しくない |
| 500 | INTERNAL_SERVER_ERROR | サーバーエラー |

---

### **POST /api/auth/logout**

| 項目 | 内容 |
| --- | --- |
| 概要 | ログイン中のユーザーをログアウトする |
| 使用画面 | 共通 |
| 認証 | ログイン必須 |

Request Body

なし

Response Body

```json
{
  "message": "ログアウトしました"
}
```

Error

| Status | Code | 説明 |
| --- | --- | --- |
| 401 | UNAUTHORIZED | 未ログイン |
| 500 | INTERNAL_SERVER_ERROR | サーバーエラー |

---

### **GET /api/me**

| 項目 | 内容 |
| --- | --- |
| 概要 | ログイン中のユーザー情報を取得する |
| 使用画面 | 共通 |
| 認証 | ログイン必須 |

Request Body

なし

Response Body

```json
{
  "user": {
    "id": "user_001",
    "name": "はせたく",
    "email": "takuya@example.com",
    "avatarUrl": null
  }
}
```

Error

| Status | Code | 説明 |
| --- | --- | --- |
| 401 | UNAUTHORIZED | 未ログイン |
| 500 | INTERNAL_SERVER_ERROR | サーバーエラー |

---

### **GET /api/events**

| 項目 | 内容 |
| --- | --- |
| 概要 | ホーム画面に表示するイベント一覧を取得する |
| 使用画面 | ホーム画面 |
| 認証 | ログイン必須 |

Request Body

なし

Response Body

```json
{
  "events": [
    {
      "id": "event_001",
      "title": "梅田で昼ごはん",
      "date": "2026-07-31",
      "location": {
        "name": "大阪駅",
        "address": "大阪府大阪市北区梅田3丁目1-1",
        "googlePlaceId": "ChIJxxxxxxxxxxxx",
        "latitude": 34.702485,
        "longitude": 135.495951,
        "googleMapsUrl": "https://www.google.com/maps/place/..."
      },
      "memberCount": 2,
      "isConfirmed": false
    }
  ]
}
```

Error

| Status | Code | 説明 |
| --- | --- | --- |
| 401 | UNAUTHORIZED | 未ログイン |
| 500 | INTERNAL_SERVER_ERROR | サーバーエラー |

---

### **POST /api/events**

| 項目 | 内容 |
| --- | --- |
| 概要 | 新しいイベントを作成する |
| 使用画面 | イベント作成画面 |
| 認証 | ログイン必須 |

Request Body

```json
{
  "title": "梅田で昼ごはん",
  "date": "2026-07-31",
  "location": {
    "name": "大阪駅",
    "address": "大阪府大阪市北区梅田3丁目1-1",
    "googlePlaceId": "ChIJxxxxxxxxxxxx",
    "latitude": 34.702485,
    "longitude": 135.495951,
    "googleMapsUrl": "https://www.google.com/maps/place/..."
  },
  "description": "昼ごはん候補を決める"
}
```

Response Body

```json
{
  "event": {
    "id": "event_001",
    "title": "梅田で昼ごはん",
    "date": "2026-07-31",
    "location": {
      "name": "大阪駅",
      "address": "大阪府大阪市北区梅田3丁目1-1",
      "googlePlaceId": "ChIJxxxxxxxxxxxx",
      "latitude": 34.702485,
      "longitude": 135.495951,
      "googleMapsUrl": "https://www.google.com/maps/place/..."
    },
    "description": "昼ごはん候補を決める",
    "inviteUrl": null,
    "confirmedCandidateId": null,
    "myMember": {
      "id": "member_001",
      "eventId": "event_001",
      "userId": "user_001",
      "displayName": "はせたく",
      "role": "owner",
      "memberType": "user"
    },
    "createdAt": "2026-07-31T10:00:00+09:00",
    "updatedAt": "2026-07-31T10:00:00+09:00"
  }
}
```

Error

| Status | Code | 説明 |
| --- | --- | --- |
| 400 | VALIDATION_ERROR | 入力値が不正 |
| 401 | UNAUTHORIZED | 未ログイン |
| 500 | INTERNAL_SERVER_ERROR | サーバーエラー |

---

### **GET /api/events/:eventId**

| 項目 | 内容 |
| --- | --- |
| 概要 | イベント詳細と予定候補一覧を取得する |
| 使用画面 | タイムライン画面 / コメント画面 |
| 認証 | イベント参加者 |

Path Params

| Field | Type | 説明 |
| --- | --- | --- |
| eventId | string | イベントID |

Request Body

なし

Response Body

```json
{
  "event": {
    "id": "event_001",
    "title": "梅田で昼ごはん",
    "date": "2026-07-31",
    "location": {
      "name": "大阪駅",
      "address": "大阪府大阪市北区梅田3丁目1-1",
      "googlePlaceId": "ChIJxxxxxxxxxxxx",
      "latitude": 34.702485,
      "longitude": 135.495951,
      "googleMapsUrl": "https://www.google.com/maps/place/..."
    },
    "description": "昼ごはん候補を決める",
    "inviteUrl": "https://hangwat.example.com/invite/abc123",
    "createdBy": {
      "id": "user_001",
      "name": "はせたく",
      "avatarUrl": null
    },
    "members": [
      {
        "id": "member_001",
        "eventId": "event_001",
        "userId": "user_001",
        "displayName": "はせたく",
        "role": "owner",
        "memberType": "user"
      },
      {
        "id": "member_010",
        "eventId": "event_001",
        "userId": null,
        "displayName": "たくや",
        "role": "member",
        "memberType": "guest"
      }
    ],
    "myMember": {
      "id": "member_010",
      "eventId": "event_001",
      "userId": null,
      "displayName": "たくや",
      "role": "member",
      "memberType": "guest"
    },
    "confirmedCandidateId": null
  },
  "candidates": [
    {
      "id": "candidate_001",
      "eventId": "event_001",
      "title": "一蘭で昼ごはん",
      "startAt": "2026-07-31T13:00:00+09:00",
      "endAt": "2026-07-31T14:00:00+09:00",
      "location": {
        "name": "一蘭 梅田店",
        "address": "大阪府大阪市北区...",
        "googlePlaceId": "ChIJyyyyyyyyyyyy",
        "latitude": 34.701111,
        "longitude": 135.500111,
        "googleMapsUrl": "https://www.google.com/maps/place/..."
      },
      "description": null,
      "status": "pending",
      "createdByMember": {
        "id": "member_010",
        "displayName": "たくや",
        "memberType": "guest"
      },
      "commentCount": 3,
      "likeCount": 158
    }
  ]
}
```

Error

| Status | Code | 説明 |
| --- | --- | --- |
| 401 | UNAUTHORIZED | 未ログイン、またはローカルトークンが不正 |
| 403 | FORBIDDEN | イベント参加者ではない |
| 404 | NOT_FOUND | イベントが存在しない |
| 500 | INTERNAL_SERVER_ERROR | サーバーエラー |

---

### **PATCH /api/events/:eventId**

| 項目 | 内容 |
| --- | --- |
| 概要 | イベント情報を更新する |
| 使用画面 | 編集画面 |
| 認証 | owner |

Path Params

| Field | Type | 説明 |
| --- | --- | --- |
| eventId | string | イベントID |

Request Body

```json
{
  "title": "梅田で昼ごはん会",
  "date": "2026-07-31",
  "location": {
    "name": "大阪駅",
    "address": "大阪府大阪市北区梅田3丁目1-1",
    "googlePlaceId": "ChIJxxxxxxxxxxxx",
    "latitude": 34.702485,
    "longitude": 135.495951,
    "googleMapsUrl": "https://www.google.com/maps/place/..."
  },
  "description": "梅田周辺で昼ごはん"
}
```

Response Body

```json
{
  "event": {
    "id": "event_001",
    "title": "梅田で昼ごはん会",
    "date": "2026-07-31",
    "location": {
      "name": "大阪駅",
      "address": "大阪府大阪市北区梅田3丁目1-1",
      "googlePlaceId": "ChIJxxxxxxxxxxxx",
      "latitude": 34.702485,
      "longitude": 135.495951,
      "googleMapsUrl": "https://www.google.com/maps/place/..."
    },
    "description": "梅田周辺で昼ごはん",
    "updatedAt": "2026-07-31T10:30:00+09:00"
  }
}
```

Error

| Status | Code | 説明 |
| --- | --- | --- |
| 400 | VALIDATION_ERROR | 入力値が不正 |
| 401 | UNAUTHORIZED | 未ログイン、またはローカルトークンが不正 |
| 403 | FORBIDDEN | 編集権限がない |
| 404 | NOT_FOUND | イベントが存在しない |
| 500 | INTERNAL_SERVER_ERROR | サーバーエラー |

---

### **DELETE /api/events/:eventId**

| 項目 | 内容 |
| --- | --- |
| 概要 | イベントを削除する |
| 使用画面 | 削除確認モーダル |
| 認証 | owner |

Path Params

| Field | Type | 説明 |
| --- | --- | --- |
| eventId | string | イベントID |

Request Body

なし

Response Body

```json
{
  "message": "イベントを削除しました"
}
```

Error

| Status | Code | 説明 |
| --- | --- | --- |
| 401 | UNAUTHORIZED | 未ログイン、またはローカルトークンが不正 |
| 403 | FORBIDDEN | 削除権限がない |
| 404 | NOT_FOUND | イベントが存在しない |
| 500 | INTERNAL_SERVER_ERROR | サーバーエラー |

---

### **POST /api/events/:eventId/invite-tokens**

| 項目 | 内容 |
| --- | --- |
| 概要 | イベントの招待URLを発行する |
| 使用画面 | タイムライン画面 |
| 認証 | owner |

Path Params

| Field | Type | 説明 |
| --- | --- | --- |
| eventId | string | イベントID |

Request Body

```json
{
  "expiresAt": "2026-08-01T00:00:00+09:00"
}
```

Response Body

```json
{
  "inviteToken": {
    "id": "invite_token_001",
    "eventId": "event_001",
    "inviteToken": "abc123",
    "url": "https://hangwat.example.com/invite/abc123",
    "expiresAt": "2026-08-01T00:00:00+09:00",
    "revokedAt": null,
    "createdAt": "2026-07-31T10:00:00+09:00"
  }
}
```

Error

| Status | Code | 説明 |
| --- | --- | --- |
| 401 | UNAUTHORIZED | 未ログイン |
| 403 | FORBIDDEN | 招待URLを発行する権限がない |
| 404 | NOT_FOUND | イベントが存在しない |
| 500 | INTERNAL_SERVER_ERROR | サーバーエラー |

---

### **DELETE /api/events/:eventId/invite-tokens/:tokenId**

| 項目 | 内容 |
| --- | --- |
| 概要 | 招待URLを無効化する |
| 使用画面 | タイムライン画面 / 設定画面 |
| 認証 | owner |

Path Params

| Field | Type | 説明 |
| --- | --- | --- |
| eventId | string | イベントID |
| tokenId | string | 招待トークンID |

Request Body

なし

Response Body

```json
{
  "message": "招待URLを無効化しました"
}
```

Error

| Status | Code | 説明 |
| --- | --- | --- |
| 401 | UNAUTHORIZED | 未ログイン |
| 403 | FORBIDDEN | 招待URLを無効化する権限がない |
| 404 | NOT_FOUND | イベントまたは招待URLが存在しない |
| 500 | INTERNAL_SERVER_ERROR | サーバーエラー |

---

### **GET /api/invite-tokens/:inviteToken**

| 項目 | 内容 |
| --- | --- |
| 概要 | 招待URLから参加前に表示するイベント概要を取得する |
| 使用画面 | 招待参加画面 |
| 認証 | 不要 |

Path Params

| Field | Type | 説明 |
| --- | --- | --- |
| inviteToken | string | 招待トークン |

Request Body

なし

Response Body

```json
{
  "event": {
    "id": "event_001",
    "title": "梅田で昼ごはん",
    "date": "2026-07-31",
    "description": "昼ごはん候補を決める",
    "location": {
      "name": "大阪駅",
      "address": "大阪府大阪市北区梅田3丁目1-1",
      "googlePlaceId": "ChIJxxxxxxxxxxxx",
      "latitude": 34.702485,
      "longitude": 135.495951,
      "googleMapsUrl": "https://www.google.com/maps/place/..."
    }
  },
  "requiresDisplayName": true
}
```

Error

| Status | Code | 説明 |
| --- | --- | --- |
| 404 | NOT_FOUND | 招待URLが存在しない |
| 410 | INVITE_TOKEN_EXPIRED | 招待URLの有効期限が切れている |
| 410 | INVITE_TOKEN_REVOKED | 招待URLが無効化されている |
| 500 | INTERNAL_SERVER_ERROR | サーバーエラー |

---

### **POST /api/invite-tokens/:inviteToken/join**

| 項目 | 内容 |
| --- | --- |
| 概要 | 招待URLから名前だけでイベントに参加する |
| 使用画面 | 招待参加画面 |
| 認証 | 不要 |

Path Params

| Field | Type | 説明 |
| --- | --- | --- |
| inviteToken | string | 招待トークン |

Request Body

```json
{
  "displayName": "たくや"
}
```

Response Body

```json
{
  "eventMember": {
    "id": "member_010",
    "eventId": "event_001",
    "userId": null,
    "displayName": "たくや",
    "role": "member",
    "memberType": "guest",
    "createdAt": "2026-07-31T10:00:00+09:00",
    "updatedAt": "2026-07-31T10:00:00+09:00"
  },
  "memberSession": {
    "token": "plain_local_token_returned_once",
    "expiresAt": "2026-08-30T00:00:00+09:00"
  }
}
```

Error

| Status | Code | 説明 |
| --- | --- | --- |
| 400 | VALIDATION_ERROR | 表示名が不正 |
| 404 | NOT_FOUND | 招待URLが存在しない |
| 409 | CONFLICT | 同じイベント内で同じ表示名が既に使われている |
| 410 | INVITE_TOKEN_EXPIRED | 招待URLの有効期限が切れている |
| 410 | INVITE_TOKEN_REVOKED | 招待URLが無効化されている |
| 500 | INTERNAL_SERVER_ERROR | サーバーエラー |

---

### **POST /api/invite-tokens/:inviteToken/rejoin**

| 項目 | 内容 |
| --- | --- |
| 概要 | ローカルトークンを使って同じイベントメンバーとして再参加する |
| 使用画面 | 招待参加画面 |
| 認証 | 不要 |

Path Params

| Field | Type | 説明 |
| --- | --- | --- |
| inviteToken | string | 招待トークン |

Request Body

```json
{
  "memberSessionToken": "plain_local_token_returned_once"
}
```

Response Body

```json
{
  "eventMember": {
    "id": "member_010",
    "eventId": "event_001",
    "userId": null,
    "displayName": "たくや",
    "role": "member",
    "memberType": "guest"
  }
}
```

Error

| Status | Code | 説明 |
| --- | --- | --- |
| 401 | UNAUTHORIZED | ローカルトークンが不正 |
| 404 | NOT_FOUND | 招待URLまたは参加者が存在しない |
| 410 | MEMBER_SESSION_EXPIRED | ローカルトークンの有効期限が切れている |
| 500 | INTERNAL_SERVER_ERROR | サーバーエラー |

---

### **GET /api/events/:eventId/members**

| 項目 | 内容 |
| --- | --- |
| 概要 | イベント参加者一覧を取得する |
| 使用画面 | タイムライン画面 |
| 認証 | イベント参加者 |

Path Params

| Field | Type | 説明 |
| --- | --- | --- |
| eventId | string | イベントID |

Request Body

なし

Response Body

```json
{
  "members": [
    {
      "id": "member_001",
      "eventId": "event_001",
      "userId": "user_001",
      "displayName": "はせたく",
      "role": "owner",
      "memberType": "user",
      "user": {
        "id": "user_001",
        "name": "はせたく",
        "avatarUrl": null
      }
    },
    {
      "id": "member_010",
      "eventId": "event_001",
      "userId": null,
      "displayName": "たくや",
      "role": "member",
      "memberType": "guest",
      "user": null
    }
  ]
}
```

Error

| Status | Code | 説明 |
| --- | --- | --- |
| 401 | UNAUTHORIZED | 未ログイン、またはローカルトークンが不正 |
| 403 | FORBIDDEN | イベント参加者ではない |
| 404 | NOT_FOUND | イベントが存在しない |
| 500 | INTERNAL_SERVER_ERROR | サーバーエラー |

---

### **GET /api/events/:eventId/me/member**

| 項目 | 内容 |
| --- | --- |
| 概要 | 自分のイベント内メンバー情報を取得する |
| 使用画面 | 共通 |
| 認証 | イベント参加者 |

Path Params

| Field | Type | 説明 |
| --- | --- | --- |
| eventId | string | イベントID |

Request Body

なし

Response Body

```json
{
  "eventMember": {
    "id": "member_010",
    "eventId": "event_001",
    "userId": null,
    "displayName": "たくや",
    "role": "member",
    "memberType": "guest"
  }
}
```

Error

| Status | Code | 説明 |
| --- | --- | --- |
| 401 | UNAUTHORIZED | 未ログイン、またはローカルトークンが不正 |
| 403 | FORBIDDEN | イベント参加者ではない |
| 404 | NOT_FOUND | イベントが存在しない |
| 500 | INTERNAL_SERVER_ERROR | サーバーエラー |

---

### **PATCH /api/events/:eventId/members/:memberId**

| 項目 | 内容 |
| --- | --- |
| 概要 | イベント参加者の表示名を変更する |
| 使用画面 | 参加者編集画面 |
| 認証 | 本人またはowner |

Path Params

| Field | Type | 説明 |
| --- | --- | --- |
| eventId | string | イベントID |
| memberId | string | イベントメンバーID |

Request Body

```json
{
  "displayName": "たくや"
}
```

Response Body

```json
{
  "eventMember": {
    "id": "member_010",
    "eventId": "event_001",
    "userId": null,
    "displayName": "たくや",
    "role": "member",
    "memberType": "guest",
    "updatedAt": "2026-07-31T10:30:00+09:00"
  }
}
```

Error

| Status | Code | 説明 |
| --- | --- | --- |
| 400 | VALIDATION_ERROR | 表示名が不正 |
| 401 | UNAUTHORIZED | 未ログイン、またはローカルトークンが不正 |
| 403 | FORBIDDEN | 表示名を変更する権限がない |
| 404 | NOT_FOUND | イベントまたは参加者が存在しない |
| 409 | CONFLICT | 同じイベント内で同じ表示名が既に使われている |
| 500 | INTERNAL_SERVER_ERROR | サーバーエラー |

---

### **DELETE /api/events/:eventId/members/:memberId**

| 項目 | 内容 |
| --- | --- |
| 概要 | イベントから退出、または参加者を削除する |
| 使用画面 | 参加者管理画面 |
| 認証 | 本人またはowner |

Path Params

| Field | Type | 説明 |
| --- | --- | --- |
| eventId | string | イベントID |
| memberId | string | イベントメンバーID |

Request Body

なし

Response Body

```json
{
  "message": "イベントメンバーを削除しました"
}
```

Error

| Status | Code | 説明 |
| --- | --- | --- |
| 401 | UNAUTHORIZED | 未ログイン、またはローカルトークンが不正 |
| 403 | FORBIDDEN | 削除権限がない |
| 404 | NOT_FOUND | イベントまたは参加者が存在しない |
| 409 | CONFLICT | ownerは退出できない |
| 500 | INTERNAL_SERVER_ERROR | サーバーエラー |

---

### **POST /api/locations/resolve-google-maps-url**

| 項目 | 内容 |
| --- | --- |
| 概要 | イベント作成前にGoogle Maps URLから場所情報を取得する |
| 使用画面 | イベント作成画面 |
| 認証 | ログイン必須 |

Request Body

```json
{
  "url": "https://maps.app.goo.gl/xxxxxx"
}
```

Response Body

```json
{
  "location": {
    "name": "大阪駅",
    "address": "大阪府大阪市北区梅田3丁目1-1",
    "googlePlaceId": "ChIJxxxxxxxxxxxx",
    "latitude": 34.702485,
    "longitude": 135.495951,
    "googleMapsUrl": "https://www.google.com/maps/place/..."
  }
}
```

Error

| Status | Code | 説明 |
| --- | --- | --- |
| 400 | VALIDATION_ERROR | URL形式が不正 |
| 401 | UNAUTHORIZED | 未ログイン |
| 404 | NOT_FOUND | 場所情報を取得できない |
| 500 | INTERNAL_SERVER_ERROR | サーバーエラー |

---

### **POST /api/events/:eventId/locations/resolve-google-maps-url**

| 項目 | 内容 |
| --- | --- |
| 概要 | イベント内でGoogle Maps URLから場所情報を取得する |
| 使用画面 | 予定候補作成画面 |
| 認証 | イベント参加者 |

Path Params

| Field | Type | 説明 |
| --- | --- | --- |
| eventId | string | イベントID |

Request Body

```json
{
  "url": "https://maps.app.goo.gl/xxxxxx"
}
```

Response Body

```json
{
  "location": {
    "name": "一蘭 梅田店",
    "address": "大阪府大阪市北区...",
    "googlePlaceId": "ChIJyyyyyyyyyyyy",
    "latitude": 34.701111,
    "longitude": 135.500111,
    "googleMapsUrl": "https://www.google.com/maps/place/..."
  }
}
```

Error

| Status | Code | 説明 |
| --- | --- | --- |
| 400 | VALIDATION_ERROR | URL形式が不正 |
| 401 | UNAUTHORIZED | 未ログイン、またはローカルトークンが不正 |
| 403 | FORBIDDEN | イベント参加者ではない |
| 404 | NOT_FOUND | イベントまたは場所情報が存在しない |
| 500 | INTERNAL_SERVER_ERROR | サーバーエラー |

---

### **GET /api/events/:eventId/locations/google-place-autocomplete**

| 項目 | 内容 |
| --- | --- |
| 概要 | Google Placesの候補を取得する |
| 使用画面 | 予定候補作成画面 |
| 認証 | イベント参加者 |

Path Params

| Field | Type | 説明 |
| --- | --- | --- |
| eventId | string | イベントID |

Query Params

| Field | Type | 説明 |
| --- | --- | --- |
| input | string | 検索文字列 |

Request Body

なし

Response Body

```json
{
  "predictions": [
    {
      "googlePlaceId": "ChIJyyyyyyyyyyyy",
      "name": "一蘭 梅田店",
      "address": "大阪府大阪市北区..."
    }
  ]
}
```

Error

| Status | Code | 説明 |
| --- | --- | --- |
| 400 | VALIDATION_ERROR | 検索文字列が不正 |
| 401 | UNAUTHORIZED | 未ログイン、またはローカルトークンが不正 |
| 403 | FORBIDDEN | イベント参加者ではない |
| 404 | NOT_FOUND | イベントが存在しない |
| 500 | INTERNAL_SERVER_ERROR | サーバーエラー |

---

### **GET /api/events/:eventId/locations/google-place-details**

| 項目 | 内容 |
| --- | --- |
| 概要 | Google Place IDから詳細情報を取得する |
| 使用画面 | 予定候補作成画面 |
| 認証 | イベント参加者 |

Path Params

| Field | Type | 説明 |
| --- | --- | --- |
| eventId | string | イベントID |

Query Params

| Field | Type | 説明 |
| --- | --- | --- |
| googlePlaceId | string | Google Place ID |

Request Body

なし

Response Body

```json
{
  "location": {
    "name": "一蘭 梅田店",
    "address": "大阪府大阪市北区...",
    "googlePlaceId": "ChIJyyyyyyyyyyyy",
    "latitude": 34.701111,
    "longitude": 135.500111,
    "googleMapsUrl": "https://www.google.com/maps/place/..."
  }
}
```

Error

| Status | Code | 説明 |
| --- | --- | --- |
| 400 | VALIDATION_ERROR | Google Place IDが不正 |
| 401 | UNAUTHORIZED | 未ログイン、またはローカルトークンが不正 |
| 403 | FORBIDDEN | イベント参加者ではない |
| 404 | NOT_FOUND | イベントまたは場所情報が存在しない |
| 500 | INTERNAL_SERVER_ERROR | サーバーエラー |

---

### **POST /api/events/:eventId/candidates**

| 項目 | 内容 |
| --- | --- |
| 概要 | イベントに予定候補を追加する |
| 使用画面 | タイムライン画面 |
| 認証 | イベント参加者 |

Path Params

| Field | Type | 説明 |
| --- | --- | --- |
| eventId | string | イベントID |

Request Body

```json
{
  "title": "一蘭で昼ごはん",
  "startAt": "2026-07-31T13:00:00+09:00",
  "endAt": "2026-07-31T14:00:00+09:00",
  "location": {
    "name": "一蘭 梅田店",
    "address": "大阪府大阪市北区...",
    "googlePlaceId": "ChIJyyyyyyyyyyyy",
    "latitude": 34.701111,
    "longitude": 135.500111,
    "googleMapsUrl": "https://www.google.com/maps/place/..."
  },
  "description": "梅田の一蘭に行く案"
}
```

Response Body

```json
{
  "candidate": {
    "id": "10",
    "eventId": "1",
    "title": "一蘭で昼ごはん",
    "startAt": "2026-07-31T04:00:00.000Z",
    "endAt": "2026-07-31T05:00:00.000Z",
    "location": {
      "name": "一蘭 梅田店",
      "address": "大阪府大阪市北区...",
      "googlePlaceId": "ChIJyyyyyyyyyyyy",
      "latitude": 34.701111,
      "longitude": 135.500111,
      "googleMapsUrl": "https://www.google.com/maps/place/..."
    },
    "description": "梅田の一蘭に行く案",
    "status": "pending",
    "createdByMember": {
      "id": "5",
      "displayName": "たくや",
      "memberType": "guest"
    },
    "commentCount": 0,
    "likeCount": 0,
    "createdAt": "2026-07-31T10:00:00.000Z",
    "updatedAt": "2026-07-31T10:00:00.000Z"
  }
}
```

Error

| Status | Code | 説明 |
| --- | --- | --- |
| 400 | VALIDATION_ERROR | 入力値が不正 |
| 401 | UNAUTHORIZED | 未ログイン、またはローカルトークンが不正 |
| 403 | FORBIDDEN | イベント参加者ではない |
| 404 | NOT_FOUND | イベントが存在しない |
| 500 | INTERNAL_SERVER_ERROR | サーバーエラー |

---

### **PATCH /api/events/:eventId/candidates/:candidateId**

| 項目 | 内容 |
| --- | --- |
| 概要 | 予定候補を更新する |
| 使用画面 | 編集画面 / コメント画面 |
| 認証 | 本人またはowner |

Path Params

| Field | Type | 説明 |
| --- | --- | --- |
| eventId | string | イベントID |
| candidateId | string | 予定候補ID |

Request Body

```json
{
  "title": "一蘭で昼ごはん",
  "startAt": "2026-07-31T13:30:00+09:00",
  "endAt": "2026-07-31T14:30:00+09:00",
  "location": {
    "name": "一蘭 梅田店",
    "address": "大阪府大阪市北区...",
    "googlePlaceId": "ChIJyyyyyyyyyyyy",
    "latitude": 34.701111,
    "longitude": 135.500111,
    "googleMapsUrl": "https://www.google.com/maps/place/..."
  },
  "description": "開始時間を変更"
}
```

Response Body

```json
{
  "candidate": {
    "id": "candidate_001",
    "eventId": "event_001",
    "title": "一蘭で昼ごはん",
    "startAt": "2026-07-31T13:30:00+09:00",
    "endAt": "2026-07-31T14:30:00+09:00",
    "location": {
      "name": "一蘭 梅田店",
      "address": "大阪府大阪市北区...",
      "googlePlaceId": "ChIJyyyyyyyyyyyy",
      "latitude": 34.701111,
      "longitude": 135.500111,
      "googleMapsUrl": "https://www.google.com/maps/place/..."
    },
    "description": "開始時間を変更",
    "status": "pending",
    "updatedAt": "2026-07-31T10:30:00+09:00"
  }
}
```

Error

| Status | Code | 説明 |
| --- | --- | --- |
| 400 | VALIDATION_ERROR | 入力値が不正 |
| 401 | UNAUTHORIZED | 未ログイン、またはローカルトークンが不正 |
| 403 | FORBIDDEN | 編集権限がない |
| 404 | NOT_FOUND | イベントまたは予定候補が存在しない |
| 500 | INTERNAL_SERVER_ERROR | サーバーエラー |

---

### **DELETE /api/events/:eventId/candidates/:candidateId**

| 項目 | 内容 |
| --- | --- |
| 概要 | 予定候補を削除する |
| 使用画面 | 削除確認モーダル / コメント画面 |
| 認証 | 本人またはowner |

Path Params

| Field | Type | 説明 |
| --- | --- | --- |
| eventId | string | イベントID |
| candidateId | string | 予定候補ID |

Request Body

なし

Response Body

```json
{
  "message": "予定候補を削除しました"
}
```

Error

| Status | Code | 説明 |
| --- | --- | --- |
| 401 | UNAUTHORIZED | 未ログイン、またはローカルトークンが不正 |
| 403 | FORBIDDEN | 削除権限がない |
| 404 | NOT_FOUND | イベントまたは予定候補が存在しない |
| 409 | CONFLICT | 確定済みの予定候補のため削除できない |
| 500 | INTERNAL_SERVER_ERROR | サーバーエラー |

---

### **POST /api/events/:eventId/candidates/:candidateId/confirm**

| 項目 | 内容 |
| --- | --- |
| 概要 | 予定候補を確定する |
| 使用画面 | 予定確定確認モーダル / コメント画面 |
| 認証 | owner |

Path Params

| Field | Type | 説明 |
| --- | --- | --- |
| eventId | string | イベントID |
| candidateId | string | 予定候補ID |

Request Body

なし

Response Body

```json
{
  "event": {
    "id": "event_001",
    "confirmedCandidateId": "candidate_001"
  },
  "candidate": {
    "id": "candidate_001",
    "status": "confirmed"
  }
}
```

Error

| Status | Code | 説明 |
| --- | --- | --- |
| 401 | UNAUTHORIZED | 未ログイン、またはローカルトークンが不正 |
| 403 | FORBIDDEN | 確定権限がない |
| 404 | NOT_FOUND | イベントまたは予定候補が存在しない |
| 409 | CONFLICT | すでに別の予定が確定している |
| 500 | INTERNAL_SERVER_ERROR | サーバーエラー |

---

### **POST /api/events/:eventId/candidates/:candidateId/cancel-confirm**

| 項目 | 内容 |
| --- | --- |
| 概要 | 確定済みの予定候補を未確定に戻す |
| 使用画面 | 予定取消確認モーダル |
| 認証 | owner |

Path Params

| Field | Type | 説明 |
| --- | --- | --- |
| eventId | string | イベントID |
| candidateId | string | 予定候補ID |

Request Body

なし

Response Body

```json
{
  "event": {
    "id": "event_001",
    "confirmedCandidateId": null
  },
  "candidate": {
    "id": "candidate_001",
    "status": "pending"
  }
}
```

Error

| Status | Code | 説明 |
| --- | --- | --- |
| 401 | UNAUTHORIZED | 未ログイン、またはローカルトークンが不正 |
| 403 | FORBIDDEN | 取消権限がない |
| 404 | NOT_FOUND | イベントまたは予定候補が存在しない |
| 409 | CONFLICT | 指定された予定候補は確定されていない |
| 500 | INTERNAL_SERVER_ERROR | サーバーエラー |

---

### **GET /api/events/:eventId/candidates/:candidateId/comments**

| 項目 | 内容 |
| --- | --- |
| 概要 | 予定候補に対するコメント一覧を取得する |
| 使用画面 | コメント画面 |
| 認証 | イベント参加者 |

Path Params

| Field | Type | 説明 |
| --- | --- | --- |
| eventId | string | イベントID |
| candidateId | string | 予定候補ID |

Request Body

なし

Response Body

```json
{
  "comments": [
    {
      "id": "comment_001",
      "candidateId": "candidate_001",
      "body": "ここ良さそう",
      "authorMember": {
        "id": "member_010",
        "displayName": "たくや",
        "memberType": "guest"
      },
      "likeCount": 3,
      "likedByMe": false,
      "createdAt": "2026-07-31T10:00:00+09:00",
      "updatedAt": "2026-07-31T10:00:00+09:00"
    }
  ]
}
```

Error

| Status | Code | 説明 |
| --- | --- | --- |
| 401 | UNAUTHORIZED | 未ログイン、またはローカルトークンが不正 |
| 403 | FORBIDDEN | イベント参加者ではない |
| 404 | NOT_FOUND | イベントまたは予定候補が存在しない |
| 500 | INTERNAL_SERVER_ERROR | サーバーエラー |

---

### **POST /api/events/:eventId/candidates/:candidateId/comments**

| 項目 | 内容 |
| --- | --- |
| 概要 | 予定候補に対してコメントを投稿する |
| 使用画面 | コメント画面 |
| 認証 | イベント参加者 |

Path Params

| Field | Type | 説明 |
| --- | --- | --- |
| eventId | string | イベントID |
| candidateId | string | 予定候補ID |

Request Body

```json
{
  "body": "この前言ってた梅田のラーメン屋とかどう？"
}
```

Response Body

```json
{
  "comment": {
    "id": "comment_003",
    "candidateId": "candidate_001",
    "body": "この前言ってた梅田のラーメン屋とかどう？",
    "authorMember": {
      "id": "member_010",
      "displayName": "たくや",
      "memberType": "guest"
    },
    "likeCount": 0,
    "likedByMe": false,
    "createdAt": "2026-07-31T10:10:00+09:00",
    "updatedAt": "2026-07-31T10:10:00+09:00"
  }
}
```

Error

| Status | Code | 説明 |
| --- | --- | --- |
| 400 | VALIDATION_ERROR | 入力値が不正 |
| 401 | UNAUTHORIZED | 未ログイン、またはローカルトークンが不正 |
| 403 | FORBIDDEN | イベント参加者ではない |
| 404 | NOT_FOUND | イベントまたは予定候補が存在しない |
| 500 | INTERNAL_SERVER_ERROR | サーバーエラー |

---

### **DELETE /api/comments/:commentId**

| 項目 | 内容 |
| --- | --- |
| 概要 | コメントを削除する |
| 使用画面 | コメント画面 |
| 認証 | 本人またはowner |

Path Params

| Field | Type | 説明 |
| --- | --- | --- |
| commentId | string | コメントID |

Request Body

なし

Response Body

```json
{
  "message": "コメントを削除しました"
}
```

Error

| Status | Code | 説明 |
| --- | --- | --- |
| 401 | UNAUTHORIZED | 未ログイン、またはローカルトークンが不正 |
| 403 | FORBIDDEN | 削除権限がない |
| 404 | NOT_FOUND | コメントが存在しない |
| 500 | INTERNAL_SERVER_ERROR | サーバーエラー |

---

### **PUT /api/comments/:commentId/like**

| 項目 | 内容 |
| --- | --- |
| 概要 | コメントにいいねする |
| 使用画面 | コメント画面 |
| 認証 | イベント参加者 |

Path Params

| Field | Type | 説明 |
| --- | --- | --- |
| commentId | string | コメントID |

Request Body

なし

Response Body

```json
{
  "commentId": "1",
  "likedByMe": true,
  "likeCount": 4
}
```

Error

| Status | Code | 説明 |
| --- | --- | --- |
| 400 | VALIDATION_ERROR | 入力値が不正 |
| 401 | UNAUTHORIZED | 未ログイン、またはローカルトークンが不正 |
| 403 | FORBIDDEN | イベント参加者ではない |
| 404 | NOT_FOUND | コメントが存在しない |
| 500 | INTERNAL_SERVER_ERROR | サーバーエラー |

---

### **DELETE /api/comments/:commentId/like**

| 項目 | 内容 |
| --- | --- |
| 概要 | コメントのいいねを解除する |
| 使用画面 | コメント画面 |
| 認証 | イベント参加者 |

Path Params

| Field | Type | 説明 |
| --- | --- | --- |
| commentId | string | コメントID |

Request Body

なし

Response Body

```json
{
  "commentId": "1",
  "likedByMe": false,
  "likeCount": 3
}
```

Error

| Status | Code | 説明 |
| --- | --- | --- |
| 400 | VALIDATION_ERROR | 入力値が不正 |
| 401 | UNAUTHORIZED | 未ログイン、またはローカルトークンが不正 |
| 403 | FORBIDDEN | イベント参加者ではない |
| 404 | NOT_FOUND | コメントが存在しない |
| 500 | INTERNAL_SERVER_ERROR | サーバーエラー |

---

## 追加エラーコード

| Status | Code | 説明 |
| --- | --- | --- |
| 410 | INVITE_TOKEN_EXPIRED | 招待URLの有効期限切れ |
| 410 | INVITE_TOKEN_REVOKED | 招待URLの無効化済み |
| 410 | MEMBER_SESSION_EXPIRED | ローカルトークンの有効期限切れ |
