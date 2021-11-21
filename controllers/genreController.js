const Genre = require("../models/genre");
const Book = require("../models/book");
const { body, validationResult } = require("express-validator");

// Display list of all Genre.
exports.genre_list = async function (req, res, next) {
  try {
    const genres = await Genre.find().sort({ name: "ascending" }).exec();
    res.render("genre_list", {
      title: "Genre List",
      genres,
    });
  } catch (err) {
    next(err);
  }
};

// Display detail page for a specific Genre.
exports.genre_detail = async function (req, res, next) {
  try {
    const genre = await Genre.findById(req.params.id).exec();
    const genre_books = await Book.find({ genre: req.params.id }).exec();

    if (genre === null) {
      // No results.
      const err = new Error("Genre not found");
      err.status = 404;
      throw err;
    }
    // Successful, so render
    res.render("genre_detail", {
      title: "Genre Detail",
      genre,
      genre_books,
    });
  } catch (err) {
    next(err);
  }
};

// Display Genre create form on GET.
exports.genre_create_get = function (req, res) {
  res.render("genre_form", { title: "Create Genre" });
};

// Handle Genre create on POST.
exports.genre_create_post = [
  // Validate and santize the name field.
  body("name", "Genre name required").trim().isLength({ min: 1 }).escape(),

  // Process request after validation and sanitization.
  async (req, res, next) => {
    try {
      // Extract the validation errors from a request.
      const errors = validationResult(req);

      // Create a genre object with escaped and trimmed data.
      const genre = new Genre({ name: req.body.name });

      if (!errors.isEmpty()) {
        // There are errors. Render the form again with sanitized values/error messages.
        res.render("genre_form", {
          title: "Create Genre",
          genre,
          errors: errors.array(),
        });
      } else {
        // Data from form is valid.
        // Check if Genre with same name already exists.
        const genreMatch = await Genre.findOne({ name: req.body.name }).exec();

        if (genreMatch) {
          // Genre exists, redirect to its detail page.
          res.redirect(genreMatch.url);
        } else {
          await genre.save();
          res.redirect(genre.url);
        }
      }
    } catch (err) {
      next(err);
    }
  },
];

// Display Genre delete form on GET.
exports.genre_delete_get = async function (req, res, next) {
  try {
    const genre = await Genre.findById(req.params.id).exec();
    const genre_books = await Book.find({ genre: req.params.id }).exec();

    if (genre === null) {
      // No results.
      res.redirect("/catalog/genres");
    }
    // Successful, so render.
    res.render("genre_delete", {
      title: "Delete Genre",
      genre,
      genre_books,
    });
  } catch (err) {
    next(err);
  }
};

// Handle Genre delete on POST.
exports.genre_delete_post = async function (req, res, next) {
  try {
    const genre = await Genre.findById(req.params.id).exec();
    const genre_books = await Book.find({ genre: req.params.id }).exec();

    // Success
    if (genre_books.length > 0) {
      // Author has books. Render in same way as for GET route.
      res.render("genre_delete", {
        title: "Delete Genre",
        genre,
        genre_books,
      });
    } else {
      // Author has no books. Delete object and redirect to the list of authors.
      await Genre.findByIdAndRemove(req.body.genreid);
      // Success - go to author list
      res.redirect("/catalog/genres");
    }
  } catch (err) {
    next(err);
  }
};

// Display Genre update form on GET.
exports.genre_update_get = function (req, res, next) {
  res.render("genre_form", {
    title: "Update Genre",
  });
};

// Handle Genre update on POST.
exports.genre_update_post = [
  // Validate and santize the name field.
  body("name", "Genre name required").trim().isLength({ min: 1 }).escape(),

  // Process request after validation and sanitization.
  async (req, res, next) => {
    try {
      // Extract the validation errors from a request.
      const errors = validationResult(req);

      // Create a genre object with escaped and trimmed data.
      const genre = new Genre({
        name: req.body.name,
        _id: req.params.id, //This is required, or a new ID will be assigned!
      });

      if (!errors.isEmpty()) {
        // There are errors. Render the form again with sanitized values/error messages.
        res.render("genre_form", {
          title: "Update Genre",
          genre,
          errors: errors.array(),
        });
      } else {
        // Data from form is valid.
        // Check if Genre with same name already exists.
        const genreMatch = await Genre.findOne({ name: req.body.name }).exec();

        if (genreMatch) {
          // Genre exists, redirect to its detail page.
          res.redirect(genreMatch.url);
        } else {
          const newGenre = await Genre.findByIdAndUpdate(req.params.id, genre, {});
          res.redirect(newGenre.url);
        }
      }
    } catch (err) {
      next(err);
    }
  },
];
