const debugMiddleware = (req, res, next) => {
    console.log('--- Debug Middleware ---');
    console.log('Session:', req.session);
    console.log('User in session:', req.session.user);
    console.log('req.user:', req.user);
    console.log('res.locals before:', res.locals);
    
    next();
    
    console.log('res.locals after:', res.locals);
    console.log('------------------------');
  };
  
  module.exports = debugMiddleware;