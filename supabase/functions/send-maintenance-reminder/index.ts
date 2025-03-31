
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.29.0";
import { Resend } from "npm:resend@2.0.0";

// Define CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MaintenancePrediction {
  id: string;
  type: string;
  serviceName: string;
  daysUntilDue: number;
  milesUntilDue: number;
  vehicleId: string;
  vehicleName: string;
}

interface User {
  id: string;
  email: string;
  user_metadata: {
    full_name?: string;
  };
}

interface ReminderPreferences {
  id: string;
  user_id: string;
  email_reminders: boolean;
  push_reminders: boolean;
  reminder_days_before: number[];
  last_reminded_at: string | null;
}

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const resendApiKey = Deno.env.get("RESEND_API_KEY") || "";

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase environment variables");
    }
    if (!resendApiKey) {
      throw new Error("Missing Resend API key");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const resend = new Resend(resendApiKey);

    // Parse request body
    const requestData = await req.json();
    const { userId, forceEmail = false } = requestData;

    if (!userId) {
      throw new Error("User ID is required");
    }

    // Get the user data
    const { data: userData, error: userError } = await supabase
      .auth
      .admin
      .getUserById(userId);

    if (userError || !userData) {
      throw new Error(`Error fetching user: ${userError?.message || "User not found"}`);
    }

    const user = userData.user as unknown as User;

    // Get user's reminder preferences
    const { data: reminderPrefs, error: prefError } = await supabase
      .from("reminder_preferences")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (prefError) {
      throw new Error(`Error fetching reminder preferences: ${prefError.message}`);
    }

    // If no preferences found or email reminders disabled and not forcing, exit
    if (!reminderPrefs || (!reminderPrefs.email_reminders && !forceEmail)) {
      return new Response(
        JSON.stringify({ message: "No email reminders to send" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const preferences = reminderPrefs as ReminderPreferences;

    // Get user's vehicles
    const { data: vehicles, error: vehiclesError } = await supabase
      .from("vehicles")
      .select("*")
      .eq("user_id", userId);

    if (vehiclesError) {
      throw new Error(`Error fetching vehicles: ${vehiclesError.message}`);
    }

    if (!vehicles || vehicles.length === 0) {
      return new Response(
        JSON.stringify({ message: "User has no vehicles" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // For a test email, we'll just create some sample predictions
    let maintenancePredictions: MaintenancePrediction[] = [];
    
    if (forceEmail) {
      // Create sample predictions for test email
      const vehicle = vehicles[0] as Vehicle;
      maintenancePredictions = [
        {
          id: "test-prediction-1",
          type: "oil_change",
          serviceName: "Oil Change",
          daysUntilDue: 7,
          milesUntilDue: 500,
          vehicleId: vehicle.id,
          vehicleName: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
        },
        {
          id: "test-prediction-2",
          type: "tire_rotation",
          serviceName: "Tire Rotation",
          daysUntilDue: 14,
          milesUntilDue: 1000,
          vehicleId: vehicle.id,
          vehicleName: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
        }
      ];
    } else {
      // TODO: Get actual maintenance predictions that are due
      // This would involve more complex logic with your prediction system
      // ...
    }

    if (maintenancePredictions.length === 0 && !forceEmail) {
      return new Response(
        JSON.stringify({ message: "No maintenance due soon" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Send email reminder
    if (preferences.email_reminders || forceEmail) {
      // Build HTML content
      const userName = user.user_metadata?.full_name || "there";
      let maintenanceItems = "";
      
      maintenancePredictions.forEach((prediction) => {
        maintenanceItems += `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${prediction.serviceName}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${prediction.vehicleName}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">In ${prediction.daysUntilDue} days or ${prediction.milesUntilDue} miles</td>
        </tr>
        `;
      });

      const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Maintenance Reminder</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          table { width: 100%; border-collapse: collapse; }
          th { text-align: left; padding: 10px; background-color: #eee; }
          .footer { margin-top: 20px; text-align: center; font-size: 12px; color: #666; }
          .button { display: inline-block; background-color: #4F46E5; color: white; padding: 10px 20px; 
                   text-decoration: none; border-radius: 4px; margin-top: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Maintenance Reminder</h1>
          </div>
          <div class="content">
            <p>Hi ${userName},</p>
            <p>This is a friendly reminder that you have the following maintenance items due soon:</p>
            
            <table>
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Vehicle</th>
                  <th>Due</th>
                </tr>
              </thead>
              <tbody>
                ${maintenanceItems}
              </tbody>
            </table>
            
            <p>Keeping up with regular maintenance helps extend the life of your vehicle and prevents costly repairs down the road.</p>
            
            <div style="text-align: center;">
              <a href="${supabaseUrl}" class="button">View Details</a>
            </div>
          </div>
          <div class="footer">
            <p>This is an automated reminder from your vehicle maintenance tracker.</p>
            <p>You can adjust your notification settings in your profile preferences.</p>
          </div>
        </div>
      </body>
      </html>
      `;

      try {
        const emailResponse = await resend.emails.send({
          from: "Maintenance Reminder <onboarding@resend.dev>",
          to: [user.email],
          subject: "Vehicle Maintenance Reminder",
          html: emailHtml,
        });

        console.log("Email sent:", emailResponse);

        // Update last reminded timestamp
        if (!forceEmail) {
          await supabase
            .from("reminder_preferences")
            .update({ last_reminded_at: new Date().toISOString() })
            .eq("user_id", userId);
        }

        // Log sent reminders to the sent_reminders table
        if (maintenancePredictions.length > 0 && !forceEmail) {
          const sentRemindersData = maintenancePredictions.map((pred) => ({
            user_id: userId,
            vehicle_id: pred.vehicleId,
            maintenance_prediction_id: pred.id,
            type: pred.type,
            reminder_type: "email",
          }));

          await supabase.from("sent_reminders").insert(sentRemindersData);
        }

      } catch (emailError: any) {
        console.error("Error sending email:", emailError);
        throw new Error(`Failed to send email: ${emailError.message}`);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Reminders sent successfully" 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error: any) {
    console.error("Error in send-maintenance-reminder function:", error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
