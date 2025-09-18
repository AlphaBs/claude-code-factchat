# npm Publish 가이드

## 1. npm 계정 설정

```bash
# npm 로그인
npm login

# 현재 로그인된 사용자 확인
npm whoami
```

## 2. 패키지 이름 확인

현재 패키지 이름: `fchat-claude`

이미 존재하는지 확인:
```bash
npm view fchat-claude
```

만약 이미 존재한다면 다른 이름으로 변경해야 합니다.

## 3. 빌드 및 테스트

```bash
# 빌드
pnpm build

# 로컬에서 테스트
node dist/index.js --help
```

## 4. 패키지 정보 수정

`package.json`에서 다음 정보를 수정하세요:

- `author`: 실제 이름과 이메일
- `repository.url`: 실제 GitHub 저장소 URL
- `homepage`: 실제 홈페이지 URL
- `bugs.url`: 실제 이슈 트래커 URL

## 5. 패키지 내용 확인

```bash
# 패키지에 포함될 파일들 확인
npm pack --dry-run
```

## 6. Publish

```bash
# 최종 확인
npm publish --dry-run

# 실제 publish
npm publish
```

## 7. 설치 테스트

다른 터미널에서:
```bash
npm install -g fchat-claude
fchat-claude
```

## 8. 버전 업데이트

```bash
# 패치 버전 (1.0.0 → 1.0.1)
npm version patch

# 마이너 버전 (1.0.0 → 1.1.0)
npm version minor

# 메이저 버전 (1.0.0 → 2.0.0)
npm version major

# 변경사항을 GitHub에 push
git push --follow-tags

# 새 버전 publish
npm publish
```

## 주의사항

1. **패키지 이름**: `fchat-claude`가 이미 존재할 수 있습니다. 다른 이름을 고려하세요.
2. **버전 관리**: 시맨틱 버저닝을 따르세요.
3. **의존성**: `devDependencies`는 publish되지 않습니다.
4. **파일 크기**: 불필요한 파일은 `.npmignore`로 제외하세요.
