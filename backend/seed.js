require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Job = require('./models/Job');
const Referral = require('./models/Referral');

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB for rich seeding...');

        // Clear existing data
        await User.deleteMany({});
        await Job.deleteMany({});
        await Referral.deleteMany({});

        // 1. Create Admin
        const admin = await User.create({
            name: 'Master Admin',
            email: 'admin@workforce.com',
            password: 'password123',
            role: 'admin',
            status: 'active'
        });

        // 2. Create Employees (Consultants)
        const emp1 = await User.create({
            name: 'Consultant Alex',
            email: 'alex@workforce.com',
            password: 'password123',
            role: 'employee',
            employeeId: 'FIC-EMP-001',
            status: 'active',
            designation: 'Senior Specialist'
        });

        const emp2 = await User.create({
            name: 'Consultant Sarah',
            email: 'sarah@workforce.com',
            password: 'password123',
            role: 'employee',
            employeeId: 'FIC-EMP-002',
            status: 'active',
            designation: 'Recruitment Manager'
        });

        // 3. Create Agents
        const agent1 = await User.create({
            name: 'Agent James',
            email: 'james@referral.com',
            password: 'password123',
            role: 'agent',
            agencyName: 'Global Talent Partners',
            status: 'active'
        });

        const agent2 = await User.create({
            name: 'Agent Maria',
            email: 'maria@referral.com',
            password: 'password123',
            role: 'agent',
            agencyName: 'Maria Consulting',
            status: 'pending' // One pending for admin approval test
        });

        // 4. Create Jobs
        const jobs = await Job.insertMany([
            {
                jobTitle: 'Senior MERN Developer',
                companyName: 'TechFlow Systems',
                salary: '25L - 35L PA',
                location: 'Bangalore / Remote',
                jobType: 'full-time',
                workMode: 'remote',
                domain: 'IT',
                rolesAndResponsibilities: 'Lead the development of scalable cloud applications using MongoDB, Express, React, and Node.js.',
                incentiveAgent: '15,000',
                incentiveEmployee: '5,000',
                status: 'active',
                createdBy: admin._id
            },
            {
                jobTitle: 'Cloud Architect (AWS)',
                companyName: 'Azurea Cloud',
                salary: '45L - 60L PA',
                location: 'Mumbai',
                jobType: 'full-time',
                workMode: 'office',
                domain: 'IT',
                rolesAndResponsibilities: 'Design and implement complex cloud infrastructures for enterprise clients.',
                incentiveAgent: '25,000',
                incentiveEmployee: '10,000',
                status: 'active',
                createdBy: admin._id
            },
            {
                jobTitle: 'UI/UX Designer',
                companyName: 'Creative Pixel',
                salary: '12L - 18L PA',
                location: 'Pune / Hybrid',
                jobType: 'full-time',
                workMode: 'hybrid',
                domain: 'Design',
                rolesAndResponsibilities: 'Create stunning user interfaces and intuitive user experiences for mobile and web.',
                incentiveAgent: '8,000',
                incentiveEmployee: '2,000',
                status: 'active',
                createdBy: admin._id
            }
        ]);

        // 5. Create Referrals with varying statuses and dates for charts
        const statuses = ['New Referral', 'Assigned', 'Interview Scheduled', 'Shortlisted', 'Selected', 'Joined', 'Rejected'];
        const referrers = [agent1._id, emp1._id, agent1._id];
        const assignedTo = [emp1._id, emp2._id, emp1._id];

        for (let i = 0; i < 25; i++) {
            const date = new Date();
            date.setDate(date.getDate() - Math.floor(Math.random() * 25)); // Random date in last 25 days

            await Referral.create({
                candidateName: `Candidate ${i + 1}`,
                email: `cand${i}@example.com`,
                mobile: `987654321${i % 10}`,
                job: jobs[i % jobs.length]._id,
                sourceType: i % 2 === 0 ? 'agent' : 'employee',
                referrer: referrers[i % referrers.length],
                assignedEmployee: assignedTo[i % assignedTo.length],
                status: statuses[Math.floor(Math.random() * statuses.length)],
                createdAt: date,
                updatedAt: date,
                payoutStatus: i % 10 === 0 ? 'paid' : (i % 5 === 0 ? 'pending_approval' : 'unearned')
            });
        }

        console.log('Successfully seeded rich data for analytics!');
        process.exit();
    } catch (err) {
        console.error('Seeding failed:', err);
        process.exit(1);
    }
};

seedData();
