export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

export const json = (res, status, body) => res.status(status).json(body);

export const readBody = (req) => (
  req?.body && typeof req.body === 'object' ? req.body : {}
);

export const withErrors = (handler) => async (req, res) => {
  try {
    return await handler(req, res);
  } catch (error) {
    const status = Number.isInteger(error?.status) ? error.status : 500;
    if (status >= 500) console.error('API error:', error?.message || error);
    return json(res, status, {
      success: false,
      error: status >= 500 ? 'The server could not complete this request. Please try again.' : error.message,
    });
  }
};

export const requirePost = (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    throw new HttpError(405, 'Method not allowed');
  }
};
