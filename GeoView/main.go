package main

import (
	"context"
	"embed"
	"unsafe"

	"github.com/wailsapp/wails/v2"

	"github.com/wailsapp/wails/v2/pkg/logger"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"

	"github.com/lxn/win"
)

//go:embed all:frontend/dist
var assets embed.FS

const SPI_GETWORKAREA = 0x0030

func main() {
	logMessage("Application is starting...")
	width, height := getWorkAreaSize()
	// Create an instance of the app structure
	app := NewApp()
	defer app.Shutdown()
	// Create application with options
	err := wails.Run(&options.App{
		Title:  "GeoView",
		Width:  width,
		Height: height,
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
		LogLevel: logger.DEBUG,
		DragAndDrop: &options.DragAndDrop{
			EnableFileDrop:     true,
			DisableWebViewDrop: true,
			CSSDropProperty:    "--wails-drop-target",
			CSSDropValue:       "drop",
		},
		Debug: options.Debug{
			OpenInspectorOnStartup: true,
		},
	})

	if err != nil {
		println("Error:", err.Error())
		logMessage(err.Error())
	}
}

func getWorkAreaSize() (int, int) {
	var rect win.RECT
	win.SystemParametersInfo(SPI_GETWORKAREA, 0, unsafe.Pointer(&rect), 0)
	return int(rect.Right - rect.Left), int(rect.Bottom - rect.Top)
}
