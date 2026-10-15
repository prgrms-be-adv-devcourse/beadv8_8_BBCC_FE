# 프론트 배포

데브코스 AWS 지원(EC2 1대 · S3 버킷 1개, CloudFront · ACM 기본 불가)에 맞춘 구성이다.

```
브라우저 ─ https://도메인 ─ (HTTPS 종료: 호스트 Nginx + Certbot 등)
                              └ kidly-fe 컨테이너 (Nginx, 80)
                                  ├ /        → 정적 파일 (SPA: 모르는 주소는 index.html)
                                  └ /api/... → 백엔드 컨테이너 (API_UPSTREAM, 기본 http://app:8080)
```

- 프론트와 API가 **같은 주소**라 CORS가 필요 없고, 리프레시 토큰 쿠키(SameSite=Lax, Domain 없음)가 그대로 동작한다.
- S3 정적 호스팅은 쓰지 않는다: 버킷이 1개(상품 이미지)이고, CloudFront 없이는 HTTPS가 안 돼 토스 · 카카오에 쓸 수 없다.
- 추가 AWS 리소스 없음 (같은 EC2).

## 파일

| 파일                                 | 내용                                                                                            |
| ------------------------------------ | ----------------------------------------------------------------------------------------------- |
| `Dockerfile`                         | `vite build` → `nginx:1.27-alpine`에 dist와 Nginx 설정                                          |
| `deploy/nginx/default.conf.template` | SPA fallback · `/assets` 1년 캐시 · `index.html` 캐시 안 함 · gzip · `/api` 프록시 · `/healthz` |
| `deploy/compose.rehearsal.yml`       | 배포와 같은 이미지를 내 PC에서 띄워 로컬 백엔드(8080)에 붙여 보는 리허설                        |
| `.github/workflows/deploy.yml`       | PR: 이미지 빌드 확인 / main 머지 · 수동: GHCR에 올림 (`ghcr.io/<저장소>:latest`, `:<커밋>`)     |

## 빌드 값 (빌드 인자 = 저장소 Actions Variables)

모두 화면에 그대로 들어가는 **공개 값**이다. 비밀 값은 넣지 않는다.

| 이름                      | 배포 값                                          | 설명                                               |
| ------------------------- | ------------------------------------------------ | -------------------------------------------------- |
| `VITE_API_BASE_URL`       | 비움                                             | 같은 주소의 `/api`로 요청                          |
| `VITE_USE_MOCK`           | `true`                                           | 백엔드에 없는 API(상품 목록 · 추천 · 정산 등)는 목 |
| `VITE_DEMO_ROLE_SWITCH`   | 서버에 개발 토큰이 있으면 `true`, 없으면 `false` | `false`면 시연 역할 전환을 감추고 카카오 로그인만  |
| `VITE_TOSS_CLIENT_KEY`    | 토스 테스트 클라이언트 키                        | 결제 담당에게                                      |
| `VITE_KAKAO_CLIENT_ID`    | 카카오 REST API 키                               | 회원 담당에게                                      |
| `VITE_KAKAO_REDIRECT_URI` | `https://도메인/oauth/kakao/callback`            | 백엔드 `KAKAO_REDIRECT_URI`와 같게                 |

실행 환경 값: `API_UPSTREAM`(백엔드 주소, 기본 `http://app:8080`), `NGINX_RESOLVER`(기본 Docker DNS `127.0.0.11`).

## 배포 compose에 넣을 것 (예시, 인프라 담당과 맞춤)

```yaml
fe:
  image: ghcr.io/prgrms-be-adv-devcourse/beadv8_8_bbcc_fe:latest
  environment:
    API_UPSTREAM: http://app:8080 # 백엔드 서비스 이름
  depends_on: [app]
  restart: unless-stopped
  # HTTPS를 끝내는 앞단 Nginx가 이 컨테이너 80으로 넘긴다 (X-Forwarded-Proto 전달)
```

## 리허설 (내 PC)

1. BE 저장소에서 DB · Kafka(`docker compose up -d`)와 백엔드(`./gradlew bootRun`, local 프로필)를 띄운다
2. FE 저장소: `docker compose -f deploy/compose.rehearsal.yml up --build`
3. http://localhost:8081 → 시연 콘솔부터 진행 (API는 Nginx가 호스트 8080으로 넘김)

## 배포 전 체크 (FE 밖, 담당과 맞출 것)

- [ ] 도메인 · HTTPS(Certbot) · 배포 compose · EC2 반영(SSH) 담당
- [ ] 운영 서버에서 개발 토큰(`/dev/tokens`)을 켤지 → `VITE_DEMO_ROLE_SWITCH`
- [ ] 카카오 개발자 콘솔 Redirect URI, 토스 성공 · 실패 URL을 운영 도메인으로 등록
- [ ] 백엔드 쿠키 `secureCookie=true`(HTTPS). 같은 주소라 `cors.allowed-origins`는 필요 없음
- [ ] GHCR 패키지 공개 여부(비공개면 EC2에서 `docker login ghcr.io` 필요)
- [ ] 시연 시간: EC2 자동 실행은 9~18시
