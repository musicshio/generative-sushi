import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from '@prisma/adapter-pg'
import { withAccelerate } from "@prisma/extension-accelerate";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })

const prisma = new PrismaClient({ adapter }).$extends(withAccelerate());

export default prisma;
