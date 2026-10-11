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
const gender = (value) => ["M", "F"].includes(String(value || "").toUpperCase()) ? String(value).toUpperCase() : null;
const validDate = (value) => !value || /^\d{4}-\d{2}-\d{2}$/.test(String(value));
const childNeeds = (body) => {
  const hasAutism = bool(body.has_autism);
  const hasFoodRestriction = bool(body.has_food_restriction);
  return {
    hasAutism,
    autismType: hasAutism ? text(body.autism_type, 120) : null,
    hasFoodRestriction,
    foodRestrictionNotes: hasFoodRestriction
      ? text(body.food_restriction_notes ?? (!hasAutism ? body.notes : null), 2000)
      : null,
    notes: hasAutism ? text(body.notes, 65535) : null,
  };
};

function ageOnDate(birthDate, now = new Date()) {
  if (!birthDate) return null;
  const birth = new Date(`${String(birthDate).slice(0, 10)}T12:00:00`);
  if (Number.isNaN(birth.getTime()) || birth > now) return null;
  let age = now.getFullYear() - birth.getFullYear();
  if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) age -= 1;
  return age;
}

function roomContainsAge(room, age) {
  const numbers = String(room.age_range || "").match(/\d+/g)?.map(Number) || [];
  if (!numbers.length) return false;
  const min = numbers[0];
  const max = numbers.length > 1 ? numbers[1] : numbers[0];
  return age >= Math.min(min, max) && age <= Math.max(min, max);
}

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
        "UPDATE mykids_checkins SET checked_out_at = COALESCE(checked_out_at, NOW()) WHERE room_id = ? AND checked_out_at IS NULL AND created_at >= CURDATE() AND created_at < CURDATE() + INTERVAL 1 DAY",
        [id]);
      await query(pool, "UPDATE mykids_children SET room_id = NULL WHERE room_id = ?", [id]);
      await query(pool, "UPDATE mykids_room_sessions SET closed_at = COALESCE(closed_at, NOW()) WHERE room_id = ? AND closed_at IS NULL", [id]);
    } else if (req.body.is_open !== undefined && bool(req.body.is_open)) {
      const [activeSession] = await query(pool, "SELECT id FROM mykids_room_sessions WHERE room_id = ? AND closed_at IS NULL LIMIT 1", [id]);
      if (!activeSession) {
        const [openedRoom] = await query(pool, "SELECT name FROM mykids_rooms WHERE id = ?", [id]);
        if (openedRoom) await query(pool, "INSERT INTO mykids_room_sessions (room_id, room_name_snapshot) VALUES (?, ?)", [id, openedRoom.name]);
      }
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
  const guardianGender = gender(req.body.gender);
  const status = req.body.status || "visitante";
  const children = Array.isArray(req.body.children) ? req.body.children : [];
  if (!name || !guardianGender) return res.status(400).json({ erro: "Nome e sexo do responsável são obrigatórios" });
  if (!["visitante", "familia"].includes(status)) return res.status(400).json({ erro: "status inválido" });
  if (!children.length || children.some((child) => !text(child.name, 160) || !gender(child.gender) || !validDate(child.birth_date))) {
    return res.status(400).json({ erro: "Informe ao menos uma criança com dados válidos" });
  }
  const missingRestriction = children.find((child) => {
    const needs = childNeeds(child);
    return needs.hasFoodRestriction && !needs.foodRestrictionNotes;
  });
  if (missingRestriction) {
    return res.status(400).json({ erro: "Informe qual e a restricao alimentar de " + text(missingRestriction.name, 160) });
  }
  const connection = await getConnection().catch((error) => { fail(res, error); return null; });
  if (!connection) return;
  try {
    await begin(connection);
    const guardianResult = await query(connection,
      "INSERT INTO mykids_guardians (name, email, phone, gender, status) VALUES (?, ?, ?, ?, ?)",
      [name, text(req.body.email, 254), text(req.body.phone, 30), guardianGender, status]);
    for (const child of children) {
      const needs = childNeeds(child);
      await query(connection,
        `INSERT INTO mykids_children
         (guardian_id, name, birth_date, gender, has_autism, autism_type, has_food_restriction,
          food_restriction_notes, notes, room_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
        [guardianResult.insertId, text(child.name, 160), child.birth_date || null, gender(child.gender),
         needs.hasAutism, needs.autismType, needs.hasFoodRestriction, needs.foodRestrictionNotes, needs.notes]);
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

exports.updateGuardian = async (req, res) => {
  const id = positiveId(req.params.id);
  if (!id) return res.status(400).json({ erro: "Responsavel invalido" });
  const name = text(req.body.name, 160);
  const guardianGender = gender(req.body.gender);
  const status = req.body.status;
  if (!name || !guardianGender || !["visitante", "familia"].includes(status)) {
    return res.status(400).json({ erro: "Dados do responsavel invalidos" });
  }
  try {
    const result = await query(pool,
      "UPDATE mykids_guardians SET name=?, email=?, phone=?, gender=?, status=? WHERE id=?",
      [name, text(req.body.email, 254), text(req.body.phone, 30), guardianGender, status, id]);
    if (!result.affectedRows) return res.status(404).json({ erro: "Responsavel nao encontrado" });
    const [guardian] = await query(pool, "SELECT * FROM mykids_guardians WHERE id=?", [id]);
    res.json(guardian);
  } catch (error) { fail(res, error); }
};

exports.updateChild = async (req, res) => {
  const id = positiveId(req.params.id);
  const name = text(req.body.name, 160);
  const childGender = gender(req.body.gender);
  if (!id || !name || !childGender || !validDate(req.body.birth_date)) {
    return res.status(400).json({ erro: "Dados da crianca invalidos" });
  }
  const roomId = positiveId(req.body.room_id);
  const needs = childNeeds(req.body);
  if (needs.hasFoodRestriction && !needs.foodRestrictionNotes) {
    return res.status(400).json({ erro: "Informe qual e a restricao alimentar da crianca" });
  }
  try {
    if (roomId) {
      const [room] = await query(pool, "SELECT id FROM mykids_rooms WHERE id=?", [roomId]);
      if (!room) return res.status(400).json({ erro: "Sala nao encontrada" });
    }
    const result = await query(pool,
      `UPDATE mykids_children SET name=?, birth_date=?, gender=?, has_autism=?, autism_type=?,
       has_food_restriction=?, food_restriction_notes=?, notes=?, room_id=? WHERE id=?`,
      [name, req.body.birth_date || null, childGender, needs.hasAutism, needs.autismType,
       needs.hasFoodRestriction, needs.foodRestrictionNotes, needs.notes, roomId, id]);
    if (!result.affectedRows) return res.status(404).json({ erro: "Crianca nao encontrada" });
    const [child] = await query(pool, "SELECT * FROM mykids_children WHERE id=?", [id]);
    res.json(child);
  } catch (error) { fail(res, error); }
};

exports.createChild = async (req, res) => {
  const guardianId = positiveId(req.params.id);
  const name = text(req.body.name, 160);
  const childGender = gender(req.body.gender);
  if (!guardianId || !name || !childGender || !validDate(req.body.birth_date)) {
    return res.status(400).json({ erro: "Dados da crianca invalidos" });
  }
  const needs = childNeeds(req.body);
  if (needs.hasFoodRestriction && !needs.foodRestrictionNotes) {
    return res.status(400).json({ erro: "Informe qual e a restricao alimentar da crianca" });
  }
  try {
    const [guardian] = await query(pool, "SELECT id FROM mykids_guardians WHERE id = ?", [guardianId]);
    if (!guardian) return res.status(404).json({ erro: "Responsavel nao encontrado" });
    const result = await query(pool,
      `INSERT INTO mykids_children
       (guardian_id, name, birth_date, gender, has_autism, autism_type, has_food_restriction,
        food_restriction_notes, notes, room_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
      [guardianId, name, req.body.birth_date || null, childGender, needs.hasAutism,
       needs.autismType, needs.hasFoodRestriction, needs.foodRestrictionNotes, needs.notes]);
    const [child] = await query(pool, "SELECT * FROM mykids_children WHERE id = ?", [result.insertId]);
    res.status(201).json(child);
  } catch (error) { fail(res, error); }
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
    let roomId = requestedRoomId || child.room_id;
    if (!roomId) {
      const age = ageOnDate(child.birth_date);
      if (age === null) { const error = new Error("Informe a data de nascimento para selecionar a sala automaticamente"); error.status = 400; throw error; }
      const openRooms = await query(connection, "SELECT * FROM mykids_rooms WHERE is_open = 1 ORDER BY id FOR UPDATE");
      roomId = openRooms.find((item) => roomContainsAge(item, age))?.id || null;
      if (!roomId) { const error = new Error(`Nenhuma sala aberta atende a idade de ${age} ano(s)`); error.status = 409; throw error; }
    }
    const [room] = await query(connection, "SELECT * FROM mykids_rooms WHERE id = ? AND is_open = 1 FOR UPDATE", [roomId]);
    if (!room) { const error = new Error("Check-in permitido somente em sala aberta"); error.status = 409; throw error; }
    const [activeCheckin] = await query(connection,
      `SELECT id, room_name_snapshot FROM mykids_checkins
       WHERE child_id = ? AND checked_out_at IS NULL
         AND created_at >= CURDATE() AND created_at < CURDATE() + INTERVAL 1 DAY
       LIMIT 1 FOR UPDATE`,
      [childId]);
    if (activeCheckin) {
      const error = new Error(`Esta criança já fez check-in hoje em ${activeCheckin.room_name_snapshot}`);
      error.status = 409;
      throw error;
    }
    const [guardianCheckin] = await query(connection,`SELECT id FROM mykids_checkins WHERE guardian_id = ? AND created_at >= CURDATE() AND created_at < CURDATE() + INTERVAL 1 DAY LIMIT 1`,[guardianId]);
    const [activeSession] = await query(connection, "SELECT id FROM mykids_room_sessions WHERE room_id = ? AND closed_at IS NULL LIMIT 1 FOR UPDATE", [roomId]);
    if (!activeSession) await query(connection, "INSERT INTO mykids_room_sessions (room_id, room_name_snapshot) VALUES (?, ?)", [roomId, room.name]);
    const [sequence] = await query(connection,`SELECT COALESCE(MAX(arrival_number), 0) + 1 AS next_number FROM mykids_checkins WHERE created_at >= CURDATE() AND created_at < CURDATE() + INTERVAL 1 DAY`);
    const publicCode = crypto.randomUUID().replace(/-/g, "");
    const result = await query(connection,
      `INSERT INTO mykids_checkins
       (public_code, guardian_id, child_id, room_id, child_name_snapshot, guardian_name_snapshot,
        guardian_email_snapshot, guardian_phone_snapshot, child_birth_date_snapshot, child_has_autism_snapshot,
        child_autism_type_snapshot, child_has_food_restriction_snapshot,
        child_food_restriction_notes_snapshot, child_notes_snapshot, room_name_snapshot,
        arrival_number, created_by_user_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [publicCode, guardianId, childId, roomId, child.name, child.guardian_name, child.guardian_email,
       child.guardian_phone, child.birth_date, child.has_autism, child.autism_type,
       child.has_food_restriction, child.food_restriction_notes, child.notes, room.name,
       sequence.next_number, positiveId(req.user?.id)]);
    await query(connection, "UPDATE mykids_children SET checkins_count = checkins_count + 1, room_id = ? WHERE id = ?", [roomId, childId]);
    await query(connection,
      `UPDATE mykids_guardians g
       JOIN mykids_children c ON c.guardian_id = g.id
       SET g.status = 'familia'
       WHERE g.id = ? AND c.id = ? AND g.status = 'visitante' AND c.checkins_count > 5`,
      [guardianId, childId]);
    await commit(connection);
    const [checkin] = await query(pool, "SELECT * FROM mykids_checkins WHERE id = ?", [result.insertId]);
    checkin.guardian_label_needed = !guardianCheckin;
    res.status(201).json(checkin);
  } catch (error) {
    await rollback(connection);
    if (error.status) res.status(error.status).json({ erro: error.message }); else fail(res, error);
  } finally { connection.release(); }
};

exports.listTodayCheckins = async (_req, res) => {
  try {
    const rows = await query(pool, "SELECT * FROM mykids_checkins WHERE checked_out_at IS NULL AND created_at >= CURDATE() AND created_at < CURDATE() + INTERVAL 1 DAY ORDER BY arrival_number IS NULL, arrival_number ASC, created_at ASC");
    res.json(rows);
  } catch (error) { fail(res, error); }
};

exports.checkoutCheckin = async (req, res) => {
  const id = positiveId(req.params.id);
  if (!id) return res.status(400).json({ erro: "Check-out invalido" });
  const connection = await getConnection().catch((error) => { fail(res, error); return null; });
  if (!connection) return;
  try {
    await begin(connection);
    const [checkin] = await query(connection,
      "SELECT id, child_id FROM mykids_checkins WHERE id = ? AND checked_out_at IS NULL FOR UPDATE", [id]);
    if (!checkin) {
      await rollback(connection);
      return res.status(404).json({ erro: "Check-in ativo nao encontrado" });
    }
    await query(connection, "UPDATE mykids_checkins SET checked_out_at = NOW() WHERE id = ?", [id]);
    await query(connection, "UPDATE mykids_children SET room_id = NULL WHERE id = ?", [checkin.child_id]);
    await commit(connection);
    res.json({ ok: true });
  } catch (error) {
    await rollback(connection);
    fail(res, error);
  } finally { connection.release(); }
};

exports.getPublicCheckin = async (req, res) => {
  const code = text(req.params.code, 64);
  if (!code) return res.status(400).json({ erro: "Código inválido" });
  try {
    const [checkin] = await query(pool,
      `SELECT id, public_code, guardian_id, child_id, room_id, child_name_snapshot, guardian_name_snapshot,
       guardian_email_snapshot, guardian_phone_snapshot, child_birth_date_snapshot, child_has_autism_snapshot,
       child_autism_type_snapshot, child_has_food_restriction_snapshot,
       child_food_restriction_notes_snapshot, child_notes_snapshot,
       room_name_snapshot, arrival_number, checked_out_at, created_at
       FROM mykids_checkins WHERE public_code = ? LIMIT 1`, [code]);
    if (!checkin) return res.status(404).json({ erro: "Etiqueta não encontrada" });
    checkin.children = await query(pool,
      `SELECT child_id, child_name_snapshot, child_birth_date_snapshot, child_has_autism_snapshot,
       child_autism_type_snapshot, child_has_food_restriction_snapshot,
       child_food_restriction_notes_snapshot, child_notes_snapshot,
       room_name_snapshot, arrival_number, checked_out_at, created_at
       FROM mykids_checkins
       WHERE guardian_id = ? AND created_at >= DATE(?) AND created_at < DATE(?) + INTERVAL 1 DAY
       ORDER BY arrival_number IS NULL, arrival_number ASC, created_at ASC`,
      [checkin.guardian_id, checkin.created_at, checkin.created_at]);
    res.json(checkin);
  } catch (error) { fail(res, error); }
};

exports.getPublicRoomOccupancy = async (_req, res) => {
  try {
    const rooms = await query(
      pool,
      "SELECT id, name, age_range, is_open FROM mykids_rooms ORDER BY id"
    );
    const checkins = await query(
      pool,
      `SELECT ci.id, ci.child_id, ci.room_id, ci.child_name_snapshot, ci.arrival_number,
              CASE
                WHEN ci.child_has_food_restriction_snapshot = 1 OR COALESCE(c.has_food_restriction, 0) = 1
                THEN 1 ELSE 0
              END AS child_has_food_restriction_snapshot,
              COALESCE(NULLIF(c.food_restriction_notes, ''), ci.child_food_restriction_notes_snapshot)
                AS child_food_restriction_notes_snapshot,
              ci.created_at
       FROM mykids_checkins ci
       LEFT JOIN mykids_children c ON c.id = ci.child_id
       WHERE ci.checked_out_at IS NULL
         AND ci.created_at >= CURDATE()
         AND ci.created_at < CURDATE() + INTERVAL 1 DAY
       ORDER BY ci.room_id, ci.arrival_number IS NULL, ci.arrival_number, ci.child_name_snapshot`
    );

    const childrenByRoom = new Map();
    for (const checkin of checkins) {
      const hasFoodRestriction = Boolean(checkin.child_has_food_restriction_snapshot);
      const child = {
        checkin_id: checkin.id,
        child_id: checkin.child_id,
        name: checkin.child_name_snapshot,
        arrival_number: checkin.arrival_number,
        has_food_restriction: hasFoodRestriction,
        food_restriction: hasFoodRestriction
          ? checkin.child_food_restriction_notes_snapshot || null
          : null,
        checked_in_at: checkin.created_at,
      };
      childrenByRoom.set(checkin.room_id, [
        ...(childrenByRoom.get(checkin.room_id) || []),
        child,
      ]);
    }

    const publicRooms = rooms.map((room) => {
      const children = childrenByRoom.get(room.id) || [];
      return {
        id: room.id,
        name: room.name,
        age_range: room.age_range,
        is_open: Boolean(room.is_open),
        quantity: children.length,
        restrictions_count: children.filter((child) => child.has_food_restriction).length,
        children,
      };
    });

    res.set("Cache-Control", "no-store, max-age=0");
    res.json({
      updated_at: new Date().toISOString(),
      total: checkins.length,
      restrictions_total: checkins.filter((checkin) => Boolean(checkin.child_has_food_restriction_snapshot)).length,
      rooms: publicRooms,
    });
  } catch (error) { fail(res, error); }
};

exports.roomCloseAlerts = async (req, res) => {
  try {
    await processRoomAutoClose();
    const userId = positiveId(req.user?.id);
    const rows = await query(pool,
      `SELECT r.id room_id, r.name room_name, MAX(c.created_at) last_checkin_at,
              DATE_ADD(MAX(c.created_at), INTERVAL 130 MINUTE) auto_close_at
       FROM mykids_rooms r
       JOIN mykids_room_sessions s ON s.room_id = r.id AND s.closed_at IS NULL
       JOIN mykids_checkins c ON c.room_id = r.id AND c.created_at >= s.opened_at
       WHERE r.is_open = 1 AND c.created_by_user_id = ?
         AND (s.auto_close_snoozed_until IS NULL OR s.auto_close_snoozed_until <= NOW())
       GROUP BY r.id, r.name
       HAVING MAX(c.created_at) <= NOW() - INTERVAL 120 MINUTE
          AND MAX(c.created_at) > NOW() - INTERVAL 130 MINUTE`, [userId]);
    res.json(rows);
  } catch (error) { fail(res, error); }
};

exports.snoozeRoomClose = async (req, res) => {
  const roomId = positiveId(req.params.id);
  if (!roomId) return res.status(400).json({ erro: "Sala invalida" });
  try {
    await query(pool,
      "UPDATE mykids_room_sessions SET auto_close_snoozed_until = NOW() + INTERVAL 120 MINUTE WHERE room_id = ? AND closed_at IS NULL",
      [roomId]);
    res.json({ ok: true });
  } catch (error) { fail(res, error); }
};

exports.roomHistory = async (_req, res) => {
  try {
    const rows = await query(pool,
      `SELECT s.id, s.room_id, s.room_name_snapshot room_name, s.opened_at, s.closed_at,
              s.closed_automatically, COUNT(DISTINCT c.child_id) children_count
       FROM mykids_room_sessions s
       LEFT JOIN mykids_checkins c ON c.room_id = s.room_id
        AND c.created_at >= s.opened_at AND c.created_at <= s.closed_at
       WHERE s.closed_at IS NOT NULL
       GROUP BY s.id
       ORDER BY s.closed_at DESC
       LIMIT 3`);
    res.json(rows);
  } catch (error) { fail(res, error); }
};

async function processRoomAutoClose() {
  const expired = await query(pool,
    `SELECT r.id FROM mykids_rooms r
     JOIN mykids_room_sessions s ON s.room_id = r.id AND s.closed_at IS NULL
     JOIN mykids_checkins c ON c.room_id = r.id AND c.created_at >= s.opened_at
     WHERE r.is_open = 1 AND (s.auto_close_snoozed_until IS NULL OR s.auto_close_snoozed_until <= NOW()) GROUP BY r.id
     HAVING MAX(c.created_at) <= NOW() - INTERVAL 130 MINUTE`);
  for (const room of expired) {
    await query(pool, "UPDATE mykids_rooms SET is_open = 0 WHERE id = ? AND is_open = 1", [room.id]);
    await query(pool, "UPDATE mykids_checkins SET checked_out_at = COALESCE(checked_out_at, NOW()) WHERE room_id = ? AND checked_out_at IS NULL", [room.id]);
    await query(pool, "UPDATE mykids_children SET room_id = NULL WHERE room_id = ?", [room.id]);
    await query(pool, "UPDATE mykids_room_sessions SET closed_at = COALESCE(closed_at, NOW()), closed_automatically = 1 WHERE room_id = ? AND closed_at IS NULL", [room.id]);
  }
}

exports.startRoomAutoCloseWorker = () => {
  const timer = setInterval(() => processRoomAutoClose().catch((error) => console.error("[MyKids auto-close]", error)), 60_000);
  timer.unref();
};

exports.getPrinterSettings = async (_req, res) => {
  try {
    let [settings] = await query(pool, "SELECT * FROM mykids_printer_settings ORDER BY id LIMIT 1");
    if (settings && !settings.bridge_token) {
      const token = crypto.randomBytes(24).toString("hex");
      await query(pool, "UPDATE mykids_printer_settings SET bridge_token = ? WHERE id = ?", [token, settings.id]);
      settings = { ...settings, bridge_token: token };
    }
    if (settings) {
      settings.bridge_online = Boolean(settings.bridge_last_seen_at && new Date(settings.bridge_last_seen_at).getTime() > Date.now() - 90_000);
      settings.printer_online = settings.bridge_online && Boolean(settings.printer_online);
    }
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

exports.createPrintJob = async (req, res) => {
  const zpl = typeof req.body.zpl === "string" ? req.body.zpl : "";
  if (!zpl.trim() || zpl.length > 1024 * 1024) return res.status(400).json({ erro: "ZPL invalido" });
  try {
    const result = await query(pool,
      "INSERT INTO mykids_print_jobs (zpl, printer_name) VALUES (?, ?)",
      [zpl, text(req.body.printer_name, 160)]);
    res.status(202).json({ ok: true, job_id: result.insertId });
  } catch (error) { fail(res, error); }
};

function validBridgeToken(req, storedToken) {
  const supplied = String(req.headers["x-bridge-token"] || "");
  if (!storedToken || supplied.length !== storedToken.length) return false;
  return crypto.timingSafeEqual(Buffer.from(supplied), Buffer.from(storedToken));
}

exports.claimPrintJob = async (req, res) => {
  const connection = await getConnection().catch(() => null);
  if (!connection) return res.status(503).json({ erro: "Banco indisponivel" });
  let transactionStarted = false;
  try {
    const [settings] = await query(connection, "SELECT bridge_token FROM mykids_printer_settings ORDER BY id LIMIT 1");
    if (!validBridgeToken(req, settings?.bridge_token)) return res.status(401).json({ erro: "Ponte nao autorizada" });
    const body = req.body || {};
    const reportsPrinterStatus = Object.prototype.hasOwnProperty.call(body, "printer_online");
    if (reportsPrinterStatus) {
      await query(connection,
        `UPDATE mykids_printer_settings
         SET bridge_last_seen_at = NOW(), detected_printer_name = ?, printer_online = ?,
             printer_last_error = ?, bridge_version = ?
         ORDER BY id LIMIT 1`,
        [text(body.printer_name, 160), bool(body.printer_online), text(body.printer_error, 500), text(body.bridge_version, 30)]);
      if (!bool(body.printer_online)) return res.status(204).end();
    } else {
      await query(connection, "UPDATE mykids_printer_settings SET bridge_last_seen_at = NOW() ORDER BY id LIMIT 1");
    }
    await begin(connection);
    transactionStarted = true;
    await query(
      connection,
      "UPDATE mykids_print_jobs SET status = 'pending', claimed_at = NULL WHERE status = 'printing' AND claimed_at < NOW() - INTERVAL 2 MINUTE"
    );
    await query(
      connection,
      `UPDATE mykids_print_jobs
       SET status = 'failed', error_message = 'Impressao expirada antes da reconexao', completed_at = NOW()
       WHERE status = 'pending' AND created_at < NOW() - INTERVAL 12 HOUR`
    );
    const [job] = await query(connection,
      "SELECT id, zpl, printer_name FROM mykids_print_jobs WHERE status = 'pending' ORDER BY created_at, id LIMIT 1 FOR UPDATE");
    if (!job) {
      await commit(connection);
      transactionStarted = false;
      return res.status(204).end();
    }
    await query(connection, "UPDATE mykids_print_jobs SET status = 'printing', claimed_at = NOW() WHERE id = ?", [job.id]);
    await commit(connection);
    transactionStarted = false;
    res.json(job);
  } catch (error) {
    if (transactionStarted) await rollback(connection);
    fail(res, error);
  } finally { connection.release(); }
};

exports.completePrintJob = async (req, res) => {
  const id = positiveId(req.params.id);
  if (!id) return res.status(400).json({ erro: "Trabalho invalido" });
  try {
    const [settings] = await query(pool, "SELECT bridge_token FROM mykids_printer_settings ORDER BY id LIMIT 1");
    if (!validBridgeToken(req, settings?.bridge_token)) return res.status(401).json({ erro: "Ponte nao autorizada" });
    const succeeded = req.body.ok === true;
    const retry = !succeeded && req.body.retry === true;
    await query(pool,
      `UPDATE mykids_printer_settings
       SET bridge_last_seen_at = NOW(), detected_printer_name = COALESCE(?, detected_printer_name),
           printer_online = ?, printer_last_error = ?
       ORDER BY id LIMIT 1`,
      [text(req.body.printer_name, 160), succeeded, succeeded ? null : text(req.body.error, 500)]);
    if (retry) {
      await query(pool,
        "UPDATE mykids_print_jobs SET status = 'pending', error_message = ?, claimed_at = NULL, completed_at = NULL WHERE id = ? AND status = 'printing'",
        [text(req.body.error, 500), id]);
    } else {
      await query(pool,
        "UPDATE mykids_print_jobs SET status = ?, error_message = ?, completed_at = NOW() WHERE id = ? AND status = 'printing'",
        [succeeded ? "printed" : "failed", succeeded ? null : text(req.body.error, 500), id]);
    }
    res.json({ ok: true });
  } catch (error) { fail(res, error); }
};



