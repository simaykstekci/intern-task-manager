import { ZodError } from 'zod';
export const validateRequest = (schema) => {
    return async (req, res, next) => {
        try {
            req.body = await schema.parseAsync(req.body);
            next();
        }
        catch (error) {
            if (error instanceof ZodError) {
                const errorMessages = error.errors.map((issue) => ({
                    field: issue.path.join('.'),
                    message: issue.message,
                }));
                res.status(400).json({
                    error: 'Validation failed',
                    details: errorMessages,
                });
                return;
            }
            next(error);
        }
    };
};
