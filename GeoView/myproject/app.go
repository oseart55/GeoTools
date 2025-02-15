package main

import (
	"context"
	"encoding/json"
	"fmt"
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
		runtime.LogError(ctx, err.Error())
	}

	runtime.EventsOn(ctx, "saveSettings", func(data ...interface{}) {
		runtime.LogDebugf(ctx, "Received event from frontend: %v", data)
		if len(data) > 0 {
			settingsJSON, ok := data[0].(string)
			if !ok {
				runtime.LogError(ctx, "Invalid settings format received")
				return
			}

			runtime.LogDebugf(ctx, "Received event from frontend: %v", settingsJSON)

			// Save the settings to file
			a.SaveSettings(settingsJSON)
		}
	})
	runtime.EventsOn(ctx, "geojson-file-dropped", a.OnGeoJSONFileDropped)
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
			// No settings file exists yet, create it with default settings
			defaultSettings := Settings{
				User: struct {
					DisplayHelp     bool `json:"displayHelp"`
					DisplaySettings bool `json:"displaySettings"`
				}{
					DisplayHelp:     true,
					DisplaySettings: true,
				},
			}

			defaultData, err := json.MarshalIndent(defaultSettings, "", "  ")
			if err != nil {
				return err
			}

			err = os.WriteFile(settingsFile, defaultData, 0644)
			if err != nil {
				return err
			}

			log.Println("Default settings file created:", settingsFile)
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

func (a *App) OnFileDrop(files []string) {
	if len(files) == 0 {
		return
	}

	filePath := files[0] // Get the first dropped file
	fmt.Println("File dropped:", filePath)

	// Read the GeoJSON file
	data, err := os.ReadFile(filePath)
	if err != nil {
		fmt.Println("Error reading file:", err)
		return
	}

	// Validate if the file is a GeoJSON
	var geoJSON map[string]interface{}
	if err := json.Unmarshal(data, &geoJSON); err != nil {
		fmt.Println("Invalid GeoJSON file:", err)
		return
	}

	// Send GeoJSON data to the frontend
	runtime.EventsEmit(a.ctx, "geojson-fileDrop", string(data))
}

func (a *App) OnGeoJSONFileDropped(optionalData ...interface{}) {
	if len(optionalData) == 0 {
		fmt.Println("No data received")
		return
	}

	payload, ok := optionalData[0].(map[string]interface{})
	if !ok {
		fmt.Println("Invalid data format")
		return
	}

	fileName := payload["fileName"].(string)
	geojsonData := payload["data"].(string)

	fmt.Println("Received file:", fileName)

	// Emit the data and filename to frontend
	runtime.EventsEmit(a.ctx, "geojson-loaded", map[string]string{
		"fileName": fileName,
		"data":     geojsonData,
	})
}
