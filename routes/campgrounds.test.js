const request = require("supertest");
const assert = require("assert");
const express = require("express");

const app = express();

describe("Test campground route", () => {
  request(app)
    .get("/")
    .expect(200)
    .end(function (err, res) {
      if (err) throw err;
    });
});
