const Banner = require('../models/Banner');

// Public: only active banners, in display order — this is what the customer
// hero carousel fetches directly.
exports.listActive = async (req, res) => {
  const banners = await Banner.find({ isActive: true }).sort('order').populate('car', 'title');
  res.json(banners);
};

// Admin: everything, including inactive, for the management table.
exports.listAll = async (req, res) => {
  const banners = await Banner.find().sort('order').populate('car', 'title');
  res.json(banners);
};

async function nextOrderBase() {
  const last = await Banner.findOne().sort('-order').select('order');
  return last ? (Number(last.order) || 0) + 1 : 0;
}

function headingFields(body) {
  const titleLine1 = body.titleLine1 ?? body.title ?? '';
  const titleLine2 = body.titleLine2 ?? '';
  return { title: titleLine1, titleLine1, titleLine2 };
}

exports.create = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Banner image is required' });
  const { subtitle, ctaLabel, linkType, car, url, order, isActive } = req.body;
  const banner = await Banner.create({
    image: `/uploads/banners/${req.file.filename}`,
    ...headingFields(req.body), subtitle, ctaLabel,
    linkType: linkType || 'none',
    car: linkType === 'car' ? car || null : null,
    url: linkType === 'url' ? url || '' : '',
    order: order !== undefined && order !== '' ? Number(order) || 0 : await nextOrderBase(),
    isActive: isActive === 'true' || isActive === true,
  });
  res.status(201).json(banner);
};

// Upload several images at once — creates one Banner document per image,
// sharing the same title/subtitle/link settings, with sequential order
// values so they slot in one after another. Lets an admin populate the
// whole slider in a single submission instead of one image at a time.
exports.createBulk = async (req, res) => {
  if (!req.files?.length) return res.status(400).json({ message: 'At least one image is required' });
  const { subtitle, ctaLabel, linkType, car, url, order, isActive } = req.body;
  const baseOrder = order !== undefined && order !== '' ? Number(order) || 0 : await nextOrderBase();
  const headings = headingFields(req.body);

  const banners = await Banner.insertMany(
    req.files.map((file, i) => ({
      image: `/uploads/banners/${file.filename}`,
      ...headings, subtitle, ctaLabel,
      linkType: linkType || 'none',
      car: linkType === 'car' ? car || null : null,
      url: linkType === 'url' ? url || '' : '',
      order: baseOrder + i,
      isActive: isActive === 'true' || isActive === true,
    }))
  );
  res.status(201).json(banners);
};

exports.reorder = async (req, res) => {
  const ids = Array.isArray(req.body?.ids) ? req.body.ids.filter(Boolean) : [];
  if (!ids.length) return res.status(400).json({ message: 'ids required' });

  await Promise.all(ids.map((id, i) => Banner.updateOne({ _id: id }, { $set: { order: i } })));
  const banners = await Banner.find().sort('order').populate('car', 'title');
  res.json(banners);
};

exports.update = async (req, res) => {
  const banner = await Banner.findById(req.params.id);
  if (!banner) return res.status(404).json({ message: 'Banner not found' });

  const { title, titleLine1, titleLine2, subtitle, ctaLabel, linkType, car, url, order, isActive } = req.body;
  if (req.file) banner.image = `/uploads/banners/${req.file.filename}`;
  if (title !== undefined || titleLine1 !== undefined) {
    const headings = headingFields(req.body);
    banner.title = headings.title;
    banner.titleLine1 = headings.titleLine1;
  }
  if (titleLine2 !== undefined) banner.titleLine2 = titleLine2;
  if (subtitle !== undefined) banner.subtitle = subtitle;
  if (ctaLabel !== undefined) banner.ctaLabel = ctaLabel;
  if (linkType !== undefined) banner.linkType = linkType;
  if (order !== undefined) banner.order = Number(order) || 0;
  if (isActive !== undefined) banner.isActive = isActive === 'true' || isActive === true;
  banner.car = linkType === 'car' ? car || null : null;
  banner.url = linkType === 'url' ? url || '' : '';

  await banner.save();
  res.json(banner);
};

exports.remove = async (req, res) => {
  const banner = await Banner.findByIdAndDelete(req.params.id);
  if (!banner) return res.status(404).json({ message: 'Banner not found' });
  res.json({ success: true });
};
