"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Link;
const jsx_runtime_1 = require("react/jsx-runtime");
const context_1 = require("../router/context");
function Link({ href, children, className }) {
    const router = (0, context_1.useRouter)();
    const handleClick = (e) => {
        e.preventDefault();
        router.push(href);
    };
    return ((0, jsx_runtime_1.jsx)("a", { href: href, onClick: handleClick, className: className, children: children }));
}
