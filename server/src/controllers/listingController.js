import Joi from 'joi';
import { Listing } from '../models/Listing.js';

// TODO: write a validation schema for create/update per README.md section 2.
const createSchema = Joi.object({
  title: Joi.string().min(2).max(60).required(),
  description: Joi.string().max(500),
  price: Joi.number().min(0).required(),
  category: Joi.string().valid('textbooks', 'electronics', 'furniture', 'clothing', 'other'),
  condition: Joi.string().valid('new', 'like-new', 'used', 'worn'),
  seller: Joi.string().hex().length(24)
  
});

const updateSchema = Joi.object({
  title: Joi.string().min(2).max(60),
  description: Joi.string().max(500),
  price: Joi.number().min(0),
  category: Joi.string().valid('textbooks', 'electronics', 'furniture', 'clothing', 'other'),
  condition: Joi.string().valid('new', 'like-new', 'used', 'worn'),
  seller: Joi.string().hex().length(24)
});

// GET /api/listings
// TODO: implement per README.md section 3.
export async function getAllListings(req, res, next) {
  try {
    const filter = req.query.includeRemoved === 'true'
      ? {}
      : { status: { $ne: 'removed' } };

    const listings = await Listing.find(filter)
      .sort({ createdAt: -1 })
      .populate('seller', 'name email')
      .lean();

    res.json({ listings });
  } catch (err) { next(err); }
}

// GET /api/listings/:id
// TODO: implement per README.md sections 3 and 5.
export async function getListing(req, res, next) {
  try {
    const listing = await Listing.findById(req.params.id)
      .populate('seller', 'name email');
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    res.json({ listing });
  } catch (err) { next(err); }
}

// POST /api/listings
// TODO: implement per README.md section 3.
export async function createListing(req, res, next) {
  try {
    const { value, error } = createSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });

           const listing = await Listing.create(value);
        res.status(201).json({ listing});
  } catch (err) { next(err); }
}

// PATCH /api/listings/:id
// TODO: implement per README.md sections 3 and 5.
export async function updateListing(req, res, next) {
  try {
    const { value, error } = updateSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
        if (error) return res.status(400).json({ message: error.message });
    
        const doc = await Listing.findByIdAndUpdate(req.params.id, { $set: value }, { new: true, runValidators: true });
        if (!doc) return res.status(404).json({ message: 'Listing not found' });
        res.json({ listing: doc });
  } catch (err) { next(err); }
}

// DELETE /api/listings/:id
// TODO: implement per README.md sections 4 and 5.
export async function deleteListing(req, res, next) {
  try {
        const doc = await Listing.findById(req.params.id);
        if (!doc) return res.status(404).json({ message: 'Listing not found' });
        if(doc.status === 'removed') {
            return res.status(400).json({ message: 'Listing is already removed' });
        }
        doc.status = 'removed';
        await doc.save();

        res.json({ listing: doc });
  } catch (err) { next(err); }
}

// PATCH /api/listings/:id/sold
export async function markListingSold(req, res, next) {
  try {
    const doc = await Listing.findByIdAndUpdate(
      req.params.id,
      { $set: { status: 'sold' } },
      { new: true, runValidators: true }
    );
    if (!doc) return res.status(404).json({ message: 'Listing not found' });
    res.json({ listing: doc });
  } catch (err) { next(err); }
}