const crypto = require("crypto");
const pool = require("../config/mysql.config");

const query = (executor, sql, params = []) =>
  new Promise((resolve, reject) => executor.query(sql, params, (error, rows) => error ? reject(error) : resolve(rows)));
const begin = (connection) => new Promise((resolve, reject) => connection.beginTransaction((e) => e ? reject(e) : resolve()));
const commit = (connection) => new Promise((resolve, reject) => connection.commit((e) => e ? reject(e) : resolve()));
const rollback = (connection) => new Promise((resolve) => connection.rollback(resolve));
const getConnection = () => new Promise((resolve, reject) => pool.getConnection((e, connection) => e ? reject(e) : resolve(connection)));

const text = (value, max) => {
  if (value === undefined || value === null || value === "") return null;
  return String(value).trim().slice(0, max);
};
const positiveId = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};
const bool = (value) => value === true || value === 1 || value === "1" || value === "true";
const validDate = (value) => !value || /^\d{4}-\d{2}-\d{2}$/.test(String(value));

function fail(res, error) {
  console.error("[MyKids]", error);
  if (error?.code === "ER_DUP_ENTRY") return res.status(409).json({ erro: "Registro duplicado" });
  return res.status(500).json({ erro: "Erro interno ao processar MyKids" });
}

exports.listRooms = async (_req, res) => {
  try {
    const rows = await query(pool, "SELECT * FROM mykids_rooms ORDER BY name");
    res.json(rows);
  } catch (error) { fail(res, error); }
};

exports.createRoom = async (req, res) => {
  const name = text(req.body.name, 120);
  const ageRange = text(req.body.age_range, 80);
  if (!name || !ageRange) return res.status(400).json({ erro: "name e age_range são obrigatórios" });
  try {
    const result = await query(pool,
      "INSERT INTO mykids_rooms (name, age_range, is_open) VALUES (?, ?, ?)",
      [name, ageRange, req.body.is_open === undefined ? 1 : bool(req.body.is_open)]);
    const [room] = await query(pool, "SELECT * FROM mykids_rooms WHERE id = ?", [result.insertId]);
    res.status(201).json(room);
  } catch (error) { fail(res, error); }
};

exports.updateRoom = async (req, res) => {
  const id = positiveId(req.params.id);
  if (!id) return res.status(400).json({ erro: "Sala inválida" });
  const fields = [];
  const values = [];
  if (req.body.name !== undefined) { const v = text(req.body.name, 120); if (!v) return res.status(400).json({ erro: "name inválido" }); fields.push("name = ?"); values.push(v); }
  if (req.body.age_range !== undefined) { const v = text(req.body.age_range, 80); if (!v) return res.status(400).json({ erro: "age_range inválido" }); fields.push("age_range = ?"); values.push(v); }
  if (req.body.is_open !== undefined) { fields.push("is_open = ?"); values.push(bool(req.body.is_open)); }
  if (!fields.length) return res.status(400).json({ erro: "Nenhum campo para atualizar" });
  try {
    const closingRoom = req.body.is_open !== undefined && !bool(req.body.is_open);
    const result = await query(pool, `UPDATE mykids_rooms SET ${fields.join(", ")} WHERE id = ?`, [...values, id]);
    if (!result.affectedRows) return res.status(404).json({ erro: "Sala não encontrada" });
    if (closingRoom) {
      await query(pool,
        "DELETE FROM mykids_checkins WHERE room_id = ? AND created_at >= CURDATE() AND created_at < CURDATE() + INTERVAL 1 DAY",
        [id]);
      await query(pool, "UPDATE mykids_children SET room_id = NULL WHERE room_id = ?", [id]);
    }
    const [room] = await query(pool, "SELECT * FROM mykids_rooms WHERE id = ?", [id]);
    res.json(room);
  } catch (error) { fail(res, error); }
};

