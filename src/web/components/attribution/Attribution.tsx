// Copyright (c) Jeff Steinbok. All rights reserved.
// Licensed under the MIT License. See LICENSE in the project root for license information.

import * as React from "react";

/** Displays game attribution text, including the COVID-19 origin story and Jeopardy Productions disclaimer. */
export class Attribution extends React.Component<{ showArchiveAttribution?: boolean }> {
    public render() {
        return (
            <div className="attribution">
                Jeffpardy was created to pass the time during COVID-19.
                {this.props.showArchiveAttribution && (
                    <> Jeopardy! clues have been pulled from the public J-Archive site.</>
                )}
                <br />
                The Jeopardy! game show and all elements thereof, including but not limited to copyright and trademark
                thereto, are the property of Jeopardy Productions, Inc. and are protected under law. This website is not
                affiliated with, sponsored by, or operated by Jeopardy Productions, Inc.
            </div>
        );
    }
}
