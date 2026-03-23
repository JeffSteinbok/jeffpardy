// Copyright (c) Jeff Steinbok. All rights reserved.
// Licensed under the MIT License. See LICENSE in the project root for license information.

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import * as React from "react";
import { TeamDictionary } from "../../Types";

vi.mock("qrcode.react", () => ({
    QRCodeCanvas: (props: { value: string }) => <div data-testid="qrcode" data-value={props.value} />,
}));

const mockLoad = vi.fn();
const MockAudio = vi.fn(function () {
    this.load = mockLoad;
});
vi.stubGlobal("Audio", MockAudio);

import { HostLobby } from "./HostLobby";

function makeTeams(): TeamDictionary {
    return {
        Alpha: {
            name: "Alpha",
            score: 0,
            players: [{ name: "Alice", team: "Alpha", connectionId: "c1" }],
        },
    };
}

describe("HostLobby", () => {
    afterEach(() => {
        vi.restoreAllMocks();
        MockAudio.mockClear();
        mockLoad.mockClear();
    });

    it("renders the game code text", () => {
        const { container } = render(<HostLobby teams={makeTeams()} gameCode="ABC123" onStartGame={vi.fn()} />);
        const codeEl = container.querySelector(".gameCode");
        expect(codeEl).toBeInTheDocument();
        expect(codeEl!.textContent).toContain("ABC123");
    });

    it("renders the player URI link with correct href containing the gameCode", () => {
        const { container } = render(<HostLobby teams={makeTeams()} gameCode="XYZ789" onStartGame={vi.fn()} />);
        const link = container.querySelector("a[target='#']") as HTMLAnchorElement;
        expect(link).toBeInTheDocument();
        expect(link.href).toContain("/player#XYZ789");
    });

    it("renders a Start Game button", () => {
        const { container } = render(<HostLobby teams={makeTeams()} gameCode="CODE" onStartGame={vi.fn()} />);
        const button = container.querySelector("button");
        expect(button).toBeInTheDocument();
        expect(button!.textContent).toBe("Start Game");
    });

    it("clicking Start Game calls onStartGame callback", () => {
        const onStartGame = vi.fn();
        const { container } = render(<HostLobby teams={makeTeams()} gameCode="CODE" onStartGame={onStartGame} />);
        const button = container.querySelector("button")!;
        fireEvent.click(button);
        expect(onStartGame).toHaveBeenCalledTimes(1);
    });

    it("renders PlayerList with teams prop", () => {
        const { container } = render(<HostLobby teams={makeTeams()} gameCode="CODE" onStartGame={vi.fn()} />);
        const playerListBox = container.querySelector(".playerListBox");
        expect(playerListBox).toBeInTheDocument();
        expect(playerListBox!.querySelector(".playerList")).toBeInTheDocument();
    });

    it("renders Attribution component", () => {
        const { container } = render(<HostLobby teams={makeTeams()} gameCode="CODE" onStartGame={vi.fn()} />);
        expect(container.querySelector(".attribution")).toBeInTheDocument();
    });

    it("pre-caches 4 sound effects on mount", () => {
        render(<HostLobby teams={makeTeams()} gameCode="CODE" onStartGame={vi.fn()} />);
        expect(MockAudio).toHaveBeenCalledTimes(4);
        expect(mockLoad).toHaveBeenCalledTimes(4);
    });
});
