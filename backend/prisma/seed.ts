import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // --- Admin Users ---
  const captainPass = await bcrypt.hash('captain123', 10)
  const treasurerPass = await bcrypt.hash('treasurer123', 10)
  const secretaryPass = await bcrypt.hash('secretary123', 10)
  const residentPass = await bcrypt.hash('resident123', 10)

  await prisma.user.upsert({
    where: { username: 'captain' },
    update: {},
    create: { username: 'captain', password: captainPass, role: 'Barangay Captain', fullName: 'Barangay Captain' }
  })

  await prisma.user.upsert({
    where: { username: 'treasurer' },
    update: {},
    create: { username: 'treasurer', password: treasurerPass, role: 'Barangay Treasurer', fullName: 'Barangay Treasurer' }
  })

  await prisma.user.upsert({
    where: { username: 'secretary' },
    update: {},
    create: { username: 'secretary', password: secretaryPass, role: 'Barangay Secretary', fullName: 'Barangay Secretary' }
  })

  await prisma.user.upsert({
    where: { username: 'resident' },
    update: {},
    create: { username: 'resident', password: residentPass, role: 'Resident', fullName: 'Juan dela Cruz' }
  })

  // --- Fund Allocations ---
  const generalFund = await prisma.fundAllocation.upsert({
    where: { fundType: 'General Fund' },
    update: {},
    create: { fundType: 'General Fund', allocatedAmount: 8500000, status: 'Approved' }
  })
  const specialEdFund = await prisma.fundAllocation.upsert({
    where: { fundType: 'Special Education Fund' },
    update: {},
    create: { fundType: 'Special Education Fund', allocatedAmount: 2000000, status: 'Approved' }
  })
  const disasterFund = await prisma.fundAllocation.upsert({
    where: { fundType: 'Disaster Relief Fund' },
    update: {},
    create: { fundType: 'Disaster Relief Fund', allocatedAmount: 1500000, status: 'Approved' }
  })
  const infraFund = await prisma.fundAllocation.upsert({
    where: { fundType: 'Infrastructure Fund' },
    update: {},
    create: { fundType: 'Infrastructure Fund', allocatedAmount: 500000, status: 'Completed' }
  })

  // --- Expenditures ---
  const expenditures = [
    { date: new Date('2026-01-15'), referenceNo: 'EXP-2026-001', description: 'January General Expenses', amount: 350000, fundAllocationId: generalFund.id },
    { date: new Date('2026-02-10'), referenceNo: 'EXP-2026-002', description: 'February Maintenance & Operations', amount: 380000, fundAllocationId: generalFund.id },
    { date: new Date('2026-03-05'), referenceNo: 'EXP-2026-003', description: 'March Education Supplies', amount: 410000, fundAllocationId: specialEdFund.id },
    { date: new Date('2026-04-12'), referenceNo: 'EXP-2026-004', description: 'April Calamity Prep', amount: 390000, fundAllocationId: disasterFund.id },
    { date: new Date('2026-05-20'), referenceNo: 'EXP-2026-005', description: 'May Road Repair', amount: 450000, fundAllocationId: infraFund.id },
    { date: new Date('2026-06-05'), referenceNo: 'EXP-2026-006', description: 'June Mid-Year Operations', amount: 420000, fundAllocationId: generalFund.id },
  ]

  // Clear old expenditures to reset the trend line
  await prisma.expenditure.deleteMany({})

  for (const exp of expenditures) {
    await prisma.expenditure.upsert({
      where: { referenceNo: exp.referenceNo },
      update: {},
      create: { ...exp, status: 'Approved' }
    })
  }

  console.log('✅ Seed complete! Accounts:')
  console.log('   Barangay Captain   → username: captain   | password: captain123')
  console.log('   Barangay Treasurer → username: treasurer | password: treasurer123')
  console.log('   Barangay Secretary → username: secretary | password: secretary123')
  console.log('   Resident           → username: resident  | password: resident123')
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
