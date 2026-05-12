export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Prisma validation errors
  if (err.name === 'PrismaClientValidationError') {
    return res.status(400).json({
      error: 'Invalid request data',
      statusCode: 400
    });
  }

  // Prisma unique constraint violation
  if (err.code === 'P2002') {
    const field = err.meta?.target?.[0] || 'field';
    return res.status(400).json({
      error: `${field} already exists`,
      statusCode: 400
    });
  }

  // Prisma not found
  if (err.code === 'P2025') {
    return res.status(404).json({
      error: 'Resource not found',
      statusCode: 404
    });
  }

  // Custom validation errors
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      error: err.message,
      statusCode: err.statusCode
    });
  }

  // Default error
  res.status(500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
    statusCode: 500
  });
};

export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}
