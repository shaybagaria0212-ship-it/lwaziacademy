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
            email: 'mohammed.badat@lwazi.co.za',
            name: 'Mohammed Badat',
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
            email: 'edison.mshengu@lwazi.co.za',
            name: 'Edison Mshengu',
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
        },
        {
            email: 'sadiaislampromiofficials@gmail.com',
            name: 'Sadia Islam Promi',
            subjects: 'Mathematics,Business Studies,Economics',
            grades: '8,9,10,11,12',
            bio: 'I am passionate about teaching because I enjoy helping students move from confusion to confidence. For me, tutoring is not only about explaining concepts - it is about understanding how each student learns and adapting my teaching style to help them succeed academically and personally. Over my 13+ years of teaching, I have worked with students from over 15+ countries, with different educational backgrounds and learning levels, teaching subjects such as Mathematics, Business Studies, Economics, Statistics, IELTS',
            rate: 294,
            experience: 13,
            qualification: 'Masters in Business Administration',
            rating: 5.0,
            reviews: 0,
            verified: 1
        },
        {
            email: 'amith.pattar@gmail.com',
            name: 'Amith Pattar',
            subjects: 'Mathematics,Physical Sciences',
            grades: '7,8,9,10,11,12',
            bio: 'I believe effective teaching is not just about solving problems, but helping students deeply understand concepts and develop confidence in their abilities. With an engineering background and several years of experience teaching mathematics to students from different educational backgrounds, I focus on making learning interactive, engaging, and easy to follow. My teaching approach emphasizes conceptual clarity, logical thinking, patience, and step-by-step explanation rather than rote memorization. I strive to create a comfortable learning environment where students feel encouraged to ask questions and actively participate. I am particularly passionate about helping students overcome fear of mathematics and develop genuine interest in the subject. My goal is to help learners improve academically while also building independent problem-solving skills and long-term confidence.',
            rate: 325,
            experience: 5,
            qualification: 'Bachelor’s Degree in Electrical and Electronics Engineering',
            rating: 5.0,
            reviews: 0,
            verified: 1
        },
        {
            email: 'suhail.malik@gmail.com',
            name: 'Suhail Gul Malik',
            subjects: 'Mathematics,English,Economics',
            grades: '8,9,10',
            bio: 'I am applying to become a tutor because I enjoy helping others understand and succeed in their work. I believe that tutoring is not only about teaching information, but also about encouraging confidence, patience, and a positive attitude towards learning. Throughout my school experience, I have often helped classmates with work they struggled to understand, and I found it rewarding to see them improve once concepts were explained clearly. This showed me that I am patient, approachable, and able to communicate ideas in a way that others can understand.',
            rate: 250,
            experience: 5,
            qualification: 'Post Graduation in Economics - Central University of Kashmir',
            rating: 5.0,
            reviews: 0,
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
