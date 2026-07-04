import { z } from "zod";
import type { Request, Response, NextFunction } from "express";

export function validateBody(schema: z.ZodTypeAny) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: result.error.issues.map((i) => `${i.path.join(".") || "body"}: ${i.message}`),
      });
    }
    req.body = result.data;
    next();
  };
}

const optionalString = z.string().optional();

export const patientCreateSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  phone: optionalString,
  email: optionalString,
  dob: optionalString,
  gender: optionalString,
  address: optionalString,
  medicalNotes: optionalString,
});

export const patientUpdateSchema = patientCreateSchema.partial();

const procedureSchema = z.object({
  name: z.string().min(1),
  cost: z.number().optional(),
});

export const visitCreateSchema = z.object({
  patientId: z.string().min(1, "patientId is required"),
  date: z.string().min(1, "date is required"),
  procedures: z.array(procedureSchema).optional(),
  totalCost: z.number().optional(),
  notes: optionalString,
});

export const visitUpdateSchema = visitCreateSchema.partial();

export const paymentCreateSchema = z.object({
  patientId: z.string().min(1, "patientId is required"),
  visitId: z.string().nullable().optional(),
  date: z.string().min(1, "date is required"),
  amount: z.number().optional(),
  method: optionalString,
  notes: optionalString,
  procedureNames: z.array(z.string()).optional(),
});

export const paymentUpdateSchema = paymentCreateSchema.partial();

export const appointmentCreateSchema = z.object({
  patientId: z.string().min(1, "patientId is required"),
  patientName: z.string().min(1, "patientName is required"),
  phone: optionalString,
  visitType: optionalString,
  dentistName: optionalString,
  date: z.string().min(1, "date is required"),
  startTime: z.string().min(1, "startTime is required"),
  endTime: z.string().min(1, "endTime is required"),
  notes: optionalString,
  status: optionalString,
  paymentStatus: optionalString,
});

export const appointmentUpdateSchema = appointmentCreateSchema.partial();

export const toothTreatmentCreateSchema = z.object({
  patientId: z.string().min(1, "patientId is required"),
  visitId: z.string().min(1, "visitId is required"),
  toothNumber: z.number(),
  procedure: z.string().min(1, "procedure is required"),
  status: optionalString,
  notes: optionalString,
  cost: z.number().optional(),
  doctorName: optionalString,
});

export const toothTreatmentUpdateSchema = toothTreatmentCreateSchema.partial();

export const settingsUpdateSchema = z.object({
  clinicName: optionalString,
  currency: optionalString,
  commonProcedures: z.array(procedureSchema).optional(),
});
