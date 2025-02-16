package main

import (
	"fmt"
	"os"
	"os/exec"
	"time"
)

func main() {
	if len(os.Args) < 3 {
		fmt.Println("Usage: updater <old_exe> <new_exe>")
		return
	}

	oldExe := os.Args[1]
	newExe := os.Args[2]

	fmt.Println("Waiting for application to close...")
	time.Sleep(2 * time.Second) // Allow process to fully exit

	// Retry deleting the old file
	for i := 0; i < 5; i++ {
		err := os.Remove(oldExe)
		if err == nil {
			break
		}
		fmt.Println("Retrying file deletion...")
		time.Sleep(2 * time.Second)
	}

	// Rename new executable
	err := os.Rename(newExe, oldExe)
	if err != nil {
		fmt.Println("Failed to rename new executable:", err)
		return
	}

	// Restart updated app
	fmt.Println("Restarting application...")
	cmd := exec.Command(oldExe)
	cmd.Start()
}
