import { Router, Response } from "express";
import { query } from "../db/pool";
import { authenticateToken, requireRole, AuthRequest } from "../middleware/auth";

const router = Router();

// ─── GET /api/drivers/active ─────────────────────────────────
router.get("/active", authenticateToken, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await query(`SELECT * FROM active_drivers_view`);
    res.json({ success: true, data: result.rows, total: result.rowCount });
  } catch (err) {
    console.error("Get active drivers error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── GET /api/drivers/:driverId ──────────────────────────────
router.get("/:driverId", authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { driverId } = req.params;
    const result = await query(
      `SELECT id, first_name, last_name, phone, email, profile_photo_url,
              plate_number, vehicle_model, vehicle_color,
              verification_status, is_online, current_latitude, current_longitude,
              total_rides, total_earnings, average_rating, created_at
       FROM drivers WHERE id = $1 AND is_active = TRUE`,
      [driverId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: "Driver not found" });
      return;
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error("Get driver error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── PUT /api/drivers/:driverId ──────────────────────────────
router.put("/:driverId", authenticateToken, requireRole("driver", "admin"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { driverId } = req.params;

    if (req.user?.id !== driverId && req.user?.role !== "admin") {
      res.status(403).json({ success: false, message: "Unauthorized" });
      return;
    }

    const { firstName, lastName, email, profilePhotoUrl, vehicleModel, vehicleColor } = req.body;

    const result = await query(
      `UPDATE drivers
       SET first_name = COALESCE($1, first_name),
           last_name  = COALESCE($2, last_name),
           email      = COALESCE($3, email),
           profile_photo_url = COALESCE($4, profile_photo_url),
           vehicle_model = COALESCE($5, vehicle_model),
           vehicle_color = COALESCE($6, vehicle_color)
       WHERE id = $7
       RETURNING id, first_name, last_name, phone, email, plate_number, vehicle_model, vehicle_color`,
      [firstName || null, lastName || null, email || null, profilePhotoUrl || null, vehicleModel || null, vehicleColor || null, driverId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: "Driver not found" });
      return;
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error("Update driver error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── PATCH /api/drivers/:driverId/location ───────────────────
router.patch("/:driverId/location", authenticateToken, requireRole("driver"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { driverId } = req.params;
    const { latitude, longitude, speed, heading, rideId } = req.body;

    if (latitude === undefined || longitude === undefined) {
      res.status(400).json({ success: false, message: "Latitude and longitude required" });
      return;
    }

    await query(
      `UPDATE drivers
       SET current_latitude = $1,
           current_longitude = $2,
           location_updated_at = NOW()
       WHERE id = $3`,
      [latitude, longitude, driverId]
    );

    await query(
      `INSERT INTO driver_locations (driver_id, ride_id, latitude, longitude, speed, heading)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [driverId, rideId || null, latitude, longitude, speed || null, heading || null]
    );

    res.json({ success: true, message: "Location updated" });
  } catch (err) {
    console.error("Update driver location error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── PATCH /api/drivers/:driverId/status ─────────────────────
router.patch("/:driverId/status", authenticateToken, requireRole("driver"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { driverId } = req.params;
    const { isOnline } = req.body;

    if (isOnline === undefined) {
      res.status(400).json({ success: false, message: "isOnline field required" });
      return;
    }

    const result = await query(
      `UPDATE drivers SET is_online = $1 WHERE id = $2
       RETURNING id, is_online, first_name, last_name`,
      [isOnline, driverId]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error("Update driver status error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── GET /api/drivers/:driverId/rides ────────────────────────
router.get("/:driverId/rides", authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { driverId } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await query(
      `SELECT r.id, r.status, r.pickup_address, r.dropoff_address,
              r.fare_amount, r.payment_status, r.distance_km,
              r.driver_rating, r.requested_at, r.completed_at,
              u.first_name AS customer_first_name,
              u.last_name AS customer_last_name,
              u.phone AS customer_phone
       FROM rides r
       JOIN users u ON u.id = r.customer_id
       WHERE r.driver_id = $1
       ORDER BY r.requested_at DESC
       LIMIT $2 OFFSET $3`,
      [driverId, limit, offset]
    );

    res.json({ success: true, data: result.rows, total: result.rowCount });
  } catch (err) {
    console.error("Get driver rides error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── GET /api/drivers/:driverId/earnings ─────────────────────
router.get("/:driverId/earnings", authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { driverId } = req.params;
    const { period } = req.query;

    let dateFilter = "";
    if (period === "today") dateFilter = "AND r.completed_at >= CURRENT_DATE";
    else if (period === "week") dateFilter = "AND r.completed_at >= CURRENT_DATE - INTERVAL '7 days'";
    else if (period === "month") dateFilter = "AND r.completed_at >= CURRENT_DATE - INTERVAL '30 days'";

    const result = await query(
      `SELECT
         COUNT(*)::int AS total_rides,
         COALESCE(SUM(p.driver_payout), 0) AS total_earnings,
         COALESCE(AVG(r.driver_rating), 0) AS average_rating
       FROM rides r
       LEFT JOIN payments p ON p.ride_id = r.id
       WHERE r.driver_id = $1 AND r.status = 'completed' ${dateFilter}`,
      [driverId]
    );

    const transactions = await query(
      `SELECT id, type, amount, balance_after, description, created_at
       FROM wallet_transactions
       WHERE owner_id = $1 AND owner_type = 'driver'
       ORDER BY created_at DESC LIMIT 50`,
      [driverId]
    );

    res.json({
      success: true,
      summary: result.rows[0],
      transactions: transactions.rows,
    });
  } catch (err) {
    console.error("Get driver earnings error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
