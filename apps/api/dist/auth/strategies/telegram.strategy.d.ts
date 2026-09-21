import { AuthService } from '../auth.service';
declare const TelegramStrategy_base: new (...args: any[]) => import("passport-custom");
export declare class TelegramStrategy extends TelegramStrategy_base {
    private authService;
    constructor(authService: AuthService);
    validate(req: any): Promise<any>;
}
export {};
