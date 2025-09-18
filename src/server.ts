import Fastify, {
  FastifyRequest,
  FastifyReply,
} from "fastify";
import cors from "@fastify/cors";
import pino from "pino";
import { ConfigFile } from "./config";

function filterHeaders(
  headers: Record<string, string | string[]>
): Record<string, string> {
  const allowedHeaders = new Set([
    "content-type",
    "x-ratelimit-limit",
    "x-ratelimit-remaining",
    "x-ratelimit-reset",
    "anthropic-version",
    "anthropic-request-id",
  ]);

  const filteredHeaders: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (allowedHeaders.has(key.toLowerCase())) {
      filteredHeaders[key] = Array.isArray(value) ? value[0] : value;
    }
  }

  return filteredHeaders;
}

export async function startServer(logger: pino.Logger, config: ConfigFile) {
  const app = Fastify({
    loggerInstance: logger,
  });

  await app.register(cors, {
    origin: true,
  });

  app.post(
    "/v1/messages",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const requestApiKey = request.headers["x-api-key"] as string | undefined;
      const proxyApiKey = config.apiKey;

      const apiKey = proxyApiKey || requestApiKey;

      if (!apiKey) {
        const errorResponse = {
          error: "Unauthorized",
          message:
            "API key required. Set FACTCHAT_PROXY_API_KEY environment variable or provide x-api-key header.",
        };
        app.log.error(errorResponse.message);
        return reply.status(401).send(errorResponse);
      }

      const headers = {
        Authorization: `Bearer ${apiKey}`,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      };

      let response: Response;
      try {
        response = await fetch(
          "https://factchat-cloud.mindlogic.ai/v1/api/anthropic/messages",
          {
            method: "POST",
            headers,
            body: JSON.stringify(request.body),
          }
        );
      } catch (fetchError) {
        app.log.error({ error: fetchError }, "Failed to fetch from upstream API");
        const errorResponse = {
          error: "Service Unavailable",
          message: "Unable to connect to upstream service",
        };
        return reply.status(503).send(errorResponse);
      }

      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });
      const filteredHeaders = filterHeaders(responseHeaders);

      app.log.info({ statusCode: response.status }, "Upstream response received");

      reply.status(response.status);
      Object.entries(filteredHeaders).forEach(([key, value]) => {
        reply.header(key, value);
      });

      const isSuccessResponse = Math.floor(response.status / 100) === 2;

      if (!isSuccessResponse) {
        try {
          const errorText = await response.text();
          app.log.warn(
            { statusCode: response.status, body: errorText },
            "Error response from upstream"
          );
          return reply.send(errorText);
        } catch (textError) {
          app.log.error(
            { error: textError },
            "Failed to read error response body"
          );
          const fallbackError = {
            error: "Internal Server Error",
            message: "Failed to process upstream response",
          };
          return reply.status(500).send(fallbackError);
        }
      }

      try {
        return reply.send(response.body);
      } catch (bodyError) {
        app.log.error(
          { error: bodyError },
          "Failed to read success response body"
        );
        const fallbackError = {
          error: "Internal Server Error",
          message: "Failed to process upstream response",
        };
        return reply.status(500).send(fallbackError);
      }
    }
  );

  await app.listen({ 
    host: config.host,
    port: config.port
   });
}