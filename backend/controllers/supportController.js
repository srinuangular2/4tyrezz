const SupportTicket = require('../models/SupportTicket');

exports.create = async (req, res) => {
  const { name, email, phone, category, subject, message, priority } = req.body;
  if (!name || !subject || !message) {
    return res.status(400).json({ message: 'name, subject, message required' });
  }
  const doc = await SupportTicket.create({
    user: req.user?._id,
    name,
    email,
    phone,
    category,
    subject,
    message,
    priority,
  });
  res.status(201).json({ data: doc });
};

exports.list = async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Number(req.query.limit) || 20);
  const filter = {};
  if (req.user.role === 'customer' || req.user.role === 'dealer') filter.user = req.user._id;
  if (req.query.status) filter.status = req.query.status;

  const [total, data] = await Promise.all([
    SupportTicket.countDocuments(filter),
    SupportTicket.find(filter)
      .populate('user', 'name email')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(limit),
  ]);

  res.json({ data, page, limit, total, totalPages: Math.ceil(total / limit) || 1 });
};

exports.update = async (req, res) => {
  const doc = await SupportTicket.findByIdAndUpdate(
    req.params.id,
    {
      status: req.body.status,
      priority: req.body.priority,
      assignedTo: req.body.assignedTo,
      resolutionNotes: req.body.resolutionNotes,
    },
    { new: true }
  );
  if (!doc) return res.status(404).json({ message: 'Not found' });
  res.json({ data: doc });
};

exports.reply = async (req, res) => {
  const doc = await SupportTicket.findById(req.params.id);
  if (!doc) return res.status(404).json({ message: 'Not found' });
  const body = req.body.body || req.body.message;
  if (!body) return res.status(400).json({ message: 'Reply body required' });
  doc.replies.push({
    author: req.user.name || 'Admin',
    role: 'admin',
    body,
    createdAt: new Date(),
  });
  if (req.body.status) doc.status = req.body.status;
  else if (doc.status === 'open') doc.status = 'in_progress';
  await doc.save();
  if (doc.user) {
    const Notification = require('../models/Notification');
    await Notification.create({
      user: doc.user,
      title: `Reply: ${doc.subject}`,
      body,
      type: 'system',
      link: '/profile/support',
    });
  }
  if (doc.email) {
    console.log(`[admin:email:stub] ${doc.email} — support reply on ${doc.subject}`);
  }
  res.json({ data: doc });
};
