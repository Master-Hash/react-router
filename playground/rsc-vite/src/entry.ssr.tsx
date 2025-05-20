import { createFromReadableStream } from "@vitejs/plugin-rsc/ssr";
// @ts-expect-error
import * as ReactDomServer from "react-dom/server.edge";
import {
  unstable_RSCStaticRouter as RSCStaticRouter,
  unstable_routeRSCServerRequest as routeRSCServerRequest,
} from "react-router";

import { NonceContext } from "./nonce.client.tsx";

export default async function handler(
  request: Request,
  fetchServer: (request: Request) => Promise<Response>
) {
  const bootstrapScriptContent = await import.meta.viteRsc.loadBootstrapScriptContent("index");
  const nonce = btoa(
    String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))),
  );
  const h: HeadersInit = new Headers();
  h.set(
    "content-security-policy",
    `default-src 'self'; style-src-attr 'self' 'unsafe-inline'; script-src 'self'; script-src-elem 'self' 'nonce-${nonce}'; img-src 'self' data:` +
    (import.meta.env.DEV
      ? "; style-src-elem 'unsafe-inline'"
      : "; connect-src 'self' https://cloudflareinsights.com/"),
  );
  return routeRSCServerRequest({
    request,
    fetchServer,
    createFromReadableStream,
    renderHTML(getPayload) {
      return ReactDomServer.renderToReadableStream(
        <NonceContext value={nonce}>
          <RSCStaticRouter getPayload={getPayload} nonce={nonce} />
        </NonceContext>,
        {
          bootstrapScriptContent,
          signal: request.signal,
        }
      );
    },
    hydrate: true,
    nonce,
    entryHeaders: h,
  });
}
