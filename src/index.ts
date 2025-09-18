#!/usr/bin/env node

import pino from "pino";
import { startServer } from "./server";
import dotenv from "dotenv";
import portfinder from "portfinder";
import { ConfigFile, loadConfig, saveConfig, LOG_PATH } from "./config";
import { spawn } from "child_process";
import * as readline from "readline";

dotenv.config();

// proxy logger, 파일에 로깅
const logger = pino({
  level: "info",
  transport: {
    targets: [
      {
        target: "pino/file",
        level: "info",
        options: {
          destination: LOG_PATH,
          mkdir: true,
        },
      },
    ],
  },
});

// 사용자 입력을 받는 함수
function askQuestion(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

// init 명령어 처리
async function initConfig() {
  try {
    // API 키 입력받기
    const apiKey = await askQuestion("FactChat API 키를 입력하세요: ");
    if (!apiKey) {
      console.error("❌ API 키는 필수입니다.");
      process.exit(1);
    }

    // 설정 객체 생성
    const config = {
      apiKey,
      host: "localhost",
      port: 0,
    };

    // 설정 파일 저장
    saveConfig(config);

    console.log("\n✅ 설정이 완료되었습니다!");
    console.log("\n이제 다음 명령어로 사용할 수 있습니다:");
    console.log("  fchat-claude");
  } catch (error) {
    console.error("❌ 설정 중 오류가 발생했습니다:", error);
    process.exit(1);
  }
}

async function main() {
  const args = process.argv.slice(2);

  // init 명령어 처리
  if (args.length > 0 && args[0] === "init") {
    await initConfig();
    return;
  }

  // 설정 파일에서 기본값 로드
  const configFile = loadConfig();

  const apiKey = process.env.FACTCHAT_PROXY_API_KEY || configFile.apiKey;
  if (!apiKey) {
    await initConfig();
  }

  const host =
    process.env.FACTCHAT_PROXY_HOST || configFile.host || "localhost";

  let port: number = 0;
  if (process.env.FACTCHAT_PROXY_PORT) {
    const parsedPort = parseInt(process.env.FACTCHAT_PROXY_PORT, 10);
    if (isNaN(parsedPort) || parsedPort < 1 || parsedPort > 65535) {
      throw new Error(
        `잘못된 포트 범위: ${process.env.FACTCHAT_PROXY_PORT}`
      );
    }
    port = parsedPort;
  } else if (configFile.port) {
    port = configFile.port;
  }

  if (port === 0) {
    port = await portfinder.getPortPromise();
  }

  const config: ConfigFile = {
    host,
    port,
    apiKey,
  };

  // 콘솔에 로그 출력
  console.info("proxy host: %s, proxy port: %d", config.host, config.port);
  await startServer(logger, config);

  if (args[0] === "start-proxy") {
    console.log("proxy server is running");
  } else {
    const child = spawn(args[0] ?? "claude", args.slice(1) ?? [], {
      stdio: "inherit",
      shell: true,
      env: {
        ...process.env,
        ANTHROPIC_BASE_URL: `http://${config.host}:${config.port}`,
        ANTHROPIC_AUTH_TOKEN: "-",
      },
    });

    child.on("error", (error) => {
      logger.error({ error }, "Failed to start child process");
      process.exit(1);
    });

    child.on("exit", (code, signal) => {
      if (code !== 0) {
        logger.info(
          { code, signal },
          "Child process exited with non-zero code"
        );
      }
      process.exit(code || 0);
    });
  }
}

// Handle uncaught exceptions and unhandled rejections
process.on("uncaughtException", (error) => {
  logger.fatal({ error }, "Uncaught exception");
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  logger.fatal({ reason, promise }, "Unhandled rejection");
  process.exit(1);
});

main().catch((error) => {
  logger.fatal({ error }, "Failed to start application");
  process.exit(1);
});
