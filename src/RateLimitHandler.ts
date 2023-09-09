import { RiotPlatform, RiotRegion } from ".";

export interface RateLimit {
    rateLimitEnd: number;
    rateLimit: number;
    rateLimitCount: number;
}

export class RateLimitHandler {
    private rateLimitResets: Map<string, RateLimit>;

    private logLevel: "none" | "error" | "info" = "none";
    private logErrors: boolean = true;
    private logInfo: boolean = true;
    private logFunction: (message: string) => void;
    private errorLogFunction: (message: string) => void;

    private setRateLimit: (
        rateLimitMethod: string,
        rateLimitEnd: number,
        rateLimit: number,
        rateLimitCount: number,
    ) => Promise<void> = async (
        rateLimitMethod,
        rateLimitEnd,
        rateLimit,
        rateLimitCount,
    ) => {
        this.rateLimitResets.set(rateLimitMethod, {
            rateLimitEnd,
            rateLimit,
            rateLimitCount,
        });
    };
    private getRateLimit: (
        rateLimitMethod: string,
    ) => Promise<RateLimit | null> = async (rateLimitMethod) => {
        return this.rateLimitResets.get(rateLimitMethod) ?? null;
    };
    private getRateLimitTypes: () => Promise<string[]> = async () => {
        return Array.from(this.rateLimitResets.keys());
    };

    constructor(options: {
        logLevel: "none" | "error" | "info";
        logFunction: (message: string) => void;
        errorLogFunction: (message: string) => void;

        storeRateLimitsFunction?: (
            rateLimitMethod: string,
            rateLimitEnd: number,
            rateLimit: number,
            rateLimitCount: number,
        ) => Promise<void>;
        getRateLimitsFunction?: (
            rateLimitMethod: string,
        ) => Promise<RateLimit | null>;
        getRateLimitTypesFunction?: () => Promise<string[]>;
    }) {
        this.logLevel = options.logLevel;
        this.logErrors =
            options.logLevel === "error" || options.logLevel === "info";
        this.logInfo = options.logLevel === "info";
        this.logFunction = options.logFunction ?? console.log;
        this.errorLogFunction = options.errorLogFunction ?? console.error;

        if (
            options.getRateLimitsFunction === undefined &&
            options.storeRateLimitsFunction === undefined &&
            options.getRateLimitTypesFunction === undefined
        ) {
            this.rateLimitResets = new Map();
        } else if (
            options.getRateLimitsFunction !== undefined &&
            options.storeRateLimitsFunction !== undefined &&
            options.getRateLimitTypesFunction !== undefined
        ) {
            this.setRateLimit = options.storeRateLimitsFunction;
            this.getRateLimit = options.getRateLimitsFunction;
            this.getRateLimitTypes = options.getRateLimitTypesFunction;
        } else {
            throw new Error(
                "[lol-api-wrapper] getRateLimitsFunction, storeRateLimitsFunction and getRateLimitTypesFunction must be provided.",
            );
        }
    }

    private getRateLimitMethod(
        prefix: RiotPlatform | RiotRegion,
        path: string,
    ): string {
        let split = path.split("/");

        if (split[0] === "") {
            split.shift();
        }

        if (split[0] === "lol") {
            split.shift();
        }

        let method = `${prefix.toLowerCase()}:${split[0]}`;

        if (split[2] !== undefined) {
            method += `:${split[2]}`;
        }

        if (split.length > 4) {
            method += `:${split[3]}`;
        }

        return method;
    }

