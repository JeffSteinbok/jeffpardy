// Copyright (c) Jeff Steinbok. All rights reserved.
// Licensed under the MIT License. See LICENSE in the project root for license information.

import { afterEach, describe, expect, it, vi } from "vitest";
import type * as signalR from "@microsoft/signalr";
import type { IPlayerPageState } from "./PlayerPage";

const handlers = new Map<string, (...args: unknown[]) => void>();
const mockInvoke = vi.fn();
const mockConnection = {
    start: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn().mockResolvedValue(undefined),
    invoke: mockInvoke,
    on: vi.fn((eventName: string, handler: (...args: unknown[]) => void) => {
        handlers.set(eventName, handler);
    }),
    onclose: vi.fn(),
};

vi.mock("@microsoft/signalr", () => ({
    HubConnectionBuilder: class {
        withUrl = vi.fn().mockReturnThis();
        build = vi.fn(() => mockConnection);
    },
}));

import { PlayerPage } from "./PlayerPage";

describe("PlayerPage", () => {
    afterEach(() => {
        handlers.clear();
        vi.clearAllMocks();
    });

    it("keeps the server-synchronized Final Jeffpardy screen after registration completes", async () => {
        const page = new PlayerPage({});
        const hubConnection = mockConnection as unknown as signalR.HubConnection;
        page.state = {
            ...page.state,
            gameCode: "GAME1",
            hubConnection,
        };
        page.nameTemp = "Alice";
        page.teamTemp = "TeamA";
        page.getPlayerId = vi.fn().mockReturnValue("player-alice");
        page.setState = ((update: Partial<IPlayerPageState>, callback?: () => void) => {
            page.state = { ...page.state, ...update };
            callback?.();
        }) as typeof page.setState;
        page.registerHubHandlers(hubConnection);

        let synchronizedPageState: IPlayerPageState["playerPageState"] = page.state.playerPageState;
        mockInvoke.mockImplementation(() => {
            handlers.get("startFinalJeffpardy")?.({ TeamA: 1200 });
            synchronizedPageState = page.state.playerPageState;
            return Promise.resolve();
        });

        page.registerPlayer();
        await Promise.resolve();

        expect(mockInvoke).toHaveBeenCalledWith("connectPlayer", "GAME1", "TeamA", "Alice", "player-alice");
        expect(page.state.playerPageState).toBe(synchronizedPageState);
        expect(page.state.finalJeffpardyMaxWager).toBe(1200);
    });

    it("automatically submits a zero wager when a late player's team has no score", async () => {
        const page = new PlayerPage({});
        const hubConnection = mockConnection as unknown as signalR.HubConnection;
        page.state = {
            ...page.state,
            gameCode: "GAME1",
            hubConnection,
            name: "Bob",
            team: "New Team",
        };
        page.getPlayerId = vi.fn().mockReturnValue("player-bob");
        page.setState = ((update: Partial<IPlayerPageState>, callback?: () => void) => {
            page.state = { ...page.state, ...update };
            callback?.();
        }) as typeof page.setState;
        page.registerHubHandlers(hubConnection);
        mockInvoke.mockResolvedValue(undefined);

        handlers.get("startFinalJeffpardy")?.({ TeamA: 1200 });
        await Promise.resolve();

        expect(page.state.finalJeffpardyMaxWager).toBe(0);
        expect(page.state.finalJeffpardyWager).toBe(0);
        expect(page.state.finalJeffpardyWagerEnabled).toBe(false);
        expect(mockInvoke).toHaveBeenCalledWith("submitWager", "GAME1", 0, "player-bob");
    });
});
