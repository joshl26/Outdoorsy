// __tests__/controllers/campgrounds.test.js

// Mock Mapbox SDK before requiring controller
jest.mock('@mapbox/mapbox-sdk/services/geocoding', () => {
  return jest.fn(() => ({
    forwardGeocode: jest.fn(() => ({
      send: jest.fn().mockResolvedValue({
        body: {
          features: [{ geometry: { type: 'Point', coordinates: [1, 2] } }],
        },
      }),
    })),
  }));
});

const Campground = require('../../models/campground');
// const { cloudinary } = require('../../cloudinary');
jest.mock('../../cloudinary');

const campgroundsController = require('../../controllers/campgrounds');
const basePath = '/outdoorsy'; // Adjust if your app uses a different basePath

describe('Campgrounds Controller', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      body: {
        campground: {
          location: 'Test Location',
          title: 'Test',
          description: 'Test description',
        },
      },
      files: [{ path: 'path1', filename: 'file1' }],
      user: { _id: 'user123' },
      params: { id: 'camp123' },
      flash: jest.fn(),
    };
    res = {
      locals: {},
      render: jest.fn(),
      redirect: jest.fn(),
    };
    next = jest.fn();
  });

  it('index: renders campgrounds index', async () => {
    const fakeCampgrounds = [{ title: 'Camp1' }, { title: 'Camp2' }];
    Campground.find = jest.fn().mockResolvedValue(fakeCampgrounds);

    await campgroundsController.index(req, res, next);

    expect(Campground.find).toHaveBeenCalled();
    expect(res.render).toHaveBeenCalledWith('campgrounds/index', {
      campgrounds: fakeCampgrounds,
    });
  });

  it('showCampground: renders campground if found', async () => {
    const fakeCampground = {
      _id: 'camp123',
      title: 'Camp1',
      description: 'Test description',
    };

    const query = {
      populate: jest.fn().mockReturnThis(),
      then: jest.fn((cb) => cb(fakeCampground)),
    };

    Campground.findById = jest.fn(() => query);

    await campgroundsController.showCampground(req, res, next);

    expect(Campground.findById).toHaveBeenCalledWith('camp123');
    expect(query.populate).toHaveBeenCalledTimes(2);
    expect(query.then).toHaveBeenCalled();
    expect(res.locals.pageTitle).toBe(`${fakeCampground.title} - Outdoorsy`);
    expect(res.locals.pageDescription).toBe(
      fakeCampground.description.substring(0, 160)
    );
    expect(res.render).toHaveBeenCalledWith('campgrounds/show', {
      campground: fakeCampground,
    });
  });

  it('showCampground: calls next with error if campground not found', async () => {
    const query = {
      populate: jest.fn().mockReturnThis(),
      then: jest.fn((cb) => cb(null)),
    };

    Campground.findById = jest.fn(() => query);

    await campgroundsController.showCampground(req, res, next);

    expect(next).toHaveBeenCalled();
    const error = next.mock.calls[0][0];
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('Campground not found');
  });

  it('updateCampground: updates campground and redirects', async () => {
    const fakeCampground = {
      _id: 'camp123',
      images: [],
      save: jest.fn().mockResolvedValue(),
      updateOne: jest.fn().mockResolvedValue(),
    };
    Campground.findByIdAndUpdate = jest.fn().mockResolvedValue(fakeCampground);

    await campgroundsController.updateCampground(req, res, next);

    expect(Campground.findByIdAndUpdate).toHaveBeenCalledWith(
      'camp123',
      expect.any(Object)
    );
    expect(fakeCampground.save).toHaveBeenCalled();
    expect(res.redirect).toHaveBeenCalledWith(
      `${basePath}/campgrounds/camp123`
    );
    expect(req.flash).toHaveBeenCalledWith(
      'success',
      'Successfully updated campground!'
    );
  });

  it('deleteCampground: calls next with error if campground not found', async () => {
    Campground.findByIdAndDelete = jest.fn().mockResolvedValue(null);

    await campgroundsController.deleteCampground(req, res, next);

    expect(next).toHaveBeenCalled();
    const error = next.mock.calls[0][0];
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('Campground not found');
  });

  it('deleteCampground: deletes campground and redirects', async () => {
    Campground.findByIdAndDelete = jest.fn().mockResolvedValue({});

    await campgroundsController.deleteCampground(req, res, next);

    expect(Campground.findByIdAndDelete).toHaveBeenCalledWith('camp123');
    expect(req.flash).toHaveBeenCalledWith(
      'success',
      'Successfully deleted campground'
    );
    expect(res.redirect).toHaveBeenCalledWith(`${basePath}/campgrounds`);
  });

  it('createCampground: creates a campground and redirects', async () => {
    Campground.prototype.save = jest.fn().mockResolvedValue();

    await campgroundsController.createCampground(req, res, next);

    expect(Campground.prototype.save).toHaveBeenCalled();
    expect(req.flash).toHaveBeenCalledWith(
      'success',
      'Successfully created a new campground!'
    );
    expect(res.redirect).toHaveBeenCalledWith(
      expect.stringContaining(`${basePath}/campgrounds/`)
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('createCampground: calls next on error', async () => {
    jest.resetModules();

    jest.mock('@mapbox/mapbox-sdk/services/geocoding', () => {
      return jest.fn(() => ({
        forwardGeocode: jest.fn(() => ({
          send: jest.fn(() => Promise.reject(new Error('fail'))),
        })),
      }));
    });

    const campgroundsControllerError = require('../../controllers/campgrounds');

    const reqError = {
      body: { campground: { location: 'Test Location', title: 'Test' } },
      files: [{ path: 'path1', filename: 'file1' }],
      user: { _id: 'user123' },
      flash: jest.fn(),
    };
    const resError = { redirect: jest.fn(), render: jest.fn(), locals: {} };
    const nextError = jest.fn();

    await campgroundsControllerError.createCampground(
      reqError,
      resError,
      nextError
    );

    expect(nextError).toHaveBeenCalled();
    expect(nextError.mock.calls[0][0]).toBeInstanceOf(Error);
  });
});
