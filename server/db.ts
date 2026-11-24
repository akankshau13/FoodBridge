import { Pool } from 'pg';
import {
  INITIAL_DONATIONS,
  INITIAL_DONORS,
  INITIAL_NGOS,
  INITIAL_REQUESTS,
} from '../src/data/mockData.ts';
import type {
  DonorProfile,
  FoodDonation,
  FoodRequest,
  NgoProfile,
} from '../src/types/foodbridge.ts';

let pool: Pool | null = null;
let initialized = false;

function buildPoolConfig(rawUrl: string) {
  const parsed = new URL(rawUrl);
  const sslMode = parsed.searchParams.get('sslmode');
  const needsSsl =
    sslMode === 'require' ||
    sslMode === 'verify-ca' ||
    sslMode === 'verify-full' ||
    parsed.hostname.includes('aivencloud.com');

  if (needsSsl) {
    parsed.searchParams.delete('sslmode');
  }

  return {
    connectionString: parsed.toString(),
    ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  };
}

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.trim().length > 0);
}

export function getPool(): Pool {
  const rawUrl = process.env.DATABASE_URL?.trim();
  if (!rawUrl) {
    throw new Error('DATABASE_URL is not configured in environment secrets.');
  }
  if (!pool) {
    pool = new Pool(buildPoolConfig(rawUrl));
  }
  return pool;
}

