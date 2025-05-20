/// <reference types="@cloudflare/workers-types" />

// @ts-expect-error
import RSD from "@jacob-ebey/react-server-dom-vite/client";
// @ts-expect-error
import RDS from "react-dom/server.edge";
// @ts-expect-error
import { bootstrapModules, manifest } from "virtual:react-manifest";

import {
  unstable_routeRSCServerRequest as routeRSCServerRequest,
  unstable_RSCStaticRouter as RSCStaticRouter,
} from "react-router";

import { NonceContext } from "./nonce.client.tsx";

type CloudflareEnv = {
  ASSETS: Fetcher;
  SERVER: Fetcher;
};

export default {
  async fetch(request, { SERVER }) {
    const callServer = async (request: Request) => await SERVER.fetch(request);
    const nonce = btoa(
      String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))),
    );
    try {
      const z = await routeRSCServerRequest({
        request,
        callServer,
        decode: (body) => RSD.createFromReadableStream(body, manifest),
        async renderHTML(getPayload) {
          return await RDS.renderToReadableStream(

            <NonceContext value={nonce}>
              <RSCStaticRouter getPayload={getPayload} nonce={nonce} />
            </NonceContext>,
            {
              bootstrapModules,
              signal: request.signal,
              nonce,
            }
          );
        },
        hydrate: true,
        nonce,
      });
      // If z is a response from rsc, setting the headers causes error
      try {
        z.headers.set(
          "content-security-policy",
          `default-src 'self'; style-src-attr 'self' 'unsafe-inline'; script-src 'self'; script-src-elem 'self' 'nonce-${nonce}'; img-src 'self' data:` +
          (import.meta.env.DEV
            ? "; style-src-elem 'unsafe-inline'"
            : "; connect-src 'self' https://cloudflareinsights.com/"),
        );
      }
      catch (e) { }
      return z;
    } catch (reason) {
      console.error(reason);
      return new Response("Internal Server Error", { status: 500 });
    }
  },
} satisfies ExportedHandler<CloudflareEnv>;
