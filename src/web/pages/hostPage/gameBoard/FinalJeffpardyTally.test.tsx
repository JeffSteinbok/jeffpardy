import { describe, it, expect, vi } from 'vitest';
import { render, act } from '@testing-library/react';
import * as React from 'react';

// Mock createRoot to prevent module-level mount side effects
vi.mock('react-dom/client', async (importOriginal) => {
    const actual = await importOriginal<typeof import('react-dom/client')>();
    return {
        ...actual,
        createRoot: vi.fn(() => ({ render: vi.fn(), unmount: vi.fn() })),
    };
});

import { FinalJeffpardyTally } from './FinalJeffpardyTally';
import { TeamDictionary } from '../../../Types';
import { FinalJeffpardyWagerDictionary, FinalJeffpardyAnswerDictionary } from '../Types';

vi.restoreAllMocks();

function makeTeams(): TeamDictionary {
    return {
        'Alpha': {
            name: 'Alpha',
            score: 200,
            players: [
                { name: 'Alice', team: 'Alpha', connectionId: 'c1' },
            ],
        },
        'Beta': {
            name: 'Beta',
            score: 100,
            players: [
                { name: 'Bob', team: 'Beta', connectionId: 'c2' },
            ],
        },
    };
}

function makeWagers(): FinalJeffpardyWagerDictionary {
    return { c1: 50, c2: 80 };
}

function makeAnswers(): FinalJeffpardyAnswerDictionary {
    return {
        c1: { answer: 'Paris', responseTime: 5 },
        c2: { answer: 'London', responseTime: 3 },
    };
}

describe('FinalJeffpardyTally', () => {
    it('renders team names from props', () => {
        const { container } = render(
            <FinalJeffpardyTally
                teams={makeTeams()}
                wagers={makeWagers()}
                answers={makeAnswers()}
                onScoreChange={vi.fn()}
                onTallyCompleted={vi.fn()}
            />
        );
        const items = container.querySelectorAll('.finalJeffpardyTally li');
        const text = Array.from(items).map(li => li.textContent);
        expect(text.some(t => t.includes('Alpha'))).toBe(true);
        expect(text.some(t => t.includes('Beta'))).toBe(true);
    });

    it('renders teams as list items', () => {
        const { container } = render(
            <FinalJeffpardyTally
                teams={makeTeams()}
                wagers={makeWagers()}
                answers={makeAnswers()}
                onScoreChange={vi.fn()}
                onTallyCompleted={vi.fn()}
            />
        );
        const items = container.querySelectorAll('.finalJeffpardyTally > li');
        expect(items.length).toBe(2);
    });

    it('shows "Hit Space to Reveal Responses" hint initially', () => {
        const { container } = render(
            <FinalJeffpardyTally
                teams={makeTeams()}
                wagers={makeWagers()}
                answers={makeAnswers()}
                onScoreChange={vi.fn()}
                onTallyCompleted={vi.fn()}
            />
        );
        const hint = container.querySelector('.categoryRevealHint');
        expect(hint).toBeInTheDocument();
        expect(hint!.textContent).toBe('Hit Space to Reveal Responses');
    });

    it('shows ✓ and ✗ buttons after enough reveals for the current team', () => {
        const teams: TeamDictionary = {
            'Solo': {
                name: 'Solo',
                score: 100,
                players: [
                    { name: 'Sam', team: 'Solo', connectionId: 's1' },
                ],
            },
        };
        const wagers: FinalJeffpardyWagerDictionary = { s1: 50 };
        const answers: FinalJeffpardyAnswerDictionary = {
            s1: { answer: 'Answer', responseTime: 2 },
        };

        const { container } = render(
            <FinalJeffpardyTally
                teams={teams}
                wagers={wagers}
                answers={answers}
                onScoreChange={vi.fn()}
                onTallyCompleted={vi.fn()}
            />
        );

        // 1 player × 2 reveal steps needed; simulate by pressing space twice
        const space = () => new KeyboardEvent('keydown', { keyCode: 32 });
        act(() => { window.dispatchEvent(space()); });
        act(() => { window.dispatchEvent(space()); });

        const buttons = container.querySelectorAll('.tallyAction button');
        expect(buttons.length).toBe(2);
        expect(buttons[0].textContent).toBe('✓');
        expect(buttons[1].textContent).toBe('✗');
    });

    it('shows completed message when there are no teams', () => {
        const { container } = render(
            <FinalJeffpardyTally
                teams={{}}
                wagers={{}}
                answers={{}}
                onScoreChange={vi.fn()}
                onTallyCompleted={vi.fn()}
            />
        );
        const hint = container.querySelector('.categoryRevealHint');
        expect(hint).toBeInTheDocument();
        expect(hint!.textContent).toContain('Thank you for playing');
    });
});
