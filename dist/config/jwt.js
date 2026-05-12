"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signAccessToken = signAccessToken;
exports.signRefreshToken = signRefreshToken;
exports.verifyAccessToken = verifyAccessToken;
exports.verifyRefreshToken = verifyRefreshToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("./env");
function signAccessToken(userId, extra) {
    return jsonwebtoken_1.default.sign({
        sub: userId,
        role: extra?.role ?? 'owner',
        tipo_conta: extra?.tipo_conta ?? 'corretor',
        organization_id: extra?.organization_id ?? null,
    }, env_1.env.JWT_SECRET, {
        expiresIn: '15m',
    });
}
function signRefreshToken(userId) {
    return jsonwebtoken_1.default.sign({ sub: userId }, env_1.env.REFRESH_SECRET, {
        expiresIn: '7d',
    });
}
function verifyAccessToken(token) {
    try {
        return jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
    }
    catch {
        return null;
    }
}
function verifyRefreshToken(token) {
    try {
        return jsonwebtoken_1.default.verify(token, env_1.env.REFRESH_SECRET);
    }
    catch {
        return null;
    }
}
//# sourceMappingURL=jwt.js.map