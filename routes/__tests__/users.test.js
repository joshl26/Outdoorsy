// routes/__tests__/users.test.js

const express = require('express');
const request = require('supertest');
const session = require('express-session');
// const passport = require('passport');
const usersRouter = require('../users'); // adjust path if needed

// Mock controllers
jest.mock('../../controllers/users', () => ({
  renderRegister: (req, res) => res.send('Render Register Page'),
  register: (req, res) => res.redirect('/outdoorsy/campgrounds'),
  renderLogin: (req, res) => res.send('Render Login Page'),
  login: (req, res) => res.redirect('/outdoorsy/campgrounds'),
  logout: (req, res) => res.redirect('/outdoorsy/campgrounds'),
}));

// Mock passport.authenticate middleware
jest.mock('passport', () => ({
  authenticate: () => (req, res, next) => next(),
}));

describe('Users Routes', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.urlencoded({ extended: false }));
    app.use(
      session({
        secret: 'testsecret',
        resave: false,
        saveUninitialized: false,
      })
    );
    app.use(usersRouter);
  });

  it('GET /register should render register page', async () => {
    const res = await request(app).get('/register');
    expect(res.statusCode).toBe(200);
    expect(res.text).toBe('Render Register Page');
  });

  it('POST /register should redirect after registration', async () => {
    const res = await request(app).post('/register').send({
      email: 'test@example.com',
      username: 'testuser',
      password: 'password',
    });
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe('/outdoorsy/campgrounds');
  });

  it('GET /login should render login page', async () => {
    const res = await request(app).get('/login');
    expect(res.statusCode).toBe(200);
    expect(res.text).toBe('Render Login Page');
  });

  it('POST /login should redirect after login', async () => {
    const res = await request(app).post('/login').send({
      username: 'testuser',
      password: 'password',
    });
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe('/outdoorsy/campgrounds');
  });

  it('GET /logout should redirect after logout', async () => {
    const res = await request(app).get('/logout');
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe('/outdoorsy/campgrounds');
  });
});
