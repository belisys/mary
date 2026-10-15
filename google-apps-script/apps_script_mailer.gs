/**
 * =========================================================================
 * GOOGLE APPS SCRIPT: Mary's Sanctuary Silent Visitor Notification Engine
 * =========================================================================
 * 
 * INSTRUCTIONS TO SET UP (Takes 60 seconds):
 * 1. Go to https://script.google.com while logged into your Google/Gmail account.
 * 2. Click "New Project" (top left).
 * 3. Delete any default code in Code.gs, and paste this entire script.
 * 4. (Optional) In line 21, confirm your email address or leave Session.getActiveUser().getEmail().
 * 5. Click "Deploy" (top right) -> "New deployment".
 * 6. Under "Select type" (gear icon) -> choose "Web app".
 * 7. In the configuration popup:
 *    - Description: "Mary Visitor Alert"
 *    - Execute as: "Me" (your email)
 *    - Who has access: "Anyone" (crucial so Mary's browser can quietly ping it)
 * 8. Click "Deploy" -> Grant permissions (Google will show a one-time safety confirmation).
 * 9. Copy the generated "Web App URL" (ends in /exec).
 * 10. Open js/config.js in this project and paste your URL into `webhookUrl`!
 * 
 * DONE! Every time Mary visits the website from anywhere in the world (Egypt,
 * Saudi Arabia, UK, Europe, etc.), Google will send a detailed, beautifully
 * formatted notification straight into your Gmail mailbox!
 */

