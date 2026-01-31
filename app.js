require("dotenv").config();
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Listing = require("./models/listing.js");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressErrors = require("./utils/ExpressErrors.js");
const { listingSchema, reviewSchema } = require("./schema.js");
const Review = require("./models/review.js");


const mongo_url = process.env.MONGO_URI;

async function main() {
    await mongoose.connect(mongo_url);
}

main()
    .then(() => {
        console.log("connected to DB");
    })
    .catch((err) => {
        console.log(err);
    });

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.engine("ejs", ejsMate);

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

const validateListing = (req, res, next) => {
    let { error } = listingSchema.validate(req.body);
    if (error) {
        let errMsg = error.details.map((el) => el.message).join("");
        throw new ExpressErrors(400, errMsg);
    } else {
        next();
    }
}

validateReview = (req, res, next) => {
    let { error } = reviewSchema.validate(req.body);
    if (error) {
        let errMsg = error.details.map((el) => el.message).join("");
        throw new ExpressErrors(400, errMsg);
    } else {
        next();
    }
};

// Home
app.get("/", async (req, res) => {
    const allListings = await Listing.find({});
    res.render("listings/index.ejs", { allListings });
});

// Index
app.get("/listings", async (req, res) => {
    const allListings = await Listing.find({});
    res.render("listings/index.ejs", { allListings });
});

// New
app.get("/listings/new", (req, res) => {
    res.render("listings/new.ejs");
});

// Show
app.get(
    "/listings/:id",
    wrapAsync(async (req, res) => {
        const { id } = req.params;
        const listing = await Listing.findById(id).populate("reviews");
        res.render("listings/show.ejs", { listing });
    })
);

// Create
app.post(
    "/listings", validateListing,
    wrapAsync(async (req, res) => {
        const newListing = new Listing(req.body.listing);
        await newListing.save();
        res.redirect("/listings");
    })
);

// Edit
app.get(
    "/listings/:id/edit",
    wrapAsync(async (req, res) => {
        const { id } = req.params;
        const listing = await Listing.findById(id);
        res.render("listings/edit.ejs", { listing });
    })
);

// Update 
app.put(
    "/listings/:id", validateListing,
    wrapAsync(async (req, res) => {
        const { id } = req.params;
        await Listing.findByIdAndUpdate(
            id, { ...req.body.listing }
        );
        res.redirect(`/listings/${id}`);
    })
);

// Delete
app.delete(
    "/listings/:id",
    wrapAsync(async (req, res) => {
        const { id } = req.params;
        await Listing.findByIdAndDelete(id);
        res.redirect("/listings");
    })
);

// Reviews - POST route
app.post("/listings/:id/reviews", validateReview, wrapAsync(async (req, res) => {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
        return res.status(404).send("Listing not found");
    }

    const newReview = new Review(req.body.review);

    listing.reviews.push(newReview);

    await newReview.save();
    await listing.save();

    console.log("New review saved");
    res.redirect(`/listings/${listing._id}`);
}));

// DELETE Review
app.delete("/listings/:id/reviews/:reviewId", async (req, res) => {
    const { id, reviewId } = req.params;

    // remove review reference from listing
    await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });

    // delete review document
    await Review.findByIdAndDelete(reviewId);

    res.redirect(`/listings/${id}`);
});


// 404 handler
app.use((req, res, next) => {
    next(new ExpressErrors(404, "Page Not Found!!"));
});

// Global error handler
app.use((err, req, res, next) => {
    let { statusCode = 500, message = "Something went wrong" } = err;

    if (err.name === "ValidationError") {
        statusCode = 400;
        message = err.message;
    }

    res.status(statusCode).render("error.ejs", { statusCode, message });
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});
