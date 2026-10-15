/**
 * =========================================================================
 * GOOGLE APPS SCRIPT BACKEND: MARY'S PRIVATE LETTER SANCTUARY (VERSION 3)
 * =========================================================================
 * Deployed as: Google Apps Script Web App
 * Executes as: Me (Nader)
 * Who has access: Anyone
 *
 * SPECIFICATION & FIXES:
 * 1. Clean Subject Line: Zero emojis in subject line to prevent diamond question marks (\uFFFD\uFFFD\uFFFD\uFFFD).
 * 2. All Timestamps Collected & Displayed:
 *    - Morocco Local Time ("Africa/Casablanca" - automatic GMT+1 / Ramadan handling)
 *    - Sender Device Local Time & Time Zone
 *    - Universal UTC Time
 * 3. Network & Device Fingerprint:
 *    - Public IP Address (prominently displayed in header and body)
 *    - Geolocation & ISP (City, Country, Network Provider)
 *    - Device Platform, Screen Resolution, Browser User-Agent
 * 4. Three-Field Question Verification:
 *    - "On which day did we first talk?"
 *    - Requires Year: 2026, Month: 08, Day: 23 (2026-08-23).
 * 5. File Whitelist: Photos (JPEG, PNG, WebP, HEIC/HEIF, GIF) & Videos (MP4, WebM, MOV, 3GP) up to 22 MB.
 * 6. Unlimited Text Length: Full heartfelt letters preserved with zero truncation.
 * 7. Absolute Privacy: Nader's email address exists only here on Google's cloud server.
 */

const RECIPIENT_EMAIL = "naderabdellatif01@gmail.com";
const REQUIRED_DATE_KEY = "2026-08-23"; // Day of first conversation
const VAULT_FOLDER_NAME = "Mary_Nader_Remember_Me_Vault";
const VAULT_INDEX_FILENAME = "memories.json";

// Whitelist: Photos and Videos only
const ALLOWED_MIME_TYPES = [
  // Images
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "image/gif",
  // Videos
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-msvideo",
  "video/3gpp",
  "video/ogg"
];

const MAX_ATTACHMENT_BYTES = 22 * 1024 * 1024; // 22 MB safe limit for Gmail

/**
 * ✦ ONE-TIME AUTHORIZATION HELPER:
 * Select this function in the Apps Script top toolbar dropdown and click "Run" (▶).
 * Accept permissions to authorize Google Drive cloud storage.
 */
function authorizeDrive() {
  const folder = getOrCreateVaultFolder();
  const testFile = folder.createFile("auth_test.txt", "Drive write access confirmed!");
  testFile.setTrashed(true);
  Logger.log("Google Drive full write & create access verified! Folder: " + folder.getName());
}

/**
 * ✦ ONE-CLICK VAULT CLEANER:
 * Select "clearAllVaultMemories" in the Apps Script top toolbar dropdown and click "Run" (▶).
 * This instantly deletes all test photos and resets the vault to 0 memories!
 */
function clearAllVaultMemories() {
  saveVaultMemories([]);
  Logger.log("Shared Photo Vault successfully reset to 0 memories! Clean for Nader & Mary.");
}

/**
 * Handle GET requests: Fetch live memories from the Vault (Supports direct JSON and JSONP)
 */
