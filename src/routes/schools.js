const express = require('express');
const Joi = require('joi');
const pool = require('../db');

const router = express.Router();

// Validation schema for adding a school
const schoolSchema = Joi.object({
  name: Joi.string().trim().min(1).max(255).required(),
  address: Joi.string().trim().min(1).max(500).required(),
  latitude: Joi.number().required().min(-90).max(90),
  longitude: Joi.number().required().min(-180).max(180)
});

// Helper: calculate distance using Haversine formula (km)
function haversineDistance(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// POST /addSchool
router.post('/addSchool', async (req, res) => {
  try {
    const { error, value } = schoolSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });

    const { name, address, latitude, longitude } = value;
    const sql = 'INSERT INTO schools (name, address, latitude, longitude) VALUES (?, ?, ?, ?)';
    const [result] = await pool.query(sql, [name, address, latitude, longitude]);

    return res.status(201).json({ success: true, data: { id: result.insertId, name, address, latitude, longitude } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/listSchools', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lon = parseFloat(req.query.lon);

    if (Number.isNaN(lat) || Number.isNaN(lon)) {
      return res.status(400).json({
        success: false,
        message: 'Query params lat and lon are required and must be valid numbers'
      });
    }

    // Fetch schools
    const [rows] = await pool.query(
      'SELECT id, name, address, latitude, longitude FROM schools'
    );

    if (!rows || rows.length === 0) {
      return res.json({ success: true, count: 0, data: [] });
    }

    // Map with safe parsing + null checks
    const schoolsWithDistance = rows.map((r) => {
      const schoolLat = parseFloat(r.latitude);
      const schoolLon = parseFloat(r.longitude);

      let distance_km = null;
      if (!Number.isNaN(schoolLat) && !Number.isNaN(schoolLon)) {
        distance_km = haversineDistance(lat, lon, schoolLat, schoolLon);
      }

      return {
        ...r,
        latitude: schoolLat,
        longitude: schoolLon,
        distance_km
      };
    });

    // Sort by distance, keeping nulls at the end
    schoolsWithDistance.sort((a, b) => {
      if (a.distance_km === null) return 1;
      if (b.distance_km === null) return -1;
      return a.distance_km - b.distance_km;
    });

    return res.json({
      success: true,
      count: schoolsWithDistance.length,
      data: schoolsWithDistance
    });
  } catch (err) {
    console.error('Error in /listSchools:', err);
    return res.status(500).json({
      success: false,
      message: err.message,
      stack: err.stack
    });
  }
});


module.exports = router;


// const express = require('express');
// const router = express.Router();
// const Joi = require('joi');
// const pool = require('../db');

// // Validation schema
// const schoolSchema = Joi.object({
//   name: Joi.string().trim().min(1).max(255).required(),
//   address: Joi.string().trim().min(1).max(500).required(),
//   latitude: Joi.number().required(),
//   longitude: Joi.number().required()
// });

// // Haversine distance (km)
// function haversineDistance(lat1, lon1, lat2, lon2) {
//   const toRad = (deg) => (deg * Math.PI) / 180;
//   const R = 6371; // Earth's radius in km
//   const dLat = toRad(lat2 - lat1);
//   const dLon = toRad(lon2 - lon1);
//   const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//             Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
//             Math.sin(dLon / 2) * Math.sin(dLon / 2);
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// // POST /addSchool
// router.post('/addSchool', async (req, res) => {
//   try {
//     const { error, value } = schoolSchema.validate(req.body);
//     if (error) return res.status(400).json({ error: error.details[0].message });

//     const { name, address, latitude, longitude } = value;

//     const [result] = await pool.query(
//       'INSERT INTO schools (name, address, latitude, longitude) VALUES (?, ?, ?, ?)',
//       [name, address, latitude, longitude]
//     );

//     const inserted = {
//       id: result.insertId,
//       name,
//       address,
//       latitude,
//       longitude
//     };

//     res.status(201).json({ message: 'School added successfully', school: inserted });
//   } catch (err) {
//     console.error('Error in /addSchool', err);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });

// // GET /listSchools?lat=..&lng=..
// router.get('/listSchools', async (req, res) => {
//   try {
//     const lat = parseFloat(req.query.lat);
//     const lng = parseFloat(req.query.lng);

//     if (Number.isNaN(lat) || Number.isNaN(lng)) {
//       return res.status(400).json({ error: 'Please provide valid lat and lng query parameters' });
//     }

//     const [rows] = await pool.query('SELECT id, name, address, latitude, longitude, created_at FROM schools');

//     const withDistance = rows.map((s) => {
//       const distance_km = haversineDistance(lat, lng, Number(s.latitude), Number(s.longitude));
//       return { ...s, distance_km: Number(distance_km.toFixed(3)) };
//     });

//     withDistance.sort((a, b) => a.distance_km - b.distance_km);

//     res.json({ count: withDistance.length, schools: withDistance });
//   } catch (err) {
//     console.error('Error in /listSchools', err);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });

// module.exports = router;
