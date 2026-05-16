import bcrypt from "bcryptjs";
import type { Request, Response } from "express";
import { prisma } from "../db.js";
import { authSchema } from "../types/auth-schema.js";
import { createToken } from "../utils/auth.js";
import { sendValidationError } from "../utils/validation.js";

export async function signup(req: Request, res: Response): Promise<void> {
  const parsedBody = authSchema.safeParse(req.body);
  if (!parsedBody.success) {
    sendValidationError(res, parsedBody.error);
    return;
  }

  const { username, password } = parsedBody.data;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
      },
    });

    res.status(201).json({
      token: createToken({ userId: user.id }),
      userId: user.id,
      username: user.username,
    });
  } catch {
    res.status(409).json({ error: "username already exists" });
  }
}

export async function signin(req: Request, res: Response): Promise<void> {
  const { success, data, error } = authSchema.safeParse(req.body);

  if (!success) {
    sendValidationError(res, error);
    return
  }

  const { username, password } = data;

  const user = await prisma.user.findFirst({
    where: {
      username
    }
  })

  if (!user) {
    res.status(403).json({
      message: "user is not present "
    })
    return
  }
  
  const isPassword = await  bcrypt.compare(password, user?.password);
  if (!isPassword) {
    res.status(403).json({
      message: "user password is wrong"
    })
    return;
  }

  res.status(201).json({
    token: createToken({ userId: user.id }),
    userId: user.id,
    username: user.username,
  });


}
