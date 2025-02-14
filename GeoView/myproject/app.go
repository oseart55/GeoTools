package main

import (
	"context"
	"encoding/json"
	"log"
	"os"
	"path/filepath"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

const appName = "GeoView.exe"
const settingsFile = "settings.json"

// App struct
type App struct {
	ctx context.Context
}

type Settings struct {
	User struct {
		DisplayHelp     bool `json:"displayHelp"`
		DisplaySettings bool `json:"displaySettings"`
	} `json:"user"`
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx

	// Load settings at startup
	err := a.LoadSettings()
	if err != nil {
		runtime.LogError(a.ctx, err.Error())
	}

	runtime.EventsOn(ctx, "saveSettings", func(data ...interface{}) {
		runtime.LogDebugf(a.ctx, "Received event from frontend: %v", data)
		if len(data) > 0 {
			settingsJSON, ok := data[0].(string)
			if !ok {
				runtime.LogError(a.ctx, "Invalid settings format received")
				return
			}

			runtime.LogDebugf(a.ctx, "Received event from frontend: %v", settingsJSON)

			// Save the settings to file
			a.SaveSettings(settingsJSON)
		}
	})
}

// GetSettingsFilePath returns the full path to the settings.json file
func GetSettingsFilePath() (string, error) {
	configDir, err := os.UserConfigDir() // Gets %APPDATA% on Windows
	if err != nil {
		return "", err
	}
	appDir := filepath.Join(configDir, appName) // Application folder
	err = os.MkdirAll(appDir, os.ModePerm)      // Ensure directory exists
	if err != nil {
		return "", err
	}
	return filepath.Join(appDir, settingsFile), nil
}

// SaveSettings writes the received JSON data to the file
func (a *App) SaveSettings(jsonData string) {
	var settings Settings
	err := json.Unmarshal([]byte(jsonData), &settings)
	if err != nil {
		runtime.LogError(a.ctx, err.Error())
		return
	}

	// Get settings file path
	settingsFile, err := GetSettingsFilePath()
	if err != nil {
		runtime.LogError(a.ctx, err.Error())
		return
	}
	runtime.LogDebug(a.ctx, settingsFile)
	// Save settings to file
	file, err := os.Create(settingsFile)
	if err != nil {
		runtime.LogError(a.ctx, err.Error())
		return
	}
	defer file.Close()

	encoder := json.NewEncoder(file)
	encoder.SetIndent("", "  ") // Pretty print JSON
	err = encoder.Encode(settings)
	if err != nil {
		runtime.LogError(a.ctx, err.Error())
	} else {
		runtime.LogDebug(a.ctx, "Settings Saved")
	}
}

// LoadSettings loads settings from the file
func (a *App) LoadSettings() error {
	settingsFile, err := GetSettingsFilePath()
	if err != nil {
		return err
	}

	data, err := os.ReadFile(settingsFile)
	if err != nil {
		if os.IsNotExist(err) {
			// No settings file exists yet, return without error
			return nil
		}
		return err
	}

	var settings Settings
	err = json.Unmarshal(data, &settings)
	if err != nil {
		return err
	}
	runtime.LogDebugf(a.ctx, "Settings Saved: %v", settings)
	return nil
}

// GetSettings returns the saved settings as a JSON string
func (a *App) GetSettings() string {
	settingsFile, err := GetSettingsFilePath()
	if err != nil {
		runtime.LogError(a.ctx, err.Error())
		return "{}" // Return empty JSON on error
	}

	data, err := os.ReadFile(settingsFile)
	if err != nil {
		runtime.LogError(a.ctx, err.Error())
		return "{}" // Return empty JSON if file is missing
	}
	settingsJSON, err := json.Marshal(data)
	if err != nil {
		runtime.LogError(a.ctx, err.Error())
	}

	// Send the JSON string to the frontend
	runtime.EventsEmit(a.ctx, "settingsLoaded", string(settingsJSON))
	return string(data)
}

func (a *App) GetDisplayVisibility() bool {
	// Open the settings.json file
	settingsFile, err := GetSettingsFilePath()
	if err != nil {
		runtime.LogError(a.ctx, err.Error())
		return true
	}
	file, err := os.Open(settingsFile)
	if err != nil {
		runtime.LogError(a.ctx, err.Error())
		log.Println("Error opening settings file:", err)
		return true
	}
	defer file.Close()

	// Decode JSON file into Settings struct
	var settings Settings
	decoder := json.NewDecoder(file)
	if err := decoder.Decode(&settings); err != nil {
		runtime.LogError(a.ctx, err.Error())
		return true
	}

	// Return the DisplayHelp value
	return settings.User.DisplayHelp
}

func (a *App) GetSettingsVisibility() bool {
	// Open the settings.json file
	settingsFile, err := GetSettingsFilePath()
	if err != nil {
		runtime.LogError(a.ctx, err.Error())
		return true
	}
	file, err := os.Open(settingsFile)
	if err != nil {
		runtime.LogError(a.ctx, err.Error())
		return true
	}
	defer file.Close()

	// Decode JSON file into Settings struct
	var settings Settings
	decoder := json.NewDecoder(file)
	if err := decoder.Decode(&settings); err != nil {
		runtime.LogError(a.ctx, err.Error())
		return true
	}

	// Return the DisplayHelp value
	return settings.User.DisplaySettings
}
