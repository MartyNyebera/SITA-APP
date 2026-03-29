import { Router, Response } from "express";
import { query } from "../db/pool";
import { authenticateToken, requireRole, AuthRequest } from "../middleware/auth";

const router = Router();

// ─── GET /api/admin/dashboard ────────────────────────────────
router.get("/dashboard", authenticateToken, requireRole("admin"), async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [users, drivers, rides, revenue] = await Promise.all([
      query("SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE is_active) ::int AS active FROM users"),
      query("SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE is_online)::int AS online, COUNT(*) FILTER (WHERE verification_status = 'pending')::int AS pending FROM drivers"),
      query(`SELECT COUNT(*)::int AS total,
               COUNT(*) FILTER (WHERE status = 'completed')::int AS completed,
               COUNT(*) FILTER (WHERE status = 'cancelled')::int AS cancelled,
               COUNT(*) FILTER (WHERE requested_at >= CURRENT_DATE)::int AS today
             FROM rides`),
      query("SELECT COALESCE(SUM(platform_fee), 0) AS total_revenue, COALESCE(SUM(platform_fee) FILTER (WHERE processed_at >= CURRENT_DATE), 0) AS today_revenue FROM payments WHERE status = 'completed'"),
    ]);

    res.json({
      success: true,
      data: {
        users: users.rows[0],
        drivers: drivers.rows[0],
        rides: rides.rows[0],
        revenue: revenue.rows[0],
      },
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── GET /api/admin/pending-verifications ────────────────────
router.get("/pending-verifications", authenticateToken, requireRole("admin"), async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await query(`SELECT * FROM pending_verifications_view ORDER BY applied_at DESC`);
    res.json({ success: true, data: result.rows, total: result.rowCount });
  } catch (err) {
    console.error("Pending verifications error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── PATCH /api/admin/verify-driver ──────────────────────────
router.patch("/verify-driver", authenticateToken, requireRole("admin"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { driverId, action, rejectionReason } = req.body;

    if (!driverId || !["approve", "reject"].includes(action)) {
      res.status(400).json({ success: false, message: "driverId and action (approve/reject) required" });
      return;
    }

    const newStatus = action === "approve" ? "approved" : "rejected";

    await query(
      `UPDATE drivers SET verification_status = $1 WHERE id = $2`,
      [newStatus, driverId]
    );

    await query(
      `UPDATE driver_documents
       SET status = $1, rejection_reason = $2, reviewed_by = $3, reviewed_at = NOW()
       WHERE driver_id = $4 AND document_type = 'license'`,
      [newStatus, rejectionReason || null, req.user!.id, driverId]
    );

    const driver = await query(
      "SELECT first_name, last_name, phone FROM drivers WHERE id = $1",
      [driverId]
    );

    const notifTitle = action === "approve" ? "Application Approved!" : "Application Update";
    const notifMsg = action === "approve"
      ? "Congrats! Your SITA driver application has been approved. You can now go online and accept rides."
      : `Your driver application was not approved. Reason: ${rejectionReason || "Please contact support."}`;

    await query(
      `INSERT INTO notifications (recipient_id, recipient_type, type, title, message)
       VALUES ($1, 'driver', 'verification', $2, $3)`,
      [driverId, notifTitle, notifMsg]
    );

    await query(
      `INSERT INTO audit_logs (actor_id, actor_type, action, target_type, target_id, details)
       VALUES ($1, 'admin', $2, 'driver', $3, $4)`,
      [req.user!.id, `driver_${newStatus}`, driverId, JSON.stringify({ rejectionReason })]
    );

    res.json({ success: true, message: `Driver ${newStatus}`, driver: driver.rows[0] });
  } catch (err) {
    console.error("Verify driver error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── GET /api/admin/users ─────────────────────────────────────
router.get("/users", authenticateToken, requireRole("admin"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const search = req.query.search as string;

    let sql = `SELECT id, first_name, last_name, phone, email,
                 wallet_balance, total_rides, average_rating,
                 is_verified, is_active, created_at
               FROM users`;
    const params: unknown[] = [];

    if (search) {
      sql += ` WHERE first_name ILIKE $1 OR last_name ILIKE $1 OR phone ILIKE $1 OR email ILIKE $1`;
      params.push(`%${search}%`);
    }

    sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await query(sql, params);
    res.json({ success: true, data: result.rows, total: result.rowCount });
  } catch (err) {
    console.error("Get all users error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── GET /api/admin/drivers ───────────────────────────────────
router.get("/drivers", authenticateToken, requireRole("admin"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const status = req.query.status as string;

    let sql = `SELECT id, first_name, last_name, phone, email,
                 plate_number, vehicle_model, vehicle_color,
                 verification_status, is_online, is_active,
                 total_rides, total_earnings, average_rating, created_at
               FROM drivers`;
    const params: unknown[] = [];

    if (status) {
      sql += ` WHERE verification_status = $1`;
      params.push(status);
    }

    sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await query(sql, params);
    res.json({ success: true, data: result.rows, total: result.rowCount });
  } catch (err) {
    console.error("Get all drivers error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── PATCH /api/admin/users/:userId/suspend ───────────────────
router.patch("/users/:userId/suspend", authenticateToken, requireRole("admin"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { suspend, reason } = req.body;

    await query(
      "UPDATE users SET is_active = $1 WHERE id = $2",
      [!suspend, userId]
    );

    await query(
      `INSERT INTO audit_logs (actor_id, actor_type, action, target_type, target_id, details)
       VALUES ($1, 'admin', $2, 'user', $3, $4)`,
      [req.user!.id, suspend ? "user_suspended" : "user_reactivated", userId, JSON.stringify({ reason })]
    );

    res.json({ success: true, message: suspend ? "User suspended" : "User reactivated" });
  } catch (err) {
    console.error("Suspend user error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── GET /api/admin/rides ─────────────────────────────────────
router.get("/rides", authenticateToken, requireRole("admin"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const status = req.query.status as string;

    let sql = `SELECT * FROM ride_details_view`;
    const params: unknown[] = [];

    if (status) {
      sql += ` WHERE status = $1`;
      params.push(status);
    }

    sql += ` ORDER BY requested_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await query(sql, params);
    res.json({ success: true, data: result.rows, total: result.rowCount });
  } catch (err) {
    console.error("Get all rides error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── GET /api/admin/audit-logs ───────────────────────────────
router.get("/audit-logs", authenticateToken, requireRole("admin"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await query(
      `SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    res.json({ success: true, data: result.rows, total: result.rowCount });
  } catch (err) {
    console.error("Get audit logs error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
