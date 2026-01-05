"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Image;
const jsx_runtime_1 = require("react/jsx-runtime");
function Image({ src, alt, width, height, className, priority, ...props }) {
    return ((0, jsx_runtime_1.jsx)("img", { src: src, alt: alt, width: width, height: height, className: className, loading: priority ? "eager" : "lazy", ...props }));
}