export async function ensureSchemaAndSeed(): Promise<void> {
  const db = getPool();
  if (initialized) return;

  await db.query(`
    CREATE TABLE IF NOT EXISTS donors (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      zone TEXT NOT NULL,
      address TEXT NOT NULL,
      contact_person TEXT NOT NULL,
      phone TEXT NOT NULL,
      total_donations_count INTEGER NOT NULL DEFAULT 0,
      total_kg_donated INTEGER NOT NULL DEFAULT 0,
      verified BOOLEAN NOT NULL DEFAULT FALSE,
      joined_date TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ngos (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      focus_area TEXT NOT NULL,
      zone TEXT NOT NULL,
      address TEXT NOT NULL,
      coordinator_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      daily_capacity_kg INTEGER NOT NULL DEFAULT 100,
      meals_distributed INTEGER NOT NULL DEFAULT 0,
      verified BOOLEAN NOT NULL DEFAULT TRUE,
      joined_date TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS donations (
      id TEXT PRIMARY KEY,
      food_name TEXT NOT NULL,
      category TEXT NOT NULL,
      quantity_kg INTEGER NOT NULL,
      servings_estimate INTEGER NOT NULL,
      expiry_hours DOUBLE PRECISION NOT NULL,
      expiry_time_label TEXT NOT NULL,
      pickup_location TEXT NOT NULL,
      zone TEXT NOT NULL,
      donor_name TEXT NOT NULL,
      donor_type TEXT NOT NULL,
      contact_name TEXT NOT NULL,
      contact_phone TEXT NOT NULL,
      storage_note TEXT NOT NULL,
      status TEXT NOT NULL,
      assigned_ngo_id TEXT,
      assigned_ngo_name TEXT,
      rejection_reason TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS food_requests (
      id TEXT PRIMARY KEY,
      donation_id TEXT NOT NULL,
      food_name TEXT NOT NULL,
      donor_name TEXT NOT NULL,
      ngo_id TEXT NOT NULL,
      ngo_name TEXT NOT NULL,
      requested_kg INTEGER NOT NULL,
      pickup_eta TEXT NOT NULL,
      volunteer_name TEXT NOT NULL,
      notes TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  const countResult = await db.query<{ count: string }>(
    'SELECT COUNT(*)::text AS count FROM donations'
  );
  const existingCount = Number(countResult.rows[0]?.count ?? '0');

  if (existingCount === 0) {
    await seedInitialData(db);
  }

  initialized = true;
}

export async function seedInitialData(db: Pool): Promise<void> {
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    for (const d of INITIAL_DONORS) {
      await client.query(
        `INSERT INTO donors (
          id, name, type, zone, address, contact_person, phone,
          total_donations_count, total_kg_donated, verified, joined_date
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
        ON CONFLICT (id) DO NOTHING`,
        [
          d.id,
          d.name,
          d.type,
          d.zone,
          d.address,
          d.contactPerson,
          d.phone,
          d.totalDonationsCount,
          d.totalKgDonated,
          d.verified,
          d.joinedDate,
        ]
      );
    }

    for (const n of INITIAL_NGOS) {
      await client.query(
        `INSERT INTO ngos (
          id, name, focus_area, zone, address, coordinator_name, phone,
          daily_capacity_kg, meals_distributed, verified, joined_date
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
        ON CONFLICT (id) DO NOTHING`,
        [
          n.id,
          n.name,
          n.focusArea,
          n.zone,
          n.address,
          n.coordinatorName,
          n.phone,
          n.dailyCapacityKg,
          n.mealsDistributed,
          n.verified,
          n.joinedDate,
        ]
      );
    }

    for (const don of INITIAL_DONATIONS) {
      await client.query(
        `INSERT INTO donations (
          id, food_name, category, quantity_kg, servings_estimate, expiry_hours,
          expiry_time_label, pickup_location, zone, donor_name, donor_type,
          contact_name, contact_phone, storage_note, status, assigned_ngo_id,
          assigned_ngo_name, rejection_reason, created_at, updated_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
        ON CONFLICT (id) DO NOTHING`,
        [
          don.id,
          don.foodName,
          don.category,
          don.quantityKg,
          don.servingsEstimate,
          don.expiryHours,
          don.expiryTimeLabel,
          don.pickupLocation,
          don.zone,
          don.donorName,
          don.donorType,
          don.contactName,
          don.contactPhone,
          don.storageNote,
          don.status,
          don.assignedNgoId ?? null,
          don.assignedNgoName ?? null,
          don.rejectionReason ?? null,
          don.createdAt,
          don.updatedAt,
        ]
      );
    }

    for (const req of INITIAL_REQUESTS) {
      await client.query(
        `INSERT INTO food_requests (
          id, donation_id, food_name, donor_name, ngo_id, ngo_name,
          requested_kg, pickup_eta, volunteer_name, notes, status, created_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
        ON CONFLICT (id) DO NOTHING`,
        [
          req.id,
          req.donationId,
          req.foodName,
          req.donorName,
          req.ngoId,
          req.ngoName,
          req.requestedKg,
          req.pickupEta,
          req.volunteerName,
          req.notes,
          req.status,
          req.createdAt,
        ]
      );
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function resetDatabaseToSeed(): Promise<void> {
  const db = getPool();
  await ensureSchemaAndSeed();
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    await client.query('TRUNCATE TABLE food_requests, donations, ngos, donors');
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
  await seedInitialData(db);
}

export function mapDonorRow(row: Record<string, unknown>): DonorProfile {
  return {
    id: String(row.id),
    name: String(row.name),
    type: row.type as DonorProfile['type'],
    zone: row.zone as DonorProfile['zone'],
    address: String(row.address),
    contactPerson: String(row.contact_person),
    phone: String(row.phone),
    totalDonationsCount: Number(row.total_donations_count),
    totalKgDonated: Number(row.total_kg_donated),
    verified: Boolean(row.verified),
    joinedDate: String(row.joined_date),
  };
}

export function mapNgoRow(row: Record<string, unknown>): NgoProfile {
  return {
    id: String(row.id),
    name: String(row.name),
    focusArea: String(row.focus_area),
    zone: row.zone as NgoProfile['zone'],
    address: String(row.address),
    coordinatorName: String(row.coordinator_name),
    phone: String(row.phone),
    dailyCapacityKg: Number(row.daily_capacity_kg),
    mealsDistributed: Number(row.meals_distributed),
    verified: Boolean(row.verified),
    joinedDate: String(row.joined_date),
  };
}

export function mapDonationRow(row: Record<string, unknown>): FoodDonation {
  return {
    id: String(row.id),
    foodName: String(row.food_name),
    category: row.category as FoodDonation['category'],
    quantityKg: Number(row.quantity_kg),
    servingsEstimate: Number(row.servings_estimate),
    expiryHours: Number(row.expiry_hours),
    expiryTimeLabel: String(row.expiry_time_label),
    pickupLocation: String(row.pickup_location),
    zone: row.zone as FoodDonation['zone'],
    donorName: String(row.donor_name),
    donorType: row.donor_type as FoodDonation['donorType'],
    contactName: String(row.contact_name),
    contactPhone: String(row.contact_phone),
    storageNote: String(row.storage_note),
    status: row.status as FoodDonation['status'],
    assignedNgoId: row.assigned_ngo_id ? String(row.assigned_ngo_id) : undefined,
    assignedNgoName: row.assigned_ngo_name ? String(row.assigned_ngo_name) : undefined,
    rejectionReason: row.rejection_reason ? String(row.rejection_reason) : undefined,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export function mapRequestRow(row: Record<string, unknown>): FoodRequest {
  return {
    id: String(row.id),
    donationId: String(row.donation_id),
    foodName: String(row.food_name),
    donorName: String(row.donor_name),
    ngoId: String(row.ngo_id),
    ngoName: String(row.ngo_name),
    requestedKg: Number(row.requested_kg),
    pickupEta: String(row.pickup_eta),
    volunteerName: String(row.volunteer_name),
    notes: String(row.notes),
    status: row.status as FoodRequest['status'],
    createdAt: String(row.created_at),
  };
}
