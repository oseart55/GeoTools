package main

import (
	"log"
	"os"
	"path/filepath"
	"sync"
	"time"
)

var (
	logFilePath string
	logMutex    sync.Mutex
	logFile     *os.File
)

func init() {
	setupLogging()
}

func setupLogging() {
	// Get the directory where the executable is running
	exePath, err := os.Executable()
	if err != nil {
		log.Fatalf("Failed to get executable path: %v", err)
	}
	exeDir := filepath.Dir(exePath)

	// Define the "logs" folder path
	logsDir := filepath.Join(exeDir, "logs")

	// Create "logs" directory if it doesn't exist
	if _, err := os.Stat(logsDir); os.IsNotExist(err) {
		err := os.Mkdir(logsDir, 0755)
		if err != nil {
			log.Fatalf("Failed to create logs directory: %v", err)
		}
	}

	// Generate a new log file name with a timestamp
	timestamp := time.Now().Format("20060102_150405")
	logFilePath = filepath.Join(logsDir, "GeoView_"+timestamp+".log")

	// Create a new log file
	logFile, err = os.OpenFile(logFilePath, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0644)
	if err != nil {
		log.Fatalf("Failed to open log file: %v", err)
	}

	// Redirect log output to the new file
	log.SetOutput(logFile)
	log.Println("Backend logging started...") // First log entry
}

// logMessage writes a log entry to the log file
func logMessage(message string) {
	logMutex.Lock()
	defer logMutex.Unlock()

	if logFile == nil {
		log.Println("Log file is not initialized")
		return
	}

	// Create a timestamped log entry
	timestamp := time.Now().Format("2006-01-02 15:04:05")
	logEntry := timestamp + " - " + message + "\n"

	// Write to the log file
	if _, err := logFile.WriteString(logEntry); err != nil {
		log.Printf("Failed to write to log file: %v", err)
	}
}

// CloseLogFile ensures the log file is closed when the app exits
func CloseLogFile() {
	logMutex.Lock()
	defer logMutex.Unlock()

	if logFile != nil {
		log.Println("Closing log file...")
		logFile.Close()
	}
}
