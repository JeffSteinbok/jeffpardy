// Copyright (c) Jeff Steinbok. All rights reserved.
// Licensed under the MIT License. See LICENSE in the project root for license information.

import { describe, it, expect, vi, afterEach } from "vitest";
import axios from "axios";
import { WebServerApiManager, IApiExecutionContext } from "./WebServerApiManager";

vi.mock("axios");

describe("WebServerApiManager", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe("executeApi", () => {
        it("calls axios.get with the apiName", async () => {
            vi.mocked(axios.get).mockResolvedValue({ data: "ok" });

            const ctx: IApiExecutionContext = {
                apiName: "/api/test",
                json: true,
                success: vi.fn(),
                error: vi.fn(),
            };

            const manager = new WebServerApiManager();
            manager.executeApi(ctx);

            expect(axios.get).toHaveBeenCalledWith("/api/test");
        });

        it("calls success with response.data when json is true", async () => {
            vi.mocked(axios.get).mockResolvedValue({ data: { foo: "bar" } });

            const success = vi.fn();
            const ctx: IApiExecutionContext = {
                apiName: "/api/data",
                json: true,
                success,
                error: vi.fn(),
            };

            const manager = new WebServerApiManager();
            manager.executeApi(ctx);

            await vi.waitFor(() => {
                expect(success).toHaveBeenCalledWith({ foo: "bar" });
            });
        });

        it("calls success with response.data when json is null", async () => {
            vi.mocked(axios.get).mockResolvedValue({ data: "raw" });

            const success = vi.fn();
            const ctx: IApiExecutionContext = {
                apiName: "/api/data",
                json: null,
                success,
                error: vi.fn(),
            } as unknown as IApiExecutionContext;

            const manager = new WebServerApiManager();
            manager.executeApi(ctx);

            await vi.waitFor(() => {
                expect(success).toHaveBeenCalledWith("raw");
            });
        });

        it("calls success with the full response when json is false", async () => {
            const fullResponse = { data: "payload", status: 200 };
            vi.mocked(axios.get).mockResolvedValue(fullResponse);

            const success = vi.fn();
            const ctx: IApiExecutionContext = {
                apiName: "/api/full",
                json: false,
                success,
                error: vi.fn(),
            };

            const manager = new WebServerApiManager();
            manager.executeApi(ctx);

            await vi.waitFor(() => {
                expect(success).toHaveBeenCalledWith(fullResponse);
            });
        });

        it("calls the error callback on failure", async () => {
            vi.mocked(axios.get).mockRejectedValue({ code: "ERR_NETWORK", message: "Network Error" });

            const error = vi.fn();
            const ctx: IApiExecutionContext = {
                apiName: "/api/fail",
                json: true,
                success: vi.fn(),
                error,
            };

            const manager = new WebServerApiManager();
            manager.executeApi(ctx);

            await vi.waitFor(() => {
                expect(error).toHaveBeenCalledWith("ERR_NETWORK", "Network Error");
            });
        });

        it("calls defaultErrorHandler when no error callback is provided", async () => {
            vi.mocked(axios.get).mockRejectedValue({ code: "500", message: "Server Error" });

            const ctx: IApiExecutionContext = {
                apiName: "/api/fail",
                json: true,
                success: vi.fn(),
                error: null,
            } as unknown as IApiExecutionContext;

            const manager = new WebServerApiManager();
            const spy = vi.spyOn(manager, "defaultErrorHandler").mockImplementation(() => {});
            manager.executeApi(ctx);

            await vi.waitFor(() => {
                expect(spy).toHaveBeenCalledWith("500", "Server Error");
            });
        });
    });

    describe("executePostApi", () => {
        it("calls axios.post with apiName and postBody", async () => {
            vi.mocked(axios.post).mockResolvedValue({ data: "created" });

            const ctx: IApiExecutionContext = {
                apiName: "/api/create",
                json: true,
                success: vi.fn(),
                error: vi.fn(),
            };

            const manager = new WebServerApiManager();
            manager.executePostApi(ctx, '{"key":"value"}');

            expect(axios.post).toHaveBeenCalledWith("/api/create", '{"key":"value"}');
        });

        it("calls success with response.data on post success", async () => {
            vi.mocked(axios.post).mockResolvedValue({ data: { id: 1 } });

            const success = vi.fn();
            const ctx: IApiExecutionContext = {
                apiName: "/api/create",
                json: true,
                success,
                error: vi.fn(),
            };

            const manager = new WebServerApiManager();
            manager.executePostApi(ctx, "body");

            await vi.waitFor(() => {
                expect(success).toHaveBeenCalledWith({ id: 1 });
            });
        });
    });

    describe("defaultErrorHandler", () => {
        it("calls alert with status and response text", () => {
            const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

            const manager = new WebServerApiManager();
            manager.defaultErrorHandler("404", "Not Found");

            expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining("StatusText: 404"));
            expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining("ResponseText: Not Found"));
        });

        it("calls alert with no-info message when both params are empty", () => {
            const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

            const manager = new WebServerApiManager();
            manager.defaultErrorHandler("", "");

            expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining("No error information was returned."));
        });
    });
});
