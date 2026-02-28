import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient({});

async function main() {
  console.log("🌱 Seeding CrewSync database...");

  // Clean existing data
  await prisma.activityLog.deleteMany();
  await prisma.messageLog.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.checkInOut.deleteMany();
  await prisma.jobTask.deleteMany();
  await prisma.job.deleteMany();
  await prisma.proposalItem.deleteMany();
  await prisma.proposal.deleteMany();
  await prisma.treePhoto.deleteMany();
  await prisma.tree.deleteMany();
  await prisma.propertyPhoto.deleteMany();
  await prisma.property.deleteMany();
  await prisma.client.deleteMany();
  await prisma.crewMembership.deleteMany();
  await prisma.crew.deleteMany();
  await prisma.serviceCatalog.deleteMany();
  await prisma.automationRule.deleteMany();
  await prisma.routePlan.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();
  await prisma.company.deleteMany();

  const hash = await bcrypt.hash("demo1234", 10);

  // ─── Company ─────────────────────────────────────────────────────────────
  const company = await prisma.company.create({
    data: {
      name: "Green Valley Tree Service",
      phone: "(503) 555-0100",
      email: "office@greenvalleytrees.com",
      address: "1420 Oak Ridge Blvd",
      city: "Portland",
      state: "OR",
      zip: "97201",
    },
  });

  // ─── Users ───────────────────────────────────────────────────────────────
  const owner = await prisma.user.create({
    data: {
      companyId: company.id,
      name: "Jordan Hayes",
      email: "owner@demo.com",
      password: hash,
      role: "OWNER",
      phone: "(503) 555-0101",
    },
  });

  const jane = await prisma.user.create({
    data: {
      companyId: company.id,
      name: "Jane Arborist",
      email: "jane@demo.com",
      password: hash,
      role: "SALES_ARBORIST",
      phone: "(503) 555-0102",
    },
  });

  const mike = await prisma.user.create({
    data: {
      companyId: company.id,
      name: "Mike Leader",
      email: "mike@demo.com",
      password: hash,
      role: "CREW_LEADER",
      phone: "(503) 555-0103",
    },
  });

  // ─── Crews ───────────────────────────────────────────────────────────────
  const crew1 = await prisma.crew.create({
    data: {
      companyId: company.id,
      name: "Alpha Crew",
      color: "#10b981",
      members: {
        create: [
          { userId: mike.id, isLeader: true },
        ],
      },
    },
  });

  // ─── Service Catalog ─────────────────────────────────────────────────────
  const services = await Promise.all([
    prisma.serviceCatalog.create({ data: { companyId: company.id, name: "Crown Pruning", description: "Selective removal of branches", unitPrice: 350, unit: "tree" } }),
    prisma.serviceCatalog.create({ data: { companyId: company.id, name: "Tree Removal", description: "Complete removal including stump grinding", unitPrice: 1200, unit: "tree" } }),
    prisma.serviceCatalog.create({ data: { companyId: company.id, name: "Stump Grinding", description: "Grind stump to below grade", unitPrice: 250, unit: "stump" } }),
    prisma.serviceCatalog.create({ data: { companyId: company.id, name: "Health Assessment", description: "Full arborist inspection + report", unitPrice: 150, unit: "visit" } }),
    prisma.serviceCatalog.create({ data: { companyId: company.id, name: "Emergency Call", description: "Emergency storm/hazard response", unitPrice: 500, unit: "hour" } }),
  ]);

  // ─── Clients ─────────────────────────────────────────────────────────────
  const client1 = await prisma.client.create({
    data: {
      companyId: company.id,
      firstName: "James",
      lastName: "Harrington",
      email: "james.h@example.com",
      phone: "(503) 555-1001",
      address: "142 Oakwood Drive",
      city: "Portland",
      state: "OR",
      zip: "97201",
      source: "Referral",
    },
  });

  const client2 = await prisma.client.create({
    data: {
      companyId: company.id,
      firstName: "Sarah",
      lastName: "Chen",
      email: "sarah.chen@example.com",
      phone: "(503) 555-1002",
      address: "87 Maple Creek Ln",
      city: "Portland",
      state: "OR",
      zip: "97209",
      source: "Website",
    },
  });

  const client3 = await prisma.client.create({
    data: {
      companyId: company.id,
      firstName: "Robert",
      lastName: "Martinez",
      email: "r.martinez@example.com",
      phone: "(503) 555-1003",
      city: "Beaverton",
      state: "OR",
      zip: "97005",
      source: "Google",
    },
  });

  // ─── Properties ──────────────────────────────────────────────────────────
  const prop1 = await prisma.property.create({
    data: {
      companyId: company.id,
      clientId: client1.id,
      name: "Harrington Residence",
      address: "142 Oakwood Drive",
      city: "Portland",
      state: "OR",
      zip: "97201",
      lat: 45.5231,
      lng: -122.6765,
      accessNotes: "Gate code: 1234. Dogs in backyard.",
    },
  });

  const prop2 = await prisma.property.create({
    data: {
      companyId: company.id,
      clientId: client1.id,
      name: "Harrington Rental",
      address: "789 Pine St",
      city: "Portland",
      state: "OR",
      zip: "97202",
      lat: 45.5195,
      lng: -122.6731,
    },
  });

  const prop3 = await prisma.property.create({
    data: {
      companyId: company.id,
      clientId: client2.id,
      name: "Chen Property",
      address: "87 Maple Creek Ln",
      city: "Portland",
      state: "OR",
      zip: "97209",
      lat: 45.5335,
      lng: -122.6890,
      accessNotes: "Park on street. Call ahead.",
    },
  });

  const prop4 = await prisma.property.create({
    data: {
      companyId: company.id,
      clientId: client2.id,
      name: "Chen Vacation Home",
      address: "201 Birch Ave",
      city: "Lake Oswego",
      state: "OR",
      zip: "97034",
      lat: 45.4246,
      lng: -122.6707,
    },
  });

  const prop5 = await prisma.property.create({
    data: {
      companyId: company.id,
      clientId: client3.id,
      name: "Martinez Home",
      address: "456 Cedar Blvd",
      city: "Beaverton",
      state: "OR",
      zip: "97005",
      lat: 45.4871,
      lng: -122.8037,
    },
  });

  // ─── Trees ───────────────────────────────────────────────────────────────
  const trees = await Promise.all([
    // prop1 trees
    prisma.tree.create({ data: { propertyId: prop1.id, treeNumber: 1, species: "Douglas Fir", dbh: 24, heightEst: 80, lat: 45.5232, lng: -122.6766, status: "HEALTHY", riskRating: "LOW" } }),
    prisma.tree.create({ data: { propertyId: prop1.id, treeNumber: 2, species: "Big Leaf Maple", dbh: 18, heightEst: 50, lat: 45.5230, lng: -122.6764, status: "WORK_NEEDED", riskRating: "MODERATE", workNotes: "Large dead limbs over roof need removal" } }),
    prisma.tree.create({ data: { propertyId: prop1.id, treeNumber: 3, species: "Western Red Cedar", dbh: 12, heightEst: 40, lat: 45.5233, lng: -122.6763, status: "MONITOR", riskRating: "LOW", healthNotes: "Some tip dieback noted" } }),
    // prop3 trees
    prisma.tree.create({ data: { propertyId: prop3.id, treeNumber: 1, species: "Oregon White Oak", dbh: 36, heightEst: 65, lat: 45.5336, lng: -122.6891, status: "HAZARD", riskRating: "HIGH", workNotes: "Major structural failure risk. Codominant stems with included bark." } }),
    prisma.tree.create({ data: { propertyId: prop3.id, treeNumber: 2, species: "Japanese Maple", dbh: 6, heightEst: 15, lat: 45.5334, lng: -122.6889, status: "HEALTHY", riskRating: "LOW" } }),
    // prop5 trees
    prisma.tree.create({ data: { propertyId: prop5.id, treeNumber: 1, species: "Willow Oak", dbh: 20, heightEst: 55, lat: 45.4872, lng: -122.8038, status: "WORK_NEEDED", riskRating: "MODERATE" } }),
    prisma.tree.create({ data: { propertyId: prop5.id, treeNumber: 2, species: "Silver Maple", dbh: 28, heightEst: 60, lat: 45.4870, lng: -122.8036, status: "MONITOR", riskRating: "LOW" } }),
  ]);

  // ─── Proposals ───────────────────────────────────────────────────────────
  const now = new Date();

  const prop1Draft = await prisma.proposal.create({
    data: {
      companyId: company.id,
      propertyId: prop1.id,
      createdById: jane.id,
      number: "PRO-2024-001",
      status: "DRAFT",
      title: "Harrington — Spring Maintenance",
      subtotal: 700,
      taxRate: 0,
      taxAmount: 0,
      discount: 0,
      total: 700,
      validUntil: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      items: {
        create: [
          { treeId: trees[1].id, serviceId: services[0].id, description: "Crown pruning — Big Leaf Maple (T2) dead limb removal", quantity: 1, unitPrice: 350, total: 350, sortOrder: 0 },
          { treeId: trees[2].id, serviceId: services[0].id, description: "Crown cleaning — Western Red Cedar (T3)", quantity: 1, unitPrice: 350, total: 350, sortOrder: 1 },
        ],
      },
    },
  });

  const prop3Sent = await prisma.proposal.create({
    data: {
      companyId: company.id,
      propertyId: prop3.id,
      createdById: jane.id,
      number: "PRO-2024-002",
      status: "SENT",
      title: "Chen — Hazard Oak Removal",
      subtotal: 1350,
      taxRate: 0,
      taxAmount: 0,
      discount: 0,
      total: 1350,
      sentAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      validUntil: new Date(now.getTime() + 27 * 24 * 60 * 60 * 1000),
      items: {
        create: [
          { treeId: trees[3].id, serviceId: services[1].id, description: "Remove Oregon White Oak (T1) — hazard tree", quantity: 1, unitPrice: 1200, total: 1200, sortOrder: 0 },
          { serviceId: services[3].id, description: "Post-removal inspection report", quantity: 1, unitPrice: 150, total: 150, sortOrder: 1 },
        ],
      },
    },
  });

  const prop5Approved = await prisma.proposal.create({
    data: {
      companyId: company.id,
      propertyId: prop5.id,
      createdById: jane.id,
      number: "PRO-2024-003",
      status: "APPROVED",
      title: "Martinez — Willow Oak Pruning",
      subtotal: 350,
      taxRate: 0,
      taxAmount: 0,
      discount: 0,
      total: 350,
      sentAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      approvedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      items: {
        create: [
          { treeId: trees[5].id, serviceId: services[0].id, description: "Crown pruning — Willow Oak (T1)", quantity: 1, unitPrice: 350, total: 350, sortOrder: 0 },
        ],
      },
    },
  });

  // ─── Jobs ─────────────────────────────────────────────────────────────────
  const job1 = await prisma.job.create({
    data: {
      companyId: company.id,
      propertyId: prop5.id,
      proposalId: prop5Approved.id,
      assignedToId: mike.id,
      number: "JOB-2024-001",
      status: "SCHEDULED",
      title: "Martinez — Willow Oak Pruning",
      scheduledDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
      scheduledStart: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000),
      durationEst: 180,
      instructions: "Prune Willow Oak (T1) per proposal scope. Crown clean, remove deadwood.",
      tasks: {
        create: [
          { treeId: trees[5].id, description: "Crown prune Willow Oak T1", sortOrder: 0 },
          { description: "Clean up debris and chip", sortOrder: 1 },
          { description: "Send completion photos to office", sortOrder: 2 },
        ],
      },
    },
  });

  const job2 = await prisma.job.create({
    data: {
      companyId: company.id,
      propertyId: prop1.id,
      assignedToId: mike.id,
      number: "JOB-2024-002",
      status: "COMPLETED",
      title: "Harrington — Emergency Branch",
      scheduledDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      startedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000),
      completedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000 + 11 * 60 * 60 * 1000),
      durationEst: 60,
      tasks: { create: [{ description: "Remove fallen branch from driveway", completed: true, sortOrder: 0 }] },
    },
  });

  // ─── Invoice ─────────────────────────────────────────────────────────────
  const invoice1 = await prisma.invoice.create({
    data: {
      companyId: company.id,
      clientId: client3.id,
      jobId: job2.id,
      number: "INV-2024-001",
      status: "PAID",
      subtotal: 350,
      taxAmount: 0,
      total: 350,
      amountPaid: 350,
      paidAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      payments: {
        create: [{ amount: 350, method: "check", reference: "CHK-1042" }],
      },
    },
  });

  // ─── Activity Logs ────────────────────────────────────────────────────────
  await prisma.activityLog.createMany({
    data: [
      { propertyId: prop1.id, userId: jane.id, action: "proposal.created", detail: "Created PRO-2024-001" },
      { propertyId: prop3.id, userId: jane.id, action: "proposal.sent", detail: "Sent PRO-2024-002 to Sarah Chen" },
      { propertyId: prop5.id, userId: jane.id, action: "proposal.approved", detail: "PRO-2024-003 approved by Robert Martinez" },
      { propertyId: prop5.id, userId: mike.id, action: "job.scheduled", detail: "JOB-2024-001 scheduled" },
      { propertyId: prop1.id, userId: mike.id, action: "job.completed", detail: "JOB-2024-002 completed" },
    ],
  });

  // ─── Default Automation Rules ─────────────────────────────────────────────
  await prisma.automationRule.createMany({
    data: [
      { companyId: company.id, name: "Proposal Approved → Create Job", trigger: "proposal.approved", action: "create_job", config: "{}", active: true },
      { companyId: company.id, name: "Job Scheduled → SMS Client", trigger: "job.scheduled", action: "send_sms", config: '{"template":"appointment_confirmation"}', active: false },
      { companyId: company.id, name: "Job Completed → Create Invoice", trigger: "job.completed", action: "create_invoice", config: "{}", active: true },
      { companyId: company.id, name: "Invoice Paid → Review Request", trigger: "invoice.paid", action: "send_sms", config: '{"template":"review_request"}', active: false },
    ],
  });

  console.log("✅ Seed complete!");
  console.log("   Login: owner@demo.com / demo1234");
  console.log("   Also:  jane@demo.com  / demo1234");
  console.log("   Also:  mike@demo.com  / demo1234");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
