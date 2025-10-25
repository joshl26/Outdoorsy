// __tests__/campgrounds.test.js

const Campground = require('../../models/campground');
const { cloudinary } = require('../../cloudinary');

jest.mock('../../models/campground');
jest.mock('../../cloudinary');

describe('Campgrounds Controller', () => {
  let req, res, next;

  beforeEach(() => {
    jest.resetModules();

    req = {
      body: { campground: { location: 'Test Location', title: 'Test' } },
      files: [{ path: 'path1', filename: 'file1' }],
      user: { _id: 'user123' },
      params: { id: 'camp123' },
      flash: jest.fn(),
    };
    res = {
      render: jest.fn(),
      redirect: jest.fn(),
    };
    next = jest.fn();
  });

  it('creates a campground and redirects', async () => {
    await new Promise((resolve, reject) => {
      jest.isolateModules(() => {
        jest.mock('@mapbox/mapbox-sdk/services/geocoding', () => {
          return jest.fn(() => ({
            forwardGeocode: jest.fn(() => ({
              send: jest.fn().mockResolvedValue({
                body: {
                  features: [
                    { geometry: { type: 'Point', coordinates: [1, 2] } },
                  ],
                },
              }),
            })),
          }));
        });

        const campgroundsController = require('../../controllers/campgrounds');
        const Campground = require('../../models/campground');

        Campground.prototype.save = jest.fn().mockResolvedValue();

        campgroundsController.createCampground(req, res, next).then(() => {
          try {
            expect(Campground.prototype.save).toHaveBeenCalled();
            expect(req.flash).toHaveBeenCalledWith(
              'success',
              'Successfully made a new campground!'
            );
            expect(res.redirect).toHaveBeenCalledWith(
              expect.stringContaining('/outdoorsy/campgrounds/')
            );
            expect(next).not.toHaveBeenCalled();
            resolve();
          } catch (err) {
            reject(err);
          }
        });
      });
    });
  });

  it('calls next on error', async () => {
    await new Promise((resolve, reject) => {
      jest.isolateModules(() => {
        jest.mock('@mapbox/mapbox-sdk/services/geocoding', () => {
          return jest.fn(() => ({
            forwardGeocode: jest.fn(() => ({
              send: jest.fn(() => Promise.reject(new Error('fail'))),
            })),
          }));
        });

        const campgroundsController = require('../../controllers/campgrounds');

        const reqError = {
          body: { campground: { location: 'Test Location', title: 'Test' } },
          files: [{ path: 'path1', filename: 'file1' }],
          user: { _id: 'user123' },
          flash: jest.fn(),
        };
        const resError = { redirect: jest.fn(), render: jest.fn() };
        const nextError = jest.fn((err) => {
          try {
            expect(err).toBeInstanceOf(Error);
            resolve();
          } catch (e) {
            reject(e);
          }
        });

        campgroundsController.createCampground(reqError, resError, nextError);
      });
    });
  });
});
