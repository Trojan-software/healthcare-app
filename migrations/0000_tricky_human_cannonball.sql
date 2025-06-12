CREATE TABLE "alerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"patient_id" text NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"is_resolved" boolean DEFAULT false NOT NULL,
	"doctor_notified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "checkup_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"patient_id" text NOT NULL,
	"date" timestamp NOT NULL,
	"status" text NOT NULL,
	"vital_signs_id" integer,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "otp_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"code" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"is_used" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reminder_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"patient_id" text NOT NULL,
	"frequency" integer NOT NULL,
	"push_notifications" boolean DEFAULT true NOT NULL,
	"email_alerts" boolean DEFAULT true NOT NULL,
	"sms_reminders" boolean DEFAULT false NOT NULL,
	"start_time" text DEFAULT '08:00' NOT NULL,
	"end_time" text DEFAULT '22:00' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "reminder_settings_patient_id_unique" UNIQUE("patient_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"email" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"mobile_number" text NOT NULL,
	"patient_id" text NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"role" text DEFAULT 'patient' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_patient_id_unique" UNIQUE("patient_id")
);
--> statement-breakpoint
CREATE TABLE "vital_signs" (
	"id" serial PRIMARY KEY NOT NULL,
	"patient_id" text NOT NULL,
	"heart_rate" integer,
	"blood_pressure_systolic" integer,
	"blood_pressure_diastolic" integer,
	"temperature" numeric(4, 1),
	"oxygen_level" integer,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
