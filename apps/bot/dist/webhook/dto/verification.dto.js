"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerifyCodeDto = exports.CreateVerificationDto = void 0;
var class_validator_1 = require("class-validator");
var swagger_1 = require("@nestjs/swagger");
var CreateVerificationDto = /** @class */ (function () {
    function CreateVerificationDto() {
    }
    __decorate([
        (0, swagger_1.ApiProperty)({ description: 'Telegram user ID' }),
        (0, class_validator_1.IsString)(),
        __metadata("design:type", String)
    ], CreateVerificationDto.prototype, "telegramId", void 0);
    __decorate([
        (0, swagger_1.ApiProperty)({ description: 'Phone number with country code' }),
        (0, class_validator_1.IsString)(),
        __metadata("design:type", String)
    ], CreateVerificationDto.prototype, "phoneNumber", void 0);
    return CreateVerificationDto;
}());
exports.CreateVerificationDto = CreateVerificationDto;
var VerifyCodeDto = /** @class */ (function () {
    function VerifyCodeDto() {
    }
    __decorate([
        (0, swagger_1.ApiProperty)({ description: 'Telegram user ID' }),
        (0, class_validator_1.IsString)(),
        __metadata("design:type", String)
    ], VerifyCodeDto.prototype, "telegramId", void 0);
    __decorate([
        (0, swagger_1.ApiProperty)({ description: '6-digit verification code' }),
        (0, class_validator_1.IsString)(),
        __metadata("design:type", String)
    ], VerifyCodeDto.prototype, "code", void 0);
    return VerifyCodeDto;
}());
exports.VerifyCodeDto = VerifyCodeDto;
