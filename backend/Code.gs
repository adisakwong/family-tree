/**
 * Google Apps Script Backend for Family Tree Web App
 * Features: Auth, Auto ID, Image Handler (Drive)
 */

const SPREADSHEET_ID = '1yBDmIg7qqd9ApTaC8pNu4N__4nLxPyjJ7wHAx3LPMN8'; // User must replace
const FOLDER_ID = '16FFKfoSh3qiyzaXUvfHtK26eik3g-FhX';     // User must replace for photos ( เป็น images)

function doGet(e) {
  return HtmlService.createHtmlOutput("Family Tree API is running.");
}

function doPost(e) {
  const params = JSON.parse(e.postData.contents);
  const action = params.action;
  
  try {
    switch (action) {
      case 'login':
        return jsonResponse(handleLogin(params.email, params.password));
      case 'signup':
        return jsonResponse(handleSignup(params.email, params.password, params.displayName));
      case 'getFamilies':
        return jsonResponse(getFamilies(params.email));
      case 'createFamily':
        return jsonResponse(createFamily(params.email, params.familyName));
      case 'getMembers':
        return jsonResponse(getMembers(params.familyId));
      case 'addMember':
        return jsonResponse(addMember(params));
      case 'editMember':
        return jsonResponse(editMember(params));
      case 'deleteMember':
        return jsonResponse(deleteMember(params.id));
      default:
        return jsonResponse({ success: false, message: 'Invalid action' });
    }
  } catch (err) {
    return jsonResponse({ success: false, message: err.toString() });
  }
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// --- Auth System ---
function handleLogin(email, password) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Users');
  const data = sheet.getDataRange().getValues();
  
  const normalizedEmail = (email || "").toString().trim().toLowerCase();
  const normalizedPassword = (password || "").toString().trim();
  
  for (let i = 1; i < data.length; i++) {
    const sheetEmail = data[i][0].toString().trim().toLowerCase();
    const sheetPassword = data[i][1].toString().trim();
    
    if (sheetEmail === normalizedEmail && sheetPassword === normalizedPassword) {
      return { success: true, user: { email: data[i][0], displayName: data[i][2] } };
    }
  }
  return { success: false, message: 'Invalid credentials' };
}

function handleSignup(email, password, displayName) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Users');
  const data = sheet.getDataRange().getValues();
  
  const normalizedEmail = (email || "").toString().trim().toLowerCase();
  
  // Check if user already exists
  for (let i = 1; i < data.length; i++) {
    if (data[i][0].toString().trim().toLowerCase() === normalizedEmail) {
      return { success: false, message: 'User already exists' };
    }
  }
  
  sheet.appendRow([email.trim(), password.toString().trim(), displayName.trim()]);
  return { success: true, user: { email, displayName } };
}

// --- Families Management ---
function getFamilies(email) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Families');
  const data = sheet.getDataRange().getValues();
  const families = data.slice(1).filter(row => row[2] === email).map(row => ({
    familyId: row[0],
    familyName: row[1]
  }));
  return { success: true, families };
}

function createFamily(email, familyName) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Families');
  const year = new Date().getFullYear();
  const lastRow = sheet.getLastRow();
  let count = 1;
  
  if (lastRow > 1) {
    const lastId = sheet.getRange(lastRow, 1).getValue();
    const parts = lastId.split('-');
    if (parts[1] == year) count = parseInt(parts[2]) + 1;
  }
  
  const familyId = `FAM-${year}-${count.toString().padStart(3, '0')}`;
  sheet.appendRow([familyId, familyName, email]);
  return { success: true, familyId };
}

// --- Members Management ---
function getMembers(familyId) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Members');
  const data = sheet.getDataRange().getValues();
  const members = data.slice(1).filter(row => row[1] === familyId).map(row => ({
    id: row[0],
    familyId: row[1],
    name: row[2],
    parentId: row[3],
    generation: row[4],
    photoUrl: row[5]
  }));
  return { success: true, members };
}

function addMember(params) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Members');
  
  let photoUrl = '';
  if (params.photoBase64) {
    photoUrl = saveToDrive(params.photoBase64, params.name);
  }
  
  // Generate ID: familyId + Date + Time (e.g., FAM-2026-001-20260121-103045)
  const now = new Date();
  const dateStr = Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyyMMdd');
  const timeStr = Utilities.formatDate(now, Session.getScriptTimeZone(), 'HHmmss');
  const id = `${params.familyId}-${dateStr}-${timeStr}`;
  
  sheet.appendRow([id, params.familyId, params.name, params.parentId || '', params.generation, photoUrl]);
  return { success: true, memberId: id };
}

function editMember(params) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Members');
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === params.id) { // Match by ID
      // Update fields
      sheet.getRange(i + 1, 3).setValue(params.name || data[i][2]); // Column 3: Name
      sheet.getRange(i + 1, 4).setValue(params.parentId || data[i][3]); // Column 4: Parent ID
      sheet.getRange(i + 1, 5).setValue(params.generation || data[i][4]); // Column 5: Generation
      
      // Handle photo update
      if (params.photoBase64) {
        const newPhotoUrl = saveToDrive(params.photoBase64, params.name);
        sheet.getRange(i + 1, 6).setValue(newPhotoUrl); // Column 6: Photo URL
      }
      
      return { success: true, message: 'Member updated successfully' };
    }
  }
  
  return { success: false, message: 'Member not found' };
}

function deleteMember(id) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('Members');
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) { // Match by ID
      sheet.deleteRow(i + 1); // Delete the row
      return { success: true, message: 'Member deleted successfully' };
    }
  }
  
  return { success: false, message: 'Member not found' };
}

// --- Image Handler ---
function saveToDrive(base64Data, fileName) {
  const folder = DriveApp.getFolderById(FOLDER_ID);
  const contentType = base64Data.substring(base64Data.indexOf(":") + 1, base64Data.indexOf(";"));
  const bytes = Utilities.base64Decode(base64Data.split(",")[1]);
  const blob = Utilities.newBlob(bytes, contentType, fileName);
  const file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  // Use lh3.googleusercontent.com format for better embedding support
  //return `https://lh3.googleusercontent.com/d/${file.getId()}`;
  return `https://drive.google.com/thumbnail?id=${file.getId()}`;
}
