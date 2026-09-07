import { NextFunction, Request, Response } from "express";
import { ZodTypeAny } from "zod";
import { AppError } from "@/utils/AppError";

type RequestPart = "body" | "query" | "params";

// Valida e SUBSTITUI req[part] pelo dado ja parseado/coagido pelo Zod
// (datas convertidas, numeros coagidos, campos desconhecidos removidos).
export function validate(schema: ZodTypeAny, part: RequestPart = "body") {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[part]);
    if (!result.success) {
      return next(AppError.validation("Dados invalidos", result.error.flatten()));
    }
    (req as unknown as Record<RequestPart, unknown>)[part] = result.data;
    next();
  };
}
