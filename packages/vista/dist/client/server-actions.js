/**
 * Vista Server Actions — Client Runtime
 *
 * Provides the `callServer` callback that react-server-dom-webpack
 * uses when a client component invokes a server action.  The function
 * POSTs to the RSC upstream endpoint, passing the action ID in an
 * `rsc-action` header and the encoded args as the body, then decodes
 * the Flight response.
 *
 * Also re-exports React 19 hooks for working with actions:
 *   - useActionState  (React 19 — replaces React DOM's useFormState)
 *   - useFormStatus   (React DOM)
 */
'use client';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useFormStatus = exports.useActionState = void 0;
exports.callServer = callServer;
const client_1 = require("react-server-dom-webpack/client");
/**
 * Called by the Flight client whenever a server reference is invoked
 * from the browser (e.g. a Server Action bound to a <form action>
 * or called directly).
 *
 * @param id      The server reference ID, e.g. "file:///path/to/mod.ts#myAction"
 * @param args    The arguments passed to the action
 * @returns       A Promise that resolves with the action's return value
 */
async function callServer(id, args) {
    const body = await (0, client_1.encodeReply)(args);
    const response = (0, client_1.createFromFetch)(fetch('/rsc' + window.location.pathname, {
        method: 'POST',
        headers: {
            Accept: 'text/x-component',
            'rsc-action': id,
            ...(typeof body === 'string' ? { 'Content-Type': 'text/plain' } : {}),
        },
        body,
    }), { callServer });
    return response;
}
// ---------------------------------------------------------------------------
// React 19 action hooks — re-exported for convenience
// ---------------------------------------------------------------------------
// React 19 provides useActionState on the React module itself.
// useFormStatus lives in react-dom.
var react_1 = require("react");
Object.defineProperty(exports, "useActionState", { enumerable: true, get: function () { return react_1.useActionState; } });
var react_dom_1 = require("react-dom");
Object.defineProperty(exports, "useFormStatus", { enumerable: true, get: function () { return react_dom_1.useFormStatus; } });