function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) || "get_memories";
    const callback = e && e.parameter && e.parameter.callback;

    if (action === "clear_vault" || action === "clear_memories") {
      saveVaultMemories([]);
      return jsonResponse({ status: "success", message: "Vault memories cleared", memories: [] }, callback);
    }

    if (action === "delete_memory") {
      const memoryId = e && e.parameter && e.parameter.id;
      return handleDeleteMemory(memoryId, callback);
    }

    if (action === "get_memories") {
      const memories = getVaultMemories();
      return jsonResponse({ status: "success", memories: memories }, callback);
    }
    return jsonResponse({ status: "success", message: "Sanctuary API online" }, callback);
  } catch (err) {
    return jsonResponse({ status: "error", error: err.toString() }, e && e.parameter && e.parameter.callback);
  }
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({ status: "error", error: "Empty request payload" });
    }

    const data = JSON.parse(e.postData.contents);

    // 1. Anti-spam honeypot
    if (data.hp && data.hp.trim() !== "") {
      return jsonResponse({ status: "success" }); // silently drop bots
    }

    // Check if this is a Shared Photo Vault delete request
    if (data.action === "delete_memory") {
      return handleDeleteMemory(data.id);
    }

    // Check if this is a Shared Photo Vault upload
    if (data.action === "vault_upload") {
      return handleVaultUpload(data);
    }

    // 2. Question Verification: "On which day did we first talk?" -> 2026-08-23
    const submittedDateKey = (data.dateKey || "").trim();
    if (submittedDateKey !== REQUIRED_DATE_KEY) {
      return jsonResponse({
        status: "error",
        error: "Incorrect verification answer. Please answer: On which day did we first talk? (Year: 2026, Month: 08, Day: 23)"
      });
    }

    // 3. Extract Message, Subject, and Device Metadata
    const subject = (data.subject || "A whisper from Mary").trim();
    const message = (data.message || "").trim();
    const clientIp = (data.clientIp || "Unknown / Not detected").trim();
    const ipLocation = (data.ipLocation || "").trim();
    const clientLocalTime = (data.clientLocalTime || "Not reported").trim();
    const clientTimezone = (data.clientTimezone || "Unknown").trim();
    const clientUtcTime = (data.clientUtcTime || "").trim();
    const platform = (data.platform || "Unknown").trim();
    const screen = (data.screen || "Unknown").trim();
    const userAgent = (data.userAgent || "Unknown").trim();

    // Extended super useful device & browser characteristics
    const sessionDuration = (data.sessionDuration || "").trim();
    const deviceType = (data.deviceType || "").trim();
    const deviceModel = (data.deviceModel || "").trim();
    const screenResolution = (data.screenResolution || screen || "Unknown").trim();
    const viewport = (data.viewport || "").trim();
    const devicePixelRatio = (data.devicePixelRatio || "").trim();
    const screenOrientation = (data.screenOrientation || "").trim();
    const touchCapability = (data.touchCapability || "").trim();
    const colorGamut = (data.colorGamut || "").trim();
    const cpuCores = (data.cpuCores || "").trim();
    const deviceRam = (data.deviceRam || "").trim();
    const gpuRenderer = (data.gpuRenderer || "").trim();
    const batteryStatus = (data.batteryStatus || "").trim();
    const connectionMedium = (data.connectionMedium || "").trim();
    const networkSpeed = (data.networkSpeed || "").trim();
    const systemLanguages = (data.systemLanguages || "").trim();
    const colorTheme = (data.colorTheme || "").trim();

    // Private IP, Local Network, Router & Visitor Fingerprint
    const privateIp = (data.privateIp || "").trim();
    const localCandidate = (data.localCandidate || "").trim();
    const routerModel = (data.routerModel || "").trim();
    const visitorFingerprint = (data.visitorFingerprint || "").trim();
    const photoExif = data.photoExif || null;

    const mediaBase64 = data.mediaBase64 || data.photoBase64 || "";
    const mediaName = data.mediaName || data.photoName || "attachment";
    const mediaMime = (data.mediaMime || data.photoMime || "").toLowerCase();

    if (!message && !mediaBase64) {
      return jsonResponse({
        status: "error",
        error: "Message or media attachment is required."
      });
    }

    // 4. File Whitelist & Size Validation
    const attachments = [];
    if (mediaBase64) {
      const isAllowedMime = ALLOWED_MIME_TYPES.some(allowed => mediaMime.startsWith(allowed) || mediaMime === allowed);
      if (!isAllowedMime) {
        return jsonResponse({
          status: "error",
          error: "Invalid file type. Only photos (JPEG, PNG, WebP, HEIC) and videos (MP4, WebM, MOV) are allowed."
        });
      }

      const commaIdx = mediaBase64.indexOf(",");
      const rawBase64 = commaIdx !== -1 ? mediaBase64.substring(commaIdx + 1) : mediaBase64;
      const bytes = Utilities.base64Decode(rawBase64);

      if (bytes.length > MAX_ATTACHMENT_BYTES) {
        return jsonResponse({
          status: "error",
          error: "Attachment exceeds the 22MB size limit."
        });
      }

      const blob = Utilities.newBlob(bytes, mediaMime, mediaName);
      attachments.push(blob);
    }

    // 5. Timestamps: Morocco (Africa/Casablanca) & UTC
    const timestampMorocco = Utilities.formatDate(new Date(), "Africa/Casablanca", "yyyy-MM-dd HH:mm:ss 'GMT'XXX");
    const timestampUtc = Utilities.formatDate(new Date(), "Etc/UTC", "yyyy-MM-dd HH:mm:ss 'UTC'");

    // 6. 100% Safe Clean Subject (NO emojis to prevent diamond question marks )
    const emailSubject = "[Mary's Sanctuary] " + subject;

    // 7. Media Badge
    const isVideo = mediaMime.startsWith("video/");
    const isPhoto = mediaMime.startsWith("image/");
    const mediaTypeLabel = isVideo ? "Video Clip" : isPhoto ? "Photo" : "Media";

    // 8. Photo EXIF block (GPS, capture time, camera model, lens)
    let exifBlockPlain = "";
    let exifBlockHtml = "";
    if (photoExif) {
      const gpsPartPlain = photoExif.gps ?
        "• GPS Coordinates:   " + photoExif.gps.formatted + (photoExif.gps.altitude ? " (Alt: " + photoExif.gps.altitude + ")" : "") + "\n" +
        "• Google Maps Link:  " + photoExif.gps.mapsUrl + "\n" :
        "• GPS Coordinates:   None embedded in image file\n";

      const gpsPartHtml = photoExif.gps ?
        `&bull; GPS Coordinates:   <strong>${escapeHtml(photoExif.gps.formatted)}</strong>${photoExif.gps.altitude ? ` (Alt: ${escapeHtml(photoExif.gps.altitude)})` : ''}\n` +
        `&bull; Google Maps:       <a href="${photoExif.gps.mapsUrl}" target="_blank" style="color: #38bdf8; text-decoration: underline;">Open Location in Google Maps</a>\n` :
        `&bull; GPS Coordinates:   None embedded in image file\n`;

      const detailsPlain =
        (photoExif.captureTime ? "• Capture Timestamp: " + photoExif.captureTime + " (Original Camera Shot Time)\n" : "") +
        (photoExif.make || photoExif.model ? "• Camera Device:     " + [photoExif.make, photoExif.model].filter(Boolean).join(" ") + "\n" : "") +
        (photoExif.lensModel ? "• Lens Model:        " + photoExif.lensModel + "\n" : "") +
        (photoExif.iso || photoExif.exposureTime || photoExif.fNumber ? "• Camera Settings:   " + [photoExif.iso, photoExif.exposureTime, photoExif.fNumber, photoExif.focalLength].filter(Boolean).join(" • ") + "\n" : "") +
        (photoExif.software ? "• Camera Software:   " + photoExif.software + "\n" : "");

      const detailsHtml =
        (photoExif.captureTime ? `&bull; Capture Timestamp: <strong>${escapeHtml(photoExif.captureTime)}</strong> (Original Camera Shot Time)\n` : "") +
        (photoExif.make || photoExif.model ? `&bull; Camera Device:     <strong>${escapeHtml([photoExif.make, photoExif.model].filter(Boolean).join(" "))}</strong>\n` : "") +
        (photoExif.lensModel ? `&bull; Lens Model:        ${escapeHtml(photoExif.lensModel)}\n` : "") +
        (photoExif.iso || photoExif.exposureTime || photoExif.fNumber ? `&bull; Camera Settings:   ${escapeHtml([photoExif.iso, photoExif.exposureTime, photoExif.fNumber, photoExif.focalLength].filter(Boolean).join(" • "))}\n` : "") +
        (photoExif.software ? `&bull; Camera Software:   ${escapeHtml(photoExif.software)}\n` : "");

      exifBlockPlain =
        "\n=======================================================\n" +
        "✦ PHOTO EXIF METADATA (FULL RAW IMAGE ATTACHED - ZERO STRIPPING)\n" +
        "=======================================================\n" +
        gpsPartPlain + detailsPlain;

      exifBlockHtml =
        "\n=======================================================\n" +
        "✦ PHOTO EXIF METADATA (FULL RAW IMAGE ATTACHED - ZERO STRIPPING)\n" +
        "=======================================================\n" +
        gpsPartHtml + detailsHtml;
    }

    // 9. Plain Text Body (Guaranteed to show IP, Private IP, Device Details & Timestamps in any mail client)
    const plainBody =
      "PUBLIC IP:          " + clientIp + "\n" +
      (privateIp ? "PRIVATE / LOCAL IP: " + privateIp + (localCandidate ? " [Candidate: " + localCandidate + "]" : "") + "\n" : "") +
      (routerModel ? "ROUTER / GATEWAY:   " + routerModel + "\n" : "") +
      (ipLocation ? "LOCATION / ISP:     " + ipLocation + "\n" : "") +
      (connectionMedium ? "CONNECTION TYPE:    " + connectionMedium + "\n" : "") +
      (networkSpeed ? "NETWORK SPEED:      " + networkSpeed + "\n" : "") +
      (visitorFingerprint ? "VISITOR FINGERPRINT:" + visitorFingerprint + " (Hardware Device Identifier)\n" : "") +
      "MOROCCO TIME:       " + timestampMorocco + "\n" +
      "DEVICE LOCAL TIME:  " + clientLocalTime + " (" + clientTimezone + ")\n" +
      "UTC TIME:           " + timestampUtc + "\n" +
      (sessionDuration ? "TIME ON PAGE:       " + sessionDuration + " (spent in heart before sending)\n" : "") +
      "VERIFICATION:       \"On which day did we first talk?\" -> " + submittedDateKey + " (VERIFIED)\n\n" +
      (deviceModel ? "DEVICE & MODEL:     " + deviceModel + (deviceType ? " [" + deviceType + "]" : "") + "\n" : "") +
      (screenOrientation || touchCapability ? "HOLDING & INPUT:    " + [screenOrientation, touchCapability].filter(Boolean).join(" • ") + "\n" : "") +
      "SCREEN & DISPLAY:   " + screenResolution + (viewport ? " (Window: " + viewport + ")" : "") + (devicePixelRatio ? " • " + devicePixelRatio : "") + (colorGamut ? " • " + colorGamut : "") + "\n" +
      (gpuRenderer && gpuRenderer !== "Not exposed" && gpuRenderer !== "Unavailable" ? "GRAPHICS (GPU):     " + gpuRenderer + "\n" : "") +
      (cpuCores || deviceRam ? "HARDWARE SPECS:     " + [cpuCores, deviceRam].filter(Boolean).join(" • ") + "\n" : "") +
      (batteryStatus && batteryStatus !== "Not exposed by browser" ? "BATTERY & POWER:    " + batteryStatus + "\n" : "") +
      (colorTheme || systemLanguages ? "SYSTEM PREFERENCES: " + [colorTheme, systemLanguages ? "Languages: " + systemLanguages : ""].filter(Boolean).join(" • ") + "\n" : "") +
      "USER-AGENT:         " + userAgent + "\n" +
      exifBlockPlain + "\n" +
      "-------------------------------------------------------\n" +
      "SUBJECT: " + subject + "\n" +
      "-------------------------------------------------------\n" +
      (message || "[No text written — media attachment only]") + "\n\n" +
      (attachments.length > 0 ?
        "ATTACHMENT (" + mediaTypeLabel + "): " + mediaName + " (" + mediaMime + ")\n\n" : "") +
      "3D Cosmic Heart Sanctuary • Nader & Mary\n";

    // 10. Rich HTML Body: Metadata as RAW TEXT, only Letter (Subject, Message, Attachments) in Colored Template
    const htmlBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 680px; margin: 0 auto; padding: 12px;">
        
        <!-- RAW TEXT METADATA (Unstyled, pure plain text) -->
        <pre style="font-family: Consolas, 'Courier New', Monaco, monospace; font-size: 12px; line-height: 1.65; color: #334155; background: transparent; border: none; padding: 0; margin: 0 0 24px 0; white-space: pre-wrap; word-break: break-all;">PUBLIC IP:          ${escapeHtml(clientIp)}
