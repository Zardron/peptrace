"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrentAdminUser = void 0;
const common_1 = require("@nestjs/common");
exports.CurrentAdminUser = (0, common_1.createParamDecorator)((_data, context) => {
    const request = context.switchToHttp().getRequest();
    if (!request.user) {
        throw new common_1.UnauthorizedException("Missing authenticated user");
    }
    return request.user;
});
//# sourceMappingURL=current-admin-user.decorator.js.map