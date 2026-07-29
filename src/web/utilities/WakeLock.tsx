// Copyright (c) Jeff Steinbok. All rights reserved.
// Licensed under the MIT License. See LICENSE in the project root for license information.

import { Logger } from "./Logger";

/**
 * Thin wrapper around the Screen Wake Lock API used to keep the display awake
 * during a game (so the host board and player buzzer don't dim or sleep).
 *
 * The browser automatically releases a wake lock whenever the page becomes
 * hidden (tab switch, phone lock, etc.), so this helper re-acquires the lock
 * on visibilitychange while it is enabled. Supported on iOS Safari 16.4+ and
 * evergreen desktop browsers; it degrades to a no-op where unavailable.
 */
export class WakeLock {
    private sentinel: WakeLockSentinel | null = null;
    private enabled: boolean = false;

    private static get isSupported(): boolean {
        return typeof navigator !== "undefined" && "wakeLock" in navigator;
    }

    /**
     * Begin keeping the screen awake. Safe to call more than once. Must be
     * triggered by (or shortly after) a user gesture on some platforms.
     */
    public enable = async (): Promise<void> => {
        this.enabled = true;
        document.addEventListener("visibilitychange", this.onVisibilityChange);
        await this.acquire();
    };

    /** Stop keeping the screen awake and release any held lock. */
    public disable = async (): Promise<void> => {
        this.enabled = false;
        document.removeEventListener("visibilitychange", this.onVisibilityChange);
        await this.release();
    };

    private acquire = async (): Promise<void> => {
        if (!this.enabled || !WakeLock.isSupported) {
            return;
        }
        if (this.sentinel != null) {
            return;
        }
        if (document.visibilityState !== "visible") {
            return;
        }
        try {
            this.sentinel = await navigator.wakeLock.request("screen");
            this.sentinel.addEventListener("release", () => {
                this.sentinel = null;
            });
            Logger.debug("WakeLock: acquired");
        } catch (err) {
            // Common on low battery or when not triggered by a user gesture.
            Logger.debug("WakeLock: request failed", err);
        }
    };

    private release = async (): Promise<void> => {
        if (this.sentinel != null) {
            try {
                await this.sentinel.release();
            } catch {
                // Ignore — already released.
            }
            this.sentinel = null;
            Logger.debug("WakeLock: released");
        }
    };

    private onVisibilityChange = () => {
        if (document.visibilityState === "visible") {
            // The lock is dropped automatically when hidden; re-acquire it.
            void this.acquire();
        }
    };
}
