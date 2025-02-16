package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"

	wailsRuntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

// GitHub Repo Info
const (
	owner         = "oseart55"
	repo          = "GeoTools"
	apiURLFormat  = "https://api.github.com/repos/%s/%s/releases/latest"
	updaterBinary = "Updater-windows-amd64.exe"
)

// Default version value if not set via -ldflags
var (
	version = "dev"
)

// GitHubRelease represents the GitHub API response
type GitHubRelease struct {
	TagName string `json:"tag_name"`
	Assets  []struct {
		BrowserDownloadURL string `json:"browser_download_url"`
		Name               string `json:"name"`
	} `json:"assets"`
}

// CompareVersions checks if `v1` < `v2`
func CompareVersions(v1, v2 string) bool {
	v1 = strings.TrimPrefix(v1, "v")
	v2 = strings.TrimPrefix(v2, "v")

	// Split versions into parts (e.g., 1.2.3 -> [1,2,3])
	v1Parts := strings.Split(v1, ".")
	v2Parts := strings.Split(v2, ".")

	// Compare each part numerically
	for i := 0; i < len(v1Parts) && i < len(v2Parts); i++ {
		if v1Parts[i] < v2Parts[i] {
			return true // v1 < v2
		} else if v1Parts[i] > v2Parts[i] {
			return false // v1 > v2 (no update needed)
		}
	}

	// If all compared parts are equal, check length (e.g., 1.2 < 1.2.1)
	return len(v1Parts) < len(v2Parts)
}

// FetchLatestVersion gets the latest release version from GitHub
func FetchLatestVersion() (string, string, error) {
	apiURL := fmt.Sprintf(apiURLFormat, owner, repo)

	resp, err := http.Get(apiURL)
	if err != nil {
		return "", "", err
	}
	defer resp.Body.Close()

	var release GitHubRelease
	body, _ := io.ReadAll(resp.Body)
	if err := json.Unmarshal(body, &release); err != nil {
		return "", "", err
	}

	// Find compatible binary
	var downloadURL string
	for _, asset := range release.Assets {
		if strings.Contains(asset.Name, runtime.GOOS) && strings.Contains(asset.Name, runtime.GOARCH) {
			downloadURL = asset.BrowserDownloadURL
			break
		}
	}

	if downloadURL == "" {
		return "", "", fmt.Errorf("no compatible binary found")
	}

	return release.TagName, downloadURL, nil
}

// FetchLatestReleaseBody retrieves the release body from GitHub
func FetchLatestReleaseBody() (string, error) {
	apiURL := fmt.Sprintf("https://api.github.com/repos/%s/%s/releases/latest", owner, repo)

	resp, err := http.Get(apiURL)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	// Read response body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	// Parse JSON response
	var release struct {
		Body string `json:"body"`
	}

	if err := json.Unmarshal(body, &release); err != nil {
		return "", err
	}

	return release.Body, nil
}

// DownloadAndLaunchUpdater downloads a new version only if it's newer
func (a *App) DownloadAndLaunchUpdater() error {
	if strings.Contains(strings.ToLower(version), "dev") {
		return fmt.Errorf("in development build skipping update check")
	}
	exePath, _ := os.Executable()
	updaterPath := filepath.Join(filepath.Dir(exePath), updaterBinary)

	// Ensure updater exists before proceeding
	if err := DownloadUpdater(updaterPath); err != nil {
		return fmt.Errorf("failed to get updater: %v", err)
	}
	latestVer, downloadURL, err := FetchLatestVersion()
	if err != nil {
		return err
	}

	// Compare versions
	if !CompareVersions(version, latestVer) {
		fmt.Println("No update needed. Already on the latest version:", version)
		return nil
	}
	if !a.GetSettingsAutoUpdate() {
		releaseNotes, fetchReleaseNotesError := FetchLatestReleaseBody()
		if fetchReleaseNotesError != nil {
			wailsRuntime.LogError(a.ctx, fetchReleaseNotesError.Error())
		}
		result, err := wailsRuntime.MessageDialog(a.ctx, wailsRuntime.MessageDialogOptions{
			Type:          wailsRuntime.QuestionDialog,
			Title:         "New Update Avaliable",
			Message:       "Update to the Version?\n\nRelease Notes:\n" + releaseNotes,
			DefaultButton: "No",
		})
		if err != nil {
			wailsRuntime.LogError(a.ctx, err.Error())
		}

		if result == "No" {
			return fmt.Errorf("user declined update")
		}
	}

	// Paths
	newExePath := exePath + ".new"

	// Download new binary
	out, err := os.Create(newExePath)
	if err != nil {
		return err
	}
	defer out.Close()

	resp, err := http.Get(downloadURL)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	_, err = io.Copy(out, resp.Body)
	if err != nil {
		return err
	}

	// Start updater
	cmd := exec.Command(updaterPath, exePath, newExePath)
	cmd.Start()

	// Exit main app
	fmt.Println("Launching updater...")
	os.Exit(0)
	return nil
}

// Check if file exists
func FileExists(path string) bool {
	_, err := os.Stat(path)
	return err == nil
}

// DownloadUpdater fetches the latest updater.exe from GitHub if missing
func DownloadUpdater(updaterPath string) error {
	// Check if the updater already exists
	if FileExists(updaterPath) {
		fmt.Println("Updater already exists:", updaterPath)
		return nil
	}

	fmt.Println("Updater not found. Downloading from GitHub...")

	// Fetch latest release info
	apiURL := fmt.Sprintf(apiURLFormat, owner, repo)
	resp, err := http.Get(apiURL)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	var release GitHubRelease
	body, _ := io.ReadAll(resp.Body)
	if err := json.Unmarshal(body, &release); err != nil {
		return err
	}

	// Find the updater binary in the release assets
	var downloadURL string
	for _, asset := range release.Assets {
		if strings.Contains(asset.Name, "updater") && strings.Contains(asset.Name, "windows") {
			downloadURL = asset.BrowserDownloadURL
			break
		}
	}

	if downloadURL == "" {
		return fmt.Errorf("no updater binary found in release")
	}

	// Download the updater
	out, err := os.Create(updaterPath)
	if err != nil {
		return err
	}
	defer out.Close()

	resp, err = http.Get(downloadURL)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	_, err = io.Copy(out, resp.Body)
	if err != nil {
		return err
	}

	fmt.Println("Updater downloaded successfully.")
	return nil
}
