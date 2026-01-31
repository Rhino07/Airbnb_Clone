const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const listingSchema = new Schema({
    title: {
        type: String,
        required: true,
    },

    description: String,

    image: {
        filename: {
            type: String,
            default: "listingimage",
        },
        url: {
            type: String,
            default:
                "https://images.unsplash.com/photo-1764616683448-322320bce277?auto=format&fit=crop&w=800&q=60",
        },
    },

    price: Number,
    location: String,
    country: String,
    reviews: [{
        type: Schema.Types.ObjectId,
        ref: "Review",
    }]
});

module.exports = mongoose.model("Listing", listingSchema);
