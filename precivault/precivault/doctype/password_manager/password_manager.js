

// Copyright (c) 2025, Shubham Mishra and contributors
// For license information, please see license.txt



frappe.ui.form.on('Password Manager', {
	refresh: function(frm) {

		frm.set_df_property('change_ownership', 'hidden', true);

		if(frm.doc.__islocal){
			frm.set_df_property('generate_strong_password', 'hidden', false);
			frm.set_df_property('create_new_password', 'hidden', true);
		}
		else{
			frm.set_df_property('generate_strong_password', 'hidden', true);
			frm.set_df_property('password', 'read_only', true);

			if(frappe.session.user == 'Administrator' || frm.doc.credentials_owner == frappe.session.user){
				frm.set_df_property('change_ownership', 'hidden', false);
			}
			else{
				set_fields_read_only(frm);
			}

			if(frm.doc.docstatus < 2){
				frm.add_custom_button(__('Get My Password'), function() {
					get_my_password(frm);
				});
				frm.set_df_property('create_new_password', 'hidden', false);
			}
			else{
				frm.set_df_property('username', 'hidden', true);
				frm.set_df_property('create_new_password', 'hidden', true);
			}
		}
	},

	password: function(frm) {
		frappe.call({
			doc: frm.doc,
			method: 'check_my_password_strength',
			callback: function(r) {
				frm.set_value('password_strength', r.message?r.message:'');
			}
		});
	},

	password_strength: function(frm) {
		let strength_list = {'Weak': 'red', 'Good': 'orange', 'Strong': 'green'};
		let description = '';
		if(frm.doc.password_strength){
			description = '<font color="'+strength_list[frm.doc.password_strength]+'">'+__(frm.doc.password_strength)+'</font>';
		}
		frm.set_df_property('password', 'description', description);
	},

	url: function(frm) {
		frappe.call({
			doc: frm.doc,
			method: 'validate_my_url',
			callback: function(r) {
				let description = '';
				if(r.message){
					frm.set_value("valid_url", true);
					frm.set_df_property('url', 'description', '<font color="green">Valid Url</font>');
				}
				if(!r.message && frm.doc.url){
					frm.set_value("valid_url", false);
					frm.set_df_property('url', 'description', '<font color="red">Invalid Url</font>');
				}
			}
		});
	},

	password_category: function(frm) {
		if(frm.doc.password_category){
			frappe.db.get_value('Password Category', frm.doc.password_category, 'ensure_strong_password', function(r) {
				if(r && r.ensure_strong_password){
					frm.set_value('ensure_strong_password', r.ensure_strong_password);
				}
				else{
					frm.set_value('ensure_strong_password', false);
				}
			});
		}
		else{
			frm.set_value('ensure_strong_password', false);
		}
	},

	create_new_password: function(frm) {
		// Ask for TOTP first, same as Get My Password
		prompt_for_totp(frm, function() {
			create_new_password_dialog(frm, false);
		});
	},

	go_to_url: function(frm) {
		window.open(frm.doc.url);
	},

	generate_strong_password: function(frm) {
		create_new_password_dialog(frm, true);
	},

	change_ownership: function(frm) {
		change_credential_ownership(frm);
	}
});

// Child table controls
frappe.ui.form.on('Password Management User', {
	user_list_remove: function(frm) {
		restrict_user_add_remove(frm);
	},
	user_list_add: function(frm) {
		restrict_user_add_remove(frm);
	}
});

// -----------------------------
// Read-only handling
// -----------------------------
var set_fields_read_only = function(frm) {
	var fields_list = frappe.meta.docfield_list[frm.doc.doctype];
	for(var i=0; i<fields_list.length; i++){
		frm.set_df_property(fields_list[i].fieldname, "read_only", true);
	}
};

var restrict_user_add_remove = function(frm) {
	if(frappe.session.user != 'Administrator' && frappe.session.user != frm.doc.credentials_owner){
		frappe.msgprint(__("Not permitted, Only Administrator can add or delete user"));
		frm.reload_doc();
	}
};

