// __tests__/users.test.js

const User = require('../../models/user');

jest.mock('../../models/user');

const usersController = require('../../controllers/users');

describe('Users Controller', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      body: {},
      flash: jest.fn(),
      session: {},
      login: jest.fn(),
      logout: jest.fn(),
    };
    res = {
      render: jest.fn(),
      redirect: jest.fn(),
    };
    next = jest.fn();
  });

  describe('renderRegister', () => {
    it('renders the register page', () => {
      usersController.renderRegister(req, res);
      expect(res.render).toHaveBeenCalledWith('users/register');
    });
  });

  describe('register', () => {
    it('registers a new user and logs them in', async () => {
      req.body = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'password',
      };
      const fakeUser = { _id: 'user123' };
      User.register.mockResolvedValue(fakeUser);

      req.login.mockImplementation((user, cb) => cb());

      await usersController.register(req, res, next);

      expect(User.register).toHaveBeenCalledWith(expect.any(User), 'password');
      expect(req.login).toHaveBeenCalledWith(fakeUser, expect.any(Function));
      expect(req.flash).toHaveBeenCalledWith(
        'success',
        'Welcome to Yelp Camp!'
      );
      expect(res.redirect).toHaveBeenCalledWith('/outdoorsy/campgrounds');
      expect(next).not.toHaveBeenCalled();
    });

    it('handles registration errors', async () => {
      req.body = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'password',
      };
      const error = new Error('Registration failed');
      User.register.mockRejectedValue(error);

      await usersController.register(req, res, next);

      expect(req.flash).toHaveBeenCalledWith('error', error.message);
      expect(res.redirect).toHaveBeenCalledWith('/outdoorsy/register');
      expect(next).not.toHaveBeenCalled();
    });

    it('calls next if login callback returns error', async () => {
      req.body = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'password',
      };
      const fakeUser = { _id: 'user123' };
      User.register.mockResolvedValue(fakeUser);

      const loginError = new Error('Login failed');
      req.login.mockImplementation((user, cb) => cb(loginError));

      await usersController.register(req, res, next);

      expect(next).toHaveBeenCalledWith(loginError);
    });
  });

  describe('renderLogin', () => {
    it('renders the login page', () => {
      usersController.renderLogin(req, res);
      expect(res.render).toHaveBeenCalledWith('users/login');
    });
  });

  describe('login', () => {
    it('flashes success and redirects to returnTo or default', () => {
      req.session.returnTo = '/some/page';
      usersController.login(req, res);
      expect(req.flash).toHaveBeenCalledWith('success', 'Welcome back!');
      expect(res.redirect).toHaveBeenCalledWith('/some/page');
      expect(req.session.returnTo).toBeUndefined();
    });

    it('redirects to default if no returnTo', () => {
      usersController.login(req, res);
      expect(res.redirect).toHaveBeenCalledWith('/outdoorsy/campgrounds');
    });
  });

  describe('logout', () => {
    it('logs out user and redirects', () => {
      req.logout.mockImplementation((cb) => cb());
      usersController.logout(req, res, next);
      expect(req.logout).toHaveBeenCalled();
      expect(req.flash).toHaveBeenCalledWith('success', 'Goodbye!');
      expect(res.redirect).toHaveBeenCalledWith('/outdoorsy/campgrounds');
      expect(next).not.toHaveBeenCalled();
    });

    it('calls next on logout error', () => {
      const error = new Error('Logout error');
      req.logout.mockImplementation((cb) => cb(error));
      usersController.logout(req, res, next);
      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
