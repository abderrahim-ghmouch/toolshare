'use strict'



export function errorHandler(err, req, res, next) {
  const status = err.statusCode || 500
  if (status === 500) console.error(err)

  res.status(status).json({
    status: 'error',
    message: err.message || 'Internal server error'
  })
}
