import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import * as React from 'react';

// Mock createRoot to prevent module-level mount side effects
vi.mock('react-dom/client', async (importOriginal) => {
    const actual = await importOriginal<typeof import('react-dom/client')>();
    return {
        ...actual,
        createRoot: vi.fn(() => ({ render: vi.fn(), unmount: vi.fn() })),
    };
});

import { FinalJeffpardySubmissionList } from './FinalJeffpardySubmissionList';
import { TeamDictionary } from '../../../Types';
import { FinalJeffpardySubmissionDictionary } from '../Types';

vi.restoreAllMocks();

function makeTeams(): TeamDictionary {
    return {
        'Alpha': {
            name: 'Alpha',
            score: 200,
            players: [
                { name: 'Alice', team: 'Alpha', connectionId: 'c1' },
                { name: 'Anna', team: 'Alpha', connectionId: 'c3' },
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

describe('FinalJeffpardySubmissionList', () => {
    it('renders team names', () => {
        const { container } = render(
            <FinalJeffpardySubmissionList
                teams={makeTeams()}
                submissions={{}}
                waitingText="⏳"
                receivedText="✅"
            />
        );
        const teamNames = container.querySelectorAll('.fjTeamName');
        const names = Array.from(teamNames).map(el => el.textContent);
        expect(names).toContain('Alpha');
        expect(names).toContain('Beta');
    });

    it('renders player names', () => {
        const { container } = render(
            <FinalJeffpardySubmissionList
                teams={makeTeams()}
                submissions={{}}
                waitingText="⏳"
                receivedText="✅"
            />
        );
        const playerNames = container.querySelectorAll('.fjPlayerName');
        const names = Array.from(playerNames).map(el => el.textContent);
        expect(names).toContain('Alice');
        expect(names).toContain('Anna');
        expect(names).toContain('Bob');
    });

    it('shows waiting text when player has not submitted', () => {
        const { container } = render(
            <FinalJeffpardySubmissionList
                teams={makeTeams()}
                submissions={{}}
                waitingText="⏳"
                receivedText="✅"
            />
        );
        const statuses = container.querySelectorAll('.fjPlayerStatus');
        const texts = Array.from(statuses).map(el => el.textContent);
        expect(texts.every(t => t === '⏳')).toBe(true);
    });

    it('shows received text when player has submitted', () => {
        const submissions: FinalJeffpardySubmissionDictionary = {
            c1: true,
            c2: true,
            c3: true,
        };
        const { container } = render(
            <FinalJeffpardySubmissionList
                teams={makeTeams()}
                submissions={submissions}
                waitingText="⏳"
                receivedText="✅"
            />
        );
        const statuses = container.querySelectorAll('.fjPlayerStatus');
        const texts = Array.from(statuses).map(el => el.textContent);
        expect(texts.every(t => t === '✅')).toBe(true);
    });

    it('shows mixed status when some players submitted', () => {
        const submissions: FinalJeffpardySubmissionDictionary = { c1: true };
        const { container } = render(
            <FinalJeffpardySubmissionList
                teams={makeTeams()}
                submissions={submissions}
                waitingText="⏳"
                receivedText="✅"
            />
        );
        // Alice (c1) submitted, Anna (c3) and Bob (c2) have not
        const statuses = container.querySelectorAll('.fjPlayerStatus');
        const texts = Array.from(statuses).map(el => el.textContent);
        expect(texts.filter(t => t === '✅').length).toBe(1);
        expect(texts.filter(t => t === '⏳').length).toBe(2);
    });
});
