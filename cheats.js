// Written against CrossCode V1.2.0-5
(() => {
ig.baked = !0;
ig.module("ng-cheats-gui").requires("game.feature.gui.screen.title-screen", "game.feature.gui.screen.pause-screen", "game.feature.menu.gui.base-menu", "game.feature.menu.menu-model", "impact.base.lang", "impact.feature.gui.gui", "game.feature.interact.button-group", "game.feature.menu.gui.menu-misc", "game.feature.menu.gui.options.options-misc", "game.feature.gui.base.text", "game.feature.gui.base.button", "impact.feature.interact.press-repeater", "game.feature.gui.base.numbers", "game.feature.font.font-system", "game.feature.new-game.new-game-model").defines(function () {
	sc.NG_OPTIONS_CONFIG = [["base", "SINGLE", ["enable-ng"]]];
	for (var key in sc.NEW_GAME_SETS) {
		if (key === "carry-over") {
			continue;
		}
		var set = sc.NEW_GAME_SETS[key];
		var setElem = [key, set.type, []];
		for (var key2 in sc.NEW_GAME_OPTIONS) {
			sc.NEW_GAME_OPTIONS[key2].set === key && (setElem[2].push(key2));
		}
		sc.NG_OPTIONS_CONFIG.push(setElem);
	}
	// START: Lang Extension
	// If this code is changed into a real mod/extension this can be moved into a separate lang JSON.
	const LANG_EXTENSION = {
		"sc": {
			"ng-cheats": {
				"title": "New Game Cheats",
				"name": {
					"enable-ng": "Enable New Game",
					"base": "Base",
					"money": "Money",
					"exp": "EXP",
					"drop-rate": "Drop Rate",
					"combat-modifier": "Combat Modifiers",
					"itemCooldown": "Item Cooldown",
					"hp-regen": "HP Regen",
					"enemy": "Enemies",
					"enemy-damage": "Enemy Damage",
					"combat-arts": "Combat Arts",
					"others": "Miscellaneous"
				}
			}
		}
	};
	ig.Lang.inject({
		onload(...args) {
			this.parent(...args);
			function setProperties(from, to) {
				for (const [key, value] of Object.entries(from)) {
					if (typeof value === "object") {
						setProperties(value, to[key] = to[key] || {});
					} else {
						to[key] = value;
					}
				}
			}
			setProperties(LANG_EXTENSION, this.labels);
		},
	});
	// END: Lang Extension
	function isNewGamePlus() {
		// This is the ONLY method in the game that checks for new game plus and returns a boolean...
		return sc.TitleScreenButtonGui.prototype.checkClearSaveFiles();
	}
	const Label = sc.TextGui.extend({
		disabledText: "",
		enabled: true,
		enabledText: "",
		init(text) {
			this.parent(text, {
				speed: ig.TextBlock.SPEED.IMMEDIATE,
			});
			this.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
			this.disabledText = `\\c[${sc.FONT_COLORS.GREY}]${this.text}`;
			this.enabledText = this.text;
		},
		setEnabled(enabled) {
			this.enabled = enabled;
			this.setText(enabled ? this.enabledText : this.disabledText);
		},
	});
	const scrollSpeed = 0.05;
	const mouseScrollAmount = 20;
	sc.NgCheatsMenu = sc.BaseMenu.extend({
		buttonGroup: null,
		cheats: null,
		cheatsChanged: 0,
		cheatsChangedSaved: 0,
		cheatsChangedSaving: false,
		cheatsChangedTimer: -1,
		cheatsChangedTimeout: 5 * 1000, // 5 seconds
		contents: null,
		labels: null,
		list: null,
		newgameplus: false,
		repeater: null,
		init() {
			this.parent();
			this.newgameplus = isNewGamePlus();
			this.cheats = new Map;
			this.labels = new Map;

			this.hook.size.x = ig.system.width;
			this.hook.size.y = ig.system.height;
			this.buttonGroup = new sc.ButtonGroup; // Controls focus of controls and keyboard inputs.
			this.contents = new ig.GuiElementBase;
			this.repeater = new ig.PressRepeater; // Takes care of debouncing the inputs so we don't move the sliders uncontrollably quickly.

			// Create the container that has a scrollbar.
			this.list = new sc.ScrollPane(sc.ScrollType.Y_ONLY);
			this.list.showTopBar = false;
			this.list.showBottomBar = false;
			this.list.setSize(400, 240);
			this.list.setPos(0, 0);
			this.list.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
			// Setup animations so that the list slides in like the other lists do (ex: Save, Options, etc).
			this.list.hook.transitions = {
				DEFAULT: {
					state: {},
					time: 0.2,
					timeFunction: KEY_SPLINES.LINEAR,
				},
				HIDDEN: {
					state: {
						alpha: 0,
						offsetX: 218,
					},
					time: 0.2,
					timeFunction: KEY_SPLINES.LINEAR,
				}
			};
			// List starts hidden.
			this.list.doStateTransition("HIDDEN", true);

			// Add press callback so we can react when checkboxes are changed.
			this.buttonGroup.addPressCallback((control) => {
				if (control instanceof sc.CheckboxGui) {
					this.setCheatValue(control.data.optionKey, !!control.pressed);
				}
			});
			// Iterate through the cheats and create the UI for each.
			var rowYPos = 0, row = 0;
			for (var set of sc.NG_OPTIONS_CONFIG) {
				// Create labels for each NG option set
				var setName = set[0], type = set[1], options = set[2];
				var setHeader = new sc.ArenaInfoLine(ig.lang.get(`sc.ng-cheats.name.${setName}`));
	            setHeader.setPos(128, rowYPos);
	            setHeader.show(true);
	            this.contents.addChildGui(setHeader);
	            rowYPos += (setHeader.hook.size.y + 2);

	            // Set up each NG option checkbox
	            for (var option of options) {
					const optionKey = option;
					var optionValue, label, control;
					console.log(optionKey);
					if (optionKey === "enable-ng") {
						optionValue = sc.newgame.active;
						label = new Label(ig.lang.get(`sc.ng-cheats.name.enable-ng`));
					} else {
						optionValue = sc.newgame.options[optionKey];
						label = new Label(ig.lang.get(`sc.gui.menu.new-game.options.names.${optionKey}`));
					}
					label.setPos(0, rowYPos);
					this.contents.addChildGui(label);
					this.labels.set(optionKey, label);
					control = new sc.CheckboxGui(optionValue, 30);
					optionKey !== "enable-ng" && (control.active = sc.newgame.active);
					control.data = {optionKey};
					control.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
					control.setPos(200, rowYPos);
					rowYPos += 25;
					this.contents.addChildGui(control);
					this.buttonGroup.addFocusGui(control, 0, row);
					this.cheats.set(optionKey, control);
					row++;
	            }
			}
			const cheatChildren = this.contents.hook.children;
			const lastCheatChild = cheatChildren[cheatChildren.length - 1];
			// Set the height of the contents to encompass all the children.
			this.contents.hook.size.y = lastCheatChild.pos.y + lastCheatChild.size.y;
			this.list.setContent(this.contents);
			this.list.box.doScrollTransition(0, 0, 0);
			this.addChildGui(this.list);
			this.doStateTransition("DEFAULT");
		},
		setCheatValue(optionKey, newValue) {
			console.log(optionKey, newValue);
			if (optionKey === "enable-ng") {
				sc.newgame.setActive(newValue);
			} else {
				sc.newgame.options[optionKey] != newValue && sc.newgame.toggle(optionKey);
			}
		},
		updateCheatControls(cheat) {
			const enabled = CHEAT_CONFIG_MAP.get(cheat).requires.every(getCheatValue);
			this.labels.get(cheat).setEnabled(enabled);
			this.cheats.get(cheat).setEnabled(enabled);
		},
		update() {
			this.parent();
			if (!ig.interact.isBlocked()) {
				// Handle scroll wheel.
				if (sc.control.menuScrollUp()) {
					this.list.scrollY(-mouseScrollAmount, 0, scrollSpeed);
				} else if (sc.control.menuScrollDown()) {
					this.list.scrollY(mouseScrollAmount, 0, scrollSpeed);
				}
				const control = this.buttonGroup.getCurrentElement();
				const repeaterValue = this.getRepeaterValue();
				// Handle keyboard up and down keys.
				if (repeaterValue === "up" || repeaterValue === "down") {
					const controlTopY = control.hook.pos.y;
					const controlBottomY = controlTopY + control.hook.size.y;
					const scrollTopY = this.list.getScrollY();
					const scrollBottomY = scrollTopY + this.list.hook.size.y;
					if (controlTopY < scrollTopY) {
						// If the selected control is beyond the top scroll up to it.
						this.list.setScrollY(controlTopY, 0, scrollSpeed);
					} else if (controlBottomY > scrollBottomY) {
						// If the selected control is beyond the bottom scroll down to it.
						this.list.setScrollY(controlBottomY - this.list.hook.size.y + 2 /* why? */, 0, scrollSpeed);
					}
				}
			}
		},
		getRepeaterValue: function () {
			if (sc.control.rightDown()) {
				this.repeater.setDown("right");
			} else if (sc.control.leftDown()) {
				this.repeater.setDown("left");
			} else if (sc.control.downDown()) {
				this.repeater.setDown("down");
			} else if (sc.control.upDown()) {
				this.repeater.setDown("up");
			}
			return this.repeater.getPressed();
		},
		addObservers() {
			sc.Model.addObserver(sc.menu, this);
		},
		removeObservers() {
			sc.Model.removeObserver(sc.menu, this);
		},
		showMenu() {
			this.addObservers();
			sc.menu.pushBackCallback(this.onBackButtonPress.bind(this)); // Register back button handling.
			sc.menu.moveLeaSprite(0, 0, sc.MENU_LEA_STATE.HIDDEN); // No idea what this is.
			sc.menu.buttonInteract.pushButtonGroup(this.buttonGroup); // Make our button group active.
			ig.interact.setBlockDelay(0.2); // Don't let the user interact while the menu is animating into place.
			this.list.doStateTransition("DEFAULT"); // Animation the list.
		},
		hideMenu() {
			this.removeObservers();
			sc.menu.moveLeaSprite(0, 0, sc.MENU_LEA_STATE.LARGE); // No idea what this is.
			this.exitMenu();
		},
		exitMenu() {
			sc.menu.buttonInteract.removeButtonGroup(this.buttonGroup); // Make our button group inactive.
			sc.menu.popBackCallback(); // Unregister the back button handling.
			this.list.doStateTransition("HIDDEN"); // Animation the list.
		},
		onBackButtonPress() {
			// Pop our menu to go back up to the menu that created ours.
			sc.menu.popMenu();
		},
		modelChanged() {},
	});

	// Add cheats as a new submenu item.
	sc.MENU_SUBMENU.NG_CHEATS = Object.keys(sc.MENU_SUBMENU).length;
	// Define the cheats name and what class it instantiates.
	sc.SUB_MENU_INFO[sc.MENU_SUBMENU.NG_CHEATS] = {
		Clazz: sc.NgCheatsMenu,
		name: "ng-cheats",
	};
	// END: Cheats Menu
	// START: Cheats GUI
	sc.MenuModel.inject({
		getMenuAsName(menuId) {
			if (menuId === sc.MENU_SUBMENU.NG_CHEATS) {
				return ig.lang.get("sc.ng-cheats.title");
			}
			return this.parent.apply(this, arguments);
		},
	});
	sc.PauseScreenGui.inject({
		ngCheatsButton: null,
		init() {
			this.parent();
			// Create our new Cheats menu button.
			this.ngCheatsButton = new sc.ButtonGui(ig.lang.get("sc.ng-cheats.title"), sc.BUTTON_DEFAULT_WIDTH);
			this.ngCheatsButton.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_BOTTOM);
			this.ngCheatsButton.onButtonPress = () => {
				// What menu should be entered when clicked.
				sc.menu.setDirectMode(true, sc.MENU_SUBMENU.NG_CHEATS);
				sc.model.enterMenu(true);
			};
			this.insertChildGui(this.ngCheatsButton);
		},
		updateButtons() {
			this.removeChildGui(this.ngCheatsButton);
			this.parent();
			this.addChildGui(this.ngCheatsButton);

			// Get the first button in the first column so we can position our button above it.
			const firstButtonHook = this.buttonGroup.elements[0][0].hook;
			// Position our new Cheats button above the current ones.
			this.ngCheatsButton.setPos(firstButtonHook.pos.x, firstButtonHook.pos.y + firstButtonHook.size.y + 16);
			// Set it to be first in keyboard order, bump the others down.
			this.buttonGroup.insertFocusGui(this.ngCheatsButton, 0, 0);
		},
	});
	// END: Cheats GUI
});
})();