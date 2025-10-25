const { isLoggedIn } = require('../middleware');
const httpMocks = require('node-mocks-http');

describe('isLoggedIn middleware', () => {
  it('calls next() if user is authenticated', () => {
    const req = httpMocks.createRequest();
    req.isAuthenticated = () => true;
    req.session = {}; // mock session object
    req.flash = jest.fn(); // mock flash function
    const res = httpMocks.createResponse();
    const next = jest.fn();

    isLoggedIn(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('redirects to login if user is not authenticated', () => {
    const req = httpMocks.createRequest({
      originalUrl: '/some-protected-route',
    });
    req.isAuthenticated = () => false;
    req.session = {}; // mock session object
    req.flash = jest.fn(); // mock flash function
    const res = httpMocks.createResponse();
    res.redirect = jest.fn();
    const next = jest.fn();

    isLoggedIn(req, res, next);

    expect(req.session.returnTo).toBe('/some-protected-route');
    expect(req.flash).toHaveBeenCalledWith(
      'error',
      'You must be signed in first!'
    );
    expect(res.redirect).toHaveBeenCalledWith('/outdoorsy/login');
    expect(next).not.toHaveBeenCalled();
  });

  it('sets returnTo in session when not authenticated', () => {
    const req = httpMocks.createRequest({ originalUrl: '/protected' });
    req.isAuthenticated = () => false;
    req.session = {}; // mock session object
    req.flash = jest.fn(); // mock flash function
    const res = httpMocks.createResponse();
    res.redirect = jest.fn();
    const next = jest.fn();

    isLoggedIn(req, res, next);

    expect(req.session.returnTo).toBe('/protected');
  });
});
