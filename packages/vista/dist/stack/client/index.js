"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VistaClientError = exports.createVistaClient = void 0;
/**
 * Package entry for `@vistagenic/vista/stack/client`.
 *
 * Example:
 *   import { createVistaClient } from '@vistagenic/vista/stack/client'
 */
var create_client_1 = require("./create-client");
Object.defineProperty(exports, "createVistaClient", { enumerable: true, get: function () { return create_client_1.createVistaClient; } });
var error_1 = require("./error");
Object.defineProperty(exports, "VistaClientError", { enumerable: true, get: function () { return error_1.VistaClientError; } });
