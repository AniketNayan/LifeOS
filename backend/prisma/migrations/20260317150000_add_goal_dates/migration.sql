-- Add start and end dates to goals
ALTER TABLE "Goal"
ADD COLUMN "startDate" TIMESTAMP(3),
ADD COLUMN "endDate" TIMESTAMP(3);
