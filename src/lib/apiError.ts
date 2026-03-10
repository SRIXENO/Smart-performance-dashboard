export const getApiErrorMessage = (error: any, fallback = 'Request failed') => {
  const data = error?.response?.data;
  if (data?.error) return data.error;
  if (data?.message) return data.message;
  if (Array.isArray(data?.details) && data.details.length > 0) {
    const first = data.details[0];
    if (first?.msg) return first.msg;
    if (first?.param) return `Invalid ${first.param}`;
  }
  return error?.message || fallback;
};
