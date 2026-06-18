# AI Agent Game Lab

로컬용 1차 MVP 프로토타입입니다.

## 실행 방법

서버 없이 아래 파일을 브라우저로 열면 됩니다.

```text
/Users/yuha/core_lab_agent_model/index.html
```

현재 환경에서는 로컬 포트 바인딩이 권한 문제로 막혀 `python3 -m http.server` 방식은 사용할 수 없었습니다.

## 현재 구현된 것

- VS Code 느낌의 4분할 작업 화면
- 왼쪽 러닝 게임 Canvas
- 오른쪽 위 변수/설정 확인창
- 오른쪽 아래 AI 요청 mock 채팅
- 변경 제안 미리보기
- 제안 적용, 제안 지우기, 되돌리기, 기본값 초기화
- 점프/슬라이드 조작
- 해본 결과 기록
- 변경 기록과 기록 localStorage 저장

## 주요 파일

- `index.html`: 화면 구조
- `styles.css`: 전체 UI 스타일
- `app.js`: 게임 루프, settings, mock AI, 기록 저장
- `PROJECT_PLAN.md`: 프로젝트 계획 문서