    public async handleRateLimitHeaders(
        prefix: RiotPlatform | RiotRegion,
        path: string,
        headers: Headers,
    ): Promise<boolean> {
        const rateLimitMethod = this.getRateLimitMethod(prefix, path);

        const retryAfter = headers.get("retry-after");

        if (retryAfter !== null) {
            const seconds = parseInt(retryAfter);

            if (this.logErrors) {
                this.errorLogFunction(
                    `[lol-api-wrapper] [${rateLimitMethod}] Rate limit exceeded. Retrying in ${seconds}s`,
                );
            }

            await new Promise((resolve) => setTimeout(resolve, seconds * 1000));

            return true;
        }

        const appRateLimit = headers.get("x-app-rate-limit");
        const appRateLimitCount = headers.get("x-app-rate-limit-count");

        if (appRateLimit !== null && appRateLimitCount !== null) {
            const appLimits = appRateLimit.split(",");
            const appLimitsCount = appRateLimitCount.split(",");

            for (let i = 0; i < appLimits.length; i++) {
                const appLimit = appLimits[i];
                const appLimitCount = appLimitsCount[i];

                const [limit, rateLimitPeriod] = appLimit.split(":");
                const [count, _] = appLimitCount.split(":");

                const rateLimitEnd =
                    Date.now() + parseInt(rateLimitPeriod) * 1000;
                await this.setRateLimit(
                    `app:${rateLimitPeriod}`,
                    rateLimitEnd,
                    parseInt(limit),
                    parseInt(count),
                );

                const seconds = Math.ceil((rateLimitEnd - Date.now()) / 1000);

                if (parseInt(count) >= parseInt(limit)) {
                    if (this.logErrors) {
                        this.errorLogFunction(
                            `[lol-api-wrapper] [app:${rateLimitPeriod}] Rate limit exceeded. Retrying in ${seconds}s`,
                        );
                    }

                    await new Promise((resolve) =>
                        setTimeout(resolve, rateLimitEnd - Date.now()),
                    );

                    return true;
                } else {
                    if (this.logInfo) {
                        this.logFunction(
                            `[lol-api-wrapper] [app:${rateLimitPeriod}] Rate limit: ${count}/${limit}. Reset in ${seconds}s`,
                        );
                    }
                }
            }
        }

        const methodRateLimit = headers.get("x-method-rate-limit");
        const methodRateLimitCount = headers.get("x-method-rate-limit-count");

        if (methodRateLimit !== null && methodRateLimitCount !== null) {
            const [limit, seconds] = methodRateLimit.split(":");
            const [count, _] = methodRateLimitCount.split(":");

            const rateLimitEnd = Date.now() + parseInt(seconds) * 1000;
            await this.setRateLimit(
                rateLimitMethod,
                rateLimitEnd,
                parseInt(limit),
                parseInt(count),
            );

            const secondsPassed = Math.ceil((rateLimitEnd - Date.now()) / 1000);

            if (parseInt(count) >= parseInt(limit)) {
                if (this.logErrors) {
                    this.errorLogFunction(
                        `[lol-api-wrapper] [${rateLimitMethod}] Rate limit exceeded. Retrying in ${secondsPassed}s`,
                    );
                }

                await new Promise((resolve) =>
                    setTimeout(resolve, rateLimitEnd - Date.now()),
                );

                return true;
            } else {
                if (this.logInfo) {
                    this.logFunction(
                        `[lol-api-wrapper] [${rateLimitMethod}] Rate limit: ${count}/${limit} in ${secondsPassed}s`,
                    );
                }
            }
        }

        return false;
    }

    public async checkForRateLimit(
        prefix: RiotPlatform | RiotRegion,
        path: string,
    ): Promise<string | undefined> {
        const rateLimits = await this.getRateLimitTypes();

        for (const rateLimit of rateLimits) {
            if (!rateLimit.startsWith("app:")) {
                continue;
            }

            const rt = await this.getRateLimit(rateLimit);

            if (!rt || rt?.rateLimitEnd === null) {
                continue;
            }

            if (rt?.rateLimit <= rt?.rateLimitCount + 1) {
                if (this.logErrors) {
                    this.errorLogFunction(
                        `[lol-api-wrapper] [${rateLimit}] Rate limit exceeded. ${
                            rt.rateLimitEnd - Date.now()
                        }ms remaining.`,
                    );
                }

                return rateLimit;
            }
        }

        const rateLimitMethod = this.getRateLimitMethod(prefix, path);

        const rt = await this.getRateLimit(rateLimitMethod);

        if (!rt || rt?.rateLimitEnd === null) {
            return;
        }

        if (rt?.rateLimit <= rt?.rateLimitCount + 1) {
            if (this.logErrors) {
                this.errorLogFunction(
                    `[lol-api-wrapper] [${rateLimitMethod}] Rate limit exceeded.`,
                );
            }

            return rateLimitMethod;
        }
    }

    public async waitForRateLimitReset(rateLimitMethod: string): Promise<void> {
        const rt = await this.getRateLimit(rateLimitMethod);

        if (!rt || rt.rateLimitEnd === null) {
            return;
        }

        const seconds = Math.ceil((rt.rateLimitEnd - Date.now()) / 1000);

        if (this.logInfo) {
            this.logFunction(
                `[lol-api-wrapper] [${rateLimitMethod}] Waiting for rate limit reset in ${seconds}s`,
            );
        }

        await new Promise((resolve) =>
            setTimeout(resolve, rt.rateLimitEnd - Date.now()),
        );
    }
}
