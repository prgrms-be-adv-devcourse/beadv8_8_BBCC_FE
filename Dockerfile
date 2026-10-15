# Kidly 프론트 배포 이미지: 빌드한 정적 파일 + Nginx (SPA · /api 프록시)
# 빌드: docker build -t kidly-fe --build-arg VITE_TOSS_CLIENT_KEY=... .
# 실행: docker run -p 80:80 -e API_UPSTREAM=http://app:8080 kidly-fe

FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY . .
# 화면에 그대로 들어가는 공개 값만 빌드 인자로 받는다 (비밀 값은 넣지 않는다)
# VITE_API_BASE_URL 비움 = 같은 주소의 /api로 요청 (Nginx가 백엔드로 넘김)
ARG VITE_API_BASE_URL=""
ARG VITE_USE_MOCK=true
ARG VITE_DEMO_ROLE_SWITCH=true
ARG VITE_TOSS_CLIENT_KEY=""
ARG VITE_KAKAO_CLIENT_ID=""
ARG VITE_KAKAO_REDIRECT_URI=""
# 타입 검사 · 테스트는 CI에서 하고, 이미지는 번들만 만든다
RUN npx vite build

FROM nginx:1.27-alpine
# 백엔드 주소 · Docker DNS (실행할 때 -e로 바꿀 수 있다)
ENV API_UPSTREAM=http://app:8080 \
    NGINX_RESOLVER=127.0.0.11
COPY deploy/nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1/healthz || exit 1
