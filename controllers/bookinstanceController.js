const BookInstance = require("../models/bookinstance");
const Book = require("../models/book");
const { body, validationResult } = require("express-validator");

// Display list of all BookInstances.
exports.bookinstance_list = async function (req, res, next) {
  try {
    const bookInsctancies = await BookInstance.find().populate("book").exec();
    res.render("bookinstance_list", {
      title: "Book Instance List",
      bookInsctancies,
    });
  } catch (err) {
    next(err);
  }
};

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = async function (req, res, next) {
  try {
    const bookinstance = await BookInstance.findById(req.params.id)
      .populate("book")
      .exec();

    if (bookinstance === null) {
      // No results.
      const err = new Error("Book copy not found");
      err.status = 404;
      throw err;
    }

    // Successful, so render.
    res.render("bookinstance_detail", {
      title: "Copy: " + bookinstance.book.title,
      bookinstance,
    });
  } catch (err) {
    next(err);
  }
};

// Display BookInstance create form on GET.
exports.bookinstance_create_get = async function (req, res, next) {
  try {
    const books = await Book.find({}, "title").exec();
    const statuses = await BookInstance.schema.path("status").enumValues;
    // Successful, so render.
    res.render("bookinstance_form", {
      title: "Create BookInstance",
      statuses,
      books,
    });
  } catch (err) {
    next(err);
  }
};

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [
  // Validate and sanitise fields.
  body("book", "Book must be specified").trim().isLength({ min: 1 }).escape(),
  body("imprint", "Imprint must be specified")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("status").escape(),
  body("due_back", "Invalid date")
    .optional({ checkFalsy: true })
    .isDate()
    .isISO8601()
    .toDate(),

  // Process request after validation and sanitization.
  async (req, res, next) => {
    try {
      // Extract the validation errors from a request.
      const errors = validationResult(req);

      // Create a BookInstance object with escaped and trimmed data.
      const bookinstance = new BookInstance({
        book: req.body.book,
        imprint: req.body.imprint,
        status: req.body.status,
        due_back: req.body.due_back,
      });

      if (!errors.isEmpty()) {
        // There are errors. Render form again with sanitized values and error messages.
        const books = await Book.find({}, "title").exec();
        const statuses = await BookInstance.schema.path("status").enumValues;
        // Successful, so render.
        res.render("bookinstance_form", {
          title: "Create BookInstance",
          books,
          statuses,
          selected_book: bookinstance.book._id,
          errors: errors.array(),
          bookinstance,
        });
      } else {
        // Data from form is valid.
        await bookinstance.save();
        // Successful - redirect to new record.
        res.redirect(bookinstance.url);
      }
    } catch (err) {
      next(err);
    }
  },
];

// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = async function (req, res, next) {
  try {
    const bookinstance = await BookInstance.findById(req.params.id)
      .populate("book")
      .exec();

    if (bookinstance === null) {
      // No results.
      res.redirect("/catalog/bookinstances");
    }
    // Successful, so render.
    res.render("bookinstance_delete", {
      title: "Delete Book Instance",
      bookinstance,
    });
  } catch (err) {
    next(err);
  }
};

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = async function (req, res, next) {
  try {
    await BookInstance.findByIdAndRemove(req.body.bookinstanceid);
    res.redirect("/catalog/bookinstances");
  } catch (err) {
    next(err);
  }
};

// Display BookInstance update form on GET.
exports.bookinstance_update_get = async function (req, res, next) {
  try {
    const bookinstance = await BookInstance.findById(req.params.id)
    .populate("book")
    .exec();
    const statuses = await BookInstance.schema.path("status").enumValues;
    const books = await Book.find();

    if (bookinstance === null) {
      // No results.
      const err = new Error("Book not found");
      err.status = 404;
      throw err;
    }
    // Success.
    // Mark our selected genres as checked.
    res.render("bookinstance_form", {
      title: "Update Book Instance",
      books,
      bookinstance,
      statuses,
    });
  } catch (err) {
    next(err);
  }
};

// Handle bookinstance update on POST.
exports.bookinstance_update_post = [
  // Validate and sanitise fields.
  body("book", "Book must be specified").trim().isLength({ min: 1 }).escape(),
  body("imprint", "Imprint must be specified")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("status").escape(),
  body("due_back", "Invalid date")
    .optional({ checkFalsy: true })
    .isDate()
    .isISO8601()
    .toDate(),
  // Process request after validation and sanitization.
  async (req, res, next) => {
    try {
      // Extract the validation errors from a request.
      const errors = validationResult(req);
      if (req.body.status != "Available" && !req.body.due_back) {
        const dateErrow = {
          value: "",
          msg: "Invalid date",
          param: "Due_back",
          location: "body",
        };
        errors.errors.push(dateErrow);
      }

      // Create a BookInstance object with escaped/trimmed data and old id.
      const bookinstance = new BookInstance({
        book: req.body.book,
        imprint: req.body.imprint,
        status: req.body.status,
        due_back: req.body.due_back,
        _id: req.params.id, //This is required, or a new ID will be assigned!
      });

      if (!errors.isEmpty()) {
        // There are errors. Render form again with sanitized values/error messages.
        const statuses = await BookInstance.schema.path("status").enumValues;
        const books = await Book.find();

        res.render("bookinstance_form", {
          title: "Update Book Instance",
          books,
          statuses,
          bookinstance,
          errors: errors.array(),
        });
      } else {
        // Data from form is valid. Update the record.
        const newBookinstance = await BookInstance.findByIdAndUpdate(
          req.params.id,
          bookinstance,
          {}
        );
        // Successful - redirect to book detail page.
        res.redirect(newBookinstance.url);
      }
    } catch (err) {
      next(err);
    }
  },
];
