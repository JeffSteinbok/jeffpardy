import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import * as React from 'react';
import { Timer } from './Timer';

describe('Timer', () => {
    it('renders 100 child divs', () => {
        const { container } = render(<Timer percentageRemaining={1} />);
        const timerDiv = container.querySelector('.timer');
        expect(timerDiv).toBeInTheDocument();
        expect(timerDiv!.children).toHaveLength(100);
    });

    it('has all divs lit when percentageRemaining is 0', () => {
        const { container } = render(<Timer percentageRemaining={0} />);
        const litDivs = container.querySelectorAll('.timer > div.lit');
        expect(litDivs).toHaveLength(100);
    });

    it('has no divs lit when percentageRemaining is 1', () => {
        const { container } = render(<Timer percentageRemaining={1} />);
        const litDivs = container.querySelectorAll('.timer > div.lit');
        expect(litDivs).toHaveLength(0);
    });

    it('has 50 divs lit when percentageRemaining is 0.5', () => {
        const { container } = render(<Timer percentageRemaining={0.5} />);
        const litDivs = container.querySelectorAll('.timer > div.lit');
        expect(litDivs).toHaveLength(50);
    });

    it('has 75 divs lit when percentageRemaining is 0.25', () => {
        const { container } = render(<Timer percentageRemaining={0.25} />);
        const litDivs = container.querySelectorAll('.timer > div.lit');
        expect(litDivs).toHaveLength(75);
    });
});
