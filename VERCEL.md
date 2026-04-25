# Vercel로 배포하기

메인 소스는 `couple_household_book.html`입니다. 배포 시 `npm run build`가 같은 내용을 `index.html`로 복사합니다. (Vercel 대시보드·CLI 모두 이 빌드를 사용합니다.)

## 1) 준비

- [Node.js LTS](https://nodejs.org/) 설치
- [Vercel](https://vercel.com/) 계정 (GitHub/GitLab/Bitbucket 연동 가능)

## 2) CLI로 첫 배포 (로컬 폴더에서)

**CLI**는 터미널(Windows에서는 **PowerShell** 또는 **명령 프롬프트**)에 명령어를 입력하는 방식입니다. 아래는 **처음 한 번** 로컬 폴더에서 배포할 때의 흐름입니다.

### 2-1. 터미널을 프로젝트 폴더로 맞추기

이 가계부 파일들이 있는 폴더가 **프로젝트 루트**입니다. 예:

`c:\Users\ecodo\cursor_practice_1`

PowerShell을 연 다음:

```powershell
cd c:\Users\ecodo\cursor_practice_1
```

(본인 PC 경로가 다르면 그 경로로 바꿉니다.) 여기서 아래 명령을 실행합니다.

### 2-2. `npm run build` — 배포 전에 한 번 “맞추기”

```bash
npm run build
```

- **하는 일**: `couple_household_book.html` 내용을 `index.html`로 복사합니다. Vercel은 보통 **웹 주소의 맨 앞(`/`)** 에서 `index.html`을 찾기 때문에 이 단계가 있습니다.
- **성공 시**: 오류 없이 끝나면 됩니다. `package.json`의 `build` 스크립트가 실행된 것입니다.
- **실패 시**: `node` / `npm`이 없다고 나오면 [Node.js LTS](https://nodejs.org/)를 먼저 설치한 뒤, 터미널을 **새로 연 다음** 다시 시도합니다.

### 2-3. `npx vercel` — Vercel에 올리기 (첫 배포)

```bash
npx vercel
```

- **`npx`**: 패키지를 전역 설치하지 않고, **한 번 실행**할 때 쓰는 도구입니다. 처음에는 Vercel CLI를 내려받느라 **시간이 조금** 걸릴 수 있습니다.
- **처음이면** 브라우저가 열리며 **Vercel 로그인**(이메일·GitHub 등)을 요구할 수 있습니다. 안내에 따라 로그인합니다.
- 터미널에서 질문이 나올 수 있습니다. 예시는 버전에 따라 조금 다를 수 있습니다.
  - **Set up and deploy?** → `Y` (예)
  - **Which scope?** → 본인 계정(팀) 선택
  - **Link to existing project?** → 첫 배포면 보통 **No** (새 프로젝트)
  - **What’s your project’s name?** → 원하는 이름(영문·숫자·하이픈 등) 또는 엔터로 기본값
  - **In which directory is your code located?** → `./` 또는 엔터 (현재 폴더가 루트일 때)
- 끝나면 **프리뷰(미리보기) URL**이 터미널에 출력됩니다. `https://xxxx.vercel.app` 같은 주소로 접속해 동작을 확인할 수 있습니다.

### 2-4. 프로덕션(본 서비스 주소)으로 올리기

미리보기만으로 충분하면 생략할 수 있고, **고정된 공개 주소**로 쓰려면:

```bash
npx vercel --prod
```

- 같은 프로젝트에 **프로덕션 배포**를 한 번 더 올립니다. 이후 공유할 주소는 보통 대시보드에 보이는 **Production** 도메인을 쓰면 됩니다.

### 2-5. 이후 수정할 때마다

코드를 고친 뒤에는 같은 폴더에서:

```bash
npm run build
npx vercel --prod
```

순서로 실행하면 변경 내용이 반영됩니다. (GitHub 연동 후에는 푸시만으로 자동 배포할 수 있어 **3번** 절차가 편합니다.)

## 3) GitHub와 연동 (권장)

1. 이 폴더를 GitHub 저장소에 푸시합니다.
2. [Vercel Dashboard](https://vercel.com/dashboard) → **Add New…** → **Project** → 해당 저장소 선택.
3. **Framework Preset**: Other (또는 자동 인식)
4. **Build Command**: `npm run build` (저장소의 `vercel.json`·`package.json`에 맞춰져 있음)
5. **Output Directory**: `.` (루트 그대로, 기본값 유지)
6. **Deploy**

이후 `couple_household_book.html`만 수정해 푸시하면 Vercel이 빌드 후 자동 배포합니다.

## 4) Supabase

배포가 끝나면 주소가 `https://xxxx.vercel.app` 형태입니다. Supabase 프로젝트에서 **Authentication → URL** 등에 이 URL을 허용 목록에 넣어야 할 수 있습니다. (프로젝트 설정에 따라 다름.)

## 5) Windows에서 빌드만 할 때

Node가 없으면 PowerShell:

```powershell
.\deploy.ps1
```

Node가 있으면 `npm run build`와 동일하게 `index.html`을 맞출 수 있습니다.
