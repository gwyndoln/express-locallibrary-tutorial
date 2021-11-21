const Book = require("../models/book");
const Author = require("../models/author");
const Genre = require("../models/genre");
const BookInstance = require("../models/bookinstance");
const { body, validationResult } = require("express-validator");

exports.index = async function (req, res, next) {
  try {
    const book_count = await Book.countDocuments({});
    const book_instance_count = await BookInstance.countDocuments({});
    const book_instance_available_count = await BookInstance.countDocuments({
      status: "Available",
    });
    const author_count = await Author.countDocuments({});
    const genre_count = await Genre.countDocuments({});
    res.render("index", {
      title: "Local Library Home",
      data: {
        book_count,
        book_instance_count,
        book_instance_available_count,
        author_count,
        genre_count,
      },
    });
  } catch (err) {
    next(err);
  }
};

// Display list of all books.
exports.book_list = async function (req, res, next) {
  try {
    const books = await Book.find({}, "title author")
      .sort({ title: 1 })
      .populate("author")
      .exec();
    res.render("book_list", { title: "Book List", books });
  } catch (err) {
    next(err);
  }
};

// Display detail page for a specific book.
exports.book_detail = async function (req, res, next) {
  try {
    const book = await Book.findById(req.params.id)
      .populate("author")
      .populate("genre")
      .exec();

    const book_instance = await BookInstance.find({
      book: req.params.id,
    }).exec();

    if (book === null) {
      // No results.
      const err = new Error("Book not found");
      err.status = 404;
      throw err;
    }

    res.render("book_detail", {
      title: book.title,
      book,
      book_instances: book_instance,
    });
  } catch (err) {
    next(err);
  }
};

// Display book create form on GET.
exports.book_create_get = async function (req, res, next) {
  // Get all authors and genres, which we can use for adding to our book.
  try {
    const authors = await Author.find();
    const genres = await Genre.find();
    res.render("book_form", {
      title: "Create Book",
      authors,
      genres,
    });
  } catch (err) {
    next(err);
  }
};

// Handle book create on POST.
exports.book_create_post = [
  // Convert the genre to an array.
  (req, res, next) => {
    if (!(req.body.genre instanceof Array)) {
      if (typeof req.body.genre === "undefined") req.body.genre = [];
      else req.body.genre = new Array(req.body.genre);
    }
    next();
  },

  // Validate and sanitise fields.
  body("title", "Title must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("author", "Author must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("summary", "Summary must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("isbn", "ISBN must not be empty").trim().isLength({ min: 1 }).escape(),
  body("genre.*").escape(),

  // Process request after validation and sanitization.
  async (req, res, next) => {
    try {
      // Extract the validation errors from a request.
      const errors = validationResult(req);

      // Create a Book object with escaped and trimmed data.
      const book = new Book({
        title: req.body.title,
        author: req.body.author,
        summary: req.body.summary,
        isbn: req.body.isbn,
        genre: req.body.genre,
      });

      if (!errors.isEmpty()) {
        // There are errors. Render form again with sanitized values/error messages.

        // Get all authors and genres for form.
        const authors = await Author.find();
        const genres = await Genre.find();

        // Mark our selected genres as checked.
        for (let i = 0; i < genres.length; i++) {
          if (book.genre.indexOf(genres[i]._id) > -1) {
            genres[i].checked = "true";
          }
        }

        res.render("book_form", {
          title: "Create Book",
          authors,
          genres,
          book,
          errors: errors.array(),
        });
      } else {
        // Data from form is valid. Save book.
        await book.save();
        //successful - redirect to new book record.
        res.redirect(book.url);
      }
    } catch (err) {
      next(err);
    }
  },
];

// Display book delete form on GET.
exports.book_delete_get = async function (req, res, next) {
  try {
    const book = await Book.findById(req.params.id).exec();
    const book_instances = await BookInstance.find({
      book: req.params.id,
    }).exec();

    if (book === null) {
      // No results.
      res.redirect("/catalog/books");
    }
    // Successful, so render.
    res.render("book_delete", {
      title: "Delete Book",
      book,
      book_instances,
    });
  } catch (err) {
    next(err);
  }
};

// Handle book delete on POST.
exports.book_delete_post = async function (req, res, next) {
  try {
    const book = await Book.findById(req.params.id).exec();
    const book_instances = await BookInstance.find({
      book: req.params.id,
    }).exec();

    // Success
    if (book_instances.length > 0) {
      // Author has books. Render in same way as for GET route.
      res.render("book_delete", {
        title: "Delete Book",
        book,
        book_instances,
      });
    } else {
      // Author has no books. Delete object and redirect to the list of authors.
      await Book.findByIdAndRemove(req.body.bookid);
      // Success - go to author list
      res.redirect("/catalog/books");
    }
  } catch (err) {
    next(err);
  }
};

// Display book update form on GET.
exports.book_update_get = async function (req, res, next) {
  try {
    // Get book, authors and genres for form.
    const book = await Book.findById(req.params.id)
      .populate("author")
      .populate("genre")
      .exec();
    const authors = await Author.find();
    const genres = await Genre.find();

    if (book === null) {
      // No results.
      const err = new Error("Book not found");
      err.status = 404;
      throw err;
    }
    // Success.
    // Mark our selected genres as checked.
    for (let all_g_iter = 0; all_g_iter < genres.length; all_g_iter++) {
      for (
        let book_g_iter = 0;
        book_g_iter < book.genre.length;
        book_g_iter++
      ) {
        if (
          genres[all_g_iter]._id.toString() ===
          book.genre[book_g_iter]._id.toString()
        ) {
          genres[all_g_iter].checked = "true";
        }
      }
    }
    res.render("book_form", {
      title: "Update Book",
      authors,
      genres,
      book,
    });
  } catch (err) {
    next(err);
  }
};

// Handle book update on POST.
exports.book_update_post = [
  // Convert the genre to an array
  (req, res, next) => {
    if (!(req.body.genre instanceof Array)) {
      if (typeof req.body.genre === "undefined") req.body.genre = [];
      else req.body.genre = new Array(req.body.genre);
    }
    next();
  },

  // Validate and sanitise fields.
  body("title", "Title must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("author", "Author must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("summary", "Summary must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("isbn", "ISBN must not be empty").trim().isLength({ min: 1 }).escape(),
  body("genre.*").escape(),

  // Process request after validation and sanitization.
  async (req, res, next) => {
    try {
      // Extract the validation errors from a request.
      const errors = validationResult(req);

      // Create a Book object with escaped/trimmed data and old id.
      const book = new Book({
        title: req.body.title,
        author: req.body.author,
        summary: req.body.summary,
        isbn: req.body.isbn,
        genre: typeof req.body.genre === "undefined" ? [] : req.body.genre,
        _id: req.params.id, //This is required, or a new ID will be assigned!
      });

      if (!errors.isEmpty()) {
        // There are errors. Render form again with sanitized values/error messages.

        // Get all authors and genres for form.
        const authors = await Author.find();
        const genres = await Genre.find();

        // Mark our selected genres as checked.
        for (let i = 0; i < genres.length; i++) {
          if (book.genre.indexOf(genres[i]._id) > -1) {
            genres[i].checked = "true";
          }
        }
        res.render("book_form", {
          title: "Update Book",
          authors,
          genres,
          book,
          errors: errors.array(),
        });
      } else {
        // Data from form is valid. Update the record.
        const newBook = await Book.findByIdAndUpdate(req.params.id, book, {});
        // Successful - redirect to book detail page.
        res.redirect(newBook.url);
      }
    } catch (err) {
      next(err);
    }
  },
];
