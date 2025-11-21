# Copyright (c) 2025, Shubham Mishra and contributors
# For license information, please see license.txt

# import frappe
# from frappe.model.document import Document


# class PasswordSettings(Document):
# 	pass

# password_settings.py
# Copyright (c) 2025, Shubham Mishra and contributors
# import frappe
# from frappe.model.document import Document
# import pyotp



# class PasswordSettings(Document):

#     def validate(self):
#         # -------------------------
#         # 1️⃣ Main TOTP Secret Permission
#         # -------------------------
#         if self.get_doc_before_save():
#             old_doc = self.get_doc_before_save()

#             # Main TOTP secret changed?
#             if old_doc.password_totp_secret != self.password_totp_secret:

#                 # Collect allowed users from child table
#                 allowed_users = [row.is_allowed_totp for row in self.allowed_totp]

#                 # If logged-in user is NOT Administrator AND NOT in allowed list → block
#                 if frappe.session.user not in ["Administrator"] + allowed_users:
#                     frappe.throw("❌ Only Administrator or allowed users can change the main TOTP secret.")

#         # -------------------------
#         # 2️⃣ Child Table Modification Permission
#         # -------------------------
#         for row in self.allowed_totp:

#             # If NOT admin AND NOT modifying own row → block
#             if frappe.session.user != "Administrator" and row.is_allowed_totp != frappe.session.user:
#                 frappe.throw(f"❌ You cannot add/modify TOTP permission for user {row.is_allowed_totp}.")
                


# @frappe.whitelist()
# def verify_totp(code):
#     doc = frappe.get_single("Password Settings")
#     totp = pyotp.TOTP(doc.password_totp_secret)
#     return totp.verify(code)



import frappe
import pyotp
from frappe.model.document import Document

class PasswordSettings(Document):

    # ----------------------------------------------------------------------
    # AUTO-ADD ADMIN TO allowed_totp
    # ----------------------------------------------------------------------
    def before_save(self):
        """Ensure Administrator is always in the allowed_totp list."""
        existing = [row.is_allowed_totp for row in self.allowed_totp]

        if "Administrator" not in existing:
            self.append("allowed_totp", {
                "is_allowed_totp": "Administrator"
            })

    # ----------------------------------------------------------------------
    # EVENT: VALIDATE
    # ----------------------------------------------------------------------
    def validate(self):
        # -------------------------
        # 1️⃣ Permission to Change Main TOTP Secret
        # -------------------------
        if self.get_doc_before_save():
            old_doc = self.get_doc_before_save()

            # Detect secret change
            if old_doc.password_totp_secret != self.password_totp_secret:

                allowed_users = [row.is_allowed_totp for row in self.allowed_totp]

                # If logged-in user is NOT allowed → block
                if frappe.session.user not in (["Administrator"] + allowed_users):
                    frappe.throw(
                        "❌ Only Administrator or allowed users can change / regenerate the TOTP secret."
                    )

        # -------------------------
        # 2️⃣ Child Table Modification Permissions
        # -------------------------
        for row in self.allowed_totp:

            # If NOT admin AND NOT modifying their own row → block
            if frappe.session.user != "Administrator" and row.is_allowed_totp != frappe.session.user:
                frappe.throw(
                    f"❌ You cannot add/modify TOTP permission for user {row.is_allowed_totp}."
                )

    # ----------------------------------------------------------------------
    # EVENT: ONLOAD (mask secret + QR for unauthorized users)
    # ----------------------------------------------------------------------
    def onload(self):
        """
        Tell the client whether to hide/blur secret and QR.
        """
        allowed_users = [row.is_allowed_totp for row in self.allowed_totp]
        is_allowed = frappe.session.user in (["Administrator"] + allowed_users)

        # Send flag to JS
        if not is_allowed:
            self.set_onload("hide_totp_secret", True)
        else:
            self.set_onload("hide_totp_secret", False)

    # ----------------------------------------------------------------------
    # Helper: Reusable Permission Checker
    # ----------------------------------------------------------------------
    def is_user_allowed(self):
        allowed = [row.is_allowed_totp for row in self.allowed_totp]
        return frappe.session.user in (["Administrator"] + allowed)


# ----------------------------------------------------------------------
# API: TOTP VERIFICATION
# ----------------------------------------------------------------------
@frappe.whitelist()
def verify_totp(code):
    """Verify TOTP code using Python pyotp."""
    doc = frappe.get_single("Password Settings")

    if not doc.password_totp_secret:
        return False

    try:
        totp = pyotp.TOTP(doc.password_totp_secret)
        return totp.verify(code)
    except Exception:
        return False
