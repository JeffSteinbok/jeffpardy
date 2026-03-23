// Copyright (c) Jeff Steinbok. All rights reserved.
// Licensed under the MIT License. See LICENSE in the project root for license information.

import { Debug, DebugFlags } from "./Debug";

/** Utility class providing static logging methods with support for verbose debug output gated by DebugFlags. */
export class Logger {
    public static log(message?: string, ...optionalParams: unknown[]): void {
        if (optionalParams.length > 0) {
            console.log(message, optionalParams);
        } else {
            console.log(message);
        }
    }

    public static debug(message?: string, ...optionalParams: unknown[]): void {
        if (Debug.IsFlagSet(DebugFlags.VerboseLogging)) {
            if (optionalParams.length > 0) {
                console.log(message, optionalParams);
            } else {
                console.log(message);
            }
        }
    }

    public static error(message?: string, ...optionalParams: unknown[]): void {
        if (optionalParams.length > 0) {
            console.error(message, optionalParams);
        } else {
            console.error(message);
        }
    }
}
