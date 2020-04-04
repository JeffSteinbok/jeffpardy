export class Logger {
    public static debug(message?: any, ...optionalParams: any[]): void {
        if (optionalParams.length > 0) {
            console.log(message, optionalParams);
        } else {
            console.log(message);
        }
    }

    public static error(message?: any, ...optionalParams: any[]): void {
        if (optionalParams.length > 0) {
            console.error(message, optionalParams);
        } else {
            console.error(message);
        }
    }
}