function doPost(e) {
  try {
    var rawData = e.postData ? e.postData.contents : null;
    if (!rawData) {
      return ContentService.createTextOutput(JSON.stringify({ status: "no_data" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    var data = JSON.parse(rawData);
    var recipientEmail = Session.getActiveUser().getEmail();
    
    // Extract location info
    var country = data.country_name || "Unknown Country";
    var countryCode = data.country_code || "";
    var flag = getFlagEmoji(countryCode);
    var city = data.city || "Unknown City";
    var region = data.region || "";
    var ip = data.ip || "Unknown IP";
    var isp = data.isp || data.org || "Network Unknown";
    var timezone = data.timezone || "Unknown Timezone";
    var localTime = data.local_time || new Date().toLocaleString();
    
    // Extract device info
    var device = data.device || "Unknown Device";
    var os = data.os || "Unknown OS";
    var browser = data.browser || "Unknown Browser";
    var screenRes = data.screen || "Unknown";
    var userAgent = data.userAgent || "";
    
    // Extract engagement info
    var unlockedCount = data.unlocked_count || 0;
    var durationSec = data.duration_seconds || 0;
    var eventType = data.event || "VISIT"; // 'VISIT' or 'HEARTBEAT' or 'INTERACTION'
    
    // Construct Email Subject
    var subject = "💖 Mary just opened her heart from " + city + ", " + country + " " + flag + "!";
    if (eventType === "INTERACTION") {
      subject = "✨ Mary is interacting with her heart (" + unlockedCount + " memories unlocked)!";
    }

    // Google Maps Link for her location
    var mapsQuery = encodeURIComponent(city + " " + country);
    var mapsUrl = "https://www.google.com/maps/search/?api=1&query=" + mapsQuery;

    // Beautiful HTML Email Body
    var htmlBody = 
      "<div style='font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0b0b10; color: #f0f0f5; border-radius: 16px; overflow: hidden; border: 1px solid #2a1f2d;'>" +
        "<div style='background: linear-gradient(135deg, #e11d48, #881337); padding: 28px 24px; text-align: center;'>" +
          "<h1 style='margin: 0; font-size: 24px; font-weight: 700; color: #ffffff; letter-spacing: 0.5px;'>💖 Mary is thinking of you</h1>" +
          "<p style='margin: 8px 0 0; color: #fecdd3; font-size: 14px;'>She just visited the sanctuary website.</p>" +
        "</div>" +
        
        "<div style='padding: 24px;'>" +
          // Location Card
          "<div style='background-color: #171520; border-radius: 12px; padding: 18px; margin-bottom: 16px; border: 1px solid #322538;'>" +
            "<h3 style='margin: 0 0 12px; font-size: 15px; color: #fda4af; text-transform: uppercase; letter-spacing: 1px; display: flex; align-items: center;'>" +
              "📍 Location & Context " + flag +
            "</h3>" +
            "<table style='width: 100%; border-collapse: collapse; font-size: 14px;'>" +
              "<tr><td style='color: #94a3b8; padding: 5px 0;'>Location:</td><td style='color: #ffffff; font-weight: 600; text-align: right;'>" + city + (region ? ", " + region : "") + ", " + country + " " + flag + "</td></tr>" +
              "<tr><td style='color: #94a3b8; padding: 5px 0;'>Public IP:</td><td style='color: #f43f5e; font-family: monospace; text-align: right; font-weight: 600;'>" + ip + "</td></tr>" +
              "<tr><td style='color: #94a3b8; padding: 5px 0;'>Provider / Carrier:</td><td style='color: #cbd5e1; text-align: right;'>" + isp + "</td></tr>" +
              "<tr><td style='color: #94a3b8; padding: 5px 0;'>Timezone:</td><td style='color: #cbd5e1; text-align: right;'>" + timezone + "</td></tr>" +
              "<tr><td style='color: #94a3b8; padding: 5px 0;'>Her Local Time:</td><td style='color: #fbbf24; text-align: right; font-weight: 500;'>" + localTime + "</td></tr>" +
            "</table>" +
            "<div style='margin-top: 12px; text-align: right;'>" +
              "<a href='" + mapsUrl + "' style='color: #f43f5e; text-decoration: none; font-size: 12px; font-weight: 600;'>View " + city + " on Google Maps &rarr;</a>" +
            "</div>" +
          "</div>" +

          // Device Card
          "<div style='background-color: #171520; border-radius: 12px; padding: 18px; margin-bottom: 16px; border: 1px solid #322538;'>" +
            "<h3 style='margin: 0 0 12px; font-size: 15px; color: #fda4af; text-transform: uppercase; letter-spacing: 1px;'>" +
              "📱 Device & Session" +
            "</h3>" +
            "<table style='width: 100%; border-collapse: collapse; font-size: 14px;'>" +
              "<tr><td style='color: #94a3b8; padding: 5px 0;'>Device:</td><td style='color: #ffffff; text-align: right; font-weight: 600;'>" + device + " (" + os + ")</td></tr>" +
              "<tr><td style='color: #94a3b8; padding: 5px 0;'>Browser:</td><td style='color: #cbd5e1; text-align: right;'>" + browser + "</td></tr>" +
              "<tr><td style='color: #94a3b8; padding: 5px 0;'>Screen Display:</td><td style='color: #cbd5e1; text-align: right;'>" + screenRes + "</td></tr>" +
              "<tr><td style='color: #94a3b8; padding: 5px 0;'>Memories Clicked:</td><td style='color: #38bdf8; text-align: right; font-weight: 700;'>" + unlockedCount + " secrets</td></tr>" +
            "</table>" +
          "</div>" +

          // Emotional Insight Note
          "<div style='background-color: #1a101b; border-left: 3px solid #f43f5e; padding: 14px 16px; border-radius: 0 8px 8px 0; font-size: 13px; color: #e2e8f0; line-height: 1.5;'>" +
            "<em>\"She paused her day in " + city + " to look at this heart. Every visit is a quiet heartbeat connecting you both across any distance.\"</em>" +
          "</div>" +
        "</div>" +

        "<div style='background-color: #08080c; padding: 16px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #221a28;'>" +
          "Mary's Sanctuary Telemetry Engine • Private Notification" +
        "</div>" +
      "</div>";

    // Plain text alternative
    var plainBody = 
      "💖 Mary just opened her heart!\n\n" +
      "Location: " + city + (region ? ", " + region : "") + ", " + country + "\n" +
      "Public IP: " + ip + "\n" +
      "ISP/Carrier: " + isp + "\n" +
      "Timezone: " + timezone + " (" + localTime + ")\n" +
      "Device: " + device + " (" + os + ") / " + browser + "\n" +
      "Screen: " + screenRes + "\n" +
      "Memories Unlocked: " + unlockedCount + "\n\n" +
      "Map: " + mapsUrl;

    MailApp.sendEmail({
      to: recipientEmail,
      subject: subject,
      body: plainBody,
      htmlBody: htmlBody
    });

    return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Email dispatched" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "online",
    service: "Mary Sanctuary Telemetry Mailer",
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

// Helper: Convert 2-letter ISO country code into emoji flag
function getFlagEmoji(countryCode) {
  if (!countryCode || countryCode.length !== 2) return "🌍";
  countryCode = countryCode.toUpperCase();
  var codePoints = countryCode
    .split('')
    .map(function(char) { return 127397 + char.charCodeAt(0); });
  return String.fromCodePoint.apply(null, codePoints);
}
