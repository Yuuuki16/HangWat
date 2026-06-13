# データ型定義

このドキュメントでは、APIで扱う主要なデータ型を定義する。

---

## User

| Field | Type | 説明 |
| --- | --- | --- |
| id | string | ユーザーID |
| name | string | ユーザー名 |
| email | string | メールアドレス |
| avatarUrl | string/null | アイコン画像URL |

---

## EventMember

| Field | Type | 説明 |
| --- | --- | --- |
| id | string | イベントメンバーID |
| eventId | string | イベントID |
| userId | string/null | ユーザーID。URL参加者の場合はnull |
| displayName | string | イベント内表示名 |
| role | EventMemberRole | イベント内での権限 |
| memberType | EventMemberType | 参加者種別 |
| user | User/null | 紐づくユーザー情報 |
| createdAt | string | 作成日時 |
| updatedAt | string | 更新日時 |

---

## EventMemberRole

| Value | 説明 |
| --- | --- |
| owner | イベント作成者 |
| member | 通常参加者 |

---

## EventMemberType

| Value | 説明 |
| --- | --- |
| user | ログインユーザー |
| guest | URL参加者 |

---

## Location

| Field | Type | 説明 |
| --- | --- | --- |
| name | string/null | 場所名 |
| address | string/null | 住所 |
| googlePlaceId | string/null | Google Place ID |
| latitude | number/null | 緯度 |
| longitude | number/null | 経度 |
| googleMapsUrl | string/null | Google Maps URL |

---

## Event

| Field | Type | 説明 |
| --- | --- | --- |
| id | string | イベントID |
| title | string | イベント名 |
| date | string | 開催日 |
| location | Location/null | 場所 |
| description | string/null | 詳細 |
| inviteUrl | string/null | 共有用の招待URL |
| createdBy | User | イベント作成者 |
| members | EventMember[] | イベント参加者一覧 |
| myMember | EventMember/null | 自分のイベント内メンバー情報 |
| confirmedCandidateId | string/null | 確定済み予定候補ID |
| createdAt | string | 作成日時 |
| updatedAt | string | 更新日時 |

---

## EventListItem

イベント一覧画面で使用する軽量なEvent型。

| Field | Type | 説明 |
| --- | --- | --- |
| id | string | イベントID |
| title | string | イベント名 |
| date | string | 開催日 |
| location | Location/null | 場所 |
| memberCount | number | 参加者数 |
| isConfirmed | boolean | 予定確定済みかどうか |

---

## ScheduleCandidate

| Field | Type | 説明 |
| --- | --- | --- |
| id | string | 予定候補ID |
| eventId | string | イベントID |
| title | string | 予定候補名 |
| startAt | string | 開始日時 |
| endAt | string/null | 終了日時 |
| location | Location/null | 場所 |
| description | string/null | 詳細 |
| status | CandidateStatus | 予定候補の状態 |
| createdByMember | EventMember | 作成したイベントメンバー |
| commentCount | number | コメント数 |
| likeCount | number | いいね数 |
| createdAt | string | 作成日時 |
| updatedAt | string | 更新日時 |

---

## Comment

| Field | Type | 説明 |
| --- | --- | --- |
| id | string | コメントID |
| candidateId | string | 予定候補ID |
| body | string | コメント本文 |
| authorMember | EventMember | 投稿者のイベントメンバー情報 |
| likeCount | number | いいね数 |
| likedByMe | boolean | 自分がいいね済みかどうか |
| createdAt | string | 投稿日時 |
| updatedAt | string | 更新日時 |

---

## CandidateStatus

| Value | 説明 |
| --- | --- |
| pending | 未確定 |
| confirmed | 確定済み |
| cancelled | 取消済み |

---

## EventInviteToken

| Field | Type | 説明 |
| --- | --- | --- |
| id | string | 招待トークンID |
| eventId | string | イベントID |
| inviteToken | string | 招待トークン |
| url | string | 招待URL |
| expiresAt | string/null | 有効期限 |
| revokedAt | string/null | 無効化日時 |
| createdAt | string | 作成日時 |

---

## MemberSession

| Field | Type | 説明 |
| --- | --- | --- |
| token | string | ローカル保存用トークン |
| expiresAt | string/null | 有効期限 |

---

## ErrorResponse

| Field | Type | 説明 |
| --- | --- | --- |
| error | object | エラー情報 |
| error.code | string | エラーコード |
| error.message | string | エラーメッセージ |
| error.details | array/null | 詳細情報 |

例：

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "入力内容が正しくありません",
    "details": [
      {
        "field": "title",
        "message": "タイトルは必須です"
      }
    ]
  }
}

---

## 追加エラーコード

| Status | Code | 説明 |
| --- | --- | --- |
| 410 | INVITE_TOKEN_EXPIRED | 招待URLの有効期限切れ |
| 410 | INVITE_TOKEN_REVOKED | 招待URLの無効化済み |
| 410 | MEMBER_SESSION_EXPIRED | ローカルトークンの有効期限切れ |