import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  ensureSchemaAndSeed,
  getPool,
  isDatabaseConfigured,
  mapDonationRow,
  mapDonorRow,
  mapNgoRow,
  mapRequestRow,
  resetDatabaseToSeed,
} from './server/db.ts';
import type {
  DonationStatus,
  DonorType,
  FoodCategory,
  LocationZone,
} from './src/types/foodbridge.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ALLOWED_CATEGORIES: readonly FoodCategory[] = [
  'Cooked Meals',
  'Fresh Produce',
  'Bakery & Bread',
  'Dairy & Beverages',
  'Packaged & Dry',
];

const ALLOWED_DONOR_TYPES: readonly DonorType[] = [
  'Restaurant',
  'Hotel',
  'Event Organizer',
  'Campus Mess',
  'Individual',
];

const ALLOWED_ZONES: readonly LocationZone[] = [
  'North Campus',
  'City Center',
  'East Market',
  'South Hub',
  'West Tech Park',
];

const ALLOWED_STATUS_UPDATES: readonly DonationStatus[] = [
  'Available',
  'Rejected',
  'In Transit',
  'Delivered',
];

function nowTimestamp(): string {
  return new Date().toISOString().slice(0, 16).replace('T', ' ');
}

function cleanString(val: unknown, maxLen = 200): string {
  if (typeof val !== 'string') return '';
  return val.trim().slice(0, maxLen);
}

