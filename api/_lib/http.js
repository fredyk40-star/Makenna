export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

export const json = (res, status, body) => res.status(status).json(body);

/** One generous cap for every API route; individual routes validate fields too. */
export const MAX_BODY_BYTES = 2 * 1024 * 1024;

export const readBody = (req) => {
  const declared = Number(req?.headers?.['content-length']);
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) {
    throw new HttpError(413, 'The request is too large. Please try again with less data.');
  }
  const body = req?.body && typeof req.body === 'object' ? req.body : {};
  try {
    if (Buffer.byteLength(JSON.stringify(body), 'utf8') > MAX_BODY_BYTES) {
      throw new HttpError(413, 'The request is too large. Please try again with less data.');
    }
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(400, 'The request body could not be read.');
  }
  return body;
};

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
