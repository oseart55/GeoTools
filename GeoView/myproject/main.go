package main

import (
	"context"
	"embed"

	"github.com/wailsapp/wails/v2"

	"github.com/wailsapp/wails/v2/pkg/logger"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	// Create an instance of the app structure
	app := NewApp()
	// Create application with options
	err := wails.Run(&options.App{
		Title:  "myproject",
		Width:  1024,
		Height: 768,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		OnStartup: app.startup,
		OnDomReady: func(ctx context.Context) {
			// Ensure frontend is loaded before sending settings
			app.GetSettings()
		},
		Menu: createMenu(app),
		Bind: []interface{}{
			app,
		},
		LogLevel: logger.ERROR,
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
