### PreciVault

<div align="center">
  <img src="https://cdn-icons-png.flaticon.com/512/11135/11135278.png" alt="PreciVault Logo" width="100"/>
  <h1>PreciVault 🔐</h1>
  <p><strong>A secure and user-friendly password manager app for Frappe/ERPNext</strong></p>
</div>

---

## 🔒 Overview

**PreciVault** is a secure and user-friendly app built on the Frappe framework to help you **store**, **manage**, and **organize** your passwords. It uses **strong encryption** to keep your data safe while providing modern features like:

- 🔑 **Password generation**
- 🧠 **Auto-fill support**
- 🔄 **Multi-device syncing**
- 🧭 **Simple and clean UI**
- 🕒 **TOTP Authenticator Support**
---

## 🚀 Installation

You can install Cryptera in your ERPNext bench using the Frappe CLI.

### Step 1: Get the App

```bash
cd ~/frappe-bench  # Replace with your actual bench path
bench get-app --branch [branch name] https://github.com/precihole/precivault.git
bench --site [site name] install-app precivault

```
## 📸 How to Use

### Step 1: Search for Password Manager
Go to the search bar and open the **Password Manager** DocType.

![Step 1](https://github.com/precihole/precivault/blob/master/screenshorts/1.png)

---

### Step 2: Add Your Credentials
Enter your password-related details such as:
- Website / Application name  
- Username  
- Password  

Then click **Save**.

![Step 2](https://github.com/precihole/precivault/blob/master/screenshorts/2.png)

---

### Step 3: Saved Document View
After saving, your document will look like this.

![Step 3](https://github.com/precihole/precivault/blob/master/screenshorts/3.png)

---

### Step 4: View Your Password
Click on the **"Get My Password"** button.  
Enter your TOTP code to securely retrieve your password. you will get your totp in "Google authenticator" app see in Step 6.1 .

![Step 4](https://github.com/precihole/precivault/blob/master/screenshorts/4.png)

---

### Step 5: Open Password Settings (Admin Only)
Log in with the **Administrator account** and open the **Password Settings** DocType.  

Click on **"Generate New TOTP Secret"**.  
⚠️ Only the Administrator can perform this action.

![Step 5](https://github.com/precihole/precivault/blob/master/screenshorts/5.png)

---

### Step 6: Setup TOTP (Google Authenticator)
After generating the TOTP secret:
- A QR code will appear  
- Scan it using the Google Authenticator app or any TOTP app  

📱 Download Google Authenticator:  
- Android: https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2  
- iOS: https://apps.apple.com/app/google-authenticator/id388497605  

![Step 6](https://github.com/precihole/precivault/blob/master/screenshorts/6.png)

---
### Step 6.1: View 6 Digit TOTP from google authenicator app and put totp in "Password Manager" doctype when you want to chagne password or view password.
 

![Step 6.1](https://github.com/precihole/precivault/blob/master/screenshorts/6.1.jpeg)
---
### Step 7: Allow TOTP Access to Users
In the **Allowed TOTP** field:
- Add user email IDs  
- Only those users can view the QR code  

By default:
- Only **Administrator** has access  
- Only Administrator can add/remove users  

![Step 7](https://github.com/precihole/precivault/blob/master/screenshorts/7.png)

---
## License

Proprietary License See [license.txt](license.txt).

## Developed By
Shubham mishra


