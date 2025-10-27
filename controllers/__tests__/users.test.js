// __tests__/controllers/users.test.js

const User = require('../../models/user');
const usersController = require('../../controllers/users');
const expressValidator = require('express-validator');
jest.mock('csurf', () => () => (req, res, next) => next());
jest.mock('../../models/user');

jest.mock('express-validator', () => {
  const originalModule = jest.requireActual('express-validator');
  return {
    ...originalModule,
    validationResult: jest.fn(),
  };
});

describe('Users Controller', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      body: {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password1',
      },
      login: jest.fn((user, cb) => cb()),
      flash: jest.fn(),
      csrfToken: jest.fn(() => 'test-csrf-token'),
      session: {},
    };

    res = {
      render: jest.fn(),
      redirect: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    next = jest.fn();
  });

  describe('renderRegister', () => {
    it('renders the register page with csrf token', () => {
      usersController.renderRegister(req, res);
      expect(res.render).toHaveBeenCalledWith('users/register', {
        errors: [],
        formData: {},
        csrfToken: 'test-csrf-token',
      });
    });
  });

  describe('registerHandler', () => {
    beforeEach(() => {
      expressValidator.validationResult.mockClear();
    });

    it('registers a new user and logs them in', async () => {
      expressValidator.validationResult.mockReturnValue({
        isEmpty: () => true,
      });
      User.register.mockResolvedValue({ _id: 'user123' });

      await usersController.registerHandler(req, res, next);

      expect(User.register).toHaveBeenCalledWith(
        expect.any(User),
        req.body.password
      );
      expect(req.login).toHaveBeenCalledWith(
        { _id: 'user123' },
        expect.any(Function)
      );
      expect(req.flash).toHaveBeenCalledWith(
        'success',
        'Welcome to Outdoorsy!'
      );
      expect(res.redirect).toHaveBeenCalledWith('/outdoorsy/campgrounds');
    });

    it('renders register page with errors if validation fails', async () => {
      const errors = [{ msg: 'Invalid input' }];
      expressValidator.validationResult.mockReturnValue({
        isEmpty: () => false,
        array: () => errors,
      });

      await usersController.registerHandler(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.render).toHaveBeenCalledWith('users/register', {
        errors,
        formData: req.body,
        csrfToken: 'test-csrf-token',
      });
    });

    it('handles registration errors and redirects', async () => {
      expressValidator.validationResult.mockReturnValue({
        isEmpty: () => true,
      });
      User.register.mockRejectedValue(new Error('Registration error'));

      await usersController.registerHandler(req, res, next);

      expect(req.flash).toHaveBeenCalledWith(
        'error',
        'Registration failed. Please try again.'
      );
      expect(res.redirect).toHaveBeenCalledWith('/outdoorsy/register');
    });

    it('calls next if login callback returns error', async () => {
      expressValidator.validationResult.mockReturnValue({
        isEmpty: () => true,
      });
      User.register.mockResolvedValue({ _id: 'user123' });
      const loginError = new Error('Login error');
      req.login.mockImplementation((user, cb) => cb(loginError));

      await usersController.registerHandler(req, res, next);

      expect(next).toHaveBeenCalledWith(loginError);
    });
  });

  describe('renderLogin', () => {
    it('renders the login page with csrf token', () => {
      usersController.renderLogin(req, res);
      expect(res.render).toHaveBeenCalledWith('users/login', {
        csrfToken: 'test-csrf-token',
        errors: [],
      });
    });
  });

  describe('login', () => {
    it('redirects to returnTo or campgrounds after login', () => {
      req.session.returnTo = '/some/path';
      usersController.login(req, res);
      expect(res.redirect).toHaveBeenCalledWith('/some/path');
      expect(req.session.returnTo).toBeUndefined();
      expect(req.flash).toHaveBeenCalledWith('success', 'Welcome back!');
    });

    it('redirects to campgrounds if no returnTo', () => {
      usersController.login(req, res);
      expect(res.redirect).toHaveBeenCalledWith('/outdoorsy/campgrounds');
      expect(req.flash).toHaveBeenCalledWith('success', 'Welcome back!');
    });
  });

  describe('logout', () => {
    it('logs out user and redirects', () => {
      req.logout = jest.fn((cb) => cb());
      usersController.logout(req, res, next);
      expect(req.logout).toHaveBeenCalled();
      expect(req.flash).toHaveBeenCalledWith('success', 'Goodbye!');
      expect(res.redirect).toHaveBeenCalledWith('/outdoorsy/campgrounds');
    });

    it('calls next on logout error', () => {
      const error = new Error('Logout error');
      req.logout = jest.fn((cb) => cb(error));
      usersController.logout(req, res, next);
      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
