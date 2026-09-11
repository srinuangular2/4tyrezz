require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const swaggerSpec = require('./config/swagger');
const { bootstrapRoles } = require('./utils/rbacBootstrap');
const { ensureVehicleCatalog } = require('./services/vehicleDataService');
const { bootstrapLocations } = require('./services/locationService');
const { initSocket } = require('./services/socketService');

const app = express();
const httpServer = http.createServer(app);

app.use(
  cors({
    origin: [process.env.CLIENT_URL, process.env.ADMIN_URL, 'http://localhost:5173', 'http://localhost:5174'].filter(
      Boolean
    ),
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many OTP requests, try again later' },
});

app.get('/api/health', (req, res) => res.json({ ok: true, service: '4tyrezz-api' }));
app.get('/api/docs.json', (_req, res) => res.json(swaggerSpec));
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));

app.use('/api/auth/otp/request', otpLimiter);
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/otp', require('./routes/otpRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/user', require('./routes/userDashboardRoutes'));
app.use('/api/cars', require('./routes/carRoutes'));
app.use('/api/locations', require('./routes/locationRoutes'));
app.use('/api/banners', require('./routes/bannerRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/leads', require('./routes/leadRoutes'));
app.use('/api', require('./routes/referenceRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/meta', require('./routes/metaRoutes'));
app.use('/api/content', require('./routes/contentRoutes'));
app.use('/api/dealers', require('./routes/dealerRoutes'));
app.use('/api/dealer', require('./routes/dealerRoutes'));
app.use('/api/kyc', require('./routes/kycRoutes'));
app.use('/api/test-drives', require('./routes/testDriveRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/commissions', require('./routes/commissionRoutes'));
app.use('/api/valuations', require('./routes/valuationRoutes'));
app.use('/api/valuation', require('./routes/valuationRoutes'));
app.use('/api/vahan', require('./routes/vahanRoutes'));
app.use('/api/compare', require('./routes/compareRoutes'));
app.use('/api/enquiries', require('./routes/enquiryRoutes'));
app.use('/api/finance', require('./routes/financeRoutes'));
app.use('/api/insurance', require('./routes/financeRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/support', require('./routes/supportRoutes'));
app.use('/api/promotions', require('./routes/promotionRoutes'));
app.use('/api/saved-searches', require('./routes/savedSearchRoutes'));
app.use('/api/vehicles', require('./routes/vehicles'));
app.use('/api/ai', require('./routes/aiRoutes'));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
});

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  await bootstrapRoles();
  await ensureVehicleCatalog();
  initSocket(httpServer);
  httpServer.listen(PORT, () => {
    console.log(`4tyrezz API running on http://localhost:${PORT}`);
    console.log(`Swagger docs: http://localhost:${PORT}/api/docs`);
  });
  bootstrapLocations().catch((err) => console.warn('location bootstrap:', err.message));
};

start();
