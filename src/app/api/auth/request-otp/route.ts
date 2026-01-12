import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

// Initialize nodemailer transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

// Generate a random 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Find customer by email
    let customer = await prisma.customer.findUnique({
      where: { email },
    });

    if (!customer) {
      const aCustomer = await prisma.customer.findFirst();
      if (!aCustomer) {
        // Create a default customer if none exist
        customer = await prisma.customer.create({
          data: {
            name: "Admin",
            email,
            isAdmin: true,
          },
        });
      }
    }

    // If customer doesn't exist, create one
    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // Generate OTP code valid for 10 minutes
    const otpCode = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Save OTP to database
    await prisma.customer.update({
      where: { id: customer.id },
      data: {
        otpCode,
        otpExpiresAt,
      },
    });

    // Send OTP via nodemailer if SMTP is configured
    if (
      process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASSWORD &&
      process.env.SMTP_FROM_EMAIL
    ) {
      try {
        await transporter.sendMail({
          to: email,
          from: process.env.SMTP_FROM_EMAIL,
          subject: "Your One-Time Login Code",
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
              <h2>Your Login Code</h2>
              <p>Use the following code to log in to your account:</p>
              <div style="background-color: #f0f0f0; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
                <h1 style="letter-spacing: 8px; margin: 0; font-size: 32px; font-weight: bold;">${otpCode}</h1>
              </div>
              <p>This code will expire in 10 minutes.</p>
              <p>If you didn't request this code, you can safely ignore this email.</p>
              <hr style="border: none; border-top: 1px solid #ccc; margin: 20px 0;" />
              <p style="color: #666; font-size: 12px;">Green's and Beans Grocery</p>
            </div>
          `,
          text: `Your login code is: ${otpCode}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this code, you can safely ignore this email.`,
        });
      } catch (emailError) {
        console.error("Error sending OTP email:", emailError);
        // Don't fail the request if email fails - OTP is still valid
      }
    } else {
      // Development fallback - log to console
      console.log(`OTP for ${email}: ${otpCode}`);
    }

    return NextResponse.json(
      {
        success: true,
        message: "OTP sent to your email",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error requesting OTP:", error);
    return NextResponse.json(
      { error: "Failed to request OTP" },
      { status: 500 }
    );
  }
}
