// controllers/__tests__/campgrounds.test.js

// Mock the geocoder BEFORE requiring the controller
const mockGeocoder = {
  forwardGeocode: jest.fn().mockReturnThis(),
  send: jest.fn(),
};

jest.mock('@mapbox/mapbox-sdk/services/geocoding', () => {
  return jest.fn(() => mockGeocoder);
});

jest.mock('../../models/campground');
jest.mock('../../cloudinary');

const campgroundsController = require('../campgrounds');
const Campground = require('../../models/campground');
const { cloudinary } = require('../../cloudinary');
const NotFoundError = require('../../utils/errors/NotFoundError');
const AppError = require('../../utils/errors/AppError');

describe('Campgrounds Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      params: {},
      query: {},
      files: [],
      user: { _id: 'user123' },
      body: {},
      flash: jest.fn(),
    };
    res = {
      render: jest.fn(),
      redirect: jest.fn(),
      locals: {},
      status: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('index', () => {
    it('renders campgrounds with pagination', async () => {
      const fakeCampgrounds = [
        { _id: '1', title: 'Camp A', price: 20 },
        { _id: '2', title: 'Camp B', price: 30 },
      ];
      req.query.page = '1';
      req.query.limit = '20';

      // Create proper async mock chain
      const leanMock = jest.fn().mockResolvedValue(fakeCampgrounds);
      const limitMock = jest.fn().mockReturnValue({ lean: leanMock });
      const skipMock = jest.fn().mockReturnValue({ limit: limitMock });
      const sortMock = jest.fn().mockReturnValue({ skip: skipMock });
      const findMock = jest.fn().mockReturnValue({ sort: sortMock });

      Campground.find = findMock;
      Campground.countDocuments = jest.fn().mockResolvedValue(25);

      await campgroundsController.index(req, res, next);

      expect(findMock).toHaveBeenCalled();
      expect(sortMock).toHaveBeenCalledWith({ createdAt: -1 });
      expect(skipMock).toHaveBeenCalledWith(0);
      expect(limitMock).toHaveBeenCalledWith(20);
      expect(leanMock).toHaveBeenCalled();
      expect(Campground.countDocuments).toHaveBeenCalled();
      expect(res.render).toHaveBeenCalledWith(
        'campgrounds/index',
        expect.objectContaining({
          campgrounds: fakeCampgrounds,
          page: 1,
          totalPages: 2,
          total: 25,
        })
      );
    });

    it('handles errors and calls next', async () => {
      const error = new Error('DB error');
      req.query.page = '1';

      const leanMock = jest.fn().mockRejectedValue(error);
      const limitMock = jest.fn().mockReturnValue({ lean: leanMock });
      const skipMock = jest.fn().mockReturnValue({ limit: limitMock });
      const sortMock = jest.fn().mockReturnValue({ skip: skipMock });
      const findMock = jest.fn().mockReturnValue({ sort: sortMock });

      Campground.find = findMock;
      Campground.countDocuments = jest.fn().mockResolvedValue(0);

      await campgroundsController.index(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('renderNewForm', () => {
    it('renders new campground form', () => {
      campgroundsController.renderNewForm(req, res);
      expect(res.render).toHaveBeenCalledWith('campgrounds/new');
    });
  });

  describe('createCampground', () => {
    it('creates a new campground with valid location', async () => {
      req.body.campground = {
        title: 'New Camp',
        location: 'Denver, CO',
        price: 25,
        description: 'A great place',
      };
      req.files = [{ path: '/uploads/img1.jpg', filename: 'img1.jpg' }];

      mockGeocoder.send.mockResolvedValue({
        body: {
          features: [
            {
              geometry: {
                type: 'Point',
                coordinates: [-104.9903, 39.7392],
              },
            },
          ],
        },
      });

      const mockCampground = {
        _id: 'newcamp123',
        images: [],
        geometry: {},
        author: null,
        save: jest.fn().mockResolvedValue(true),
      };

      Campground.mockImplementation(function (data) {
        Object.assign(this, mockCampground, data);
        return this;
      });

      await campgroundsController.createCampground(req, res, next);

      expect(mockGeocoder.forwardGeocode).toHaveBeenCalledWith({
        query: 'Denver, CO',
        limit: 1,
      });
      expect(mockGeocoder.send).toHaveBeenCalled();
      expect(req.flash).toHaveBeenCalledWith(
        'success',
        'Successfully created a new campground!'
      );
      expect(res.redirect).toHaveBeenCalled();
    });

    it('throws AppError if geocoding returns no results', async () => {
      req.body.campground = {
        location: 'InvalidPlace',
        title: 'Test',
        price: 20,
        description: 'Test',
      };
      req.files = [];

      mockGeocoder.send.mockResolvedValue({ body: { features: [] } });

      await campgroundsController.createCampground(req, res, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Invalid location provided');
    });
  });

  describe('showCampground', () => {
    it('renders campground if found (optimized with lean)', async () => {
      req.params.id = 'camp123';
      const fakeCampground = {
        _id: 'camp123',
        title: 'Test Campground',
        description: 'A beautiful place to camp in the mountains.',
        reviews: [],
        author: { _id: 'author1', email: 'author@example.com' },
      };

      // Mock the chain: findById().populate().populate().lean()
      const leanMock = jest.fn().mockResolvedValue(fakeCampground);
      const populate2Mock = jest.fn().mockReturnValue({ lean: leanMock });
      const populate1Mock = jest
        .fn()
        .mockReturnValue({ populate: populate2Mock });
      const findByIdMock = jest
        .fn()
        .mockReturnValue({ populate: populate1Mock });

      Campground.findById = findByIdMock;

      await campgroundsController.showCampground(req, res, next);

      expect(findByIdMock).toHaveBeenCalledWith('camp123');
      expect(populate1Mock).toHaveBeenCalled();
      expect(populate2Mock).toHaveBeenCalled();
      expect(leanMock).toHaveBeenCalled();
      expect(res.locals.pageTitle).toBe('Test Campground - Outdoorsy');
      expect(res.locals.pageDescription).toBe(
        fakeCampground.description.substring(0, 160)
      );
      expect(res.render).toHaveBeenCalledWith('campgrounds/show', {
        campground: fakeCampground,
      });
    });

    it('calls next with NotFoundError if campground not found', async () => {
      req.params.id = 'camp404';

      const leanMock = jest.fn().mockResolvedValue(null);
      const populate2Mock = jest.fn().mockReturnValue({ lean: leanMock });
      const populate1Mock = jest
        .fn()
        .mockReturnValue({ populate: populate2Mock });
      const findByIdMock = jest
        .fn()
        .mockReturnValue({ populate: populate1Mock });

      Campground.findById = findByIdMock;

      await campgroundsController.showCampground(req, res, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error.message).toBe('Campground not found');
    });

    it('handles missing description gracefully', async () => {
      req.params.id = 'camp999';
      const fakeCampground = {
        _id: 'camp999',
        title: 'No Desc Camp',
        description: null,
      };

      const leanMock = jest.fn().mockResolvedValue(fakeCampground);
      const populate2Mock = jest.fn().mockReturnValue({ lean: leanMock });
      const populate1Mock = jest
        .fn()
        .mockReturnValue({ populate: populate2Mock });
      const findByIdMock = jest
        .fn()
        .mockReturnValue({ populate: populate1Mock });

      Campground.findById = findByIdMock;

      await campgroundsController.showCampground(req, res, next);

      expect(res.locals.pageDescription).toBe(
        'Explore No Desc Camp on Outdoorsy'
      );
    });
  });

  describe('renderEditForm', () => {
    it('renders edit form if campground found', async () => {
      req.params.id = 'camp123';
      const fakeCampground = { _id: 'camp123', title: 'Edit Me' };

      Campground.findById = jest.fn().mockResolvedValue(fakeCampground);

      await campgroundsController.renderEditForm(req, res, next);

      expect(Campground.findById).toHaveBeenCalledWith('camp123');
      expect(res.locals.pageTitle).toBe('Edit Edit Me - Outdoorsy');
      expect(res.render).toHaveBeenCalledWith('campgrounds/edit', {
        campground: fakeCampground,
      });
    });

    it('throws NotFoundError if campground not found', async () => {
      req.params.id = 'camp404';
      Campground.findById = jest.fn().mockResolvedValue(null);

      await campgroundsController.renderEditForm(req, res, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error.message).toBe('Campground not found');
    });
  });

  describe('updateCampground', () => {
    it('updates campground and redirects', async () => {
      req.params.id = 'camp123';
      req.body.campground = {
        title: 'Updated Title',
        location: 'Updated Location',
        description: 'Updated description',
      };
      req.files = [{ path: '/uploads/new.jpg', filename: 'new.jpg' }];

      const savedCamp = {
        _id: 'camp123',
        images: [],
        save: jest.fn().mockResolvedValue(true),
        updateOne: jest.fn().mockResolvedValue(true),
      };

      Campground.findByIdAndUpdate = jest.fn().mockResolvedValue(savedCamp);

      await campgroundsController.updateCampground(req, res, next);

      expect(Campground.findByIdAndUpdate).toHaveBeenCalledWith(
        'camp123',
        expect.objectContaining({
          title: 'Updated Title',
          location: 'Updated Location',
          description: 'Updated description',
        }),
        { new: true }
      );
      expect(savedCamp.images).toHaveLength(1);
      expect(savedCamp.save).toHaveBeenCalled();
      expect(req.flash).toHaveBeenCalledWith(
        'success',
        'Successfully updated campground!'
      );
      expect(res.redirect).toHaveBeenCalledWith(
        '/outdoorsy/campgrounds/camp123'
      );
    });

    it('deletes images from Cloudinary and DB if requested', async () => {
      req.params.id = 'camp123';
      req.body.campground = { title: 'Test' };
      req.body.deleteImages = ['img1.jpg', 'img2.jpg'];
      req.files = [];

      const savedCamp = {
        _id: 'camp123',
        images: [
          { url: '/img1.jpg', filename: 'img1.jpg' },
          { url: '/img2.jpg', filename: 'img2.jpg' },
        ],
        save: jest.fn().mockResolvedValue(true),
        updateOne: jest.fn().mockResolvedValue(true),
      };

      Campground.findByIdAndUpdate = jest.fn().mockResolvedValue(savedCamp);
      cloudinary.uploader = { destroy: jest.fn().mockResolvedValue(true) };

      await campgroundsController.updateCampground(req, res, next);

      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith('img1.jpg');
      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith('img2.jpg');
      expect(savedCamp.updateOne).toHaveBeenCalledWith({
        $pull: { images: { filename: { $in: ['img1.jpg', 'img2.jpg'] } } },
      });
    });

    it('throws NotFoundError if campground not found', async () => {
      req.params.id = 'camp404';
      req.body.campground = { title: 'Test' };
      req.files = [];

      Campground.findByIdAndUpdate = jest.fn().mockResolvedValue(null);

      await campgroundsController.updateCampground(req, res, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error.message).toBe('Campground not found');
    });
  });

  describe('deleteCampground', () => {
    it('deletes campground and redirects', async () => {
      req.params.id = 'camp123';
      const deletedCamp = { _id: 'camp123', title: 'Deleted' };

      Campground.findByIdAndDelete = jest.fn().mockResolvedValue(deletedCamp);

      await campgroundsController.deleteCampground(req, res, next);

      expect(Campground.findByIdAndDelete).toHaveBeenCalledWith('camp123');
      expect(req.flash).toHaveBeenCalledWith(
        'success',
        'Successfully deleted campground'
      );
      expect(res.redirect).toHaveBeenCalledWith('/outdoorsy/campgrounds');
    });

    it('throws NotFoundError if campground not found', async () => {
      req.params.id = 'camp404';
      Campground.findByIdAndDelete = jest.fn().mockResolvedValue(null);

      await campgroundsController.deleteCampground(req, res, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error.message).toBe('Campground not found');
    });
  });
});
