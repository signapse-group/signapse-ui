import { z } from "zod"

export const smtpSecurityModeSchema = z.enum(["STARTTLS", "TLS"])
export const SMTP_CONFIGURATION_VERSION_CONFLICT =
  "SMTP_CONFIGURATION_VERSION_CONFLICT"

export type SmtpSecurityMode = z.infer<typeof smtpSecurityModeSchema>

export interface SmtpConfigurationResponse {
  configured: boolean
  enabled: boolean
  passwordConfigured: boolean
  version: number | null
  host?: string | null
  port?: number | null
  username?: string | null
  securityMode?: SmtpSecurityMode | null
  fromAddress?: string | null
  fromName?: string | null
}

export interface SmtpConfigurationRequest {
  host: string
  port: number
  username: string
  password?: string
  securityMode: SmtpSecurityMode
  fromAddress: string
  fromName?: string
  version?: number
}

export interface SmtpConfigurationVersionRequest {
  version: number
}

export type SmtpConfigurationActionResult<T = void> =
  { success: true; data: T } | { success: false; error: string; code?: string }

export interface SmtpConfigurationValidationMessages {
  hostRequired: string
  portRequired: string
  portInteger: string
  portRange: string
  usernameRequired: string
  fromAddressRequired: string
  fromAddressInvalid: string
  passwordRequired: string
  passwordBlank: string
  versionRequired: string
  invalidRequest: string
}

export function getSmtpConfigurationRequestSchema(
  messages: SmtpConfigurationValidationMessages,
  options: { requirePassword?: boolean } = {}
) {
  const schema = z
    .object({
      host: z
        .string()
        .min(1, { error: messages.hostRequired })
        .refine((value) => value.trim().length > 0, {
          error: messages.hostRequired,
        }),
      port: z
        .number({ error: messages.portRequired })
        .int({ error: messages.portInteger })
        .min(1, { error: messages.portRange })
        .max(65535, { error: messages.portRange }),
      username: z
        .string()
        .min(1, { error: messages.usernameRequired })
        .refine((value) => value.trim().length > 0, {
          error: messages.usernameRequired,
        }),
      password: z.string().min(1, { error: messages.passwordBlank }).optional(),
      securityMode: smtpSecurityModeSchema,
      fromAddress: z
        .string()
        .min(1, { error: messages.fromAddressRequired })
        .refine((value) => value.trim().length > 0, {
          error: messages.fromAddressRequired,
        })
        .pipe(z.email({ error: messages.fromAddressInvalid })),
      fromName: z.string().optional(),
      version: z.number().int().optional(),
    })
    .strict()

  if (!options.requirePassword) return schema

  return schema.superRefine((request, context) => {
    if (request.password === undefined) {
      context.addIssue({
        code: "custom",
        path: ["password"],
        message: messages.passwordRequired,
      })
    }
  })
}

export function getSmtpConfigurationVersionRequestSchema(
  messages: SmtpConfigurationValidationMessages
) {
  return z.object({
    version: z.number({ error: messages.versionRequired }).int(),
  })
}

export const smtpConfigurationResponseSchema = z.object({
  configured: z.boolean(),
  enabled: z.boolean(),
  passwordConfigured: z.boolean(),
  version: z.number().int().nullable(),
  host: z.string().nullable().optional(),
  port: z.number().int().nullable().optional(),
  username: z.string().nullable().optional(),
  securityMode: smtpSecurityModeSchema.nullable().optional(),
  fromAddress: z.string().nullable().optional(),
  fromName: z.string().nullable().optional(),
  createdDate: z.string().optional(),
  lastModifiedDate: z.string().optional(),
})
