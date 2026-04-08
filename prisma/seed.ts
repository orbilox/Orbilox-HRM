import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Company
  await db.company.upsert({
    where: { id: "company-1" },
    update: {},
    create: {
      id: "company-1",
      name: "WorkNest Technologies Pvt. Ltd.",
      industry: "Technology",
      email: "hr@worknest.com",
      phone: "+91 98765 43210",
      address: "123 Tech Park, Sector 5",
      city: "Bengaluru",
      state: "Karnataka",
      country: "India",
      pinCode: "560001",
      foundedYear: 2020,
    },
  });

  // Departments
  const departments = await Promise.all([
    db.department.upsert({ where: { name: "Engineering" }, update: {}, create: { name: "Engineering", description: "Software development & infrastructure" } }),
    db.department.upsert({ where: { name: "Human Resources" }, update: {}, create: { name: "Human Resources", description: "HR, talent & culture" } }),
    db.department.upsert({ where: { name: "Sales" }, update: {}, create: { name: "Sales", description: "Revenue and business development" } }),
    db.department.upsert({ where: { name: "Marketing" }, update: {}, create: { name: "Marketing", description: "Brand, content and growth" } }),
    db.department.upsert({ where: { name: "Finance" }, update: {}, create: { name: "Finance", description: "Accounts and financial planning" } }),
    db.department.upsert({ where: { name: "Operations" }, update: {}, create: { name: "Operations", description: "Business operations and logistics" } }),
  ]);

  const [eng, hr, sales, marketing, finance, ops] = departments;

  // Leave Types
  await Promise.all([
    db.leaveType.upsert({ where: { name: "Annual Leave" }, update: {}, create: { name: "Annual Leave", description: "Earned annual leave", daysAllowed: 18, carryForward: true, isPaid: true, color: "#3b82f6" } }),
    db.leaveType.upsert({ where: { name: "Sick Leave" }, update: {}, create: { name: "Sick Leave", description: "Medical leave", daysAllowed: 12, carryForward: false, isPaid: true, color: "#ef4444" } }),
    db.leaveType.upsert({ where: { name: "Casual Leave" }, update: {}, create: { name: "Casual Leave", description: "Short casual leave", daysAllowed: 8, carryForward: false, isPaid: true, color: "#f59e0b" } }),
    db.leaveType.upsert({ where: { name: "Maternity Leave" }, update: {}, create: { name: "Maternity Leave", description: "Maternity benefit", daysAllowed: 180, carryForward: false, isPaid: true, color: "#ec4899" } }),
    db.leaveType.upsert({ where: { name: "Paternity Leave" }, update: {}, create: { name: "Paternity Leave", description: "Paternity benefit", daysAllowed: 15, carryForward: false, isPaid: true, color: "#8b5cf6" } }),
    db.leaveType.upsert({ where: { name: "Loss of Pay" }, update: {}, create: { name: "Loss of Pay", description: "Unpaid leave", daysAllowed: 30, carryForward: false, isPaid: false, color: "#6b7280" } }),
  ]);

  // Holidays
  const year = new Date().getFullYear();
  const holidays = [
    { name: "New Year's Day", date: new Date(`${year}-01-01`), type: "NATIONAL" },
    { name: "Republic Day", date: new Date(`${year}-01-26`), type: "NATIONAL" },
    { name: "Holi", date: new Date(`${year}-03-14`), type: "NATIONAL" },
    { name: "Good Friday", date: new Date(`${year}-04-18`), type: "NATIONAL" },
    { name: "Independence Day", date: new Date(`${year}-08-15`), type: "NATIONAL" },
    { name: "Gandhi Jayanti", date: new Date(`${year}-10-02`), type: "NATIONAL" },
    { name: "Diwali", date: new Date(`${year}-10-20`), type: "NATIONAL" },
    { name: "Christmas", date: new Date(`${year}-12-25`), type: "NATIONAL" },
  ];
  for (const h of holidays) {
    const existing = await db.holiday.findFirst({ where: { name: h.name, date: h.date } });
    if (!existing) await db.holiday.create({ data: h });
  }

  // Employees
  const empData = [
    { code: "EMP0001", first: "Rajesh", last: "Kumar", email: "rajesh.kumar@worknest.com", designation: "CTO", dept: eng.id, basic: 150000, type: "FULL_TIME" },
    { code: "EMP0002", first: "Priya", last: "Sharma", email: "priya.sharma@worknest.com", designation: "HR Manager", dept: hr.id, basic: 80000, type: "FULL_TIME" },
    { code: "EMP0003", first: "Arjun", last: "Mehta", email: "arjun.mehta@worknest.com", designation: "Senior Engineer", dept: eng.id, basic: 120000, type: "FULL_TIME" },
    { code: "EMP0004", first: "Sneha", last: "Patel", email: "sneha.patel@worknest.com", designation: "Sales Manager", dept: sales.id, basic: 90000, type: "FULL_TIME" },
    { code: "EMP0005", first: "Vikram", last: "Singh", email: "vikram.singh@worknest.com", designation: "Marketing Lead", dept: marketing.id, basic: 75000, type: "FULL_TIME" },
    { code: "EMP0006", first: "Ananya", last: "Reddy", email: "ananya.reddy@worknest.com", designation: "Software Engineer", dept: eng.id, basic: 85000, type: "FULL_TIME" },
    { code: "EMP0007", first: "Rohan", last: "Verma", email: "rohan.verma@worknest.com", designation: "Finance Analyst", dept: finance.id, basic: 65000, type: "FULL_TIME" },
    { code: "EMP0008", first: "Meera", last: "Nair", email: "meera.nair@worknest.com", designation: "Operations Manager", dept: ops.id, basic: 70000, type: "FULL_TIME" },
  ];

  const createdEmployees: Record<string, string> = {};

  for (const emp of empData) {
    const hra = emp.basic * 0.4;
    const da = emp.basic * 0.1;
    const ta = 3000;
    const pfEmployee = emp.basic * 0.12;
    const pfEmployer = emp.basic * 0.12;
    const professionalTax = 200;

    const created = await db.employee.upsert({
      where: { email: emp.email },
      update: {},
      create: {
        employeeCode: emp.code,
        firstName: emp.first,
        lastName: emp.last,
        email: emp.email,
        phone: `+91 98${Math.floor(10000000 + Math.random() * 90000000)}`,
        designation: emp.designation,
        departmentId: emp.dept,
        employmentType: emp.type,
        joiningDate: new Date(2023, Math.floor(Math.random() * 12), Math.floor(1 + Math.random() * 28)),
        status: "ACTIVE",
        workLocation: "Bengaluru Office",
        basicSalary: emp.basic,
        hra,
        da,
        ta,
        pfEmployee,
        pfEmployer,
        professionalTax,
        bankAccount: `${Math.floor(1000000000 + Math.random() * 9000000000)}`,
        bankName: "HDFC Bank",
        ifscCode: "HDFC0001234",
      },
    });
    createdEmployees[emp.email] = created.id;
  }

  // Users
  const userAccounts = [
    { email: "admin@worknest.com", password: "admin123", role: "ADMIN", empEmail: null },
    { email: "hr@worknest.com", password: "hr123", role: "HR", empEmail: "priya.sharma@worknest.com" },
    { email: "manager@worknest.com", password: "manager123", role: "MANAGER", empEmail: "rajesh.kumar@worknest.com" },
    { email: "emp@worknest.com", password: "emp123", role: "EMPLOYEE", empEmail: "arjun.mehta@worknest.com" },
  ];

  for (const u of userAccounts) {
    const existing = await db.user.findUnique({ where: { email: u.email } });
    if (!existing) {
      const hashed = await bcrypt.hash(u.password, 10);
      await db.user.create({
        data: {
          email: u.email,
          password: hashed,
          role: u.role,
          employeeId: u.empEmail ? createdEmployees[u.empEmail] : null,
        },
      });
    }
  }

  // Also create user accounts for employees that don't have one yet
  for (const emp of empData) {
    const existingByEmail = await db.user.findUnique({ where: { email: emp.email } });
    if (existingByEmail) continue;
    // Check if employee already has a user linked
    const empId = createdEmployees[emp.email];
    const existingByEmpId = empId ? await db.user.findUnique({ where: { employeeId: empId } }) : null;
    if (existingByEmpId) continue;

    const hashed = await bcrypt.hash("Welcome@123", 10);
    await db.user.create({
      data: {
        email: emp.email,
        password: hashed,
        role: "EMPLOYEE",
        employeeId: empId,
      },
    });
  }

  // Attendance — last 30 days for all employees
  const empIds = Object.values(createdEmployees);
  const today = new Date();
  for (const empId of empIds) {
    for (let i = 30; i >= 1; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const dayOfWeek = date.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) continue; // skip weekends

      const existing = await db.attendance.findUnique({ where: { employeeId_date: { employeeId: empId, date } } });
      if (existing) continue;

      const rand = Math.random();
      const isAbsent = rand < 0.05;
      const isHalfDay = !isAbsent && rand < 0.08;

      const checkIn = new Date(date);
      checkIn.setHours(9, Math.floor(Math.random() * 30), 0);
      const checkOut = new Date(date);
      checkOut.setHours(isHalfDay ? 13 : 18, Math.floor(Math.random() * 30), 0);

      await db.attendance.create({
        data: {
          employeeId: empId,
          date,
          checkIn: isAbsent ? null : checkIn,
          checkOut: isAbsent ? null : checkOut,
          hoursWorked: isAbsent ? null : isHalfDay ? 4 : parseFloat((Math.random() * 2 + 7).toFixed(1)),
          status: isAbsent ? "ABSENT" : isHalfDay ? "HALF_DAY" : "PRESENT",
        },
      });
    }
  }

  // Job Openings
  const jobsData = [
    { title: "Senior React Developer", dept: eng.id, type: "FULL_TIME", exp: "3-5 years", loc: "Bengaluru", openings: 2, desc: "We are looking for a Senior React Developer to join our growing engineering team. You will be responsible for building and maintaining high-quality web applications.\n\nKey responsibilities:\n- Design and implement UI components\n- Collaborate with backend engineers\n- Code review and mentoring", req: "- 3+ years React experience\n- TypeScript proficiency\n- Strong HTML/CSS skills", salary: "₹18-25 LPA" },
    { title: "HR Business Partner", dept: hr.id, type: "FULL_TIME", exp: "2-4 years", loc: "Bengaluru", openings: 1, desc: "Join our HR team to support business growth through effective people strategies.", req: "- MBA in HR preferred\n- Experience with HRMS tools\n- Strong communication skills", salary: "₹8-12 LPA" },
    { title: "Sales Executive", dept: sales.id, type: "FULL_TIME", exp: "1-3 years", loc: "Mumbai", openings: 3, desc: "Drive revenue growth by acquiring new clients and managing existing accounts.", req: "- B2B sales experience\n- Excellent communication\n- Target-driven mindset", salary: "₹6-10 LPA + incentives" },
  ];

  for (const job of jobsData) {
    const existing = await db.job.findFirst({ where: { title: job.title } });
    if (!existing) {
      await db.job.create({
        data: {
          title: job.title,
          departmentId: job.dept,
          type: job.type,
          experience: job.exp,
          location: job.loc,
          openings: job.openings,
          description: job.desc,
          requirements: job.req,
          salary: job.salary,
          status: "OPEN",
        },
      });
    }
  }

  // Announcements
  const announcements = [
    { title: "Welcome to WorkNest HRMS!", content: "We are excited to launch our new HR management platform. All employee data has been migrated. Please update your profile and verify your details.", priority: "HIGH", createdBy: "admin@worknest.com" },
    { title: "Q4 Performance Reviews Starting", content: "Annual performance reviews for Q4 will begin next week. All managers are requested to schedule 1:1 meetings with their team members by end of this month.", priority: "NORMAL", createdBy: "hr@worknest.com" },
    { title: "Office Holiday — Diwali", content: "The office will be closed for Diwali celebrations. Normal operations resume the following Monday. Have a safe and happy Diwali!", priority: "NORMAL", createdBy: "admin@worknest.com" },
  ];

  for (const ann of announcements) {
    const existing = await db.announcement.findFirst({ where: { title: ann.title } });
    if (!existing) await db.announcement.create({ data: ann });
  }

  // Goals
  const goalData = [
    { empEmail: "arjun.mehta@worknest.com", title: "Complete AWS Certification", category: "LEARNING", progress: 65, status: "IN_PROGRESS" },
    { empEmail: "priya.sharma@worknest.com", title: "Reduce Time-to-Hire by 20%", category: "PERFORMANCE", progress: 45, status: "IN_PROGRESS" },
    { empEmail: "sneha.patel@worknest.com", title: "Achieve Q4 Sales Target", category: "PERFORMANCE", progress: 80, status: "IN_PROGRESS" },
    { empEmail: "ananya.reddy@worknest.com", title: "Launch Mobile App Feature", category: "PERFORMANCE", progress: 100, status: "COMPLETED" },
  ];

  for (const g of goalData) {
    const empId = createdEmployees[g.empEmail];
    if (!empId) continue;
    const existing = await db.goal.findFirst({ where: { employeeId: empId, title: g.title } });
    if (!existing) {
      await db.goal.create({
        data: {
          employeeId: empId,
          title: g.title,
          category: g.category,
          progress: g.progress,
          status: g.status,
          year: new Date().getFullYear(),
          quarter: "Q4",
          targetDate: new Date(new Date().getFullYear(), 11, 31),
        },
      });
    }
  }

  console.log("✅ Seed complete!");
  console.log("\n📋 Demo Login Credentials:");
  console.log("  Admin:    admin@worknest.com / admin123");
  console.log("  HR:       hr@worknest.com / hr123");
  console.log("  Manager:  manager@worknest.com / manager123");
  console.log("  Employee: emp@worknest.com / emp123");
  console.log("\n🚀 Run: npm run dev");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
