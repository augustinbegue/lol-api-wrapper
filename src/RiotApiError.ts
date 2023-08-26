
export class RiotApiError extends Error {
    url: string;
    statusCode: number;
    statusText: string;

    constructor(url: string, statusCode: number, statusText: string) {
        super(`[lol-api-wrapper] ${url}: ${statusCode} ${statusText}`);
        this.url = url;
        this.statusCode = statusCode;
        this.statusText = statusText;
    }
}
