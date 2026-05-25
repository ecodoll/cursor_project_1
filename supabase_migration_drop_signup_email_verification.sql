-- 회원가입 이메일 인증번호(6자리) 기능 제거
-- Supabase SQL Editor에서 실행하세요.

drop policy if exists "anon signup_email_verifications all" on public.signup_email_verifications;
drop policy if exists "auth signup_email_verifications all" on public.signup_email_verifications;

drop table if exists public.signup_email_verifications;

-- (선택) Edge Function send-signup-verification, verify-signup-code 는
-- Supabase 대시보드 또는 CLI에서 더 이상 사용하지 않으면 삭제하세요.
