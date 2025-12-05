export const fr = {
	common: {
		error: "Une erreur est survenue.",
		success: "Succès !",
		no_reason: "Aucune raison fournie",
		cancel: "Annuler",
		confirm: "Confirmer",
	},
	modules: {
		general: {
			commands: {
				ping: {
					response: "Pong !",
				},
				sync: {
					autocomplete: {
						welcome_roles: "Rôles de bienvenue",
					},
					in_progress: "Une synchronisation est déjà en cours.",
					started: "Synchronisation des rôles de bienvenue démarrée.",
					failed: "Échec du démarrage de la synchronisation.",
				},
			},
		},
		invitation: {
			commands: {
				view: {
					title: "Invitations pour {{username}}",
					active: "Actives",
					fake: "Fausses (Quitté)",
					total: "Total",
				},
				top: {
					no_invites: "Aucune invitation trouvée.",
					title: "🏆 Classement des invitations",
					footer: "Trié par invitations actives",
				},
			},
		},
		moderation: {
			services: {
				sanction: {
					mute_role_not_configured:
						"Le rôle muet n'est pas configuré. Veuillez demander à un administrateur de le configurer.",
					mute_role_not_found:
						"Le rôle muet configuré est introuvable dans ce serveur.",
					user_not_found: "Utilisateur introuvable dans ce serveur.",
					cannot_mute: "Je ne peux pas rendre cet utilisateur muet.",
					already_muted: "L'utilisateur est déjà muet.",
					dm: {
						mute: "Vous avez été temporairement `rendu muet` dans `{{guild}}` pour `{{duration}}`.\nRaison : `{{reason}}`",
						ban: "Vous avez été banni de `{{guild}}`.\nRaison : `{{reason}}`",
						warn: "Vous avez reçu un `avertissement` dans `{{guild}}`.\nRaison : `{{reason}}`",
						unwarn: "Votre avertissement `#{{warnId}}` a été retiré dans `{{guild}}`.\nRaison de l'avertissement : `{{reason}}`",
						unmute: "Vous n'êtes plus `muet` dans `{{guild}}`.",
					},
					already_banned: "L'utilisateur est déjà banni.",
					cannot_ban: "Je ne peux pas bannir cet utilisateur.",
					invalid_warn_id: "ID d'avertissement invalide.",
					not_muted: "L'utilisateur n'est pas muet.",
					not_banned: "L'utilisateur n'est pas banni.",
				},
			},
			commands: {
				ban: {
					success:
						"L'utilisateur {{userTag}} a été banni. Raison : {{reason}}",
					error: "Une erreur est survenue lors du bannissement de l'utilisateur.",
				},
				clear: {
					invalid_amount:
						"Veuillez fournir un nombre valide de messages à supprimer.",
					success: "{{count}} messages supprimés.",
				},
				lock: {
					channel_error: "Ce salon ne peut pas être verrouillé.",
					channel_success: "🔒 Salon verrouillé. Raison : {{reason}}",
					server_admin_error:
						"Vous avez besoin de la permission Administrateur pour verrouiller le serveur.",
					server_success:
						"🚨 **SERVEUR VERROUILLÉ**. Raison : {{reason}}",
				},
				purge: {
					text_channel_only:
						"Cette commande ne peut être utilisée que dans les salons textuels.",
					purging: "Purge du salon...",
					renewed: "Le salon a été renouvelé.",
				},
				sanctions: {
					list: {
						no_sanctions:
							"Aucune sanction trouvée pour {{userTag}}.",
						title: "Sanctions pour {{userTag}}",
						footer: "Page {{page}}/{{totalPages}} • Total : {{total}}",
						unknown_moderator: "Inconnu",
						status_active: "Statut : ✅",
						status_inactive: "Statut : ❌",
						expires: "Expire le {{date}}",
						permanent: "Permanent",
						field_value:
							"**Raison :** {{reason}}\n**Modérateur :** {{moderator}}{{statusInfo}}",
					},
				},
				tempmute: {
					predefined_reason_error:
						"Vous devez sélectionner une raison prédéfinie avec une durée.",
					invalid_duration:
						"Format de durée invalide. Utilisez un format comme 10m, 1h, 1d.",
					success:
						"L'utilisateur {{userTag}} a été rendu muet pour {{duration}}. Raison : {{reason}}",
					error: "Une erreur est survenue lors de la mise en sourdine de l'utilisateur.",
				},
				unban: {
					success: "L'utilisateur {{userTag}} a été débanni.",
					error: "Une erreur est survenue lors du débannissement de l'utilisateur.",
				},
				unlock: {
					channel_error: "Ce salon ne peut pas être déverrouillé.",
					channel_success:
						"🔓 Salon déverrouillé. Raison : {{reason}}",
					server_admin_error:
						"Vous avez besoin de la permission Administrateur pour déverrouiller le serveur.",
					server_success:
						"✅ **SERVEUR DÉVERROUILLÉ**. Raison : {{reason}}",
				},
				unmute: {
					success: "L'utilisateur {{userTag}} n'est plus muet.",
					error: "Une erreur est survenue lors de la réactivation du son de l'utilisateur.",
				},
				unwarn: {
					success:
						"✅ Avertissement #{{warnId}} supprimé pour {{userTag}}.",
					error: "❌ Échec de la suppression de l'avertissement : {{error}}",
				},
				warn: {
					success: "✅ {{userTag}} averti pour : {{reason}}",
					error: "❌ Échec de l'avertissement de l'utilisateur : {{error}}",
				},
			},
		},
		security: {
			commands: {
				heatpoint: {
					user_stats:
						"🔥 **Points de chaleur pour {{userTag}}** : {{heat}}",
					reset_all:
						"✅ Points de chaleur réinitialisés pour tous les utilisateurs.",
					reset_channel:
						"✅ Points de chaleur réinitialisés pour le salon {{channel}}.",
					channel_not_found: "❌ Salon introuvable.",
					reset_server:
						"✅ Points de chaleur globaux du serveur réinitialisés.",
				},
			},
		},
		statistics: {
			commands: {
				stats: {
					title: "📊 Statistiques de {{name}}",
					period: "Période : {{period}}",
				},
			},
		},
		voice: {
			interface: {
				title: "Interface de gestion du salon",
				description:
					"Bienvenue dans votre salon temporaire {{owner}}.\nUtilisez les boutons ci-dessous pour configurer votre salon.",
				fields: {
					info: {
						name: "Informations",
						value: "📝 Nom : {{name}}\n👥 Limite : {{limit}}",
						limit: "Limite",
						unlimited: "Illimité",
					},
					whitelist: {
						name: "Liste blanche",
						none: "Aucun",
					},
					blacklist: {
						name: "Liste noire",
						none: "Aucun",
					},
				},
			},
			interactions: {
				rename_label: "Nouveau nom",
				rename_title: "Renommer le salon",
				renamed: "Salon <#{{channelId}}> renommé en {{newName}}",
			},
		},
		configuration: {
			services: {
				group: {
					not_found: "Groupe {{name}} introuvable",
				},
				permission: {
					not_found: "Permission {{name}} introuvable",
				},
			},
			commands: {
				config: {
					backup_success: "Sauvegarde créée avec succès !",
					backup_failed: "Échec de la création de la sauvegarde.",
					invalid_file:
						"Type de fichier invalide. Veuillez télécharger un fichier .enc.",
				},
				backup: {
					success:
						"✅ Sauvegarde de la configuration créée avec succès !",
					error: "Échec de la création de la sauvegarde. Veuillez vérifier les journaux pour plus de détails.",
				},
				restore: {
					success:
						"Sauvegarde de la configuration restaurée avec succès ! Toutes les configurations des modules ont été mises à jour.",
					error: "Échec de la restauration de la sauvegarde. Veuillez vérifier les journaux pour plus de détails.",
					invalid_file:
						"Format de fichier invalide. Veuillez fournir un fichier de sauvegarde chiffré (.enc)",
					download_error:
						"Échec du téléchargement du fichier de sauvegarde",
				},
				modules: {
					not_found: "Module **{{module}}** introuvable.",
					no_config:
						"Le module **{{module}}** n'a pas d'options de configuration.",
					build_error:
						"Échec de la création de la configuration pour le module **{{module}}**.",
				},
				embed: {
					editor_intro: "Éditeur d'embed pour `{{name}}`",
					default_title: "Nouvel Embed",
					default_description: "Ceci est un nouvel embed.",
					editor_content:
						"**Éditeur d'Embed** : Édition de `{{name}}`\nUtilisez le menu ci-dessous pour modifier les propriétés. Cliquez sur **Sauvegarder** lorsque vous avez terminé.",
					not_found: "❌ Embed `{{name}}` introuvable.",
				},
				group: {
					none: "Aucun",
					info: "**Groupe :** {{name}}\n**Rôle :** {{role}}\n**Permissions :**\n{{perms}}",
					created: "Groupe créé",
					create_error: "Échec de la création du groupe : {{error}}",
					deleted: "Groupe `{{name}}` supprimé.",
					delete_error:
						"Échec de la suppression du groupe : {{error}}",
					permission_added: "Permission ajoutée",
					add_permission_error:
						"Échec de l'ajout de la permission : {{error}}",
					permission_removed: "Permission supprimée",
					remove_permission_error:
						"Échec de la suppression de la permission : {{error}}",
					no_groups: "Aucun groupe trouvé.",
					list_title: "Liste des groupes ({{page}}/{{totalPages}})",
					list_error: "Échec de la liste des groupes : {{error}}",
				},
			},
			interactions: {
				embed_editor: {
					saved: "✅ Embed `{{name}}` sauvegardé avec succès !",
					cancelled: "❌ Éditeur annulé.",
				},
				session_expired: "❌ Session expirée. Veuillez recommencer.",
				not_allowed:
					"❌ Vous n'êtes pas autorisé à interagir avec ce composant.",
				updated: "✅ Configuration mise à jour.",
				update_failed:
					"❌ Échec de la mise à jour de la configuration.",
			},
			helper: {
				title: "⚙️ Configuration : {{module}}",
				description:
					"Sélectionnez une propriété à configurer pour le module **{{module}}**.",
			},
		},
		log: {
			sanction: {
				title: "Sanction : {{type}}",
				user: "Utilisateur",
				moderator: "Modérateur",
				reason: "Raison",
				duration: "Durée",
			},
			temp_voice: {
				title: "Vocal Temporaire : {{action}}",
			},
			voice: {
				title: "Vocal : {{action}}",
				connected: "Connecté",
				disconnected: "Déconnecté",
				moved: "Déplacé",
				started_streaming: "Stream lancé",
				stopped_streaming: "Stream arrêté",
				details: {
					connected: "Connecté à {{channel}}",
					disconnected: "Déconnecté de {{channel}}",
					moved: "Déplacé de {{old}} vers {{new}}",
					started_streaming: "A commencé à streamer dans {{channel}}",
					stopped_streaming: "A arrêté de streamer dans {{channel}}",
				},
			},
			member: {
				join: {
					title: "Membre rejoint",
					user: "Utilisateur",
					created_at: "Créé le",
				},
				leave: {
					title: "Membre parti",
					user: "Utilisateur",
					joined_at: "Rejoint le",
					unknown: "Inconnu",
				},
			},
			message: {
				edit: {
					title: "Message modifié",
					before: "Avant",
					after: "Après",
					empty: "*Message vide*",
					description:
						"Message modifié dans {{channel}} [Aller au message]({{url}})",
					no_content: "*Aucun contenu*",
				},
				delete: {
					title: "Message supprimé",
					content: "Contenu",
					attachments: "Fichiers joints",
					description: "Message supprimé dans {{channel}}",
				},
			},
			role: {
				create: {
					title: "Rôle créé",
					role: "Rôle",
					color: "Couleur",
				},
				update: {
					title: "Rôle modifié",
					role: "Rôle",
					changes: "Modifications",
					field_change: "**{{field}}** : `{{before}}` ➜ `{{after}}`",
					added_perms: "**Permissions ajoutées** : `{{perms}}`",
					removed_perms: "**Permissions retirées** : `{{perms}}`",
					fields: {
						name: "Nom",
						color: "Couleur",
						hoist: "Affiché séparément",
						position: "Position",
						mentionable: "Mentionnable",
					},
				},
				delete: {
					title: "Rôle supprimé",
					role: "Rôle",
					color: "Couleur",
				},
			},
		},
	},
	utils: {
		config_helper: {
			title: "⚙️ Configuration : {{module}}",
			description:
				"Sélectionnez une propriété à configurer pour le module **{{module}}**.",
			type: "Type",
			current: "Actuel",
			not_set: "Non défini",
			select_placeholder: "Sélectionnez une propriété...",
			types: {
				string: "Texte",
				integer: "Entier",
				boolean: "Booléen",
				user: "Utilisateur",
				channel: "Salon",
				role: "Rôle",
				mentionable: "Mentionnable",
				number: "Nombre",
				attachment: "Fichier",
				customembed: "Embed personnalisé",
				rolearray: "Liste de rôles",
				stringchoice: "Choix multiple",
			},
			configure_property: "⚙️ Configurer : {{property}}",
		},
	},
};
