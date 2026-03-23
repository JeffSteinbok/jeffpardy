// Copyright (c) Jeff Steinbok. All rights reserved.
// Licensed under the MIT License. See LICENSE in the project root for license information.

import { describe, it, expect, vi, afterEach } from "vitest";
import { render } from "@testing-library/react";
import * as React from "react";
import { ScoreboardEntry, ScoreboardEntryBuzzerState } from "./ScoreboardEntry";

describe("ScoreboardEntry", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("renders team name, user name, and score", () => {
        const { container } = render(
            <ScoreboardEntry
                teamName="Alpha"
                userName="Alice"
                score={500}
                buzzerState={ScoreboardEntryBuzzerState.Off}
                isControllingTeam={false}
                isWinningTeam={false}
            />
        );
        expect(container.querySelector(".teamName")!.textContent).toContain("Alpha");
        expect(container.querySelector(".buzzerIndicator")!.textContent).toContain("Alice");
        expect(container.querySelector(".score")!.textContent).toContain("500");
    });

    it('buzzer indicator has class "buzzerIndicator" by default (Off state)', () => {
        const { container } = render(
            <ScoreboardEntry
                teamName="Alpha"
                userName="Alice"
                score={0}
                buzzerState={ScoreboardEntryBuzzerState.Off}
                isControllingTeam={false}
                isWinningTeam={false}
            />
        );
        const buzzer = container.querySelector(".buzzerIndicator") as HTMLElement;
        expect(buzzer.className).toBe("buzzerIndicator");
    });

    it('buzzer indicator has class "buzzerIndicator buzzerActive" when buzzerState is Active', () => {
        const { container } = render(
            <ScoreboardEntry
                teamName="Alpha"
                userName="Alice"
                score={0}
                buzzerState={ScoreboardEntryBuzzerState.Active}
                isControllingTeam={false}
                isWinningTeam={false}
            />
        );
        const buzzer = container.querySelector(".buzzerIndicator") as HTMLElement;
        expect(buzzer.className).toBe("buzzerIndicator buzzerActive");
    });

    it('buzzer indicator has class "buzzerIndicator buzzedIn" when buzzerState is BuzzedIn', () => {
        const { container } = render(
            <ScoreboardEntry
                teamName="Alpha"
                userName="Alice"
                score={0}
                buzzerState={ScoreboardEntryBuzzerState.BuzzedIn}
                isControllingTeam={false}
                isWinningTeam={false}
            />
        );
        const buzzer = container.querySelector(".buzzerIndicator") as HTMLElement;
        expect(buzzer.className).toBe("buzzerIndicator buzzedIn");
    });

    it('buzzer indicator has class "buzzerIndicator wrongAnswer" when buzzerState is WrongAnswer', () => {
        const { container } = render(
            <ScoreboardEntry
                teamName="Alpha"
                userName="Alice"
                score={0}
                buzzerState={ScoreboardEntryBuzzerState.WrongAnswer}
                isControllingTeam={false}
                isWinningTeam={false}
            />
        );
        const buzzer = container.querySelector(".buzzerIndicator") as HTMLElement;
        expect(buzzer.className).toBe("buzzerIndicator wrongAnswer");
    });

    it('scoreboardEntry div gets "controllingTeam" class when buzzerState is Off and isControllingTeam is true', () => {
        const { container } = render(
            <ScoreboardEntry
                teamName="Alpha"
                userName="Alice"
                score={0}
                buzzerState={ScoreboardEntryBuzzerState.Off}
                isControllingTeam={true}
                isWinningTeam={false}
            />
        );
        const entry = container.querySelector(".scoreboardEntry") as HTMLElement;
        expect(entry.className).toContain("controllingTeam");
    });

    it('scoreboardEntry div gets "winningTeam" class when buzzerState is Off and isWinningTeam is true', () => {
        const { container } = render(
            <ScoreboardEntry
                teamName="Alpha"
                userName="Alice"
                score={0}
                buzzerState={ScoreboardEntryBuzzerState.Off}
                isControllingTeam={false}
                isWinningTeam={true}
            />
        );
        const entry = container.querySelector(".scoreboardEntry") as HTMLElement;
        expect(entry.className).toContain("winningTeam");
    });

    it("does not add extra classes when buzzerState is not Off even if isControllingTeam and isWinningTeam", () => {
        const { container } = render(
            <ScoreboardEntry
                teamName="Alpha"
                userName="Alice"
                score={0}
                buzzerState={ScoreboardEntryBuzzerState.Active}
                isControllingTeam={true}
                isWinningTeam={true}
            />
        );
        const entry = container.querySelector(".scoreboardEntry") as HTMLElement;
        expect(entry.className).not.toContain("controllingTeam");
        expect(entry.className).not.toContain("winningTeam");
    });
});
