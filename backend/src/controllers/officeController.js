const { query } = require('../config/db');

// GET /api/offices
const getOffices = async (req, res) => {
  try {
    const { type, city } = req.query;
    let sql = `SELECT id, name, type, city, district, state, address, phone, email, google_map_url, working_hours, lunch_break, is_active FROM offices WHERE is_active = true`;
    const params = [];
    if (type) { params.push(type); sql += ` AND type = $${params.length}`; }
    if (city) { params.push(city); sql += ` AND LOWER(city) = LOWER($${params.length})`; }
    sql += ' ORDER BY type, name';
    const result = await query(sql, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch offices', error: err.message });
  }
};

// GET /api/offices/:id
const getOfficeById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT o.*, 
        (SELECT COUNT(*) FROM services s WHERE s.office_id = o.id AND s.is_active = true) as service_count,
        (SELECT COUNT(*) FROM employees e WHERE e.office_id = o.id AND e.is_active = true) as employee_count
       FROM offices o WHERE o.id = $1`,
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Office not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch office', error: err.message });
  }
};

// GET /api/offices/:id/services
const getOfficeServices = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT * FROM services WHERE office_id = $1 AND is_active = true ORDER BY category, name`,
      [id]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch services', error: err.message });
  }
};

// GET /api/services/:id
const getServiceById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT s.*, o.name as office_name, o.address as office_address, o.phone as office_phone, o.working_hours, o.google_map_url
       FROM services s JOIN offices o ON s.office_id = o.id WHERE s.id = $1`,
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Service not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch service', error: err.message });
  }
};

// POST /api/offices (Admin only)
const createOffice = async (req, res) => {
  try {
    const { name, type, city, district, state, country, address, phone, email, google_map_url, working_hours, lunch_break } = req.body;
    const result = await query(
      `INSERT INTO offices (name, type, city, district, state, country, address, phone, email, google_map_url, working_hours, lunch_break)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [name, type, city || 'Kakinada', district || 'Kakinada', state || 'Andhra Pradesh', country || 'India',
       address, phone, email, google_map_url,
       working_hours || '{"monday":"10:00-17:00","tuesday":"10:00-17:00","wednesday":"10:00-17:00","thursday":"10:00-17:00","friday":"10:00-17:00","saturday":"10:00-13:00","sunday":"closed"}',
       lunch_break || '{"start":"13:00","end":"14:00"}']
    );
    res.status(201).json({ success: true, data: result.rows[0], message: 'Office created successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create office', error: err.message });
  }
};

// PUT /api/offices/:id (Admin only)
const updateOffice = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, phone, email, google_map_url, working_hours, lunch_break, is_active } = req.body;
    const result = await query(
      `UPDATE offices SET name=COALESCE($1,name), address=COALESCE($2,address), phone=COALESCE($3,phone),
       email=COALESCE($4,email), google_map_url=COALESCE($5,google_map_url),
       working_hours=COALESCE($6,working_hours), lunch_break=COALESCE($7,lunch_break),
       is_active=COALESCE($8,is_active)
       WHERE id=$9 RETURNING *`,
      [name, address, phone, email, google_map_url, working_hours ? JSON.stringify(working_hours) : null,
       lunch_break ? JSON.stringify(lunch_break) : null, is_active, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Office not found' });
    res.json({ success: true, data: result.rows[0], message: 'Office updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update office', error: err.message });
  }
};

// POST /api/offices/:id/services (Admin only)
const createService = async (req, res) => {
  try {
    const { id: officeId } = req.params;
    const { name, category, fees, fees_description, eligibility, processing_time, documents_required, steps, faqs, description } = req.body;
    const result = await query(
      `INSERT INTO services (office_id, name, description, category, fees, fees_description, eligibility, processing_time, documents_required, steps, faqs)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [officeId, name, description, category, fees || 0, fees_description, eligibility, processing_time,
       JSON.stringify(documents_required || []), JSON.stringify(steps || []), JSON.stringify(faqs || [])]
    );
    res.status(201).json({ success: true, data: result.rows[0], message: 'Service created successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create service', error: err.message });
  }
};

module.exports = { getOffices, getOfficeById, getOfficeServices, getServiceById, createOffice, updateOffice, createService };
