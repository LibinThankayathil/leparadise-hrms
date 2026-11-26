import { PrismaClient, Role, EmploymentStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Le Paradise HRMS database seeding...');

  // 1. Seed Leave Types
  const leaveTypesData = [
    { name: 'Annual Leave', code: 'ANNUAL', defaultDays: 14 },
    { name: 'Sick Leave', code: 'SICK', defaultDays: 10 },
    { name: 'Casual Leave', code: 'CASUAL', defaultDays: 7 },
    { name: 'Unpaid Leave', code: 'UNPAID', defaultDays: 30 },
  ];

  const leaveTypes: any[] = [];
  for (const lt of leaveTypesData) {
    const created = await prisma.leaveType.upsert({
      where: { code: lt.code },
      update: {},
      create: lt,
    });
    leaveTypes.push(created);
  }
  console.log(`✅ Seeded ${leaveTypesData.length} leave types`);

  // 2. Seed Users & Employees
  const defaultPassword = await bcrypt.hash('Manager@123', 10);
  const staffPassword = await bcrypt.hash('Employee@123', 10);

  // Manager Profile (Sophia Chen)
  const managerUser = await prisma.user.upsert({
    where: { email: 'manager@leparadise.com' },
    update: {},
    create: {
      email: 'manager@leparadise.com',
      passwordHash: defaultPassword,
      role: Role.MANAGER,
      isActive: true,
      employee: {
        create: {
          employeeCode: 'LP-MGR-001',
          firstName: 'Sophia',
          lastName: 'Chen',
          phone: '+1 555-0101',
          designation: 'General Manager & HR Operations',
          status: EmploymentStatus.ACTIVE,
          baseSalary: 96000.0,
        },
      },
    },
    include: { employee: true },
  });
  console.log(`✅ Manager user seeded: ${managerUser.email}`);

  // Employee Profile (Liam Johnson)
  const employeeUser = await prisma.user.upsert({
    where: { email: 'employee@leparadise.com' },
    update: {},
    create: {
      email: 'employee@leparadise.com',
      passwordHash: staffPassword,
      role: Role.EMPLOYEE,
      isActive: true,
      employee: {
        create: {
          employeeCode: 'LP-EMP-002',
          firstName: 'Liam',
          lastName: 'Johnson',
          phone: '+1 555-0102',
          designation: 'Front Desk Lead Concierge',
          managerId: managerUser.employee?.id,
          status: EmploymentStatus.ACTIVE,
          baseSalary: 62000.0,
        },
      },
    },
    include: { employee: true },
  });
  console.log(`✅ Primary staff seeded: ${employeeUser.email}`);

  // Additional Diverse Staff Profiles for Directory
  const additionalStaff = [
    {
      email: 'isabella.rossi@leparadise.com',
      firstName: 'Isabella',
      lastName: 'Rossi',
      code: 'LP-EMP-003',
      designation: 'Guest Relations Executive',
      phone: '+1 555-0103',
      salary: 58000.0,
      status: EmploymentStatus.ACTIVE,
    },
    {
      email: 'david.miller@leparadise.com',
      firstName: 'David',
      lastName: 'Miller',
      code: 'LP-EMP-004',
      designation: 'Senior Financial Analyst',
      phone: '+1 555-0104',
      salary: 78000.0,
      status: EmploymentStatus.ACTIVE,
    },
    {
      email: 'maya.patel@leparadise.com',
      firstName: 'Maya',
      lastName: 'Patel',
      code: 'LP-EMP-005',
      designation: 'Systems Infrastructure Engineer',
      phone: '+1 555-0105',
      salary: 82000.0,
      status: EmploymentStatus.ACTIVE,
    },
    {
      email: 'lucas.silva@leparadise.com',
      firstName: 'Lucas',
      lastName: 'Silva',
      code: 'LP-EMP-006',
      designation: 'Facilities Operations Manager',
      phone: '+1 555-0106',
      salary: 68000.0,
      status: EmploymentStatus.ACTIVE,
    },
    {
      email: 'elena.rostova@leparadise.com',
      firstName: 'Elena',
      lastName: 'Rostova',
      code: 'LP-EMP-007',
      designation: 'VIP Concierge & Experience Host',
      phone: '+1 555-0107',
      salary: 54000.0,
      status: EmploymentStatus.ON_LEAVE,
    },
    {
      email: 'marcus.vance@leparadise.com',
      firstName: 'Marcus',
      lastName: 'Vance',
      code: 'LP-EMP-008',
      designation: 'HVAC & Electrical Specialist',
      phone: '+1 555-0108',
      salary: 60000.0,
      status: EmploymentStatus.ACTIVE,
    },
  ];

  for (const staff of additionalStaff) {
    await prisma.user.upsert({
      where: { email: staff.email },
      update: {},
      create: {
        email: staff.email,
        passwordHash: staffPassword,
        role: Role.EMPLOYEE,
        isActive: true,
        employee: {
          create: {
            employeeCode: staff.code,
            firstName: staff.firstName,
            lastName: staff.lastName,
            phone: staff.phone,
            designation: staff.designation,
            managerId: managerUser.employee?.id,
            status: staff.status,
            baseSalary: staff.salary,
          },
        },
      },
    });
  }
  console.log(`✅ Seeded ${additionalStaff.length} additional staff records`);

  // 4. Initialize Leave Balances for all employees
  const allEmployees = await prisma.employee.findMany();
  const currentYear = new Date().getFullYear();

  for (const emp of allEmployees) {
    for (const lt of leaveTypes) {
      await prisma.leaveBalance.upsert({
        where: {
          employeeId_leaveTypeId_year: {
            employeeId: emp.id,
            leaveTypeId: lt.id,
            year: currentYear,
          },
        },
        update: {},
        create: {
          employeeId: emp.id,
          leaveTypeId: lt.id,
          totalDays: lt.defaultDays,
          usedDays: emp.status === EmploymentStatus.ON_LEAVE ? 3 : 0,
          year: currentYear,
        },
      });
    }
  }
  console.log('✅ Leave balances initialized for all employees');

  console.log('🎉 Seeding successfully completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error during database seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
