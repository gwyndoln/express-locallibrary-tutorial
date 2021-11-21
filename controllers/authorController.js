const Author = require("../models/author");
const Book = require("../models/book");
const { body, validationResult } = require("express-validator");

// Display list of all Authors.
exports.author_list = async function (req, res, next) {
  try {
    const authors = await Author.find()
      .sort({ family_name: "ascending" })
      .exec();
    res.render("author_list", {
      title: "Author List",
      authors,
    });
  } catch (err) {
    next(err);
  }
};

// Display detail page for a specific Author.
exports.author_detail = async function (req, res, next) {
  try {
    const author = await Author.findById(req.params.id).exec();
    const authors_books = await Book.find(
      { author: req.params.id },
      "title summary"
    ).exec();

    if (author === null) {
      // No results.
      const err = new Error("Author not found");
      err.status = 404;
      throw err;
    }
    // Successful, so render.
    res.render("author_detail", {
      title: "Author Detail",
      author,
      authors_books,
    });
  } catch (err) {
    next(err);
  }
};

// Display Author create form on GET.
exports.author_create_get = function (req, res) {
  res.render("author_form", { title: "Create Author" });
};

// Handle Author create on POST.
exports.author_create_post = [
  // Validate and sanitize fields.
  body("first_name")
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage("First name must be specified.")
    .isAlphanumeric()
    .withMessage("First name has non-alphanumeric characters."),
  body("family_name")
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage("Family name must be specified.")
    .isAlphanumeric()
    .withMessage("Family name has non-alphanumeric characters."),
  body("date_of_birth", "Invalid date of birth")
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),
  body("date_of_death", "Invalid date of death")
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),

  // Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/errors messages.
      res.render("author_form", {
        title: "Create Author",
        author: req.body,
        errors: errors.array(),
      });
      return;
    } else {
      // Data from form is valid.

      // Create an Author object with escaped and trimmed data.
      const author = new Author({
        first_name: req.body.first_name,
        family_name: req.body.family_name,
        date_of_birth: req.body.date_of_birth,
        date_of_death: req.body.date_of_death,
      });
      author.save(function (err) {
        if (err) {
          return next(err);
        }
        // Successful - redirect to new author record.
        res.redirect(author.url);
      });
    }
  },
];

// Display Author delete form on GET.
exports.author_delete_get = async function (req, res, next) {
  try {
    const author = await Author.findById(req.params.id).exec();
    const author_books = await Book.find({ author: req.params.id }).exec();

    if (author === null) {
      // No results.
      res.redirect("/catalog/authors");
    }
    // Successful, so render.
    res.render("author_delete", {
      title: "Delete Author",
      author,
      author_books,
    });
  } catch (err) {
    next(err);
  }
};

// Handle Author delete on POST.
exports.author_delete_post = async function (req, res, next) {
  try {
    const author = await Author.findById(req.body.authorid).exec();
    const author_books = await Book.find({ author: req.body.authorid }).exec();

    // Success
    if (author_books.length > 0) {
      // Author has books. Render in same way as for GET route.
      res.render("author_delete", {
        title: "Delete Author",
        author,
        author_books,
      });
    } else {
      // Author has no books. Delete object and redirect to the list of authors.
      await Author.findByIdAndRemove(req.body.authorid);
      // Success - go to author list
      res.redirect("/catalog/authors");
    }
  } catch (err) {
    next(err);
  }
};

// Display Author update form on GET.
exports.author_update_get = async function (req, res, next) {
  try {
    // Get book, authors and genres for form.
    const author = await Author.findById(req.params.id).exec();

    if (author === null) {
      // No results.
      const err = new Error("Book not found");
      err.status = 404;
      throw err;
    }
    // Success.
    res.render("author_form", {
      title: "Update Author",
      author,
    });
  } catch (err) {
    next(err);
  }
};

// Handle Author update on POST.
exports.author_update_post = [
  // Validate and sanitise fields.
  body("first_name")
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage("First name must be specified.")
    .isAlphanumeric()
    .withMessage("First name has non-alphanumeric characters."),
  body("family_name")
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage("Family name must be specified.")
    .isAlphanumeric()
    .withMessage("Family name has non-alphanumeric characters."),
  body("date_of_birth", "Invalid date of birth")
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),
  body("date_of_death", "Invalid date of death")
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),

  // Process request after validation and sanitization.
  async (req, res, next) => {
    try {
      // Extract the validation errors from a request.
      const errors = validationResult(req);

      // Create a Book object with escaped/trimmed data and old id.
      const author = new Author({
        first_name: req.body.first_name,
        family_name: req.body.family_name,
        date_of_birth: req.body.date_of_birth,
        date_of_death: req.body.date_of_death,
        _id: req.params.id, //This is required, or a new ID will be assigned!
      });

      if (!errors.isEmpty()) {
        // There are errors. Render form again with sanitized values/error messages.

        res.render("author_form", {
          title: "Update Author",
          author,
          errors: errors.array(),
        });
      } else {
        // Data from form is valid. Update the record.
        const newAuthor = await Author.findByIdAndUpdate(req.params.id, author, {});
        console.log();
        // Successful - redirect to book detail page.
        res.redirect(newAuthor.url);
      }
    } catch (err) {
      next(err);
    }
  },
];
