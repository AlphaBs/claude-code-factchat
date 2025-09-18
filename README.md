# FactChat Claude Proxy

Claude CLI를 FactChat API와 연결하는 프록시 서버입니다.

## 설치

### Claude Code

claude-code 가 먼저 설치되어 있어야 합니다.

```bash
npm install -g @anthropic-ai/claude-code
```

### fchat-claude

```bash
npm install -g fchat-claude
```

## API 키 발급

1. factchat 사이트 접속 및 로그인
2. 화면 좌측 하단 '개발자 설정' 클릭
3. 'API 키 생성', 아무 이름 설정 후 생성하기
4. 생성된 API 키를 복사하여 잘 보관해 두세요

## 실행

```bash
fchat-claude
```

처음 실행시 API 키를 입력하라는 메세지가 나옵니다. 위에서 발급받은 API 키를 붙여넣기 하면 됩니다.