exports.listGuardians = async (req, res) => {
  const search = text(req.query.search, 120);
  try {
    const where = search ? "WHERE g.name LIKE ? OR g.email LIKE ? OR g.phone LIKE ?" : "";
    const params = search ? Array(3).fill(`%${search}%`) : [];
    const guardians = await query(pool, `SELECT g.* FROM mykids_guardians g ${where} ORDER BY g.name`, params);
    if (!guardians.length) return res.json([]);
    const ids = guardians.map((g) => g.id);
    const children = await query(pool,
      `SELECT c.*, r.name AS room_name FROM mykids_children c LEFT JOIN mykids_rooms r ON r.id = c.room_id WHERE c.guardian_id IN (?) ORDER BY c.name`, [ids]);
    const byGuardian = new Map();
    children.forEach((child) => byGuardian.set(child.guardian_id, [...(byGuardian.get(child.guardian_id) || []), child]));
    res.json(guardians.map((guardian) => ({ ...guardian, children: byGuardian.get(guardian.id) || [] })));
  } catch (error) { fail(res, error); }
};

exports.createGuardian = async (req, res) => {
  const name = text(req.body.name, 160);
  const status = req.body.status || "visitante";
  const children = Array.isArray(req.body.children) ? req.body.children : [];
  if (!name) return res.status(400).json({ erro: "Nome do responsável é obrigatório" });
  if (!["visitante", "familia"].includes(status)) return res.status(400).json({ erro: "status inválido" });
  if (!children.length || children.some((child) => !text(child.name, 160) || !validDate(child.birth_date))) {
    return res.status(400).json({ erro: "Informe ao menos uma criança com dados válidos" });
  }
  const connection = await getConnection().catch((error) => { fail(res, error); return null; });
  if (!connection) return;
  try {
    await begin(connection);
    const guardianResult = await query(connection,
      "INSERT INTO mykids_guardians (name, email, phone, status) VALUES (?, ?, ?, ?)",
      [name, text(req.body.email, 254), text(req.body.phone, 30), status]);
    for (const child of children) {
      const roomId = positiveId(child.room_id);
      if (roomId) {
        const rooms = await query(connection, "SELECT id FROM mykids_rooms WHERE id = ?", [roomId]);
        if (!rooms.length) { const error = new Error("Sala não encontrada"); error.status = 400; throw error; }
      }
      await query(connection,
        "INSERT INTO mykids_children (guardian_id, name, birth_date, gender, notes, room_id) VALUES (?, ?, ?, ?, ?, ?)",
        [guardianResult.insertId, text(child.name, 160), child.birth_date || null, text(child.gender, 30), text(child.notes, 65535), roomId]);
    }
    await commit(connection);
    req.query.search = String(guardianResult.insertId);
    const [guardian] = await query(pool, "SELECT * FROM mykids_guardians WHERE id = ?", [guardianResult.insertId]);
    guardian.children = await query(pool, "SELECT * FROM mykids_children WHERE guardian_id = ? ORDER BY name", [guardian.id]);
    res.status(201).json(guardian);
  } catch (error) {
    await rollback(connection);
    if (error.status) res.status(error.status).json({ erro: error.message }); else fail(res, error);
  } finally { connection.release(); }
};

