// Copyright (c) Jeff Steinbok. All rights reserved.
// Licensed under the MIT License. See LICENSE in the project root for license information.

import DOMPurify from "dompurify";

/**
 * Sanitizes HTML strings to prevent XSS attacks.
 * Allows basic formatting tags used in clue text (italics, bold, underline, links).
 */
export function sanitizeHtml(html: string): string {
    return DOMPurify.sanitize(html, {
        ALLOWED_TAGS: ["b", "i", "em", "strong", "u", "span", "br", "a"],
        ALLOWED_ATTR: ["href", "target", "rel"],
    });
}
