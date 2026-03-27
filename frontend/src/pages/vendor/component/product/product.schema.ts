import { z } from "zod";

const requiredPositiveNumber = (msg = "Enter a valid number") =>
  z.coerce.number().min(0, msg);

const optionalPositiveNumber = (msg = "Enter a valid number") =>
  z.preprocess((v) => {
    if (v === "" || v === null || v === undefined) return undefined;
    const n = Number(v);
    return isNaN(n) ? undefined : n;
  }, z.number().min(0, msg).optional());

export const productSchema = z
  .object({
    name: z.string().min(2, "Product name must be at least 2 characters"),
    description: z.string().optional(),
    category: z.string().min(1, "Please select a category"),
    brand: z.string().optional(),
    sku: z.string().optional(),
    is_variable_quantity: z.boolean().default(false),

    minimum_quantity: optionalPositiveNumber("Enter a valid minimum quantity"),

    image: z
      .instanceof(File)
      .refine((f) => f.size <= 5 * 1024 * 1024, "Image must be under 5MB")
      .refine(
        (f) => ["image/jpeg", "image/png", "image/webp"].includes(f.type),
        "Only JPEG, PNG or WebP images are allowed",
      )
      .optional(),

    unit: z
      .enum(["each", "carton", "kg", "litre", "pack", "dozen", "bag", "box"])
      .default("each"),

    selling_price: requiredPositiveNumber("Enter a valid price"),

    cost_price: optionalPositiveNumber("Enter a valid cost price"),
    discount_price: optionalPositiveNumber("Enter a valid discount price"),

    discount_expires_at: z
      .string()
      .optional()
      .transform((v) => {
        if (!v) return undefined;
        if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return `${v}T23:59:59`;
        return v;
      }),

    tax_rate: z.preprocess((v) => {
      if (v === "" || v === null || v === undefined) return 0;
      const n = Number(v);
      return isNaN(n) ? 0 : n;
    }, z.number().min(0).max(100).default(0)),

    quantity_in_stock: z.preprocess(
      (v) => {
        if (v === "" || v === null || v === undefined) return 0;
        const n = Number(v);
        return isNaN(n) ? 0 : n;
      },
      z
        .number()
        .int("Quantity must be a whole number")
        .min(0, "Quantity cannot be negative"),
    ),

    low_stock_threshold: z.preprocess((v) => {
      if (v === "" || v === null || v === undefined) return 10;
      const n = Number(v);
      return isNaN(n) ? 10 : n;
    }, z.number().int().min(0).default(10)),
  })
  .refine(
    (data) => {
      if (data.discount_price && data.selling_price) {
        return data.discount_price < data.selling_price;
      }
      return true;
    },
    {
      message: "Discount price must be less than the selling price",
      path: ["discount_price"],
    },
  )
  .refine(
    (data) => {
      if (data.discount_price && !data.discount_expires_at) return false;
      return true;
    },
    {
      message: "Please set an expiry date for the discount",
      path: ["discount_expires_at"],
    },
  )

  .refine(
    (data) => {
      if (data.is_variable_quantity && data.minimum_quantity === undefined)
        return true; // optional, so allowed
      return true;
    },
    { message: "Enter a valid minimum quantity", path: ["minimum_quantity"] },
  );

export type ProductFormData = z.infer<typeof productSchema>;
