//META{"name":"CopyUtils","website":"https://github.com/polop2301/BD-Plugins/tree/master/Plugins/CopyUtils","source":"https://raw.githubusercontent.com/polop2301/BD-Plugins/master/Plugins/CopyUtils/CopyUtils.plugin.js"}*//

const { clipboard } = require('electron')
const { findModuleByProps: f, findModuleByDisplayName: fdm, monkeyPatch, showToast, React, ReactDOM } = BdApi

class CopyUtils {
	getName() { return "CopyUtils" }
	getVersion() { return "1.0.0" }
	getAuthor() { return "Montarex23 & Juby210" }
	getDescription() { return "Allows you to copy useful things." }
	getRawUrl() { return "https://raw.githubusercontent.com/polop2301/BD-Plugins/master/Plugins/CopyUtils/CopyUtils.plugin.js" }

	getSettingsPanel () {
		let set = document.createElement('div')
		let el = React.createElement(fdm('SwitchItem'), { value: this.loadData('spacesInsteadOfDashes') }, 'Spaces instead of dashes.')
		el.props.onChange = () => this.toggleSetting(el._owner.stateNode, 'spacesInsteadOfDashes')
		ReactDOM.render(el, set)
		return set
	}

	start () {
		this.unpatch = []
		this.labels = {
			copy:      "Copy",
			link:      "Link",
			name:      "Name",
			topic:     "Topic",
			avatarURL: "Avatar URL",
			mention:   "Mention",
			tag:       "Tag",
			iconURL:   "Icon URL",

			copy_success: "Copied"
		}

		// Discord Modules
		const { getChannel } = f('getChannel')
		const { getUser } = f('getUser', 'getCurrentUser')
		const { getGuild } = f('getGuild')
		const { chosenLocale } = f('Messages')
		const cmc = f('contextMenu') // Context Menu Classes

		if(chosenLocale == "pl") {
			this.labels = Object.assign(this.labels, {
				copy:      "Kopiuj",
				name:      "Nazwę",
				topic:     "Temat",
				avatarURL: "Link do avataru",
				mention:   "Wzmiankę",
				iconURL:   "Link do ikony",

				copy_success: "Skopiowano"
			})
		}

		// Channel Context Menu
		// ChannelMarkReadItem because other items doesn't has render in prototype
		this.unpatch.push(monkeyPatch(fdm('ChannelMarkReadItem').prototype, 'render', { after: b => {
			const c = getChannel(b.thisObject.props.channelId)
			b.returnValue = React.createElement('div', { children: [ b.returnValue, this.SubMenu([
				React.createElement(this.ContextMenuItem, {
					label: this.labels.link,
					action: () => {
						clipboard.write({ text: `https://discordapp.com/channels/${c.guild_id}/${c.id}` })
						this.showCopyToast()
					}
				}),
				React.createElement(this.ContextMenuItem, {
					label: this.labels.name,
					action: () => {
						let name = c.name
						if (this.loadData('spacesInsteadOfDashes')) {
							name = name.replace(/-/g, ' ')
						}
						clipboard.write({ text: name })
						this.showCopyToast()
					}
				}),
				c.topic ? React.createElement(this.ContextMenuItem, {
					label: this.labels.topic,
					action: () => {
						clipboard.write({ text: c.topic })
						this.showCopyToast()
					}
				}) : null,
				React.createElement(this.ContextMenuItem, {
					label: this.labels.mention,
					action: () => {
						clipboard.write({ text: '<#' + c.id + '>' })
						this.showCopyToast()
					}
				})
			])]})
		}}))

		// User Context Menu
		this.unpatch.push(monkeyPatch(fdm('UserCallItem').prototype, 'render', { after: b => {
			const u = getUser(b.thisObject.props.userId)
			b.returnValue = React.createElement('div', { children: [ b.returnValue, this.SubMenu([
				u.avatar ? React.createElement(this.ContextMenuItem, {
					label: this.labels.avatarURL,
					action: () => {
						clipboard.write({ text: u.avatarURL.replace('size=128', 'size=2048') })
						this.showCopyToast()
					}
				}) : null,
				React.createElement(this.ContextMenuItem, {
					label: this.labels.mention,
					action: () => {
						clipboard.write({ text: '<@' + u.id + '>' })
						this.showCopyToast()
					}
				}),
				React.createElement(this.ContextMenuItem, {
					label: this.labels.tag,
					action: () => {
						clipboard.write({ text: u.tag })
						this.showCopyToast()
					}
				})
			])]})
		}}))

		// Guild Context Menu
		this.unpatch.push(monkeyPatch(fdm('GuildPrivacySettingsItem').prototype, 'render', { after: b => {
			const g = getGuild(b.thisObject.props.guildId)
			b.returnValue = React.createElement('div', { children: [ b.returnValue, this.SubMenu([
				g.icon ? React.createElement(this.ContextMenuItem, {
					label: this.labels.iconURL,
					action: () => {
						clipboard.write({ text: g.getIconURL('png').replace('size=128', 'size=2048') })
						this.showCopyToast()
					}
				}) : null,
				React.createElement(this.ContextMenuItem, {
					label: this.labels.name,
					action: () => {
						clipboard.write({ text: g.name })
						this.showCopyToast()
					}
				})
			])]})
		}}))

		if(global.ZeresPluginLibrary) {
			ZeresPluginLibrary.PluginUpdater.checkForUpdate(this.getName(), this.getVersion(), this.getRawUrl())
		}
		
		this.SubMenu = render => {
			return React.createElement(fdm('FluxContainer(SubMenuItem)'), { label: this.labels.copy, render })
		}
		this.ContextMenuItem = class extends React.Component {
			render() {
				return React.createElement(fdm('Clickable'), {
					className: cmc.item + " " + cmc.clickable,
					role: 'menuitem',
					onClick: typeof this.props.action != 'function' ? null : this.props.action,
					children: [
						React.createElement('div', {
							className: cmc.label,
							children: this.props.label
						}), this.props.children
					]
				})
			}
		}	
	}

	stop () {
		if(this.unpatch) this.unpatch.forEach(u => u())
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

	showCopyToast() {
		showToast(this.labels.copy_success, { type: 'success' })
	}
}
