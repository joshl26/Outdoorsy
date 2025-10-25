// __tests__/campgrounds.test.js

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
Campground.find = jest.fn();
Campground.findById = jest.fn();
Campground.findByIdAndUpdate = jest.fn();
Campground.findByIdAndDelete = jest.fn();
Campground.prototype.save = jest.fn();

const { cloudinary } = require('../../cloudinary');
jest.mock('../../cloudinary');

describe('Campgrounds Controller', () => {
  let campgroundsController;
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();

    // Require controller after mocks are set
    campgroundsController = require('../../controllers/campgrounds');

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

  it('index: renders campgrounds index', async () => {
    const fakeCampgrounds = [{ title: 'Camp1' }, { title: 'Camp2' }];
    Campground.find.mockResolvedValue(fakeCampgrounds);

    await campgroundsController.index(req, res, next);

    expect(Campground.find).toHaveBeenCalled();
    expect(res.render).toHaveBeenCalledWith('campgrounds/index', {
      campgrounds: fakeCampgrounds,
    });
  });

  it('showCampground: renders campground if found', async () => {
    const fakeCampground = { _id: 'camp123', title: 'Camp1' };

    const populateMock = jest.fn().mockReturnThis();

    Campground.findById.mockReturnValue({
      populate: populateMock,
      then: (cb) => cb(fakeCampground),
    });

    await campgroundsController.showCampground(req, res, next);

    expect(Campground.findById).toHaveBeenCalledWith('camp123');
    expect(populateMock).toHaveBeenCalledTimes(2);
    expect(res.render).toHaveBeenCalledWith('campgrounds/show', {
      campground: fakeCampground,
    });
  });

  it('showCampground: redirects if campground not found', async () => {
    const populateMock = jest.fn().mockReturnThis();

    Campground.findById.mockReturnValue({
      populate: populateMock,
      then: (cb) => cb(null),
    });

    await campgroundsController.showCampground(req, res, next);

    expect(req.flash).toHaveBeenCalledWith(
      'error',
      'Cannot find that campground!'
    );
    expect(res.redirect).toHaveBeenCalledWith('/outdoorsy/campgrounds');
  });

  it('updateCampground: updates campground and redirects', async () => {
    const fakeCampground = {
      _id: 'camp123',
      images: [],
      save: jest.fn().mockResolvedValue(),
      updateOne: jest.fn().mockResolvedValue(),
    };
    Campground.findByIdAndUpdate.mockResolvedValue(fakeCampground);

    await campgroundsController.updateCampground(req, res, next);

    expect(Campground.findByIdAndUpdate).toHaveBeenCalledWith(
      'camp123',
      expect.any(Object)
    );
    expect(fakeCampground.save).toHaveBeenCalled();
    expect(res.redirect).toHaveBeenCalledWith('/outdoorsy/campgrounds/camp123');
    expect(req.flash).toHaveBeenCalledWith(
      'success',
      'Successfully updated campground!'
    );
  });

  it('deleteCampground: deletes campground and redirects', async () => {
    Campground.findByIdAndDelete.mockResolvedValue();

    await campgroundsController.deleteCampground(req, res, next);

    expect(Campground.findByIdAndDelete).toHaveBeenCalledWith('camp123');
    expect(req.flash).toHaveBeenCalledWith(
      'success',
      'Successfully deleted campground'
    );
    expect(res.redirect).toHaveBeenCalledWith('/outdoorsy/campgrounds');
  });

  it('creates a campground and redirects', async () => {
    Campground.prototype.save.mockResolvedValue();

    await campgroundsController.createCampground(req, res, next);

    expect(Campground.prototype.save).toHaveBeenCalled();
    expect(req.flash).toHaveBeenCalledWith(
      'success',
      'Successfully made a new campground!'
    );
    expect(res.redirect).toHaveBeenCalledWith(
      expect.stringContaining('/outdoorsy/campgrounds/')
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next on error', async () => {
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
    const resError = { redirect: jest.fn(), render: jest.fn() };
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
