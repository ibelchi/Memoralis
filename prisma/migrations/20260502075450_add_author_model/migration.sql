-- CreateTable
CREATE TABLE "Author" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "avatarPath" TEXT
);

-- CreateIndex
CREATE UNIQUE INDEX "Author_name_key" ON "Author"("name");
