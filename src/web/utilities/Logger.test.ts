import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { Logger } from './Logger';
import { Debug, DebugFlags } from './Debug';

describe('Logger', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('log', () => {
        it('calls console.log with a single message', () => {
            const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
            Logger.log('test message');
            expect(spy).toHaveBeenCalledWith('test message');
        });

        it('calls console.log with message and optional params as array', () => {
            const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
            Logger.log('arg1', 'arg2', 3);
            expect(spy).toHaveBeenCalledWith('arg1', ['arg2', 3]);
        });
    });

    describe('error', () => {
        it('calls console.error with a single message', () => {
            const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
            Logger.error('error message');
            expect(spy).toHaveBeenCalledWith('error message');
        });

        it('calls console.error with message and optional params as array', () => {
            const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
            Logger.error('err1', 'err2', 42);
            expect(spy).toHaveBeenCalledWith('err1', ['err2', 42]);
        });
    });

    describe('debug', () => {
        it('does not log when VerboseLogging flag is not set', () => {
            Debug.flags = DebugFlags.None;
            const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
            Logger.debug('test message');
            expect(spy).not.toHaveBeenCalled();
        });

        it('calls console.log when VerboseLogging flag is set', () => {
            Debug.flags = DebugFlags.VerboseLogging;
            const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
            Logger.debug('test message');
            expect(spy).toHaveBeenCalledWith('test message');
            Debug.flags = DebugFlags.None;
        });

        it('passes optional params as array when VerboseLogging is set', () => {
            Debug.flags = DebugFlags.VerboseLogging;
            const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
            Logger.debug('msg', 'extra1', 'extra2');
            expect(spy).toHaveBeenCalledWith('msg', ['extra1', 'extra2']);
            Debug.flags = DebugFlags.None;
        });
    });
});
