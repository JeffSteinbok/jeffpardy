import axios, { AxiosAdapter, AxiosResponse, AxiosError } from "axios";

/*
 * Interface for executing apis on the webserver
 */
export interface IApiExecutionContext {
    showProgressIndicator: boolean;
    apiName: string;
    formData: {};
    json: boolean;
    success: (any: any) => void;
    error: (statusText: string, responseText: string) => void;
}

/**
 * Class for calling APIs on the webserver
 */
export class WebServerApiManager {

    /**
     * Call an API on the webserver
     * @param {IApiExecutionContext} apiExecutionContext Parameters for executing the api against the webserver.
     */
    public executeApi(apiExecutionContext: IApiExecutionContext) {
        axios.get(apiExecutionContext.apiName).then(
            (response: AxiosResponse<any>) => {
                let result = response;

                if (apiExecutionContext.showProgressIndicator) {
                    //
                }
                if (apiExecutionContext.json == null || apiExecutionContext.json) {
                    apiExecutionContext.success(result.data);
                } else {
                    apiExecutionContext.success(result);
                }
            },
            (error: AxiosError) => {
                if (apiExecutionContext.showProgressIndicator) {
                    //
                }

                if (apiExecutionContext.error != null) {
                    apiExecutionContext.error(error.code, error.message);
                } else {
                    this.defaultErrorHandler(error.code, error.message);
                }
            }
        );

    }

    /**
     * Default error handler for when an PIA fails
     * @param statusText Status text from the server
     * @param responseText Response text from the server
     */
    public defaultErrorHandler(statusText: string, responseText: string) {
        let str = "An error has occurred calling a webserver API.";

        if (statusText) {
            str += "\r\nStatusText: " + statusText;
        }

        if (responseText) {
            str += "\r\nResponseText: " + responseText;
        }

        if (!statusText && !responseText) {
            str += "\r\nNo error information was returned." + responseText;
        }

        alert(str);
    }
}
