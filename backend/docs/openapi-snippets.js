/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     security: []
 *     summary: Dealer/Admin email login
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: JWT + user
 * /cars:
 *   get:
 *     tags: [Cars]
 *     security: []
 *     summary: Search/filter cars
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: brand
 *         schema: { type: string }
 *       - in: query
 *         name: minPrice
 *         schema: { type: number }
 *     responses:
 *       200:
 *         description: Paginated cars
 * /compare:
 *   get:
 *     tags: [Compare]
 *     security: []
 *     summary: Compare up to 3 cars
 *     parameters:
 *       - in: query
 *         name: ids
 *         schema: { type: string }
 *         description: Comma-separated car ids
 * /valuations/estimate:
 *   post:
 *     tags: [Valuations]
 *     security: []
 *     summary: Estimate vehicle value range
 * /bookings:
 *   post:
 *     tags: [Bookings]
 *     summary: Create booking + Razorpay order
 * /dealers:
 *   get:
 *     tags: [Dealers]
 *     security: []
 *     summary: List public dealers
 */
module.exports = {};
