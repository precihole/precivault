// Copyright (c) 2025, Shubham Mishra and contributors
// For license information, please see license.txt

// frappe.ui.form.on("Password Settings", {
// 	refresh(frm) {

// 	},
// });

// frappe.ui.form.on("Password Settings", {

//     refresh(frm) {

//         // Render QR if secret exists (on load/refresh)
//         if (frm.doc.password_totp_secret) {
//             render_totp_qr(frm, frm.doc.password_totp_secret);
//         }

//         // Button: Generate New TOTP Secret
//         frm.add_custom_button("Generate New TOTP Secret", () => {
//             let secret = generate_totp_secret();
//             frm.set_value("password_totp_secret", secret);
//             render_totp_qr(frm, secret);
//             frappe.msgprint("✅ New TOTP Secret Generated! Save the document to persist.");
//         });

//         // Button: Verify TOTP Code
//         frm.add_custom_button("Verify TOTP Code", () => {
//             frappe.prompt(
//                 {fieldname:"code", label:"Enter TOTP Code", fieldtype:"Data", reqd:1},
//                 (values) => {
//                     verify_totp(frm.doc.password_totp_secret, values.code)
//                         .then(valid => frappe.msgprint(valid ? "✔ TOTP Valid!" : "❌ Invalid TOTP!"));
//                 }
//             );
//         });
//     },

//     password_totp_secret(frm) {
//         // Re-render QR whenever secret changes
//         if (frm.doc.password_totp_secret) {
//             render_totp_qr(frm, frm.doc.password_totp_secret);
//         } else {
//             if(frm.fields_dict.password_totp_qr) {
//                 frm.fields_dict.password_totp_qr.$wrapper.html("");
//             }
//         }
//     }

// });


// // --------------------------
// // Generate TOTP Secret
// // --------------------------
// function generate_totp_secret(length = 16) {
//     const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
//     let secret = "";
//     for (let i = 0; i < length; i++) {
//         secret += chars.charAt(Math.floor(Math.random() * chars.length));
//     }
//     return secret;
// }


// // --------------------------
// // Render TOTP QR
// // --------------------------
// function render_totp_qr(frm, secret) {
//     if (!frm.fields_dict.password_totp_qr) return;

//     const issuer = encodeURIComponent("ERPNext");
//     const account = encodeURIComponent(frappe.session.user);

//     const otp_uri = `otpauth://totp/${issuer}:${account}?secret=${secret}&issuer=${issuer}&digits=6&period=30`;
//     const qr_url = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(otp_uri)}&ecc=L`;

//     frm.fields_dict.password_totp_qr.$wrapper.html(`
//         <img src="${qr_url}" style="max-width:250px;border:1px solid #ccc;padding:8px;border-radius:6px;">
//     `);
// }


// // --------------------------
// // Verify TOTP Code
// // --------------------------
// function verify_totp(secret, user_code) {

//     function base32ToBytes(base32) {
//         const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
//         let bits = "", bytes = [];

//         base32.replace(/=+$/, "")
//             .split("")
//             .forEach(c => {
//                 const val = alphabet.indexOf(c.toUpperCase());
//                 bits += val.toString(2).padStart(5, "0");
//             });

//         for (let i = 0; i + 8 <= bits.length; i += 8) {
//             bytes.push(parseInt(bits.substring(i, i + 8), 2));
//         }
//         return new Uint8Array(bytes);
//     }

//     function generate_totp(secret, step = 30) {
//         let key = base32ToBytes(secret);
//         let counter = Math.floor(Date.now() / 1000 / step);

//         let buffer = new ArrayBuffer(8);
//         let view = new DataView(buffer);
//         view.setUint32(4, counter);

//         const cryptoObj = window.crypto || window.msCrypto;

//         return cryptoObj.subtle.importKey(
//             "raw", key, { name: "HMAC", hash: "SHA-1" }, false, ["sign"]
//         ).then(hmacKey => cryptoObj.subtle.sign("HMAC", hmacKey, buffer))
//           .then(signature => {
//               let bytes = new Uint8Array(signature);
//               let offset = bytes[bytes.length - 1] & 0xf;
//               let binary = ((bytes[offset] & 0x7f) << 24) |
//                            ((bytes[offset + 1] & 0xff) << 16) |
//                            ((bytes[offset + 2] & 0xff) << 8) |
//                            (bytes[offset + 3] & 0xff);
//               return (binary % 1000000).toString().padStart(6, "0");
//           });
//     }

//     return generate_totp(secret).then(code => code === user_code);
// }