${privateIp ? `PRIVATE / LOCAL IP: ${escapeHtml(privateIp)}${localCandidate ? ` [Candidate: ${escapeHtml(localCandidate)}]` : ''}\n` : ''}${routerModel ? `ROUTER / GATEWAY:   ${escapeHtml(routerModel)}\n` : ''}${ipLocation ? `LOCATION / ISP:     ${escapeHtml(ipLocation)}\n` : ''}${connectionMedium ? `CONNECTION TYPE:    ${escapeHtml(connectionMedium)}\n` : ''}${networkSpeed ? `NETWORK SPEED:      ${escapeHtml(networkSpeed)}\n` : ''}${visitorFingerprint ? `VISITOR FINGERPRINT:${escapeHtml(visitorFingerprint)}\n` : ''}MOROCCO TIME:       ${timestampMorocco}
DEVICE LOCAL TIME:  ${escapeHtml(clientLocalTime)} (${escapeHtml(clientTimezone)})
UTC TIME:           ${timestampUtc}
${sessionDuration ? `TIME ON PAGE:       ${escapeHtml(sessionDuration)} (spent in heart before sending)\n` : ''}VERIFICATION:       "On which day did we first talk?" -&gt; ${submittedDateKey} (VERIFIED: Day of first conversation)

${deviceModel ? `DEVICE &amp; MODEL:     ${escapeHtml(deviceModel)}${deviceType ? ` [${escapeHtml(deviceType)}]` : ''}\n` : ''}${screenOrientation || touchCapability ? `HOLDING &amp; INPUT:    ${escapeHtml([screenOrientation, touchCapability].filter(Boolean).join(' • '))}\n` : ''}SCREEN &amp; DISPLAY:   ${escapeHtml(screenResolution)}${viewport ? ` (Window: ${escapeHtml(viewport)})` : ''}${devicePixelRatio ? ` &bull; ${escapeHtml(devicePixelRatio)}` : ''}${colorGamut ? ` &bull; ${escapeHtml(colorGamut)}` : ''}
${gpuRenderer && gpuRenderer !== 'Not exposed' && gpuRenderer !== 'Unavailable' ? `GRAPHICS (GPU):     ${escapeHtml(gpuRenderer)}\n` : ''}${cpuCores || deviceRam ? `HARDWARE SPECS:     ${escapeHtml([cpuCores, deviceRam].filter(Boolean).join(' • '))}\n` : ''}${batteryStatus && batteryStatus !== 'Not exposed by browser' ? `BATTERY &amp; POWER:    ${escapeHtml(batteryStatus)}\n` : ''}${colorTheme || systemLanguages ? `SYSTEM PREFERENCES: ${escapeHtml([colorTheme, systemLanguages ? `Languages: ${systemLanguages}` : ''].filter(Boolean).join(' • '))}\n` : ''}USER-AGENT:         ${escapeHtml(userAgent)}${exifBlockHtml}</pre>

        <!-- STYLED COLORED FORM: LETTER ONLY -->
        <div style="background: #0d0a14; color: #f8fafc; border-radius: 18px; padding: 26px; border: 1px solid #f43f5e; box-shadow: 0 10px 30px rgba(244,63,94,0.18);">
          
          <!-- Header -->
          <div style="border-bottom: 1px solid rgba(244,63,94,0.3); padding-bottom: 14px; margin-bottom: 18px;">
            <h2 style="margin: 0; color: #fda4af; font-size: 22px; font-weight: 600; letter-spacing: 0.5px;">&#x2728; New Letter from Mary</h2>
            <p style="margin: 4px 0 0 0; color: #94a3b8; font-size: 13px;">Received via Secret Sanctuary Heart</p>
          </div>

          <!-- Subject in Colored Banner -->
          <div style="background: rgba(244,63,94,0.14); border: 1px solid rgba(244,63,94,0.35); border-radius: 12px; padding: 14px 18px; margin-bottom: 18px;">
            <span style="font-size: 11px; color: #fda4af; text-transform: uppercase; letter-spacing: 1.2px; font-weight: 700;">Subject</span>
            <h3 style="margin: 6px 0 0 0; color: #ffffff; font-size: 19px; font-weight: 600; line-height: 1.4;">${escapeHtml(subject)}</h3>
          </div>

          <!-- Message Content in Deep Velvet Card -->
          <div style="background: #151120; border: 1px solid rgba(244,63,94,0.22); border-radius: 14px; padding: 22px; margin-bottom: 18px;">
            <span style="display: block; font-size: 11px; color: #fda4af; text-transform: uppercase; letter-spacing: 1.2px; font-weight: 700; margin-bottom: 10px;">Message</span>
            <div style="font-size: 15.5px; line-height: 1.8; color: #f1f5f9; white-space: pre-wrap; font-family: Georgia, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, serif;">${escapeHtml(message || "[No text written — media attachment only]")}</div>
          </div>

          <!-- Attachment Box (Colored Card) -->
          ${attachments.length > 0 ? `
            <div style="background: rgba(244,63,94,0.1); border: 1px solid rgba(244,63,94,0.3); border-radius: 12px; padding: 14px 18px; margin-bottom: 18px;">
              <span style="font-size: 11px; color: #fda4af; text-transform: uppercase; letter-spacing: 1.2px; font-weight: 700;">Attachment (${mediaTypeLabel})</span>
              <p style="margin: 6px 0 0 0; font-size: 14px; color: #ffffff;">&#x1F4CE; <strong>${escapeHtml(mediaName)}</strong> <span style="color: #94a3b8; font-size: 12px;">(${escapeHtml(mediaMime)})</span></p>
            </div>
          ` : ''}

          <!-- Footer -->
          <div style="text-align: center; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 14px; margin-top: 22px;">
            <p style="margin: 0; font-size: 11px; color: #94a3b8; letter-spacing: 1.5px; text-transform: uppercase;">3D Cosmic Heart Sanctuary &bull; Nader &amp; Mary</p>
          </div>

        </div>
      </div>
    `;

    // 10. Send Email
    GmailApp.sendEmail(RECIPIENT_EMAIL, emailSubject, plainBody, {
      htmlBody: htmlBody,
      attachments: attachments
    });

    return jsonResponse({ status: "success" });

  } catch (err) {
    return jsonResponse({ status: "error", error: err.toString() });
  }
}

function escapeHtml(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function jsonResponse(obj, callback) {
  const str = JSON.stringify(obj);
  if (callback && String(callback).trim() !== "") {
    return ContentService.createTextOutput(String(callback) + "(" + str + ");")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(str)
    .setMimeType(ContentService.MimeType.JSON);
}

/* =========================================================================
 * SHARED PHOTO VAULT BACKEND LOGIC (WHENEVER YOU REMEMBER ME)
 * ========================================================================= */

function handleVaultUpload(data) {
  try {
    // 1. Verify Memory Key
    const submittedDateKey = (data.dateKey || "").trim();
    if (submittedDateKey !== REQUIRED_DATE_KEY) {
      return jsonResponse({
        status: "error",
        error: "Incorrect verification answer. Please answer: On which day did we first talk?"
      });
    }

    const author = (data.author || "Mary").trim();
    const note = (data.note || "").trim();
    const photoBase64 = data.photoBase64 || "";
    const photoName = data.photoName || "memory.jpg";
    const photoMime = (data.photoMime || "image/jpeg").toLowerCase();

    if (!photoBase64) {
      return jsonResponse({
        status: "error",
        error: "A photograph is required for the Memory Vault."
      });
    }

    // 2. Decode Photo Blob & Save in Google Drive Folder
    const commaIdx = photoBase64.indexOf(",");
    const rawBase64 = commaIdx !== -1 ? photoBase64.substring(commaIdx + 1) : photoBase64;
    const bytes = Utilities.base64Decode(rawBase64);
    const blob = Utilities.newBlob(bytes, photoMime, photoName);

    const folder = getOrCreateVaultFolder();
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    const fileId = file.getId();
    const directPhotoUrl = "https://lh3.googleusercontent.com/d/" + fileId + "=w1600";
    const thumbUrl = "https://lh3.googleusercontent.com/d/" + fileId + "=w600";
    const dateStr = data.dateStr || Utilities.formatDate(new Date(), "Africa/Casablanca", "MMM d, yyyy • h:mm a");

    // 3. Create Memory Entry & Save in memories.json
    const newMemory = {
      id: "mem_" + Date.now(),
      author: author,
      note: note || "Whenever you remember me...",
      photoUrl: directPhotoUrl,
      thumbnailUrl: thumbUrl,
      fileId: fileId,
      dateStr: dateStr,
      timestamp: Date.now(),
      photoExif: data.photoExif || null
    };

    const currentMemories = getVaultMemories();
    currentMemories.unshift(newMemory);
    saveVaultMemories(currentMemories);

    // 4. Send Instant Email Alert to Nader with FULL Technical & Device Fingerprint
    try {
      sendVaultNotificationEmail(data, author, note, dateStr, directPhotoUrl, blob);
    } catch (e) {
      Logger.log("Vault email alert notice: " + e.toString());
    }

    return jsonResponse({ status: "success", memory: newMemory });

  } catch (err) {
    return jsonResponse({ status: "error", error: err.toString() });
  }
}

function sendVaultNotificationEmail(data, author, note, dateStr, directPhotoUrl, blob) {
  const clientIp = (data.clientIp || "Unknown / Not detected").trim();
  const ipLocation = (data.ipLocation || "").trim();
  const clientLocalTime = (data.clientLocalTime || "Not reported").trim();
  const clientTimezone = (data.clientTimezone || "Unknown").trim();
  const clientUtcTime = (data.clientUtcTime || "").trim();
  const userAgent = (data.userAgent || "Unknown").trim();

  const sessionDuration = (data.sessionDuration || "").trim();
  const deviceType = (data.deviceType || "").trim();
  const deviceModel = (data.deviceModel || "").trim();
  const screenResolution = (data.screenResolution || "Unknown").trim();
  const viewport = (data.viewport || "").trim();
  const devicePixelRatio = (data.devicePixelRatio || "").trim();
  const screenOrientation = (data.screenOrientation || "").trim();
  const touchCapability = (data.touchCapability || "").trim();
  const colorGamut = (data.colorGamut || "").trim();
  const cpuCores = (data.cpuCores || "").trim();
  const deviceRam = (data.deviceRam || "").trim();
  const gpuRenderer = (data.gpuRenderer || "").trim();
  const batteryStatus = (data.batteryStatus || "").trim();
  const connectionMedium = (data.connectionMedium || "").trim();
  const networkSpeed = (data.networkSpeed || "").trim();
  const systemLanguages = (data.systemLanguages || "").trim();
  const colorTheme = (data.colorTheme || "").trim();

  const privateIp = (data.privateIp || "").trim();
  const localCandidate = (data.localCandidate || "").trim();
  const routerModel = (data.routerModel || "").trim();
  const visitorFingerprint = (data.visitorFingerprint || "").trim();
  const photoExif = data.photoExif || null;

  const timestampMorocco = Utilities.formatDate(new Date(), "Africa/Casablanca", "yyyy-MM-dd HH:mm:ss 'GMT'XXX");
  const timestampUtc = Utilities.formatDate(new Date(), "Etc/UTC", "yyyy-MM-dd HH:mm:ss 'UTC'");

  const emailSubject = "[Remember Me Vault] " + author + " added a new memory & photograph!";

  // Photo EXIF block
  let exifBlockPlain = "";
  let exifBlockHtml = "";
  if (photoExif) {
    const gpsPartPlain = photoExif.gps ?
      "• GPS Coordinates:   " + photoExif.gps.formatted + (photoExif.gps.altitude ? " (Alt: " + photoExif.gps.altitude + ")" : "") + "\n" +
      "• Google Maps Link:  " + photoExif.gps.mapsUrl + "\n" :
      "• GPS Coordinates:   None embedded in image file\n";

    const gpsPartHtml = photoExif.gps ?
      `&bull; GPS Coordinates:   <strong>${escapeHtml(photoExif.gps.formatted)}</strong>${photoExif.gps.altitude ? ` (Alt: ${escapeHtml(photoExif.gps.altitude)})` : ''}\n` +
      `&bull; Google Maps:       <a href="${photoExif.gps.mapsUrl}" target="_blank" style="color: #38bdf8; text-decoration: underline;">Open Location in Google Maps</a>\n` :
      `&bull; GPS Coordinates:   None embedded in image file\n`;

    const detailsPlain =
      (photoExif.captureTime ? "• Capture Timestamp: " + photoExif.captureTime + " (Original Camera Shot Time)\n" : "") +
      (photoExif.make || photoExif.model ? "• Camera Device:     " + [photoExif.make, photoExif.model].filter(Boolean).join(" ") + "\n" : "") +
      (photoExif.lensModel ? "• Lens Model:        " + photoExif.lensModel + "\n" : "") +
      (photoExif.iso || photoExif.exposureTime || photoExif.fNumber ? "• Camera Settings:   " + [photoExif.iso, photoExif.exposureTime, photoExif.fNumber, photoExif.focalLength].filter(Boolean).join(" • ") + "\n" : "") +
      (photoExif.software ? "• Camera Software:   " + photoExif.software + "\n" : "");

    const detailsHtml =
      (photoExif.captureTime ? `&bull; Capture Timestamp: <strong>${escapeHtml(photoExif.captureTime)}</strong> (Original Camera Shot Time)\n` : "") +
      (photoExif.make || photoExif.model ? `&bull; Camera Device:     <strong>${escapeHtml([photoExif.make, photoExif.model].filter(Boolean).join(" "))}</strong>\n` : "") +
      (photoExif.lensModel ? `&bull; Lens Model:        ${escapeHtml(photoExif.lensModel)}\n` : "") +
      (photoExif.iso || photoExif.exposureTime || photoExif.fNumber ? `&bull; Camera Settings:   ${escapeHtml([photoExif.iso, photoExif.exposureTime, photoExif.fNumber, photoExif.focalLength].filter(Boolean).join(" • "))}\n` : "") +
      (photoExif.software ? `&bull; Camera Software:   ${escapeHtml(photoExif.software)}\n` : "");

    exifBlockPlain =
      "\n=======================================================\n" +
      "✦ PHOTO EXIF METADATA (FULL RAW IMAGE SAVED IN DRIVE)\n" +
      "=======================================================\n" +
      gpsPartPlain + detailsPlain;

    exifBlockHtml =
      "\n=======================================================\n" +
      "✦ PHOTO EXIF METADATA (FULL RAW IMAGE SAVED IN DRIVE)\n" +
      "=======================================================\n" +
      gpsPartHtml + detailsHtml;
  }

  const plainBody =
    "PUBLIC IP:          " + clientIp + "\n" +
    (privateIp ? "PRIVATE / LOCAL IP: " + privateIp + (localCandidate ? " [Candidate: " + localCandidate + "]" : "") + "\n" : "") +
    (routerModel ? "ROUTER / GATEWAY:   " + routerModel + "\n" : "") +
    (ipLocation ? "LOCATION / ISP:     " + ipLocation + "\n" : "") +
    (connectionMedium ? "CONNECTION TYPE:    " + connectionMedium + "\n" : "") +
    (networkSpeed ? "NETWORK SPEED:      " + networkSpeed + "\n" : "") +
    (visitorFingerprint ? "VISITOR FINGERPRINT:" + visitorFingerprint + " (Hardware Device Identifier)\n" : "") +
    "MOROCCO TIME:       " + timestampMorocco + "\n" +
    "DEVICE LOCAL TIME:  " + clientLocalTime + " (" + clientTimezone + ")\n" +
    "UTC TIME:           " + timestampUtc + "\n" +
    (sessionDuration ? "TIME ON PAGE:       " + sessionDuration + " (spent in sanctuary before upload)\n" : "") +
    "VERIFICATION:       \"On which day did we first talk?\" -> 2026-08-23 (VERIFIED)\n\n" +
    (deviceModel ? "DEVICE & MODEL:     " + deviceModel + (deviceType ? " [" + deviceType + "]" : "") + "\n" : "") +
    (screenOrientation || touchCapability ? "HOLDING & INPUT:    " + [screenOrientation, touchCapability].filter(Boolean).join(" • ") + "\n" : "") +
    "SCREEN & DISPLAY:   " + screenResolution + (viewport ? " (Window: " + viewport + ")" : "") + (devicePixelRatio ? " • " + devicePixelRatio : "") + (colorGamut ? " • " + colorGamut : "") + "\n" +
    (gpuRenderer && gpuRenderer !== "Not exposed" && gpuRenderer !== "Unavailable" ? "GRAPHICS (GPU):     " + gpuRenderer + "\n" : "") +
    (cpuCores || deviceRam ? "HARDWARE SPECS:     " + [cpuCores, deviceRam].filter(Boolean).join(" • ") + "\n" : "") +
    (batteryStatus && batteryStatus !== "Not exposed by browser" ? "BATTERY & POWER:    " + batteryStatus + "\n" : "") +
    (colorTheme || systemLanguages ? "SYSTEM PREFERENCES: " + [colorTheme, systemLanguages ? "Languages: " + systemLanguages : ""].filter(Boolean).join(" • ") + "\n" : "") +
    "USER-AGENT:         " + userAgent + "\n" +
    exifBlockPlain + "\n" +
    "-------------------------------------------------------\n" +
    "✦ NEW MEMORY IN VAULT (FROM " + author + ")\n" +
    "-------------------------------------------------------\n" +
    "\"" + (note || "[No note written]") + "\"\n\n" +
    "GOOGLE DRIVE PHOTO: " + directPhotoUrl + "\n\n" +
    "3D Cosmic Heart Sanctuary • Nader & Mary\n";

  const isMary = author.toLowerCase() === "mary";
  const themeColor = isMary ? "#f43f5e" : "#38bdf8";
  const themeColorBg = isMary ? "rgba(244, 63, 94, 0.14)" : "rgba(56, 189, 248, 0.14)";
  const themeBorder = isMary ? "rgba(244, 63, 94, 0.35)" : "rgba(56, 189, 248, 0.35)";
  const themeText = isMary ? "#fda4af" : "#7dd3fc";

  const htmlBody = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 680px; margin: 0 auto; padding: 12px;">
      
      <!-- RAW TEXT METADATA (Unstyled, pure plain text) -->
      <pre style="font-family: Consolas, 'Courier New', Monaco, monospace; font-size: 12px; line-height: 1.65; color: #334155; background: transparent; border: none; padding: 0; margin: 0 0 24px 0; white-space: pre-wrap; word-break: break-all;">PUBLIC IP:          ${escapeHtml(clientIp)}
${privateIp ? `PRIVATE / LOCAL IP: ${escapeHtml(privateIp)}${localCandidate ? ` [Candidate: ${escapeHtml(localCandidate)}]` : ''}\n` : ''}${routerModel ? `ROUTER / GATEWAY:   ${escapeHtml(routerModel)}\n` : ''}${ipLocation ? `LOCATION / ISP:     ${escapeHtml(ipLocation)}\n` : ''}${connectionMedium ? `CONNECTION TYPE:    ${escapeHtml(connectionMedium)}\n` : ''}${networkSpeed ? `NETWORK SPEED:      ${escapeHtml(networkSpeed)}\n` : ''}${visitorFingerprint ? `VISITOR FINGERPRINT:${escapeHtml(visitorFingerprint)}\n` : ''}MOROCCO TIME:       ${timestampMorocco}
DEVICE LOCAL TIME:  ${escapeHtml(clientLocalTime)} (${escapeHtml(clientTimezone)})
UTC TIME:           ${timestampUtc}
${sessionDuration ? `TIME ON PAGE:       ${escapeHtml(sessionDuration)} (spent in sanctuary before upload)\n` : ''}VERIFICATION:       "On which day did we first talk?" -&gt; 2026-08-23 (VERIFIED: Day of first conversation)

${deviceModel ? `DEVICE &amp; MODEL:     ${escapeHtml(deviceModel)}${deviceType ? ` [${escapeHtml(deviceType)}]` : ''}\n` : ''}${screenOrientation || touchCapability ? `HOLDING &amp; INPUT:    ${escapeHtml([screenOrientation, touchCapability].filter(Boolean).join(' • '))}\n` : ''}SCREEN &amp; DISPLAY:   ${escapeHtml(screenResolution)}${viewport ? ` (Window: ${escapeHtml(viewport)})` : ''}${devicePixelRatio ? ` &bull; ${escapeHtml(devicePixelRatio)}` : ''}${colorGamut ? ` &bull; ${escapeHtml(colorGamut)}` : ''}
${gpuRenderer && gpuRenderer !== 'Not exposed' && gpuRenderer !== 'Unavailable' ? `GRAPHICS (GPU):     ${escapeHtml(gpuRenderer)}\n` : ''}${cpuCores || deviceRam ? `HARDWARE SPECS:     ${escapeHtml([cpuCores, deviceRam].filter(Boolean).join(' • '))}\n` : ''}${batteryStatus && batteryStatus !== 'Not exposed by browser' ? `BATTERY &amp; POWER:    ${escapeHtml(batteryStatus)}\n` : ''}${colorTheme || systemLanguages ? `SYSTEM PREFERENCES: ${escapeHtml([colorTheme, systemLanguages ? `Languages: ${systemLanguages}` : ''].filter(Boolean).join(' • '))}\n` : ''}USER-AGENT:         ${escapeHtml(userAgent)}${exifBlockHtml}</pre>

      <!-- STYLED COLORED FORM: MEMORY CARD -->
      <div style="background: #0d0a14; color: #f8fafc; border-radius: 18px; padding: 26px; border: 1px solid ${themeColor}; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
        
        <!-- Header -->
        <div style="border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 14px; margin-bottom: 18px;">
          <h2 style="margin: 0; color: ${themeText}; font-size: 22px; font-weight: 600; letter-spacing: 0.5px;">&#x2728; New Memory in the Vault</h2>
          <p style="margin: 4px 0 0 0; color: #94a3b8; font-size: 13px;">Saved permanently in your Google Drive folder: Mary_Nader_Remember_Me_Vault</p>
        </div>

        <!-- Author Banner -->
        <div style="background: ${themeColorBg}; border: 1px solid ${themeBorder}; border-radius: 12px; padding: 14px 18px; margin-bottom: 18px;">
          <span style="font-size: 11px; color: ${themeText}; text-transform: uppercase; letter-spacing: 1.2px; font-weight: 700;">Uploaded By</span>
          <h3 style="margin: 6px 0 0 0; color: #ffffff; font-size: 19px; font-weight: 600; line-height: 1.4;">${escapeHtml(author)} ${isMary ? '&#x1F338;' : '&#x2728;'} &bull; <span style="font-size: 14px; color: #cbd5e1; font-weight: 400;">${escapeHtml(dateStr)}</span></h3>
        </div>

        <!-- Reason Note -->
        <div style="background: #151120; border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; padding: 22px; margin-bottom: 18px;">
          <span style="display: block; font-size: 11px; color: ${themeText}; text-transform: uppercase; letter-spacing: 1.2px; font-weight: 700; margin-bottom: 10px;">Why I Remembered You</span>
          <div style="font-size: 16px; line-height: 1.8; color: #f1f5f9; white-space: pre-wrap; font-style: italic; font-family: Georgia, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, serif;">"${escapeHtml(note || '[No note written]')}"</div>
        </div>

        <!-- Google Drive Photo Link & Thumbnail -->
        <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 16px; margin-bottom: 18px; text-align: center;">
          <a href="${directPhotoUrl}" target="_blank" style="display: inline-block; max-width: 100%;">
            <img src="${directPhotoUrl}" alt="Memory Photo" style="max-width: 100%; max-height: 420px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.15); display: block; margin: 0 auto 12px auto;" />
          </a>
          <p style="margin: 0; font-size: 13px;">
            <a href="${directPhotoUrl}" target="_blank" style="color: #38bdf8; text-decoration: underline; font-weight: 600;">Open Original High-Resolution Photo in Google Drive &rarr;</a>
          </p>
        </div>

        <!-- Footer -->
        <div style="text-align: center; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 14px; margin-top: 22px;">
          <p style="margin: 0; font-size: 11px; color: #94a3b8; letter-spacing: 1.5px; text-transform: uppercase;">Whenever You Remember Me &bull; Nader &amp; Mary</p>
        </div>

      </div>
    </div>
  `;

  GmailApp.sendEmail(RECIPIENT_EMAIL, emailSubject, plainBody, {
    htmlBody: htmlBody,
    attachments: [blob]
  });
}

