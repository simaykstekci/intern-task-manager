import bcrypt from 'bcryptjs';
import { prisma } from './prisma.js';
async function seed() {
    console.log('🌱 Starting database seed...');
    // Clean existing demo user if present
    await prisma.user.deleteMany({
        where: { email: 'intern@demo.com' },
    });
    // Create Demo User
    const passwordHash = await bcrypt.hash('Password123!', 10);
    const user = await prisma.user.create({
        data: {
            email: 'intern@demo.com',
            passwordHash,
            fullName: 'Simay Intern',
        },
    });
    console.log(`👤 Created demo user: ${user.email} (${user.fullName})`);
    // Create Projects
    const onboarding = await prisma.project.create({
        data: {
            title: 'Onboarding & Setup',
            description: 'First week company setup, tools, and developer environment.',
            color: '#6366f1',
            userId: user.id,
        },
    });
    const frontend = await prisma.project.create({
        data: {
            title: 'Frontend Architecture',
            description: 'React, Tailwind CSS, and UI component system deliverables.',
            color: '#10b981',
            userId: user.id,
        },
    });
    const bugBash = await prisma.project.create({
        data: {
            title: 'Bug Bash & Quality',
            description: 'End-to-end testing, error edge cases, and code reviews.',
            color: '#f59e0b',
            userId: user.id,
        },
    });
    const presentation = await prisma.project.create({
        data: {
            title: 'Midterm Presentation',
            description: 'Internship midpoint demo, metrics, and slides.',
            color: '#8b5cf6',
            userId: user.id,
        },
    });
    console.log('📁 Created 4 demo project categories');
    // Create Tasks
    const now = new Date();
    const tasksData = [
        {
            title: 'Set up local development environment',
            description: 'Install Node.js v24, Git, VSCode extensions, and clone project workspace.',
            status: 'DONE',
            priority: 'HIGH',
            dueDate: new Date(now.getTime() - 2 * 86400000), // 2 days ago
            projectId: onboarding.id,
            tags: ['setup', 'tools'],
        },
        {
            title: 'Complete TypeScript & React 19 onboarding modules',
            description: 'Review modern React hooks, TypeScript strict mode, and component lifecycles.',
            status: 'DONE',
            priority: 'MEDIUM',
            dueDate: new Date(now.getTime() - 1 * 86400000), // Yesterday
            projectId: onboarding.id,
            tags: ['learning'],
        },
        {
            title: 'Implement responsive TaskCard component with Tailwind CSS',
            description: 'Build interactive cards with priority badges, status toggles, and relative dates.',
            status: 'IN_PROGRESS',
            priority: 'URGENT',
            dueDate: new Date(now.getTime() + 1 * 86400000), // Tomorrow
            projectId: frontend.id,
            tags: ['ui', 'frontend'],
        },
        {
            title: 'Audit API error handling and validation responses',
            description: 'Verify Zod schema validation errors return clean 400 Bad Request responses.',
            status: 'IN_PROGRESS',
            priority: 'HIGH',
            dueDate: new Date(now.getTime() + 3 * 86400000), // In 3 days
            projectId: bugBash.id,
            tags: ['backend', 'security'],
        },
        {
            title: 'Prepare slide deck for mentor check-in',
            description: 'Summarize tasks completed, metrics achieved, and questions for weekly 1:1 meeting.',
            status: 'TODO',
            priority: 'MEDIUM',
            dueDate: new Date(now.getTime() + 5 * 86400000), // In 5 days
            projectId: presentation.id,
            tags: ['presentation'],
        },
        {
            title: 'Write automated integration tests for filtering and search',
            description: 'Ensure Supertest and Vitest cover multi-tenant data isolation and query edge cases.',
            status: 'TODO',
            priority: 'LOW',
            dueDate: new Date(now.getTime() + 7 * 86400000), // In 7 days
            projectId: bugBash.id,
            tags: ['testing'],
        },
    ];
    for (const t of tasksData) {
        await prisma.task.create({
            data: {
                title: t.title,
                description: t.description,
                status: t.status,
                priority: t.priority,
                dueDate: t.dueDate,
                userId: user.id,
                projectId: t.projectId,
                tags: {
                    connectOrCreate: t.tags.map((name) => ({
                        where: { name },
                        create: { name },
                    })),
                },
            },
        });
    }
    console.log('✅ Seed completed successfully with 6 realistic intern tasks!');
    await prisma.$disconnect();
}
seed().catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
});
