//META{"name":"CopyUtils","website":"https://github.com/polop2301/BD-Plugins/tree/master/Plugins/CopyUtils","source":"https://raw.githubusercontent.com/polop2301/BD-Plugins/master/Plugins/CopyUtils/CopyUtils.plugin.js"}*//

const { clipboard } = require('electron')
const { findModuleByProps: f, findModuleByDisplayName: fdm, monkeyPatch, showToast, React, ReactDOM } = BdApi

class CopyUtils {
	getName() { return "CopyUtils" }
	getVersion() { return "0.0.6" }
	getAuthor() { return "Montarex23 & Juby210" }
	getDescription() { return "Allows you to copy channel link, name and topic. You can copy someone's avatar URL too!" }
	getRawUrl() { return "https://raw.githubusercontent.com/polop2301/BD-Plugins/master/Plugins/CopyUtils/CopyUtils.plugin.js" }

	getSettingsPanel () {
		let set = document.createElement('div')
		let el = React.createElement(fdm('SwitchItem'), { value: this.loadData('spacesInsteadOfDashes') }, 'Spaces instead of dashes.')
		el.props.onChange = () => this.toggleSetting(el._owner.stateNode, 'spacesInsteadOfDashes')
		ReactDOM.render(el, set)
		return set
	}

	load () {}

	start () {
		this.labels = {
			context_copy_text:						"Copy",
			submenu_copylink_text:					"Link",
			submenu_copyname_text:					"Name",
			submenu_copytopic_text:					"Topic",
			submenu_useravatarurl_text:				"Avatar URL",
			copy_link_success:						"Link copied successfully",
			copy_name_success:						"Name copied successfully",
			copy_topic_success:						"Topic copied successfully",
			copy_avatarurl_success:					"Avatar URL copied successfully",
			copy_topic_empty:						"Channel topic is empty"
		}

		if(f('Messages').chosenLocale == "pl") {
			this.labels = {
				context_copy_text:						"Kopiuj",
				submenu_copylink_text:					"Link",
				submenu_copyname_text:					"Nazwę",
				submenu_copytopic_text:					"Temat",
				submenu_useravatarurl_text:				"Link do avataru",
				copy_link_success:						"Link pomyślnie skopiowany",
				copy_name_success:						"Nazwa pomyślnie skopiowana",
				copy_topic_success:						"Temat pomyślnie skopiowany",
				copy_avatarurl_success:					"Link do avataru pomyślnie skopiowany",
				copy_topic_empty:						"Temat kanału jest pusty"
			}
		}

		this.unpatch = monkeyPatch(fdm('ChannelContextMenu').prototype, 'render', { after: b => {
			b.returnValue.props.children.push(React.createElement(fdm('FluxContainer(SubMenuItem)'), {
				label: this.labels.context_copy_text,
				render: [
					React.createElement(this.ContextMenuItem, {
						label: this.labels.submenu_copylink_text,
						action: () => {
							let channelidtocopy = b.thisObject.props.channel.id
							let guildidtocopy = b.thisObject.props.channel.guild_id
							clipboard.write({ text: `https://discordapp.com/channels/${guildidtocopy}/${channelidtocopy}` })
							showToast(this.labels.copy_link_success, { type: 'success' })
						}
					}),
					React.createElement(this.ContextMenuItem, {
						label: this.labels.submenu_copyname_text,
						action: () => {
							let channelnametocopy = b.thisObject.props.channel.name
							if (this.loadData('spacesInsteadOfDashes')) {
								channelnametocopy = channelnametocopy.replace(/-/g, ' ')
							}
							clipboard.write({ text: channelnametocopy })
							showToast(this.labels.copy_name_success, { type: 'success' })
						}
					}),
					React.createElement(this.ContextMenuItem, {
						label: this.labels.submenu_copytopic_text,
						action: () => {
							let channeltopictocopy = b.thisObject.props.channel.topic
							if (channeltopictocopy == "") {
								showToast(this.labels.copy_topic_empty, { type: 'error' })
								return
							}
							clipboard.write({ text: channeltopictocopy })
							showToast(this.labels.copy_topic_success, { type: 'success' })
						}
					})
				]
			}))
		}})

		this.unpatch2 = monkeyPatch(fdm('UserContextMenu').prototype, 'render', { after: b => {
			b.returnValue.props.children.props.children.props.children.push(React.createElement(fdm('FluxContainer(SubMenuItem)'), {
				label: this.labels.context_copy_text,
				render: [
					React.createElement(this.ContextMenuItem, {
						label: this.labels.submenu_useravatarurl_text,
						action: () => {
							clipboard.write({ text: b.thisObject.props.user.avatarURL })
							showToast(this.labels.copy_avatarurl_success, { type: 'success' })
						}
					})
				]
			}))
		}})

		if(global.ZeresPluginLibrary) {
			ZeresPluginLibrary.PluginUpdater.checkForUpdate(this.getName(), this.getVersion(), this.getRawUrl())
		}
	}

	stop () {
		if(this.unpatch) this.unpatch()
		if(this.unpatch2) this.unpatch2()
	}

	loadData(s) {
		return BdApi.loadData(this.getName(), s)
	}

	toggleSetting(node, s) {
		BdApi.saveData(this.getName(), s, !this.loadData(s))
		if(node) {
			node.settingsPanel.parentElement.removeChild(node.settingsPanel)
			node.forceUpdate()
		}
	}

	ContextMenuItem = class extends React.Component {
		render() {
			const c = f('contextMenu')
			return React.createElement(fdm('Clickable'), {
				className: c.item + " " + c.clickable,
				role: 'menuitem',
				onClick: typeof this.props.action != 'function' ? null : this.props.action,
				children: [
					React.createElement('div', {
						className: c.label,
						children: this.props.label
					}), this.props.children
				]
			})
		}
	}
}
