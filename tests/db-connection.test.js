require("dotenv").config();
const mongoose = require("mongoose");
const Campground = require("../controllers/campgrounds");

describe("Connection", () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.DB_URL, {
      useNewUrlParser: true,
      useCreateIndex: true,
      useUnifiedTopology: true,
    });
  });

  //   test("Retrieve article by Id", async () => {
  //     const id = "5ff2454f94eeee0a7acb5c30";
  //     const article = await ArticleService.getArticlebyId(id);
  //     expect(article.title).toBe("This is another post example");
  //   });

  test("Retrieve campsite info", async () => {
    // const id = "646d919387d1d5003b83728c";
    // const campground = await Campground.showCampground(id);
    //   .populate({
    //     path: "reviews",
    //     populate: {
    //       path: "author",
    //     },
    //   })
    //   .populate("author");
    // if (!campground) {
    //   req.flash("error", "Cannot find that campground!");
    //   return res.redirect("/campgrounds");
    // }
    // expect(campground.title).toNotBe("");
    //res.render("campgrounds/show", { campground });
  });

  afterAll((done) => {
    mongoose.disconnect();
    done();
  });
});
