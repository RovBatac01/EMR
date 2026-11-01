import { AppError } from '../utils/http.js';

function validationDetails(error) {
  const fieldErrors = {};
  const formErrors = [];
  for (const issue of error.issues || []) {
    const path = [...issue.path];
    if (['body', 'params', 'query'].includes(path[0])) path.shift();
    const key = path.length ? path.join('.') : null;
    if (!key) {
      formErrors.push(issue.message);
      continue;
    }
    if (!fieldErrors[key]) fieldErrors[key] = [];
    fieldErrors[key].push(issue.message);
  }
  return { fieldErrors, formErrors };
}

export const validate = (schema) => (req, _res, next) => {
  const result = schema.safeParse({
    body: req.body,
    params: req.params,
    query: req.query
  });

  if (!result.success) {
    return next(new AppError(422, 'Please correct the highlighted fields.', validationDetails(result.error)));
  }

  req.validated = result.data;
  return next();
};