//----------------------------------------------------------------------------------------------------------------
// //--------------------------------------------------------------------------------------------------------------

frappe.ui.form.on("Password Settings", {
    refresh(frm) {

        const hide_secret = frm.doc.__onload && frm.doc.__onload.hide_totp_secret;

        // -----------------------------------------------------------
        // 1️⃣ Mask secret + blur QR for unauthorized users
        // -----------------------------------------------------------
        if (hide_secret) {

            // Mask secret (show only first 4 chars)
            if (frm.doc.password_totp_secret) {
                frm.set_value(
                    "password_totp_secret",
                    frm.doc.password_totp_secret.substring(0, 4) + "************"
                );
            }

            // Make secret read-only
            frm.set_df_property("password_totp_secret", "read_only", 1);

            // Render BLURRED QR instead of hiding it
            if (frm.doc.password_totp_secret) {
                setTimeout(() => {
                    render_blurred_qr(frm);   // <—— NEW
                }, 300);
            }

        } else {
            // -----------------------------------------------------------
            // 2️⃣ Allowed users → Render real QR
            // -----------------------------------------------------------
            if (frm.doc.password_totp_secret) {
                setTimeout(() => {
                    render_totp_qr(frm, frm.doc.password_totp_secret);
                }, 300);
            }
        }

        // -----------------------------------------------------------
        // 3️⃣ Generate New Secret Button
        // -----------------------------------------------------------
        frm.add_custom_button("Generate New TOTP Secret", () => {

            if (hide_secret) {
                frappe.msgprint("❌ You are not allowed to generate or modify the TOTP secret.");
                return;
            }

            if (frm.doc.password_totp_secret) {

                frappe.confirm(
                    "⚠ A TOTP Secret already exists.<br><br>Are you sure you want to generate a new one?",
                    () => { create_new_secret(frm); },
                    () => { frappe.show_alert("Cancelled"); }
                );

            } else {
                create_new_secret(frm);
            }
        });
    },

    // Prevent QR redraw for unauthorized users
    password_totp_secret(frm) {
        const hide_secret = frm.doc.__onload && frm.doc.__onload.hide_totp_secret;

        if (hide_secret) {
            render_blurred_qr(frm);
            return;
        }

        if (frm.doc.password_totp_secret) {
            render_totp_qr(frm, frm.doc.password_totp_secret);
        }
    }
});

// -----------------------------------------------------------
// Create NEW secret
// -----------------------------------------------------------
function create_new_secret(frm) {
    const secret = generate_totp_secret();
    frm.set_value("password_totp_secret", secret);
    render_totp_qr(frm, secret);
    frappe.msgprint("✅ New TOTP Secret generated! Save the document to persist it.");
}

// -----------------------------------------------------------
// Generate Base32 Secret
// -----------------------------------------------------------
function generate_totp_secret(length = 16) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    let secret = "";
    for (let i = 0; i < length; i++) {
        secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return secret;
}

// -----------------------------------------------------------
// Render FULL QR (Allowed Users)
// -----------------------------------------------------------
function render_totp_qr(frm, secret) {
    if (!frm.fields_dict.password_totp_qr) return;

    const issuer = encodeURIComponent("PreciVault");
    const account = encodeURIComponent(frappe.session.user);

    const otp_uri = `otpauth://totp/${issuer}:${account}?secret=${secret}&issuer=${issuer}&digits=6&period=30`;
    const qr_url = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(otp_uri)}&ecc=L`;

    frm.fields_dict.password_totp_qr.$wrapper.html(`
        <img src="${qr_url}" style="max-width:250px;border:1px solid #ccc;padding:8px;border-radius:6px;">
    `);
}

// -----------------------------------------------------------
// Render BLURRED QR (Unauthorized Users)
// -----------------------------------------------------------
function render_blurred_qr(frm) {

    if (!frm.fields_dict.password_totp_qr) return;

    frm.fields_dict.password_totp_qr.$wrapper.html(`
        <div style="
            width:250px;
            height:250px;
            background:#eee;
            border-radius:6px;
            border:1px solid #ccc;
            position:relative;
            overflow:hidden;
        ">
            <div style="
                position:absolute;
                top:0;
                left:0;
                right:0;
                bottom:0;
                display:flex;
                align-items:center;
                justify-content:center;
                font-size:16px;
                color:#888;
                filter: blur(6px);
                padding:20px;
                text-align:center;
            ">
                QR Hidden for Security
            </div>
        </div>
    `);
}
