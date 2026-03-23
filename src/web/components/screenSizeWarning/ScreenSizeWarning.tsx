import * as React from "react";

export interface IScreenSizeWarningProps {
    minWidth: number;
    minHeight?: number;
}

interface IScreenSizeWarningState {
    isVisible: boolean;
    isDismissed: boolean;
}

/**
 * Displays a warning banner when the browser viewport is too small
 * for the page content, suggesting that the user zoom out or resize
 * their browser window.
 */
export class ScreenSizeWarning extends React.Component<IScreenSizeWarningProps, IScreenSizeWarningState> {
    constructor(props: IScreenSizeWarningProps) {
        super(props);
        this.state = {
            isVisible: false,
            isDismissed: false,
        };
    }

    componentDidMount() {
        this.checkViewportSize();
        window.addEventListener("resize", this.checkViewportSize);
    }

    componentWillUnmount() {
        window.removeEventListener("resize", this.checkViewportSize);
    }

    checkViewportSize = () => {
        const isTooSmall =
            window.innerWidth < this.props.minWidth ||
            (this.props.minHeight != null && window.innerHeight < this.props.minHeight);

        if (!isTooSmall && this.state.isDismissed) {
            this.setState({ isVisible: false, isDismissed: false });
        } else {
            this.setState({ isVisible: isTooSmall });
        }
    };

    dismiss = () => {
        this.setState({ isDismissed: true });
    };

    public render() {
        if (!this.state.isVisible || this.state.isDismissed) {
            return null;
        }

        const isMac =
            (
                (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform ||
                navigator.platform ||
                ""
            )
                .toUpperCase()
                .indexOf("MAC") >= 0;
        const zoomOutShortcut = isMac ? "⌘−" : "Ctrl+−";

        return (
            <div className="screenSizeWarning" role="alert">
                <span className="screenSizeWarningMessage">
                    Your browser window is too small to display this page properly. Try zooming out ({zoomOutShortcut})
                    or resizing your browser window.
                </span>
                <button className="screenSizeWarningDismiss" onClick={this.dismiss} aria-label="Dismiss warning">
                    ✕
                </button>
            </div>
        );
    }
}
