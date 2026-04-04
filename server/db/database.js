const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, 'lwazi.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

let db;

function getDb() {
    if (!db) {
        db = new Database(DB_PATH);
        db.pragma('journal_mode = WAL');
        db.pragma('foreign_keys = ON');
    }
    return db;
}

function initializeDatabase() {
    const database = getDb();
    const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
    database.exec(schema);
    console.log('✅ Database schema initialized');
    seedData(database);
}

function seedData(database) {
    const existingUsers = database.prepare('SELECT COUNT(*) as count FROM users').get();
    if (existingUsers.count > 0) {
        console.log('📦 Database already seeded');
        return;
    }

    console.log('🌱 Seeding database with sample data...');

    const hash = bcrypt.hashSync('password123', 10);

    // Insert sample tutors
    const insertUser = database.prepare(
        'INSERT INTO users (email, password_hash, role, full_name) VALUES (?, ?, ?, ?)'
    );
    const insertProfile = database.prepare(
        `INSERT INTO tutor_profiles (user_id, subjects, grade_levels, bio, hourly_rate, experience_years, qualification, rating, review_count, verified)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    const tutors = [
        {
            email: 'thabo.mokoena@lwazi.co.za',
            name: 'Thabo Mokoena',
            subjects: 'Mathematics,Physical Sciences',
            grades: '10,11,12',
            bio: 'Passionate about making Mathematics and Physical Sciences accessible. I hold a BSc in Applied Mathematics from Wits and have been tutoring full-time for 6 years. My students consistently achieve distinctions in the NSC.',
            rate: 250,
            experience: 6,
            qualification: 'BSc Applied Mathematics — Wits University',
            rating: 4.8,
            reviews: 47,
            verified: 1
        },
        {
            email: 'sarah.vandenberg@lwazi.co.za',
            name: 'Sarah van den Berg',
            subjects: 'English Home Language,English First Additional Language,Afrikaans',
            grades: '8,9,10,11,12',
            bio: 'UCT English Honours graduate specialising in literature analysis and creative writing. I focus on building genuine comprehension and analytical skills, not just exam technique. My approach is holistic and student-centred.',
            rate: 200,
            experience: 4,
            qualification: 'BA Honours English Literature — UCT',
            rating: 4.9,
            reviews: 62,
            verified: 1
        },
        {
            email: 'sipho.ndlovu@lwazi.co.za',
            name: 'Sipho Ndlovu',
            subjects: 'Accounting,Business Studies,Economics',
            grades: '10,11,12',
            bio: 'Chartered Accountant with a passion for education. After 5 years in corporate finance, I transitioned to full-time tutoring. I make financial concepts intuitive and practical. My students see results within weeks.',
            rate: 300,
            experience: 8,
            qualification: 'BCom CA(SA) — University of Pretoria',
            rating: 4.7,
            reviews: 35,
            verified: 1
        },
        {
            email: 'amira.patel@lwazi.co.za',
            name: 'Amira Patel',
            subjects: 'Life Sciences,Mathematics',
            grades: '10,11,12',
            bio: 'MSc in Molecular Biology from Stellenbosch. I bring lab experience into the classroom to make Life Sciences vivid and memorable. Also tutoring Maths to give students a strong analytical foundation.',
            rate: 220,
            experience: 5,
            qualification: 'MSc Molecular Biology — Stellenbosch University',
            rating: 4.6,
            reviews: 28,
            verified: 1
        },
        {
            email: 'james.viljoen@lwazi.co.za',
            name: 'James Viljoen',
            subjects: 'History,Geography,Social Sciences',
            grades: '8,9,10,11,12',
            bio: 'History teacher with 10 years at a top IEB school. I make the past come alive through storytelling and critical thinking. My Geography students develop strong spatial reasoning and data interpretation skills.',
            rate: 180,
            experience: 10,
            qualification: 'BEd — Rhodes University',
            rating: 4.5,
            reviews: 41,
            verified: 1
        },
        {
            email: 'zanele.khumalo@lwazi.co.za',
            name: 'Zanele Khumalo',
            subjects: 'Mathematics,Information Technology,Computer Applications Technology',
            grades: '10,11,12',
            bio: 'Software developer turned educator. I teach Maths and IT with real-world applications. My Delphi and Java coding sessions are project-based and fun. Let me show you how logical thinking changes everything.',
            rate: 270,
            experience: 7,
            qualification: 'BSc Computer Science — UKZN',
            rating: 4.9,
            reviews: 53,
            verified: 1
        }
    ];

    const insertMany = database.transaction(() => {
        for (const tutor of tutors) {
            const result = insertUser.run(tutor.email, hash, 'tutor', tutor.name);
            insertProfile.run(
                result.lastInsertRowid,
                tutor.subjects,
                tutor.grades,
                tutor.bio,
                tutor.rate,
                tutor.experience,
                tutor.qualification,
                tutor.rating,
                tutor.reviews,
                tutor.verified
            );
        }

        // Insert a sample student
        insertUser.run('student@lwazi.co.za', hash, 'student', 'Demo Student');
    });

    insertMany();
    console.log('✅ Seed data inserted (6 tutors + 1 student)');
}

module.exports = { getDb, initializeDatabase };
