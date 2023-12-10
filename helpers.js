export const missingInput = (
    res,
    statusCode,
    page,
    title,
    eMsg
  ) => {
  return res.status(statusCode).render(page,
      {
        title: title,
        hasErrors: true,
        error: eMsg
      });
};