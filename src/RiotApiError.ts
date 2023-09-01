export class RiotApiError extends Error {
    url: string;
    response: Response;

    constructor(url: string, response: Response) {
        super(`[lol-api-wrapper] ${url}: ${response.status}`);
        this.url = url;
        this.response = response;
    }
}
