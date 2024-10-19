function errorHandler(err, req, res, next) {
    
  console.log(err.message)
  
    let statusCode = err.status || 500;
    let errorMessage = err.message || "An unexpected error occurred.";
  
    switch (statusCode) {
      case 400:
        errorMessage = "Bad Request: The server cannot process the request due to a client error.";
        break;
      case 401:
        errorMessage = "Unauthorized: Authentication is required and has failed or has not been provided.";
        break;
      case 403:
        errorMessage = "Forbidden: You don't have permission to access this resource.";
        break;
      case 404:
        errorMessage = "Not Found: The requested resource could not be found.";
        break;
      case 405:
        errorMessage = "Method Not Allowed: The request method is not supported for the requested resource.";
        break;
      case 408:
        errorMessage = "Request Timeout: The server timed out waiting for the request.";
        break;
      case 409:
        errorMessage = "Conflict: The request could not be completed due to a conflict with the current state of the resource.";
        break;
      case 410:
        errorMessage = "Gone: The requested resource is no longer available and will not be available again.";
        break;
      case 422:
        errorMessage = "Unprocessable Entity: The request was well-formed but was unable to be followed due to semantic errors.";
        break;
      case 429:
        errorMessage = "Too Many Requests: You have sent too many requests in a given amount of time.";
        break;
      case 500:
        errorMessage = "Internal Server Error: The server encountered an unexpected condition that prevented it from fulfilling the request.";
        break;
      case 501:
        errorMessage = "Not Implemented: The server does not support the functionality required to fulfill the request.";
        break;
      case 502:
        errorMessage = "Bad Gateway: The server received an invalid response from the upstream server.";
        break;
      case 503:
        errorMessage = "Service Unavailable: The server is currently unable to handle the request due to temporary overloading or maintenance of the server.";
        break;
      case 504:
        errorMessage = "Gateway Timeout: The server did not receive a timely response from the upstream server.";
        break;
    }
  
    
    if (err.name === 'ValidationError') {
      statusCode = 400;
      errorMessage = "Validation Error: " + (err.message || "Please check your input.");
    }
  
    
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.status(statusCode).json({ 
        success: false, 
        status: statusCode,
        message: errorMessage 
      });
    }
  
    
    res.status(statusCode).render("page-404", { 
      statusCode: statusCode, 
      errorMessage: errorMessage 
    });
  }
  
  module.exports = errorHandler;