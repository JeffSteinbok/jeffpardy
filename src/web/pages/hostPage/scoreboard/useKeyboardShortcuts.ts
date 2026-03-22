import { Key, SpecialKey } from "../../../utilities/Key";

export interface IKeyboardShortcutActions {
    onSpace: () => void;
    onActivateBuzzer: () => void;
    onCorrectResponse: () => void;
    onIncorrectResponse: () => void;
}

export function createKeyboardHandler(actions: IKeyboardShortcutActions): (event: KeyboardEvent) => void {
    return (event: KeyboardEvent) => {
        switch (event.keyCode) {
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
