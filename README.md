# Slowed + Reverb Web App

브라우저에서 오디오 파일을 업로드하고, **속도(Slowed)** + **리버브(Reverb)** 효과를 적용해 미리듣기한 뒤 **MP3(192/256/320 kbps)**로 다운로드할 수 있는 단일 페이지 앱입니다.

## 주요 기능

- 오디오 파일 업로드
  - 클릭 업로드 + 드래그 앤 드롭 지원
- 실시간 파라미터 조절
  - 속도: `0.25x ~ 1.00x`
  - 리버브 믹스: `0% ~ 100%`
- 실시간 미리듣기
  - Web Audio API 기반 재생
  - 주파수 바(Visualizer) 표시
- MP3 다운로드
  - `192 / 256 / 320 kbps` 비트레이트 선택
  - OfflineAudioContext로 전체 렌더 후 `lamejs`로 인코딩
- 감성 배경 애니메이션
  - ASCII 도시 + 빗줄기 애니메이션 캔버스

## 기술 스택

- HTML5 / CSS3 / Vanilla JavaScript
- Web Audio API (`AudioContext`, `OfflineAudioContext`, `ConvolverNode`, `AnalyserNode`)
- Canvas 2D
- [lamejs 1.2.1 (CDN)](https://cdnjs.cloudflare.com/ajax/libs/lamejs/1.2.1/lame.min.js)

## 프로젝트 구조

```text
slowed_reverb/
├── index.html      # 앱 UI 구조
├── style.css       # 다크/글래스모피즘 스타일
├── app.js          # 오디오 엔진 + 배경 애니메이션 + MP3 렌더/다운로드
└── README.md       # 프로젝트 설명 및 실행 방법
```

## 실행 방법

### 1) 로컬에서 바로 실행 (가장 간단)

`index.html`을 브라우저에서 직접 열면 됩니다.

- macOS: Finder에서 `index.html` 더블클릭
- Windows: Explorer에서 `index.html` 더블클릭

> 일부 브라우저 정책/환경에 따라 로컬 파일(`file://`) 접근 시 기능 제한이 있을 수 있으므로,
> 문제가 있으면 아래의 로컬 서버 실행 방법을 사용하세요.

### 2) 로컬 서버로 실행 (권장)

프로젝트 루트에서 아래 중 하나를 실행:

```bash
# Python 3
python3 -m http.server 8000
```

브라우저에서 `http://localhost:8000` 접속 후 `index.html` 열기.

## 사용법

1. 페이지 접속 후 중앙 업로드 박스를 클릭하거나 오디오 파일을 드래그해 업로드합니다.
2. 파일 로드가 완료되면 컨트롤(속도/리버브/비트레이트/버튼)이 활성화됩니다.
3. **미리듣기** 버튼으로 현재 설정을 재생합니다.
4. 속도와 리버브 값을 조절해 원하는 톤을 맞춥니다.
5. MP3 품질(192/256/320 kbps)을 선택합니다.
6. **다운로드(MP3)** 버튼을 누르면 렌더링 후 파일이 저장됩니다.

## 단축키

- `Space`: 재생/정지 토글
  - 단, 입력 요소(`input`, `select`)에 포커스가 있을 때는 동작하지 않습니다.

## 브라우저 호환성

최신 Chrome / Edge / Firefox 권장.

- Web Audio API, Canvas, Blob 다운로드를 지원하는 환경에서 정상 동작합니다.
- 모바일 브라우저에서는 자동 재생/오디오 컨텍스트 정책으로 인해 동작이 제한될 수 있습니다.

## 참고 및 주의사항

- 리버브는 외부 IR 파일 없이 코드에서 생성한 Impulse Response를 사용합니다.
- 긴 오디오/높은 샘플레이트는 오프라인 렌더링 및 MP3 인코딩 시간이 더 걸릴 수 있습니다.
- 출력 음질/볼륨은 원본 파일 특성, 속도 값, 리버브 믹스 값의 영향을 받습니다.

## 라이선스

별도 라이선스가 지정되어 있지 않습니다. 필요 시 LICENSE 파일을 추가해 주세요.
