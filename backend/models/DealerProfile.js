const mongoose = require('mongoose');

const DOCUMENT_TYPES = [
  'gst_certificate',
  'pan_card',
  'aadhaar',
  'business_registration',
  'address_proof',
  'cancelled_cheque',
  'dealer_photo',
  'other',
];

const KYC_STATUSES = [
  'not_started',
  'draft',
  'PENDING_KYC_APPROVAL',
  'PENDING_ADMIN_APPROVAL',
  'submitted',
  'under_review',
  'approved',
  'rejected',
];

const BUSINESS_TYPES = ['Proprietorship', 'Pvt Ltd', 'Private Limited', 'Partnership', 'LLP', 'Other'];
const ONBOARDING_STATUSES = ['IN_PROGRESS', 'PENDING_ADMIN_APPROVAL', 'APPROVED', 'REJECTED'];

/** Fields the dealer must fill before the profile can go to the review queue. */
const REQUIRED_FIELDS = [
  'businessName',
  'businessType',
  'gstNumber',
  'panNumber',
  'addressLine1',
  'city',
  'state',
  'pincode',
  'contactPerson',
  'contactPhone',
  'bankAccountName',
  'bankAccountNumber',
  'bankIfsc',
];

/** Documents the ops team needs on file before approving a dealer. */
const REQUIRED_DOCUMENT_TYPES = ['gst_certificate', 'pan_card', 'address_proof'];

const documentSchema = new mongoose.Schema(
  {
    type: { type: String, enum: DOCUMENT_TYPES, default: 'other' },
    url: { type: String, required: true },
    originalName: { type: String, default: '' },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const dealerProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },

    businessName: { type: String, default: '', trim: true },
    legalEntityName: { type: String, default: '', trim: true },
    businessType: { type: String, enum: [...BUSINESS_TYPES, ''], default: '' },

    gstNumber: { type: String, default: '', trim: true, uppercase: true },
    panNumber: { type: String, default: '', trim: true, uppercase: true },
    gstVerified: { type: Boolean, default: false },
    panVerified: { type: Boolean, default: false },
    gstVerifiedAt: { type: Date, default: null },
    panVerifiedAt: { type: Date, default: null },
    kycVerified: { type: Boolean, default: false, index: true },
    mobileVerified: { type: Boolean, default: false },
    aadhaarNumber: { type: String, default: '', trim: true },

    addressLine1: { type: String, default: '', trim: true },
    addressLine2: { type: String, default: '', trim: true },
    city: { type: String, default: '', trim: true },
    state: { type: String, default: '', trim: true },
    pincode: { type: String, default: '', trim: true },
    geo: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
    googlePlaceId: { type: String, default: '', trim: true },
    operatingHours: { type: mongoose.Schema.Types.Mixed, default: {} },
    about: { type: String, default: '', trim: true },

    bankAccountName: { type: String, default: '', trim: true },
    bankAccountNumber: { type: String, default: '', trim: true },
    bankIfsc: { type: String, default: '', trim: true, uppercase: true },
    bankName: { type: String, default: '', trim: true },

    salesReps: {
      type: [
        {
          name: { type: String, default: '', trim: true },
          email: { type: String, default: '', trim: true },
          phone: { type: String, default: '', trim: true },
          active: { type: Boolean, default: true },
        },
      ],
      default: [],
    },

    contactPerson: { type: String, default: '', trim: true },
    contactPhone: { type: String, default: '', trim: true },
    contactEmail: { type: String, default: '', trim: true, lowercase: true },

    documents: { type: [documentSchema], default: [] },

    onboardingStatus: {
      type: String,
      enum: ONBOARDING_STATUSES,
      default: 'IN_PROGRESS',
      index: true,
    },
    onboardingStep: { type: Number, default: 1 },
    kycStatus: { type: String, enum: KYC_STATUSES, default: 'not_started', index: true },
    rejectionReason: { type: String, default: '' },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date, default: null },
    submittedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/** Share of required fields + required document types that are on file. */
dealerProfileSchema.virtual('completionPercent').get(function computeCompletion() {
  const uploadedTypes = new Set((this.documents || []).map((d) => d.type));
  const checks = [
    ...REQUIRED_FIELDS.map((f) => Boolean(this[f])),
    ...REQUIRED_DOCUMENT_TYPES.map((t) => uploadedTypes.has(t)),
  ];
  const done = checks.filter(Boolean).length;
  return Math.round((done / checks.length) * 100);
});

/** Names of everything still outstanding — powers the submit-time validation. */
dealerProfileSchema.methods.missingRequirements = function missingRequirements() {
  const uploadedTypes = new Set((this.documents || []).map((d) => d.type));
  return {
    fields: REQUIRED_FIELDS.filter((f) => !this[f]),
    documents: REQUIRED_DOCUMENT_TYPES.filter((t) => !uploadedTypes.has(t)),
  };
};

module.exports = mongoose.model('DealerProfile', dealerProfileSchema);
module.exports.DOCUMENT_TYPES = DOCUMENT_TYPES;
module.exports.KYC_STATUSES = KYC_STATUSES;
module.exports.BUSINESS_TYPES = BUSINESS_TYPES;
module.exports.REQUIRED_FIELDS = REQUIRED_FIELDS;
module.exports.REQUIRED_DOCUMENT_TYPES = REQUIRED_DOCUMENT_TYPES;
module.exports.ONBOARDING_STATUSES = ONBOARDING_STATUSES;
