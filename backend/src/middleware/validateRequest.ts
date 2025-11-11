import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import logger from '../config/logger';

/**
 * Middleware para validar request body usando schemas Zod
 *
 * @param schema - Schema Zod para validar o body
 * @returns Express middleware function
 *
 * @example
 * router.post('/campaigns',
 *   authenticate,
 *   validateRequest(createCampaignSchema),
 *   campaignController.createCampaign
 * );
 */
export const validateRequest = (schema: z.ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Valida e substitui req.body com dados validados e transformados
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.warn('Validation error:', {
          path: req.path,
          method: req.method,
          errors: error.issues,
        });

        return res.status(400).json({
          success: false,
          error: 'Validation error',
          message: 'Os dados enviados são inválidos',
          details: error.issues.map((err: z.ZodIssue) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }

      // Outros erros são passados para o error handler
      next(error);
    }
  };
};

/**
 * Middleware para validar query params usando schemas Zod
 *
 * @param schema - Schema Zod para validar os query params
 * @returns Express middleware function
 *
 * @example
 * router.get('/campaigns',
 *   validateQuery(campaignFiltersSchema),
 *   campaignController.listCampaigns
 * );
 */
export const validateQuery = (schema: z.ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Valida e substitui req.query com dados validados
      const validated = await schema.parseAsync(req.query);
      req.query = validated as any;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.warn('Query validation error:', {
          path: req.path,
          method: req.method,
          errors: error.issues,
        });

        return res.status(400).json({
          success: false,
          error: 'Validation error',
          message: 'Os parâmetros de consulta são inválidos',
          details: error.issues.map((err: z.ZodIssue) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }

      next(error);
    }
  };
};

/**
 * Middleware para validar params (route parameters) usando schemas Zod
 *
 * @param schema - Schema Zod para validar os params
 * @returns Express middleware function
 *
 * @example
 * router.get('/campaigns/:id',
 *   validateParams(z.object({ id: z.string().regex(/^[a-f\d]{24}$/i) })),
 *   campaignController.getCampaign
 * );
 */
export const validateParams = (schema: z.ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Valida e substitui req.params com dados validados
      const validated = await schema.parseAsync(req.params);
      req.params = validated as any;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.warn('Params validation error:', {
          path: req.path,
          method: req.method,
          errors: error.issues,
        });

        return res.status(400).json({
          success: false,
          error: 'Validation error',
          message: 'Os parâmetros da rota são inválidos',
          details: error.issues.map((err: z.ZodIssue) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }

      next(error);
    }
  };
};
