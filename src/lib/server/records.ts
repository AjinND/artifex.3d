import { models, model, Schema } from "mongoose";
const owner = { type: Schema.Types.ObjectId, required: true, index: true };
const line = new Schema(
  {
    productId: String,
    name: String,
    photo: String,
    material: String,
    dimensions: String,
    leadDays: Number,
    pricePaise: Number,
    quantity: Number,
  },
  { _id: false },
);
export const Order =
  models.PrintOrder ||
  model(
    "PrintOrder",
    new Schema(
      {
        owner,
        key: { type: String, unique: true },
        lines: [line],
        address: String,
        pin: String,
        subtotal: Number,
        tax: Number,
        shipping: Number,
        total: Number,
        payment: { type: String, default: "pending" },
        providerOrder: { type: String, unique: true, sparse: true },
        providerPayment: { type: String, unique: true, sparse: true },
        creatingAt: Date,
        fulfillment: { type: String, default: "awaiting production" },
        carrier: String,
        tracking: String,
        mailId: String,
        mailState: String,
        mailText: String,
        lease: Date,
      },
      { timestamps: true },
    ),
  );
export const Quote =
  models.PrintQuote ||
  model(
    "PrintQuote",
    new Schema(
      {
        owner,
        title: String,
        brief: String,
        quantity: Number,
        product: String,
        attachments: [String],
        state: { type: String, default: "submitted" },
        version: { type: Number, default: 0 },
        amount: Number,
        scope: String,
        leadDays: Number,
        offers: {
          type: [
            {
              version: Number,
              scope: String,
              amount: Number,
              leadDays: Number,
              expires: Date,
              issuedBy: Schema.Types.ObjectId,
            },
          ],
          default: [],
        },
        expires: Date,
        issuedBy: Schema.Types.ObjectId,
        mailId: String,
        mailState: String,
        mailText: String,
        lease: Date,
      },
      { timestamps: true },
    ),
  );
export const Enquiry =
  models.Enquiry ||
  model(
    "Enquiry",
    new Schema(
      {
        email: String,
        name: String,
        message: String,
        reply: String,
        repliedBy: Schema.Types.ObjectId,
        mailState: { type: String, default: "pending" },
        replyState: String,
        lease: Date,
      },
      { timestamps: true },
    ),
  );
export const Upload =
  models.PrivateUpload ||
  model(
    "PrivateUpload",
    new Schema(
      {
        owner,
        key: String,
        name: String,
        bytes: Number,
        storage: { type: String, enum: ["s3", "local"], default: "s3" },
        state: { type: String, default: "selected" },
        lease: Date,
        versionId: String,
        quote: Schema.Types.ObjectId,
      },
      { timestamps: true },
    ),
  );
export const Recovery =
  models.Recovery ||
  model(
    "Recovery",
    new Schema(
      {
        _id: String,
        owner,
        email: String,
        expiresAt: { type: Date, expires: 0 },
        mailState: String,
        lease: Date,
      },
      { timestamps: true },
    ),
  );
export const Audit =
  models.StaffEvent ||
  model(
    "StaffEvent",
    new Schema(
      { actor: Schema.Types.ObjectId, resource: String, action: String },
      { timestamps: true },
    ),
  );