exports.createCheckin = async (req, res) => {
  const guardianId = positiveId(req.body.guardian_id);
  const childId = positiveId(req.body.child_id);
  const requestedRoomId = positiveId(req.body.room_id);
  if (!guardianId || !childId) return res.status(400).json({ erro: "guardian_id e child_id são obrigatórios" });
  const connection = await getConnection().catch((error) => { fail(res, error); return null; });
  if (!connection) return;
  try {
    await begin(connection);
    const [child] = await query(connection,
      `SELECT c.*, g.name guardian_name, g.email guardian_email, g.phone guardian_phone, g.status guardian_status
       FROM mykids_children c JOIN mykids_guardians g ON g.id = c.guardian_id
       WHERE c.id = ? AND c.guardian_id = ? FOR UPDATE`, [childId, guardianId]);
    if (!child) { const error = new Error("Criança não pertence ao responsável informado"); error.status = 404; throw error; }
    const roomId = requestedRoomId || child.room_id;
    if (!roomId) { const error = new Error("Selecione uma sala"); error.status = 400; throw error; }
    const [room] = await query(connection, "SELECT * FROM mykids_rooms WHERE id = ? AND is_open = 1 FOR UPDATE", [roomId]);
    if (!room) { const error = new Error("Check-in permitido somente em sala aberta"); error.status = 409; throw error; }
    const [activeCheckin] = await query(connection,
      `SELECT id, room_name_snapshot FROM mykids_checkins
       WHERE child_id = ? AND created_at >= CURDATE() AND created_at < CURDATE() + INTERVAL 1 DAY
       LIMIT 1 FOR UPDATE`,
      [childId]);
    if (activeCheckin) {
      const error = new Error(`Esta criança já fez check-in hoje em ${activeCheckin.room_name_snapshot}`);
      error.status = 409;
      throw error;
    }
    const publicCode = crypto.randomUUID().replace(/-/g, "");
    const result = await query(connection,
      `INSERT INTO mykids_checkins
       (public_code, guardian_id, child_id, room_id, child_name_snapshot, guardian_name_snapshot,
        guardian_email_snapshot, guardian_phone_snapshot, child_birth_date_snapshot, child_notes_snapshot, room_name_snapshot)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [publicCode, guardianId, childId, roomId, child.name, child.guardian_name, child.guardian_email,
       child.guardian_phone, child.birth_date, child.notes, room.name]);
    await query(connection, "UPDATE mykids_children SET checkins_count = checkins_count + 1, room_id = ? WHERE id = ?", [roomId, childId]);
    await query(connection,
      `UPDATE mykids_guardians g
       JOIN mykids_children c ON c.guardian_id = g.id
       SET g.status = 'familia'
       WHERE g.id = ? AND c.id = ? AND g.status = 'visitante' AND c.checkins_count > 5`,
      [guardianId, childId]);
    await commit(connection);
    const [checkin] = await query(pool, "SELECT * FROM mykids_checkins WHERE id = ?", [result.insertId]);
    res.status(201).json(checkin);
  } catch (error) {
    await rollback(connection);
    if (error.status) res.status(error.status).json({ erro: error.message }); else fail(res, error);
  } finally { connection.release(); }
};

exports.listTodayCheckins = async (_req, res) => {
  try {
    const rows = await query(pool, "SELECT * FROM mykids_checkins WHERE created_at >= CURDATE() AND created_at < CURDATE() + INTERVAL 1 DAY ORDER BY created_at DESC");
    res.json(rows);
  } catch (error) { fail(res, error); }
};

exports.getPublicCheckin = async (req, res) => {
  const code = text(req.params.code, 64);
  if (!code) return res.status(400).json({ erro: "Código inválido" });
  try {
    const [checkin] = await query(pool,
      `SELECT public_code, child_name_snapshot, guardian_name_snapshot, guardian_email_snapshot,
       guardian_phone_snapshot, child_birth_date_snapshot, child_notes_snapshot, room_name_snapshot, created_at
       FROM mykids_checkins WHERE public_code = ? LIMIT 1`, [code]);
    if (!checkin) return res.status(404).json({ erro: "Etiqueta não encontrada" });
    res.json(checkin);
  } catch (error) { fail(res, error); }
};

exports.getPrinterSettings = async (_req, res) => {
  try {
    const [settings] = await query(pool, "SELECT * FROM mykids_printer_settings ORDER BY id LIMIT 1");
    res.json(settings || null);
  } catch (error) { fail(res, error); }
};

exports.updatePrinterSettings = async (req, res) => {
  const width = Number(req.body.label_width);
  const height = Number(req.body.label_height);
  if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0) {
    return res.status(400).json({ erro: "Dimensões da etiqueta inválidas" });
  }
  try {
    const [current] = await query(pool, "SELECT id FROM mykids_printer_settings ORDER BY id LIMIT 1");
    if (current) {
      await query(pool, "UPDATE mykids_printer_settings SET printer_name = ?, bridge_url = ?, label_width = ?, label_height = ?, is_active = ? WHERE id = ?",
        [text(req.body.printer_name, 160), text(req.body.bridge_url, 500), width, height, bool(req.body.is_active), current.id]);
    } else {
      await query(pool, "INSERT INTO mykids_printer_settings (printer_name, bridge_url, label_width, label_height, is_active) VALUES (?, ?, ?, ?, ?)",
        [text(req.body.printer_name, 160), text(req.body.bridge_url, 500), width, height, bool(req.body.is_active)]);
    }
    const [settings] = await query(pool, "SELECT * FROM mykids_printer_settings ORDER BY id LIMIT 1");
    res.json(settings);
  } catch (error) { fail(res, error); }
};

