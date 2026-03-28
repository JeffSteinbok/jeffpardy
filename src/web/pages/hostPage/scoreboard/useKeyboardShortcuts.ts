// Copyright (c) Jeff Steinbok. All rights reserved.
// Licensed under the MIT License. See LICENSE in the project root for license information.

import { Key, SpecialKey } from "../../../utilities/Key";

export interface IKeyboardShortcutActions {
    onSpace: () => void;
    onActivateBuzzer: () => void;
    onCorrectResponse: () => void;
    onIncorrectResponse: () => void;
}

/** Creates a keyboard event handler that maps scoreboard shortcut keys (Space, A, Z, X) to their respective game actions. */
export function createKeyboardHandler(actions: IKeyboardShortcutActions): (event: KeyboardEvent) => void {
    return (event: KeyboardEvent) => {
        switch (event.key.toLowerCase()) {
            case SpecialKey.SPACE:
                actions.onSpace();
                break;
            case Key.A:
                actions.onActivateBuzzer();
                break;
            case Key.Z:
                actions.onCorrectResponse();
                break;
            case Key.X:
                actions.onIncorrectResponse();
                break;
        }
    };
}
