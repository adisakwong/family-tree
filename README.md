# Family Tree Management System

A comprehensive web application for managing multi-family genealogical data with interactive visualization, built using HTML, Tailwind CSS, JavaScript (D3.js), and Google Apps Script backend.

## 🌟 Features

### Core Functionality
- **Multi-family Management**: Create and manage multiple family trees
- **User Authentication**: Secure login/signup system
- **Hierarchical Visualization**: Interactive D3.js tree display with zoom/pan capabilities
- **Member Management**: Add, edit, and delete family members with photo upload
- **Relationship Analysis**: Kinship reports (intra-generation and inter-generation)
- **Live Search**: Real-time member search with zoom-to-node functionality

### Technical Highlights
- **Responsive Design**: Works on both desktop and mobile devices
- **Image Handling**: Photo upload with automatic Google Drive storage
- **Auto ID Generation**: Automatic family ID generation (FAM-YYYY-XXX format)
- **Toggle Controls**: Show/hide edit/delete buttons for cleaner interface

## 🏗️ Architecture

### Frontend
- **HTML5** with semantic structure
- **Tailwind CSS** for responsive styling
- **D3.js v7** for interactive tree visualization
- **SweetAlert2** for enhanced user notifications
- **JavaScript (ES6+)** for application logic

### Backend
- **Google Apps Script** for server-side logic
- **Google Sheets** as database (3-sheet structure)
- **Google Drive API** for image storage
- **Base64** encoding for image handling

## 📁 Project Structure

```
family-tree/
├── index.html          # Main application UI
├── js/
│   ├── app.js          # Main application logic
│   └── tree.js         # D3.js visualization logic
├── css/
│   └── style.css       # Custom CSS styles
├── backend/
│   └── Code.gs         # Google Apps Script backend
└── README.md           # This documentation
```

## 🛠️ Setup Instructions

### 1. Google Sheets Setup
Create a new Google Sheet with three tabs:

**Users Tab:**
```
A1: email | B1: password | C1: displayName
```

**Families Tab:**
```
A1: familyId | B1: familyName | C1: ownerEmail
```

**Members Tab:**
```
A1: id | B1: familyId | C1: name | D1: parentId | E1: generation | F1: photoUrl
```

### 2. Google Drive Setup
1. Create a folder in Google Drive for storing member photos
2. Note the folder ID from the URL

### 3. Google Apps Script Deployment
1. Open your Google Sheet
2. Go to **Extensions > Apps Script**
3. Replace the default code with contents from `backend/Code.gs`
4. Update the configuration:
   ```javascript
   const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';
   const FOLDER_ID = 'YOUR_DRIVE_FOLDER_ID_HERE';
   ```
5. Click **Deploy > New Deployment**
6. Select **Web App**
7. **Execute as**: Me
8. **Who has access**: Anyone
9. Copy the **Web App URL**

### 4. Frontend Configuration
1. Open `js/app.js`
2. Replace the SCRIPT_URL with your Web App URL:
   ```javascript
   const SCRIPT_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE';
   ```

### 5. Run the Application
Simply open `index.html` in a web browser or serve it locally:
```bash
# Using Python
python -m http.server 8000

# Using Node.js (http-server)
npx http-server
```

## 🎮 Usage Guide

### Getting Started
1. **Sign Up**: Create a new account with email and password
2. **Login**: Use your credentials to access the system
3. **Create Family**: Click "New Family" to start your first family tree

### Managing Members
**Adding Members:**
- Click the **"+"** button in the bottom-right corner
- Fill in member details:
  - Name (required)
  - Parent (select from Generation 1 members)
  - Generation number
  - Photo (optional)
- Click "OK" to save

**Editing Members:**
- Click the **"Edit"** button below any member
- Modify the required fields
- Leave photo blank to keep current image
- Click "OK" to save changes

**Deleting Members:**
- Click the **"Del"** button below any member
- Confirm deletion in the popup dialog

### Navigation & Search
**Tree Controls:**
- **Zoom**: Use mouse wheel or pinch gestures
- **Pan**: Click and drag the tree area
- **Toggle Controls**: Use the ✏️ button to show/hide edit buttons

**Search Function:**
- Type member name in the search box (sidebar)
- The tree will automatically zoom to and highlight the member

### Reports
**Intra-generation Report:**
- Shows all members in the same generation
- Access via "Reports > Intra-generation (Siblings)"

**Inter-generation Report:**
- Displays lineage from member to ancestors
- Access via "Reports > Inter-generation (Lineage)"

## 🎨 UI/UX Features

### Color Theme
- **Primary**: Blue-based color scheme
- **Tree Container**: Light blue gradient background with dark blue border
- **Buttons**: 
  - Edit: Blue (`#2196F3`)
  - Delete: Red (`#f44336`)
  - Toggle: Green when active, Gray when inactive

### Responsive Design
- Adapts to different screen sizes
- Mobile-friendly touch controls
- Proper spacing and margins

## 🔧 Technical Details

### Data Flow
```
Frontend UI → Google Apps Script → Google Sheets
                 ↓
           Google Drive (Images)
```

### ID Generation
- **Family IDs**: `FAM-YYYY-XXX` (e.g., FAM-2026-001)
- **Member IDs**: `familyId-YYYYMMDD-HHMMSS` (e.g., FAM-2026-001-20260121-103045)

### Image Handling
1. Images converted to Base64 on frontend
2. Sent to Google Apps Script via POST
3. Saved to Google Drive with public access
4. Returns public URL for display

### Security Considerations
- Passwords stored as plain text in Sheets (for demonstration)
- Production use should implement proper hashing
- CORS handling via Google Apps Script Web App

## 🐛 Troubleshooting

### Common Issues

**Login fails with "Invalid credentials":**
- Check that email/password match exactly in Users sheet
- Verify no extra spaces in spreadsheet cells
- Ensure case sensitivity for email

**Images not displaying:**
- Verify Google Drive folder ID is correct
- Check that folder has proper sharing settings
- Ensure images are in supported format (JPG, PNG, etc.)

**Tree not rendering:**
- Check browser console for JavaScript errors
- Verify SCRIPT_URL is correct
- Ensure family has members to display

**CORS errors:**
- Make sure Google Apps Script is deployed as Web App
- Set access to "Anyone, even anonymous"
- Refresh the page after deployment changes

## 🚀 Future Enhancements

- [ ] User role management
- [ ] Family sharing between users
- [ ] Export to PDF/GEDCOM formats
- [ ] Advanced relationship calculations
- [ ] Mobile app version
- [ ] Real-time collaboration
- [ ] Backup/restore functionality

## 📄 License

This project is for educational purposes. Feel free to use and modify according to your needs.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## 📞 Support

For issues or questions, please open an issue in the repository or contact the maintainer.

---
*Last updated: January 2026*