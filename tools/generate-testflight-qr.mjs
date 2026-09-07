// Copyright (c) Jeff Steinbok. All rights reserved.
// Licensed under the MIT License. See LICENSE in the project root for license information.

// Renders the TestFlight QR code to a static SVG, so the /ios landing page can
// ship it as a plain <img> rather than pulling React onto an otherwise static
// Razor page.
//
// Re-run after changing TestFlightUrl:
//     node tools/generate-testflight-qr.mjs

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { QRCodeSVG } from "qrcode.react";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const constantsPath = path.join(repoRoot, "src/web/utilities/IosApp.ts");
const outputPath = path.join(repoRoot, "wwwroot/images/testflight-qr.svg");

// Read the URL from the TypeScript constant so the QR code can never drift from
// the link the rest of the app uses.
const source = readFileSync(constantsPath, "utf8");
const match = source.match(/export const TestFlightUrl = "([^"]+)"/);
if (!match) {
    throw new Error(`Could not find TestFlightUrl in ${constantsPath}`);
}
const testFlightUrl = match[1];

const svg = renderToStaticMarkup(
    React.createElement(QRCodeSVG, {
        value: testFlightUrl,
        size: 240,
        level: "M",
        marginSize: 2,
        bgColor: "#ffffff",
        fgColor: "#000000",
        // renderToStaticMarkup omits xmlns, which is optional for inline SVG but
        // required for a standalone .svg file: without it the browser refuses to
        // parse the document and <img> renders nothing.
        xmlns: "http://www.w3.org/2000/svg",
    })
);

writeFileSync(outputPath, `${svg}\n`, "utf8");
console.log(`Wrote ${path.relative(repoRoot, outputPath)} for ${testFlightUrl}`);
