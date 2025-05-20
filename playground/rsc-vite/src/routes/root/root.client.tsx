"use client";
import { use } from "react";
import {
  useRouteError,
  useNavigation,
  isRouteErrorResponse,
  ScrollRestoration,
} from "react-router";
import { NonceContext } from "../../ssr/nonce.client.tsx";

export function ErrorReporter() {
  const error = useRouteError();

  if (typeof document !== "undefined") {
    console.log(error);
  }

  if (isRouteErrorResponse(error)) {
    return (
      <div>
        <h2>Error Response</h2>
        <p>Status: {error.status}</p>
        <p>Data: {JSON.stringify(error.data)}</p>
      </div>
    );
  }

  return (
    <div>
      <h2>Error</h2>
      <p>{error instanceof Error ? error.message : String(error)}</p>
    </div>
  );
}

export function NavigationState() {
  let navigation = useNavigation();
  return <p>Navigation state: {navigation.state}</p>;
}

export function ErrorBoundary() {
  return (
    <>
      <h1>Something went wrong!</h1>
      <ErrorReporter />
    </>
  );
}

export function shouldRevalidate({ nextUrl }: { nextUrl: URL; }) {
  return !nextUrl.pathname.endsWith("/about");
}

export function WrappedScrollRestoration() {
  const nonce = use(NonceContext);
  return <ScrollRestoration nonce={nonce} />;
}
