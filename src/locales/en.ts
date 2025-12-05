export default {
	common: {
		error: "An error occurred.",
		success: "Success!",
		no_reason: "No reason provided",
		cancel: "Cancel",
		confirm: "Confirm",
		yes: "Yes",
		no: "No",
		none: "None",
	},
	modules: {
		debug: {
			commands: {
				debug: {
					description: "Debug command",
					options: {
						action: {
							description: "Action to perform",
							choices: {
								throw_error: "Throw Error",
								test_embed: "Test Embed",
							},
						},
					},
					success: "Debug action executed successfully",
					error_thrown: "Error thrown!",
					embed_title: "Debug Embed",
					embed_description: "This is a debug embed",
					unknown_action: "Unknown action",
				},
			},
		},
		general: {
			commands: {
				ping: {
					response: "Pong!",
				},
				sync: {
					autocomplete: {
						welcome_roles: "Welcome Roles",
					},
					in_progress: "A synchronization is already in progress.",
					started: "Welcome roles synchronization started.",
					failed: "Failed to start synchronization.",
				},
			},
		},
		invitation: {
			commands: {
				view: {
					title: "Invites for {{username}}",
					active: "Active",
					fake: "Fake (Left)",
					total: "Total",
				},
				top: {
					no_invites: "No invitations found.",
					title: "🏆 Invites Leaderboard",
					footer: "Sorted by active invites",
				},
			},
		},
		moderation: {
			services: {
				sanction: {
					mute_role_not_configured:
						"Mute role is not configured. Please ask an administrator to configure it.",
					mute_role_not_found:
						"Configured mute role not found in this guild.",
					user_not_found: "User not found in this guild.",
					cannot_mute: "I cannot mute this user.",
					already_muted: "User is already muted.",
					dm: {
						mute: "You have been temporarily `muted` in `{{guild}}` for `{{duration}}`.\nReason: `{{reason}}`",
						ban: "You have been banned from `{{guild}}`.\nReason: `{{reason}}`",
						warn: "You have been `warned` in `{{guild}}`.\nReason: `{{reason}}`",
						unwarn: "Your warning `#{{warnId}}` has been removed in `{{guild}}`.\nWarn reason: `{{reason}}`",
						unmute: "You have been `unmuted` in `{{guild}}`.",
					},
					already_banned: "User is already banned.",
					cannot_ban: "I cannot ban this user.",
					invalid_warn_id: "Invalid warning ID.",
					not_muted: "User is not muted.",
					not_banned: "User is not banned.",
				},
			},
			commands: {
				ban: {
					description: "Ban a user",
					success:
						"User {{userTag}} has been banned. Reason: {{reason}}",
					error: "An error occurred while banning the user.",
				},
				kick: {
					description: "Kick a user",
				},
				mute: {
					description: "Mute a user",
				},
				warn: {
					description: "Warn a user",
					success: "✅ Warned {{userTag}} for: {{reason}}",
					error: "❌ Failed to warn user: {{error}}",
				},
				clear: {
					invalid_amount:
						"Please provide a valid number of messages to clear.",
					success: "Deleted {{count}} messages.",
				},
				lock: {
					channel_error: "This channel cannot be locked.",
					channel_success: "🔒 Channel locked. Reason: {{reason}}",
					server_admin_error:
						"You need Administrator permission to lock the server.",
					server_success: "🚨 **SERVER LOCKED**. Reason: {{reason}}",
				},
				purge: {
					text_channel_only:
						"This command can only be used in text channels.",
					purging: "Purging channel...",
					renewed: "Channel has been renewed.",
				},
				sanctions: {
					no_sanctions: "No sanctions found for {{userTag}}.",
					title: "Sanctions for {{userTag}}",
					unknown: "Unknown",
					status: "Status",
					expires: "Expires {{time}}",
					permanent: "Permanent",
					reason: "Reason",
					moderator: "Moderator",
					edit_provide_field: "Please provide a field to edit.",
					reason_added: "Reason Added",
					reason_added_desc:
						"Added reason `{{text}}` for type `{{type}}`.",
					id: "ID",
					duration: "Duration",
					reason_add_failed: "Failed to add reason.",
					reason_not_found: "Reason #{{id}} not found.",
					cannot_edit_system: "Cannot edit system reasons.",
					reason_updated: "Reason #{{id}} updated.",
					reason_update_failed: "Failed to update reason #{{id}}.",
					reason_removed: "Reason #{{id}} removed.",
					reason_remove_failed: "Failed to remove reason #{{id}}.",
					no_reasons_found: "No reasons found.",
					reasons_title: "Sanction Reasons",
				},
				tempmute: {
					predefined_reason_error:
						"You must select a predefined reason with a duration.",
					invalid_duration:
						"Invalid duration format. Use format like 10m, 1h, 1d.",
					success:
						"User {{userTag}} has been muted for {{duration}}. Reason: {{reason}}",
					error: "An error occurred while muting the user.",
				},
				unban: {
					success: "User {{userTag}} has been unbanned.",
					error: "An error occurred while unbanning the user.",
				},
				unlock: {
					channel_error: "This channel cannot be unlocked.",
					channel_success: "🔓 Channel unlocked. Reason: {{reason}}",
					server_admin_error:
						"You need Administrator permission to unlock the server.",
					server_success:
						"✅ **SERVER UNLOCKED**. Reason: {{reason}}",
				},
				unmute: {
					success: "User {{userTag}} has been unmuted.",
					error: "An error occurred while unmuting the user.",
				},
				unwarn: {
					success: "✅ Removed warning #{{warnId}} for {{userTag}}.",
					error: "❌ Failed to unwarn user: {{error}}",
				},
			},
		},
		security: {
			commands: {
				heatpoint: {
					user_stats: "🔥 **Heatpoints for {{userTag}}**: {{heat}}",
					reset_all: "✅ Reset heatpoints for all users.",
					reset_channel:
						"✅ Reset heatpoints for channel {{channel}}.",
					channel_not_found: "❌ Channel not found.",
					reset_server: "✅ Reset global server heatpoints.",
				},
			},
		},
		statistics: {
			commands: {
				stats: {
					title: "📊 Statistics for {{name}}",
					period: "Period: {{period}}",
					joined_at: "Joined At",
					created_at: "Created At",
					roles: "Roles",
					key_permissions: "Key Permissions",
					messages: "Messages",
					voice_time: "Voice Time",
					invites: "Invites",
					sanctions: "Sanctions",
					footer: "User ID: {{id}}",
					permissions: {
						administrator: "Administrator",
						manage_guild: "Manage Server",
						manage_roles: "Manage Roles",
						manage_channels: "Manage Channels",
						kick_members: "Kick Members",
						ban_members: "Ban Members",
						manage_messages: "Manage Messages",
						mention_everyone: "Mention Everyone",
						view_audit_log: "View Audit Log",
					},
				},
			},
		},
		voice: {
			interface: {
				title: "Channel Management Interface",
				description:
					"Welcome to your temporary channel {{owner}}.\nUse the buttons below to configure your channel.",
				fields: {
					info: {
						name: "Information",
						value: "📝 Name : {{name}}\n👥 Limit : {{limit}}",
						limit: "Limit",
						unlimited: "Unlimited",
					},
					whitelist: {
						name: "Whitelist",
						none: "None",
					},
					blacklist: {
						name: "Blacklist",
						none: "None",
					},
				},
			},
			interactions: {
				rename_label: "New name",
				rename_title: "Rename channel",
				renamed: "Renamed <#{{channelId}}> to {{newName}}",
				rename_success: "Channel renamed successfully",
			},
		},
		configuration: {
			services: {
				group: {
					not_found: "Group {{name}} not found",
				},
				permission: {
					not_found: "Permission {{name}} not found",
				},
			},
			commands: {
				config: {
					backup_success: "Backup created successfully!",
					backup_failed: "Failed to create backup.",
					invalid_file:
						"Invalid file type. Please upload a .enc file.",
				},
				backup: {
					success: "✅ Configuration backup created successfully!",
					error: "Failed to create backup. Please check the logs for details.",
				},
				restore: {
					success:
						"Configuration backup restored successfully! All module configurations have been updated.",
					error: "Failed to restore backup. Please check the logs for details.",
					invalid_file:
						"Invalid file format. Please provide an encrypted backup file (.enc)",
					download_error: "Failed to download backup file",
				},
				modules: {
					not_found: "Module **{{module}}** not found.",
					no_config:
						"Module **{{module}}** has no configuration options.",
					build_error:
						"Failed to build configuration for module **{{module}}**.",
				},
				embed: {
					editor_intro: "Embed Editor for `{{name}}`",
					default_title: "New Embed",
					default_description: "This is a new embed.",
					editor_content:
						"**Embed Editor**: Editing `{{name}}`\nUse the menu below to edit properties. Click **Save** when finished.",
					not_found: "❌ Embed `{{name}}` not found.",
				},
				group: {
					none: "None",
					info: "**Group:** {{name}}\n**Role:** {{role}}\n**Permissions:**\n{{perms}}",
					created: "Group Created",
					create_error: "Failed to create group: {{error}}",
					deleted: "Group `{{name}}` deleted.",
					delete_error: "Failed to delete group: {{error}}",
					permission_added: "Permission Added",
					add_permission_error: "Failed to add permission: {{error}}",
					permission_removed: "Permission Removed",
					remove_permission_error:
						"Failed to remove permission: {{error}}",
					no_groups: "No groups found.",
					list_title: "Group List ({{page}}/{{totalPages}})",
					list_error: "Failed to list groups: {{error}}",
					list_failed: "Failed to list groups",
				},
			},
			interactions: {
				embed_editor: {
					saved: "✅ Embed `{{name}}` saved successfully!",
					cancelled: "❌ Editor cancelled.",
				},
				session_expired: "❌ Session expired. Please start over.",
				not_allowed:
					"❌ You are not allowed to interact with this component.",
				updated: "✅ Configuration updated.",
				update_failed: "❌ Failed to update configuration.",
			},
			helper: {
				title: "⚙️ Configuration: {{module}}",
				description:
					"Select a property to configure for the **{{module}}** module.",
			},
		},
		log: {
			sanction: {
				title: "Sanction: {{type}}",
				user: "User",
				moderator: "Moderator",
				reason: "Reason",
				duration: "Duration",
			},
			temp_voice: {
				title: "Temp Voice: {{action}}",
			},
			voice: {
				title: "Voice: {{action}}",
				connected: "Connected",
				disconnected: "Disconnected",
				moved: "Moved",
				started_streaming: "Started Streaming",
				stopped_streaming: "Stopped Streaming",
				details: {
					connected: "Connected to {{channel}}",
					disconnected: "Disconnected from {{channel}}",
					moved: "Moved from {{old}} to {{new}}",
					started_streaming: "Started streaming in {{channel}}",
					stopped_streaming: "Stopped streaming in {{channel}}",
				},
			},
			member: {
				join: {
					title: "Member Joined",
					user: "User",
					created_at: "Created At",
				},
				leave: {
					title: "Member Left",
					user: "User",
					joined_at: "Joined At",
					unknown: "Unknown",
				},
			},
			message: {
				edit: {
					title: "Message Edited",
					before: "Before",
					after: "After",
					empty: "*Empty Message*",
					description:
						"Message edited in {{channel}} [Jump to message]({{url}})",
					no_content: "*No content*",
				},
				delete: {
					title: "Message Deleted",
					content: "Content",
					attachments: "Attachments",
					description: "Message deleted in {{channel}}",
				},
			},
			role: {
				create: {
					title: "Role Created",
					role: "Role",
					color: "Color",
				},
				update: {
					title: "Role Updated",
					role: "Role",
					changes: "Changes",
					field_change: "**{{field}}**: `{{before}}` ➔ `{{after}}`",
					added_perms: "**Added Permissions**: `{{perms}}`",
					removed_perms: "**Removed Permissions**: `{{perms}}`",
					fields: {
						name: "Name",
						color: "Color",
						hoist: "Hoist",
						position: "Position",
						mentionable: "Mentionable",
					},
				},
				delete: {
					title: "Role Deleted",
					role: "Role",
					color: "Color",
				},
			},
		},
	},
	utils: {
		config_helper: {
			title: "⚙️ Configuration: {{module}}",
			description:
				"Select a property to configure for the **{{module}}** module.",
			type: "Type",
			current: "Current",
			not_set: "Not set",
			select_placeholder: "Select a property...",
			types: {
				string: "Text",
				integer: "Integer",
				boolean: "Boolean",
				user: "User",
				channel: "Channel",
				role: "Role",
				mentionable: "Mentionable",
				number: "Number",
				attachment: "Attachment",
				customembed: "Custom Embed",
				rolearray: "Role List",
				stringchoice: "Multiple Choice",
			},
			configure_property: "⚙️ Configure: {{property}}",
		},
	},
};
