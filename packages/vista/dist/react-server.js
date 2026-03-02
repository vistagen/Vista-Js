"use strict";
/**
 * React Server Components entrypoint.
 *
 * Keep this surface intentionally small and server-safe so apps can import
 * `vista` under the `react-server` condition without pulling client-only APIs.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateMetadataHead = exports.Head = exports.Client = void 0;
var client_1 = require("./components/client");
Object.defineProperty(exports, "Client", { enumerable: true, get: function () { return client_1.Client; } });
var head_react_server_1 = require("./client/head.react-server");
Object.defineProperty(exports, "Head", { enumerable: true, get: function () { return __importDefault(head_react_server_1).default; } });
Object.defineProperty(exports, "generateMetadataHead", { enumerable: true, get: function () { return head_react_server_1.generateMetadataHead; } });