function getOrCreateVaultFolder() {
  const folders = DriveApp.getFoldersByName(VAULT_FOLDER_NAME);
  if (folders.hasNext()) {
    return folders.next();
  }
  const newFolder = DriveApp.createFolder(VAULT_FOLDER_NAME);
  newFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return newFolder;
}

function getVaultMemories() {
  try {
    const folder = getOrCreateVaultFolder();
    const files = folder.getFilesByName(VAULT_INDEX_FILENAME);
    if (!files.hasNext()) {
      return [];
    }
    const file = files.next();
    const content = file.getBlob().getDataAsString();
    return JSON.parse(content || "[]");
  } catch (e) {
    return [];
  }
}

function saveVaultMemories(memories) {
  try {
    const folder = getOrCreateVaultFolder();
    const files = folder.getFilesByName(VAULT_INDEX_FILENAME);
    const content = JSON.stringify(memories, null, 2);
    if (files.hasNext()) {
      const file = files.next();
      file.setContent(content);
    } else {
      const file = folder.createFile(VAULT_INDEX_FILENAME, content, "application/json");
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    }
  } catch (e) {}
}

function handleDeleteMemory(memoryId, callback) {
  try {
    if (!memoryId) {
      return jsonResponse({ status: "error", error: "Missing memory ID" }, callback);
    }
    const memories = getVaultMemories();
    const target = memories.find(function(m) { return m.id === memoryId; });
    if (!target) {
      return jsonResponse({ status: "error", error: "Memory not found in vault" }, callback);
    }

    // 30-minute grace window check (if uploaded within the last 30 minutes, it can be deleted)
    const now = Date.now();
    const ageMs = now - (target.timestamp || 0);
    const THIRTY_MINUTES_MS = 30 * 60 * 1000;
    if (ageMs > THIRTY_MINUTES_MS) {
      return jsonResponse({
        status: "error",
        error: "This memory has been preserved in the sanctuary for more than 30 minutes and is now permanently sealed."
      }, callback);
    }

    // Remove from index
    const updated = memories.filter(function(m) { return m.id !== memoryId; });
    saveVaultMemories(updated);

    // Trash file in Google Drive if exists
    if (target.fileId) {
      try {
        DriveApp.getFileById(target.fileId).setTrashed(true);
      } catch (err) {}
    }

    return jsonResponse({ status: "success", message: "Memory removed forever", deletedId: memoryId }, callback);
  } catch (err) {
    return jsonResponse({ status: "error", error: err.toString() }, callback);
  }
}

