import { ScrollViewStyleReset, useServerDocumentContext } from "expo-router/html";
import type { PropsWithChildren } from "react";

/** Node-only document shell for the web static export -- based on Expo
 * Router's own default template (see expo/@expo/cli static/template/+html.tsx)
 * with PWA tags (manifest link, theme-color) added. Cannot import global.css
 * or use browser APIs here; that stays in _layout.tsx, which still runs
 * client-side as normal. useServerDocumentContext/headNodes/bodyNodes and
 * ScrollViewStyleReset are load-bearing -- dropping them breaks hydration
 * and RN-web's flex/scroll layout, not just visuals. */
export default function Root({ children }: PropsWithChildren) {
  const { bodyAttributes, bodyNodes, htmlAttributes, headNodes } = useServerDocumentContext();

  return (
    <html lang="en" {...htmlAttributes}>
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <meta name="theme-color" content="#f28482" />
        <meta name="description" content="Your calendar and to-dos, in sync everywhere." />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-512.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Tend" />

        <ScrollViewStyleReset />

        {headNodes}
      </head>
      <body {...bodyAttributes}>
        {children}
        {bodyNodes}
      </body>
    </html>
  );
}
