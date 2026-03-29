import { Router, Response } from "express";
import { query } from "../db/pool";
import { authenticateToken, requireRole, AuthRequest } from "../middleware/auth";

const router = Router();

// ─── GET /api/users/:userId ──────────────────────────────────
router.get("/:userId", authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const result = await query(
      `SELECT id, first_name, last_name, phone, email, profile_photo_url,
              wallet_balance, total_rides, average_rating, is_verified, created_at
       FROM users WHERE id = $1 AND is_active = TRUE`,
      [userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error("Get user error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── PUT /api/users/:userId ──────────────────────────────────
router.put("/:userId", authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    if (req.user?.id !== userId && req.user?.role !== "admin") {
      res.status(403).json({ success: false, message: "Unauthorized" });
      return;
    }

    const { firstName, lastName, email, profilePhotoUrl } = req.body;

    const result = await query(
      `UPDATE users
       SET first_name = COALESCE($1, first_name),
           last_name  = COALESCE($2, last_name),
           email      = COALESCE($3, email),
           profile_photo_url = COALESCE($4, profile_photo_url)
       WHERE id = $5
       RETURNING id, first_name, last_name, phone, email, profile_photo_url, wallet_balance`,
      [firstName || null, lastName || null, email || null, profilePhotoUrl || null, userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error("Update user error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── GET /api/users/:userId/rides ────────────────────────────
router.get("/:userId/rides", authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await query(
      `SELECT r.id, r.status, r.pickup_address, r.dropoff_address,
              r.fare_amount, r.payment_method, r.payment_status,
              r.customer_rating, r.distance_km,
              r.requested_at, r.completed_at,
              d.first_name AS driver_first_name,
              d.last_name AS driver_last_name,
              d.plate_number, d.vehicle_model
       FROM rides r
       LEFT JOIN drivers d ON d.id = r.driver_id
       WHERE r.customer_id = $1
       ORDER BY r.requested_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    res.json({ success: true, data: result.rows, total: result.rowCount });
  } catch (err) {
    console.error("Get user rides error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── GET /api/users/:userId/wallet ────────────────────────────
router.get("/:userId/wallet", authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    const balance = await query(
      "SELECT wallet_balance FROM users WHERE id = $1",
      [userId]
    );

    const transactions = await query(
      `SELECT id, type, amount, balance_after, description, created_at
       FROM wallet_transactions
       WHERE owner_id = $1 AND owner_type = 'user'
       ORDER BY created_at DESC
       LIMIT 50`,
      [userId]
    );

    res.json({
      success: true,
      balance: balance.rows[0]?.wallet_balance || 0,
      transactions: transactions.rows,
    });
  } catch (err) {
    console.error("Get wallet error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── GET /api/users/:userId/notifications ─────────────────────
router.get("/:userId/notifications", authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    const result = await query(
      `SELECT id, type, title, message, data, is_read, created_at
       FROM notifications
       WHERE recipient_id = $1 AND recipient_type = 'user'
       ORDER BY created_at DESC
       LIMIT 50`,
      [userId]
    );

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error("Get notifications error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── PATCH /api/users/:userId/notifications/read ──────────────
router.patch("/:userId/notifications/read", authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    await query(
      "UPDATE notifications SET is_read = TRUE WHERE recipient_id = $1 AND recipient_type = 'user'",
      [userId]
    );
    res.json({ success: true, message: "All notifications marked as read" });
  } catch (err) {
    console.error("Mark notifications read error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── GET /api/users (Admin only) ─────────────────────────────
router.get("/", authenticateToken, requireRole("admin"), async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await query(
      `SELECT id, first_name, last_name, phone, email, wallet_balance,
              total_rides, average_rating, is_verified, is_active, created_at
       FROM users ORDER BY created_at DESC`
    );
    res.json({ success: true, data: result.rows, total: result.rowCount });
  } catch (err) {
    console.error("Get all users error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
