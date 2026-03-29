import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { query } from "../db/pool";
import { authenticateToken, AuthRequest } from "../middleware/auth";
import { sendOTPEmail } from "../services/emailService";

const router = Router();

// ─── Helpers ────────────────────────────────────────────────
function signToken(id: string, role: "user" | "driver" | "admin"): string {
  const secret = process.env.JWT_SECRET || "fallback_secret";
  return jwt.sign({ id, role }, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  } as jwt.SignOptions);
}

// ─── POST /api/auth/customer/register ───────────────────────
router.post("/customer/register", async (req: Request, res: Response): Promise<void> => {
  try {
    const { firstName, lastName, phone, email, password } = req.body;

    if (!firstName || !lastName || !phone || !password) {
      res.status(400).json({ success: false, message: "Missing required fields" });
      return;
    }

    const existing = await query(
      "SELECT id FROM users WHERE phone = $1 OR email = $2",
      [phone, email || null]
    );
    if (existing.rows.length > 0) {
      res.status(409).json({ success: false, message: "Phone or email already registered" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await query(
      `INSERT INTO users (first_name, last_name, phone, email, password_hash)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, first_name, last_name, phone, email`,
      [firstName, lastName, phone, email || null, passwordHash]
    );

    const user = result.rows[0];
    const token = signToken(user.id, "user");

    await query(
      `INSERT INTO audit_logs (actor_id, actor_type, action, target_type, target_id, details)
       VALUES ($1, 'user', 'register', 'user', $1, $2)`,
      [user.id, JSON.stringify({ phone })]
    );

    res.status(201).json({ success: true, token, user });
  } catch (err) {
    console.error("Customer register error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── POST /api/auth/customer/login ──────────────────────────
router.post("/customer/login", async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      res.status(400).json({ success: false, message: "Phone and password required" });
      return;
    }

    const result = await query(
      "SELECT * FROM users WHERE phone = $1 AND is_active = TRUE",
      [phone]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ success: false, message: "Invalid credentials" });
      return;
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      res.status(401).json({ success: false, message: "Invalid credentials" });
      return;
    }

    const token = signToken(user.id, "user");
    const { password_hash: _, ...safeUser } = user;

    res.json({ success: true, token, user: safeUser });
  } catch (err) {
    console.error("Customer login error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── POST /api/auth/driver/register ─────────────────────────
router.post("/driver/register", async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      firstName, lastName, phone, email, password,
      plateNumber, vehicleModel, vehicleColor, licenseUrl,
    } = req.body;

    if (!firstName || !lastName || !phone || !password || !plateNumber || !vehicleModel || !vehicleColor) {
      res.status(400).json({ success: false, message: "Missing required fields" });
      return;
    }

    const existing = await query(
      "SELECT id FROM drivers WHERE phone = $1 OR plate_number = $2",
      [phone, plateNumber]
    );
    if (existing.rows.length > 0) {
      res.status(409).json({ success: false, message: "Phone or plate number already registered" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await query(
      `INSERT INTO drivers
         (first_name, last_name, phone, email, password_hash, plate_number, vehicle_model, vehicle_color, license_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, first_name, last_name, phone, email, plate_number, vehicle_model, vehicle_color, verification_status`,
      [firstName, lastName, phone, email || null, passwordHash, plateNumber, vehicleModel, vehicleColor, licenseUrl || null]
    );

    const driver = result.rows[0];

    if (licenseUrl) {
      await query(
        `INSERT INTO driver_documents (driver_id, document_type, file_url, status)
         VALUES ($1, 'license', $2, 'pending')`,
        [driver.id, licenseUrl]
      );
    }

    const token = signToken(driver.id, "driver");

    await query(
      `INSERT INTO audit_logs (actor_id, actor_type, action, target_type, target_id, details)
       VALUES ($1, 'driver', 'register', 'driver', $1, $2)`,
      [driver.id, JSON.stringify({ phone, plateNumber })]
    );

    res.status(201).json({ success: true, token, driver });
  } catch (err) {
    console.error("Driver register error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── POST /api/auth/driver/login ─────────────────────────────
router.post("/driver/login", async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      res.status(400).json({ success: false, message: "Phone and password required" });
      return;
    }

    const result = await query(
      "SELECT * FROM drivers WHERE phone = $1 AND is_active = TRUE",
      [phone]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ success: false, message: "Invalid credentials" });
      return;
    }

    const driver = result.rows[0];
    const valid = await bcrypt.compare(password, driver.password_hash);
    if (!valid) {
      res.status(401).json({ success: false, message: "Invalid credentials" });
      return;
    }

    const token = signToken(driver.id, "driver");
    const { password_hash: _, ...safeDriver } = driver;

    res.json({ success: true, token, driver: safeDriver });
  } catch (err) {
    console.error("Driver login error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── POST /api/auth/admin/login ──────────────────────────────
router.post("/admin/login", async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    const result = await query(
      "SELECT * FROM admins WHERE (username = $1 OR email = $1) AND is_active = TRUE",
      [username]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ success: false, message: "Invalid credentials" });
      return;
    }

    const admin = result.rows[0];
    const valid = await bcrypt.compare(password, admin.password_hash);
    if (!valid) {
      res.status(401).json({ success: false, message: "Invalid credentials" });
      return;
    }

    await query("UPDATE admins SET last_login = NOW() WHERE id = $1", [admin.id]);

    const token = signToken(admin.id, "admin");
    const { password_hash: _, ...safeAdmin } = admin;

    res.json({ success: true, token, admin: safeAdmin });
  } catch (err) {
    console.error("Admin login error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── POST /api/auth/send-otp ─────────────────────────────────
router.post("/send-otp", async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, purpose = "signup" } = req.body;
    if (!email) {
      res.status(400).json({ success: false, message: "Email is required" });
      return;
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await query(
      `UPDATE otp_verifications SET is_used = TRUE
       WHERE phone = $1 AND purpose = $2 AND is_used = FALSE`,
      [email, purpose]
    );

    await query(
      `INSERT INTO otp_verifications (phone, otp_code, purpose, expires_at)
       VALUES ($1, $2, $3, $4)`,
      [email, otp, purpose, expiresAt]
    );

    let name = "User";
    const userResult = await query(
      "SELECT first_name FROM users WHERE email = $1 UNION SELECT first_name FROM drivers WHERE email = $1 LIMIT 1",
      [email]
    );
    if (userResult.rows.length > 0) name = userResult.rows[0].first_name;

    await sendOTPEmail(email, otp, name);

    res.json({ success: true, message: "OTP sent to email" });
  } catch (err) {
    console.error("Send OTP error:", err);
    res.status(500).json({ success: false, message: "Failed to send OTP" });
  }
});

// ─── POST /api/auth/verify-otp ───────────────────────────────
router.post("/verify-otp", async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp, purpose = "signup" } = req.body;
    if (!email || !otp) {
      res.status(400).json({ success: false, message: "Email and OTP required" });
      return;
    }

    const result = await query(
      `SELECT * FROM otp_verifications
       WHERE phone = $1 AND otp_code = $2 AND purpose = $3
         AND is_used = FALSE AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [email, otp, purpose]
    );

    if (result.rows.length === 0) {
      res.status(400).json({ success: false, message: "Invalid or expired OTP" });
      return;
    }

    await query(
      "UPDATE otp_verifications SET is_used = TRUE WHERE id = $1",
      [result.rows[0].id]
    );

    await query(
      "UPDATE users SET is_verified = TRUE WHERE email = $1",
      [email]
    );
    await query(
      "UPDATE drivers SET verification_status = 'approved' WHERE email = $1 AND verification_status = 'pending'",
      [email]
    );

    res.json({ success: true, message: "OTP verified successfully" });
  } catch (err) {
    console.error("Verify OTP error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── GET /api/auth/me ────────────────────────────────────────
router.get("/me", authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id, role } = req.user!;
    let result;

    if (role === "user") {
      result = await query(
        "SELECT id, first_name, last_name, phone, email, profile_photo_url, wallet_balance, total_rides, average_rating, is_verified FROM users WHERE id = $1",
        [id]
      );
    } else if (role === "driver") {
      result = await query(
        "SELECT id, first_name, last_name, phone, email, plate_number, vehicle_model, vehicle_color, verification_status, is_online, total_rides, total_earnings, average_rating FROM drivers WHERE id = $1",
        [id]
      );
    } else {
      result = await query(
        "SELECT id, username, email, full_name, role FROM admins WHERE id = $1",
        [id]
      );
    }

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: "Account not found" });
      return;
    }

    res.json({ success: true, data: result.rows[0], role });
  } catch (err) {
    console.error("Get me error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
