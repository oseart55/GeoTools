package main

import (
	"log"
	"os"

	"github.com/wailsapp/wails/v2/pkg/menu"
	"github.com/wailsapp/wails/v2/pkg/menu/keys"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

func createMenu(app *App) *menu.Menu {
	AppMenu := menu.NewMenu()
	FileMenu := AppMenu.AddSubmenu("File")
	// FileMenu.AddText("&Open", keys.CmdOrCtrl("o"), openFile)
	FileMenu.AddSeparator()
	FileMenu.AddText("Quit", keys.CmdOrCtrl("q"), func(_ *menu.CallbackData) {
		result, err := runtime.MessageDialog(app.ctx, runtime.MessageDialogOptions{
			Type:          runtime.QuestionDialog,
			Title:         "Quit Client",
			Message:       "Do you want to Quit?",
			DefaultButton: "No",
		})
		if err != nil {
			log.Panic(err)
		}
		if result == "Yes" {
			runtime.Quit(app.ctx)
		}
	})
	FileMenu.AddText("Restart", keys.CmdOrCtrl("r"), func(_ *menu.CallbackData) {
		result, err := runtime.MessageDialog(app.ctx, runtime.MessageDialogOptions{
			Type:          runtime.QuestionDialog,
			Title:         "Restart Client",
			Message:       "Do you want to Restart?",
			DefaultButton: "No",
		})
		if err != nil {
			log.Panic(err)
		}
		if result == "Yes" {
			runtime.EventsEmit(app.ctx, "Reload")
		}

	})
	LayerMenu := AppMenu.AddSubmenu("Layers")
	LayerMenu.AddText("Load GeoJson", keys.CmdOrCtrl("g"), func(_ *menu.CallbackData) {
		file, err := runtime.OpenFileDialog(app.ctx, runtime.OpenDialogOptions{
			Filters: []runtime.FileFilter{
				{
					DisplayName: "GeoJson (*.geojson)",
					Pattern:     "*.geojson",
				},
			},
		})
		if err != nil {
			log.Panic(err)
		}
		if file == "" {
			return
		}
		data, err := os.ReadFile(file)
		if err != nil {
			log.Panic(err)
		}
		geoJSON := string(data)
		runtime.EventsEmit(app.ctx, "geojsonLoaded", geoJSON)
	})

	preferencesMenu := AppMenu.AddSubmenu("Preferences")
	preferencesMenu.AddCheckbox("Show Help Button", app.GetDisplayVisibility(), keys.CmdOrCtrl("h"), func(c *menu.CallbackData) {
		// Emit an event to the frontend to toggle help button visibility
		runtime.EventsEmit(app.ctx, "toggleHelpButton", c.MenuItem.Checked)
	})
	preferencesMenu.AddCheckbox("Show Settings Button", app.GetSettingsVisibility(), keys.CmdOrCtrl("s"), func(c *menu.CallbackData) {
		// Emit an event to the frontend to toggle help button visibility
		runtime.EventsEmit(app.ctx, "toggleSettingsButton", c.MenuItem.Checked)
	})
	return AppMenu
}
