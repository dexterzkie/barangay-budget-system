-- CreateTable
CREATE TABLE "FundAllocation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fundType" TEXT NOT NULL,
    "allocatedAmount" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Approved',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Expenditure" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL,
    "referenceNo" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Approved',
    "fundAllocationId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Expenditure_fundAllocationId_fkey" FOREIGN KEY ("fundAllocationId") REFERENCES "FundAllocation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "FundAllocation_fundType_key" ON "FundAllocation"("fundType");

-- CreateIndex
CREATE UNIQUE INDEX "Expenditure_referenceNo_key" ON "Expenditure"("referenceNo");
