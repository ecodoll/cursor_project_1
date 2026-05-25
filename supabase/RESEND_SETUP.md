# Supabase 로그인·회원가입 설정

앱은 **이메일 + 비밀번호**로만 가입·로그인합니다. 확인 메일·Resend 발송은 **사용하지 않습니다**.

## Authentication → Providers → Email

[Supabase Dashboard](https://supabase.com/dashboard) → 프로젝트 → **Authentication** → **Sign In / Providers** → **Email**

| 설정 | 값 | 설명 |
|------|-----|------|
| **Enable Email provider** | 켜기 (On) | 이메일 로그인 사용 |
| **Enable email signups** | 켜기 (On) | 회원가입 허용. 끄면 `Email signups are disabled` 오류 |
| **Confirm email** | 끄기 (Off) | 가입 직후 로그인·DB 저장 가능 (확인 메일 없음) |

저장(Save) 후 1~2분 뒤 앱에서 다시 회원가입해 보세요.

### 자주 하는 실수

- **Confirm email만 끄고** **Enable email signups**까지 끈 경우 → 가입 불가 (`Email signups are disabled`)
- **Confirm email을 켠** 경우 → 가입은 되지만 로그인·승인 요청 저장이 안 될 수 있음

## 관리자 가입 승인

관리자: 로그인 → **설정 → 접속 설정** → **가입 승인 대기** → 승인 / 거절
