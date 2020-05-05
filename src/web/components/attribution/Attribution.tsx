import * as React from "react";

export class Attribution extends React.Component<any, any> {

    constructor(props: any) {
        super(props);
    }

    public render() {
        return (
            <div className="attribution">
                Jeffpardy was created to pass the time during COVID-19.
                Jeopardy! clues have been pulled from the public J-Archive site.
                <br />
                The Jeopardy! game show and all elements thereof, including but not limited to copyright and trademark thereto, are the property of Jeopardy Productions, Inc.
                and are protected under law. This website is not affiliated with, sponsored by, or operated by Jeopardy Productions, Inc.
            </div>
        );
    }
}