// -----------------------------
// Strong Password Generation
// -----------------------------
var create_new_password_dialog = function(frm, is_new) {
	var common_fields = [
		{ fieldtype: 'Button', fieldname: 'generate_password', label: 'Generate Strong Password',
			click: function() { generate_password(frm, d); }
		},
		{ fieldtype: 'Data', reqd: 1, fieldname: 'new_password', label: 'New Password'},
		{ fieldtype: 'Check', reqd: 1, fieldname: 'make_sure_password_copied', label: 'Make sure the password is copied'}
	];

	var fields = [];
	var primary_action_label = 'Set Password';

	if(!is_new){
		fields = [{ fieldtype: 'Password', reqd: 1, fieldname: 'password', label: 'Password'}];
		primary_action_label = 'Update Password';
	}

	fields = fields.concat(common_fields);

	var d = new frappe.ui.Dialog({
		title: __("Create Strong Password"),
		fields: fields,
		primary_action_label: __(primary_action_label),
		primary_action: function() {
			if(d.get_value('make_sure_password_copied') == 1){
				set_new_password(frm, d, is_new);
			}
			else{
				frappe.msgprint(__("Make sure the password is copied"));
			}
		}
	});
	d.show();
};

var set_new_password = function(frm, d, is_new){

	// ----------------------------
	// Ask for TOTP before update
	// ----------------------------
	prompt_for_totp(frm, function() {

		if(is_new){
			frm.set_value('password', d.get_value('new_password'));
			d.hide();
		}
		else{
			frappe.call({
				doc: frm.doc,
				method: 'set_new_password',
				args: {
					'old_password': d.get_value('password'),
					'new_password': d.get_value('new_password')
				},
				callback: function(r) {
					if(r.message){
						d.hide();
					}
				},
				freeze: true,
				freeze_message: __("Updating Password......")
			});
		}

	});
};

// Generate password
var generate_password = function(frm, d) {
	frappe.call({
		doc: frm.doc,
		method: 'generate_password',
		callback: function(r) {
			if(r && r.message){
				d.set_values({'new_password': r.message});
			}
			else{
				d.set_values({'new_password': ''});
			}
		}
	});
};

// -----------------------------
// Get My Password (with TOTP)
// -----------------------------
var get_my_password = function(frm) {

	prompt_for_totp(frm, function() {

		frappe.call({
			doc: frm.doc,
			method: "get_my_password",
			callback: function(r) {
				if (r && r.message) {
					var d = new frappe.ui.Dialog({
						title: __("My Password"),
						fields: [{ fieldtype: "Data", read_only: 1, fieldname: "my_password" }]
					});
					d.set_values({ my_password: r.message });
					d.show();

					copyToClipboard(r.message);

					frappe.show_alert({
						message: __("Password is copied to clipboard!"),
						indicator: "green"
					});
				}
			}
		});

	});
};

// -----------------------------
// Copy to clipboard
// -----------------------------
var copyToClipboard = function(secretInfo) {
	var $body = document.getElementsByTagName('body')[0];
	var $tempInput = document.createElement('INPUT');
	$body.appendChild($tempInput);
	$tempInput.setAttribute('value', secretInfo)
	$tempInput.select();
	document.execCommand('copy');
	$body.removeChild($tempInput);
};

// -----------------------------
// Change Ownership
// -----------------------------
var change_credential_ownership = function(frm) {

	if(frm.doc.credentials_owner){
		var d = new frappe.ui.Dialog({
			title: __("Change Ownership"),
			fields: [
				{ label: 'New Credentials Owner', fieldtype: 'Link', reqd: 1, fieldname: 'new_owner', options: 'User'}
			],
			primary_action_label: __("Change"),
			primary_action: function() {
				frappe.confirm(__('Permanently Change the Credentials Owner?'),
					function() {
						frm.set_value('credentials_owner', d.get_value('new_owner'));
						frm.save();
						d.hide();
					},
					function() {
						d.hide();
					}
				);
			}
		});
		d.set_values({'new_owner': frm.doc.credentials_owner});
		d.show();
	}
};

// -----------------------------
// TOTP WRAPPER (Password Settings Secret)
// -----------------------------
var prompt_for_totp = function(frm, callback) {

	frappe.prompt(
		{ fieldname: "totp_code", label: "Enter TOTP Code", fieldtype: "Data", reqd: 1 },

		function(values) {

			frappe.call({
				method: "precivault.precivault.doctype.password_settings.password_settings.verify_totp",
				args: { code: values.totp_code },
				callback: function(r) {
					if(r.message === true){
						callback();
					} else {
						frappe.msgprint("❌ Invalid TOTP Code!");
					}
				}
			});

		},

		__("TOTP Verification")
	);
};
