// Copyright (c) Jeff Steinbok. All rights reserved.
// Licensed under the MIT License. See LICENSE in the project root for license information.

import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { JeffpardyHostController } from "./JeffpardyHostController";

const mockInvoke = vi.fn().mockResolvedValue(undefined);
const mockOn = vi.fn();
const mockStart = vi.fn().mockResolvedValue(undefined);
const mockStop = vi.fn().mockResolvedValue(undefined);

const mockConnection = {
    start: mockStart,
    stop: mockStop,
    invoke: mockInvoke,
    on: mockOn,
};

vi.mock("@microsoft/signalr", () => {
    const mockWithUrl = vi.fn().mockReturnThis();
    return {
        HubConnectionBuilder: class {
            withUrl = mockWithUrl;
            withAutomaticReconnect = vi.fn().mockReturnThis();
            configureLogging = vi.fn().mockReturnThis();
            build = vi.fn(() => mockConnection);
        },
        LogLevel: { Trace: 0 },
    };
});

import { HostSignalRClient } from "./HostSignalRClient";

const mockController = {
    updateUsers: vi.fn(),
    submitWager: vi.fn(),
    submitAnswer: vi.fn(),
    assignBuzzedInUser: vi.fn(),
} as unknown as JeffpardyHostController;

describe("HostSignalRClient", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("creates HubConnection with correct URL", () => {
        const client = new HostSignalRClient(mockController, "GAME1", "HOST1");

        expect(client.hubConnection).toBe(mockConnection);
        expect(mockConnection.on).toHaveBeenCalled();
    });

    it("invokes connectHost with gameCode and hostCode on connection start", async () => {
        new HostSignalRClient(mockController, "GAME1", "HOST1");

        await vi.waitFor(() => {
            expect(mockInvoke).toHaveBeenCalledWith("connectHost", "GAME1", "HOST1");
        });
    });

    it("registers 4 event handlers", () => {
        new HostSignalRClient(mockController, "GAME1", "HOST1");

        const registeredEvents = mockOn.mock.calls.map((call: unknown[]) => call[0]);
        expect(registeredEvents).toContain("updateUsers");
        expect(registeredEvents).toContain("submitWager");
        expect(registeredEvents).toContain("submitAnswer");
        expect(registeredEvents).toContain("assignWinner");
        expect(mockOn).toHaveBeenCalledTimes(4);
    });

    it("resetBuzzer invokes resetBuzzer with gameCode", () => {
        const client = new HostSignalRClient(mockController, "GAME1", "HOST1");
        mockInvoke.mockClear();

        client.resetBuzzer();

        expect(mockInvoke).toHaveBeenCalledWith("resetBuzzer", "GAME1");
    });

    it("activateBuzzer invokes activateBuzzer with gameCode", () => {
        const client = new HostSignalRClient(mockController, "GAME1", "HOST1");
        mockInvoke.mockClear();

        client.activateBuzzer();

        expect(mockInvoke).toHaveBeenCalledWith("activateBuzzer", "GAME1");
    });

    it("showClue invokes showClue with gameCode and clue", () => {
        const client = new HostSignalRClient(mockController, "GAME1", "HOST1");
        mockInvoke.mockClear();

        const clue = { clue: "test", question: "q", value: 200, isAsked: false, isDailyDouble: false };
        client.showClue(clue);

        expect(mockInvoke).toHaveBeenCalledWith("showClue", "GAME1", clue);
    });

    it("startRound invokes startRound with gameCode and round", () => {
        const client = new HostSignalRClient(mockController, "GAME1", "HOST1");
        mockInvoke.mockClear();

        const round = { id: 0, name: "Round 1", categories: [] };
        client.startRound(round);

        expect(mockInvoke).toHaveBeenCalledWith("startRound", "GAME1", round);
    });

    it("startFinalJeffpardy invokes startFinalJeffpardy with gameCode and scores", () => {
        const client = new HostSignalRClient(mockController, "GAME1", "HOST1");
        mockInvoke.mockClear();

        const scores = { TeamA: 100, TeamB: 200 };
        client.startFinalJeffpardy(scores);

        expect(mockInvoke).toHaveBeenCalledWith("startFinalJeffpardy", "GAME1", scores);
    });

    it("showFinalJeffpardyClue invokes showFinalJeffpardyClue with gameCode", () => {
        const client = new HostSignalRClient(mockController, "GAME1", "HOST1");
        mockInvoke.mockClear();

        client.showFinalJeffpardyClue();

        expect(mockInvoke).toHaveBeenCalledWith("showFinalJeffpardyClue", "GAME1");
    });

    it("endFinalJeffpardy invokes endFinalJeffpardy with gameCode", () => {
        const client = new HostSignalRClient(mockController, "GAME1", "HOST1");
        mockInvoke.mockClear();

        client.endFinalJeffpardy();

        expect(mockInvoke).toHaveBeenCalledWith("endFinalJeffpardy", "GAME1");
    });
});