function requireDb(_req: Request, res: Response): boolean {
  if (!isDatabaseConfigured()) {
    res.status(503).json({
      error: 'DATABASE_URL is not configured in Settings > Secrets.',
    });
    return false;
  }
  return true;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  // Health & DB connectivity check
  app.get('/api/health', async (_req, res) => {
    if (!isDatabaseConfigured()) {
      res.status(200).json({
        configured: false,
        connected: false,
        message: 'DATABASE_URL is not configured in Settings > Secrets.',
      });
      return;
    }

    try {
      const db = getPool();
      await db.query('SELECT 1');
      res.status(200).json({ configured: true, connected: true });
    } catch {
      res.status(503).json({
        configured: true,
        connected: false,
        message: 'Unable to reach PostgreSQL database. Check connection settings.',
      });
    }
  });

  // Bootstrap full application state from PostgreSQL
  app.get('/api/bootstrap', async (req, res) => {
    if (!requireDb(req, res)) return;
    try {
      await ensureSchemaAndSeed();
      const db = getPool();
      const [donationsRes, requestsRes, donorsRes, ngosRes] = await Promise.all([
        db.query('SELECT * FROM donations ORDER BY created_at DESC, id DESC'),
        db.query('SELECT * FROM food_requests ORDER BY created_at DESC, id DESC'),
        db.query('SELECT * FROM donors ORDER BY joined_date DESC, id DESC'),
        db.query('SELECT * FROM ngos ORDER BY joined_date ASC, id ASC'),
      ]);

      res.json({
        donations: donationsRes.rows.map(mapDonationRow),
        requests: requestsRes.rows.map(mapRequestRow),
        donors: donorsRes.rows.map(mapDonorRow),
        ngos: ngosRes.rows.map(mapNgoRow),
      });
    } catch {
      res.status(500).json({ error: 'Failed to load data from PostgreSQL.' });
    }
  });

  // Create a new surplus donation
  app.post('/api/donations', async (req, res) => {
    if (!requireDb(req, res)) return;
    try {
      await ensureSchemaAndSeed();
      const body = req.body as Record<string, unknown>;

      const foodName = cleanString(body.foodName, 160);
      const category = body.category as FoodCategory;
      const quantityKg = Math.round(Number(body.quantityKg));
      const expiryHours = Number(body.expiryHours);
      const pickupLocation = cleanString(body.pickupLocation, 240);
      const zone = body.zone as LocationZone;
      const donorName = cleanString(body.donorName, 160);
      const donorType = body.donorType as DonorType;
      const contactName = cleanString(body.contactName, 120);
      const contactPhone = cleanString(body.contactPhone, 40);
      const storageNote =
        cleanString(body.storageNote, 240) || 'Sealed clean food-grade containers';

      if (
        !foodName ||
        !pickupLocation ||
        !donorName ||
        !contactName ||
        !contactPhone ||
        !ALLOWED_CATEGORIES.includes(category) ||
        !ALLOWED_DONOR_TYPES.includes(donorType) ||
        !ALLOWED_ZONES.includes(zone) ||
        !Number.isFinite(quantityKg) ||
        quantityKg <= 0 ||
        quantityKg > 10000 ||
        !Number.isFinite(expiryHours) ||
        expiryHours < 0.5 ||
        expiryHours > 720
      ) {
        res.status(400).json({ error: 'Invalid donation fields provided.' });
        return;
      }

      const id = `don-${Date.now()}`;
      const servingsEstimate = Math.max(1, Math.round(quantityKg * 3));
      const expiryTimeLabel = `In ${expiryHours} hrs`;
      const ts = nowTimestamp();

      const db = getPool();
      const inserted = await db.query(
        `INSERT INTO donations (
          id, food_name, category, quantity_kg, servings_estimate, expiry_hours,
          expiry_time_label, pickup_location, zone, donor_name, donor_type,
          contact_name, contact_phone, storage_note, status, assigned_ngo_id,
          assigned_ngo_name, rejection_reason, created_at, updated_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
        RETURNING *`,
        [
          id,
          foodName,
          category,
          quantityKg,
          servingsEstimate,
          expiryHours,
          expiryTimeLabel,
          pickupLocation,
          zone,
          donorName,
          donorType,
          contactName,
          contactPhone,
          storageNote,
          'Pending Approval',
          null,
          null,
          null,
          ts,
          ts,
        ]
      );

      res.status(201).json(mapDonationRow(inserted.rows[0]));
    } catch {
      res.status(500).json({ error: 'Failed to save food donation.' });
    }
  });

  // Update donation status (Approve / Reject / In Transit / Delivered)
  app.patch('/api/donations/:id/status', async (req, res) => {
    if (!requireDb(req, res)) return;
    try {
      await ensureSchemaAndSeed();
      const id = cleanString(req.params.id, 80);
      const body = req.body as Record<string, unknown>;
      const status = body.status as DonationStatus;
      const rejectionReason = cleanString(body.rejectionReason, 300);

      if (!id || !ALLOWED_STATUS_UPDATES.includes(status)) {
        res.status(400).json({ error: 'Invalid donation status update.' });
        return;
      }

      const db = getPool();
      const client = await db.connect();
      try {
        await client.query('BEGIN');
        const ts = nowTimestamp();

        const updated = await client.query(
          `UPDATE donations
           SET status = $1,
               rejection_reason = CASE WHEN $1 = 'Rejected' THEN $2 ELSE rejection_reason END,
               updated_at = $3
           WHERE id = $4
           RETURNING *`,
          [status, rejectionReason || null, ts, id]
        );

        if (updated.rowCount === 0) {
          await client.query('ROLLBACK');
          res.status(404).json({ error: 'Donation not found.' });
          return;
        }

        if (status === 'Delivered') {
          await client.query(
            `UPDATE food_requests
             SET status = 'Completed',
                 pickup_eta = 'Delivered & Verified'
             WHERE donation_id = $1 AND status <> 'Declined'`,
            [id]
          );
        }

        await client.query('COMMIT');
        res.json(mapDonationRow(updated.rows[0]));
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    } catch {
      res.status(500).json({ error: 'Failed to update donation status.' });
    }
  });

  // Submit NGO food request
  app.post('/api/requests', async (req, res) => {
    if (!requireDb(req, res)) return;
    try {
      await ensureSchemaAndSeed();
      const body = req.body as Record<string, unknown>;
      const donationId = cleanString(body.donationId, 80);
      const ngoId = cleanString(body.ngoId, 80);
      const pickupEta = cleanString(body.pickupEta, 120) || '30 mins';
      const volunteerName = cleanString(body.volunteerName, 120);
      const notes = cleanString(body.notes, 300);

      if (!donationId || !ngoId) {
        res.status(400).json({ error: 'Donation ID and NGO ID are required.' });
        return;
      }

      const db = getPool();
      const client = await db.connect();
      try {
        await client.query('BEGIN');

        const donRes = await client.query(
          'SELECT * FROM donations WHERE id = $1 FOR UPDATE',
          [donationId]
        );
        if (donRes.rowCount === 0) {
          await client.query('ROLLBACK');
          res.status(404).json({ error: 'Donation not found.' });
          return;
        }

        const donation = mapDonationRow(donRes.rows[0]);
        if (donation.status !== 'Available') {
          await client.query('ROLLBACK');
          res.status(409).json({ error: 'Donation is no longer available for request.' });
          return;
        }

        const ngoRes = await client.query('SELECT * FROM ngos WHERE id = $1', [ngoId]);
        if (ngoRes.rowCount === 0) {
          await client.query('ROLLBACK');
          res.status(404).json({ error: 'NGO not found.' });
          return;
        }

        const ngo = mapNgoRow(ngoRes.rows[0]);
        const reqId = `req-${Date.now()}`;
        const ts = nowTimestamp();

        const insertedReq = await client.query(
          `INSERT INTO food_requests (
            id, donation_id, food_name, donor_name, ngo_id, ngo_name,
            requested_kg, pickup_eta, volunteer_name, notes, status, created_at
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
          RETURNING *`,
          [
            reqId,
            donation.id,
            donation.foodName,
            donation.donorName,
            ngo.id,
            ngo.name,
            donation.quantityKg,
            pickupEta,
            volunteerName || ngo.coordinatorName,
            notes || `Pickup scheduled for ${ngo.name}`,
            'Pending',
            ts,
          ]
        );

        const updatedDonation = await client.query(
          `UPDATE donations
           SET status = 'Requested',
               assigned_ngo_id = $1,
               assigned_ngo_name = $2,
               updated_at = $3
           WHERE id = $4
           RETURNING *`,
          [ngo.id, ngo.name, ts, donation.id]
        );

        await client.query('COMMIT');
        res.status(201).json({
          request: mapRequestRow(insertedReq.rows[0]),
          donation: mapDonationRow(updatedDonation.rows[0]),
        });
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    } catch {
      res.status(500).json({ error: 'Failed to submit NGO request.' });
    }
  });

  // Approve or decline NGO request
  app.patch('/api/requests/:id/status', async (req, res) => {
    if (!requireDb(req, res)) return;
    try {
      await ensureSchemaAndSeed();
      const id = cleanString(req.params.id, 80);
      const body = req.body as Record<string, unknown>;
      const status = body.status;

      if (!id || (status !== 'Approved' && status !== 'Declined')) {
        res.status(400).json({ error: 'Status must be Approved or Declined.' });
        return;
      }

      const db = getPool();
      const client = await db.connect();
      try {
        await client.query('BEGIN');

        const updatedReq = await client.query(
          `UPDATE food_requests SET status = $1 WHERE id = $2 RETURNING *`,
          [status, id]
        );
        if (updatedReq.rowCount === 0) {
          await client.query('ROLLBACK');
          res.status(404).json({ error: 'Request not found.' });
          return;
        }

        const mappedReq = mapRequestRow(updatedReq.rows[0]);
        let mappedDonation = null;

        if (status === 'Declined') {
          const ts = nowTimestamp();
          const resetDon = await client.query(
            `UPDATE donations
             SET status = 'Available',
                 assigned_ngo_id = NULL,
                 assigned_ngo_name = NULL,
                 updated_at = $1
             WHERE id = $2 AND status = 'Requested'
             RETURNING *`,
            [ts, mappedReq.donationId]
          );
          if (resetDon.rowCount && resetDon.rowCount > 0) {
            mappedDonation = mapDonationRow(resetDon.rows[0]);
          }
        }

        await client.query('COMMIT');
        res.json({ request: mappedReq, donation: mappedDonation });
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    } catch {
      res.status(500).json({ error: 'Failed to update NGO request.' });
    }
  });

  // Add donor
  app.post('/api/donors', async (req, res) => {
    if (!requireDb(req, res)) return;
    try {
      await ensureSchemaAndSeed();
      const body = req.body as Record<string, unknown>;
      const name = cleanString(body.name, 160);
      const type = body.type as DonorType;
      const zone = body.zone as LocationZone;
      const address = cleanString(body.address, 240) || `${zone} Main Road`;
      const contactPerson = cleanString(body.contactPerson, 120);
      const phone = cleanString(body.phone, 40) || '+91 98000 00000';

      if (
        !name ||
        !contactPerson ||
        !ALLOWED_DONOR_TYPES.includes(type) ||
        !ALLOWED_ZONES.includes(zone)
      ) {
        res.status(400).json({ error: 'Invalid donor fields.' });
        return;
      }

      const db = getPool();
      const inserted = await db.query(
        `INSERT INTO donors (
          id, name, type, zone, address, contact_person, phone,
          total_donations_count, total_kg_donated, verified, joined_date
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
        RETURNING *`,
        [
          `dnr-${Date.now()}`,
          name,
          type,
          zone,
          address,
          contactPerson,
          phone,
          0,
          0,
          true,
          new Date().toISOString().slice(0, 10),
        ]
      );

      res.status(201).json(mapDonorRow(inserted.rows[0]));
    } catch {
      res.status(500).json({ error: 'Failed to create donor.' });
    }
  });

  // Toggle donor verification
  app.patch('/api/donors/:id/verify', async (req, res) => {
    if (!requireDb(req, res)) return;
    try {
      await ensureSchemaAndSeed();
      const id = cleanString(req.params.id, 80);
      const db = getPool();
      const updated = await db.query(
        'UPDATE donors SET verified = NOT verified WHERE id = $1 RETURNING *',
        [id]
      );
      if (updated.rowCount === 0) {
        res.status(404).json({ error: 'Donor not found.' });
        return;
      }
      res.json(mapDonorRow(updated.rows[0]));
    } catch {
      res.status(500).json({ error: 'Failed to update donor verification.' });
    }
  });

  // Add NGO
  app.post('/api/ngos', async (req, res) => {
    if (!requireDb(req, res)) return;
    try {
      await ensureSchemaAndSeed();
      const body = req.body as Record<string, unknown>;
      const name = cleanString(body.name, 160);
      const focusArea = cleanString(body.focusArea, 200) || 'Community Meal Distribution';
      const zone = body.zone as LocationZone;
      const address = cleanString(body.address, 240) || `${zone} Outreach Center`;
      const coordinatorName = cleanString(body.coordinatorName, 120);
      const phone = cleanString(body.phone, 40) || '+91 98000 00000';
      const dailyCapacityKg = Math.max(10, Math.round(Number(body.dailyCapacityKg) || 100));

      if (!name || !coordinatorName || !ALLOWED_ZONES.includes(zone)) {
        res.status(400).json({ error: 'Invalid NGO fields.' });
        return;
      }

      const db = getPool();
      const inserted = await db.query(
        `INSERT INTO ngos (
          id, name, focus_area, zone, address, coordinator_name, phone,
          daily_capacity_kg, meals_distributed, verified, joined_date
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
        RETURNING *`,
        [
          `ngo-${Date.now()}`,
          name,
          focusArea,
          zone,
          address,
          coordinatorName,
          phone,
          dailyCapacityKg,
          0,
          true,
          new Date().toISOString().slice(0, 10),
        ]
      );

      res.status(201).json(mapNgoRow(inserted.rows[0]));
    } catch {
      res.status(500).json({ error: 'Failed to create NGO.' });
    }
  });

  // Toggle NGO verification
  app.patch('/api/ngos/:id/verify', async (req, res) => {
    if (!requireDb(req, res)) return;
    try {
      await ensureSchemaAndSeed();
      const id = cleanString(req.params.id, 80);
      const db = getPool();
      const updated = await db.query(
        'UPDATE ngos SET verified = NOT verified WHERE id = $1 RETURNING *',
        [id]
      );
      if (updated.rowCount === 0) {
        res.status(404).json({ error: 'NGO not found.' });
        return;
      }
      res.json(mapNgoRow(updated.rows[0]));
    } catch {
      res.status(500).json({ error: 'Failed to update NGO verification.' });
    }
  });

  // Reset database to sample demonstration seed
  app.post('/api/reset', async (req, res) => {
    if (!requireDb(req, res)) return;
    try {
      await resetDatabaseToSeed();
      const db = getPool();
      const [donationsRes, requestsRes, donorsRes, ngosRes] = await Promise.all([
        db.query('SELECT * FROM donations ORDER BY created_at DESC, id DESC'),
        db.query('SELECT * FROM food_requests ORDER BY created_at DESC, id DESC'),
        db.query('SELECT * FROM donors ORDER BY joined_date DESC, id DESC'),
        db.query('SELECT * FROM ngos ORDER BY joined_date ASC, id ASC'),
      ]);
      res.json({
        donations: donationsRes.rows.map(mapDonationRow),
        requests: requestsRes.rows.map(mapRequestRow),
        donors: donorsRes.rows.map(mapDonorRow),
        ngos: ngosRes.rows.map(mapNgoRow),
      });
    } catch {
      res.status(500).json({ error: 'Failed to reset database records.' });
    }
  });

  // Vite middleware in development or static dist in production
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distDir)) {
      app.use(express.static(distDir));
      app.get('/{*splat}', (_req, res) => {
        res.sendFile(path.join(distDir, 'index.html'));
      });
    }
  }

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`FoodBridge server listening on port ${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err instanceof Error ? err.message : 'Unknown error');
  process.exit(1);
});
