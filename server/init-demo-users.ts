import bcrypt from "bcrypt";
import { storage } from "./storage";

async function initDemoUsers() {
  try {
    console.log("Initializing demo users...");
    
    // Hash passwords
    const adminPasswordHash = await bcrypt.hash("admin123", 10);
    const patientPasswordHash = await bcrypt.hash("patient123", 10);
    
    // Check if admin user exists
    const existingAdmin = await storage.getUserByEmail("admin@24x7teleh.com");
    if (!existingAdmin) {
      const adminUser = await storage.createUser({
        email: "admin@24x7teleh.com",
        password: adminPasswordHash,
        firstName: "Admin",
        lastName: "User",
        username: "admin",
        mobileNumber: "+1234567890",
        patientId: "ADM001",
        role: "admin",
        isVerified: true
      });
      console.log("Created admin user:", adminUser.email);
    } else {
      // Update existing admin user with hashed password
      await storage.updateUser(existingAdmin.id, { password: adminPasswordHash });
      console.log("Updated admin user password");
    }
    
    // Check if patient user exists
    const existingPatient = await storage.getUserByEmail("patient.demo@example.com");
    if (!existingPatient) {
      const patientUser = await storage.createUser({
        email: "patient.demo@example.com",
        password: patientPasswordHash,
        firstName: "John",
        lastName: "Doe",
        username: "patient_demo",
        mobileNumber: "+1987654321",
        patientId: "PT001",
        role: "patient",
        isVerified: true
      });
      console.log("Created patient user:", patientUser.email);
    } else {
      // Update existing patient user with hashed password
      await storage.updateUser(existingPatient.id, { password: patientPasswordHash });
      console.log("Updated patient user password");
    }
    
    console.log("Demo users initialization complete");
  } catch (error) {
    console.error("Error initializing demo users:", error);
  }
}

initDemoUsers();