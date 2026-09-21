"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateContentDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_content_dto_1 = require("./create-content.dto");
class UpdateContentDto extends (0, swagger_1.PartialType)(create_content_dto_1.CreateContentDto) {
}
exports.UpdateContentDto = UpdateContentDto;
//# sourceMappingURL=update-content.dto.js.map