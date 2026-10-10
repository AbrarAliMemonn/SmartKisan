// // Central place that turns an Axios error into something a buyer or seller
// // can actually read. Raw Axios messages ("Request failed with status code
// // 500") must never reach the UI.

// const STATUS_MESSAGES = {
//   400: 'Some of the details you entered are not valid. Please check and try again.',
//   401: 'Please login to continue.',
//   403: "You don't have permission to perform this action.",
//   404: 'Not found.',
//   409: 'This action conflicts with something that already exists.',
//   422: 'Some of the details you entered are not valid. Please check and try again.',
//   429: 'Too many requests. Please wait a moment and try again.',
//   500: 'Something went wrong. Please try again.',
//   502: 'Something went wrong. Please try again.',
//   503: 'The service is temporarily unavailable. Please try again shortly.',
// }

// // Per-screen overrides so 404 / 409 can say something specific.
// // usage: getApiErrorMessage(err, { 404: 'Product not found.' })
// export const getApiErrorMessage = (error, overrides = {}) => {
//   const status = error?.response?.status

//   if (status && overrides[status]) return overrides[status]

//   // Prefer a real message from the backend when it sends one, but never a
//   // stack trace / generic Spring error body.
//   const serverMessage =
//     error?.response?.data?.message || error?.response?.data?.error

//   if (
//     serverMessage &&
//     typeof serverMessage === 'string' &&
//     serverMessage.length < 180 &&
//     !/^\s*(error|exception)/i.test(serverMessage)
//   ) {
//     return serverMessage
//   }

//   if (status && STATUS_MESSAGES[status]) return STATUS_MESSAGES[status]

//   if (error?.code === 'ERR_NETWORK') {
//     return 'Could not reach the server. Please check your connection.'
//   }

//   return 'Something went wrong. Please try again.'
// }

// export default getApiErrorMessage


// Central place that turns an Axios error into something a buyer or seller
// can actually read. Raw Axios messages ("Request failed with status code
// 500") must never reach the UI.

const STATUS_MESSAGES = {
  400: 'Some of the details you entered are not valid. Please check and try again.',
  401: 'Please login to continue.',
  403: "You don't have permission to perform this action.",
  404: 'Not found.',
  409: 'This action conflicts with something that already exists.',
  422: 'Some of the details you entered are not valid. Please check and try again.',
  429: 'Too many requests. Please wait a moment and try again.',
  500: 'Something went wrong. Please try again.',
  502: 'Something went wrong. Please try again.',
  503: 'The service is temporarily unavailable. Please try again shortly.',
}

// Per-screen overrides so 404 / 409 can say something specific.
// usage: getApiErrorMessage(err, { 404: 'Product not found.' })
export const getApiErrorMessage = (error, overrides = {}) => {
  const status = error?.response?.status

  if (status && overrides[status]) return overrides[status]

  // Prefer a real message from the backend when it sends one, but never a
  // stack trace / generic Spring error body.
  const serverMessage =
    error?.response?.data?.message || error?.response?.data?.error

  if (
    serverMessage &&
    typeof serverMessage === 'string' &&
    serverMessage.length < 180 &&
    !/^\s*(error|exception)/i.test(serverMessage)
  ) {
    return serverMessage
  }

  if (status && STATUS_MESSAGES[status]) return STATUS_MESSAGES[status]

  if (error?.code === 'ERR_NETWORK') {
    return 'Could not reach the server. Please check your connection.'
  }

  return 'Something went wrong. Please try again.'
}

export default getApiErrorMessage
