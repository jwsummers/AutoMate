import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.2";
import { Resend } from "npm:resend@2.0.0";

// Initialize Resend client for email sending
const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// Configure CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface MaintenancePrediction {
  id: string;
  vehicleId: string;
  type: string;
  title: string;
  description: string;
  predictedDate: string;
  predictedMileage: number | null;
  confidence: number;
  vehicleName: string;
  daysUntilDue: number;
  userId: string;
  userEmail: string;
}

interface ReminderRequest {
  predictions?: MaintenancePrediction[];
  userId?: string;
  forceEmail?: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting maintenance reminder function");
    
    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { predictions, userId, forceEmail } = (await req.json()) as ReminderRequest;
    
    // Process specific predictions if provided
    if (predictions && predictions.length > 0) {
      console.log(`Processing ${predictions.length} specific predictions`);
      
      for (const prediction of predictions) {
        if (prediction.userEmail) {
          await sendReminderEmail(prediction);
          await recordReminderSent(supabase, prediction.userId, prediction.vehicleId, prediction.id, "email");
        }
      }
      
      return new Response(
        JSON.stringify({ success: true, count: predictions.length }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    // If userId provided, check only that user's predictions
    if (userId || forceEmail) {
      console.log(`Processing reminders for user: ${userId}`);
      await processUserReminders(supabase, userId, Boolean(forceEmail));
      
      return new Response(
        JSON.stringify({ success: true }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    // Otherwise check all users with due predictions
    console.log("Processing reminders for all users");
    await processAllUserReminders(supabase);
    
    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in maintenance reminder function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

// Process reminders for a single user
async function processUserReminders(
  supabase: any,
  userId: string | undefined,
  forceEmail: boolean = false
): Promise<void> {
  // Get user details and their reminder preferences
  const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
  if (userError) throw userError;
  
  const user = userData.user;
  if (!user || !user.email) {
    console.log("User not found or no email available");
    return;
  }

  // Get user's reminder preferences
  const { data: preferences, error: prefError } = await supabase
    .from("reminder_preferences")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (prefError) throw prefError;

  // Use defaults if no preferences found
  const reminderPrefs = preferences || {
    email_reminders: true,
    reminder_days_before: [14, 7, 1],
    last_reminded_at: null,
  };

  if (!reminderPrefs.email_reminders && !forceEmail) {
    console.log("User has disabled email reminders");
    return;
  }

  // Get the user's vehicles
  const { data: vehicles, error: vehiclesError } = await supabase
    .from("vehicles")
    .select("*")
    .eq("user_id", user.id);

  if (vehiclesError) throw vehiclesError;
  
  if (!vehicles || vehicles.length === 0) {
    console.log("User has no vehicles");
    return;
  }

  // Get the user's maintenance records
  const { data: maintenanceRecords, error: maintenanceError } = await supabase
    .from("maintenance_records")
    .select("*")
    .eq("user_id", user.id);

  if (maintenanceError) throw maintenanceError;

  // Generate predictions (simplified version of the frontend logic)
  // In a real application, this should either:
  // 1. Use shared code between frontend and backend
  // 2. Store predictions in the database
  
  // For this example, we'll just pass some basic data
  // In a real implementation, you'd want to port the prediction logic
  // from utils/maintenancePredictions.ts to this function
  
  // Mock prediction for demo
  for (const vehicle of vehicles) {
    const vehicleName = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
    
    // Check if we've already sent a reminder for this prediction recently
    const { data: recentReminder } = await supabase
      .from("sent_reminders")
      .select("*")
      .eq("vehicle_id", vehicle.id)
      .eq("user_id", user.id)
      .order("sent_at", { ascending: false })
      .limit(1);
    
    const now = new Date();
    const lastReminderDate = recentReminder && recentReminder.length > 0 
      ? new Date(recentReminder[0].sent_at) 
      : new Date(0);
      
    // Only send a reminder if it's been at least 3 days since the last one
    // or if we're forcing an email
    const daysSinceLastReminder = Math.floor((now.getTime() - lastReminderDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (forceEmail || daysSinceLastReminder >= 3) {
      // Create a mock prediction for demonstration
      const mockPrediction: MaintenancePrediction = {
        id: `mock-${vehicle.id}`,
        vehicleId: vehicle.id,
        type: "oil_change",
        title: "Oil Change",
        description: `Your ${vehicleName} is due for an oil change soon.`,
        predictedDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        predictedMileage: (vehicle.mileage || 0) + 500,
        confidence: 80,
        vehicleName,
        daysUntilDue: 7,
        userId: user.id,
        userEmail: user.email
      };

      // Send the email
      await sendReminderEmail(mockPrediction);
      
      // Record that we sent a reminder
      await recordReminderSent(supabase, user.id, vehicle.id, mockPrediction.id, "email");
    } else {
      console.log(`Skipping reminder for ${vehicleName}, last reminder was ${daysSinceLastReminder} days ago`);
    }
  }

  // Update the last reminded timestamp
  await supabase
    .from("reminder_preferences")
    .upsert({
      user_id: user.id,
      last_reminded_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  console.log(`Processed reminders for user ${user.email}`);
}

// Process reminders for all users
async function processAllUserReminders(supabase: any): Promise<void> {
  // Get all users with reminder preferences
  const { data: preferences, error: prefError } = await supabase
    .from("reminder_preferences")
    .select("user_id")
    .eq("email_reminders", true);

  if (prefError) throw prefError;

  if (!preferences || preferences.length === 0) {
    console.log("No users with reminder preferences found");
    return;
  }

  console.log(`Processing reminders for ${preferences.length} users`);
  
  // Process each user's reminders
  for (const pref of preferences) {
    try {
      await processUserReminders(supabase, pref.user_id);
    } catch (error) {
      console.error(`Error processing reminders for user ${pref.user_id}:`, error);
      // Continue with next user
    }
  }

  console.log(`Completed processing reminders for all users`);
}

// Send an email reminder for a maintenance prediction
async function sendReminderEmail(prediction: MaintenancePrediction): Promise<void> {
  console.log(`Sending reminder email for ${prediction.title} to ${prediction.userEmail}`);
  
  try {
    const predictedDate = new Date(prediction.predictedDate).toLocaleDateString();
    
    const emailResponse = await resend.emails.send({
      from: "AutoMaintenance Reminder <reminders@yourdomain.com>",
      to: [prediction.userEmail],
      subject: `Maintenance Reminder: ${prediction.title} for your ${prediction.vehicleName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4353fa;">Maintenance Reminder</h2>
          <p>Hello,</p>
          <p>This is a friendly reminder about upcoming maintenance for your <strong>${prediction.vehicleName}</strong>:</p>
          
          <div style="border-left: 4px solid #4353fa; padding: 10px; background-color: #f8f9fa; margin: 20px 0;">
            <h3 style="margin-top: 0;">${prediction.title}</h3>
            <p>${prediction.description}</p>
            <p><strong>Due:</strong> ${predictedDate} (${prediction.daysUntilDue} days from now)</p>
            ${prediction.predictedMileage ? 
              `<p><strong>Predicted at:</strong> ${prediction.predictedMileage.toLocaleString()} miles</p>` : ''}
            <p><strong>Confidence:</strong> ${prediction.confidence}%</p>
          </div>
          
          <p>Maintaining your vehicle on schedule helps ensure its reliability, safety, and longevity.</p>
          
          <p style="margin-top: 30px; font-size: 0.9em; color: #666;">
            You're receiving this because you signed up for maintenance reminders.
            <br>
            <a href="#" style="color: #4353fa;">Manage your notification preferences</a>
          </p>
        </div>
      `,
    });
    
    console.log("Email sent successfully:", emailResponse);
  } catch (error) {
    console.error("Error sending reminder email:", error);
    throw error;
  }
}

// Record that a reminder was sent in the database
async function recordReminderSent(
  supabase: any,
  userId: string,
  vehicleId: string,
  predictionId: string,
  reminderType: string
): Promise<void> {
  const { error } = await supabase.from("sent_reminders").insert({
    user_id: userId,
    vehicle_id: vehicleId,
    maintenance_prediction_id: predictionId,
    type: "maintenance",
    reminder_type: reminderType,
  });

  if (error) {
    console.error("Error recording reminder:", error);
    throw error;
  }
}

serve(handler);
